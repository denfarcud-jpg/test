<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useSalesInvoiceFormStore } from '@/stores/salesInvoiceForm';
import { useWarehouseStore } from '@/stores/warehouse';
import { useOrganizationStore } from '@/stores/organizations';
import { useProductStore } from '@/stores/products';
import { usePartnerStore } from '@/stores/partners';
import { useNotificationStore } from '@/stores/notifications';
import { getErrorMessage } from '@/services/http-error';
import axiosClient from '@/services/axiosApiClient';


const emit = defineEmits(['close', 'refresh']);


const form = useSalesInvoiceFormStore();
const warehouseStore = useWarehouseStore();
const organizationStore = useOrganizationStore();
const productStore = useProductStore();
const partnerStore = usePartnerStore();
const notify = useNotificationStore();


const isDeleting = ref(false);
const deleteDialog = ref(false);
const selectedItems = ref<any[]>([]);


const partnerSearchQuery = ref('');
const isPartnerSearching = ref(false);
const foundBitrixPartners = ref<any[]>([]);
let partnerSearchTimeout: any = null;

const onPartnerSearchInput = (query: string) => {
  partnerSearchQuery.value = query;
  if (!query || query.length < 3) {
      foundBitrixPartners.value = [];
      return;
  }

  if (partnerSearchTimeout) clearTimeout(partnerSearchTimeout);

  partnerSearchTimeout = setTimeout(async () => {
    isPartnerSearching.value = true;
    try {
      const { data } = await axiosClient.post('/bitrix/search', { type: 'company', query });
      foundBitrixPartners.value = data;
    } catch (e) {
      console.error(e);
    } finally {
      isPartnerSearching.value = false;
    }
  }, 500);
};


const comboPartners = computed(() => {
  const local = partnerStore.partners.map(p => ({
      title: p.name,
      value: p.id,
      type: 'local'
  }));

  const external = foundBitrixPartners.value.map(bx => ({
      title: bx.TITLE,
      value: Number(bx.ID),
      type: 'bitrix',
      props: { subtitle: 'Битрикс24', prependIcon: 'mdi-cloud-download' }
  }));


  const externalFiltered = external.filter(e => !local.find(l => l.value === e.value));

  return [...local, ...externalFiltered];
});

const onPartnerSelect = (val: any) => {

    const found = comboPartners.value.find(p => p.value === val);
    if (found) {
        form.partnerId = found.value;
        form.partnerName = found.title;

        const exists = partnerStore.partners.find(p => p.id === val);
        if (!exists) {
            partnerStore.partners.push({ id: val, name: found.title });
        }
    } else {
        form.partnerId = val;
    }
};


const productSearchQuery = ref('');
const isProductSearching = ref(false);
const foundBitrixProducts = ref<any[]>([]);
let productSearchTimeout: any = null;

const onProductSearchInput = (query: string) => {
  productSearchQuery.value = query;
  if (!query || query.length < 3) {
      foundBitrixProducts.value = [];
      return;
  }
  if (productSearchTimeout) clearTimeout(productSearchTimeout);

  productSearchTimeout = setTimeout(async () => {
    isProductSearching.value = true;
    try {
      const { data } = await axiosClient.post('/bitrix/search', { type: 'product', query });
      foundBitrixProducts.value = data;
    } catch (e) {
      console.error(e);
    } finally {
      isProductSearching.value = false;
    }
  }, 500);
};

const comboProducts = computed(() => {
  const local = productStore.products.map(p => ({
    title: p.name,
    value: p.id,
    type: 'local'
  }));

  const external = foundBitrixProducts.value.map(bx => ({
    title: bx.NAME,
    value: Number(bx.ID),
    type: 'bitrix',
    props: { subtitle: 'Битрикс24', color: 'blue' },
    raw: bx
  }));

  return [...local, ...external];
});

const onProductSelect = (val: any, rowItem: any) => {
    if (!val) return;

    const bxProduct = foundBitrixProducts.value.find(p => Number(p.ID) === val);

    const localProduct = productStore.products.find(p => p.id === val);

    if (bxProduct) {

        rowItem.productId = Number(bxProduct.ID);
        rowItem.productName = bxProduct.NAME;
        rowItem.unit = bxProduct.MEASURE_NAME || 'шт';
        rowItem.priceProduct = bxProduct.PRICE ? Number(bxProduct.PRICE) : 0;

        const exists = productStore.products.find(p => p.id === rowItem.productId);
        if (!exists) {
            productStore.products.push({
                id: rowItem.productId,
                name: rowItem.productName,
                unit: rowItem.unit,
                catalogId: 0
            });
        }

    } else if (localProduct) {

        rowItem.productId = localProduct.id;
        rowItem.productName = localProduct.name;
        rowItem.unit = localProduct.unit;

    }
};


onMounted(() => {
  warehouseStore.fetchStores();
  organizationStore.fetchOrganizations();
});

watch(
  () => organizationStore.organizations,
  (orgs) => {
    if (!form.organizationId && orgs.length > 0) {
      const mainOrg = orgs.find(o => o.name.toLowerCase().includes('промрыбопродукт'));
      if (mainOrg) {
        form.organizationId = mainOrg.id;
        form.orgName = mainOrg.name;
      }
    }
  },
  { immediate: true }
);

const saveAndClose = async () => {
    if (form.items.length === 0) {
        notify.notify('Добавьте хотя бы один товар', 'warning');
        return;
    }
    try {
        await form.save('Проведен');
        notify.notify('Реализация проведена успешно', 'success');
        emit('refresh');
        emit('close');
    } catch (e) {
        const msg = getErrorMessage(e);
        notify.notify(msg, 'error');
    }
};


const onConduct = async () => {
    if (form.items.length === 0) {
        notify.notify('Добавьте хотя бы один товар', 'warning');
        return;
    }
    try {
        await form.save('Проведен');
        notify.notify('Реализация проведена успешно', 'success');
        emit('refresh');
    } catch (e) {
        const msg = getErrorMessage(e);
        notify.notify(msg, 'error');
    }
};

const saveDraft = async () => {
    try {
        await form.save('Черновик');
        notify.notify('Сохранено как черновик', 'success');
        emit('refresh');
    } catch (e) {
        const msg = getErrorMessage(e);
        notify.notify(msg, 'error');
    }
};

const onUnconduct = async () => {
    try {
        await form.save('Черновик');
        notify.notify('Документ распроведен', 'info');
        emit('refresh');
    } catch (e) {
        const msg = getErrorMessage(e);
        notify.notify(msg, 'error');
    }
};

const onDeleteClick = () => { deleteDialog.value = true; };
const confirmDelete = async () => {
    isDeleting.value = true;
    try {
        await form.deleteInvoice();
        notify.notify('Документ удален', 'success');
        emit('refresh');
        emit('close');
    } catch (e) {
        const msg = getErrorMessage(e);
        notify.notify(msg, 'error');
    } finally {
        isDeleting.value = false;
        deleteDialog.value = false;
    }
};

const removeSelected = () => {
    if (selectedItems.value.length === 0) return;
    form.removeItems(selectedItems.value);
    selectedItems.value = [];
};

const allSelected = computed({
    get: () => form.items.length > 0 && selectedItems.value.length === form.items.length,
    set: (val: boolean) => { selectedItems.value = val ? [...form.items] : []; }
});

const isReadonly = computed(() => form.status === 'Проведен');

</script>

<template>
  <v-card class="h-100 d-flex flex-column">
    <v-toolbar density="compact" color="blue-grey-lighten-5">
      <v-btn color="success" variant="elevated" class="mr-2" @click="saveAndClose" :loading="form.saving" :disabled="isReadonly">
        Провести и закрыть
      </v-btn>

      <v-btn color="primary" variant="text" class="mr-1" @click="onConduct" :loading="form.saving" :disabled="isReadonly">
        Провести
      </v-btn>
      <v-btn color="warning" variant="text" class="mr-1" @click="onUnconduct" :loading="form.saving" v-if="isReadonly">
        Распровести
      </v-btn>
      <v-btn variant="outlined" class="mr-2" @click="saveDraft" :loading="form.saving" :disabled="isReadonly">
        Сохранить
      </v-btn>

      <v-spacer></v-spacer>

      <v-btn color="error" variant="text" @click="onDeleteClick">Удалить</v-btn>
      <v-divider vertical inset class="mx-2"></v-divider>
      <v-btn icon="mdi-close" variant="text" @click="$emit('close')"></v-btn>
    </v-toolbar>

    <v-card-text class="flex-grow-1 overflow-y-auto pt-4">
      <v-row dense>
        <v-col cols="12" md="6">
            <v-autocomplete
                :model-value="form.partnerId"
                @update:model-value="onPartnerSelect"
                v-model:search="partnerSearchQuery"
                @update:search="onPartnerSearchInput"
                :items="comboPartners"
                :loading="isPartnerSearching"
                label="Покупатель (Поиск в Битрикс24)"
                placeholder="Начните вводить название..."
                variant="outlined"
                density="compact"
                :disabled="isReadonly"
                no-data-text="Введите мин. 3 символа"
                item-title="title"
                item-value="value"
                clearable
            >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :subtitle="item.raw.type === 'bitrix' ? 'Импортировать из Битрикс' : ''">
                    <template v-slot:prepend v-if="item.raw.type === 'bitrix'">
                      <v-icon color="blue">mdi-cloud-download</v-icon>
                    </template>
                  </v-list-item>
                </template>
            </v-autocomplete>
        </v-col>

        <v-col cols="12" md="6">
            <v-autocomplete
                v-model="form.organizationId"
                :items="organizationStore.organizations"
                item-title="name"
                item-value="id"
                label="Организация"
                variant="outlined"
                density="compact"
                :disabled="isReadonly"
            ></v-autocomplete>
        </v-col>

        <v-col cols="12" md="3">
            <v-text-field
                v-model="form.dateShipment"
                type="date"
                label="Дата документа"
                variant="outlined"
                density="compact"
                :disabled="isReadonly"
            ></v-text-field>
        </v-col>

        <v-col cols="12" md="3">
             <v-text-field
                v-model="form.numShipment"
                label="Номер документа"
                placeholder="Автоматически"
                variant="outlined"
                density="compact"
                :disabled="isReadonly"
            ></v-text-field>
        </v-col>

        <v-col cols="12" md="3">
             <v-text-field
                v-model="form.bitrixDealId"
                label="Сделка (ID)"
                variant="outlined"
                density="compact"
                type="number"
                placeholder="ID сделки"
                :disabled="isReadonly"
            ></v-text-field>
        </v-col>

        <v-col cols="12" md="3">
             <v-autocomplete
                v-model="form.storeId"
                :items="warehouseStore.stores"
                item-title="name"
                item-value="id"
                label="Склад отгрузки"
                variant="outlined"
                density="compact"
                :disabled="isReadonly"
            ></v-autocomplete>
        </v-col>
      </v-row>

      <div class="d-flex align-center mt-4 mb-2">
        <h3 class="text-h6">Товары</h3>
        <v-btn size="small" color="primary" class="ml-4" @click="form.addItem" :disabled="isReadonly">
          <v-icon start>mdi-plus</v-icon> Добавить
        </v-btn>

        <v-btn
          size="small"
          color="error"
          variant="tonal"
          class="ml-2"
          prepend-icon="mdi-delete"
          :disabled="selectedItems.length === 0 || isReadonly"
          @click="removeSelected"
        >
          Удалить выбранные ({{ selectedItems.length }})
        </v-btn>
      </div>

      <v-table density="compact" class="border">
        <thead>
          <tr>
            <th style="width: 50px" class="text-center">
                <v-checkbox-btn v-model="allSelected" density="compact" hide-details :disabled="form.items.length === 0"></v-checkbox-btn>
            </th>
            <th style="width: 35%">Товар</th>
            <th style="width: 10%">Кол-во (осн)</th>
            <th style="width: 10%">ЕИ</th>
            <th style="width: 10%">Мест</th>
            <th style="width: 15%">Цена</th>
            <th style="width: 15%" class="text-right">Сумма</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in form.items" :key="item._tempId" :class="selectedItems.includes(item) ? 'bg-blue-grey-lighten-5' : ''">
             <td class="text-center">
                <v-checkbox-btn v-model="selectedItems" :value="item" density="compact" hide-details></v-checkbox-btn>
             </td>

             <td class="py-1">
                <v-autocomplete
                    :model-value="item.productId"
                    @update:model-value="(val) => onProductSelect(val, item)"
                    @update:search="onProductSearchInput"
                    :items="comboProducts"
                    :loading="productStore.loading || isProductSearching"
                    item-title="title"
                    item-value="value"
                    placeholder="Поиск..."
                    density="compact"
                    variant="plain"
                    hide-details
                    auto-select-first
                    :disabled="isReadonly"
                    no-data-text="Мин 3 символа"
                >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props" :subtitle="item.raw.type === 'bitrix' ? 'Импортировать' : ''">
                         <template v-slot:prepend v-if="item.raw.type === 'bitrix'">
                           <v-icon color="blue" size="small">mdi-cloud-download</v-icon>
                         </template>
                      </v-list-item>
                    </template>
                </v-autocomplete>
             </td>

             <td>
                <v-text-field v-model.number="item.countProduct" type="number" min="0" density="compact" variant="plain" hide-details :disabled="isReadonly"></v-text-field>
             </td>

             <td class="text-caption text-grey">{{ item.unit }}</td>

             <td>
                <v-text-field v-model.number="item.countLocation" type="number" min="0" step="1" density="compact" variant="plain" hide-details :disabled="isReadonly"></v-text-field>
             </td>

             <td>
                <v-text-field v-model.number="item.priceProduct" type="number" min="0" density="compact" variant="plain" hide-details :disabled="isReadonly"></v-text-field>
             </td>

             <td class="text-right font-weight-bold">
                {{ (item.countProduct * item.priceProduct).toLocaleString('ru-RU', { minimumFractionDigits: 2 }) }}
             </td>
          </tr>

          <tr v-if="form.items.length === 0">
            <td colspan="7" class="text-center text-grey py-4">Нет товаров. Нажмите "Добавить".</td>
          </tr>

          <tr class="bg-grey-lighten-4 font-weight-bold">
            <td colspan="2" class="text-right">Итого:</td>
            <td>{{ form.items.reduce((acc, i) => acc + Number(i.countProduct), 0) }}</td>
            <td></td>
            <td>{{ form.totalLocations }}</td>
            <td></td>
            <td class="text-right">{{ form.totalSum.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) }}</td>
          </tr>
        </tbody>
      </v-table>

    </v-card-text>

    <v-dialog v-model="deleteDialog" max-width="400">
        <v-card title="Удаление" text="Вы уверены, что хотите удалить этот документ реализации?" >
            <template v-slot:actions>
                <v-spacer></v-spacer>
                <v-btn @click="deleteDialog = false" :disabled="isDeleting">Отмена</v-btn>
                <v-btn color="error" variant="flat" @click="confirmDelete" :loading="isDeleting">Удалить</v-btn>
            </template>
        </v-card>
    </v-dialog>
  </v-card>
</template>
