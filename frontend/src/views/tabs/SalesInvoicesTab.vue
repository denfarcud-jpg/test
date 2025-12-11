<script setup lang="ts">
import { onMounted, ref } from 'vue';
import SalesInvoiceForm from '@/components/sales-invoice/SalesInvoiceForm.vue';
import { useSalesInvoicesStore } from '@/stores/salesInvoices';
import { useWarehouseStore } from '@/stores/warehouse';
import { useSalesInvoiceFormStore } from '@/stores/salesInvoiceForm';

const salesInvoicesStore = useSalesInvoicesStore();
const warehouseStore = useWarehouseStore();
const formStore = useSalesInvoiceFormStore();

const dialog = ref(false);

const statusOptions = ['Черновик', 'Проведен'];


const headers: any[] = [
  { title: 'Дата документа', key: 'dateShipment', align: 'start' },
  { title: 'Номер', key: 'numShipment' },
  { title: 'Контрагент', key: 'partnerName' },
  { title: 'Дата проведения', key: 'dateConducted' },
  { title: 'Склад', key: 'store.name' },
  { title: 'Сумма', key: 'totalSum', align: 'end' },
  { title: 'ID сделки', key: 'bitrixDealId' },
  { title: 'Ответственный', key: 'responsible' },
  { title: 'Статус', key: 'status' },
];

onMounted(() => {
  warehouseStore.fetchStores();
  salesInvoicesStore.fetchInvoices();
});

const onSearch = () => {
  salesInvoicesStore.fetchInvoices();
};

const onAdd = () => {
  formStore.resetForm();
  dialog.value = true;
};

const onRowDblClick = (event: any, { item }: any) => {
  formStore.loadInvoice(item.id);
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
              v-model="salesInvoicesStore.filters.dateStart"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            ></v-text-field>
            <v-text-field
              v-model="salesInvoicesStore.filters.dateEnd"
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
              v-model="salesInvoicesStore.filters.conductedStart"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            ></v-text-field>
            <v-text-field
              v-model="salesInvoicesStore.filters.conductedEnd"
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
              v-model="salesInvoicesStore.filters.status"
              :items="statusOptions"
              label="Статус"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            ></v-select>

            <v-select
              v-model="salesInvoicesStore.filters.storeId"
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
            :loading="salesInvoicesStore.loading"
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
        :items="salesInvoicesStore.invoices"
        :loading="salesInvoicesStore.loading"
        hover
        density="compact"
        class="elevation-1"
        @dblclick:row="onRowDblClick"
      >
        <template v-slot:item.dateShipment="{ item }">
          {{ formatDate(item.dateShipment) }}
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
      <SalesInvoiceForm
        @close="dialog = false"
        @refresh="salesInvoicesStore.fetchInvoices()"
      />
    </v-dialog>
  </v-container>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
