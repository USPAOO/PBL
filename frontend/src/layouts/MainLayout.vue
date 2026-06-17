<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  HomeOutlined, ShoppingCartOutlined, ShoppingOutlined,
  MessageOutlined, RobotOutlined, PlusCircleOutlined,
  UserOutlined, LogoutOutlined, UnorderedListOutlined, MenuOutlined
} from '@ant-design/icons-vue';
import { useUserStore } from '../stores/user';
import { useCartStore } from '../stores/cart';
import { io } from 'socket.io-client';
import { BASE_URL } from '../api';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const cartStore = useCartStore();
const socket = io(BASE_URL);
const drawerOpen = ref(false);

const selectedKeys = computed(() => {
  const path = route.path;
  if (path.startsWith('/cart')) return ['cart'];
  if (path.startsWith('/orders')) return ['orders'];
  if (path.startsWith('/messages') || path.startsWith('/chat')) return ['messages'];
  if (path.startsWith('/agent')) return ['agent'];
  if (path.startsWith('/publish')) return ['publish'];
  return ['home'];
});

const cartCount = computed(() => cartStore.items.length);

const hideBottomNav = computed(() =>
  route.path === '/checkout' || route.path.startsWith('/login')
);

const bottomNavItems = [
  { key: 'home', icon: HomeOutlined, label: '首页', path: '/' },
  { key: 'cart', icon: ShoppingCartOutlined, label: '购物车', path: '/cart' },
  { key: 'publish', icon: PlusCircleOutlined, label: '发布', path: '/publish', primary: true },
  { key: 'messages', icon: MessageOutlined, label: '消息', path: '/messages' },
  { key: 'orders', icon: UnorderedListOutlined, label: '订单', path: '/orders' },
];

onMounted(() => {
  if (userStore.user) {
    socket.emit('join', userStore.user.id);
    cartStore.fetchCart();
  }
});

watch(() => userStore.user, (u) => {
  if (u) {
    socket.emit('join', u.id);
    cartStore.fetchCart();
  }
});

const menuItems = [
  { key: 'home', icon: HomeOutlined, label: '首页', path: '/' },
  { key: 'cart', icon: ShoppingCartOutlined, label: '购物车', path: '/cart' },
  { key: 'orders', icon: UnorderedListOutlined, label: '我的订单', path: '/orders' },
  { key: 'agent', icon: RobotOutlined, label: '购物助手', path: '/agent' },
  { key: 'messages', icon: MessageOutlined, label: '消息', path: '/messages' },
];

function navigate(path: string) {
  drawerOpen.value = false;
  router.push(path);
}

function logout() {
  drawerOpen.value = false;
  userStore.logout();
  router.push('/login');
}
</script>

<template>
  <a-layout class="main-layout">
    <a-layout-header class="header">
      <div class="header-inner">
        <button type="button" class="brand" aria-label="返回首页" @click="router.push('/')">
          <ShoppingOutlined class="brand-icon" aria-hidden="true" />
          <span class="brand-text">校园二手</span>
        </button>

        <a-menu mode="horizontal" :selected-keys="selectedKeys" class="nav-menu desktop-nav">
          <a-menu-item v-for="item in menuItems" :key="item.key" @click="navigate(item.path)">
            <component :is="item.icon" />
            <span>{{ item.label }}</span>
            <a-badge v-if="item.key === 'cart' && cartCount" :count="cartCount" :offset="[8, -4]" />
          </a-menu-item>
        </a-menu>

        <div class="header-actions">
          <a-button type="primary" ghost class="publish-btn desktop-publish" @click="router.push('/publish')">
            <PlusCircleOutlined /> <span class="publish-label">发布</span>
          </a-button>
          <a-button class="mobile-menu-btn" aria-label="打开导航菜单" @click="drawerOpen = true">
            <MenuOutlined />
          </a-button>
          <a-dropdown>
            <a class="user-dropdown" aria-label="用户菜单">
              <UserOutlined aria-hidden="true" />
              <span class="username">{{ userStore.user?.username }}</span>
            </a>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="router.push('/agent')">购物助手</a-menu-item>
                <a-menu-item @click="router.push('/orders')">我的订单</a-menu-item>
                <a-menu-divider />
                <a-menu-item @click="logout"><LogoutOutlined /> 退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
    </a-layout-header>

    <a-drawer
      v-model:open="drawerOpen"
      placement="left"
      title="导航"
      :width="280"
      class="mobile-drawer"
    >
      <a-menu mode="inline" :selected-keys="selectedKeys">
        <a-menu-item v-for="item in menuItems" :key="item.key" @click="navigate(item.path)">
          <component :is="item.icon" />
          <span>{{ item.label }}</span>
          <a-badge v-if="item.key === 'cart' && cartCount" :count="cartCount" :offset="[8, 0]" />
        </a-menu-item>
        <a-menu-item key="publish" @click="navigate('/publish')">
          <PlusCircleOutlined />
          <span>发布商品</span>
        </a-menu-item>
      </a-menu>
    </a-drawer>

    <a-layout-content class="content">
      <router-view />
    </a-layout-content>

    <a-layout-footer class="footer desktop-footer">
      校园二手交易平台 · 让闲置流动起来
    </a-layout-footer>

    <nav v-if="!hideBottomNav" class="mobile-bottom-nav" aria-label="主导航">
      <button
        v-for="item in bottomNavItems"
        :key="item.key"
        type="button"
        class="bottom-nav-item"
        :class="{ active: selectedKeys.includes(item.key), primary: item.primary }"
        :aria-current="selectedKeys.includes(item.key) ? 'page' : undefined"
        @click="navigate(item.path)"
      >
        <span class="bottom-nav-icon">
          <component :is="item.icon" />
          <a-badge v-if="item.key === 'cart' && cartCount" :count="cartCount" :offset="[4, -4]" />
        </span>
        <span class="bottom-nav-label">{{ item.label }}</span>
      </button>
    </nav>
  </a-layout>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
  min-height: 100dvh;
}

.header {
  background: var(--surface);
  padding: 0;
  box-shadow: var(--shadow-header);
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
  line-height: 56px;
  padding-top: env(safe-area-inset-top, 0);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  height: 56px;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  cursor: pointer;
  flex-shrink: 0;
  border: none;
  background: transparent;
  padding: 0;
  font: inherit;
  min-height: 44px;
}

.brand:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.brand-icon {
  font-size: 22px;
  color: var(--primary);
}

.brand-text {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.nav-menu {
  flex: 1;
  border-bottom: none;
  line-height: 54px;
  min-width: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.user-dropdown {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-primary);
  cursor: pointer;
  max-width: 120px;
  min-height: 44px;
  padding: 0 4px;
}

.username {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-menu-btn {
  display: none;
  min-width: 44px;
  min-height: 44px;
}

.mobile-bottom-nav {
  display: none;
}

.content {
  min-height: calc(100vh - 56px - 70px);
  min-height: calc(100dvh - 56px - 70px);
}

.content :deep(.page-container) {
  padding-bottom: var(--space-lg);
}

.footer {
  text-align: center;
  color: var(--text-secondary);
  background: transparent;
  padding: var(--space-lg);
}

@media (max-width: 992px) {
  .desktop-nav {
    display: none;
  }

  .mobile-menu-btn {
    display: inline-flex;
  }

  .publish-label {
    display: none;
  }
}

@media (max-width: 767px) {
  .header-inner {
    padding: 0 var(--space-md);
    gap: var(--space-sm);
  }

  .desktop-publish {
    display: none;
  }

  .desktop-footer {
    display: none;
  }

  .content {
    min-height: calc(100dvh - 56px);
  }

  .content :deep(.page-container) {
    padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
  }

  .mobile-bottom-nav {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    background: var(--surface);
    border-top: 1px solid var(--border-subtle);
    padding-bottom: env(safe-area-inset-bottom, 0);
    box-shadow: 0 -2px 12px oklch(22% 0.02 172 / 0.06);
  }

  .bottom-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 56px;
    padding: 6px 4px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 11px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .bottom-nav-item.active {
    color: var(--primary);
  }

  .bottom-nav-item.primary .bottom-nav-icon {
    background: var(--primary);
    color: var(--surface);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: -8px;
    font-size: 18px;
  }

  .bottom-nav-item.primary.active .bottom-nav-icon {
    background: var(--primary-deep);
  }

  .bottom-nav-icon {
    position: relative;
    font-size: 20px;
    line-height: 1;
  }

  .bottom-nav-label {
    line-height: 1.2;
  }
}

@media (max-width: 480px) {
  .username {
    display: none;
  }

  .brand-text {
    font-size: 16px;
  }
}
</style>
