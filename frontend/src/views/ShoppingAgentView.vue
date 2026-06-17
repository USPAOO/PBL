<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { RobotOutlined, SendOutlined, ShoppingOutlined } from '@ant-design/icons-vue';
import { api, assetUrl } from '../api';
import { formatPrice } from '../utils/format';
import SafeImage from '../components/SafeImage.vue';

const router = useRouter();
interface Message {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: any[];
  retryPrompt?: string;
}

const messages = ref<Message[]>([
  { role: 'assistant', content: '你好！我是校园二手购物助手 🛒\n\n我可以帮你推荐商品、解答购买流程。试试问我："推荐一些好物"' },
]);
const input = ref('');
const loading = ref(false);
const listRef = ref<HTMLElement | null>(null);

const quickQuestions = ['推荐一些好物', '有什么便宜的', '怎么购买'];

async function send(text?: string) {
  const msg = text || input.value.trim();
  if (!msg || loading.value) return;

  messages.value.push({ role: 'user', content: msg });
  input.value = '';
  loading.value = true;
  await scrollToBottom();

  try {
    const history = messages.value.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
    const res = await api.agentChat({ message: msg, history });
    if (res.data.code === 200) {
      messages.value.push({
        role: 'assistant',
        content: res.data.data.reply,
        recommendations: res.data.data.recommendations,
      });
    } else {
      messages.value.push({ role: 'assistant', content: res.data.msg || '抱歉，暂时无法回答，请稍后再试。' });
    }
  } catch {
    messages.value.push({
      role: 'assistant',
      content: '抱歉，服务暂时不可用。请检查网络连接后重试。',
      retryPrompt: msg,
    });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
}

async function scrollToBottom() {
  await nextTick();
  if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
}
</script>

<template>
  <div class="page-container agent-page">
    <a-card class="agent-card">
      <div class="agent-header">
        <RobotOutlined class="agent-icon" />
        <div>
          <h2>购物智能助手</h2>
          <p>AI 帮你发现校园好物，解答购物疑问</p>
        </div>
      </div>

      <div ref="listRef" class="chat-area">
        <div v-for="(msg, i) in messages" :key="i" :class="['msg-row', msg.role]">
          <a-avatar v-if="msg.role === 'assistant'" :style="{ background: 'var(--primary-hex)' }">
            <RobotOutlined />
          </a-avatar>
          <div class="msg-content">
            <div class="msg-bubble text-break" v-html="msg.content.replace(/\n/g, '<br>')" />
            <a-button v-if="msg.retryPrompt" size="small" type="link" class="retry-btn" @click="send(msg.retryPrompt)">
              重试
            </a-button>
            <div v-if="msg.recommendations?.length" class="recommendations">
              <div v-for="item in msg.recommendations" :key="item.id" class="rec-card" @click="router.push(`/goods/${item.id}`)">
                <SafeImage
                  v-if="item.images?.[0]"
                  :src="assetUrl(item.images[0])"
                  :alt="item.content"
                  img-class="rec-thumb"
                  placeholder-class="rec-thumb thumb-placeholder"
                />
                <div v-else class="rec-thumb thumb-placeholder" aria-hidden="true">图</div>
                <div class="rec-info min-w-0">
                  <div class="text-break">{{ item.content }}</div>
                  <span class="price-text">¥{{ formatPrice(item.price) }}</span>
                </div>
                <ShoppingOutlined />
              </div>
            </div>
          </div>
        </div>
        <div v-if="loading" class="typing">助手正在思考...</div>
      </div>

      <div class="quick-btns">
        <a-tag v-for="q in quickQuestions" :key="q" class="quick-tag" @click="send(q)">{{ q }}</a-tag>
      </div>

      <div class="input-area">
        <a-input
          v-model:value="input"
          placeholder="问我校园好物..."
          size="large"
          :maxlength="500"
          :disabled="loading"
          @press-enter="send()"
        />
        <a-button type="primary" size="large" :loading="loading" @click="send()">
          <SendOutlined />
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.agent-page {
  max-width: 800px;
}

.agent-card {
  border-radius: 16px;
  overflow: hidden;
}

.agent-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 20px;
}

.agent-icon {
  font-size: 40px;
  color: var(--primary);
}

.agent-header h2 {
  margin: 0;
  font-size: 20px;
}

.agent-header p {
  margin: 4px 0 0;
  color: var(--text-secondary);
}

.chat-area {
  height: 420px;
  overflow-y: auto;
  padding: 8px;
  margin-bottom: 16px;
}

.msg-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.msg-row.user {
  flex-direction: row-reverse;
}

.msg-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 480px;
  line-height: 1.6;
}

.msg-row.assistant .msg-bubble {
  background: var(--primary-light);
}

.msg-row.user .msg-bubble {
  background: var(--primary);
  color: var(--surface);
}

.recommendations {
  margin-top: 12px;
}

.rec-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  margin-top: 8px;
  cursor: pointer;
  transition: box-shadow 0.2s;
  min-height: 44px;
}

@media (hover: hover) {
  .rec-card:hover {
    box-shadow: var(--shadow);
  }
}

@media (hover: none) {
  .rec-card:active {
    box-shadow: var(--shadow);
  }
}

.rec-card img,
.rec-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.rec-info {
  flex: 1;
  min-width: 0;
}

.retry-btn {
  padding-left: 0;
  margin-top: 4px;
}

.quick-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.quick-tag {
  cursor: pointer;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
}

.input-area {
  display: flex;
  gap: var(--space-sm);
}

.input-area .ant-input {
  min-height: 44px;
  font-size: 16px;
}

.input-area .ant-btn {
  min-width: 52px;
  min-height: 44px;
  flex-shrink: 0;
}

@media (max-width: 575px) {
  .agent-header h2 {
    font-size: 18px;
  }

  .msg-bubble {
    max-width: 85%;
  }
}

.typing {
  color: var(--text-secondary);
  font-size: 13px;
  padding: 8px;
}
</style>
