import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Antd from 'ant-design-vue';
import App from './App.vue';
import router from './router';
import { useUserStore } from './stores/user';
import 'ant-design-vue/dist/reset.css';
import './style.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(Antd);

const userStore = useUserStore();
userStore.init();

app.mount('#app');
