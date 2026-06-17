<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { getApiErrorMessage } from '../utils/api-error';
import { useUserStore } from '../stores/user';
import FetchErrorAlert from '../components/FetchErrorAlert.vue';

const router = useRouter();
const userStore = useUserStore();
const chatList = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function loadChatList() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.getChatList(userStore.user!.id);
    if (res.data.code === 200) chatList.value = res.data.data;
    else error.value = res.data.msg || '加载消息失败';
  } catch (e) {
    error.value = getApiErrorMessage(e, '加载消息失败');
  } finally {
    loading.value = false;
  }
}

function openChat(user: any) {
  router.push({ name: 'Chat', params: { userId: user.user_id }, query: { name: user.username } });
}

onMounted(loadChatList);
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">消息列表</h2>

    <FetchErrorAlert v-if="error" :message="error" @retry="loadChatList" />

    <a-spin :spinning="loading">
      <a-list v-if="chatList.length && !error" :data-source="chatList" item-layout="horizontal">
        <template #renderItem="{ item }">
          <a-list-item class="chat-item" @click="openChat(item)">
            <a-list-item-meta>
              <template #avatar>
                <a-avatar>{{ item.username?.[0] || '?' }}</a-avatar>
              </template>
              <template #title><span class="text-truncate">{{ item.username }}</span></template>
              <template #description>
                <span class="text-truncate">{{ item.last_message || '暂无消息' }}</span>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
      <a-empty v-else-if="!loading && !error" description="暂无消息，去商品页联系卖家吧" class="empty-state">
        <a-button type="primary" @click="router.push('/')">浏览商品</a-button>
      </a-empty>
    </a-spin>
  </div>
</template>

<style scoped>
.chat-item {
  cursor: pointer;
  background: var(--surface);
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 12px 16px !important;
}
</style>
