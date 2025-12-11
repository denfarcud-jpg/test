import axiosClient from '@/services/axiosApiClient.ts';

type ReceiptResponse = any;

export async function fetchReceipts(params: any): Promise<ReceiptResponse[]> {
  const response = await axiosClient.get('/receipt', { params });
  return response.data;
}

export async function getReceiptById(id: number): Promise<ReceiptResponse> {
  const response = await axiosClient.get(`/receipt/${id}`);
  return response.data;
}

export async function createReceipt(data: any): Promise<ReceiptResponse> {
  const response = await axiosClient.post('/receipt', data);
  return response.data;
}

export async function updateReceipt(id: number, data: any): Promise<ReceiptResponse> {
  const response = await axiosClient.patch(`/receipt/${id}`, data);
  return response.data;
}

export async function deleteReceipt(id: number): Promise<void> {
  const response = await axiosClient.delete(`/receipt/${id}`);
  return response.data;
}
