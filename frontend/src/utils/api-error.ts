import axios from 'axios';

export function getApiErrorMessage(err: unknown, fallback = '操作失败，请稍后重试'): string {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNABORTED') return '请求超时，请检查网络后重试';
    if (!err.response) return '网络连接失败，请检查网络后重试';
    const status = err.response.status;
    if (status === 401) return '登录已过期，请重新登录';
    if (status === 403) return '没有权限执行此操作';
    if (status === 404) return '请求的内容不存在';
    if (status === 429) return '操作过于频繁，请稍后再试';
    if (status >= 500) return '服务器繁忙，请稍后重试';
    const msg = err.response.data?.msg;
    if (typeof msg === 'string' && msg) return msg;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
