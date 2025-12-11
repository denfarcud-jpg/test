import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '@/services/axiosApiClient';

export const useWriteOffActsStore = defineStore('writeOffActs', () => {
  const documents = ref<any[]>([]);
  const loading = ref(false);

  const filters = ref({
    dateStart: null,
    dateEnd: null,
    conductedStart: null,
    conductedEnd: null,
    status: null,
    storeId: null,
  });

  const fetchDocuments = async () => {
    loading.value = true;
    try {
      const params = Object.fromEntries(
        Object.entries(filters.value).filter(([_, v]) => v != null && v !== '')
      );
      const { data } = await apiClient.get('/write-off-act', { params });
      documents.value = data;
    } catch (error) {
      console.error('Ошибка загрузки списаний:', error);
    } finally {
      loading.value = false;
    }
  };

  return {
    documents,
    loading,
    filters,
    fetchDocuments
  };
});
