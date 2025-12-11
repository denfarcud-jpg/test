import { defineStore } from 'pinia';
import axiosClient from '@/services/axiosApiClient';

export const useOrganizationStore = defineStore('organization', {
  state: () => ({
    organizations: [] as any[],
    loading: false,
  }),
  actions: {
    async fetchOrganizations() {
      this.loading = true;
      try {
        const { data } = await axiosClient.get('/bitrix/my-organizations');
        this.organizations = data;
      } catch (e) {
        console.error('Ошибка загрузки организаций', e);
      } finally {
        this.loading = false;
      }
    }
  }
});
