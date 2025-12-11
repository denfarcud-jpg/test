import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '@/services/axiosApiClient';

export const useSalesInvoicesStore = defineStore('salesInvoices', () => {
  const invoices = ref<any[]>([]);
  const loading = ref(false);


  const filters = ref({
    dateStart: null,
    dateEnd: null,
    conductedStart: null,
    conductedEnd: null,
    status: null,
    storeId: null,
  });

  const fetchInvoices = async () => {
    loading.value = true;
    try {

      const params = Object.fromEntries(
        Object.entries(filters.value).filter(([_, v]) => v != null && v !== '')
      );

      const { data } = await apiClient.get('/sales-invoice', { params });
      invoices.value = data;
    } catch (error) {
      console.error('Ошибка загрузки реализаций:', error);
    } finally {
      loading.value = false;
    }
  };

  return {
    invoices,
    loading,
    filters,
    fetchInvoices
  };
});
