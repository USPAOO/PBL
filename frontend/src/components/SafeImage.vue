<script setup lang="ts">
import { ref } from 'vue';
import { PictureOutlined } from '@ant-design/icons-vue';

const props = withDefaults(defineProps<{
  src?: string;
  alt?: string;
  imgClass?: string;
  placeholderClass?: string;
}>(), {
  src: '',
  alt: '',
  imgClass: '',
  placeholderClass: '',
});

const failed = ref(false);

function onError() {
  failed.value = true;
}
</script>

<template>
  <img
    v-if="src && !failed"
    :src="src"
    :alt="alt"
    :class="imgClass"
    @error="onError"
  />
  <div v-else :class="['safe-img-placeholder', placeholderClass]" aria-hidden="true">
    <PictureOutlined />
  </div>
</template>

<style scoped>
.safe-img-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--neutral-muted);
  color: var(--placeholder-tint);
}
</style>
