import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface User {
  id: number;
  username: string;
  avatar?: string;
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);

  const isLoggedIn = computed(() => !!user.value);

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

  return { user, isLoggedIn, init, setUser, logout };
});
