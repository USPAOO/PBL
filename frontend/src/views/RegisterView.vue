<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  UserOutlined, LockOutlined, CheckCircleOutlined,
  SafetyCertificateOutlined, ArrowLeftOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { api } from '../api';
import { getApiErrorMessage } from '../utils/api-error';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const agreed = ref(false);
const form = ref({ username: '', password: '', confirmPassword: '' });

const passwordStrength = computed(() => {
  const p = form.value.password;
  if (!p) return { level: 0, text: '', color: '' };
  if (p.length < 6) return { level: 1, text: '太短', color: 'var(--danger)' };
  if (p.length < 10) return { level: 2, text: '一般', color: 'var(--warning)' };
  return { level: 3, text: '较强', color: 'var(--success)' };
});

async function submit() {
  const username = form.value.username.trim();
  const { password, confirmPassword } = form.value;
  if (!username || !password || !confirmPassword) {
    message.warning('请填写完整注册信息');
    return;
  }
  if (username.length < 3) {
    message.warning('用户名至少 3 个字符');
    return;
  }
  if (password.length < 6) {
    message.warning('密码至少 6 位');
    return;
  }
  if (password !== confirmPassword) {
    message.warning('两次密码不一致');
    return;
  }
  if (!agreed.value) {
    message.warning('请先阅读并同意用户协议');
    return;
  }
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await api.register({
      username,
      password,
      confirm_password: confirmPassword,
    });
    if (res.data.code === 200) {
      message.success('注册成功，欢迎加入校园二手！');
      if (res.data.data) {
        userStore.setUser(res.data.data);
        router.push('/');
      } else {
        router.push('/login');
      }
    } else {
      message.error(res.data.msg);
    }
  } catch (e) {
    message.error(getApiErrorMessage(e, '注册失败'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-bg" aria-hidden="true" />
    <div class="auth-card">
      <button type="button" class="back-link" @click="router.push('/login')">
        <ArrowLeftOutlined /> 返回登录
      </button>

      <div class="auth-header">
        <div class="auth-badge">
          <SafetyCertificateOutlined />
        </div>
        <h1>加入校园二手</h1>
        <p>注册账号，开始买卖校园好物</p>
      </div>

      <a-form :model="form" layout="vertical" @finish="submit">
        <a-form-item label="用户名" name="username">
          <a-input
            v-model:value="form.username"
            size="large"
            placeholder="3-32 位，支持中文/字母/数字"
            :maxlength="32"
            show-count
          >
            <template #prefix><UserOutlined /></template>
          </a-input>
        </a-form-item>

        <a-form-item label="密码" name="password">
          <a-input-password
            v-model:value="form.password"
            size="large"
            placeholder="至少 6 位"
            :maxlength="64"
          >
            <template #prefix><LockOutlined /></template>
          </a-input-password>
          <div v-if="form.password" class="strength-row">
            <span class="strength-label">密码强度</span>
            <div class="strength-bar">
              <span
                v-for="i in 3"
                :key="i"
                class="strength-seg"
                :class="{ active: passwordStrength.level >= i }"
                :style="passwordStrength.level >= i ? { background: passwordStrength.color } : {}"
              />
            </div>
            <span class="strength-text" :style="{ color: passwordStrength.color }">{{ passwordStrength.text }}</span>
          </div>
        </a-form-item>

        <a-form-item label="确认密码" name="confirmPassword">
          <a-input-password
            v-model:value="form.confirmPassword"
            size="large"
            placeholder="再次输入密码"
            :maxlength="64"
          >
            <template #prefix><CheckCircleOutlined /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-checkbox v-model:checked="agreed">
            我已阅读并同意
            <a>《校园二手用户协议》</a>
          </a-checkbox>
        </a-form-item>

        <a-button type="primary" html-type="submit" size="large" block :loading="loading">
          立即注册
        </a-button>
      </a-form>

      <div class="auth-footer">
        已有账号？<a @click="router.push('/login')">去登录</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: var(--space-md);
}

.auth-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    145deg,
    oklch(48% 0.12 172 / 0.16) 0%,
    oklch(54% 0.10 172 / 0.10) 45%,
    oklch(58% 0.08 145 / 0.08) 100%
  );
}

.auth-card {
  position: relative;
  width: min(440px, 100%);
  padding: var(--space-xl) var(--space-lg);
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-modal);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  margin-bottom: var(--space-md);
  font-size: 14px;
  min-height: 44px;
}

.back-link:hover {
  color: var(--primary);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--space-lg);
}

.auth-badge {
  width: 52px;
  height: 52px;
  margin: 0 auto var(--space-sm);
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.auth-header h1 {
  font-size: 26px;
  margin: 0 0 8px;
  color: var(--text-primary);
  text-wrap: balance;
}

.auth-header p {
  color: var(--text-secondary);
  margin: 0;
}

.strength-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
}

.strength-label {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.strength-bar {
  display: flex;
  gap: 4px;
  flex: 1;
}

.strength-seg {
  height: 4px;
  flex: 1;
  border-radius: 2px;
  background: var(--border-subtle);
  transition: background 0.2s ease-out;
}

.strength-text {
  flex-shrink: 0;
  font-weight: 500;
}

.auth-footer {
  text-align: center;
  margin-top: var(--space-md);
  color: var(--text-secondary);
}
</style>
