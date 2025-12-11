<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useWarehouseStore } from '@/stores/warehouse';
import ReceiptForm from '@/components/receipt/ReceiptForm.vue';
import {useReceiptFormStore} from "@/stores/receiptForm.ts";
const dialog = ref(false);
const formStore = useReceiptFormStore();

const onAdd = () => {
  formStore.resetForm();
  dialog.value = true;
};
const onRowDblClick = (event: any, { item }: any) => {
  formStore.loadReceipt(item.id);
  dialog.value = true;
};

const warehouseStore = useWarehouseStore();

const selectedStoreId = ref<number | null>(null);

const headers: any[] = [
  { title: 'Наименование', key: 'name', align: 'start' },
  { title: 'ЕИ', key: 'unit', align: 'center', width: '100px' },
  { title: 'Остаток', key: 'balance', align: 'end', width: '150px' },
];

onMounted(() => {
  warehouseStore.fetchStores();
});

const onGenerateReport = () => {
  if (selectedStoreId.value) {
    warehouseStore.fetchResidues(selectedStoreId.value);
  }
};
</script>

<template>
  <v-container fluid>

    <v-row align="center" class="mb-4">
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedStoreId"
          :items="warehouseStore.stores"
          item-title="name"
          item-value="id"
          label="Выберите склад"
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-warehouse"
        ></v-select>
      </v-col>

      <v-col cols="12" md="3">
        <v-btn
          color="primary"
          @click="onGenerateReport"
          :loading="warehouseStore.loading"
          :disabled="!selectedStoreId"
          height="40"
        >
          Сформировать
        </v-btn>
      </v-col>
    </v-row>


    <v-card variant="outlined">
      <v-data-table
        :headers="headers"
        :items="warehouseStore.residues"
        :loading="warehouseStore.loading"
        hover
        density="compact"
        no-data-text="Нет данных или отчет не сформирован"
      >

        <template v-slot:item.balance="{ item }">
          <span :class="item.balance < 0 ? 'text-red font-weight-bold' : ''">
            {{ item.balance }}
          </span>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>
