<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import axios from 'axios';

const props = defineProps<{
  userId: number,
  chatUser: any,
  socket: any
}>();

const emit = defineEmits(['close']);
const API = 'http://localhost:3000/api';
const messages = ref<any[]>([]);
const messageContent = ref('');
const messagesListRef = ref<HTMLElement | null>(null);

const loadMessages = async () => {
  const res = await axios.get(`${API}/messages/${props.chatUser.id}?my_id=${props.userId}`);
  if (res.data.code === 200) {
    messages.value = res.data.data;
    // 滚动到底部
    await nextTick();
    if (messagesListRef.value) {
      messagesListRef.value.scrollTop = messagesListRef.value.scrollHeight;
    }
  }
};

const sendMessage = async () => {
  if (!messageContent.value.trim()) return;
  const res = await axios.post(`${API}/messages`, {
    sender_id: props.userId,
    receiver_id: props.chatUser.id,
    content: messageContent.value
  });
  if (res.data.code === 200) {
    messageContent.value = '';
    await loadMessages();
  }
};

onMounted(() => {
  loadMessages();

  // 监听WebSocket新消息
  props.socket.on('new_message', (data: any) => {
    // 如果消息是当前聊天对象发来的，刷新消息列表
    if (data.sender_id === props.chatUser.id || data.receiver_id === props.chatUser.id) {
      loadMessages();
    }
  });
});

onUnmounted(() => {
  // 移除监听器
  props.socket.off('new_message');
});
</script>

<template>
  <div class="modal" @click="emit('close')">
    <div class="modal-content chat-box" @click.stop>
      <h3>与 {{ chatUser.username }} 聊天</h3>
      <div class="messages-list" ref="messagesListRef">
        <div v-if="messages.length === 0" class="empty">暂无消息，开始聊天吧</div>
        <div v-for="msg in messages" :key="msg.id" :class="['msg', msg.sender_id === userId ? 'my-msg' : 'other-msg']">
          <span>{{ msg.content }}</span>
        </div>
      </div>
      <div class="send-box">
        <input v-model="messageContent" placeholder="输入消息" @keyup.enter="sendMessage" />
        <button @click="sendMessage">发送</button>
      </div>
      <button @click="emit('close')">关闭</button>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 500px;
}

.chat-box {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
  margin: 10px 0;
  display: flex;
  flex-direction: column;
}

.empty {
  text-align: center;
  color: #999;
  padding: 20px;
}

.msg {
  padding: 8px 12px;
  margin: 5px 0;
  border-radius: 8px;
  max-width: 70%;
}

.my-msg {
  background: #42b983;
  color: white;
  margin-left: auto;
  text-align: right;
}

.other-msg {
  background: white;
  color: #333;
}

.send-box {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.send-box input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.send-box button {
  padding: 10px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modal-content > button {
  width: 100%;
  padding: 10px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>

