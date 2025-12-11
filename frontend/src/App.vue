<script setup lang="ts">
import { RouterView } from "vue-router";
import { useNotificationStore } from '@/stores/notifications';
const notificationStore = useNotificationStore();

</script>

<template>
  <v-app>
    <v-main>
      <RouterView />
    </v-main>
    <v-snackbar
      v-model="notificationStore.show"
      :color="notificationStore.color"
      timeout="5000"
      location="top center"
      multi-line
      vertical
    >
      <div class="text-wrap">
      {{ notificationStore.text }}
      </div>

      <template v-slot:actions>
        <v-btn variant="text" @click="notificationStore.show = false">Закрыть</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<style scoped></style>
