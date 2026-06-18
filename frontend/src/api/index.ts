import axios from 'axios';

export const BASE_URL = 'http://localhost:3000';
export const API = `${BASE_URL}/api`;

const http = axios.create({ baseURL: API, timeout: 15000 });

http.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export function assetUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

export const api = {
  login: (data: { username: string; password: string }) => http.post('/login', data),
  register: (data: { username: string; password: string; confirm_password?: string }) => http.post('/register', data),

  getNotifications: () => http.get('/notifications'),

  getGoods: (params?: { status?: number; keyword?: string }) => http.get('/goods', { params }),
  getGoodsDetail: (id: number) => http.get(`/goods/${id}`),
  publishGoods: (data: object) => http.post('/goods', data),
  updateGoodsStatus: (id: number, status: number) => http.put(`/goods/${id}/status`, { status }),

  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return axios.post(`${API}/upload`, form);
  },
  uploadMultiple: (files: File[]) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return axios.post(`${API}/upload/multiple`, form);
  },

  getCart: (userId: number) => http.get(`/cart/${userId}`),
  addToCart: (data: { user_id: number; goods_id: number; quantity?: number }) => http.post('/cart', data),
  updateCart: (id: number, quantity: number) => http.put(`/cart/${id}`, { quantity }),
  removeCart: (id: number) => http.delete(`/cart/${id}`),

  createOrder: (data: object) => http.post('/orders', data),
  getOrders: (params: { user_id: number; role?: string; status?: number | string }) => http.get('/orders', { params }),
  getOrderDetail: (id: number) => http.get(`/orders/${id}`),
  payOrder: (id: number) => http.post(`/orders/${id}/pay`),
  shipOrder: (id: number, data: { shipping_no?: string; shipping_note?: string }) => http.post(`/orders/${id}/ship`, data),
  receiveOrder: (id: number) => http.post(`/orders/${id}/receive`),
  cancelOrder: (id: number) => http.post(`/orders/${id}/cancel`),

  getMessages: (userId: number, myId: number) => http.get(`/messages/${userId}`, { params: { my_id: myId } }),
  sendMessage: (data: object) => http.post('/messages', data),
  getChatList: (userId: number) => http.get(`/chat-list/${userId}`),

  agentChat: (data: { message: string; history?: { role: string; content: string }[] }) =>
    http.post('/shopping-agent/chat', data),

  adminStats: (adminId: number) => http.get('/admin/stats', { params: { admin_id: adminId } }),
  adminUsers: (adminId: number, params?: { keyword?: string }) =>
    http.get('/admin/users', { params: { admin_id: adminId, ...params } }),
  adminUpdateUserStatus: (id: number, data: { admin_id: number; status: number }) =>
    http.put(`/admin/users/${id}/status`, data),
  adminGoods: (adminId: number, params?: { keyword?: string; status?: string }) =>
    http.get('/admin/goods', { params: { admin_id: adminId, ...params } }),
  adminUpdateGoods: (id: number, data: object) => http.put(`/admin/goods/${id}`, data),
  adminDeleteGoods: (id: number, adminId: number) =>
    http.delete(`/admin/goods/${id}`, { params: { admin_id: adminId } }),
  adminNotifications: (adminId: number) =>
    http.get('/admin/notifications', { params: { admin_id: adminId } }),
  adminCreateNotification: (data: object) => http.post('/admin/notifications', data),
  adminUpdateNotification: (id: number, data: object) => http.put(`/admin/notifications/${id}`, data),
  adminDeleteNotification: (id: number, adminId: number) =>
    http.delete(`/admin/notifications/${id}`, { params: { admin_id: adminId } }),
};

export default http;
