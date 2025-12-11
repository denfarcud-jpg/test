import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchPostings } from '@/api/postings';

export const usePostingsStore = defineStore('postings', () => {
  const postings = ref<any[]>([]);
  const loading = ref(false);

  const filters = ref({
    dateStart: null,
    dateEnd: null,
    conductedStart: null,
    conductedEnd: null,
    status: null,
    storeId: null,
  });

  const loadPostings = async () => {
    loading.value = true;
    try {

      const params = Object.fromEntries(
        Object.entries(filters.value).filter(([_, v]) => v != null && v !== '')
      );


      postings.value = await fetchPostings(params);
    } catch (error) {
      console.error('Ошибка загрузки оприходований:', error);
    } finally {
      loading.value = false;
    }
  };

  return {
    postings,
    loading,
    filters,
    loadPostings
  };
});
