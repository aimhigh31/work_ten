import axios, { AxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';

const axiosServices = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

// ==============================|| AXIOS - FOR MOCK SERVICES ||============================== //

/**
 * Request interceptor to add Authorization token to request
 * NextAuth는 쿠키 기반 인증을 사용하므로 명시적인 토큰 헤더 추가는 불필요
 */
axiosServices.interceptors.request.use(
  async (config) => {
    // NextAuth 세션은 쿠키로 자동 전달되므로 별도의 헤더 추가 불필요
    // const session = await getSession();
    // if (session) {
    //   // 필요시 커스텀 헤더 추가 가능
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosServices.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 401 에러 - 자동 로그아웃
    if (error.response?.status === 401 && !window.location.href.includes('/login')) {
      await signOut();
      window.location.pathname = '/login';
      return Promise.reject({ error: '로그인이 필요합니다.', status: 401 });
    }

    // 403 에러 - 권한 없음
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.error || '이 작업을 수행할 권한이 없습니다.';
      console.error('❌ [Axios] 403 권한 에러:', errorMessage);
      return Promise.reject({ error: errorMessage, status: 403 });
    }

    // 네트워크 에러
    if (!error.response) {
      console.error('❌ [Axios] 네트워크 에러:', error.message);
      return Promise.reject({ error: '서버에 연결할 수 없습니다.', status: 0, originalError: error.message });
    }

    // 기타 에러
    const errorData = error.response?.data;
    const errorMessage = errorData?.error || errorData?.message || `요청 실패 (${error.response?.status})`;

    console.error('❌ [Axios] API 에러:', {
      status: error.response?.status,
      url: error.config?.url,
      error: errorMessage
    });

    return Promise.reject({
      error: errorMessage,
      status: error.response?.status,
      data: errorData
    });
  }
);

export default axiosServices;

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosServices.get(url, { ...config });

  return res.data;
};

export const fetcherPost = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosServices.post(url, { ...config });

  return res.data;
};
