import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

// 캐시 키
const ACCIDENTS_CACHE_KEY = 'nexwork_accidents_cache';
const CACHE_TIMESTAMP_KEY = 'nexwork_accidents_cache_timestamp';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5분

export function useSupabaseSecurityAccident() {
  const [items, setItems] = useState<SecurityAccidentItem[]>([]);
  const [loading, setLoading] = useState(true); // 초기 로딩 상태를 true로 설정하여 깜빡임 방지
  const [error, setError] = useState<string | null>(null);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 캐시에서 데이터 로드
  const loadFromCache = useCallback(() => {
    try {
      const cachedData = sessionStorage.getItem(ACCIDENTS_CACHE_KEY);
      const cachedTimestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();

        // 캐시가 유효한 경우
        if (now - timestamp < CACHE_EXPIRY_MS) {
          const parsedData = JSON.parse(cachedData) as SecurityAccidentItem[];
          console.log('✅ 캐시에서 보안사고 데이터 로드:', parsedData.length, '건');
          setItems(parsedData);
          return true;
        } else {
          console.log('⏰ 캐시 만료됨');
        }
      }
      return false;
    } catch (err) {
      console.error('❌ 캐시 로드 실패:', err);
      return false;
    }
  }, []);

  // 캐시에 데이터 저장
  const saveToCache = useCallback((data: SecurityAccidentItem[]) => {
    try {
      sessionStorage.setItem(ACCIDENTS_CACHE_KEY, JSON.stringify(data));
      sessionStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('💾 보안사고 데이터 캐시 저장:', data.length, '건');
    } catch (err) {
      console.error('❌ 캐시 저장 실패:', err);
    }
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
      saveToCache(accidentData || []); // 캐시에 저장
    } catch (error) {
      console.error('🔴 fetchAccidents 오류:', error);
      setError('데이터 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [saveToCache]);

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
        console.log('🔵 updateData:', updateData);
        console.log('🔵 updateData keys:', Object.keys(updateData));

        const { data, error } = await supabase.from('security_accident_data').update(updateData).eq('id', id).select();

        console.log('🔵 Supabase 쿼리 결과:', { data, error });

        if (error) {
          console.error('수정 실패:', error);
          setError(error.message || '수정에 실패했습니다.');
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
    const hasCachedData = loadFromCache();

    if (hasCachedData) {
      // 캐시 데이터가 있으면 로딩 상태 해제
      setLoading(false);
      console.log('⚡ 캐시 데이터 즉시 표시 (깜빡임 방지)');
    }

    // 2. 백그라운드에서 최신 데이터 가져오기 (항상 실행)
    fetchAccidents();
  }, [fetchAccidents, loadFromCache]);

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
