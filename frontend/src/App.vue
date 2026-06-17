<script setup lang="ts">
import { RouterView } from 'vue-router';

const themeConfig = {
  token: {
    colorPrimary: '#0f857b',
    colorSuccess: '#389e0d',
    colorError: '#e84749',
    colorWarning: '#d89614',
    colorInfo: '#0f857b',
    colorBgLayout: '#eef3f2',
    colorBgContainer: '#ffffff',
    colorBorder: '#dce8e6',
    colorText: '#1a2422',
    colorTextSecondary: '#586562',
    borderRadius: 8,
    borderRadiusLG: 12,
  },
};
</script>

<template>
  <a-config-provider :theme="themeConfig">
    <RouterView />
  </a-config-provider>
</template>
