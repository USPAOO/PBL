<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { api, BASE_URL } from '../api';
import { getApiErrorMessage } from '../utils/api-error';
import { parseRouteId } from '../utils/format';
import { useUserStore } from '../stores/user';
import FetchErrorAlert from '../components/FetchErrorAlert.vue';
import { io } from 'socket.io-client';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const messages = ref<any[]>([]);
const content = ref('');
const loading = ref(false);
const sending = ref(false);
const error = ref<string | null>(null);
const listRef = ref<HTMLElement | null>(null);
const chatUserId = computed(() => parseRouteId(route.params.userId));
const chatUserName = computed(() => (route.query.name as string)?.trim() || '用户');
const socket = io(BASE_URL);

async function loadMessages() {
  if (!chatUserId.value) {
    error.value = '无效的聊天对象';
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const res = await api.getMessages(chatUserId.value, userStore.user!.id);
    if (res.data.code === 200) {
      messages.value = res.data.data;
      await nextTick();
      if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
    } else {
      error.value = res.data.msg || '加载消息失败';
    }
  } catch (e) {
    error.value = getApiErrorMessage(e, '加载消息失败');
  } finally {
    loading.value = false;
  }
}

async function send() {
  const text = content.value.trim();
  if (!text || sending.value || !chatUserId.value) return;
  if (text.length > 500) {
    message.warning('消息不能超过 500 字');
    return;
  }
  sending.value = true;
  try {
    const res = await api.sendMessage({
      sender_id: userStore.user!.id,
      receiver_id: chatUserId.value,
      content: text,
    });
    if (res.data.code === 200) {
      content.value = '';
      await loadMessages();
    } else {
      message.error(res.data.msg);
    }
  } catch (e) {
    message.error(getApiErrorMessage(e, '发送失败'));
  } finally {
    sending.value = false;
  }
}

onMounted(() => {
  if (!chatUserId.value) {
    error.value = '无效的聊天对象';
    return;
  }
  loadMessages();
  socket.emit('join', userStore.user!.id);
  socket.on('new_message', () => loadMessages());
});

onUnmounted(() => socket.off('new_message'));
</script>

<template>
  <div class="page-container chat-page">
    <a-page-header :title="`与 ${chatUserName} 聊天`" @back="router.back()" />

    <a-card class="chat-card">
      <FetchErrorAlert v-if="error" :message="error" @retry="loadMessages" />

      <div ref="listRef" class="message-list">
        <a-spin :spinning="loading">
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="['bubble-row', msg.sender_id === userStore.user?.id ? 'mine' : 'other']"
          >
            <div class="bubble text-break">{{ msg.content }}</div>
          </div>
          <a-empty v-if="!messages.length && !loading && !error" description="开始聊天吧" />
        </a-spin>
      </div>
      <div class="input-bar">
        <a-input
          v-model:value="content"
          placeholder="输入消息..."
          :maxlength="500"
          :disabled="!!error || !chatUserId"
          @press-enter="send"
        />
        <a-button type="primary" :loading="sending" :disabled="!!error || !chatUserId" @click="send">
          发送
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.chat-page { max-width: 720px; }
.chat-card { border-radius: var(--radius-lg); }
.message-list {
  height: min(480px, calc(100dvh - 280px));
  min-height: 240px;
  overflow-y: auto;
  padding: var(--space-md);
  background: var(--neutral-muted);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-md);
  -webkit-overflow-scrolling: touch;
}
.bubble-row {
  display: flex;
  margin-bottom: 10px;
}

.bubble-row.mine {
  justify-content: flex-end;
}

.bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  line-height: 1.5;
}

.bubble-row.mine .bubble {
  background: var(--primary);
  color: var(--surface);
}

.bubble-row.other .bubble {
  background: var(--primary-light);
  color: var(--text-primary);
}
.input-bar {
  display: flex;
  gap: var(--space-sm);
}

.input-bar .ant-input {
  min-height: 44px;
  font-size: 16px;
}

.input-bar .ant-btn {
  min-width: 72px;
  min-height: 44px;
  flex-shrink: 0;
}
</style>
