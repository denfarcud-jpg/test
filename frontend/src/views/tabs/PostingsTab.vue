<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PostingForm from '@/components/posting/PostingForm.vue';
import { usePostingFormStore } from '@/stores/postingForm';
import { usePostingsStore } from '@/stores/postings';
import { useWarehouseStore } from '@/stores/warehouse';

const warehouseStore = useWarehouseStore();
const formStore = usePostingFormStore();
const postingsStore = usePostingsStore();

const dialog = ref(false);
const statusOptions = ['Черновик', 'Проведен'];

const headers: any[] = [
  { title: 'Дата документа', key: 'datePosting' },
  { title: 'Номер', key: 'numPosting' },
  { title: 'Дата проведения', key: 'dateConducted' },
  { title: 'Склад', key: 'store.name' },
  { title: 'Сумма', key: 'totalSum', align: 'end' },
  { title: 'ID сделки', key: 'bitrixDealId' },
  { title: 'Ответственный', key: 'responsible' },
  { title: 'Статус', key: 'status' },
];

onMounted(() => {
  warehouseStore.fetchStores();
  postingsStore.loadPostings();
});

const onAdd = () => {
  formStore.resetForm();
  dialog.value = true;
};

const onSearch = () => {
  postingsStore.loadPostings();
};

const onRowDblClick = (e: any, { item }: any) => {
  formStore.loadPosting(item.id);
  dialog.value = true;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ru-RU');
};
</script>

<template>
  <v-container fluid>
    <v-card class="mb-4 pa-4" variant="outlined">
      <v-row dense>
        <v-col cols="12" md="6" lg="3">
          <div class="text-caption mb-1">Дата создания:</div>
          <div class="d-flex gap-2">
            <v-text-field v-model="postingsStore.filters.dateStart" type="date" density="compact" variant="outlined" hide-details></v-text-field>
            <v-text-field v-model="postingsStore.filters.dateEnd" type="date" density="compact" variant="outlined" hide-details></v-text-field>
          </div>
        </v-col>
        <v-col cols="12" md="6" lg="3">
          <div class="text-caption mb-1">Дата проведения:</div>
          <div class="d-flex gap-2">
            <v-text-field v-model="postingsStore.filters.conductedStart" type="date" density="compact" variant="outlined" hide-details></v-text-field>
            <v-text-field v-model="postingsStore.filters.conductedEnd" type="date" density="compact" variant="outlined" hide-details></v-text-field>
          </div>
        </v-col>

        <v-col cols="12" md="6" lg="3">
          <div class="text-caption mb-1">Параметры:</div>
          <div class="d-flex gap-2">
            <v-select
              v-model="postingsStore.filters.status"
              :items="statusOptions"
              label="Статус"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            ></v-select>

            <v-select
              v-model="postingsStore.filters.storeId"
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
          <v-btn color="info" @click="onSearch" :loading="postingsStore.loading" prepend-icon="mdi-magnify">Сформировать</v-btn>
          <v-btn color="success" @click="onAdd" prepend-icon="mdi-plus">Добавить</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card class="flex-grow-1" variant="flat">
      <v-data-table
        :headers="headers"
        :items="postingsStore.postings"
        :loading="postingsStore.loading"
        density="compact"
        class="h-100"
        fixed-header
        hover
        @dblclick:row="onRowDblClick"
      >
        <template v-slot:item.datePosting="{ item }"> {{ formatDate(item.datePosting) }} </template>
        <template v-slot:item.dateConducted="{ item }"> {{ formatDate(item.dateConducted) }} </template>
        <template v-slot:item.totalSum="{ item }">
          {{ Number(item.totalSum).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) }}
        </template>
        <template v-slot:item.status="{ item }">
          <v-chip size="x-small" :color="item.status === 'Проведен' ? 'green' : 'grey'">{{ item.status }}</v-chip>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" fullscreen transition="dialog-bottom-transition">
      <PostingForm
        @close="dialog = false"
        @refresh="postingsStore.loadPostings()"
      />
    </v-dialog>
  </v-container>
</template>

<style scoped>
.gap-2 { gap: 8px; }
</style>
