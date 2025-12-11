import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchReportData } from '@/api/reports';

export const useReportsStore = defineStore('reports', () => {
  const loading = ref(false);
  const reportData = ref<any[]>([]);


  const selectedReportType = ref<string | null>(null);
  const filters = ref({
    storeId: null as number | null,
    dateStart: new Date().toISOString().substr(0, 10),
    dateEnd: new Date().toISOString().substr(0, 10),
    productId: null as number | null,
  });


  const clearData = () => {
    reportData.value = [];
  };

  const generateReport = async () => {
    if (!selectedReportType.value) return;

    loading.value = true;
    try {
      const params = {
        reportType: selectedReportType.value,
        ...filters.value
      };


      if (selectedReportType.value === 'price') {

        delete (params as any).dateStart;
        delete (params as any).dateEnd;
        delete (params as any).storeId;
      }

      reportData.value = await fetchReportData(params);
    } catch (e) {
      console.error('Ошибка получения отчета:', e);
      reportData.value = [];
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    reportData,
    selectedReportType,
    filters,
    generateReport,
    clearData
  };
});
