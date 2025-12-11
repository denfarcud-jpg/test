import { defineStore } from 'pinia';
import apiClient from '@/services/axiosApiClient';
import { useOrganizationStore } from './organizations';
import { useProductStore } from './products';

export interface WriteOffItemForm {
  _tempId: string;
  id?: number;
  productId: number | null;
  productName?: string;
  countProduct: number;
  unit: string;
  priceProduct: number;
  countLocation: number;
}

export const useWriteOffFormStore = defineStore('writeOffForm', {
  state: () => ({
    id: null as number | null,

    numCancellation: '',
    dateCancellation: new Date().toISOString().substr(0, 10),

    organizationId: null as number | null,
    orgName: '',

    storeId: null as number | null,
    bitrixDealId: null as number | null,

    responsible: 'Текущий Пользователь',
    status: 'Черновик',
    dateConducted: null as string | null,

    items: [] as WriteOffItemForm[],

    loading: false,
    saving: false,
  }),

  getters: {
    totalSum(state): number {
      return state.items.reduce((sum, item) => {
        return sum + (item.countProduct * item.priceProduct);
      }, 0);
    },
    totalLocations(state): number {
      return state.items.reduce((sum, item) => sum + Number(item.countLocation), 0);
    }
  },

  actions: {
    resetForm() {
      this.id = null;
      this.numCancellation = `WO-${new Date().getTime()}`;
      this.dateCancellation = new Date().toISOString().substr(0, 10);
      this.organizationId = null;
      this.orgName = '';
      this.storeId = null;
      this.bitrixDealId = null;
      this.responsible = 'Текущий Пользователь';
      this.status = 'Черновик';
      this.dateConducted = null;
      this.items = [];
    },

    async loadDocument(id: number) {
      this.loading = true;
      const productStore = useProductStore();

      try {
        const { data } = await apiClient.get(`/write-off-act/${id}`);

        this.id = data.id;
        this.numCancellation = data.numCancellation || '';
        this.dateCancellation = data.dateCancellation ? data.dateCancellation.substr(0, 10) : '';

        this.organizationId = data.bitrixOrgId;
        this.orgName = data.orgName;

        this.storeId = data.storeId;
        this.bitrixDealId = data.bitrixDealId;
        this.responsible = data.responsible;
        this.status = data.status;
        this.dateConducted = data.dateConducted;

        if (data.items && data.items.length > 0) {
          data.items.forEach((item: any) => {
            if (item.bitrixProductId) {
              const exists = productStore.products.find(p => p.id === item.bitrixProductId);
              if (!exists) {
                productStore.products.push({
                  id: item.bitrixProductId,
                  name: item.productName,
                  unit: item.unit,
                  catalogId: 0
                });
              }
            }
          });
        }

        this.items = data.items.map((item: any) => ({
          _tempId: crypto.randomUUID(),
          id: item.id,
          productId: item.bitrixProductId,
          productName: item.productName,
          countProduct: Number(item.countProduct),
          unit: item.unit,
          priceProduct: Number(item.priceProduct),
          countLocation: Number(item.countLocation),
        }));
      } catch (e) {
        console.error('Ошибка загрузки акта списания:', e);
      } finally {
        this.loading = false;
      }
    },

    addItem() {
      this.items.push({
        _tempId: crypto.randomUUID(),
        productId: null,
        productName: '',
        countProduct: 1,
        unit: 'шт',
        priceProduct: 0,
        countLocation: 0,
      });
    },

    removeItems(itemsToRemove: WriteOffItemForm[]) {
      const idsToRemove = new Set(itemsToRemove.map(i => i._tempId));
      this.items = this.items.filter(item => !idsToRemove.has(item._tempId));
    },

    async save(targetStatus?: string) {
      this.saving = true;
      const orgStore = useOrganizationStore();

      try {
        let nextStatus = this.status;
        let nextDateConducted = this.dateConducted;

        if (targetStatus) {
          nextStatus = targetStatus;
          if (targetStatus === 'Проведен' && !nextDateConducted) {
            nextDateConducted = new Date().toISOString();
          } else if (targetStatus === 'Черновик') {
            nextDateConducted = null;
          }
        }

        const selectedOrg = orgStore.organizations.find(o => o.id === this.organizationId);

        const payload = {
          numCancellation: this.numCancellation,
          dateCancellation: new Date(this.dateCancellation).toISOString(),

          bitrixOrgId: this.organizationId,
          orgName: selectedOrg?.name || this.orgName || '',

          storeId: this.storeId,
          bitrixDealId: this.bitrixDealId ? Number(this.bitrixDealId) : null,

          responsible: this.responsible,
          status: nextStatus,
          dateConducted: nextDateConducted,
          totalSum: this.totalSum,

          items: this.items.map(item => ({
            bitrixProductId: item.productId,
            productName: item.productName || 'Товар',
            countProduct: item.countProduct,
            unit: item.unit,
            priceProduct: item.priceProduct,
            countLocation: item.countLocation
          }))
        };

        let responseData;
        if (this.id) {
          const res = await apiClient.patch(`/write-off-act/${this.id}`, payload);
          responseData = res.data;
        } else {
          const res = await apiClient.post('/write-off-act', payload);
          responseData = res.data;
        }

        this.id = responseData.id;
        this.status = responseData.status;
        this.dateConducted = responseData.dateConducted;

        if (responseData.numCancellation) {
          this.numCancellation = responseData.numCancellation;
        }

      } catch (e) {
        throw e;
      } finally {
        this.saving = false;
      }
    },

    async deleteDocument() {
      if (!this.id) return;
      await apiClient.delete(`/write-off-act/${this.id}`);
    }
  }
});
