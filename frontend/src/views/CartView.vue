<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { api, assetUrl } from '../api';
import { getApiErrorMessage } from '../utils/api-error';
import { formatPrice } from '../utils/format';
import { useCartStore } from '../stores/cart';
import FetchErrorAlert from '../components/FetchErrorAlert.vue';
import SafeImage from '../components/SafeImage.vue';

const router = useRouter();
const cartStore = useCartStore();
const selectedIds = ref<number[]>([]);

const total = computed(() =>
  cartStore.items
    .filter(i => selectedIds.value.includes(i.id))
    .reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
);

onMounted(() => cartStore.fetchCart());

function toggleAll(checked: boolean) {
  selectedIds.value = checked ? cartStore.items.filter(i => i.status === 1).map(i => i.id) : [];
}

async function updateQty(item: any, qty: number) {
  if (!qty || qty < 1) return;
  try {
    await api.updateCart(item.id, qty);
    await cartStore.fetchCart();
  } catch (e) {
    message.error(getApiErrorMessage(e, '更新数量失败'));
  }
}

async function removeItem(id: number) {
  try {
    await api.removeCart(id);
    selectedIds.value = selectedIds.value.filter(i => i !== id);
    await cartStore.fetchCart();
    message.success('已移除');
  } catch (e) {
    message.error(getApiErrorMessage(e, '移除失败'));
  }
}

function checkout() {
  if (!selectedIds.value.length) {
    message.warning('请选择商品');
    return;
  }
  router.push({ path: '/checkout', query: { cart_ids: selectedIds.value.join(',') } });
}
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">购物车</h2>

    <FetchErrorAlert v-if="cartStore.error" :message="cartStore.error" @retry="cartStore.fetchCart()" />

    <a-spin :spinning="cartStore.loading">
      <a-card v-if="cartStore.items.length && !cartStore.error">
        <div class="cart-header">
          <a-checkbox
            :checked="selectedIds.length === cartStore.items.filter(i => i.status === 1).length && selectedIds.length > 0"
            :indeterminate="selectedIds.length > 0 && selectedIds.length < cartStore.items.filter(i => i.status === 1).length"
            @change="(e: any) => toggleAll(e.target.checked)"
          >
            全选
          </a-checkbox>
        </div>

        <a-checkbox-group v-model:value="selectedIds" style="width: 100%">
        <a-list :data-source="cartStore.items" item-layout="horizontal">
          <template #renderItem="{ item }">
            <a-list-item class="cart-list-item">
              <a-checkbox
                :value="item.id"
                :disabled="item.status !== 1"
                style="margin-right: 16px"
              />
              <a-list-item-meta>
                <template #avatar>
                  <SafeImage
                    v-if="item.images?.[0]"
                    :src="assetUrl(item.images[0])"
                    :alt="item.content"
                    img-class="cart-thumb"
                    placeholder-class="cart-thumb thumb-placeholder"
                  />
                  <div v-else class="cart-thumb thumb-placeholder" aria-hidden="true">图</div>
                </template>
                <template #title><span class="text-break">{{ item.content }}</span></template>
                <template #description>
                  <span class="text-truncate">卖家：{{ item.seller_name }}</span>
                  <a-tag v-if="item.status !== 1" color="default" style="margin-left: 8px">已售出</a-tag>
                </template>
              </a-list-item-meta>
              <div class="cart-actions">
                <span class="price-text">¥{{ formatPrice(item.price) }}</span>
                <a-input-number
                  :value="item.quantity"
                  :min="1"
                  :max="1"
                  size="small"
                  @change="(v: number) => updateQty(item, v)"
                />
                <a-button type="link" danger @click="removeItem(item.id)">删除</a-button>
              </div>
            </a-list-item>
          </template>
        </a-list>
        </a-checkbox-group>

        <div class="cart-footer">
          <span>已选 {{ selectedIds.length }} 件，合计：<span class="price-text">¥{{ total.toFixed(2) }}</span></span>
          <a-button type="primary" size="large" @click="checkout">去结算</a-button>
        </div>
      </a-card>

      <a-empty v-else-if="!cartStore.error" description="购物车是空的" class="empty-state">
        <a-button type="primary" @click="router.push('/')">去逛逛</a-button>
      </a-empty>
    </a-spin>
  </div>
</template>

<style scoped>
.cart-header {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 8px;
}

.cart-thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  background: var(--neutral-muted);
}

.cart-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-subtle);
  margin-top: var(--space-md);
}

@media (max-width: 575px) {
  .cart-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .cart-list-item {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: var(--space-sm);
  }

  .cart-list-item :deep(.ant-list-item-meta) {
    margin-bottom: var(--space-xs);
  }

  .cart-actions {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .cart-footer .ant-btn {
    width: 100%;
    min-height: 44px;
  }
}
</style>
