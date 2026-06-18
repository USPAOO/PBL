<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { api } from '../../api';
import { getApiErrorMessage } from '../../utils/api-error';
import { useUserStore } from '../../stores/user';
import FetchErrorAlert from '../../components/FetchErrorAlert.vue';

const userStore = useUserStore();
const list = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const modalOpen = ref(false);
const editing = ref<any>(null);
const saving = ref(false);
const form = ref({ title: '', content: '', type: 'info', is_active: true });

const typeOptions = [
  { value: 'info', label: '普通通知', color: 'blue' },
  { value: 'announcement', label: '公告', color: 'green' },
  { value: 'warning', label: '警告', color: 'orange' },
];

function openCreate() {
  editing.value = null;
  form.value = { title: '', content: '', type: 'info', is_active: true };
  modalOpen.value = true;
}

function openEdit(record: any) {
  editing.value = record;
  form.value = {
    title: record.title,
    content: record.content,
    type: record.type,
    is_active: !!record.is_active,
  };
  modalOpen.value = true;
}

async function loadList() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.adminNotifications(userStore.user!.id);
    if (res.data.code === 200) list.value = res.data.data;
    else error.value = res.data.msg || '加载失败';
  } catch (e) {
    error.value = getApiErrorMessage(e, '加载失败');
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    message.warning('请填写标题和内容');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      admin_id: userStore.user!.id,
      title: form.value.title,
      content: form.value.content,
      type: form.value.type,
      is_active: form.value.is_active ? 1 : 0,
    };
    const res = editing.value
      ? await api.adminUpdateNotification(editing.value.id, payload)
      : await api.adminCreateNotification(payload);
    if (res.data.code === 200) {
      message.success(res.data.msg);
      modalOpen.value = false;
      loadList();
    } else message.error(res.data.msg);
  } catch (e) {
    message.error(getApiErrorMessage(e, '保存失败'));
  } finally {
    saving.value = false;
  }
}

function remove(record: any) {
  Modal.confirm({
    title: '确认删除该通知？',
    okType: 'danger',
    onOk: async () => {
      try {
        const res = await api.adminDeleteNotification(record.id, userStore.user!.id);
        if (res.data.code === 200) {
          message.success(res.data.msg);
          loadList();
        } else message.error(res.data.msg);
      } catch (e) {
        message.error(getApiErrorMessage(e, '删除失败'));
      }
    },
  });
}

function typeLabel(type: string) {
  return typeOptions.find(t => t.value === type)?.label || type;
}

function typeColor(type: string) {
  return typeOptions.find(t => t.value === type)?.color || 'default';
}

onMounted(loadList);
</script>

<template>
  <div>
    <div class="toolbar">
      <a-button type="primary" @click="openCreate"><PlusOutlined /> 发布通知</a-button>
      <a-button @click="loadList">刷新</a-button>
    </div>

    <FetchErrorAlert v-if="error" :message="error" @retry="loadList" />

    <a-spin :spinning="loading">
      <a-table :data-source="list" :pagination="{ pageSize: 8 }" row-key="id">
        <a-table-column title="标题" data-index="title" />
        <a-table-column title="类型" key="type" width="100">
          <template #default="{ record }">
            <a-tag :color="typeColor(record.type)">{{ typeLabel(record.type) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="状态" key="is_active" width="90">
          <template #default="{ record }">
            <a-tag :color="record.is_active ? 'success' : 'default'">
              {{ record.is_active ? '展示中' : '已隐藏' }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column title="发布时间" data-index="create_time" width="170" />
        <a-table-column title="操作" key="action" width="140">
          <template #default="{ record }">
            <a-space>
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <a-button type="link" danger size="small" @click="remove(record)">删除</a-button>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-spin>

    <a-modal
      v-model:open="modalOpen"
      :title="editing ? '编辑通知' : '发布通知'"
      :confirm-loading="saving"
      ok-text="保存"
      @ok="save"
    >
      <a-form layout="vertical">
        <a-form-item label="标题" required>
          <a-input v-model:value="form.title" placeholder="通知标题" :maxlength="100" show-count />
        </a-form-item>
        <a-form-item label="内容" required>
          <a-textarea v-model:value="form.content" placeholder="通知正文" :rows="4" :maxlength="500" show-count />
        </a-form-item>
        <a-form-item label="类型">
          <a-select v-model:value="form.type">
            <a-select-option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="是否展示">
          <a-switch v-model:checked="form.is_active" checked-children="展示" un-checked-children="隐藏" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}
</style>
