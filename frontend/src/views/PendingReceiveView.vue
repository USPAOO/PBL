<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { api, assetUrl } from '../api';
import { getApiErrorMessage } from '../utils/api-error';
import { useUserStore } from '../stores/user';
import FetchErrorAlert from '../components/FetchErrorAlert.vue';
import SafeImage from '../components/SafeImage.vue';

const router = useRouter();
const userStore = useUserStore();
const orders = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const receivingId = ref<number | null>(null);

async function loadOrders() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.getOrders({ user_id: userStore.user!.id, role: 'buyer', status: 2 });
    if (res.data.code === 200) orders.value = res.data.data;
    else error.value = res.data.msg || '加载订单失败';
  } catch (e) {
    error.value = getApiErrorMessage(e, '加载订单失败');
  } finally {
    loading.value = false;
  }
}

function confirmReceive(id: number) {
  Modal.confirm({
    title: '确认收货',
    content: '请确认您已收到商品且无误',
    onOk: async () => {
      if (receivingId.value) return;
      receivingId.value = id;
      try {
        const res = await api.receiveOrder(id);
        if (res.data.code === 200) {
          message.success(res.data.msg || '已确认收货');
          loadOrders();
        } else {
          message.error(res.data.msg);
        }
      } catch (e) {
        message.error(getApiErrorMessage(e, '操作失败'));
      } finally {
        receivingId.value = null;
      }
    },
  });
}

onMounted(loadOrders);
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">待收货</h2>
    <a-alert message="收到商品后请及时确认收货，保障交易完成" type="info" show-icon style="margin-bottom: 20px" />

    <FetchErrorAlert v-if="error" :message="error" @retry="loadOrders" />

    <a-spin :spinning="loading">
      <a-card v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <span class="text-truncate min-w-0">{{ order.order_no }}</span>
          <a-tag color="processing">待收货</a-tag>
        </div>
        <a-descriptions v-if="order.shipping_no" size="small" :column="1" style="margin-bottom: 12px">
          <a-descriptions-item label="物流单号">{{ order.shipping_no }}</a-descriptions-item>
          <a-descriptions-item v-if="order.shipping_note" label="备注">
            <span class="text-break">{{ order.shipping_note }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="发货时间">{{ order.ship_time }}</a-descriptions-item>
        </a-descriptions>
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
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
        <div class="order-footer">
          <span class="text-truncate min-w-0">卖家：{{ order.seller_name }}</span>
          <a-space wrap>
            <a-button
              type="primary"
              :loading="receivingId === order.id"
              :disabled="!!receivingId"
              @click="confirmReceive(order.id)"
            >
              确认收货
            </a-button>
            <a-button type="link" @click="router.push(`/orders/${order.id}`)">详情</a-button>
          </a-space>
        </div>
      </a-card>
      <a-empty v-if="!loading && !error && !orders.length" description="没有待收货订单" />
    </a-spin>
  </div>
</template>

<style scoped>
.order-card { margin-bottom: 16px; border-radius: 12px; }
.order-header { display: flex; justify-content: space-between; margin-bottom: 12px; gap: var(--space-sm); }
.thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; }
.order-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-sm); padding-top: 12px; border-top: 1px solid var(--border-subtle); }
</style>
