<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { PictureOutlined } from '@ant-design/icons-vue';
import { api, assetUrl } from '../api';
import { useUserStore } from '../stores/user';
import { useCartStore } from '../stores/cart';
import { getApiErrorMessage } from '../utils/api-error';
import { formatPrice, parseRouteId } from '../utils/format';
import FetchErrorAlert from '../components/FetchErrorAlert.vue';
import SafeImage from '../components/SafeImage.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const cartStore = useCartStore();
const goods = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const adding = ref(false);
const markingSold = ref(false);

const goodsId = computed(() => parseRouteId(route.params.id));

async function loadDetail() {
  if (!goodsId.value) {
    error.value = '商品不存在或已下架';
    goods.value = null;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const res = await api.getGoodsDetail(goodsId.value);
    if (res.data.code === 200) goods.value = res.data.data;
    else {
      goods.value = null;
      error.value = res.data.msg || '商品不存在或已下架';
    }
  } catch (e) {
    goods.value = null;
    error.value = getApiErrorMessage(e, '加载商品详情失败');
  } finally {
    loading.value = false;
  }
}

async function addToCart() {
  if (adding.value) return;
  adding.value = true;
  try {
    const result = await cartStore.addToCart(goods.value.id);
    result.ok ? message.success(result.msg) : message.warning(result.msg);
  } finally {
    adding.value = false;
  }
}

function contactSeller() {
  router.push({
    name: 'Chat',
    params: { userId: goods.value.user_id },
    query: { name: goods.value.username },
  });
}

async function markSold() {
  if (markingSold.value) return;
  markingSold.value = true;
  try {
    const res = await api.updateGoodsStatus(goods.value.id, 2);
    if (res.data.code === 200) {
      message.success(res.data.msg || '已标记为售出');
      loadDetail();
    } else {
      message.error(res.data.msg);
    }
  } catch (e) {
    message.error(getApiErrorMessage(e, '操作失败'));
  } finally {
    markingSold.value = false;
  }
}

function buyNow() {
  router.push({ path: '/checkout', query: { goods_id: goods.value.id } });
}

onMounted(loadDetail);
</script>

<template>
  <div class="page-container">
    <a-spin :spinning="loading">
      <a-page-header title="商品详情" @back="router.back()" />

      <FetchErrorAlert v-if="error && !loading" :message="error" @retry="loadDetail" />

      <a-row v-if="goods" :gutter="[32, 24]">
        <a-col :xs="24" :md="12">
          <a-carousel v-if="goods.images?.length" autoplay>
            <div v-for="(img, i) in goods.images" :key="i">
              <SafeImage
                :src="assetUrl(img)"
                :alt="`${goods.content} 图片 ${Number(i) + 1}`"
                img-class="detail-img"
                placeholder-class="detail-img-placeholder"
              />
            </div>
          </a-carousel>
          <div v-else class="detail-img-placeholder" aria-hidden="true"><PictureOutlined /></div>
        </a-col>

        <a-col :xs="24" :md="12">
          <h1 class="detail-title text-break">{{ goods.content }}</h1>
          <div class="detail-price">¥{{ formatPrice(goods.price) }}</div>
          <a-descriptions bordered :column="1" size="small" style="margin: 20px 0">
            <a-descriptions-item label="卖家">
              <span class="text-break">{{ goods.username }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="goods.status === 1 ? 'green' : 'default'">
                {{ goods.status === 1 ? '在售' : '已售' }}
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>

          <a-space wrap class="detail-actions stack-actions">
            <template v-if="goods.user_id !== userStore.user?.id && goods.status === 1">
              <a-button type="primary" size="large" :loading="adding" :disabled="adding" @click="addToCart">
                加入购物车
              </a-button>
              <a-button size="large" @click="buyNow">立即购买</a-button>
              <a-button @click="contactSeller">联系卖家</a-button>
            </template>
            <a-button
              v-if="goods.user_id === userStore.user?.id && goods.status === 1"
              danger
              :loading="markingSold"
              :disabled="markingSold"
              @click="markSold"
            >
              标记已售
            </a-button>
          </a-space>
        </a-col>
      </a-row>

      <a-empty v-else-if="!loading && !error" description="商品不存在或已下架" class="empty-state">
        <a-button type="primary" @click="router.push('/')">返回首页</a-button>
      </a-empty>
    </a-spin>
  </div>
</template>

<style scoped>
.detail-img {
  width: 100%;
  max-height: min(400px, 50vh);
  object-fit: contain;
  border-radius: var(--radius-lg);
  background: var(--neutral-muted);
}

.detail-img-placeholder {
  height: min(400px, 40vh);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-light), var(--primary-wash-end));
  border-radius: 12px;
  font-size: 64px;
  color: var(--placeholder-tint);
}

.detail-title {
  font-size: 24px;
  margin: 0 0 12px;
}

.detail-price {
  font-size: clamp(1.5rem, 5vw, 2rem);
  color: var(--danger);
  font-weight: 700;
  margin-bottom: var(--space-sm);
}
</style>
