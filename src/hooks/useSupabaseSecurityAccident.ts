import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// 캐시 키
const CACHE_KEY = createCacheKey('security_accident', 'data');

// 보안사고 데이터 타입
export interface SecurityAccidentItem {
  id: number;
  no?: number;
  registration_date: string;
  code: string;
  incident_type: '악성코드' | '랜섬웨어' | '정보유출' | '계정탈취' | '디도스' | 'DB손상';
  request_content?: string;
  main_content: string;
  response_action?: string;
  description?: string;
  severity: '높음' | '중간' | '낮음';
  status: '대기' | '진행' | '완료' | '홀딩';
  response_stage?: '사고 탐지' | '현황 분석' | '개선 조치 중' | '즉시 해결' | '근본개선';
  assignee?: string;
  team?: string;
  discoverer?: string;
  impact_scope?: string;
  cause_analysis?: string;
  prevention_plan?: string;
  occurrence_date?: string;
  completed_date?: string;
  start_date?: string;
  progress?: number;
  attachment?: boolean;
  attachment_count?: number;
  attachments?: any[];
  likes?: number;
  liked_by?: string[];
  views?: number;
  viewed_by?: string[];
  comments?: any[];
  incident_report?: any;
  post_measures?: any;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
}

// 보안사고 생성/수정 요청 타입
export interface CreateSecurityAccidentRequest {
  code: string;
  incident_type: '악성코드' | '랜섬웨어' | '정보유출' | '계정탈취' | '디도스' | 'DB손상';
  request_content?: string;
  main_content: string;
  response_action?: string;
  description?: string;
  severity?: '높음' | '중간' | '낮음';
  status?: '대기' | '진행' | '완료' | '홀딩';
  response_stage?: '사고 탐지' | '현황 분석' | '개선 조치 중' | '즉시 해결' | '근본개선';
  assignee?: string;
  team?: string;
  discoverer?: string;
  impact_scope?: string;
  cause_analysis?: string;
  prevention_plan?: string;
  occurrence_date?: string;
  completed_date?: string;
  start_date?: string;
  progress?: number;
  attachment?: boolean;
  attachment_count?: number;
}

export function useSupabaseSecurityAccident() {
  const [items, setItems] = useState<SecurityAccidentItem[]>([]);
  const [loading, setLoading] = useState(false); // 즉시 UI 렌더링을 위해 false로 설정
  const [error, setError] = useState<string | null>(null);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 전체 보안사고 목록 조회
  const fetchAccidents = useCallback(async () => {
    try {
      console.log('🟡 fetchAccidents 시작');
      setLoading(true);
      setError(null);

      const { data: accidentData, error } = await supabase.from('security_accident_data').select('*').order('no', { ascending: false }); // 최신순 정렬

      if (error) {
        console.error('🔴 Supabase 에러:', error);
        setError('데이터 조회에 실패했습니다.');
        return;
      }

      console.log('🟡 fetchAccidents 응답:', accidentData);
      console.log('🟡 데이터 설정:', accidentData?.length, '개');
      setItems(accidentData || []);
      saveToCache(CACHE_KEY, accidentData || []); // 캐시에 저장
    } catch (error) {
      console.error('🔴 fetchAccidents 오류:', error);
      setError('데이터 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 특정 보안사고 상세 데이터 조회
  const fetchAccidentDetail = useCallback(async (id: number): Promise<SecurityAccidentItem | null> => {
    try {
      setError(null);

      const { data, error } = await supabase.from('security_accident_data').select('*').eq('id', id).single();

      if (error) {
        console.error('상세 데이터 조회 오류:', error);
        setError('데이터 조회에 실패했습니다.');
        return null;
      }

      return data;
    } catch (error) {
      console.error('상세 데이터 조회 오류:', error);
      setError('데이터 조회에 실패했습니다.');
      return null;
    }
  }, []);

  // 보안사고 데이터 생성
  const createAccident = useCallback(
    async (accidentData: CreateSecurityAccidentRequest): Promise<any> => {
      try {
        console.log('🟢 createAccident 시작');
        console.log('🟢 Supabase 객체 상태:', !!supabase);
        console.log('🟢 요청 데이터:', JSON.stringify(accidentData, null, 2));
        console.log('🟢 요청 데이터 키:', Object.keys(accidentData));
        console.log('🟢 요청 데이터 값들:');
        Object.entries(accidentData).forEach(([key, value]) => {
          console.log(`  ${key}: ${value} (${typeof value})`);
        });

        setError(null);

        // 연결 테스트
        console.log('🔗 Supabase 연결 테스트 중...');
        const { count, error: testError } = await supabase.from('security_accident_data').select('*', { count: 'exact', head: true });
        console.log('🔗 연결 테스트 결과:', { count, error: testError });

        console.log('🔗 INSERT 쿼리 실행 중...');
        const { data, error } = await supabase.from('security_accident_data').insert(accidentData).select().single();

        console.log('🔗 INSERT 결과 - data:', data);
        console.log('🔗 INSERT 결과 - error:', error);

        if (error) {
          console.error('🔴 Supabase 생성 실패:');
          console.error('🔴 Error 전체 객체:', error);
          console.error('🔴 Error.message:', error.message);
          console.error('🔴 Error.code:', error.code);
          console.error('🔴 Error.details:', error.details);
          console.error('🔴 Error.hint:', error.hint);
          console.error('🔴 Error JSON:', JSON.stringify(error, null, 2));

          // 각 속성별로 개별 확인
          console.error('🔴 Error 속성별 확인:');
          for (const [key, value] of Object.entries(error)) {
            console.error(`  ${key}: ${value} (${typeof value})`);
          }

          const errorMessage =
            error.message || error.details || error.hint || `Supabase 오류: ${JSON.stringify(error)}` || '생성에 실패했습니다.';
          setError(errorMessage);
          throw new Error(`생성 실패: ${errorMessage}`);
        }

        console.log('🟢 생성 성공:', data);
        console.log('🟢 데이터 재조회 시작');
        await fetchAccidents();
        console.log('🟢 데이터 재조회 완료');

        return data;
      } catch (error) {
        console.error('🔴 createAccident catch 블록 진입');
        console.error('🔴 Error 타입:', typeof error);
        console.error('🔴 Error instanceof Error:', error instanceof Error);
        console.error('🔴 Error 전체 객체:', error);

        // Error 객체의 모든 속성 확인
        if (error && typeof error === 'object') {
          console.error('🔴 Error 객체 속성들:');
          for (const [key, value] of Object.entries(error)) {
            console.error(`  ${key}: ${value} (${typeof value})`);
          }
        }

        try {
          console.error('🔴 Error JSON 변환:', JSON.stringify(error, null, 2));
        } catch (jsonError) {
          console.error('🔴 Error JSON 변환 실패:', jsonError);
        }

        if (error instanceof Error) {
          console.error('🔴 Error.message:', error.message);
          console.error('🔴 Error.name:', error.name);
          console.error('🔴 Error.stack:', error.stack);
          setError(error.message);
        } else {
          const errorString = typeof error === 'string' ? error : JSON.stringify(error, null, 2);
          console.error('🔴 비표준 에러:', errorString);
          setError(errorString || '알 수 없는 오류가 발생했습니다.');
        }

        return null;
      }
    },
    [fetchAccidents]
  );

  // 보안사고 데이터 수정
  const updateAccident = useCallback(
    async (id: number, updateData: Partial<SecurityAccidentItem>): Promise<boolean> => {
      try {
        setError(null);
        console.log('🔵 updateAccident 시작');
        console.log('🔵 ID:', id, '타입:', typeof id);
        console.log('🔵 updateData (원본):', updateData);
        console.log('🔵 updateData keys:', Object.keys(updateData));

        // 테이블에 존재하는 컬럼만 필터링
        const allowedFields = [
          'no', 'registration_date', 'code', 'incident_type', 'request_content',
          'main_content', 'response_action', 'description', 'severity', 'status',
          'response_stage', 'assignee', 'team', 'discoverer', 'impact_scope',
          'cause_analysis', 'prevention_plan', 'occurrence_date', 'completed_date',
          'start_date', 'progress', 'attachment', 'attachment_count', 'attachments',
          'likes', 'liked_by', 'views', 'viewed_by', 'comments', 'incident_report',
          'post_measures', 'updated_at', 'updated_by', 'is_active'
        ];

        const filteredData: any = {};
        for (const key of Object.keys(updateData)) {
          if (allowedFields.includes(key)) {
            filteredData[key] = (updateData as any)[key];
          } else {
            console.warn(`⚠️ 테이블에 없는 필드 제외됨: ${key}`);
          }
        }

        console.log('🔵 filteredData (필터링 후):', filteredData);
        console.log('🔵 filteredData keys:', Object.keys(filteredData));

        const { data, error } = await supabase.from('security_accident_data').update(filteredData).eq('id', id).select();

        console.log('🔵 Supabase 쿼리 결과:', { data, error });

        if (error) {
          console.error('🔴 수정 실패 - 전체 에러 객체:', error);
          console.error('🔴 수정 실패 - error.message:', error.message);
          console.error('🔴 수정 실패 - error.details:', error.details);
          console.error('🔴 수정 실패 - error.hint:', error.hint);
          console.error('🔴 수정 실패 - error.code:', error.code);
          console.error('🔴 수정 실패 - JSON:', JSON.stringify(error, null, 2));
          console.error('🔴 수정하려던 데이터:', updateData);
          console.error('🔴 대상 ID:', id);

          // 에러 속성 순회
          console.error('🔴 에러 객체의 모든 속성:');
          for (const key in error) {
            console.error(`  ${key}:`, error[key]);
          }

          setError(error.message || error.details || error.hint || '수정에 실패했습니다.');
          return false;
        }

        await fetchAccidents();
        return true;
      } catch (error) {
        console.error('수정 오류:', error);
        setError(error instanceof Error ? error.message : '수정에 실패했습니다.');
        return false;
      }
    },
    [fetchAccidents]
  );

  // 보안사고 데이터 삭제
  const deleteAccident = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setError(null);

        const { error } = await supabase.from('security_accident_data').delete().eq('id', id);

        if (error) {
          console.error('삭제 실패:', error);
          setError(error.message || '삭제에 실패했습니다.');
          return false;
        }

        await fetchAccidents();
        return true;
      } catch (error) {
        console.error('삭제 오류:', error);
        setError('삭제에 실패했습니다.');
        return false;
      }
    },
    [fetchAccidents]
  );

  // 컴포넌트 마운트 시 데이터 로드 (캐시 우선 전략)
  useEffect(() => {
    // 1. 캐시에서 먼저 로드 (즉시 표시)
    const cachedData = loadFromCache<SecurityAccidentItem[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      setItems(cachedData);
      setLoading(false);
      console.log('⚡ [SecurityAccident] 캐시 데이터 즉시 표시 (깜빡임 방지)');
    }

    // 2. 백그라운드에서 최신 데이터 가져오기 (항상 실행)
    fetchAccidents();
  }, [fetchAccidents]);

  return {
    items,
    loading,
    error,
    clearError,
    fetchAccidents,
    fetchAccidentDetail,
    createAccident,
    updateAccident,
    deleteAccident
  };
}
