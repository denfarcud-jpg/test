import { defineStore } from 'pinia';
import axiosClient from '@/services/axiosApiClient.ts';
import { useOrganizationStore } from './organizations';
import { usePartnerStore } from './partners';
import { useProductStore } from './products';
import { createReceipt, updateReceipt } from '@/api/receipts.ts';

export interface ReceiptItemForm {
  _tempId: string;
  productId: number | null;
  countProduct: number;
  unit: string;
  priceProduct: number;
  countLocation: number;
  productName?: string;
  amount?: number;
  id?: number;
  bitrixProductId?: number;
}

export const useReceiptFormStore = defineStore('receiptForm', {
  state: () => ({
    id: null as number | null,
    numReceipt: '',
    dateReceipt: new Date().toISOString().substr(0, 10),
    partnerId: null as number | null,
    partnerName: '',
    organizationId: null as number | null,
    storeId: null as number | null,
    responsible: '',
    status: 'Черновик',
    items: [] as ReceiptItemForm[],
    dateConducted: null as string | null,
    loading: false,
    saving: false,


    invalidItemIds: [] as number[],
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
      this.numReceipt = `IN-${new Date().getTime()}`;
      this.dateReceipt = new Date().toISOString().substr(0, 10);
      this.partnerId = null;
      this.partnerName = '';
      this.organizationId = null;
      this.storeId = null;
      this.responsible = 'Текущий Пользователь';
      this.dateConducted = null;
      this.status = 'Черновик';
      this.items = [];
      this.invalidItemIds = [];
    },

    async loadReceipt(id: number) {
      this.loading = true;
      this.invalidItemIds = [];
      const productStore = useProductStore();

      try {
        const { data } = await axiosClient.get(`/receipt/${id}`);
        this.id = data.id;
        this.numReceipt = data.numReceipt;
        this.dateReceipt = data.dateReceipt ? data.dateReceipt.substr(0, 10) : '';

        this.partnerId = data.bitrixPartnerId;
        this.partnerName = data.partnerName;

        this.organizationId = data.bitrixOrgId;
        this.storeId = data.storeId;
        this.responsible = data.responsible;
        this.dateConducted = data.dateConducted;
        this.status = data.status;


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
        console.error('Ошибка загрузки документа:', e);
      } finally {
        this.loading = false;
      }
    },

    addItem() {
      this.items.push({
        _tempId: crypto.randomUUID(),
        productId: null,
        countProduct: 1,
        unit: 'кг',
        priceProduct: 0,
        countLocation: 1,
        productName: '',
      });
    },


    removeItems(itemsToRemove: ReceiptItemForm[]) {
      const idsToRemove = new Set(itemsToRemove.map(i => i._tempId));
      this.items = this.items.filter(item => !idsToRemove.has(item._tempId));
    },

    async save(targetStatus?: string) {
      this.saving = true;
      this.invalidItemIds = [];

      const orgStore = useOrganizationStore();
      const partnerStore = usePartnerStore();
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


        const selectedPartner = partnerStore.partners.find(p => p.id === this.partnerId);
        const finalPartnerName = selectedPartner?.name || this.partnerName || '';

        const payload = {
          numReceipt: this.numReceipt,
          dateReceipt: this.dateReceipt ? new Date(this.dateReceipt).toISOString() : new Date().toISOString(),
          dateConducted: nextDateConducted,
          bitrixPartnerId: this.partnerId,
          partnerName: finalPartnerName,
          bitrixOrgId: this.organizationId,
          orgName: selectedOrg?.name || '',
          storeId: this.storeId,
          responsible: this.responsible,
          status: nextStatus,
          totalSum: this.totalSum,
          items: this.items.map(item => ({
            bitrixProductId: item.productId,
            productName: item.productName || '',
            countProduct: item.countProduct,
            unit: item.unit,
            priceProduct: item.priceProduct,
            countLocation: item.countLocation
          }))
        };
        let responseData;
        if (this.id) {
           responseData  = await updateReceipt(this.id, payload);
        } else {
          responseData = await createReceipt(payload);
        }

        if (responseData?.warnings?.length > 0) {
          this.invalidItemIds = responseData.warnings;
        }


        if (responseData) {
            if (responseData.id) {
                this.id = responseData.id;
            }
            this.status = responseData.status;
            this.dateConducted = responseData.dateConducted;
        }

        return true;

      } catch (e: any) {

        if (e.response && e.response.data && e.response.data.failedIds) {
            this.invalidItemIds = e.response.data.failedIds;
        }
        throw e;
      } finally {
        this.saving = false;
      }
    },
    async unconduct() {
      await this.save('Черновик');
    }
  }
});
