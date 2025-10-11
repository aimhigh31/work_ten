// ========================================
// 플랫 구조 마스터코드 관리 React Hook
// ========================================

import { useState, useEffect, useCallback } from 'react';
import { masterCodeService } from 'services/supabase/mastercode.service';

// ========================================
// 플랫 구조 마스터코드 훅
// ========================================
export function useMasterCodeFlat() {
  const [flatCodes, setFlatCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 플랫 구조 마스터코드 목록 조회
  const fetchFlatCodes = useCallback(async (groupCode?: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await masterCodeService.getAllFlatCodes(groupCode);
      setFlatCodes(data);
    } catch (err: any) {
      setError(err.message || '마스터코드 조회 중 오류가 발생했습니다.');
      console.error('마스터코드 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 특정 그룹의 서브코드 옵션 조회
  const getSubCodeOptions = useCallback(async (groupCode: string) => {
    try {
      const options = await masterCodeService.getSubCodeSelectOptions(groupCode);
      return options;
    } catch (err: any) {
      console.error('서브코드 옵션 조회 실패:', err);
      return [];
    }
  }, []);

  // 플랫 구조 데이터 생성
  const createFlatCode = useCallback(
    async (data: {
      group_code: string;
      group_name: string;
      group_description?: string;
      sub_code: string;
      sub_name: string;
      sub_description?: string;
      code_value1?: string;
      code_value2?: string;
      code_value3?: string;
      display_order?: number;
    }): Promise<boolean> => {
      try {
        setError(null);

        await masterCodeService.createFlatCode(data);

        // 목록 새로고침
        await fetchFlatCodes();
        return true;
      } catch (err: any) {
        setError(err.message || '마스터코드 생성 중 오류가 발생했습니다.');
        console.error('마스터코드 생성 실패:', err);
        return false;
      }
    },
    [fetchFlatCodes]
  );

  // 플랫 구조 데이터 업데이트
  const updateFlatCode = useCallback(
    async (
      id: number,
      data: {
        group_name?: string;
        group_description?: string;
        sub_name?: string;
        sub_description?: string;
        code_value1?: string;
        code_value2?: string;
        code_value3?: string;
        display_order?: number;
        group_status?: string;
        sub_status?: string;
      }
    ): Promise<boolean> => {
      try {
        setError(null);

        await masterCodeService.updateFlatCode(id, data);

        // 목록 새로고침
        await fetchFlatCodes();
        return true;
      } catch (err: any) {
        setError(err.message || '마스터코드 업데이트 중 오류가 발생했습니다.');
        console.error('마스터코드 업데이트 실패:', err);
        return false;
      }
    },
    [fetchFlatCodes]
  );

  // 플랫 구조 데이터 삭제
  const deleteFlatCode = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setError(null);

        await masterCodeService.deleteFlatCode(id);

        // 목록 새로고침
        await fetchFlatCodes();
        return true;
      } catch (err: any) {
        setError(err.message || '마스터코드 삭제 중 오류가 발생했습니다.');
        console.error('마스터코드 삭제 실패:', err);
        return false;
      }
    },
    [fetchFlatCodes]
  );

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 초기 로드
  useEffect(() => {
    fetchFlatCodes();
  }, [fetchFlatCodes]);

  return {
    flatCodes,
    loading,
    error,
    fetchFlatCodes,
    getSubCodeOptions,
    createFlatCode,
    updateFlatCode,
    deleteFlatCode,
    clearError
  };
}

// ========================================
// 직급 옵션 전용 훅 (사용자관리 등에서 사용)
// ========================================
export function useUserLevelOptions() {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await masterCodeService.getSubCodeSelectOptions('USER_LEVEL');

      // 드롭다운용 형태로 변환
      const convertedOptions = data.map((option) => ({
        id: option.value,
        code_name: option.label,
        code_value: option.value,
        description: option.description,
        disabled: option.disabled
      }));

      setOptions(convertedOptions);
    } catch (err: any) {
      setError(err.message || '직급 옵션 조회 중 오류가 발생했습니다.');
      console.error('직급 옵션 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    options,
    loading,
    error,
    refetch: fetchOptions
  };
}
