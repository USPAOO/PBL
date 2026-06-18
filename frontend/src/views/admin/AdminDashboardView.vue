<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  UserOutlined, ShoppingOutlined, FileTextOutlined, NotificationOutlined,
} from '@ant-design/icons-vue';
import { api } from '../../api';
import { getApiErrorMessage } from '../../utils/api-error';
import { useUserStore } from '../../stores/user';
import FetchErrorAlert from '../../components/FetchErrorAlert.vue';

const userStore = useUserStore();
const stats = ref({ users: 0, goods: 0, on_sale: 0, orders: 0, notifications: 0 });
const loading = ref(false);
const error = ref<string | null>(null);

const cards = [
  { key: 'users', label: '注册用户', icon: UserOutlined, color: 'var(--primary)' },
  { key: 'on_sale', label: '在售商品', icon: ShoppingOutlined, color: 'var(--success)' },
  { key: 'orders', label: '订单总数', icon: FileTextOutlined, color: 'var(--warning)' },
  { key: 'notifications', label: '有效通知', icon: NotificationOutlined, color: 'var(--primary-deep)' },
];

async function loadStats() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.adminStats(userStore.user!.id);
    if (res.data.code === 200) stats.value = res.data.data;
    else error.value = res.data.msg || '加载失败';
  } catch (e) {
    error.value = getApiErrorMessage(e, '加载失败');
  } finally {
    loading.value = false;
  }
}

onMounted(loadStats);
</script>

<template>
  <div>
    <FetchErrorAlert v-if="error" :message="error" @retry="loadStats" />

    <a-spin :spinning="loading">
      <a-row :gutter="[16, 16]">
        <a-col v-for="card in cards" :key="card.key" :xs="12" :sm="12" :md="6">
          <div class="stat-card">
            <div class="stat-icon" :style="{ color: card.color, background: 'var(--primary-light)' }">
              <component :is="card.icon" />
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ stats[card.key as keyof typeof stats] ?? 0 }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </div>
        </a-col>
      </a-row>

      <a-card title="快捷操作" class="quick-card">
        <a-space wrap>
          <a-button type="primary" @click="$router.push('/admin/goods')">管理商品</a-button>
          <a-button @click="$router.push('/admin/users')">管理用户</a-button>
          <a-button @click="$router.push('/admin/notifications')">发布通知</a-button>
          <a-button @click="$router.push('/')">返回首页</a-button>
        </a-space>
      </a-card>
    </a-spin>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.quick-card {
  margin-top: var(--space-lg);
  border-radius: var(--radius-lg);
}
</style>
