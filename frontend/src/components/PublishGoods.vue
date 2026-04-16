<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const props = defineProps<{
  userId: number
}>();

const emit = defineEmits(['close', 'published']);
const API = 'http://localhost:3000/api';
const publishForm = ref({ content: '', price: '' });

const publishGoods = async () => {
  const res = await axios.post(`${API}/goods`, {
    content: publishForm.value.content,
    price: publishForm.value.price,
    user_id: props.userId
  });
  alert(res.data.msg);
  if (res.data.code === 200) {
    publishForm.value = { content: '', price: '' };
    emit('published');
    emit('close');
  }
};
</script>

<template>
  <div class="modal" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <h3>发布商品</h3>
      <textarea v-model="publishForm.content" placeholder="商品描述"></textarea>
      <input v-model="publishForm.price" type="number" placeholder="价格" />
      <button @click="publishGoods">发布</button>
      <button @click="emit('close')">取消</button>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content input,
.modal-content textarea {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.modal-content textarea {
  min-height: 100px;
}

.modal-content button {
  margin: 10px 10px 0 0;
  padding: 10px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>

