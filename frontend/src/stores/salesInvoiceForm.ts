import { defineStore } from 'pinia';
import apiClient from '@/services/axiosApiClient';
import { useOrganizationStore } from './organizations';
import { usePartnerStore } from './partners';
import { useProductStore } from './products';
import { createSalesInvoice, updateSalesInvoice } from '@/api/salesInvoices.ts';


export interface SalesInvoiceItemForm {
  _tempId: string;
  id?: number;
  productId: number | null;
  productName?: string;
  countProduct: number;
  unit: string;
  priceProduct: number;
  countLocation: number;
  amount?: number;
}

export const useSalesInvoiceFormStore = defineStore('salesInvoiceForm', {
  state: () => ({
    id: null as number | null,
    numShipment: '',
    dateShipment: new Date().toISOString().substr(0, 10),

    partnerId: null as number | null,
    partnerName: '',

    organizationId: null as number | null,
    orgName: '',

    storeId: null as number | null,
    bitrixDealId: null as number | null,

    responsible: 'Текущий Пользователь',
    status: 'Черновик',
    dateConducted: null as string | null,

    items: [] as SalesInvoiceItemForm[],

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
      this.numShipment = `OUT-${new Date().getTime()}`;
      this.dateShipment = new Date().toISOString().substr(0, 10);
      this.partnerId = null;
      this.partnerName = '';
      this.organizationId = null;
      this.orgName = '';
      this.storeId = null;
      this.bitrixDealId = null;
      this.responsible = 'Текущий Пользователь';
      this.status = 'Черновик';
      this.dateConducted = null;
      this.items = [];
    },

    async loadInvoice(id: number) {
      this.loading = true;
      const productStore = useProductStore();
      const partnerStore = usePartnerStore();

      try {
        const { data } = await apiClient.get(`/sales-invoice/${id}`);

        this.id = data.id;
        this.numShipment = data.numShipment || '';
        this.dateShipment = data.dateShipment ? data.dateShipment.substr(0, 10) : '';

        this.partnerId = data.bitrixPartnerId;
        this.partnerName = data.partnerName;

        if (this.partnerId && this.partnerName) {
            const exists = partnerStore.partners.find(p => p.id === this.partnerId);
            if (!exists) {
                partnerStore.partners.push({ id: this.partnerId, name: this.partnerName });
            }
        }

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
        console.error('Ошибка загрузки реализации:', e);
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

    removeItems(itemsToRemove: SalesInvoiceItemForm[]) {
      const idsToRemove = new Set(itemsToRemove.map(i => i._tempId));
      this.items = this.items.filter(item => !idsToRemove.has(item._tempId));
    },

    async save(targetStatus?: string) {
      this.saving = true;
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

        let currentPartnerName = this.partnerName;
        if (this.partnerId) {
            const p = partnerStore.partners.find(x => x.id === this.partnerId);
            if (p) currentPartnerName = p.name;
        }

        const payload = {
          numShipment: this.numShipment,
          dateShipment: new Date(this.dateShipment).toISOString(),
          bitrixPartnerId: this.partnerId,
          partnerName: currentPartnerName,
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
          responseData = await updateSalesInvoice(this.id, payload);

        } else {
          responseData = await createSalesInvoice(payload);
        }


        this.id = responseData.id;
        this.status = responseData.status;
        this.dateConducted = responseData.dateConducted;

        if (responseData.numShipment) {
           this.numShipment = responseData.numShipment;
        }

      } catch (e) {
        throw e;
      } finally {
        this.saving = false;
      }
    },

    async deleteInvoice() {
        if (!this.id) return;
        await apiClient.delete(`/sales-invoice/${this.id}`);
    }
  }
});
