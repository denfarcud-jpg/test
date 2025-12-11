<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue';
import {useReportsStore} from '@/stores/reports';
import {useWarehouseStore} from '@/stores/warehouse';
import {useProductStore} from '@/stores/products';
import axiosClient from '@/services/axiosApiClient';
import {utils, writeFile} from 'xlsx';

const reportsStore = useReportsStore();
const warehouseStore = useWarehouseStore();
const productStore = useProductStore();


const reportTypes = [
  {title: 'Отчет по остаткам товара на дату', value: 'stock'},
  {title: 'Отчет по продажам за период', value: 'sales'},
  {title: 'Движение товара', value: 'movement'},
  {title: 'Прайс цен', value: 'price'},
];


const isProductSearching = ref(false);
const productSearchQuery = ref('');
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
      const {data} = await axiosClient.post('/bitrix/search', {type: 'product', query});
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
    type: 'local',
    raw: p,
  }));
  const external = foundBitrixProducts.value.map(bx => ({
    title: bx.NAME,
    value: bx,
    type: 'bitrix',
    raw: bx
  }));
  return [...local, ...external];
});


const onProductSelect = (val: any) => {
  if (!val) {
    reportsStore.filters.productId = null;
    return;
  }


  if (typeof val === 'object' && val.ID) {
    const newId = Number(val.ID);
    const newName = val.NAME;
    const newUnit = val.MEASURE_NAME || 'шт';


    const existing = productStore.products.find(p => p.id === newId);
    if (!existing) {
       productStore.products.push({ id: newId, name: newName, unit: newUnit, catalogId: 0 });
    }


    reportsStore.filters.productId = newId;

  } else if (typeof val === 'number') {

    reportsStore.filters.productId = val;
  }
};

onMounted(() => {
  warehouseStore.fetchStores();

  const today = new Date().toISOString().substr(0, 10);
  if (!reportsStore.filters.dateEnd) {
      reportsStore.filters.dateEnd = today;
  }
});


watch(() => reportsStore.selectedReportType, () => {
  reportsStore.clearData();
});


const headers = computed(() => {
  switch (reportsStore.selectedReportType) {
    case 'stock':
      return [
        {title: 'Наименование', key: 'name'},
        {title: 'Остаток на складе', key: 'balance'},
        {title: 'ЕИ', key: 'unit'},
        {title: 'Себестоимость', key: 'cost'},
        {title: 'Сумма', key: 'sum', align: 'end' as const},
      ];
    case 'sales':
      return [
        {title: 'Группа', key: 'sectionName'},
        {title: 'Наименование', key: 'name'},
        {title: 'Количество', key: 'quantity'},
        {title: 'Цена', key: 'price'},
        {title: 'Себест. за ед', key: 'costPerUnit'},
        {title: 'Выручка', key: 'revenue'},
        {title: 'Себестоимость', key: 'totalCost'},
        {title: 'Валовая прибыль', key: 'grossProfit'},
        {title: 'Наценка %', key: 'markupPercent', align: 'end' as const},
      ];
    case 'movement':
      return [
        {title: 'Тип документа', key: 'type'},
        {title: 'Дата проведения', key: 'date'},
        {title: 'Контрагент', key: 'partner'},
        {title: 'Количество', key: 'quantity'},
        {title: 'Остаток', key: 'balance'},
        {title: 'Стоимость', key: 'cost'},
        {title: 'Номер документа', key: 'docNumber'},
      ];
    case 'price':
      return [
        {title: 'Группа', key: 'sectionName'},
        {title: 'Наименование', key: 'name'},
        {title: 'ЕИ', key: 'unit'},
        {title: 'Цена', key: 'price', align: 'end' as const},
      ];
    default:
      return [];
  }
});


const formatCurrency = (val: number) => {
  return val ? val.toLocaleString('ru-RU', {style: 'currency', currency: 'RUB'}) : '';
};
const formatDate = (dateStr: string) => {
  return dateStr ? new Date(dateStr).toLocaleDateString('ru-RU') : '';
};

const exportPriceListExcel = (withHeader: boolean) => {
  const data = reportsStore.reportData;
  if (!data.length) return;

  const fileName = withHeader ? 'Прейскурант_с_шапкой.xlsx' : 'Прейскурант.xlsx';
  const wb = utils.book_new();
  let ws: any;

  if (!withHeader) {
    const simpleData = data.map(item => ({
      'Группа': item.sectionName,
      'Наименование': item.name,
      'ЕИ': item.unit,
      'Цена': item.price
    }));
    ws = utils.json_to_sheet(simpleData);
    ws['!cols'] = [{wch: 20}, {wch: 40}, {wch: 10}, {wch: 15}];
  } else {
    const rows: any[][] = [];

    rows.push(['Прейскурант']);
    rows.push(['ООО «Промрыбопродукт», г. Омск, ул. 3-я Автомобильная, 3/5']);
    rows.push(['Наименование', 'ЕИ', 'Цена']);

    let currentSection = '';

    data.forEach(item => {
      if (item.sectionName !== currentSection) {
        currentSection = item.sectionName;
        rows.push([currentSection]);
      }
      rows.push([item.name, item.unit, item.price]);
    });

    ws = utils.aoa_to_sheet(rows);

    if (!ws['!merges']) ws['!merges'] = [];

    ws['!merges'].push({s: {r: 0, c: 0}, e: {r: 0, c: 2}});
    ws['!merges'].push({s: {r: 1, c: 0}, e: {r: 1, c: 2}});

    for (let i = 3; i < rows.length; i++) {
      if (rows[i]?.length === 1) {
        ws['!merges'].push({s: {r: i, c: 0}, e: {r: i, c: 2}});
      }
    }

    ws['!cols'] = [{wch: 50}, {wch: 10}, {wch: 15}];
  }

  utils.book_append_sheet(wb, ws, "Прейскурант");
  writeFile(wb, fileName);
};
const exportToExcel = () => {
  if (!reportsStore.reportData.length) return;


  if (reportsStore.selectedReportType === 'price') {
    exportPriceListExcel(false);
    return;
  }


  let dataToExport: any[] = [];
  let fileName = 'report.xlsx';


  switch (reportsStore.selectedReportType) {
    case 'stock':
      fileName = `Остатки_${reportsStore.filters.dateEnd}.xlsx`;
      dataToExport = reportsStore.reportData.map(item => ({
        'Наименование': item.name,
        'ЕИ': item.unit,
        'Остаток': item.balance,
        'Себестоимость': item.cost,
        'Сумма': item.sum
      }));
      break;

    case 'sales':
      fileName = `Продажи_${reportsStore.filters.dateStart}_${reportsStore.filters.dateEnd}.xlsx`;
      dataToExport = reportsStore.reportData.map(item => ({
        'Группа': item.sectionName,
        'Наименование': item.name,
        'Количество': item.quantity,
        'ЕИ': item.unit,
        'Цена продажи': item.price,
        'Себестоимость ед.': item.costPerUnit,
        'Выручка': item.revenue,
        'Общая себестоимость': item.totalCost,
        'Валовая прибыль': item.grossProfit,
        'Наценка %': item.markupPercent
      }));
      break;

    case 'movement':
      fileName = `Движение_${reportsStore.filters.dateStart}_${reportsStore.filters.dateEnd}.xlsx`;
      dataToExport = reportsStore.reportData.map(item => ({
        'Тип': item.type,
        'Дата': formatDate(item.date),
        'Документ №': item.docNumber,
        'Контрагент': item.partner,
        'Количество': item.quantity,
        'Стоимость': item.cost,
        'Баланс после': item.balance
      }));
      break;
  }

  const ws = utils.json_to_sheet(dataToExport);
  const wb = utils.book_new();
  const colWidths = Object.keys(dataToExport[0] || {}).map(() => ({wch: 20}));
  ws['!cols'] = colWidths;
  utils.book_append_sheet(wb, ws, "Отчет");
  writeFile(wb, fileName);
};
</script>

<template>
  <v-container fluid class="pa-0">
    <v-card variant="outlined" class="mb-4 pa-4 bg-grey-lighten-5">
      <v-row dense align="center">
        <v-col cols="12" md="4">
          <v-select
            v-model="reportsStore.selectedReportType"
            :items="reportTypes"
            label="Выберите отчет"
            variant="outlined"
            density="compact"
            hide-details
            bg-color="white"
          ></v-select>
        </v-col>

        <v-col cols="12" md="3" v-if="reportsStore.selectedReportType !== 'price'">
          <v-autocomplete
            v-model="reportsStore.filters.storeId"
            :items="warehouseStore.stores"
            item-title="name"
            item-value="id"
            label="Склад"
            variant="outlined"
            density="compact"
            hide-details
            bg-color="white"
            clearable
          ></v-autocomplete>
        </v-col>

        <v-col cols="12" md="3"
               v-if="['sales', 'movement'].includes(reportsStore.selectedReportType || '')">
          <div class="d-flex gap-2">
            <v-text-field
              v-model="reportsStore.filters.dateStart"
              type="date"
              label="С"
              variant="outlined"
              density="compact"
              hide-details
              bg-color="white"
            ></v-text-field>
            <v-text-field
              v-model="reportsStore.filters.dateEnd"
              type="date"
              label="По"
              variant="outlined"
              density="compact"
              hide-details
              bg-color="white"
            ></v-text-field>
          </div>
        </v-col>

        <v-col cols="12" md="3" v-if="reportsStore.selectedReportType === 'stock'">
          <v-text-field
            v-model="reportsStore.filters.dateEnd"
            type="date"
            label="Дата отчета"
            variant="outlined"
            density="compact"
            hide-details
            bg-color="white"
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="4" v-if="reportsStore.selectedReportType === 'movement'">
          <v-autocomplete
            :model-value="reportsStore.filters.productId"
            @update:model-value="onProductSelect"
            v-model:search="productSearchQuery"
            @update:search="onProductSearchInput"
            :items="comboProducts"
            :loading="isProductSearching"
            label="Выберите товар"
            variant="outlined"
            density="compact"
            hide-details
            bg-color="white"
            item-title="title"
            item-value="value"
            placeholder="Поиск..."
            no-data-text="Введите мин. 3 символа"
            :menu-props="{ location: 'bottom' }"
            clearable
          >
            <template v-slot:item="{ props, item }">
              <v-list-item
                v-bind="props"
                :subtitle="item.raw?.type === 'bitrix' ? 'Битрикс24 (Облако)' : 'Локальный справочник'"
              >
                <template v-slot:prepend v-if="item.raw?.type === 'bitrix'">
                  <v-icon color="blue" icon="mdi-cloud-download" class="mr-2"></v-icon>
                </template>

                <template v-slot:prepend v-else>
                  <v-icon color="grey" icon="mdi-database" class="mr-2"></v-icon>
                </template>

              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>

        <v-col cols="12" md="2" class="d-flex">
          <v-btn
            color="info"
            class="flex-grow-1"
            @click="reportsStore.generateReport"
            :loading="reportsStore.loading"
            :disabled="!reportsStore.selectedReportType"
          >
            Сформировать
          </v-btn>
        </v-col>

        <v-col cols="12" md="1" class="d-flex" v-if="reportsStore.reportData.length > 0">

          <v-menu v-if="reportsStore.selectedReportType === 'price'">
            <template v-slot:activator="{ props }">
              <v-btn
                icon="mdi-microsoft-excel"
                color="success"
                variant="text"
                v-bind="props"
                title="Выгрузить прайс"
              ></v-btn>
            </template>
            <v-list>
              <v-list-item @click="exportPriceListExcel(false)" title="Без шапки"></v-list-item>
              <v-list-item @click="exportPriceListExcel(true)"
                           title="С шапкой (официальный)"></v-list-item>
            </v-list>
          </v-menu>

          <v-btn
            v-else
            icon="mdi-microsoft-excel"
            color="success"
            variant="text"
            title="Выгрузить в Excel"
            @click="exportToExcel"
          ></v-btn>

        </v-col>
      </v-row>
    </v-card>

    <v-data-table
      :headers="headers"
      :items="reportsStore.reportData"
      :loading="reportsStore.loading"
      density="compact"
      class="elevation-1 border"
      hover
    >
      <template v-slot:item.date="{ item }">
        {{ formatDate(item.date) }}
      </template>

      <template v-slot:item.price="{ item }">
        {{ formatCurrency(item.price) }}
      </template>

      <template v-slot:item.cost="{ item }">
        {{ formatCurrency(item.cost) }}
      </template>

      <template v-slot:item.sum="{ item }">
        {{ formatCurrency(item.sum) }}
      </template>

      <template v-slot:item.costPerUnit="{ item }">
        {{ formatCurrency(item.costPerUnit) }}
      </template>
      <template v-slot:item.revenue="{ item }">
        {{ formatCurrency(item.revenue) }}
      </template>

      <template v-slot:item.totalCost="{ item }">
        {{ formatCurrency(item.totalCost) }}
      </template>

      <template v-slot:item.grossProfit="{ item }">
             <span :class="item.grossProfit < 0 ? 'text-error' : 'text-success'">
                 {{ formatCurrency(item.grossProfit) }}
             </span>
      </template>

      <template v-slot:item.markupPercent="{ item }">
        {{ item.markupPercent }}%
      </template>

      <template v-slot:tfoot
                v-if="reportsStore.selectedReportType === 'sales' && reportsStore.reportData.length > 0">
        <tr class="bg-grey-lighten-3 font-weight-bold">
          <td colspan="5" class="text-right">Итого:</td>
          <td>{{
              formatCurrency(reportsStore.reportData.reduce((acc, i) => acc + i.revenue, 0))
            }}
          </td>
          <td>{{
              formatCurrency(reportsStore.reportData.reduce((acc, i) => acc + i.totalCost, 0))
            }}
          </td>
          <td>{{
              formatCurrency(reportsStore.reportData.reduce((acc, i) => acc + i.grossProfit, 0))
            }}
          </td>
          <td></td>
        </tr>
      </template>

    </v-data-table>
  </v-container>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}

.text-error {
  color: #d32f2f;
}

.text-success {
  color: #2e7d32;
}
</style>
