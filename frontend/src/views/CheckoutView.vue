<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { api, assetUrl } from '../api';
import { getApiErrorMessage } from '../utils/api-error';
import { formatPrice, parseRouteId } from '../utils/format';
import { useUserStore } from '../stores/user';
import { useCartStore } from '../stores/cart';
import SafeImage from '../components/SafeImage.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const cartStore = useCartStore();
const loading = ref(false);
const loadError = ref<string | null>(null);
const items = ref<any[]>([]);
const address = ref({ name: '', phone: '', detail: '' });

const total = computed(() => items.value.reduce((s, i) => s + Number(i.price) * i.quantity, 0));

onMounted(async () => {
  loadError.value = null;
  try {
    await cartStore.fetchCart();
    const cartIds = (route.query.cart_ids as string)?.split(',').map(Number).filter(Boolean);
    const goodsId = parseRouteId(route.query.goods_id);

    if (goodsId) {
      const res = await api.getGoodsDetail(goodsId);
      if (res.data.code === 200) {
        const g = res.data.data;
        items.value = [{ id: 0, goods_id: g.id, content: g.content, price: g.price, images: g.images, quantity: 1, _direct: true }];
      } else {
        loadError.value = res.data.msg || '商品不存在或已下架';
      }
    } else if (cartIds?.length) {
      items.value = cartStore.items.filter(i => cartIds.includes(i.id));
      if (!items.value.length) loadError.value = '所选商品已失效，请返回购物车重新选择';
    } else {
      loadError.value = '没有可结算的商品';
    }
  } catch (e) {
    loadError.value = getApiErrorMessage(e, '加载结算信息失败');
  }
});

async function submitOrder() {
  if (loading.value) return;
  const name = address.value.name.trim();
  const phone = address.value.phone.trim();
  const detail = address.value.detail.trim();
  if (!name || !phone || !detail) {
    message.warning('请填写完整收货信息');
    return;
  }
  if (name.length > 32) {
    message.warning('收货人姓名不能超过 32 字');
    return;
  }
  if (!/^1\d{10}$/.test(phone)) {
    message.warning('请输入有效的 11 位手机号');
    return;
  }
  if (detail.length > 200) {
    message.warning('收货地址不能超过 200 字');
    return;
  }
  if (!items.value.length) {
    message.warning('没有可结算的商品');
    return;
  }

  loading.value = true;
  try {
    if (items.value[0]?._direct) {
      const addRes = await api.addToCart({ user_id: userStore.user!.id, goods_id: items.value[0].goods_id });
      if (addRes.data.code !== 200) {
        message.error(addRes.data.msg);
        return;
      }
      await cartStore.fetchCart();
      const cartItem = cartStore.items.find(i => i.goods_id === items.value[0].goods_id);
      if (!cartItem) {
        message.error('商品已失效，请返回重试');
        return;
      }
      items.value = [cartItem];
    }

    const cart_ids = items.value.map(i => i.id);
    const res = await api.createOrder({
      buyer_id: userStore.user!.id,
      cart_ids,
      address_name: name,
      address_phone: phone,
      address_detail: detail,
    });

    if (res.data.code === 200) {
      message.success('下单成功，请付款');
      const orderId = res.data.data.order_ids[0];
      router.push(`/orders/${orderId}`);
    } else {
      message.error(res.data.msg);
    }
  } catch (e) {
    message.error(getApiErrorMessage(e, '提交订单失败'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="page-container">
    <a-page-header title="确认订单" @back="router.back()" />

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :md="14">
        <a-card title="收货信息" style="margin-bottom: 20px">
          <a-form layout="vertical">
            <a-form-item label="收货人" required>
              <a-input v-model:value="address.name" placeholder="姓名" maxlength="32" />
            </a-form-item>
            <a-form-item label="手机号" required>
              <a-input v-model:value="address.phone" placeholder="11 位手机号" maxlength="11" inputmode="numeric" />
            </a-form-item>
            <a-form-item label="收货地址" required>
              <a-textarea
                v-model:value="address.detail"
                placeholder="详细地址（宿舍楼/门牌号等）"
                :rows="2"
                :maxlength="200"
                show-count
              />
            </a-form-item>
          </a-form>
        </a-card>

        <a-card title="商品清单">
          <a-list :data-source="items" item-layout="horizontal">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #avatar>
                    <SafeImage
                      v-if="item.images?.[0]"
                      :src="assetUrl(item.images[0])"
                      :alt="item.content"
                      img-class="item-thumb"
                      placeholder-class="item-thumb thumb-placeholder"
                    />
                    <div v-else class="item-thumb thumb-placeholder" aria-hidden="true">图</div>
                  </template>
                  <template #title><span class="text-break">{{ item.content }}</span></template>
                  <template #description>¥{{ formatPrice(item.price) }} × {{ item.quantity }}</template>
                </a-list-item-meta>
                <span class="price-text">¥{{ formatPrice(Number(item.price) * item.quantity) }}</span>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>

      <a-col :xs="24" :md="10">
        <a-card title="订单摘要" class="summary-card">
          <div class="summary-row">
            <span>商品合计</span>
            <span class="price-text">¥{{ formatPrice(total) }}</span>
          </div>
          <div class="summary-row">
            <span>运费</span>
            <span>免运费（校园自提/配送）</span>
          </div>
          <a-divider />
          <div class="summary-row total">
            <span>应付总额</span>
            <span class="price-text big">¥{{ formatPrice(total) }}</span>
          </div>
          <a-button type="primary" size="large" block class="summary-submit" :loading="loading" :disabled="loading" @click="submitOrder">
            提交订单
          </a-button>
        </a-card>
      </a-col>
    </a-row>

    <div v-if="!loadError" class="mobile-checkout-bar">
      <div class="mobile-checkout-total">
        <span class="label">应付</span>
        <span class="price-text big">¥{{ formatPrice(total) }}</span>
      </div>
      <a-button type="primary" size="large" :loading="loading" :disabled="loading" @click="submitOrder">提交订单</a-button>
    </div>
  </div>
</template>

<style scoped>
.load-error {
  margin-bottom: var(--space-md);
}

.item-thumb {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 8px;
}

.summary-card {
  position: sticky;
  top: 80px;
}

@media (max-width: 767px) {
  .summary-card {
    position: static;
  }

  .summary-submit {
    display: none;
  }

  .mobile-checkout-bar {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 90;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-sm) var(--space-md);
    padding-bottom: max(var(--space-sm), env(safe-area-inset-bottom, 0px));
    background: var(--surface);
    border-top: 1px solid var(--border-subtle);
    box-shadow: 0 -4px 16px oklch(22% 0.02 172 / 0.08);
  }

  .mobile-checkout-total .label {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
  }

  .mobile-checkout-total .big {
    font-size: 20px;
  }

  .mobile-checkout-bar .ant-btn {
    min-width: 120px;
    min-height: 44px;
    flex-shrink: 0;
  }

  .page-container:has(.mobile-checkout-bar) {
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  }
}

@media (min-width: 768px) {
  .mobile-checkout-bar {
    display: none;
  }
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.summary-row.total {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
}

.price-text.big {
  font-size: 24px;
}
</style>
