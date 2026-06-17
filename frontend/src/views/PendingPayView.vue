<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
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
const payingId = ref<number | null>(null);

async function loadOrders() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.getOrders({ user_id: userStore.user!.id, role: 'buyer', status: 0 });
    if (res.data.code === 200) orders.value = res.data.data;
    else error.value = res.data.msg || '加载订单失败';
  } catch (e) {
    error.value = getApiErrorMessage(e, '加载订单失败');
  } finally {
    loading.value = false;
  }
}

async function pay(id: number) {
  if (payingId.value) return;
  payingId.value = id;
  try {
    const res = await api.payOrder(id);
    if (res.data.code === 200) {
      message.success(res.data.msg || '付款成功');
      loadOrders();
    } else {
      message.error(res.data.msg);
    }
  } catch (e) {
    message.error(getApiErrorMessage(e, '付款失败'));
  } finally {
    payingId.value = null;
  }
}

async function cancel(id: number) {
  try {
    const res = await api.cancelOrder(id);
    if (res.data.code === 200) {
      message.success(res.data.msg || '订单已取消');
      loadOrders();
    } else {
      message.error(res.data.msg);
    }
  } catch (e) {
    message.error(getApiErrorMessage(e, '取消失败'));
  }
}

onMounted(loadOrders);
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">待付款</h2>
    <a-alert message="请在24小时内完成付款，超时订单将自动取消" type="warning" show-icon style="margin-bottom: 20px" />

    <FetchErrorAlert v-if="error" :message="error" @retry="loadOrders" />

    <a-spin :spinning="loading">
      <a-card v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <span class="text-truncate min-w-0">{{ order.order_no }}</span>
          <a-tag color="orange">待付款</a-tag>
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
                    img-class="thumb"
                    placeholder-class="thumb thumb-placeholder"
                  />
                  <div v-else class="thumb thumb-placeholder" aria-hidden="true">图</div>
                </template>
                <template #title><span class="text-break">{{ item.goods_content }}</span></template>
                <template #description>¥{{ formatPrice(item.goods_price) }}</template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
        <div class="order-footer-bar">
          <span class="price-text">¥{{ formatPrice(order.total_amount) }}</span>
          <a-space wrap>
            <a-button @click="cancel(order.id)">取消</a-button>
            <a-button type="primary" :loading="payingId === order.id" :disabled="!!payingId" @click="pay(order.id)">
              立即付款
            </a-button>
            <a-button type="link" @click="router.push(`/orders/${order.id}`)">详情</a-button>
          </a-space>
        </div>
      </a-card>
      <a-empty v-if="!loading && !error && !orders.length" description="没有待付款订单" />
    </a-spin>
  </div>
</template>

<style scoped>
.order-card { margin-bottom: 16px; border-radius: 12px; }
.order-header { display: flex; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: var(--space-xs); }
.thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; }
</style>
