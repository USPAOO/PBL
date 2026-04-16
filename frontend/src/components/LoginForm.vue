<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const emit = defineEmits(['login-success']);
const API = 'http://localhost:3000/api';
const loginForm = ref({ username: '', password: '' });

const login = async () => {
  const res = await axios.post(`${API}/login`, loginForm.value);
  if (res.data.code === 200) {
    emit('login-success', res.data.data);
  } else {
    alert(res.data.msg);
  }
};

const register = async () => {
  const res = await axios.post(`${API}/register`, loginForm.value);
  alert(res.data.msg);
};
</script>

<template>
  <div class="login-page">
    <h1>校园二手平台</h1>
    <div class="form">
      <input v-model="loginForm.username" placeholder="用户名" />
      <input v-model="loginForm.password" type="password" placeholder="密码" />
      <button @click="login">登录</button>
      <button @click="register">注册</button>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 300px;
}

.form input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form button {
  padding: 10px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>

