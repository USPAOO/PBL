import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface User {
  id: number;
  username: string;
  avatar?: string;
  role?: number;
  status?: number;
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);

  const isLoggedIn = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 1);

  function init() {
    const saved = localStorage.getItem('user');
    if (saved) user.value = JSON.parse(saved);
  }

  function setUser(u: User) {
    user.value = u;
    localStorage.setItem('user', JSON.stringify(u));
  }

  function logout() {
    user.value = null;
    localStorage.removeItem('user');
  }

  return { user, isLoggedIn, isAdmin, init, setUser, logout };
});
