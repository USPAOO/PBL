const express= require('express');
const mysql= require('mysql2/promise');
const cors= require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host:'localhost',
    user:'root',
    password:'021400HJR',
    database:'2_shou',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// WebSocket连接
io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);

    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`用户${userId}加入房间`);
    });

    socket.on('disconnect', () => {
        console.log('用户断开:', socket.id);
    });
});

// 用户注册
app.post('/api/register',async(req,res)=>{
    try{
        const {username, password} = req.body;
        await pool.query('INSERT INTO users (username, password, avatar) VALUES (?, ?, ?)', [username, password, '']);
        res.json({ code: 200, msg: '注册成功' });
    }catch(err){
        res.json({ code: 500, msg: '注册失败: ' + err.message });
    }
});

// 用户登录
app.post('/api/login',async(req,res)=>{
    try{
        const {username, password} = req.body;
        const [rows] = await pool.query('SELECT * FROM users WHERE username=? AND password=?', [username, password]);
        if(rows.length > 0){
            res.json({ code: 200, msg: '登录成功', data: rows[0] });
        }else{
            res.json({ code: 400, msg: '用户名或密码错误' });
        }
    }catch(err){
        res.json({ code: 500, msg: '登录失败: ' + err.message });
    }
});

// 获取商品列表（包含发布者信息）
app.get('/api/goods',async(req,res)=>{
    try{
         const [rows] = await pool.query(`
            SELECT g.*, u.username, u.avatar
            FROM goods g
            LEFT JOIN users u ON g.user_id = u.id
            ORDER BY g.id DESC
         `);
         res.json({ code: 200, msg: 'success', data: rows });
    }catch(err){
         res.json({ code: 500, msg: '查询失败: ' + err.message });
    }
});

// 发布商品
app.post('/api/goods',async(req,res)=>{
    try{
        const {content, price, user_id, images} = req.body;
        await pool.query('INSERT INTO goods (user_id, content, price, images, status) VALUES (?, ?, ?, ?, 1)',
            [user_id, content, price, JSON.stringify(images || [])]);
        res.json({ code: 200, msg: '发布成功' });
    }catch(err){
        res.json({ code: 500, msg: '发布失败: ' + err.message });
    }
});

// 更新商品状态
app.put('/api/goods/:id/status',async(req,res)=>{
    try{
        const {status} = req.body;
        await pool.query('UPDATE goods SET status=? WHERE id=?', [status, req.params.id]);
        res.json({ code: 200, msg: '更新成功' });
    }catch(err){
        res.json({ code: 500, msg: '更新失败: ' + err.message });
    }
});

// 获取与某用户的聊天记录
app.get('/api/messages/:user_id',async(req,res)=>{
    try{
        const {my_id} = req.query;
        const [rows] = await pool.query(`
            SELECT m.*, u.username as sender_name, u.avatar as sender_avatar
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?)
            ORDER BY m.create_time ASC
        `, [my_id, req.params.user_id, req.params.user_id, my_id]);
        res.json({ code: 200, msg: 'success', data: rows });
    }catch(err){
        res.json({ code: 500, msg: '查询失败: ' + err.message });
    }
});

// 发送消息
app.post('/api/messages',async(req,res)=>{
    try{
        const {sender_id, receiver_id, content} = req.body;
        await pool.query('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
            [sender_id, receiver_id, content]);

        // 通过WebSocket通知接收者
        io.to(`user_${receiver_id}`).emit('new_message', {
            sender_id,
            receiver_id,
            content
        });

        res.json({ code: 200, msg: '发送成功' });
    }catch(err){
        res.json({ code: 500, msg: '发送失败: ' + err.message });
    }
});

// 获取聊天列表（最近联系人）
app.get('/api/chat-list/:user_id',async(req,res)=>{
    try{
        const [rows] = await pool.query(`
            SELECT DISTINCT
                CASE
                    WHEN m.sender_id = ? THEN m.receiver_id
                    ELSE m.sender_id
                END as user_id,
                u.username, u.avatar,
                (SELECT content FROM messages
                 WHERE (sender_id=? AND receiver_id=user_id) OR (sender_id=user_id AND receiver_id=?)
                 ORDER BY create_time DESC LIMIT 1) as last_message
            FROM messages m
            LEFT JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
            WHERE m.sender_id = ? OR m.receiver_id = ?
        `, [req.params.user_id, req.params.user_id, req.params.user_id, req.params.user_id, req.params.user_id, req.params.user_id]);
        res.json({ code: 200, msg: 'success', data: rows });
    }catch(err){
        res.json({ code: 500, msg: '查询失败: ' + err.message });
    }
});

server.listen(3000,()=>{
    console.log('服务器运行在 http://localhost:3000');
})