<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps<{
  userId: number
}>();

const emit = defineEmits(['open-chat']);
const API = 'http://localhost:3000/api';
const chatList = ref<any[]>([]);

const loadChatList = async () => {
  const res = await axios.get(`${API}/chat-list/${props.userId}`);
  if (res.data.code === 200) {
    chatList.value = res.data.data;
  }
};

const openChat = (user: any) => {
  emit('open-chat', user.user_id, user.username);
};

onMounted(() => {
  loadChatList();
  // 每3秒刷新一次消息列表
  setInterval(loadChatList, 3000);
});
</script>

<template>
  <div class="chat-list">
    <h3>消息列表</h3>
    <div v-if="chatList.length === 0" class="empty">暂无消息</div>
    <div v-for="item in chatList" :key="item.user_id" class="chat-item" @click="openChat(item)">
      <div class="user-info">
        <span class="username">{{ item.username }}</span>
        <span class="last-msg">{{ item.last_message }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-list {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.chat-list h3 {
  margin-bottom: 15px;
  color: #333;
}

.empty {
  text-align: center;
  color: #999;
  padding: 20px;
}

.chat-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
}

.chat-item:hover {
  background: #f5f5f5;
}

.chat-item:last-child {
  border-bottom: none;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: flex-start;
}

.username {
  font-weight: bold;
  color: #333;
}

.last-msg {
  color: #666;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

