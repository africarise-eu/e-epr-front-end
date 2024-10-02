import { ref } from 'vue';
import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig, AxiosError } from 'axios';
import { useSnackbarStore } from '@/stores/snackbar';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
export interface ApiResponse <T>{
  status: string;
  code: number;
  message: string;
  data: T;
  error: boolean;
  loading: boolean;
}
export function useApi() {
  const authStore = useAuthStore();
  const snackbarStore = useSnackbarStore()
  const loading = ref(false);
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const stringifiedToken = localStorage.getItem('user');
    if (stringifiedToken) {
      const user = JSON.parse(stringifiedToken);
      config.headers['Authorization'] = `Bearer ${user.accessToken}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)
  const handleErrorByStatusCode = (statusCode: number, message: string): string => {
    switch (statusCode) {
      case 400:
        return `${message}`;
      case 401:
        return message??'apiResponse.401';
      case 403:
        return message??'apiResponse.403';
      case 404:
        return message??'apiResponse.404';
      case 500:
        return message??'apiResponse.500';
      default:
        return `Error (${statusCode}): ${message}`;
    }
  };

  const useAPI = async <T> (
    url: string,
    method: string,
    payload?: unknown,
    params?: object,
    config?: AxiosRequestConfig,
    customHeaders: Record<string, string> ={}
  ): Promise<ApiResponse<T>> => {
    loading.value = true;

    try {

      const updatedConfig = {
        ...config,
        headers: {
          ...config?.headers,
          ...customHeaders, // Add custom headers here
        },
      };

      const response = await api({
        url,
        method,
        data: payload,
        params: params,
        ...updatedConfig,
      });
      const result = response.data;
      if (result.error) {
        throw new Error(result);
      } 

      return result;
    } catch (error) {
      
      const router = useRouter();
      const axiosError = error as AxiosError<ApiResponse<T>>;
      const statusCode = axiosError.response?.status || 500;
      const errorMessage = axiosError.response?.data?.message || 'apiResponse.errorOccurred';
      const formattedErrorMessage = handleErrorByStatusCode(statusCode, errorMessage);
      snackbarStore.showMessage(formattedErrorMessage, 'error');
      if(statusCode==401 && errorMessage == "Oops! Unauthorized access"){
        authStore.forceToLogout();
      }
      return {
        status: 'error',
        code: statusCode,
        message: formattedErrorMessage,
        data: null as unknown as T,
        error: true,
        loading: false,
      };
    } finally {
      loading.value = false;
    }
  };

  return {
    useAPI,
    loading,
  };
}