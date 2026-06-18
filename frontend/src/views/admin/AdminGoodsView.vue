<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { SearchOutlined } from '@ant-design/icons-vue';
import { api, assetUrl } from '../../api';
import { getApiErrorMessage } from '../../utils/api-error';
import { formatPrice } from '../../utils/format';
import { useUserStore } from '../../stores/user';
import FetchErrorAlert from '../../components/FetchErrorAlert.vue';
import SafeImage from '../../components/SafeImage.vue';

const userStore = useUserStore();
const goods = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const keyword = ref('');
const statusFilter = ref<string>('');

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: '1', label: '在售' },
  { value: '2', label: '已售' },
  { value: '3', label: '已下架' },
];

async function loadGoods() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.adminGoods(userStore.user!.id, {
      keyword: keyword.value.trim() || undefined,
      status: statusFilter.value,
    });
    if (res.data.code === 200) goods.value = res.data.data;
    else error.value = res.data.msg || '加载失败';
  } catch (e) {
    error.value = getApiErrorMessage(e, '加载失败');
  } finally {
    loading.value = false;
  }
}

function removeGoods(item: any) {
  Modal.confirm({
    title: '确认下架该商品？',
    content: `「${item.content}」将从平台移除展示`,
    okType: 'danger',
    onOk: async () => {
      try {
        const res = await api.adminDeleteGoods(item.id, userStore.user!.id);
        if (res.data.code === 200) {
          message.success(res.data.msg);
          loadGoods();
        } else message.error(res.data.msg);
      } catch (e) {
        message.error(getApiErrorMessage(e, '操作失败'));
      }
    },
  });
}

async function restoreGoods(item: any) {
  try {
    const res = await api.adminUpdateGoods(item.id, { admin_id: userStore.user!.id, status: 1 });
    if (res.data.code === 200) {
      message.success('已恢复上架');
      loadGoods();
    } else message.error(res.data.msg);
  } catch (e) {
    message.error(getApiErrorMessage(e, '操作失败'));
  }
}

onMounted(loadGoods);
</script>

<template>
  <div>
    <div class="toolbar">
      <a-input-search
        v-model:value="keyword"
        placeholder="搜索商品或卖家..."
        style="max-width: 280px"
        @search="loadGoods"
      >
        <template #prefix><SearchOutlined /></template>
      </a-input-search>
      <a-select v-model:value="statusFilter" style="width: 140px" @change="loadGoods">
        <a-select-option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </a-select-option>
      </a-select>
      <a-button @click="loadGoods">刷新</a-button>
    </div>

    <FetchErrorAlert v-if="error" :message="error" @retry="loadGoods" />

    <a-spin :spinning="loading">
      <a-table
        :data-source="goods"
        :pagination="{ pageSize: 10 }"
        row-key="id"
        :scroll="{ x: 800 }"
      >
        <a-table-column title="商品" key="content" data-index="content">
          <template #default="{ record }">
            <div class="goods-cell">
              <SafeImage
                v-if="record.images?.[0]"
                :src="assetUrl(record.images[0])"
                :alt="record.content"
                img-class="thumb"
                placeholder-class="thumb placeholder"
              />
              <div v-else class="thumb placeholder">图</div>
              <span class="text-break">{{ record.content }}</span>
            </div>
          </template>
        </a-table-column>
        <a-table-column title="价格" key="price" width="100">
          <template #default="{ record }">¥{{ formatPrice(record.price) }}</template>
        </a-table-column>
        <a-table-column title="卖家" key="username" data-index="username" width="100" />
        <a-table-column title="状态" key="status" width="90">
          <template #default="{ record }">
            <a-tag :color="record.status === 1 ? 'green' : record.status === 2 ? 'default' : 'red'">
              {{ record.status_text }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column title="操作" key="action" width="160">
          <template #default="{ record }">
            <a-space>
              <a-button v-if="record.status !== 3" type="link" danger size="small" @click="removeGoods(record)">
                下架
              </a-button>
              <a-button v-if="record.status === 3" type="link" size="small" @click="restoreGoods(record)">
                恢复
              </a-button>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-spin>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.goods-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.thumb.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--neutral-muted);
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
