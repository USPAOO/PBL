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
const role = ref<'buyer' | 'seller'>('seller');
const shipModal = ref(false);
const currentOrderId = ref(0);
const shipForm = ref({ shipping_no: '', shipping_note: '' });
const actionLoading = ref(false);

async function loadOrders() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.getOrders({
      user_id: userStore.user!.id,
      role: role.value,
      status: 1,
    });
    if (res.data.code === 200) orders.value = res.data.data;
    else error.value = res.data.msg || '加载订单失败';
  } catch (e) {
    error.value = getApiErrorMessage(e, '加载订单失败');
  } finally {
    loading.value = false;
  }
}

function openShip(id: number) {
  currentOrderId.value = id;
  shipForm.value = { shipping_no: '', shipping_note: '' };
  shipModal.value = true;
}

async function ship() {
  if (actionLoading.value) return;
  actionLoading.value = true;
  try {
    const res = await api.shipOrder(currentOrderId.value, shipForm.value);
    if (res.data.code === 200) {
      message.success(res.data.msg || '发货成功');
      shipModal.value = false;
      loadOrders();
    } else {
      message.error(res.data.msg);
    }
  } catch (e) {
    message.error(getApiErrorMessage(e, '发货失败'));
  } finally {
    actionLoading.value = false;
  }
}

onMounted(loadOrders);
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">待发货</h2>

    <a-radio-group v-model:value="role" button-style="solid" style="margin-bottom: 20px" @change="loadOrders">
      <a-radio-button value="seller">我卖出的</a-radio-button>
      <a-radio-button value="buyer">我购买的</a-radio-button>
    </a-radio-group>

    <FetchErrorAlert v-if="error" :message="error" @retry="loadOrders" />

    <a-spin :spinning="loading">
      <a-card v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <span class="text-truncate min-w-0">{{ order.order_no }}</span>
          <a-tag color="blue">待发货</a-tag>
        </div>
        <a-descriptions size="small" :column="1">
          <a-descriptions-item label="收货人">{{ order.address_name }} {{ order.address_phone }}</a-descriptions-item>
          <a-descriptions-item label="地址">
            <span class="text-break">{{ order.address_detail }}</span>
          </a-descriptions-item>
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
          <span class="price-text">¥{{ formatPrice(order.total_amount) }}</span>
          <a-space wrap>
            <a-button v-if="role === 'seller'" type="primary" @click="openShip(order.id)">发货</a-button>
            <a-button type="link" @click="router.push(`/orders/${order.id}`)">详情</a-button>
          </a-space>
        </div>
      </a-card>
      <a-empty v-if="!loading && !error && !orders.length" description="没有待发货订单" />
    </a-spin>

    <a-modal v-model:open="shipModal" title="发货" @ok="ship" :confirm-loading="actionLoading">
      <a-form layout="vertical">
        <a-form-item label="物流单号">
          <a-input v-model:value="shipForm.shipping_no" maxlength="64" placeholder="可选" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="shipForm.shipping_note" :maxlength="200" show-count placeholder="如：已放宿舍楼下" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.order-card { margin-bottom: 16px; border-radius: 12px; }
.order-header { display: flex; justify-content: space-between; margin-bottom: 12px; gap: var(--space-sm); }
.thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; }
.order-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-sm); padding-top: 12px; border-top: 1px solid var(--border-subtle); }
</style>
