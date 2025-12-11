import axiosClient from '@/services/axiosApiClient';

export const getSalesInvoices = async (params?: any) => {
  const response = await axiosClient.get('/sales-invoice', { params });
  return response.data;
};

export const getSalesInvoiceById = async (id: number) => {
  const response = await axiosClient.get(`/sales-invoice/${id}`);
  return response.data;
};

export const createSalesInvoice = async (data: any) => {
  const response = await axiosClient.post('/sales-invoice', data);
  return response.data;
};

export const updateSalesInvoice = async (id: number, data: any) => {
  const response = await axiosClient.patch(`/sales-invoice/${id}`, data);
  return response.data;
};

export const deleteSalesInvoice = async (id: number) => {
  const response = await axiosClient.delete(`/sales-invoice/${id}`);
  return response.data;
};
