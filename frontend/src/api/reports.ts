import axiosClient from '@/services/axiosApiClient';

export const fetchReportData = async (params: any) => {
  const response = await axiosClient.get('/reports', { params });
  return response.data;
};
