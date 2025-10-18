import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

const CACHE_KEY = createCacheKey('security_attendee', 'data');

export interface SecurityAttendeeItem {
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
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  is_active?: boolean;
}

export const useSupabaseSecurityAttendee = () => {
  const [data, setData] = useState<SecurityAttendeeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: attendees, error: fetchError } = await supabase
        .from('security_education_attendee')
        .select('*')
        .order('id', { ascending: true });

      if (fetchError) {
        console.error('참석자 데이터 조회 실패:', fetchError);
        setError(fetchError.message);
        return;
      }

      setData(attendees || []);
      saveToCache(CACHE_KEY, attendees || []);
    } catch (err) {
      console.error('참석자 데이터 조회 중 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttendeesByEducationId = useCallback(async (educationId: number) => {
    try {
      setLoading(true);
      setError(null);

      const { data: attendees, error: fetchError } = await supabase
        .from('security_education_attendee')
        .select('*')
        .eq('education_id', educationId)
        .order('id', { ascending: true });

      if (fetchError) {
        console.error('특정 교육 참석자 데이터 조회 실패:', fetchError);
        setError(fetchError.message);
        return [];
      }

      return attendees || [];
    } catch (err) {
      console.error('특정 교육 참석자 데이터 조회 중 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addAttendee = useCallback(
    async (attendee: Omit<SecurityAttendeeItem, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>) => {
      try {
        setLoading(true);
        setError(null);

        const { data: newAttendee, error: addError } = await supabase.from('security_education_attendee').insert([attendee]).select();

        if (addError) {
          console.error('참석자 추가 실패:', addError);
          setError(addError.message);
          return null;
        }

        await fetchData();
        return newAttendee && newAttendee[0] ? newAttendee[0] : null;
      } catch (err) {
        console.error('참석자 추가 중 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  const addMultipleAttendees = useCallback(
    async (attendees: Omit<SecurityAttendeeItem, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>[]) => {
      try {
        setLoading(true);
        setError(null);

        console.log('🟢 참석자 일괄 추가 시작:', attendees);

        const { data: newAttendees, error: addError } = await supabase.from('security_education_attendee').insert(attendees).select();

        if (addError) {
          console.error('❌ 참석자 일괄 추가 실패:', addError);
          setError(addError.message);
          return null;
        }

        console.log('✅ 참석자 일괄 추가 성공:', newAttendees);
        await fetchData();
        return newAttendees || [];
      } catch (err) {
        console.error('❌ 참석자 일괄 추가 중 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  const updateAttendee = useCallback(
    async (id: number, updates: Partial<SecurityAttendeeItem>) => {
      setLoading(true);
      setError(null);

      console.log('🔵 참석자 수정 시작:', { id, updates });

      // 안전한 업데이트 객체 생성
      const cleanUpdates: any = {};

      // 허용된 필드만 복사
      const allowedFields = [
        'user_name',
        'user_code',
        'department',
        'position',
        'email',
        'phone',
        'attendance_status',
        'attendance_date',
        'completion_status',
        'score',
        'certificate_issued',
        'notes',
        'is_active'
      ];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          cleanUpdates[key] = value;
        }
      }

      console.log('🔵 정리된 업데이트 데이터:', cleanUpdates);

      try {
        const { data: updatedAttendee, error: updateError } = await supabase
          .from('security_education_attendee')
          .update(cleanUpdates)
          .eq('id', id)
          .select();

        if (updateError) {
          console.error('❌ 참석자 수정 실패:', updateError.message || 'Unknown error');
          setError(updateError.message || 'Database update failed');
          setLoading(false);
          return null;
        }

        console.log('✅ 참석자 수정 성공:', updatedAttendee);
        await fetchData();
        return updatedAttendee && updatedAttendee[0] ? updatedAttendee[0] : null;
      } catch (err) {
        console.error('❌ 참석자 수정 중 예외:', err);
        setError('Network or system error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  const deleteAttendee = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        setError(null);

        const { error: deleteError } = await supabase.from('security_education_attendee').delete().eq('id', id);

        if (deleteError) {
          console.error('참석자 삭제 실패:', deleteError);
          setError(deleteError.message);
          return false;
        }

        await fetchData();
        return true;
      } catch (err) {
        console.error('참석자 삭제 중 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  const deleteAttendeesByEducationId = useCallback(
    async (educationId: number) => {
      try {
        setLoading(true);
        setError(null);

        console.log('🗑️ 교육 ID로 참석자 일괄 삭제:', educationId);

        const { error: deleteError } = await supabase.from('security_education_attendee').delete().eq('education_id', educationId);

        if (deleteError) {
          console.error('❌ 참석자 일괄 삭제 실패:', deleteError);
          setError(deleteError.message);
          return false;
        }

        console.log('✅ 참석자 일괄 삭제 성공');
        await fetchData();
        return true;
      } catch (err) {
        console.error('❌ 참석자 일괄 삭제 중 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  useEffect(() => {
    const cachedData = loadFromCache<SecurityAttendeeItem[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      console.log('⚡ [SecurityAttendee] 캐시 데이터 즉시 표시');
    }
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    fetchData,
    fetchAttendeesByEducationId,
    addAttendee,
    addMultipleAttendees,
    updateAttendee,
    deleteAttendee,
    deleteAttendeesByEducationId
  };
};
