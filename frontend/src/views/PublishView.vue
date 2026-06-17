<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import type { UploadChangeParam } from 'ant-design-vue';
import { api, assetUrl } from '../api';
import { getApiErrorMessage } from '../utils/api-error';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const uploading = ref(false);
const imageUrls = ref<string[]>([]);
const form = ref({ content: '', price: '' });

function beforeUpload() {
  return false;
}

async function handleUpload(info: UploadChangeParam) {
  const file = (info.file.originFileObj || info.file) as File;
  if (!file || !(file instanceof File)) return;
  uploading.value = true;
  try {
    const res = await api.upload(file);
    if (res.data.code === 200) {
      imageUrls.value.push(res.data.data.url);
      message.success('图片上传成功');
    }
  } catch {
    message.error('图片上传失败');
  } finally {
    uploading.value = false;
  }
}

function removeImage(index: number) {
  imageUrls.value.splice(index, 1);
}

async function publish() {
  const content = form.value.content.trim();
  const price = form.value.price;
  if (!content || price === '' || price == null) {
    message.warning('请填写描述和价格');
    return;
  }
  if (content.length > 500) {
    message.warning('商品描述不能超过 500 字');
    return;
  }
  if (Number(price) <= 0) {
    message.warning('价格必须大于 0');
    return;
  }
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await api.publishGoods({
      content,
      price,
      user_id: userStore.user!.id,
      images: imageUrls.value,
    });
    if (res.data.code === 200) {
      message.success('发布成功');
      router.push('/');
    } else {
      message.error(res.data.msg);
    }
  } catch (e) {
    message.error(getApiErrorMessage(e, '发布失败'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="page-container">
    <a-page-header title="发布商品" @back="router.back()" />

    <a-card class="publish-card">
      <a-form layout="vertical">
        <a-form-item label="商品图片（最多9张）">
          <div class="upload-list">
            <div v-for="(url, i) in imageUrls" :key="i" class="upload-item">
              <img :src="assetUrl(url)" :alt="`商品图片 ${i + 1}`" />
              <a-button size="small" danger @click="removeImage(i)">删除</a-button>
            </div>
            <a-upload
              v-if="imageUrls.length < 9"
              list-type="picture-card"
              :show-upload-list="false"
              :before-upload="beforeUpload"
              @change="handleUpload"
            >
              <div v-if="uploading"><LoadingOutlined /></div>
              <div v-else><PlusOutlined /><div>上传</div></div>
            </a-upload>
          </div>
        </a-form-item>
        <a-form-item label="商品描述" required>
          <a-textarea
            v-model:value="form.content"
            :rows="4"
            placeholder="描述商品成色、使用情况等"
            :maxlength="500"
            show-count
          />
        </a-form-item>
        <a-form-item label="价格（元）" required>
          <a-input-number
            v-model:value="form.price"
            :min="0.01"
            :max="999999"
            :precision="2"
            style="width: 100%"
          />
        </a-form-item>
        <a-button type="primary" size="large" :loading="loading" :disabled="loading" @click="publish">
          发布商品
        </a-button>
      </a-form>
    </a-card>
  </div>
</template>

<style scoped>
.upload-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.upload-item {
  width: 104px;
  text-align: center;
}

.upload-item img {
  width: 104px;
  height: 104px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--border-input);
}

.publish-card {
  max-width: 640px;
}

@media (max-width: 575px) {
  .publish-card {
    max-width: none;
  }

  .upload-item,
  .upload-item img {
    width: 88px;
    height: 88px;
  }
}
</style>
