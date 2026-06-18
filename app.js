const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:4173'],
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadsDir),
    filename: (_, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '021400HJR',
    database: '2_shou',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const ORDER_STATUS = {
    PENDING_PAY: 0,
    PENDING_SHIP: 1,
    PENDING_RECEIVE: 2,
    COMPLETED: 3,
    CANCELLED: 4
};

const ORDER_STATUS_TEXT = {
    0: '待付款',
    1: '待发货',
    2: '待收货',
    3: '已完成',
    4: '已取消'
};

const GOODS_STATUS_TEXT = {
    1: '在售',
    2: '已售',
    3: '已下架'
};

const USER_ROLE = { USER: 0, ADMIN: 1 };

function parseImages(images) {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    try {
        return JSON.parse(images);
    } catch {
        return [];
    }
}

function formatGoods(row) {
    return { ...row, images: parseImages(row.images) };
}

function genOrderNo() {
    return `ORD${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

async function ensureTables() {
    const sql = fs.readFileSync(path.join(__dirname, 'migrate.sql'), 'utf8');
    const statements = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--') && !s.startsWith('USE'));
    for (const stmt of statements) {
        if (stmt) await pool.query(stmt);
    }
    const alters = [
        "ALTER TABLE users ADD COLUMN role tinyint NOT NULL DEFAULT 0 COMMENT '0用户 1管理员'",
        "ALTER TABLE users ADD COLUMN status tinyint NOT NULL DEFAULT 1 COMMENT '1正常 0禁用'",
        "ALTER TABLE users ADD COLUMN create_time datetime DEFAULT CURRENT_TIMESTAMP"
    ];
    for (const stmt of alters) {
        try { await pool.query(stmt); } catch (_) { /* column exists */ }
    }
    await pool.query("UPDATE users SET role=1 WHERE username='admin'");
    const [admins] = await pool.query("SELECT id FROM users WHERE role=1 LIMIT 1");
    if (!admins.length) {
        await pool.query(
            "INSERT INTO users (username, password, avatar, role, status) VALUES ('admin', 'admin123', '', 1, 1)"
        ).catch(() => {});
    }
}

ensureTables().catch(err => console.warn('数据库迁移提示:', err.message));

async function getUserById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id=?', [id]);
    return rows[0] || null;
}

async function requireAdmin(adminId, res) {
    const user = await getUserById(adminId);
    if (!user || user.role !== USER_ROLE.ADMIN) {
        res.json({ code: 403, msg: '无管理员权限' });
        return null;
    }
    return user;
}

io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
    });
});

// ========== 用户 ==========
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, confirm_password } = req.body;
        const name = (username || '').trim();
        if (!name || !password) return res.json({ code: 400, msg: '请填写用户名和密码' });
        if (name.length < 3 || name.length > 32) return res.json({ code: 400, msg: '用户名长度需为 3-32 个字符' });
        if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(name)) return res.json({ code: 400, msg: '用户名仅支持中文、字母、数字和下划线' });
        if (password.length < 6) return res.json({ code: 400, msg: '密码至少 6 位' });
        if (password.length > 64) return res.json({ code: 400, msg: '密码不能超过 64 位' });
        if (confirm_password !== undefined && password !== confirm_password) return res.json({ code: 400, msg: '两次密码不一致' });

        const [existing] = await pool.query('SELECT id FROM users WHERE username=?', [name]);
        if (existing.length) return res.json({ code: 400, msg: '用户名已被占用' });

        const [result] = await pool.query(
            'INSERT INTO users (username, password, avatar, role, status) VALUES (?, ?, ?, 0, 1)',
            [name, password, '']
        );
        const [rows] = await pool.query('SELECT id, username, avatar, role, status FROM users WHERE id=?', [result.insertId]);
        res.json({ code: 200, msg: '注册成功', data: rows[0] });
    } catch (err) {
        res.json({ code: 500, msg: '注册失败: ' + err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const name = (username || '').trim();
        const [rows] = await pool.query('SELECT id, username, avatar, role, status FROM users WHERE username=? AND password=?', [name, password]);
        if (!rows.length) return res.json({ code: 400, msg: '用户名或密码错误' });
        if (rows[0].status === 0) return res.json({ code: 403, msg: '账号已被禁用，请联系管理员' });
        res.json({ code: 200, msg: '登录成功', data: rows[0] });
    } catch (err) {
        res.json({ code: 500, msg: '登录失败: ' + err.message });
    }
});

// ========== 图片上传 ==========
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.json({ code: 400, msg: '未收到文件' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ code: 200, msg: '上传成功', data: { url } });
});

app.post('/api/upload/multiple', upload.array('files', 9), (req, res) => {
    if (!req.files?.length) return res.json({ code: 400, msg: '未收到文件' });
    const urls = req.files.map(f => `/uploads/${f.filename}`);
    res.json({ code: 200, msg: '上传成功', data: { urls } });
});

// ========== 商品 ==========
app.get('/api/goods', async (req, res) => {
    try {
        const { status, keyword } = req.query;
        let sql = `
            SELECT g.*, u.username, u.avatar
            FROM goods g
            LEFT JOIN users u ON g.user_id = u.id
            WHERE g.status != 3
        `;
        const params = [];
        if (status) { sql += ' AND g.status=?'; params.push(status); }
        if (keyword) { sql += ' AND g.content LIKE ?'; params.push(`%${keyword}%`); }
        sql += ' ORDER BY g.id DESC';
        const [rows] = await pool.query(sql, params);
        res.json({ code: 200, msg: 'success', data: rows.map(formatGoods) });
    } catch (err) {
        res.json({ code: 500, msg: '查询失败: ' + err.message });
    }
});

app.get('/api/goods/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT g.*, u.username, u.avatar
            FROM goods g LEFT JOIN users u ON g.user_id = u.id
            WHERE g.id=?
        `, [req.params.id]);
        if (!rows.length || rows[0].status === 3) return res.json({ code: 404, msg: '商品不存在或已下架' });
        res.json({ code: 200, msg: 'success', data: formatGoods(rows[0]) });
    } catch (err) {
        res.json({ code: 500, msg: '查询失败: ' + err.message });
    }
});

app.post('/api/goods', async (req, res) => {
    try {
        const { content, price, user_id, images } = req.body;
        await pool.query(
            'INSERT INTO goods (user_id, content, price, images, status) VALUES (?, ?, ?, ?, 1)',
            [user_id, content, price, JSON.stringify(images || [])]
        );
        res.json({ code: 200, msg: '发布成功' });
    } catch (err) {
        res.json({ code: 500, msg: '发布失败: ' + err.message });
    }
});

app.put('/api/goods/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query('UPDATE goods SET status=? WHERE id=?', [status, req.params.id]);
        res.json({ code: 200, msg: '更新成功' });
    } catch (err) {
        res.json({ code: 500, msg: '更新失败: ' + err.message });
    }
});

// ========== 购物车 ==========
app.get('/api/cart/:user_id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, g.content, g.price, g.images, g.status, g.user_id as seller_id, u.username as seller_name
            FROM cart_items c
            JOIN goods g ON c.goods_id = g.id
            LEFT JOIN users u ON g.user_id = u.id
            WHERE c.user_id = ?
            ORDER BY c.id DESC
        `, [req.params.user_id]);
        res.json({ code: 200, msg: 'success', data: rows.map(r => ({ ...r, images: parseImages(r.images) })) });
    } catch (err) {
        res.json({ code: 500, msg: '查询失败: ' + err.message });
    }
});

app.post('/api/cart', async (req, res) => {
    try {
        const { user_id, goods_id, quantity = 1 } = req.body;
        const [goods] = await pool.query('SELECT * FROM goods WHERE id=? AND status=1', [goods_id]);
        if (!goods.length) return res.json({ code: 400, msg: '商品不存在或已售出' });
        if (goods[0].user_id === user_id) return res.json({ code: 400, msg: '不能购买自己的商品' });

        const [existing] = await pool.query('SELECT * FROM cart_items WHERE user_id=? AND goods_id=?', [user_id, goods_id]);
        if (existing.length) {
            await pool.query('UPDATE cart_items SET quantity=quantity+? WHERE id=?', [quantity, existing[0].id]);
        } else {
            await pool.query('INSERT INTO cart_items (user_id, goods_id, quantity) VALUES (?, ?, ?)', [user_id, goods_id, quantity]);
        }
        res.json({ code: 200, msg: '已加入购物车' });
    } catch (err) {
        res.json({ code: 500, msg: '操作失败: ' + err.message });
    }
});

app.put('/api/cart/:id', async (req, res) => {
    try {
        const { quantity } = req.body;
        if (quantity <= 0) {
            await pool.query('DELETE FROM cart_items WHERE id=?', [req.params.id]);
        } else {
            await pool.query('UPDATE cart_items SET quantity=? WHERE id=?', [quantity, req.params.id]);
        }
        res.json({ code: 200, msg: '更新成功' });
    } catch (err) {
        res.json({ code: 500, msg: '更新失败: ' + err.message });
    }
});

app.delete('/api/cart/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cart_items WHERE id=?', [req.params.id]);
        res.json({ code: 200, msg: '删除成功' });
    } catch (err) {
        res.json({ code: 500, msg: '删除失败: ' + err.message });
    }
});

// ========== 订单 ==========
app.post('/api/orders', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { buyer_id, cart_ids, address_name, address_phone, address_detail } = req.body;
        if (!cart_ids?.length) return res.json({ code: 400, msg: '请选择商品' });

        await conn.beginTransaction();
        const [cartItems] = await conn.query(`
            SELECT c.*, g.content, g.price, g.images, g.status, g.user_id as seller_id
            FROM cart_items c JOIN goods g ON c.goods_id = g.id
            WHERE c.id IN (?) AND c.user_id=?
        `, [cart_ids, buyer_id]);

        if (!cartItems.length) {
            await conn.rollback();
            return res.json({ code: 400, msg: '购物车商品无效' });
        }

        const sellerGroups = {};
        for (const item of cartItems) {
            if (item.status !== 1) {
                await conn.rollback();
                return res.json({ code: 400, msg: `商品「${item.content}」已售出` });
            }
            if (!sellerGroups[item.seller_id]) sellerGroups[item.seller_id] = [];
            sellerGroups[item.seller_id].push(item);
        }

        const orderIds = [];
        for (const [sellerId, items] of Object.entries(sellerGroups)) {
            const total = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
            const orderNo = genOrderNo();
            const [orderResult] = await conn.query(`
                INSERT INTO orders (order_no, buyer_id, seller_id, total_amount, status, address_name, address_phone, address_detail)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [orderNo, buyer_id, sellerId, total, ORDER_STATUS.PENDING_PAY, address_name, address_phone, address_detail]);
            const orderId = orderResult.insertId;

            for (const item of items) {
                const imgs = parseImages(item.images);
                await conn.query(`
                    INSERT INTO order_items (order_id, goods_id, goods_content, goods_price, goods_image, quantity)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [orderId, item.goods_id, item.content, item.price, imgs[0] || '', item.quantity]);
            }
            orderIds.push(orderId);
        }

        await conn.query('DELETE FROM cart_items WHERE id IN (?)', [cart_ids]);
        await conn.commit();
        res.json({ code: 200, msg: '下单成功', data: { order_ids: orderIds } });
    } catch (err) {
        await conn.rollback();
        res.json({ code: 500, msg: '下单失败: ' + err.message });
    } finally {
        conn.release();
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const { user_id, role = 'buyer', status } = req.query;
        let sql = `
            SELECT o.*,
                buyer.username as buyer_name,
                seller.username as seller_name
            FROM orders o
            LEFT JOIN users buyer ON o.buyer_id = buyer.id
            LEFT JOIN users seller ON o.seller_id = seller.id
            WHERE ${role === 'seller' ? 'o.seller_id' : 'o.buyer_id'} = ?
        `;
        const params = [user_id];
        if (status !== undefined && status !== '') {
            sql += ' AND o.status = ?';
            params.push(status);
        }
        sql += ' ORDER BY o.id DESC';
        const [rows] = await pool.query(sql, params);

        for (const order of rows) {
            order.status_text = ORDER_STATUS_TEXT[order.status];
            const [items] = await pool.query('SELECT * FROM order_items WHERE order_id=?', [order.id]);
            order.items = items;
        }
        res.json({ code: 200, msg: 'success', data: rows });
    } catch (err) {
        res.json({ code: 500, msg: '查询失败: ' + err.message });
    }
});

app.get('/api/orders/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT o.*, buyer.username as buyer_name, seller.username as seller_name
            FROM orders o
            LEFT JOIN users buyer ON o.buyer_id = buyer.id
            LEFT JOIN users seller ON o.seller_id = seller.id
            WHERE o.id=?
        `, [req.params.id]);
        if (!rows.length) return res.json({ code: 404, msg: '订单不存在' });
        const order = rows[0];
        order.status_text = ORDER_STATUS_TEXT[order.status];
        const [items] = await pool.query('SELECT * FROM order_items WHERE order_id=?', [order.id]);
        order.items = items;
        res.json({ code: 200, msg: 'success', data: order });
    } catch (err) {
        res.json({ code: 500, msg: '查询失败: ' + err.message });
    }
});

app.post('/api/orders/:id/pay', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [orders] = await conn.query('SELECT * FROM orders WHERE id=? FOR UPDATE', [req.params.id]);
        if (!orders.length) { await conn.rollback(); return res.json({ code: 404, msg: '订单不存在' }); }
        const order = orders[0];
        if (order.status !== ORDER_STATUS.PENDING_PAY) {
            await conn.rollback();
            return res.json({ code: 400, msg: '订单状态不允许付款' });
        }

        await conn.query('UPDATE orders SET status=?, pay_time=NOW() WHERE id=?', [ORDER_STATUS.PENDING_SHIP, req.params.id]);

        const [items] = await conn.query('SELECT goods_id FROM order_items WHERE order_id=?', [req.params.id]);
        for (const item of items) {
            await conn.query('UPDATE goods SET status=2 WHERE id=?', [item.goods_id]);
        }
        await conn.commit();
        res.json({ code: 200, msg: '支付成功' });
    } catch (err) {
        await conn.rollback();
        res.json({ code: 500, msg: '支付失败: ' + err.message });
    } finally {
        conn.release();
    }
});

app.post('/api/orders/:id/ship', async (req, res) => {
    try {
        const { shipping_no, shipping_note } = req.body;
        const [orders] = await pool.query('SELECT * FROM orders WHERE id=?', [req.params.id]);
        if (!orders.length) return res.json({ code: 404, msg: '订单不存在' });
        if (orders[0].status !== ORDER_STATUS.PENDING_SHIP) return res.json({ code: 400, msg: '订单状态不允许发货' });

        await pool.query(
            'UPDATE orders SET status=?, shipping_no=?, shipping_note=?, ship_time=NOW() WHERE id=?',
            [ORDER_STATUS.PENDING_RECEIVE, shipping_no || '', shipping_note || '', req.params.id]
        );
        res.json({ code: 200, msg: '发货成功' });
    } catch (err) {
        res.json({ code: 500, msg: '发货失败: ' + err.message });
    }
});

app.post('/api/orders/:id/receive', async (req, res) => {
    try {
        const [orders] = await pool.query('SELECT * FROM orders WHERE id=?', [req.params.id]);
        if (!orders.length) return res.json({ code: 404, msg: '订单不存在' });
        if (orders[0].status !== ORDER_STATUS.PENDING_RECEIVE) return res.json({ code: 400, msg: '订单状态不允许确认收货' });

        await pool.query('UPDATE orders SET status=?, receive_time=NOW() WHERE id=?', [ORDER_STATUS.COMPLETED, req.params.id]);
        res.json({ code: 200, msg: '确认收货成功' });
    } catch (err) {
        res.json({ code: 500, msg: '操作失败: ' + err.message });
    }
});

app.post('/api/orders/:id/cancel', async (req, res) => {
    try {
        const [orders] = await pool.query('SELECT * FROM orders WHERE id=?', [req.params.id]);
        if (!orders.length) return res.json({ code: 404, msg: '订单不存在' });
        if (orders[0].status !== ORDER_STATUS.PENDING_PAY) return res.json({ code: 400, msg: '仅待付款订单可取消' });

        await pool.query('UPDATE orders SET status=? WHERE id=?', [ORDER_STATUS.CANCELLED, req.params.id]);
        res.json({ code: 200, msg: '订单已取消' });
    } catch (err) {
        res.json({ code: 500, msg: '取消失败: ' + err.message });
    }
});

// ========== 聊天 ==========
app.get('/api/messages/:user_id', async (req, res) => {
    try {
        const { my_id } = req.query;
        const [rows] = await pool.query(`
            SELECT m.*, u.username as sender_name, u.avatar as sender_avatar
            FROM messages m LEFT JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?)
            ORDER BY m.create_time ASC
        `, [my_id, req.params.user_id, req.params.user_id, my_id]);
        res.json({ code: 200, msg: 'success', data: rows });
    } catch (err) {
        res.json({ code: 500, msg: '查询失败: ' + err.message });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { sender_id, receiver_id, content } = req.body;
        await pool.query('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)', [sender_id, receiver_id, content]);
        io.to(`user_${receiver_id}`).emit('new_message', { sender_id, receiver_id, content });
        res.json({ code: 200, msg: '发送成功' });
    } catch (err) {
        res.json({ code: 500, msg: '发送失败: ' + err.message });
    }
});

app.get('/api/chat-list/:user_id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT
                CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as user_id,
                u.username, u.avatar,
                (SELECT content FROM messages
                 WHERE (sender_id=? AND receiver_id=user_id) OR (sender_id=user_id AND receiver_id=?)
                 ORDER BY create_time DESC LIMIT 1) as last_message
            FROM messages m
            LEFT JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
            WHERE m.sender_id = ? OR m.receiver_id = ?
        `, [req.params.user_id, req.params.user_id, req.params.user_id, req.params.user_id, req.params.user_id, req.params.user_id]);
        res.json({ code: 200, msg: 'success', data: rows });
    } catch (err) {
        res.json({ code: 500, msg: '查询失败: ' + err.message });
    }
});

// ========== 购物智能体 ==========
async function mockAgentReply(message, goodsList) {
    const lower = message.toLowerCase();
    const onSale = goodsList.filter(g => g.status === 1);

    if (/推荐|有什么|看看|买/.test(message)) {
        const picks = onSale.slice(0, 3);
        if (!picks.length) return '目前平台上还没有在售商品，你可以先去发布或稍后再来看看～';
        const list = picks.map(g => `• ${g.content} — ¥${g.price}（卖家：${g.username}）`).join('\n');
        return `为你推荐以下校园好物：\n${list}\n\n点击商品卡片即可查看详情并加入购物车。`;
    }
    if (/价格|便宜|贵/.test(message)) {
        const prices = onSale.map(g => Number(g.price)).filter(Boolean);
        if (!prices.length) return '暂无在售商品可供比价。';
        const avg = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
        const min = Math.min(...prices).toFixed(2);
        return `当前平台共有 ${onSale.length} 件在售商品，均价 ¥${avg}，最低 ¥${min}。建议多对比同类商品后再下单。`;
    }
    if (/流程|怎么买|如何/.test(message)) {
        return '购买流程：浏览商品 → 加入购物车 → 结算填写地址 → 付款 → 等待卖家发货 → 确认收货。有问题可以随时问我！';
    }
    return `我是校园二手购物助手 🛒\n\n你可以问我：\n• "推荐一些好物"\n• "有什么便宜的"\n• "怎么购买"\n\n当前平台有 ${onSale.length} 件在售商品。`;
}

app.post('/api/shopping-agent/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        if (!message?.trim()) return res.json({ code: 400, msg: '消息不能为空' });

        const [goodsRows] = await pool.query(`
            SELECT g.*, u.username FROM goods g LEFT JOIN users u ON g.user_id = u.id ORDER BY g.id DESC LIMIT 50
        `);
        const goodsList = goodsRows.map(formatGoods);

        const agentUrl = process.env.SHOPPING_AGENT_API_URL;
        const agentKey = process.env.SHOPPING_AGENT_API_KEY;

        if (agentUrl && agentKey && !agentUrl.includes('your-agent-api')) {
            try {
                const response = await fetch(agentUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${agentKey}`
                    },
                    body: JSON.stringify({
                        messages: [
                            { role: 'system', content: `你是校园二手平台购物助手。当前在售商品：${JSON.stringify(goodsList.filter(g => g.status === 1).slice(0, 20))}` },
                            ...history,
                            { role: 'user', content: message }
                        ]
                    })
                });
                const data = await response.json();
                const reply = data.choices?.[0]?.message?.content || data.reply || data.content;
                if (reply) return res.json({ code: 200, msg: 'success', data: { reply, source: 'external' } });
            } catch (e) {
                console.warn('外部智能体调用失败，使用内置回复:', e.message);
            }
        }

        const reply = await mockAgentReply(message, goodsList);
        res.json({ code: 200, msg: 'success', data: { reply, source: 'builtin', recommendations: goodsList.filter(g => g.status === 1).slice(0, 3) } });
    } catch (err) {
        res.json({ code: 500, msg: '智能体回复失败: ' + err.message });
    }
});

// ========== 平台通知（用户端） ==========
app.get('/api/notifications', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT n.*, u.username as creator_name
            FROM notifications n
            LEFT JOIN users u ON n.created_by = u.id
            WHERE n.is_active = 1
            ORDER BY n.id DESC
            LIMIT 20
        `);
        res.json({ code: 200, msg: 'success', data: rows });
    } catch (err) {
        res.json({ code: 500, msg: '查询失败: ' + err.message });
    }
});

// ========== 管理员 ==========
app.get('/api/admin/stats', async (req, res) => {
    try {
        if (!await requireAdmin(req.query.admin_id, res)) return;
        const [[users]] = await pool.query('SELECT COUNT(*) as c FROM users');
        const [[goods]] = await pool.query('SELECT COUNT(*) as c FROM goods WHERE status != 3');
        const [[onSale]] = await pool.query('SELECT COUNT(*) as c FROM goods WHERE status = 1');
        const [[orders]] = await pool.query('SELECT COUNT(*) as c FROM orders');
        const [[notifications]] = await pool.query('SELECT COUNT(*) as c FROM notifications WHERE is_active = 1');
        res.json({
            code: 200, msg: 'success',
            data: {
                users: users.c,
                goods: goods.c,
                on_sale: onSale.c,
                orders: orders.c,
                notifications: notifications.c
            }
        });
    } catch (err) {
        res.json({ code: 500, msg: '查询失败: ' + err.message });
    }
});

app.get('/api/admin/users', async (req, res) => {
    try {
        if (!await requireAdmin(req.query.admin_id, res)) return;
        const { keyword } = req.query;
        let sql = 'SELECT id, username, avatar, role, status, create_time FROM users WHERE 1=1';
        const params = [];
        if (keyword) { sql += ' AND username LIKE ?'; params.push(`%${keyword}%`); }
        sql += ' ORDER BY id DESC';
        const [rows] = await pool.query(sql, params);
        res.json({ code: 200, msg: 'success', data: rows });
    } catch (err) {
        res.json({ code: 500, msg: '查询失败: ' + err.message });
    }
});

app.put('/api/admin/users/:id/status', async (req, res) => {
    try {
        const { admin_id, status } = req.body;
        const admin = await requireAdmin(admin_id, res);
        if (!admin) return;
        const targetId = Number(req.params.id);
        if (targetId === admin.id) return res.json({ code: 400, msg: '不能禁用自己' });
        const [target] = await pool.query('SELECT role FROM users WHERE id=?', [targetId]);
        if (target.length && target[0].role === USER_ROLE.ADMIN) return res.json({ code: 400, msg: '不能禁用管理员账号' });
        await pool.query('UPDATE users SET status=? WHERE id=?', [status, targetId]);
        res.json({ code: 200, msg: status === 1 ? '已启用账号' : '已禁用账号' });
    } catch (err) {
        res.json({ code: 500, msg: '操作失败: ' + err.message });
    }
});

app.get('/api/admin/goods', async (req, res) => {
    try {
        if (!await requireAdmin(req.query.admin_id, res)) return;
        const { keyword, status } = req.query;
        let sql = `
            SELECT g.*, u.username
            FROM goods g LEFT JOIN users u ON g.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        if (status !== undefined && status !== '') { sql += ' AND g.status=?'; params.push(status); }
        if (keyword) { sql += ' AND (g.content LIKE ? OR u.username LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
        sql += ' ORDER BY g.id DESC';
        const [rows] = await pool.query(sql, params);
        const data = rows.map(r => ({ ...formatGoods(r), status_text: GOODS_STATUS_TEXT[r.status] || '未知' }));
        res.json({ code: 200, msg: 'success', data });
    } catch (err) {
        res.json({ code: 500, msg: '查询失败: ' + err.message });
    }
});

app.put('/api/admin/goods/:id', async (req, res) => {
    try {
        const { admin_id, status, content, price } = req.body;
        if (!await requireAdmin(admin_id, res)) return;
        const updates = [];
        const params = [];
        if (status !== undefined) { updates.push('status=?'); params.push(status); }
        if (content !== undefined) { updates.push('content=?'); params.push(content); }
        if (price !== undefined) { updates.push('price=?'); params.push(price); }
        if (!updates.length) return res.json({ code: 400, msg: '无更新内容' });
        params.push(req.params.id);
        await pool.query(`UPDATE goods SET ${updates.join(', ')} WHERE id=?`, params);
        res.json({ code: 200, msg: '更新成功' });
    } catch (err) {
        res.json({ code: 500, msg: '更新失败: ' + err.message });
    }
});

app.delete('/api/admin/goods/:id', async (req, res) => {
    try {
        if (!await requireAdmin(req.query.admin_id, res)) return;
        await pool.query('UPDATE goods SET status=3 WHERE id=?', [req.params.id]);
        res.json({ code: 200, msg: '商品已下架' });
    } catch (err) {
        res.json({ code: 500, msg: '操作失败: ' + err.message });
    }
});

app.get('/api/admin/notifications', async (req, res) => {
    try {
        if (!await requireAdmin(req.query.admin_id, res)) return;
        const [rows] = await pool.query(`
            SELECT n.*, u.username as creator_name
            FROM notifications n
            LEFT JOIN users u ON n.created_by = u.id
            ORDER BY n.id DESC
        `);
        res.json({ code: 200, msg: 'success', data: rows });
    } catch (err) {
        res.json({ code: 500, msg: '查询失败: ' + err.message });
    }
});

app.post('/api/admin/notifications', async (req, res) => {
    try {
        const { admin_id, title, content, type = 'info', is_active = 1 } = req.body;
        const admin = await requireAdmin(admin_id, res);
        if (!admin) return;
        if (!title?.trim() || !content?.trim()) return res.json({ code: 400, msg: '标题和内容不能为空' });
        await pool.query(
            'INSERT INTO notifications (title, content, type, is_active, created_by) VALUES (?, ?, ?, ?, ?)',
            [title.trim(), content.trim(), type, is_active ? 1 : 0, admin.id]
        );
        res.json({ code: 200, msg: '通知已发布' });
    } catch (err) {
        res.json({ code: 500, msg: '发布失败: ' + err.message });
    }
});

app.put('/api/admin/notifications/:id', async (req, res) => {
    try {
        const { admin_id, title, content, type, is_active } = req.body;
        if (!await requireAdmin(admin_id, res)) return;
        const updates = [];
        const params = [];
        if (title !== undefined) { updates.push('title=?'); params.push(title.trim()); }
        if (content !== undefined) { updates.push('content=?'); params.push(content.trim()); }
        if (type !== undefined) { updates.push('type=?'); params.push(type); }
        if (is_active !== undefined) { updates.push('is_active=?'); params.push(is_active ? 1 : 0); }
        if (!updates.length) return res.json({ code: 400, msg: '无更新内容' });
        params.push(req.params.id);
        await pool.query(`UPDATE notifications SET ${updates.join(', ')} WHERE id=?`, params);
        res.json({ code: 200, msg: '更新成功' });
    } catch (err) {
        res.json({ code: 500, msg: '更新失败: ' + err.message });
    }
});

app.delete('/api/admin/notifications/:id', async (req, res) => {
    try {
        if (!await requireAdmin(req.query.admin_id, res)) return;
        await pool.query('DELETE FROM notifications WHERE id=?', [req.params.id]);
        res.json({ code: 200, msg: '通知已删除' });
    } catch (err) {
        res.json({ code: 500, msg: '删除失败: ' + err.message });
    }
});

server.listen(3000, () => {
    console.log('服务器运行在 http://localhost:3000');
});
