<script setup lang="ts">
import { onMounted, ref } from 'vue';
import ReceiptForm from '@/components/receipt/ReceiptForm.vue';
import { useReceiptsStore } from '@/stores/receipts';
import { useWarehouseStore } from '@/stores/warehouse';
import {useReceiptFormStore} from "@/stores/receiptForm.ts";

const receiptsStore = useReceiptsStore();
const warehouseStore = useWarehouseStore();
const formStore = useReceiptFormStore();

const dialog = ref(false);


const statusOptions = ['Черновик', 'Проведен'];


const headers: any[] = [
  { title: 'Дата документа', key: 'dateReceipt', align: 'start'  },
  { title: 'Номер', key: 'numReceipt' },
  { title: 'Контрагент', key: 'partnerName' },
  { title: 'Дата проведения', key: 'dateConducted' },
  { title: 'Склад', key: 'store.name' },
  { title: 'Сумма', key: 'totalSum', align: 'end' },

   { title: 'ID сделки', key: 'dealId' },
  { title: 'Ответственный', key: 'responsible' },
  { title: 'Статус', key: 'status' },
];

onMounted(() => {
  warehouseStore.fetchStores();
  receiptsStore.fetchReceipts();
});

const onSearch = () => {
  receiptsStore.fetchReceipts();
};

const onAdd = () => {
  formStore.resetForm();
  dialog.value = true;
};


const onRowDblClick = (event: any, { item }: any) => {
  formStore.loadReceipt(item.id);
  dialog.value = true;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ru-RU');
};
</script>

<template>
  <v-container fluid>

    <v-card class="mb-4 pa-4" variant="outlined">
      <v-row dense>

        <v-col cols="12" md="6" lg="3">
          <div class="text-caption mb-1">Дата создания:</div>
          <div class="d-flex gap-2">
            <v-text-field
              v-model="receiptsStore.filters.dateStart"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            ></v-text-field>
            <v-text-field
              v-model="receiptsStore.filters.dateEnd"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            ></v-text-field>
          </div>
        </v-col>


        <v-col cols="12" md="6" lg="3">
          <div class="text-caption mb-1">Дата проведения:</div>
          <div class="d-flex gap-2">
            <v-text-field
              v-model="receiptsStore.filters.conductedStart"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            ></v-text-field>
            <v-text-field
              v-model="receiptsStore.filters.conductedEnd"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            ></v-text-field>
          </div>
        </v-col>

        <v-col cols="12" md="6" lg="3">
          <div class="text-caption mb-1">Параметры:</div>
          <div class="d-flex gap-2">
            <v-select
              v-model="receiptsStore.filters.status"
              :items="statusOptions"
              label="Статус"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            ></v-select>

            <v-select
              v-model="receiptsStore.filters.storeId"
              :items="warehouseStore.stores"
              item-title="name"
              item-value="id"
              label="Склад"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            ></v-select>
          </div>
        </v-col>

        <v-col cols="12" md="6" lg="3" class="d-flex align-end gap-2">
          <v-btn
            color="info"
            @click="onSearch"
            :loading="receiptsStore.loading"
            prepend-icon="mdi-magnify"
          >
            Сформировать
          </v-btn>

          <v-btn
            color="success"
            @click="onAdd"
            prepend-icon="mdi-plus"
          >
            Добавить
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card variant="flat">
      <v-data-table
        :headers="headers"
        :items="receiptsStore.receipts"
        :loading="receiptsStore.loading"
        hover
        density="compact"
        class="elevation-1 "
        @dblclick:row="onRowDblClick"
      >

        <template v-slot:item.dateReceipt="{ item }">
          {{ formatDate(item.dateReceipt) }}
        </template>
        <template v-slot:item.dateConducted="{ item }">
          {{ formatDate(item.dateConducted) }}
        </template>


        <template v-slot:item.totalSum="{ item }">
          {{ Number(item.totalSum).toLocaleString('ru-RU') }} ₽
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            size="x-small"
            :color="item.status === 'Проведен' ? 'green' : 'grey'"
          >
            {{ item.status }}
          </v-chip>
        </template>
      </v-data-table>
    </v-card>
    <v-dialog
        v-model="dialog"
        fullscreen
        transition="dialog-bottom-transition"
    >
      <ReceiptForm
        @close="dialog = false"
        @refresh="receiptsStore.fetchReceipts()"
      />
    </v-dialog>
  </v-container>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
