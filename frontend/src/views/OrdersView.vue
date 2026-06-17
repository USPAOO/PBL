<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api, assetUrl } from '../api';
import { getApiErrorMessage } from '../utils/api-error';
import { formatPrice } from '../utils/format';
import { useUserStore } from '../stores/user';
import FetchErrorAlert from '../components/FetchErrorAlert.vue';
import SafeImage from '../components/SafeImage.vue';

const router = useRouter();
const userStore = useUserStore();
const orders = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const activeTab = ref('all');

const tabs = [
  { key: 'all', label: '全部', status: '' },
  { key: 'pay', label: '待付款', status: 0 },
  { key: 'ship', label: '待发货', status: 1 },
  { key: 'receive', label: '待收货', status: 2 },
  { key: 'done', label: '已完成', status: 3 },
];

async function loadOrders(status?: number | string) {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.getOrders({
      user_id: userStore.user!.id,
      role: 'buyer',
      status: status ?? '',
    });
    if (res.data.code === 200) orders.value = res.data.data;
    else error.value = res.data.msg || '加载订单失败';
  } catch (e) {
    error.value = getApiErrorMessage(e, '加载订单失败');
  } finally {
    loading.value = false;
  }
}

function onTabChange(key: string) {
  activeTab.value = key;
  const tab = tabs.find(t => t.key === key);
  loadOrders(tab?.status);
}

onMounted(() => loadOrders());
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">我的订单</h2>

    <a-tabs v-model:activeKey="activeTab" class="orders-tabs" @change="onTabChange">
      <a-tab-pane v-for="tab in tabs" :key="tab.key" :tab="tab.label" />
    </a-tabs>

    <FetchErrorAlert v-if="error" :message="error" @retry="() => loadOrders(tabs.find(t => t.key === activeTab)?.status)" />

    <a-spin :spinning="loading">
      <a-card v-for="order in orders" :key="order.id" class="order-card" @click="router.push(`/orders/${order.id}`)">
        <div class="order-header">
          <span class="text-truncate min-w-0">订单号：{{ order.order_no }}</span>
          <a-tag :color="order.status === 0 ? 'orange' : order.status === 3 ? 'green' : 'blue'">
            {{ order.status_text }}
          </a-tag>
        </div>
        <a-list :data-source="order.items" size="small">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #avatar>
                  <SafeImage
                    v-if="item.goods_image"
                    :src="assetUrl(item.goods_image)"
                    :alt="item.goods_content"
                    img-class="order-thumb"
                    placeholder-class="order-thumb thumb-placeholder"
                  />
                  <div v-else class="order-thumb thumb-placeholder" aria-hidden="true">图</div>
                </template>
                <template #title><span class="text-break">{{ item.goods_content }}</span></template>
                <template #description>¥{{ formatPrice(item.goods_price) }} × {{ item.quantity }}</template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
        <div class="order-footer">
          <span class="text-truncate min-w-0">卖家：{{ order.seller_name }}</span>
          <span class="price-text">合计 ¥{{ formatPrice(order.total_amount) }}</span>
        </div>
      </a-card>

      <a-empty v-if="!loading && !error && !orders.length" description="暂无订单" class="empty-state" />
    </a-spin>
  </div>
</template>

<style scoped>
.order-card {
  margin-bottom: 16px;
  cursor: pointer;
  border-radius: 12px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: 12px;
  color: var(--text-secondary);
  font-size: 13px;
}

.order-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-sm);
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}

.orders-tabs :deep(.ant-tabs-nav) {
  margin-bottom: var(--space-md);
}

@media (max-width: 575px) {
  .order-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .orders-tabs :deep(.ant-tabs-nav-wrap) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .orders-tabs :deep(.ant-tabs-nav-list) {
    flex-wrap: nowrap;
  }
}
</style>
