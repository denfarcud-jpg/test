import { defineStore } from 'pinia';
import api from '@/services/axiosApiClient.ts';

export const useWarehouseStore = defineStore('warehouse', {
  state: () => ({
    stores: [] as any[],
    residues: [] as any[],
    loading: false,
  }),

  actions: {

    async fetchStores() {
      try {
        const response = await api.get('/store');
        this.stores = response.data;
      } catch (error) {
        console.error('Ошибка загрузки складов:', error);
      }
    },


    async fetchResidues(storeId: number) {
      this.loading = true;
      try {

        const response = await api.get(`/reports/residues?storeId=${storeId}`);
        this.residues = response.data;
      } catch (error) {
        console.error('Ошибка формирования отчета:', error);
        this.residues = [];
      } finally {
        this.loading = false;
      }
    },
  },
});
