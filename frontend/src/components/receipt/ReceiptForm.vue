<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue';
import {useReceiptFormStore} from '@/stores/receiptForm';
import {useWarehouseStore} from '@/stores/warehouse';
import {usePartnerStore} from '@/stores/partners';
import {useOrganizationStore} from '@/stores/organizations';
import {useProductStore} from '@/stores/products';
import axiosClient from "@/services/axiosApiClient.ts";
import {useNotificationStore} from '@/stores/notifications';
import {deleteReceipt} from '@/api/receipts.ts';
import {getErrorMessage} from '@/services/http-error.ts';
import {initializeB24Frame} from '@bitrix24/b24jssdk';

const emit = defineEmits(['close', 'refresh']);
const deleteDialog = ref(false);
const isDeleting = ref(false);
const form = useReceiptFormStore();
const warehouseStore = useWarehouseStore();
const partnerStore = usePartnerStore();
const organizationStore = useOrganizationStore();
const productStore = useProductStore();
const notify = useNotificationStore();
const searchQuery = ref('');
const foundBitrixPartners = ref<any[]>([]);
const isSearching = ref(false);
const isGenerating = ref(false);
const productSearchQuery = ref('');
const foundBitrixProducts = ref<any[]>([]);
const isProductSearching = ref(false);


watch(
  () => form.partnerId,
  (newVal) => {
    if (newVal && form.partnerName) {
      const exists = partnerStore.partners.find(p => p.id === newVal);

      if (!exists) {
        partnerStore.partners.push({
          id: newVal,
          name: form.partnerName
        });
      }
    }
  },
  {immediate: true}
);


watch(
  () => organizationStore.organizations,
  (orgs) => {
    if (!form.organizationId && orgs.length > 0) {
      const mainOrg = orgs.find(o => o.name.toLowerCase().includes('промрыбопродукт'));
      if (mainOrg) {
        form.organizationId = mainOrg.id;
      }
    }
  },
  { immediate: true }
);

onMounted(() => {
  Promise.all([
    warehouseStore.fetchStores(),
    organizationStore.fetchOrganizations(),
  ]);
});

const saveAndClose = async () => {
  if (form.items.length === 0) {
    notify.notify('Нельзя провести пустой документ! Добавьте товары.', 'warning');
    return;
  }
  if (form.status === 'Проведен') {
    emit('close');
    return;
  }
  try {
    await form.save('Проведен');
    notify.notify('Документ успешно проведен!', 'success');
    emit('refresh');
    setTimeout(() => {
      emit('close');
    }, 1000);

  } catch (error) {
    const message = getErrorMessage(error);
    notify.notify(message, 'error');
  }
};

const saveOnly = async () => {
  try {
    await form.save('Черновик');
    notify.notify('Документ сохранен', 'success');
    emit('refresh');
  } catch (error) {
    const message = getErrorMessage(error);
    notify.notify(`Ошибка: ${message}`, 'error');
  }
};
const onUnconduct = async () => {
  try {
    await form.unconduct();


    if (form.invalidItemIds.length > 0) {
        notify.notify('Документ распроведен, но обнаружены отрицательные остатки! Исправьте количество.', 'warning');
    } else {
        notify.notify('Документ распроведен. Теперь его можно редактировать.', 'info');
    }

    emit('refresh');

  } catch (error) {
    const message = getErrorMessage(error);
    notify.notify(`Ошибка: ${message}`, 'error');
  }
};

const onConduct = async () => {
  if (form.items.length === 0) {
    notify.notify('Нельзя провести пустой документ! Добавьте товары.', 'warning');
    return;
  }
  try {
    await form.save('Проведен');

    notify.notify('Документ успешно проведен', 'success');

    emit('refresh');

  } catch (error) {
    const message = getErrorMessage(error);
    notify.notify(`Ошибка при проведении: ${message}`, 'error');
  }
};

const onDeleteClick = () => {
  if (!form.id) {
    emit('close');
    return;
  }
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!form.id) return;

  isDeleting.value = true;
  try {
    await deleteReceipt(form.id);

    notify.notify('Документ успешно удален', 'success');
    emit('refresh');
    deleteDialog.value = false;
    emit('close');
  } catch (error) {
    const message = getErrorMessage(error);
    notify.notify(`Ошибка при удалении: ${message}`, 'error');
  } finally {
    isDeleting.value = false;
  }
};

const onProductChange = (item: any) => {
  const product = productStore.products.find((p) => p.id === item.productId);
  if (product) {
    item.unit = product.unit || 'шт';
    item.productName = product.name;
  }
};

const comboPartners = computed(() => {
  const local = partnerStore.partners.map(p => ({
    ...p,
    type: 'local',
    displayName: p.name,
    value: p.id
  }));

  const external = foundBitrixPartners.value.map(bx => ({
    id: `bx_${bx.ID}`,
    name: bx.TITLE,
    type: 'bitrix',
    displayName: `${bx.TITLE} (Найдено в Битрикс24)`,
    value: bx
  }));

  return [...local, ...external];
});

let searchTimeout: any = null;

const onSearchInput = (query: string) => {
  searchQuery.value = query;

  if (!query || query.length < 3) {
    foundBitrixPartners.value = [];
    return;
  }

  if (searchTimeout) clearTimeout(searchTimeout);

  searchTimeout = setTimeout(async () => {
    isSearching.value = true;
    try {

      const {data} = await axiosClient.post('/bitrix/search', {type: 'company', query});

      foundBitrixPartners.value = data;
    } catch (e) {
      console.error(e);
    } finally {
      isSearching.value = false;
    }
  }, 500);
};


const onPartnerSelect = async (val: any) => {
  if (!val) {
    form.partnerId = null;

    return;
  }

  if (typeof val === 'object' && val.ID) {

    searchQuery.value = val.TITLE;
    foundBitrixPartners.value = [];

    form.partnerId = Number(val.ID);

    const tempPartner = {id: Number(val.ID), name: val.TITLE};

    const index = partnerStore.partners.findIndex(p => p.id === tempPartner.id);

    if (index !== -1) {
      partnerStore.partners[index] = tempPartner;
    } else {
      partnerStore.partners.push(tempPartner);
    }

  } else if (typeof val === 'number') {
    form.partnerId = val;
  }
};

const checkPrices = async () => {
  if (!form.id) return;
  try {
    const {data} = await axiosClient.post(`/receipt/${form.id}/check-prices`);
    notify.notify(data.message, data.status || 'success');
    emit('refresh');
    await form.loadReceipt(form.id);
  } catch (e) {
    notify.notify('Ошибка при проверке цен', 'error');
  }
};


const headers = [
  {title: 'Товар', key: 'productId', width: '30%'},
  {title: 'Кол-во', key: 'countProduct', width: '100px'},
  {title: 'ЕИ', key: 'unit', width: '80px'},
  {title: 'Мест', key: 'countLocation', width: '80px'},
  {title: 'Цена', key: 'priceProduct', width: '120px'},
  {title: 'Сумма', key: 'amount', width: '120px', align: 'end'},
  {title: '', key: 'actions', width: '50px'},
];

const selected = ref<any[]>([]);

const removeSelected = () => {
  if (selected.value.length === 0) return;

  form.removeItems(selected.value);
  selected.value = [];
};

const allSelected = computed({
  get: () => form.items.length > 0 && selected.value.length === form.items.length,
  set: (val: boolean) => {
    selected.value = val ? [...form.items] : [];
  }
});


const comboProducts = computed(() => {
  const local = productStore.products.map(p => ({
    ...p,
    type: 'local',
    displayName: p.name,
    value: p.id
  }));

  const external = foundBitrixProducts.value.map(bx => ({
    id: `bx_${bx.ID}`,
    name: bx.NAME,
    type: 'bitrix',
    displayName: `${bx.NAME} (Найдено в Битрикс24)`,
    value: bx
  }));

  return [...local, ...external];
});

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
      const {data} = await axiosClient.post('/bitrix/search', {type: 'product', query});
      foundBitrixProducts.value = data;
    } catch (e) {
      console.error(e);
    } finally {
      isProductSearching.value = false;
    }
  }, 500);
};

const onSmartProductSelect = async (val: any, itemRow: any) => {
  if (!val) return;

  let newId: number | null = null;
  let newName = '';
  let newUnit = 'шт';
  let incomingPrice = 0;

  if (typeof val === 'object' && val.ID) {
    newId = Number(val.ID);
    newName = val.NAME;
    newUnit = val.MEASURE_NAME || 'шт';
    if (val.PRICE) incomingPrice = Number(val.PRICE);


    const existing = productStore.products.find(p => p.id === newId);
    if (!existing) {
       productStore.products.push({ id: newId, name: newName, unit: newUnit, catalogId: 0 });
    }
  } else if (typeof val === 'number') {
    newId = val;
    const p = productStore.products.find(x => x.id === val);
    if (p) {
        newName = p.name;
        newUnit = p.unit || 'шт';

    }
  }

  if (newId) {
    itemRow.productId = newId;
    itemRow.unit = newUnit;
    itemRow.productName = newName;

    if (form.partnerId) {
        try {

            const { data: supplierPriceData } = await axiosClient.get('/receipt/supplier-price', {
                params: {
                    partnerId: form.partnerId,
                    productId: newId
                }
            });


            if (supplierPriceData && supplierPriceData.price !== null && Number(supplierPriceData.price) > 0) {
                 itemRow.priceProduct = Number(supplierPriceData.price);
                 notify.notify(`Применена цена поставщика: ${itemRow.priceProduct}`, 'success');
            } else {
                 console.log('⚠️ Спец. цены нет, используем стандартную:', incomingPrice);
                 if (incomingPrice > 0) itemRow.priceProduct = incomingPrice;
            }
        } catch (e) {
            console.error('❌ Ошибка получения цены:', e);
            if (incomingPrice > 0) itemRow.priceProduct = incomingPrice;
        }
    } else {
        if (incomingPrice > 0) itemRow.priceProduct = incomingPrice;
    }
  }
};

const generateOrder = async () => {
  if (!form.id) return;

  isGenerating.value = true;
  notify.notify('Генерация заказа в Битрикс24...', 'info');

  try {

    const {data} = await axiosClient.get(`/receipt/${form.id}/generate-order`);

    const docInfo = data.document || data;
    const docId = docInfo.id;

    const fallbackUrl = docInfo.pdfUrl || docInfo.url || docInfo.downloadUrl;

    if (docId) {
      try {

        const $b24 = await initializeB24Frame();

        const rawPath = `/bitrix/components/bitrix/crm.document.view/slider.php?documentId=${docId}&IFRAME=Y&IFRAME_TYPE=SIDE_SLIDER`;


        const sliderUrl = $b24.slider.getUrl(rawPath);

        await $b24.slider.openPath(sliderUrl, 1000);

      } catch (b24Error) {
        console.warn('Ошибка открытия через SDK:', b24Error);

        if (fallbackUrl) {
          window.open(fallbackUrl, '_blank');
          notify.notify('Открыто в новой вкладке (фоллбэк)', 'warning');
        }
      }
    } else {
      notify.notify('Документ создан, но ID не получен', 'warning');
    }

  } catch (error) {
    console.error(error);
    const msg = getErrorMessage(error);
    notify.notify(`Ошибка генерации: ${msg}`, 'error');
  } finally {
    isGenerating.value = false;
  }
};

</script>

<template>

  <v-card class="h-100 d-flex flex-column">
    <v-toolbar density="compact" color="blue-grey-lighten-5">
      <v-btn
        color="success"
        variant="elevated"
        class="mr-2"
        @click="saveAndClose"
        :loading="form.saving"
      >
        Провести и закрыть
      </v-btn>
      <v-btn
        color="primary"
        variant="text"
        class="mr-1"
        @click="onConduct"
        :loading="form.saving"
        :disabled="form.status === 'Проведен'"
      >
        Провести
      </v-btn>
      <v-btn
        color="warning"
        variant="text"
        class="mr-1"
        @click="onUnconduct"
        :loading="form.saving"
        v-if="form.status === 'Проведен'"
      >
        Распровести
      </v-btn>
      <v-btn
        variant="outlined"
        class="mr-2"
        @click="saveOnly"
        :loading="form.saving"
        :disabled="form.status === 'Проведен'"
      >
        Сохранить
      </v-btn>
      <v-btn
        variant="text"
        color="info"
        @click="checkPrices"
        :disabled="!form.id || form.status !== 'Проведен'"
      >
        Проверить цены
      </v-btn>

      <v-btn
        variant="text"
        color="primary"
        @click="generateOrder"
        :disabled="!form.id"
        :loading="isGenerating"
      >
        Сформировать заказ
      </v-btn>
      <v-spacer></v-spacer>

      <v-btn
        color="error"
        variant="text"
        @click="onDeleteClick"
      >Удалить
      </v-btn>
      <v-divider vertical inset class="mx-2"></v-divider>
      <v-btn
        icon="mdi-close"
        variant="text"
        @click="$emit('close')"
      ></v-btn>
    </v-toolbar>


    <v-card-text class="flex-grow-1 overflow-y-auto">
      <v-row dense class="mt-2">
        <v-col cols="12" md="6">
          <v-autocomplete
            :model-value="form.partnerId"
            @update:model-value="onPartnerSelect"
            v-model:search="searchQuery"
            @update:search="onSearchInput"
            :items="comboPartners"
            :loading="partnerStore.loading || isSearching"
            item-title="displayName"
            item-value="value"
            label="Поставщик (Поиск в Битрикс24)"
            placeholder="Начните вводить название..."
            variant="outlined"
            density="compact"
            :disabled="form.status === 'Проведен'"
            no-data-text="Нет данных (введите мин. 3 символа)"
            clearable
          >
            <template v-slot:item="{ props, item }">
              <v-list-item
                v-bind="props"
                :subtitle="item.raw.type === 'bitrix' ? 'Нажмите, чтобы импортировать' : ''"
              >
                <template v-slot:prepend v-if="item.raw.type === 'bitrix'">
                  <v-icon color="blue" icon="mdi-cloud-download"></v-icon>
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>

        <v-col cols="12" md="6">
          <v-autocomplete
            v-model="form.organizationId"
            :items="organizationStore.organizations"
            :loading="organizationStore.loading"
            item-title="name"
            item-value="id"
            label="Организация"
            variant="outlined"
            density="compact"
            :disabled="form.status === 'Проведен'"
          ></v-autocomplete>
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            v-model="form.dateReceipt"
            type="date"
            label="Дата документа"
            variant="outlined"
            density="compact"
            hide-details="auto"
            :disabled="form.status === 'Проведен'"
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            v-model="form.numReceipt"
            label="Номер документа"
            placeholder="Автоматически"
            variant="outlined"
            density="compact"
            hide-details="auto"
            :disabled="form.status === 'Проведен'"
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="4">
          <v-autocomplete
            v-model="form.storeId"
            :items="warehouseStore.stores"
            :loading="warehouseStore.loading"
            item-title="name"
            item-value="id"
            label="Склад"
            variant="outlined"
            density="compact"
            hide-details="auto"
            :disabled="form.status === 'Проведен'"
          ></v-autocomplete>
        </v-col>
      </v-row>

      <div class="d-flex align-center mt-4 mb-2">
        <h3 class="text-h6">Товары</h3>

        <v-btn
          size="small"
          color="primary"
          class="ml-4"
          @click="form.addItem"
          :disabled="form.status === 'Проведен'"
        >
          <v-icon start>mdi-plus</v-icon>
          Добавить
        </v-btn>

        <v-btn
          size="small"
          color="error"
          variant="tonal"
          prepend-icon="mdi-delete"
          :disabled="selected.length === 0 || form.status === 'Проведен'"
          @click="removeSelected"
        >
          Удалить выбранные ({{ selected.length }})
        </v-btn>

      </div>

      <v-table density="compact" class="border">
        <thead>
        <tr>
          <th style="width: 50px" class="text-center">
            <v-checkbox-btn
              v-model="allSelected"
              density="compact"
              hide-details
            ></v-checkbox-btn>
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
        <tr
          v-for="(item) in form.items"
          :key="item._tempId"
          :class="{
            'bg-blue-grey-lighten-5': selected.includes(item),
            'bg-red-lighten-4': form.invalidItemIds.includes(item.productId!)
          }"
        >
          <td class="text-center">
            <v-checkbox-btn
              v-model="selected"
              :value="item"
              density="compact"
              hide-details
            ></v-checkbox-btn>
          </td>

          <td class="py-1">
            <v-autocomplete
              :model-value="item.productId"
              @update:model-value="(val) => onSmartProductSelect(val, item)"
              @update:search="onProductSearchInput"
              :items="comboProducts"
              :loading="productStore.loading || isProductSearching"
              item-title="displayName"
              item-value="value"
              placeholder="Поиск товара..."
              density="compact"
              variant="plain"
              hide-details
              auto-select-first
              :disabled="form.status === 'Проведен' || !!item.id"
              no-data-text="Нет данных (введите мин. 3 символа)"
            >
               <template v-slot:item="{ props, item }">
                 <v-list-item v-bind="props"
                              :subtitle="item.raw.type === 'bitrix' ? 'Нажмите для импорта' : ''">
                   <template v-slot:prepend v-if="item.raw.type === 'bitrix'">
                     <v-icon color="green">mdi-cloud-download</v-icon>
                   </template>
                 </v-list-item>
               </template>
            </v-autocomplete>
          </td>

          <td>
            <v-text-field
              v-model.number="item.countProduct"
              type="number"
              min="0"
              density="compact"
              variant="plain"
              hide-details
              placeholder="0"
              :disabled="form.status === 'Проведен'"
            ></v-text-field>
          </td>

          <td class="text-grey text-caption">
            {{ item.unit || '-' }}
          </td>

          <td>
            <v-text-field
              v-model.number="item.countLocation"
              type="number"
              min="0"
              density="compact"
              variant="plain"
              hide-details
              placeholder="0"
              :disabled="form.status === 'Проведен'"
            ></v-text-field>
          </td>

          <td>
            <v-text-field
              v-model.number="item.priceProduct"
              type="number"
              min="0"
              density="compact"
              variant="plain"
              hide-details
              placeholder="0.00"
              :disabled="form.status === 'Проведен'"
            ></v-text-field>
          </td>

          <td class="text-right font-weight-medium">
            {{
              (item.countProduct * item.priceProduct).toLocaleString('ru-RU', {minimumFractionDigits: 2})
            }}
          </td>


        </tr>

        <tr v-if="form.items.length === 0">
          <td colspan="7" class="text-center text-grey py-4">
            Нет товаров. Нажмите "Добавить".
          </td>
        </tr>

        <tr class="bg-grey-lighten-4 font-weight-bold">
          <td></td>
          <td class="text-right">Итого:</td>
          <td>{{ form.items.reduce((sum, i) => sum + Number(i.countProduct), 0) }}</td>
          <td></td>
          <td>{{ form.totalLocations }}</td>
          <td></td>
          <td class="text-right">
            {{ form.totalSum.toLocaleString('ru-RU', {style: 'currency', currency: 'RUB'}) }}
          </td>
        </tr>
        </tbody>
      </v-table>
    </v-card-text>
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Удаление документа</v-card-title>
        <v-card-text>
          Вы уверены, что хотите безвозвратно удалить этот документ?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="deleteDialog = false"
            :disabled="isDeleting"
          >
            Отмена
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDelete"
            :loading="isDeleting"
          >
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>

</template>
