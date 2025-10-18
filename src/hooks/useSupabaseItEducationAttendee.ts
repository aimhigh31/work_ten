import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

console.log('Supabase 환경변수 확인:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  keyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// IT교육 참석자 데이터 타입 정의
export interface ItEducationAttendeeData {
  id: number;
  education_id: number;
  user_id?: number;
  user_name: string;
  user_code?: string;
  department?: string;
  position?: string;
  email?: string;
  phone?: string;
  attendance_status?: string; // '예정' | '참석' | '불참'
  attendance_date?: string;
  completion_status?: string; // '완료' | '미완료'
  score?: number;
  certificate_issued?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  is_active?: boolean;
}

// 프론트엔드용 참석자 아이템 타입 (기존 컴포넌트와 호환)
export interface ParticipantItem {
  id: string;
  name: string;
  position: string;
  department: string;
  attendanceCheck: string;
  opinion: string;
  notes: string;
}

export function useSupabaseItEducationAttendee() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // IT교육 참석자 데이터 조회 (교육 ID별)
  const getAttendeesByEducationId = useCallback(async (educationId: number): Promise<ItEducationAttendeeData[]> => {
    // 1. 동적 캐시 키 생성
    const cacheKey = createCacheKey('it_education_attendee', `edu_${educationId}`);
    const cachedData = loadFromCache<ItEducationAttendeeData[]>(cacheKey, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [ItEducationAttendee] 캐시 데이터 반환');
      return cachedData;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 참석자 데이터 조회 중:', { educationId });

      const { data, error } = await supabase
        .from('it_education_attendee')
        .select('*')
        .eq('education_id', educationId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ IT교육 참석자 조회 실패:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          educationId,
          fullError: error
        });
        throw error;
      }

      console.log('✅ 참석자 데이터 조회 성공:', { educationId, count: data?.length || 0 });

      // 2. 캐시에 저장
      saveToCache(cacheKey, data || []);

      return data || [];
    } catch (err) {
      console.error('❌ 참석자 데이터 조회 오류 상세:', {
        educationId,
        error: err,
        message: err instanceof Error ? err.message : '알 수 없는 오류',
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err,
        stringified: JSON.stringify(err)
      });

      const errorMessage = err instanceof Error ? err.message : 'IT교육 참석자 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // IT교육 참석자 데이터 저장 (교육 ID별 일괄 저장)
  const saveAttendeesByEducationId = useCallback(async (educationId: number, attendeeItems: Partial<ItEducationAttendeeData>[]): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      console.log('💾 참석자 데이터 저장 시작:', { educationId, itemCount: attendeeItems.length });

      // 1. 기존 활성 참석자 데이터 삭제 (소프트 삭제)
      const { error: deleteError } = await supabase
        .from('it_education_attendee')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('education_id', educationId)
        .eq('is_active', true);

      if (deleteError) {
        console.error('❌ 기존 참석자 삭제 실패:', deleteError);
        throw deleteError;
      }

      // 2. 새 참석자 데이터 저장
      if (attendeeItems.length > 0) {
        const attendeeDataToSave = attendeeItems.map((item) => ({
          education_id: educationId,
          user_name: item.user_name || '',
          user_code: item.user_code || '',
          department: item.department || '',
          position: item.position || '',
          email: item.email || '',
          phone: item.phone || '',
          attendance_status: item.attendance_status || '예정',
          completion_status: item.completion_status || '미완료',
          score: item.score || null,
          certificate_issued: item.certificate_issued || false,
          notes: item.notes || '',
          is_active: true,
          created_by: 'user',
          updated_by: 'user'
        }));

        const { error: insertError } = await supabase
          .from('it_education_attendee')
          .insert(attendeeDataToSave);

        if (insertError) {
          console.error('❌ 새 참석자 저장 실패:', insertError);
          throw insertError;
        }
      }

      console.log('✅ 참석자 데이터 저장 성공:', { educationId, itemCount: attendeeItems.length });
      return true;
    } catch (err) {
      console.error('❌ 참석자 저장 오류 상세:', {
        educationId,
        error: err,
        message: err instanceof Error ? err.message : '알 수 없는 오류',
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err,
        stringified: JSON.stringify(err)
      });

      const errorMessage = err instanceof Error ? err.message : 'IT교육 참석자 저장 중 오류가 발생했습니다.';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 특정 참석자 항목 수정
  const updateAttendeeItem = useCallback(async (id: number, updates: Partial<ItEducationAttendeeData>): Promise<ItEducationAttendeeData | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('it_education_attendee')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ 참석자 항목 수정 실패:', error);
        throw error;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'IT교육 참석자 수정 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('❌ 참석자 항목 수정 오류:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 참석자 항목 삭제 (소프트 삭제)
  const deleteAttendeeItem = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('it_education_attendee')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ 참석자 항목 삭제 실패:', error);
        throw error;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'IT교육 참석자 삭제 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('❌ 참석자 항목 삭제 오류:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 데이터 변환 함수들
  const convertSupabaseToParticipantItem = useCallback((supabaseData: ItEducationAttendeeData): ParticipantItem => {
    return {
      id: supabaseData.id.toString(),
      name: supabaseData.user_name,
      participant: supabaseData.user_name,  // participant 필드 추가
      position: supabaseData.position || '',
      department: supabaseData.department || '',
      attendanceCheck: supabaseData.attendance_status || '예정',
      opinion: supabaseData.notes || '',
      notes: `점수: ${supabaseData.score || '-'}점, 완료상태: ${supabaseData.completion_status || '미완료'}`
    };
  }, []);

  const convertParticipantItemToSupabase = useCallback((item: ParticipantItem): Partial<ItEducationAttendeeData> => {
    // notes에서 점수와 완료상태 추출 (간단한 파싱)
    const notesParts = item.notes.split(', ');
    let score = null;
    let completionStatus = '미완료';

    notesParts.forEach(part => {
      if (part.includes('점수:')) {
        const scoreMatch = part.match(/(\d+)점/);
        if (scoreMatch) score = parseInt(scoreMatch[1]);
      }
      if (part.includes('완료상태:')) {
        const statusMatch = part.match(/완료상태: (.+)/);
        if (statusMatch) completionStatus = statusMatch[1];
      }
    });

    return {
      user_name: item.participant || item.name,  // participant가 있으면 사용, 없으면 name 사용
      department: item.department,
      position: item.position,
      attendance_status: item.attendanceCheck,
      completion_status: completionStatus,
      score: score,
      notes: item.opinion
    };
  }, []);

  return {
    loading,
    error,
    getAttendeesByEducationId,
    saveAttendeesByEducationId,
    updateAttendeeItem,
    deleteAttendeeItem,
    convertSupabaseToParticipantItem,
    convertParticipantItemToSupabase
  };
}