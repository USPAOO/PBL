<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { api } from '../api';
import { getApiErrorMessage } from '../utils/api-error';
import { useUserStore } from '../stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const loading = ref(false);
const isRegister = ref(false);
const form = ref({ username: '', password: '' });

async function submit() {
  const username = form.value.username.trim();
  const password = form.value.password;
  if (!username || !password) {
    message.warning('请填写用户名和密码');
    return;
  }
  if (username.length > 32) {
    message.warning('用户名不能超过 32 个字符');
    return;
  }
  if (loading.value) return;
  loading.value = true;
  try {
    const fn = isRegister.value ? api.register : api.login;
    const res = await fn({ username, password });
    if (res.data.code === 200) {
      if (isRegister.value) {
        message.success('注册成功，请登录');
        isRegister.value = false;
      } else {
        userStore.setUser(res.data.data);
        message.success('登录成功');
        const redirect = (route.query.redirect as string) || '/';
        router.push(redirect);
      }
    } else {
      message.error(res.data.msg);
    }
  } catch (e) {
    message.error(getApiErrorMessage(e, isRegister.value ? '注册失败' : '登录失败'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-bg" />
    <div class="login-card">
      <div class="login-header">
        <h1>校园二手平台</h1>
        <p>发现校园好物，让闲置重新发光</p>
      </div>

      <a-form :model="form" layout="vertical" @finish="submit">
        <a-form-item label="用户名" name="username">
          <a-input
            v-model:value="form.username"
            size="large"
            placeholder="请输入用户名"
            :maxlength="32"
            show-count
            @press-enter="submit"
          >
            <template #prefix><UserOutlined /></template>
          </a-input>
        </a-form-item>
        <a-form-item label="密码" name="password">
          <a-input-password
            v-model:value="form.password"
            size="large"
            placeholder="请输入密码"
            :maxlength="64"
            @press-enter="submit"
          >
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>
        <a-button type="primary" html-type="submit" size="large" block :loading="loading">
          {{ isRegister ? '注册' : '登录' }}
        </a-button>
      </a-form>

      <div class="login-footer">
        <a @click="isRegister = !isRegister">
          {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    oklch(50% 0.11 172 / 0.14) 0%,
    oklch(56% 0.12 172 / 0.10) 50%,
    oklch(58% 0.14 145 / 0.08) 100%
  );
}

.login-card {
  position: relative;
  width: min(420px, calc(100vw - 32px));
  padding: var(--space-xl) var(--space-lg);
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-modal);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 28px;
  margin: 0 0 8px;
  color: var(--text-primary);
}

.login-header p {
  color: var(--text-secondary);
  margin: 0;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
}
</style>
