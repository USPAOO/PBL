<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { api, assetUrl } from '../api';
import { getApiErrorMessage } from '../utils/api-error';
import { formatPrice, parseRouteId } from '../utils/format';
import { useUserStore } from '../stores/user';
import FetchErrorAlert from '../components/FetchErrorAlert.vue';
import SafeImage from '../components/SafeImage.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const order = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const actionLoading = ref(false);
const shipForm = ref({ shipping_no: '', shipping_note: '' });
const showShipModal = ref(false);

const orderId = computed(() => parseRouteId(route.params.id));

async function loadOrder() {
  if (!orderId.value) {
    error.value = '订单不存在';
    order.value = null;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const res = await api.getOrderDetail(orderId.value);
    if (res.data.code === 200) order.value = res.data.data;
    else {
      order.value = null;
      error.value = res.data.msg || '订单不存在';
    }
  } catch (e) {
    order.value = null;
    error.value = getApiErrorMessage(e, '加载订单失败');
  } finally {
    loading.value = false;
  }
}

async function pay() {
  if (actionLoading.value) return;
  actionLoading.value = true;
  try {
    const res = await api.payOrder(order.value.id);
    if (res.data.code === 200) {
      message.success(res.data.msg || '付款成功');
      loadOrder();
    } else {
      message.error(res.data.msg);
    }
  } catch (e) {
    message.error(getApiErrorMessage(e, '付款失败'));
  } finally {
    actionLoading.value = false;
  }
}

async function cancel() {
  Modal.confirm({
    title: '确认取消订单？',
    onOk: async () => {
      try {
        const res = await api.cancelOrder(order.value.id);
        if (res.data.code === 200) {
          message.success(res.data.msg || '订单已取消');
          loadOrder();
        } else {
          message.error(res.data.msg);
        }
      } catch (e) {
        message.error(getApiErrorMessage(e, '取消失败'));
      }
    },
  });
}

async function ship() {
  if (actionLoading.value) return;
  actionLoading.value = true;
  try {
    const res = await api.shipOrder(order.value.id, shipForm.value);
    if (res.data.code === 200) {
      message.success(res.data.msg || '发货成功');
      showShipModal.value = false;
      loadOrder();
    } else {
      message.error(res.data.msg);
    }
  } catch (e) {
    message.error(getApiErrorMessage(e, '发货失败'));
  } finally {
    actionLoading.value = false;
  }
}

async function receive() {
  Modal.confirm({
    title: '确认已收到商品？',
    onOk: async () => {
      try {
        const res = await api.receiveOrder(order.value.id);
        if (res.data.code === 200) {
          message.success(res.data.msg || '已确认收货');
          loadOrder();
        } else {
          message.error(res.data.msg);
        }
      } catch (e) {
        message.error(getApiErrorMessage(e, '操作失败'));
      }
    },
  });
}

const isBuyer = () => order.value?.buyer_id === userStore.user?.id;
const isSeller = () => order.value?.seller_id === userStore.user?.id;

onMounted(loadOrder);
</script>

<template>
  <div class="page-container">
    <a-spin :spinning="loading">
      <a-page-header title="订单详情" @back="router.back()" />

      <FetchErrorAlert v-if="error && !loading" :message="error" @retry="loadOrder" />

      <template v-if="order">
        <a-card style="margin-bottom: 20px">
          <a-descriptions title="订单信息" bordered :column="{ xs: 1, sm: 2 }">
            <a-descriptions-item label="订单号">
              <span class="text-break">{{ order.order_no }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag>{{ order.status_text }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="买家">{{ order.buyer_name }}</a-descriptions-item>
            <a-descriptions-item label="卖家">{{ order.seller_name }}</a-descriptions-item>
            <a-descriptions-item label="收货人">{{ order.address_name }}</a-descriptions-item>
            <a-descriptions-item label="联系电话">{{ order.address_phone }}</a-descriptions-item>
            <a-descriptions-item label="收货地址" :span="2">
              <span class="text-break">{{ order.address_detail }}</span>
            </a-descriptions-item>
            <a-descriptions-item v-if="order.shipping_no" label="物流单号">{{ order.shipping_no }}</a-descriptions-item>
            <a-descriptions-item v-if="order.shipping_note" label="发货备注">
              <span class="text-break">{{ order.shipping_note }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="下单时间">{{ order.create_time }}</a-descriptions-item>
            <a-descriptions-item label="应付金额">
              <span class="price-text">¥{{ formatPrice(order.total_amount) }}</span>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card title="商品明细" style="margin-bottom: 20px">
          <a-list :data-source="order.items">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #avatar>
                    <SafeImage
                      v-if="item.goods_image"
                      :src="assetUrl(item.goods_image)"
                      :alt="item.goods_content"
                      img-class="item-thumb"
                      placeholder-class="item-thumb thumb-placeholder"
                    />
                    <div v-else class="item-thumb thumb-placeholder" aria-hidden="true">图</div>
                  </template>
                  <template #title><span class="text-break">{{ item.goods_content }}</span></template>
                  <template #description>¥{{ formatPrice(item.goods_price) }} × {{ item.quantity }}</template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-card>

        <a-space wrap>
          <a-button v-if="isBuyer() && order.status === 0" type="primary" :loading="actionLoading" :disabled="actionLoading" @click="pay">
            立即付款
          </a-button>
          <a-button v-if="isBuyer() && order.status === 0" @click="cancel">取消订单</a-button>
          <a-button v-if="isSeller() && order.status === 1" type="primary" @click="showShipModal = true">
            发货
          </a-button>
          <a-button v-if="isBuyer() && order.status === 2" type="primary" @click="receive">
            确认收货
          </a-button>
        </a-space>
      </template>

      <a-empty v-else-if="!loading && !error" description="订单不存在" class="empty-state">
        <a-button type="primary" @click="router.push('/orders')">返回订单列表</a-button>
      </a-empty>
    </a-spin>

    <a-modal v-model:open="showShipModal" title="填写发货信息" @ok="ship" :confirm-loading="actionLoading">
      <a-form layout="vertical">
        <a-form-item label="物流/取货单号">
          <a-input v-model:value="shipForm.shipping_no" placeholder="可选" maxlength="64" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="shipForm.shipping_note" placeholder="如：已放宿舍楼下" :maxlength="200" show-count />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.item-thumb {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 8px;
}
</style>
