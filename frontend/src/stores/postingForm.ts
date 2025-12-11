import { defineStore } from 'pinia';
import { useOrganizationStore } from './organizations';
import { createPosting, updatePosting, getPostingById } from '@/api/postings.ts';
import { useProductStore } from './products';

export interface PostingItemForm {
  _tempId: string;
  productId: number | null;
  productName?: string;
  countProduct: number;
  unit: string;
  priceProduct: number;
  countLocation: number;
  id?: number;
}

export const usePostingFormStore = defineStore('postingForm', {
  state: () => ({
    id: null as number | null,
    numPosting: '',
    datePosting: new Date().toISOString().substr(0, 10),
    organizationId: null as number | null,
    storeId: null as number | null,
    responsible: '',
    status: 'Черновик',
    bitrixDealId: null as number | null,
    items: [] as PostingItemForm[],
    dateConducted: null as string | null,
    loading: false,
    saving: false,
    invalidItemIds: [] as number[],
  }),

  getters: {
    totalSum(state): number {
      return state.items.reduce((sum, item) => sum + (item.countProduct * item.priceProduct), 0);
    },
    totalLocations(state): number {
      return state.items.reduce((sum, item) => sum + Number(item.countLocation), 0);
    }
  },

  actions: {
    resetForm() {
      this.id = null;
      this.numPosting = `POST-${new Date().getTime()}`;
      this.datePosting = new Date().toISOString().substr(0, 10);
      this.organizationId = null;
      this.storeId = null;
      this.responsible = 'Текущий Пользователь';
      this.dateConducted = null;
      this.status = 'Черновик';
      this.bitrixDealId = null;
      this.items = [];
      this.invalidItemIds = [];
    },

    async loadPosting(id: number) {
      this.loading = true;
      this.invalidItemIds = [];
      const productStore = useProductStore();

      try {
        const data = await getPostingById(id);
        this.id = data.id;
        this.numPosting = data.numPosting;
        this.datePosting = data.datePosting ? data.datePosting.substr(0, 10) : '';
        this.organizationId = data.bitrixOrgId;
        this.storeId = data.storeId;
        this.responsible = data.responsible;
        this.dateConducted = data.dateConducted;
        this.status = data.status;
        this.bitrixDealId = data.bitrixDealId;


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
          countLocation: item.countLocation,
        }));
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },

    addItem() {
      this.items.push({
        _tempId: crypto.randomUUID(),
        productId: null,
        countProduct: 1,
        unit: 'шт',
        priceProduct: 0,
        countLocation: 1,
        productName: '',
      });
    },

    removeItems(itemsToRemove: PostingItemForm[]) {
      const idsToRemove = new Set(itemsToRemove.map(i => i._tempId));
      this.items = this.items.filter(item => !idsToRemove.has(item._tempId));
    },

    async save(targetStatus?: string) {
      this.saving = true;
      this.invalidItemIds = [];
      const orgStore = useOrganizationStore();

      let nextStatus = targetStatus || this.status;
      let nextDateConducted = this.dateConducted;

      if (targetStatus === 'Проведен' && !nextDateConducted) {
        nextDateConducted = new Date().toISOString();
      } else if (targetStatus === 'Черновик') {
        nextDateConducted = null;
      }

      const selectedOrg = orgStore.organizations.find(o => o.id === this.organizationId);

      const payload = {
        numPosting: this.numPosting,
        datePosting: new Date(this.datePosting).toISOString(),
        dateConducted: nextDateConducted,
        bitrixOrgId: this.organizationId,
        orgName: selectedOrg?.name || '',
        storeId: this.storeId,
        responsible: this.responsible,
        status: nextStatus,
        totalSum: this.totalSum,
        bitrixDealId: this.bitrixDealId ? Number(this.bitrixDealId) : null,
        items: this.items.map(item => ({
          bitrixProductId: item.productId,
          productName: item.productName || 'Товар',
          countProduct: item.countProduct,
          unit: item.unit,
          priceProduct: item.priceProduct,
          countLocation: item.countLocation
        }))
      };

      try {
        let responseData;
        if (this.id) {
          responseData = await updatePosting(this.id, payload);
        } else {
          responseData = await createPosting(payload);
        }

        if (responseData.warnings?.length) {
          this.invalidItemIds = responseData.warnings;
        }

        this.status = responseData.status;
        this.dateConducted = responseData.dateConducted;
        this.id = responseData.id;

        return true;
      } catch (e: any) {
        if (e.response?.data?.failedIds) {
          this.invalidItemIds = e.response.data.failedIds;
        }
        throw e;
      } finally {
        this.saving = false;
      }
    },

    async unconduct() { await this.save('Черновик'); }
  }
});
