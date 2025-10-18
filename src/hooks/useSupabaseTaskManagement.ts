import { useState, useCallback } from 'react';
import supabase from '../lib/supabaseClient';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// 업무 데이터 타입 (DB 스키마)
export interface TaskRecord {
  id: string;
  code: string;
  registration_date: string;
  start_date: string | null;
  completed_date: string | null;
  department: string | null;
  work_content: string | null;
  description: string | null;
  team: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  progress: number;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 업무 생성 입력 타입
export interface TaskInput {
  code: string;
  registration_date: string;
  start_date?: string | null;
  completed_date?: string | null;
  department?: string | null;
  work_content?: string | null;
  description?: string | null;
  team?: string | null;
  assignee_id?: string | null;
  assignee_name?: string | null;
  progress?: number;
  status?: string;
}

// 업무 수정 입력 타입
export interface TaskUpdate {
  start_date?: string | null;
  completed_date?: string | null;
  department?: string | null;
  work_content?: string | null;
  description?: string | null;
  team?: string | null;
  assignee_id?: string | null;
  assignee_name?: string | null;
  progress?: number;
  status?: string;
}

// 캐시 키
const CACHE_KEY = createCacheKey('task_management', 'tasks');

export const useSupabaseTaskManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 업무 목록 조회 (투자관리 방식: 캐시 우선 전략)
  const getTasks = useCallback(async (): Promise<TaskRecord[]> => {
    // 1. 캐시 확인 (캐시가 있으면 즉시 반환)
    const cachedData = loadFromCache<TaskRecord[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [TaskManagement] 캐시 데이터 반환 (깜빡임 방지)');
      return cachedData;
    }

    // 2. 캐시 없으면 DB 조회
    try {
      console.log('📞 getTasks 호출');
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('main_task_data')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.log('❌ Supabase 조회 오류:', fetchError);
        throw fetchError;
      }

      console.log('✅ getTasks 성공:', data?.length || 0, '개');

      // 3. 캐시에 저장
      saveToCache(CACHE_KEY, data || []);

      return data || [];

    } catch (err: any) {
      console.log('❌ getTasks 실패:', err);
      setError(err.message || '업무 데이터 조회 실패');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 업무 추가
  const addTask = useCallback(async (task: TaskInput): Promise<TaskRecord | null> => {
    try {
      console.log('🆕 업무 추가 시작:', task);
      setLoading(true);
      setError(null);

      const insertData = {
        code: task.code,
        registration_date: task.registration_date,
        start_date: task.start_date || null,
        completed_date: task.completed_date || null,
        department: task.department || null,
        work_content: task.work_content || null,
        description: task.description || null,
        team: task.team || null,
        assignee_id: task.assignee_id || null,
        assignee_name: task.assignee_name || null,
        progress: task.progress || 0,
        status: task.status || '대기'
      };

      const { data, error } = await supabase
        .from('main_task_data')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.log('❌ Supabase 생성 오류:', error);
        throw error;
      }

      console.log('✅ addTask 성공:', data);

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return data;
    } catch (err: any) {
      console.log('❌ addTask 실패:', err);
      setError(err.message || '업무 추가 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 업무 수정
  const updateTask = useCallback(async (id: string, updates: TaskUpdate): Promise<boolean> => {
    console.log('🔄 업무 수정 시작:', { id, updates });

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('main_task_data')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.log('❌ Supabase 수정 오류:', error);
        throw error;
      }

      if (!data) {
        throw new Error('수정된 데이터가 반환되지 않았습니다.');
      }

      console.log('✅ updateTask 성공:', data);

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return true;
    } catch (err: any) {
      console.log('❌ updateTask 실패:', err);
      setError(err.message || '업무 수정 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 업무 삭제 (soft delete)
  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    console.log('🗑️ 업무 삭제 시작:', id);

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('main_task_data')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.log('❌ Supabase 삭제 오류:', error);
        throw error;
      }

      console.log('✅ deleteTask 성공:', data);

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return true;
    } catch (err: any) {
      console.log('❌ deleteTask 실패:', err);
      setError(err.message || '업무 삭제 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 코드 중복 확인
  const checkCodeExists = useCallback(async (code: string): Promise<boolean> => {
    try {
      const { data, error: checkError } = await supabase
        .from('main_task_data')
        .select('id')
        .eq('code', code)
        .eq('is_active', true);

      if (checkError) {
        console.error('코드 확인 실패:', checkError);
        return false;
      }

      return data && data.length > 0;
    } catch (err) {
      console.error('코드 확인 중 오류:', err);
      return false;
    }
  }, []);

  return {
    getTasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    checkCodeExists
  };
};
