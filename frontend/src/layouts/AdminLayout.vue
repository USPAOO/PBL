<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  DashboardOutlined, ShoppingOutlined, UserOutlined,
  NotificationOutlined, ArrowLeftOutlined, LogoutOutlined,
} from '@ant-design/icons-vue';
import { useUserStore } from '../stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const menuItems = [
  { key: 'dashboard', icon: DashboardOutlined, label: '概览', path: '/admin' },
  { key: 'goods', icon: ShoppingOutlined, label: '商品管理', path: '/admin/goods' },
  { key: 'users', icon: UserOutlined, label: '用户管理', path: '/admin/users' },
  { key: 'notifications', icon: NotificationOutlined, label: '平台通知', path: '/admin/notifications' },
];

const selectedKey = computed(() => {
  const path = route.path;
  if (path.startsWith('/admin/goods')) return 'goods';
  if (path.startsWith('/admin/users')) return 'users';
  if (path.startsWith('/admin/notifications')) return 'notifications';
  return 'dashboard';
});

function logout() {
  userStore.logout();
  router.push('/login');
}
</script>

<template>
  <a-layout class="admin-layout">
    <a-layout-sider
      breakpoint="lg"
      collapsed-width="0"
      class="admin-sider"
      :width="220"
    >
      <div class="admin-brand">
        <span class="brand-dot" aria-hidden="true" />
        管理后台
      </div>
      <a-menu
        mode="inline"
        :selected-keys="[selectedKey]"
        class="admin-menu"
      >
        <a-menu-item v-for="item in menuItems" :key="item.key" @click="router.push(item.path)">
          <component :is="item.icon" />
          <span>{{ item.label }}</span>
        </a-menu-item>
      </a-menu>
      <div class="sider-footer">
        <a-button type="link" block @click="router.push('/')">
          <ArrowLeftOutlined /> 返回前台
        </a-button>
      </div>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="admin-header">
        <h1 class="page-heading">{{ menuItems.find(m => m.key === selectedKey)?.label }}</h1>
        <div class="header-user">
          <span class="admin-name">{{ userStore.user?.username }}</span>
          <a-tag color="green">管理员</a-tag>
          <a-button type="text" @click="logout"><LogoutOutlined /> 退出</a-button>
        </div>
      </a-layout-header>
      <a-layout-content class="admin-content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  min-height: 100dvh;
}

.admin-sider {
  background: var(--surface);
  border-right: 1px solid var(--border-subtle);
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
}

.admin-menu {
  border-inline-end: none;
}

.sider-footer {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  padding: 0 8px;
}

.admin-header {
  background: var(--surface);
  padding: 0 var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  height: 56px;
  line-height: 56px;
}

.page-heading {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.header-user {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.admin-name {
  color: var(--text-secondary);
  font-size: 14px;
}

.admin-content {
  padding: var(--space-lg);
  background: var(--neutral-bg);
  min-height: calc(100vh - 56px);
}

@media (max-width: 991px) {
  .admin-content {
    padding: var(--space-md);
  }
}
</style>
