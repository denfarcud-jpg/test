import { defineStore } from 'pinia';

export interface Product {
  id: number;
  name: string;
  unit: string;
  catalogId?: number;
  catalog?: {
    id: number;
    name: string;
  };
}

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as Product[],
    loading: false,
  }),

  actions: {

  },
});
