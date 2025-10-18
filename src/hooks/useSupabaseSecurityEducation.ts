import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// 캐시 키
const CACHE_KEY = createCacheKey('security_education', 'data');

// 보안교육 데이터 타입
export interface SecurityEducationItem {
  id: number;
  no?: number;
  education_name: string;
  description?: string;
  education_type?: string;
  assignee?: string;
  team?: string; // 팀 필드 추가
  execution_date?: string;
  location?: string;
  status?: string;
  participant_count?: number;
  registration_date?: string;
  code?: string;
  achievements?: string;
  feedback?: string;
  improvement_points?: string;
  improvements?: string; // 개선사항 필드 추가
  notes?: string; // 비고 필드 추가
  effectiveness_score?: number;
  completion_rate?: number;
  satisfaction_score?: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
  metadata?: any;
}

// 커리큘럼 데이터 타입
export interface CurriculumItem {
  id: number;
  education_id: number;
  session_order: number;
  session_title: string;
  session_description?: string;
  duration_minutes?: number;
  instructor?: string;
  session_type?: string;
  materials?: string;
  objectives?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
}

// 참석자 데이터 타입
export interface AttendeeItem {
  id: number;
  education_id: number;
  user_id?: number;
  user_name: string;
  user_code?: string;
  department?: string;
  position?: string;
  email?: string;
  phone?: string;
  attendance_status?: string;
  attendance_date?: string;
  completion_status?: string;
  score?: number;
  certificate_issued?: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
}

// 교육 생성/수정 요청 타입
export interface CreateSecurityEducationRequest {
  education_name: string;
  description?: string;
  education_type?: string;
  assignee?: string;
  team?: string; // 팀 필드 추가
  execution_date?: string;
  location?: string;
  status?: string;
  participant_count?: number;
  code?: string;
  achievements?: string;
  feedback?: string;
  improvement_points?: string;
  effectiveness_score?: number;
  completion_rate?: number;
  satisfaction_score?: number;
}

// 상세 데이터 타입 (교육 + 커리큘럼 + 참석자)
export interface SecurityEducationDetail {
  education: SecurityEducationItem;
  curriculum: CurriculumItem[];
  attendees: AttendeeItem[];
}

export function useSupabaseSecurityEducation() {
  const [items, setItems] = useState<SecurityEducationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 전체 교육 목록 조회 - Supabase 직접 사용
  const fetchEducations = useCallback(async () => {
    try {
      console.log('🟡 fetchEducations 시작');
      setLoading(true);
      setError(null);

      // 중앙화된 Supabase 클라이언트 사용

      const { data: educationData, error } = await supabase.from('security_education_data').select('*').order('no', { ascending: true });

      if (error) {
        console.error('🔴 Supabase 에러:', error);
        setError('데이터 조회에 실패했습니다.');
        return;
      }

      console.log('🟡 fetchEducations 응답:', educationData);
      console.log('🟡 데이터 설정:', educationData?.length, '개');
      setItems(educationData || []);
      saveToCache(CACHE_KEY, educationData || []); // 캐시에 저장
    } catch (error) {
      console.error('🔴 fetchEducations 오류:', error);
      setError('데이터 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 특정 교육 상세 데이터 조회 - Supabase 직접 사용
  const fetchEducationDetail = useCallback(async (id: number): Promise<SecurityEducationDetail | null> => {
    try {
      setError(null);

      // 중앙화된 Supabase 클라이언트 사용

      const { data, error } = await supabase.from('security_education_data').select('*').eq('id', id).single();

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

  // 교육 데이터 생성 - Supabase 직접 사용
  const createEducation = useCallback(
    async (educationData: CreateSecurityEducationRequest): Promise<any> => {
      try {
        console.log('🟢 createEducation 시작:', educationData);
        setError(null);

        // 중앙화된 Supabase 클라이언트 사용

        const { data, error } = await supabase.from('security_education_data').insert(educationData).select().single();

        if (error) {
          console.error('🔴 생성 실패:', error);
          setError(error.message || '생성에 실패했습니다.');
          return null;
        }

        console.log('🟢 생성 성공:', data);
        console.log('🟢 데이터 재조회 시작');
        await fetchEducations();
        console.log('🟢 데이터 재조회 완료');

        return data;
      } catch (error) {
        console.error('🔴 생성 오류:', error);
        setError('생성에 실패했습니다.');
        return null;
      }
    },
    [fetchEducations]
  );

  // 교육 데이터 수정 - Supabase 직접 사용
  const updateEducation = useCallback(
    async (id: number, updateData: Partial<SecurityEducationItem>): Promise<boolean> => {
      try {
        setError(null);
        console.log('🔵 updateEducation 시작');
        console.log('🔵 ID:', id, '타입:', typeof id);
        console.log('🔵 updateData:', updateData);
        console.log('🔵 updateData keys:', Object.keys(updateData));

        // 중앙화된 Supabase 클라이언트 사용
        console.log('🔵 Supabase 쿼리 실행 중...');

        const { data, error } = await supabase.from('security_education_data').update(updateData).eq('id', id).select(); // 업데이트 후 결과를 확인하기 위해 select() 추가

        console.log('🔵 Supabase 쿼리 결과:', { data, error });

        if (error) {
          console.error('수정 실패:', error);
          console.error('❌ 에러 구조:');
          console.error('  - message:', error.message);
          console.error('  - code:', error.code);
          console.error('  - details:', error.details);
          console.error('  - hint:', error.hint);
          console.error('  - name:', error.name);
          console.error('  - status:', error.status);
          console.error('updateData:', updateData);
          console.error('id:', id);
          console.error('❌ 에러 객체 키들:', Object.keys(error));

          // 순환 참조를 피하는 안전한 직렬화
          const safeStringify = (obj: any) => {
            const seen = new WeakSet();
            return JSON.stringify(
              obj,
              (key, val) => {
                if (val != null && typeof val == 'object') {
                  if (seen.has(val)) {
                    return '[Circular]';
                  }
                  seen.add(val);
                }
                return val;
              },
              2
            );
          };
          console.error('❌ 에러 안전 직렬화:', safeStringify(error));

          setError(error.message || '수정에 실패했습니다.');
          return false;
        }

        await fetchEducations();
        return true;
      } catch (error) {
        console.error('수정 오류:', error);
        console.error('수정 오류 상세:', JSON.stringify(error, null, 2));
        console.error('오류 타입:', typeof error);
        console.error('오류 메시지:', error instanceof Error ? error.message : '알 수 없는 오류');
        setError(error instanceof Error ? error.message : '수정에 실패했습니다.');
        return false;
      }
    },
    [fetchEducations]
  );

  // 교육 데이터 삭제 - Supabase 직접 사용
  const deleteEducation = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setError(null);

        // 중앙화된 Supabase 클라이언트 사용

        const { error } = await supabase.from('security_education_data').delete().eq('id', id);

        if (error) {
          console.error('삭제 실패:', error);
          setError(error.message || '삭제에 실패했습니다.');
          return false;
        }

        await fetchEducations();
        return true;
      } catch (error) {
        console.error('삭제 오류:', error);
        setError('삭제에 실패했습니다.');
        return false;
      }
    },
    [fetchEducations]
  );

  // 컴포넌트 마운트 시 데이터 로드 (캐시 우선 전략)
  useEffect(() => {
    // 1. 캐시에서 먼저 로드 (즉시 표시)
    const cachedData = loadFromCache<SecurityEducationItem[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      setItems(cachedData);
      setLoading(false);
      console.log('⚡ [SecurityEducation] 캐시 데이터 즉시 표시 (깜빡임 방지)');
    }

    // 2. 백그라운드에서 최신 데이터 가져오기 (항상 실행)
    fetchEducations();
  }, [fetchEducations]);

  return {
    items,
    loading,
    error,
    clearError,
    fetchEducations,
    fetchEducationDetail,
    createEducation,
    updateEducation,
    deleteEducation
  };
}
