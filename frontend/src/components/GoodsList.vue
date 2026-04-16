<script setup lang="ts">
defineProps<{
  goods: any[]
}>();

const emit = defineEmits(['view-goods']);

const viewGoods = (item: any) => {
  emit('view-goods', item);
};
</script>

<template>
  <div class="goods-list">
    <div v-for="item in goods" :key="item.id" class="goods-item" @click="viewGoods(item)">
      <p class="content">{{ item.content }}</p>
      <p class="price">¥{{ item.price }}</p>
      <p class="seller">卖家: {{ item.username }}</p>
      <span v-if="item.status === 2" class="sold-tag">已售</span>
    </div>
  </div>
</template>

<style scoped>
.goods-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.goods-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;
}

.goods-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.content {
  margin: 10px 0;
  color: #333;
}

.price {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
  margin: 10px 0;
}

.seller {
  color: #666;
  font-size: 14px;
}

.sold-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #999;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}
</style>

