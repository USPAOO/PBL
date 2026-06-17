import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api';
import { getApiErrorMessage } from '../utils/api-error';
import { useUserStore } from './user';

export const useCartStore = defineStore('cart', () => {
  const items = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchCart() {
    const userStore = useUserStore();
    if (!userStore.user) return;
    loading.value = true;
    error.value = null;
    try {
      const res = await api.getCart(userStore.user.id);
      if (res.data.code === 200) items.value = res.data.data;
      else error.value = res.data.msg || '加载购物车失败';
    } catch (e) {
      error.value = getApiErrorMessage(e, '加载购物车失败');
    } finally {
      loading.value = false;
    }
  }

  async function addToCart(goodsId: number) {
    const userStore = useUserStore();
    if (!userStore.user) return { ok: false, msg: '请先登录' };
    try {
      const res = await api.addToCart({ user_id: userStore.user.id, goods_id: goodsId });
      if (res.data.code === 200) await fetchCart();
      return { ok: res.data.code === 200, msg: res.data.msg };
    } catch (e) {
      return { ok: false, msg: getApiErrorMessage(e, '加入购物车失败') };
    }
  }

  return { items, loading, error, fetchCart, addToCart };
});
