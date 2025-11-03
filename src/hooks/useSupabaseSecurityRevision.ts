import { useState, useCallback } from 'react';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// 리비전 데이터 타입
export interface SecurityRevisionItem {
  id: number;
  security_regulation_id: number;
  file_name: string;
  file_size: string;
  file_description: string;
  file_path: string;
  revision: string;
  upload_date: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
}

// 리비전 생성 요청 타입
export interface CreateSecurityRevisionRequest {
  security_regulation_id: number;
  file_name: string;
  file_size?: string;
  file_description?: string;
  file_path?: string;
}

export function useSupabaseSecurityRevision() {
  const [revisions, setRevisions] = useState<SecurityRevisionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 특정 파일의 리비전 목록 조회
  const fetchRevisions = useCallback(async (regulationId: number) => {
    // 1. 동적 캐시 키 생성 (규정 ID별로 별도 캐시)
    const cacheKey = createCacheKey('security_revision', `reg_${regulationId}`);
    const cachedData = loadFromCache<SecurityRevisionItem[]>(cacheKey, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [SecurityRevision] 캐시 데이터 반환 (깜빡임 방지)');
      setRevisions(cachedData);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📡 fetchRevisions: API 호출 시작, regulationId =', regulationId);
      const response = await fetch(`/api/security-regulation-revision?regulationId=${regulationId}`);
      const result = await response.json();

      console.log('📥 fetchRevisions: API 응답:', result);

      if (result.success) {
        setRevisions(result.data || []);
        // 2. 캐시에 저장
        saveToCache(cacheKey, result.data || []);
      } else {
        setError(result.error || '데이터 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ fetchRevisions: 조회 오류:', error);
      setError('데이터 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 새 리비전 생성
  const createRevision = useCallback(
    async (revisionData: CreateSecurityRevisionRequest): Promise<boolean> => {
      try {
        setError(null);

        console.log('📡 createRevision: API 호출 시작:', revisionData);
        const response = await fetch('/api/security-regulation-revision', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(revisionData)
        });

        const result = await response.json();
        console.log('📥 createRevision: API 응답:', result);

        if (result.success) {
          // 캐시 무효화 (최신 데이터 보장)
          const cacheKey = createCacheKey('security_revision', `reg_${revisionData.security_regulation_id}`);
          sessionStorage.removeItem(cacheKey);
          console.log('🗑️ createRevision: 캐시 무효화 완료');

          // 목록 새로고침
          await fetchRevisions(revisionData.security_regulation_id);
          return true;
        } else {
          setError(result.error || '생성에 실패했습니다.');
          return false;
        }
      } catch (error) {
        console.error('❌ createRevision: 생성 오류:', error);
        setError('생성에 실패했습니다.');
        return false;
      }
    },
    [fetchRevisions]
  );

  // 리비전 수정 (주로 파일 설명 수정)
  const updateRevision = useCallback(async (id: number, updateData: Partial<SecurityRevisionItem>): Promise<boolean> => {
    try {
      setError(null);

      console.log('📡 updateRevision: API 호출 시작:', { id, updateData });
      const response = await fetch('/api/security-regulation-revision', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, ...updateData })
      });

      const result = await response.json();
      console.log('📥 updateRevision: API 응답:', result);

      if (result.success) {
        // 로컬 state 업데이트
        setRevisions((prev) => {
          const updated = prev.map((rev) =>
            rev.id === id
              ? {
                  ...rev,
                  ...updateData,
                  updated_at: new Date().toISOString()
                }
              : rev
          );

          // 캐시 업데이트 (해당 리비전의 regulationId로 캐시 갱신)
          const targetRevision = prev.find((rev) => rev.id === id);
          if (targetRevision) {
            const cacheKey = createCacheKey('security_revision', `reg_${targetRevision.security_regulation_id}`);
            saveToCache(cacheKey, updated);
            console.log('💾 updateRevision: 캐시 업데이트 완료');
          }

          return updated;
        });
        return true;
      } else {
        setError(result.error || '수정에 실패했습니다.');
        return false;
      }
    } catch (error) {
      console.error('❌ updateRevision: 수정 오류:', error);
      setError('수정에 실패했습니다.');
      return false;
    }
  }, []);

  // 리비전 삭제
  const deleteRevision = useCallback(
    async (id: number, regulationId: number): Promise<boolean> => {
      try {
        setError(null);

        console.log('📡 deleteRevision: API 호출 시작:', id);
        const response = await fetch(`/api/security-regulation-revision?id=${id}`, {
          method: 'DELETE'
        });

        const result = await response.json();
        console.log('📥 deleteRevision: API 응답:', result);

        if (result.success) {
          // 캐시 무효화 (최신 데이터 보장)
          const cacheKey = createCacheKey('security_revision', `reg_${regulationId}`);
          sessionStorage.removeItem(cacheKey);
          console.log('🗑️ deleteRevision: 캐시 무효화 완료');

          // 목록 새로고침
          await fetchRevisions(regulationId);
          return true;
        } else {
          setError(result.error || '삭제에 실패했습니다.');
          return false;
        }
      } catch (error) {
        console.error('❌ deleteRevision: 삭제 오류:', error);
        setError('삭제에 실패했습니다.');
        return false;
      }
    },
    [fetchRevisions]
  );

  return {
    revisions,
    loading,
    error,
    clearError,
    fetchRevisions,
    createRevision,
    updateRevision,
    deleteRevision
  };
}
