<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { usePostingFormStore } from '@/stores/postingForm';
import { useWarehouseStore } from '@/stores/warehouse';
import { useOrganizationStore } from '@/stores/organizations';
import { useProductStore } from '@/stores/products';
import axiosClient from "@/services/axiosApiClient.ts";
import { useNotificationStore } from '@/stores/notifications';
import { getErrorMessage } from '@/services/http-error.ts';
import { deletePosting } from '@/api/postings.ts';

const emit = defineEmits(['close', 'refresh']);
const deleteDialog = ref(false);
const isDeleting = ref(false);

const form = usePostingFormStore();
const warehouseStore = useWarehouseStore();
const organizationStore = useOrganizationStore();
const productStore = useProductStore();
const notify = useNotificationStore();

const isProductSearching = ref(false);
const productSearchQuery = ref('');
const foundBitrixProducts = ref<any[]>([]);
const selected = ref<any[]>([]);
let productSearchTimeout: any = null;

onMounted(() => {
  Promise.all([
    warehouseStore.fetchStores(),
    organizationStore.fetchOrganizations()
  ]);
});


watch(() => organizationStore.organizations, (orgs) => {
  if (!form.organizationId && orgs.length > 0) {
    const main = orgs.find(o => o.name.toLowerCase().includes('промрыбопродукт'));
    if (main) form.organizationId = main.id;
  }
}, { immediate: true });

const saveAndClose = async () => {
  if (form.items.length === 0) return notify.notify('Добавьте хотя бы один товар', 'warning');
  try {
    await form.save('Проведен');
    notify.notify('Оприходование проведено успешно', 'success');
    emit('refresh');
    setTimeout(() => emit('close'), 1000);
  } catch (e) { notify.notify(getErrorMessage(e), 'error'); }
};


const onConduct = async () => {
    if (form.items.length === 0) {
        notify.notify('Добавьте хотя бы один товар', 'warning');
        return;
    }
    try {
        await form.save('Проведен');
        notify.notify('Оприходование проведено успешно', 'success');
        emit('refresh');
    } catch (e) {
        notify.notify(getErrorMessage(e), 'error');
    }
};

const saveOnly = async () => {
  try { await form.save('Черновик'); notify.notify('Сохранено как черновик', 'success'); emit('refresh'); }
  catch(e) { notify.notify(getErrorMessage(e), 'error'); }
};

const onUnconduct = async () => {
  try {
    await form.unconduct();
    if (form.invalidItemIds.length > 0) notify.notify('Документ распроведен, но обнаружены минусы! Исправьте.', 'warning');
    else notify.notify('Документ распроведен', 'info');
    emit('refresh');
  } catch(e) { notify.notify(getErrorMessage(e), 'error'); }
};

const onDeleteClick = () => {
  if (!form.id) { emit('close'); return; }
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!form.id) return;
  isDeleting.value = true;
  try {
    await deletePosting(form.id);
    notify.notify('Документ удален', 'success');
    emit('refresh');
    deleteDialog.value = false;
    emit('close');
  } catch (e) {
    notify.notify(getErrorMessage(e), 'error');
  } finally {
    isDeleting.value = false;
  }
};


const onProductSearchInput = (query: string) => {
  productSearchQuery.value = query;
  if (!query || query.length < 3) {
    foundBitrixProducts.value = [];
    return;
  }
  if (productSearchTimeout) clearTimeout(productSearchTimeout);
  productSearchTimeout = setTimeout(async () => {
    isProductSearching.value = true;

    foundBitrixProducts.value = [];

    try {
      const {data} = await axiosClient.post('/bitrix/search', {type: 'product', query});
      foundBitrixProducts.value = data;
    } catch (e) { console.error(e); }
    finally { isProductSearching.value = false; }
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

const onSmartProductSelect = (val: any, itemRow: any) => {
  if (!val) return;

  const bxProduct = foundBitrixProducts.value.find(p => Number(p.ID) === val);
  const localProduct = productStore.products.find(p => p.id === val);

  if (bxProduct) {

    itemRow.productId = Number(bxProduct.ID);
    itemRow.productName = bxProduct.NAME;
    itemRow.unit = bxProduct.MEASURE_NAME || 'шт';
    itemRow.priceProduct = bxProduct.PRICE ? Number(bxProduct.PRICE) : 0;



    const exists = productStore.products.find(p => p.id === itemRow.productId);
    if (!exists) {
        productStore.products.push({
            id: itemRow.productId,
            name: itemRow.productName,
            unit: itemRow.unit,
            catalogId: 0
        });
    }
  } else if (localProduct) {

    itemRow.productId = localProduct.id;
    itemRow.productName = localProduct.name;
    itemRow.unit = localProduct.unit || 'шт';
  }
};

const removeSelected = () => {
  if (selected.value.length === 0) return;
  form.removeItems(selected.value);
  selected.value = [];
};

const allSelected = computed({
  get: () => form.items.length > 0 && selected.value.length === form.items.length,
  set: (val: boolean) => { selected.value = val ? [...form.items] : []; }
});

</script>

<template>
  <v-card class="h-100 d-flex flex-column">
    <v-toolbar density="compact" color="blue-grey-lighten-5">
      <v-btn color="success" variant="elevated" class="mr-2" @click="saveAndClose" :loading="form.saving" :disabled="form.status === 'Проведен'">Провести и закрыть</v-btn>
      <v-btn v-if="form.status !== 'Проведен'" color="primary" variant="text" @click="onConduct" :loading="form.saving">Провести</v-btn>
      <v-btn v-if="form.status === 'Проведен'" color="warning" variant="text" @click="onUnconduct" :loading="form.saving">Распровести</v-btn>
      <v-btn v-if="form.status !== 'Проведен'" variant="outlined" @click="saveOnly" :loading="form.saving">Сохранить</v-btn>
      <v-spacer></v-spacer>
      <v-btn color="error" variant="text" @click="onDeleteClick">Удалить</v-btn>
      <v-btn icon="mdi-close" variant="text" @click="$emit('close')"></v-btn>
    </v-toolbar>

<v-card-text class="flex-grow-1 overflow-y-auto pt-4">
      <v-row dense>
        <v-col cols="12" md="4">
          <v-text-field
            label="Поставщик"
            disabled
            placeholder="Пусто"
            variant="outlined"
            density="compact"
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="4">
          <v-autocomplete
            v-model="form.organizationId"
            :items="organizationStore.organizations"
            item-title="name"
            item-value="id"
            label="Организация"
            variant="outlined"
            density="compact"
            :disabled="form.status === 'Проведен'"
          ></v-autocomplete>
        </v-col>

        <v-col cols="12" md="4">
          <v-autocomplete
            v-model="form.storeId"
            :items="warehouseStore.stores"
            item-title="name"
            item-value="id"
            label="Склад"
            variant="outlined"
            density="compact"
            :disabled="form.status === 'Проведен'"
          ></v-autocomplete>
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            v-model="form.datePosting"
            type="date"
            label="Дата документа"
            variant="outlined"
            density="compact"
            :disabled="form.status === 'Проведен'"
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            v-model="form.numPosting"
            label="Номер"
            placeholder="Авто"
            variant="outlined"
            density="compact"
            :disabled="form.status === 'Проведен'"
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            v-model="form.bitrixDealId"
            label="Сделка (ID)"
            type="number"
            variant="outlined"
            density="compact"
            :disabled="form.status === 'Проведен'"
          ></v-text-field>
        </v-col>
      </v-row>

      <div class="d-flex align-center mt-4 mb-2">
        <h3 class="text-h6">Товары</h3>
        <v-btn size="small" color="primary" class="ml-4" @click="form.addItem" :disabled="form.status === 'Проведен'"> <v-icon start>mdi-plus</v-icon> Добавить </v-btn>
        <v-btn size="small" color="error" variant="tonal" class="ml-2" :disabled="selected.length === 0 || form.status === 'Проведен'" @click="removeSelected">Удалить выбранные</v-btn>
      </div>

      <v-table density="compact" class="border">
        <thead>
        <tr>
          <th style="width: 50px" class="text-center"> <v-checkbox-btn v-model="allSelected" density="compact" hide-details :disabled="form.items.length === 0"></v-checkbox-btn> </th>
          <th style="width: 35%">Товар</th>
          <th style="width: 10%">Кол-во (осн)</th>
          <th style="width: 10%">ЕИ</th>
          <th style="width: 10%">Мест</th>
          <th style="width: 15%">Цена</th>
          <th style="width: 15%" class="text-right">Сумма</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(item) in form.items" :key="item._tempId" :class="selected.includes(item) ? 'bg-blue-grey-lighten-5' : (form.invalidItemIds.includes(item.productId!) ? 'bg-red-lighten-4' : '')">
          <td class="text-center"> <v-checkbox-btn v-model="selected" :value="item" density="compact" hide-details></v-checkbox-btn> </td>
          <td class="py-1">
            <v-autocomplete
                :model-value="item.productId"
                @update:model-value="(val) => onSmartProductSelect(val, item)"
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
                :disabled="form.status === 'Проведен' || !!item.id"
                no-data-text="Мин 3 символа" >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :subtitle="item.raw.type === 'bitrix' ? 'Импортировать' : ''">
                     <template v-slot:prepend v-if="item.raw.type === 'bitrix'">
                       <v-icon color="blue" size="small">mdi-cloud-download</v-icon>
                     </template>
                  </v-list-item>
                </template>
            </v-autocomplete>
          </td>
          <td> <v-text-field v-model.number="item.countProduct" type="number" min="0" density="compact" variant="plain" hide-details :disabled="form.status === 'Проведен'"></v-text-field> </td>
          <td class="text-grey text-caption"> {{ item.unit || '-' }} </td>
          <td> <v-text-field v-model.number="item.countLocation" type="number" min="0" density="compact" variant="plain" hide-details :disabled="form.status === 'Проведен'"></v-text-field> </td>
          <td> <v-text-field v-model.number="item.priceProduct" type="number" min="0" density="compact" variant="plain" hide-details :disabled="form.status === 'Проведен'"></v-text-field> </td>
          <td class="text-right font-weight-medium"> {{ (item.countProduct * item.priceProduct).toLocaleString('ru-RU', {minimumFractionDigits: 2}) }} </td>
        </tr>
        <tr v-if="form.items.length === 0"> <td colspan="7" class="text-center text-grey py-4"> Нет товаров. Нажмите "Добавить". </td> </tr>
        <tr class="bg-grey-lighten-4 font-weight-bold">
          <td></td> <td class="text-right">Итого:</td> <td>{{ form.items.reduce((sum, i) => sum + Number(i.countProduct), 0) }}</td> <td></td> <td>{{ form.totalLocations }}</td> <td></td> <td class="text-right">{{ form.totalSum.toLocaleString('ru-RU', {style: 'currency', currency: 'RUB'}) }}</td>
        </tr>
        </tbody>
      </v-table>
    </v-card-text>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card title="Удаление" text="Удалить документ безвозвратно?">
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete" :loading="isDeleting">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>
