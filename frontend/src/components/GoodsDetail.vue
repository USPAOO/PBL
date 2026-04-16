<script setup lang="ts">
import axios from 'axios';

const props = defineProps<{
  goods: any,
  userId: number
}>();

const emit = defineEmits(['close', 'contact-seller', 'mark-sold']);
const API = 'http://localhost:3000/api';

const contactSeller = () => {
  emit('contact-seller', props.goods.user_id, props.goods.username);
};

const markAsSold = async () => {
  const res = await axios.put(`${API}/goods/${props.goods.id}/status`, { status: 2 });
  alert(res.data.msg);
  if (res.data.code === 200) {
    emit('mark-sold');
    emit('close');
  }
};
</script>

<template>
  <div class="modal" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <h3>商品详情</h3>
      <p>{{ goods.content }}</p>
      <p class="price">¥{{ goods.price }}</p>
      <p class="seller">卖家: {{ goods.username }}</p>
      <p class="status">{{ goods.status === 1 ? '在售' : '已售' }}</p>
      <button v-if="goods.user_id !== userId" @click="contactSeller">联系卖家</button>
      <button v-if="goods.user_id === userId && goods.status === 1" @click="markAsSold">标记已售</button>
      <button @click="emit('close')">关闭</button>
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

.modal-content button {
  margin: 10px 10px 0 0;
  padding: 10px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.price {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
  margin: 10px 0;
}

.seller, .status {
  color: #666;
  font-size: 14px;
}
</style>

