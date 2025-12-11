import { defineStore } from 'pinia';
import { ref } from 'vue';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

export const useNotificationStore = defineStore('notification', () => {
  const show = ref(false);
  const text = ref('');
  const color = ref('success');

  function notify(message: string, type: NotificationType = 'success') {
    text.value = message;
    color.value = type;
    show.value = true;
  }

  return { show, text, color, notify };
});
