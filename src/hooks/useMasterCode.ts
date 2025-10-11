// ========================================
// 마스터코드 관리 React Hook
// ========================================

import { useState, useEffect, useCallback } from 'react';
import { masterCodeService } from 'services/supabase/mastercode.service';
import {
  MasterCodeData,
  SubCodeData,
  MasterCodeTableRow,
  SubCodeTableRow,
  MasterCodeSearchFilter,
  SubCodeSearchFilter,
  CreateMasterCodeRequest,
  UpdateMasterCodeRequest,
  CreateSubCodeRequest,
  UpdateSubCodeRequest,
  MasterCodeStats,
  MasterCodeSelectOption,
  SubCodeSelectOption,
  MasterCodeWithSubCodes
} from 'types/mastercode';

// ========================================
// 마스터코드 메인 훅
// ========================================
export function useMasterCode() {
  const [masterCodes, setMasterCodes] = useState<MasterCodeTableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 마스터코드 목록 조회
  const fetchMasterCodes = useCallback(async (filter?: MasterCodeSearchFilter) => {
    try {
      setLoading(true);
      setError(null);

      const data = await masterCodeService.getMasterCodes(filter);
      setMasterCodes(data);
    } catch (err: any) {
      setError(err.message || '마스터코드 조회 중 오류가 발생했습니다.');
      console.error('마스터코드 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 마스터코드 생성
  const createMasterCode = useCallback(
    async (request: CreateMasterCodeRequest): Promise<boolean> => {
      try {
        setError(null);

        // 코드 그룹 중복 확인
        const exists = await masterCodeService.checkCodeGroupExists(request.code_group);
        if (exists) {
          setError('이미 존재하는 코드 그룹입니다.');
          return false;
        }

        await masterCodeService.createMasterCode(request);

        // 목록 새로고침
        await fetchMasterCodes();
        return true;
      } catch (err: any) {
        setError(err.message || '마스터코드 생성 중 오류가 발생했습니다.');
        console.error('마스터코드 생성 실패:', err);
        return false;
      }
    },
    [fetchMasterCodes]
  );

  // 마스터코드 업데이트
  const updateMasterCode = useCallback(
    async (request: UpdateMasterCodeRequest): Promise<boolean> => {
      try {
        setError(null);

        // 코드 그룹 중복 확인 (다른 ID인 경우만)
        if (request.code_group) {
          const exists = await masterCodeService.checkCodeGroupExists(request.code_group, request.id);
          if (exists) {
            setError('이미 존재하는 코드 그룹입니다.');
            return false;
          }
        }

        await masterCodeService.updateMasterCode(request);

        // 목록 새로고침
        await fetchMasterCodes();
        return true;
      } catch (err: any) {
        setError(err.message || '마스터코드 업데이트 중 오류가 발생했습니다.');
        console.error('마스터코드 업데이트 실패:', err);
        return false;
      }
    },
    [fetchMasterCodes]
  );

  // 마스터코드 삭제
  const deleteMasterCode = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setError(null);
        await masterCodeService.deleteMasterCode(id);

        // 목록 새로고침
        await fetchMasterCodes();
        return true;
      } catch (err: any) {
        setError(err.message || '마스터코드 삭제 중 오류가 발생했습니다.');
        console.error('마스터코드 삭제 실패:', err);
        return false;
      }
    },
    [fetchMasterCodes]
  );

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 초기 로드
  useEffect(() => {
    fetchMasterCodes();
  }, [fetchMasterCodes]);

  return {
    masterCodes,
    loading,
    error,
    fetchMasterCodes,
    createMasterCode,
    updateMasterCode,
    deleteMasterCode,
    clearError
  };
}

// ========================================
// 서브코드 훅
// ========================================
export function useSubCode(mastercode_id: number | null) {
  const [subCodes, setSubCodes] = useState<SubCodeTableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 서브코드 목록 조회
  const fetchSubCodes = useCallback(
    async (filter?: SubCodeSearchFilter) => {
      if (!mastercode_id) {
        setSubCodes([]);
        return;
      }

      try {
        // 로딩 상태를 즉시 표시하지 않고 100ms 후에 표시 (번쩍거림 방지)
        const timeout = setTimeout(() => {
          setLoading(true);
        }, 100);

        setError(null);

        const data = await masterCodeService.getSubCodes(mastercode_id, filter);
        setSubCodes(data);

        // 성공적으로 로드되면 로딩 타임아웃 취소
        clearTimeout(timeout);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || '서브코드 조회 중 오류가 발생했습니다.');
        console.error('서브코드 조회 실패:', err);
        setLoading(false);
      }
    },
    [mastercode_id]
  );

  // 서브코드 생성
  const createSubCode = useCallback(
    async (request: CreateSubCodeRequest): Promise<boolean> => {
      try {
        setError(null);

        // 서브코드 중복 확인
        const exists = await masterCodeService.checkSubCodeExists(request.mastercode_id, request.sub_code);
        if (exists) {
          setError('이미 존재하는 서브코드입니다.');
          return false;
        }

        await masterCodeService.createSubCode(request);

        // 목록 새로고침
        await fetchSubCodes();
        return true;
      } catch (err: any) {
        setError(err.message || '서브코드 생성 중 오류가 발생했습니다.');
        console.error('서브코드 생성 실패:', err);
        return false;
      }
    },
    [fetchSubCodes]
  );

  // 서브코드 업데이트
  const updateSubCode = useCallback(
    async (request: UpdateSubCodeRequest): Promise<boolean> => {
      try {
        setError(null);

        // 서브코드 중복 확인 (다른 ID인 경우만)
        if (request.sub_code && request.mastercode_id) {
          const exists = await masterCodeService.checkSubCodeExists(request.mastercode_id, request.sub_code, request.id);
          if (exists) {
            setError('이미 존재하는 서브코드입니다.');
            return false;
          }
        }

        await masterCodeService.updateSubCode(request);

        // 목록 새로고침
        await fetchSubCodes();
        return true;
      } catch (err: any) {
        setError(err.message || '서브코드 업데이트 중 오류가 발생했습니다.');
        console.error('서브코드 업데이트 실패:', err);
        return false;
      }
    },
    [fetchSubCodes]
  );

  // 서브코드 삭제
  const deleteSubCode = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setError(null);
        await masterCodeService.deleteSubCode(id);

        // 목록 새로고침
        await fetchSubCodes();
        return true;
      } catch (err: any) {
        setError(err.message || '서브코드 삭제 중 오류가 발생했습니다.');
        console.error('서브코드 삭제 실패:', err);
        return false;
      }
    },
    [fetchSubCodes]
  );

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // mastercode_id 변경 시 자동 로드
  useEffect(() => {
    if (mastercode_id) {
      fetchSubCodes();
    } else {
      setSubCodes([]);
      setLoading(false);
    }
  }, [mastercode_id, fetchSubCodes]);

  return {
    subCodes,
    loading,
    error,
    fetchSubCodes,
    createSubCode,
    updateSubCode,
    deleteSubCode,
    clearError
  };
}

// ========================================
// 마스터코드 상세 정보 훅 (서브코드 포함)
// ========================================
export function useMasterCodeDetail(id: number | null) {
  const [masterCodeDetail, setMasterCodeDetail] = useState<MasterCodeWithSubCodes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMasterCodeDetail = useCallback(async () => {
    if (!id) {
      setMasterCodeDetail(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await masterCodeService.getMasterCodeWithSubCodes(id);
      setMasterCodeDetail(data);
    } catch (err: any) {
      setError(err.message || '마스터코드 상세 조회 중 오류가 발생했습니다.');
      console.error('마스터코드 상세 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // id 변경 시 자동 로드
  useEffect(() => {
    fetchMasterCodeDetail();
  }, [fetchMasterCodeDetail]);

  return {
    masterCodeDetail,
    loading,
    error,
    refetch: fetchMasterCodeDetail
  };
}

// ========================================
// 선택 옵션 훅 (드롭다운용)
// ========================================
export function useMasterCodeOptions() {
  const [options, setOptions] = useState<MasterCodeSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await masterCodeService.getMasterCodeSelectOptions();
      setOptions(data);
    } catch (err: any) {
      setError(err.message || '마스터코드 옵션 조회 중 오류가 발생했습니다.');
      console.error('마스터코드 옵션 조회 실패:', err);
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

export function useSubCodeOptions(mastercode_id: number | null) {
  const [options, setOptions] = useState<SubCodeSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    if (!mastercode_id) {
      setOptions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await masterCodeService.getSubCodeSelectOptions(mastercode_id);
      setOptions(data);
    } catch (err: any) {
      setError(err.message || '서브코드 옵션 조회 중 오류가 발생했습니다.');
      console.error('서브코드 옵션 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [mastercode_id]);

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

// ========================================
// 통계 훅
// ========================================
export function useMasterCodeStats() {
  const [stats, setStats] = useState<MasterCodeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await masterCodeService.getMasterCodeStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || '마스터코드 통계 조회 중 오류가 발생했습니다.');
      console.error('마스터코드 통계 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}
