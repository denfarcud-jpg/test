<script setup lang="ts">
import { ref } from 'vue';
import ResiduesTab from './tabs/ResiduesTab.vue';
import ReceiptsTab from './tabs/ReceiptsTab.vue';
import WriteOffsTab from '@/views/tabs/WriteOffsTab.vue';
import SalesInvoicesTab from '@/views/tabs/SalesInvoicesTab.vue';
import PostingsTab from '@/views/tabs/PostingsTab.vue';
import ReportsTab from '@/views/tabs/ReportsTab.vue';

const tab = ref('residues');
</script>

<template>
  <v-card class="fill-height">
    <v-card-title class="text-h5 font-weight-bold py-3">
      Склад
    </v-card-title>


    <v-tabs
      v-model="tab"
      color="primary"
      bg-color="grey-lighten-4"
    >
      <v-tab value="residues">Остатки</v-tab>
      <v-tab value="receipts">Приходы</v-tab>
      <v-tab value="sales">Реализации</v-tab>
      <v-tab value="writeoffs">Списания</v-tab>
      <v-tab value="postings">Оприходования</v-tab>
      <v-tab value="reports">Отчеты</v-tab>
    </v-tabs>


    <v-card-text class="pa-0">
      <v-window v-model="tab">


        <v-window-item value="residues">
          <ResiduesTab />
        </v-window-item>


        <v-window-item value="receipts">
          <ReceiptsTab />
        </v-window-item>

        <v-window-item value="sales" class="h-100">
          <SalesInvoicesTab />
        </v-window-item>

        <v-window-item value="writeoffs" class="h-100">
          <WriteOffsTab />
        </v-window-item>

        <v-window-item value="postings" class="h-100">
          <PostingsTab />
        </v-window-item>

        <v-window-item value="reports" class="h-100">
           <ReportsTab />
        </v-window-item>

      </v-window>
    </v-card-text>
  </v-card>
</template>
