<script setup lang="ts">
defineProps<{
  message: string;
}>();

defineEmits<{
  retry: [];
}>();
</script>

<template>
  <a-alert type="error" show-icon class="fetch-error">
    <template #message>{{ message }}</template>
    <template #action>
      <a-button size="small" @click="$emit('retry')">重试</a-button>
    </template>
  </a-alert>
</template>

<style scoped>
.fetch-error {
  margin-bottom: var(--space-md);
}
</style>
