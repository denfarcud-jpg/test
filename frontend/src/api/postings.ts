import axiosClient from '@/services/axiosApiClient.ts';

type PostingResponse = any;

export async function fetchPostings(params: any): Promise<PostingResponse[]> {
  const response = await axiosClient.get('/posting', { params });
  return response.data;
}

export async function getPostingById(id: number): Promise<PostingResponse> {
  const response = await axiosClient.get(`/posting/${id}`);
  return response.data;
}

export async function createPosting(data: any): Promise<PostingResponse> {
  const response = await axiosClient.post('/posting', data);
  return response.data;
}

export async function updatePosting(id: number, data: any): Promise<PostingResponse> {
  const response = await axiosClient.patch(`/posting/${id}`, data);
  return response.data;
}

export async function deletePosting(id: number): Promise<void> {
  const response = await axiosClient.delete(`/posting/${id}`);
  return response.data;
}
