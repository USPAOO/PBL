import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'Home', component: () => import('../views/HomeView.vue') },
        { path: 'goods/:id', name: 'GoodsDetail', component: () => import('../views/GoodsDetailView.vue') },
        { path: 'publish', name: 'Publish', component: () => import('../views/PublishView.vue') },
        { path: 'cart', name: 'Cart', component: () => import('../views/CartView.vue') },
        { path: 'checkout', name: 'Checkout', component: () => import('../views/CheckoutView.vue') },
        { path: 'orders/pending-pay', name: 'PendingPay', component: () => import('../views/PendingPayView.vue') },
        { path: 'orders/pending-ship', name: 'PendingShip', component: () => import('../views/PendingShipView.vue') },
        { path: 'orders/pending-receive', name: 'PendingReceive', component: () => import('../views/PendingReceiveView.vue') },
        { path: 'orders/:id', name: 'OrderDetail', component: () => import('../views/OrderDetailView.vue') },
        { path: 'orders', name: 'Orders', component: () => import('../views/OrdersView.vue') },
        { path: 'messages', name: 'Messages', component: () => import('../views/MessagesView.vue') },
        { path: 'chat/:userId', name: 'Chat', component: () => import('../views/ChatView.vue') },
        { path: 'agent', name: 'ShoppingAgent', component: () => import('../views/ShoppingAgentView.vue') },
      ],
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore();
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if (to.meta.guest && userStore.isLoggedIn) {
    next({ name: 'Home' });
  } else {
    next();
  }
});

export default router;
