<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { SearchOutlined } from '@ant-design/icons-vue';
import { api } from '../../api';
import { getApiErrorMessage } from '../../utils/api-error';
import { useUserStore } from '../../stores/user';
import FetchErrorAlert from '../../components/FetchErrorAlert.vue';

const userStore = useUserStore();
const users = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const keyword = ref('');

async function loadUsers() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.adminUsers(userStore.user!.id, {
      keyword: keyword.value.trim() || undefined,
    });
    if (res.data.code === 200) users.value = res.data.data;
    else error.value = res.data.msg || '加载失败';
  } catch (e) {
    error.value = getApiErrorMessage(e, '加载失败');
  } finally {
    loading.value = false;
  }
}

function toggleStatus(record: any) {
  const next = record.status === 1 ? 0 : 1;
  const action = next === 0 ? '禁用' : '启用';
  Modal.confirm({
    title: `确认${action}用户「${record.username}」？`,
    onOk: async () => {
      try {
        const res = await api.adminUpdateUserStatus(record.id, {
          admin_id: userStore.user!.id,
          status: next,
        });
        if (res.data.code === 200) {
          message.success(res.data.msg);
          loadUsers();
        } else message.error(res.data.msg);
      } catch (e) {
        message.error(getApiErrorMessage(e, '操作失败'));
      }
    },
  });
}

onMounted(loadUsers);
</script>

<template>
  <div>
    <div class="toolbar">
      <a-input-search
        v-model:value="keyword"
        placeholder="搜索用户名..."
        style="max-width: 280px"
        @search="loadUsers"
      >
        <template #prefix><SearchOutlined /></template>
      </a-input-search>
      <a-button @click="loadUsers">刷新</a-button>
    </div>

    <FetchErrorAlert v-if="error" :message="error" @retry="loadUsers" />

    <a-spin :spinning="loading">
      <a-table :data-source="users" :pagination="{ pageSize: 10 }" row-key="id">
        <a-table-column title="ID" data-index="id" width="70" />
        <a-table-column title="用户名" data-index="username" />
        <a-table-column title="角色" key="role" width="100">
          <template #default="{ record }">
            <a-tag :color="record.role === 1 ? 'green' : 'blue'">
              {{ record.role === 1 ? '管理员' : '普通用户' }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column title="状态" key="status" width="100">
          <template #default="{ record }">
            <a-tag :color="record.status === 1 ? 'success' : 'error'">
              {{ record.status === 1 ? '正常' : '已禁用' }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column title="注册时间" data-index="create_time" width="170" />
        <a-table-column title="操作" key="action" width="120">
          <template #default="{ record }">
            <a-button
              v-if="record.role !== 1"
              type="link"
              size="small"
              :danger="record.status === 1"
              @click="toggleStatus(record)"
            >
              {{ record.status === 1 ? '禁用' : '启用' }}
            </a-button>
            <span v-else class="muted">—</span>
          </template>
        </a-table-column>
      </a-table>
    </a-spin>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.muted {
  color: var(--text-secondary);
}
</style>
