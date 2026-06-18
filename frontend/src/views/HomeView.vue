<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { SearchOutlined, PictureOutlined, NotificationOutlined } from '@ant-design/icons-vue';
import { api, assetUrl } from '../api';
import { getApiErrorMessage } from '../utils/api-error';
import { formatPrice } from '../utils/format';
import FetchErrorAlert from '../components/FetchErrorAlert.vue';
import SafeImage from '../components/SafeImage.vue';

const router = useRouter();
const goods = ref<any[]>([]);
const notifications = ref<any[]>([]);
const dismissedIds = ref<number[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const keyword = ref('');

const visibleNotifications = ref<any[]>([]);

async function loadNotifications() {
  try {
    const res = await api.getNotifications();
    if (res.data.code === 200) {
      notifications.value = res.data.data;
      visibleNotifications.value = res.data.data.filter(
        (n: any) => !dismissedIds.value.includes(n.id)
      );
    }
  } catch { /* non-blocking */ }
}

function dismissNotification(id: number) {
  dismissedIds.value.push(id);
  visibleNotifications.value = notifications.value.filter(
    n => !dismissedIds.value.includes(n.id)
  );
}

function notifColor(type: string) {
  if (type === 'warning') return 'warning';
  if (type === 'announcement') return 'success';
  return 'info';
}

async function loadGoods() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.getGoods({ keyword: keyword.value.trim() || undefined });
    if (res.data.code === 200) goods.value = res.data.data;
    else error.value = res.data.msg || '加载商品失败';
  } catch (e) {
    error.value = getApiErrorMessage(e, '加载商品失败');
  } finally {
    loading.value = false;
  }
}

function getCover(item: any) {
  return item.images?.[0] ? assetUrl(item.images[0]) : '';
}

onMounted(() => {
  loadGoods();
  loadNotifications();
});
</script>

<template>
  <div class="page-container">
    <div v-if="visibleNotifications.length" class="notif-stack">
      <a-alert
        v-for="n in visibleNotifications"
        :key="n.id"
        :type="notifColor(n.type)"
        show-icon
        closable
        class="notif-item"
        @close="dismissNotification(n.id)"
      >
        <template #icon><NotificationOutlined /></template>
        <template #message>{{ n.title }}</template>
        <template #description>{{ n.content }}</template>
      </a-alert>
    </div>

    <div class="hero-banner">
      <div class="hero-content">
        <h2>发现校园好物</h2>
        <p>二手书籍、数码、生活用品，应有尽有</p>
        <a-input-search
          v-model:value="keyword"
          placeholder="搜索商品..."
          size="large"
          enter-button="搜索"
          class="hero-search"
          @search="loadGoods"
        >
          <template #prefix><SearchOutlined /></template>
        </a-input-search>
      </div>
    </div>

    <FetchErrorAlert v-if="error" :message="error" @retry="loadGoods" />

    <a-spin :spinning="loading">
      <a-row v-if="!error" :gutter="[20, 20]">
        <a-col v-for="item in goods" :key="item.id" :xs="12" :sm="8" :md="6" :lg="6" :xl="4">
          <a-card hoverable class="goods-card" @click="router.push(`/goods/${item.id}`)">
            <template #cover>
              <SafeImage
                v-if="getCover(item)"
                :src="getCover(item)"
                :alt="item.content"
                img-class="goods-img"
                placeholder-class="goods-img-placeholder"
              />
              <div v-else class="goods-img-placeholder" aria-hidden="true"><PictureOutlined /></div>
            </template>
            <a-card-meta>
              <template #title>
                <span class="card-title-clamp">{{ item.content }}</span>
              </template>
              <template #description>
                <div class="card-meta min-w-0">
                  <span class="price-text">¥{{ formatPrice(item.price) }}</span>
                  <span class="seller text-truncate">{{ item.username }}</span>
                </div>
              </template>
            </a-card-meta>
            <a-tag v-if="item.status === 2" color="default" class="sold-tag">已售</a-tag>
          </a-card>
        </a-col>
      </a-row>

      <a-empty v-if="!loading && !error && !goods.length" description="暂无商品，来发布第一件吧" class="empty-state">
        <a-space>
          <a-button type="primary" @click="router.push('/publish')">发布商品</a-button>
          <a-button @click="loadGoods">刷新</a-button>
        </a-space>
      </a-empty>
    </a-spin>
  </div>
</template>

<style scoped>
.notif-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.notif-item {
  border-radius: var(--radius-md);
}

.hero-banner {
  background: linear-gradient(135deg, var(--primary), var(--primary-mid));
  border-radius: var(--radius-xl);
  padding: var(--space-xl) var(--space-lg);
  margin-bottom: var(--space-xl);
  color: var(--surface);
}

@media (max-width: 576px) {
  .hero-banner {
    padding: var(--space-lg) var(--space-md);
    border-radius: var(--radius-lg);
  }

  .hero-content h2 {
    font-size: 22px;
  }
}

.hero-content h2 {
  font-size: 28px;
  margin: 0 0 8px;
  color: var(--surface);
}

.hero-content p {
  margin: 0 0 20px;
  opacity: 0.9;
}

.hero-search {
  max-width: 480px;
  width: 100%;
}

@media (max-width: 575px) {
  .hero-search :deep(.ant-input-search-button) {
    min-width: 64px;
  }
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-xs);
}

.seller {
  color: var(--text-secondary);
  font-size: 12px;
  flex-shrink: 1;
  max-width: 50%;
}

.sold-tag {
  position: absolute;
  top: 12px;
  right: 12px;
}

:deep(.ant-card) {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}
</style>
