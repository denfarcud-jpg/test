import { defineStore } from 'pinia';
import api from '@/services/axiosApiClient.ts';

export interface Partner {
  id: number;
  name: string;
}

export const usePartnerStore = defineStore('partner', {
  state: () => ({
    partners: [] as Partner[],
    loading: false,
  }),

  actions: {
    async fetchPartners() {
      if (this.partners.length > 0) return;

      this.loading = true;
      try {
        const { data } = await api.get('/partner');
        this.partners = data;
      } catch (error) {
        console.error('Ошибка загрузки партнеров:', error);
      } finally {
        this.loading = false;
      }
    },
  },
});
