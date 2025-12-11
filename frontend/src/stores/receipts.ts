import { defineStore } from 'pinia';
import api from '@/services/axiosApiClient.ts';


interface ReceiptFilters {
  dateStart?: string | null;
  dateEnd?: string | null;
  conductedStart?: string | null;
  conductedEnd?: string | null;
  status?: string | null;
  storeId?: number | null;
}

export const useReceiptsStore = defineStore('receipts', {
  state: () => ({
    receipts: [] as any[],
    loading: false,
    filters: {
      dateStart: null,
      dateEnd: null,
      conductedStart: null,
      conductedEnd: null,
      status: null,
      storeId: null,
    } as ReceiptFilters,
  }),

  actions: {
    async fetchReceipts() {
      this.loading = true;
      try {
        const params = Object.fromEntries(
          Object.entries(this.filters).filter(([_, v]) => v != null && v !== '')
        );
        const response = await api.get('/receipt', { params });
        this.receipts = response.data;
      } catch (error) {
        console.error('Ошибка загрузки приходов:', error);
      } finally {
        this.loading = false;
      }
    },
  },
});
