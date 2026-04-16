<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { io } from 'socket.io-client';
import LoginForm from './components/LoginForm.vue';
import GoodsList from './components/GoodsList.vue';
import GoodsDetail from './components/GoodsDetail.vue';
import PublishGoods from './components/PublishGoods.vue';
import ChatBox from './components/ChatBox.vue';
import MessageList from './components/MessageList.vue';

const API = 'http://localhost:3000/api';
const socket = io('http://localhost:3000');
const user = ref<any>(null);
const goods = ref<any[]>([]);
const showLogin = ref(true);
const showPublish = ref(false);
const showChat = ref(false);
const selectedGoods = ref<any>(null);
const currentChatUser = ref<any>(null);
const showMessages = ref(false);

const handleLogin = (userData: any) => {
  user.value = userData;
  showLogin.value = false;
  // 保存到localStorage
  localStorage.setItem('user', JSON.stringify(userData));
  // 加入WebSocket房间
  socket.emit('join', userData.id);
  loadGoods();
};

const loadGoods = async () => {
  const res = await axios.get(`${API}/goods`);
  if (res.data.code === 200) {
    goods.value = res.data.data;
  }
};

const handleViewGoods = (item: any) => {
  selectedGoods.value = item;
};

const handleContactSeller = (sellerId: number, sellerName: string) => {
  currentChatUser.value = { id: sellerId, username: sellerName };
  showChat.value = true;
  selectedGoods.value = null;
};

const handleOpenChat = (userId: number, username: string) => {
  currentChatUser.value = { id: userId, username: username };
  showChat.value = true;
  showMessages.value = false;
};

const logout = () => {
  user.value = null;
  showLogin.value = true;
  goods.value = [];
  localStorage.removeItem('user');
};

onMounted(() => {
  // 从localStorage恢复用户信息
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    user.value = JSON.parse(savedUser);
    showLogin.value = false;
    socket.emit('join', user.value.id);
    loadGoods();
  }
});
</script>

<template>
  <div class="app">
    <LoginForm v-if="showLogin" @login-success="handleLogin" />

    <div v-else class="main-page">
      <div class="header">
        <h2>校园二手平台</h2>
        <div>
          <span>欢迎, {{ user.username }}</span>
          <button @click="showMessages = !showMessages">{{ showMessages ? '商品列表' : '消息列表' }}</button>
          <button @click="showPublish = true">发布商品</button>
          <button @click="logout">退出</button>
        </div>
      </div>

      <PublishGoods
        v-if="showPublish"
        :user-id="user.id"
        @close="showPublish = false"
        @published="loadGoods"
      />

      <GoodsDetail
        v-if="selectedGoods"
        :goods="selectedGoods"
        :user-id="user.id"
        @close="selectedGoods = null"
        @contact-seller="handleContactSeller"
        @mark-sold="loadGoods"
      />

      <ChatBox
        v-if="showChat"
        :user-id="user.id"
        :chat-user="currentChatUser"
        :socket="socket"
        @close="showChat = false"
      />

      <MessageList v-if="showMessages" :user-id="user.id" @open-chat="handleOpenChat" />
      <GoodsList v-else :goods="goods" @view-goods="handleViewGoods" />
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: #f5f5f5;
}

.main-page {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.header button {
  margin-left: 10px;
  padding: 8px 16px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>