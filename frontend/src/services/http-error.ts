import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  let message = 'Произошла неизвестная ошибка';

  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    if (responseData) {
      if (Array.isArray(responseData.message)) {
        message = responseData.message.join(', ');
      } else if (typeof responseData.message === 'string') {
        message = responseData.message;
      } else if (typeof responseData === 'string') {
        message = responseData;
      }
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return message;
}
