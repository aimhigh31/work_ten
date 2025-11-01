import { useState, useCallback, useEffect } from 'react';
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
  task_type: string | null;
  kpi_id: string | null;
  kpi_record_id: number | null;
  kpi_work_content: string | null;
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
  task_type?: string | null;
  kpi_id?: string | null;
  kpi_record_id?: number | null;
  kpi_work_content?: string | null;
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
  task_type?: string | null;
  kpi_id?: string | null;
  kpi_record_id?: number | null;
  kpi_work_content?: string | null;
}

// 캐시 키
const CACHE_KEY = createCacheKey('task_management', 'tasks');

export const useSupabaseTaskManagement = () => {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 업무 목록 조회 (Education 패턴: 캐시 우선, DB는 필요시만)
  const getTasks = useCallback(async (forceRefresh: boolean = false): Promise<TaskRecord[]> => {
    try {
      console.log('📞 getTasks 호출', { forceRefresh });

      // 1. 강제 새로고침이 아니면 캐시 확인
      if (!forceRefresh) {
        const cachedData = loadFromCache<TaskRecord[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
        if (cachedData) {
          console.log('⚡ [TaskManagement] 캐시 데이터 반환 (깜빡임 방지)');
          setTasks(cachedData); // 상태 업데이트
          setLoading(false);
          return cachedData; // 캐시가 있으면 즉시 반환
        }
      }

      // 2. 캐시가 없거나 강제 새로고침일 때만 DB 조회
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

      // 3. 최신 데이터로 상태 업데이트 (KPI 패턴)
      setTasks(data || []);

      // 4. 캐시에 저장
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

      const { data, error } = await supabase.from('main_task_data').insert([insertData]).select().single();

      if (error) {
        console.log('❌ Supabase 생성 오류:', error);
        throw error;
      }

      console.log('✅ addTask 성공:', data);

      // ✅ 로컬 상태 즉시 업데이트 (KPI 패턴)
      setTasks((prev) => [data, ...prev]);

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

      // ✅ 로컬 상태 즉시 업데이트 (KPI 패턴)
      setTasks((prev) => prev.map((task) => (task.id === id ? data : task)));

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

      const { data, error } = await supabase.from('main_task_data').update({ is_active: false }).eq('id', id).select().single();

      if (error) {
        console.log('❌ Supabase 삭제 오류:', error);
        throw error;
      }

      console.log('✅ deleteTask 성공:', data);

      // ✅ 로컬 상태 즉시 업데이트 (KPI 패턴)
      setTasks((prev) => prev.filter((task) => task.id !== id));

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

  // 여러 업무 삭제 (soft delete - KPI 패턴)
  const deleteTasks = useCallback(async (ids: string[]): Promise<boolean> => {
    console.log('🗑️ 여러 업무 삭제 시작:', ids);

    try {
      setLoading(true);
      setError(null);

      // ✅ KPI 패턴: .in()으로 여러 개 한 번에 삭제
      const { error } = await supabase.from('main_task_data').update({ is_active: false }).in('id', ids);

      if (error) {
        console.log('❌ Supabase 일괄 삭제 오류:', error);
        throw error;
      }

      console.log('✅ deleteTasks 성공:', ids.length, '개');

      // ✅ 로컬 상태 즉시 업데이트 (KPI 패턴)
      setTasks((prev) => prev.filter((task) => !ids.includes(task.id)));

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return true;
    } catch (err: any) {
      console.log('❌ deleteTasks 실패:', err);
      setError(err.message || '업무 일괄 삭제 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 코드 중복 확인
  const checkCodeExists = useCallback(async (code: string): Promise<boolean> => {
    try {
      const { data, error: checkError } = await supabase.from('main_task_data').select('id').eq('code', code).eq('is_active', true);

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

  // 초기화 - 캐시 로드하지 않음 (목업 데이터 방지)
  useEffect(() => {
    // 캐시를 로드하지 않음 - 컴포넌트에서 getTasks(true)로 DB 직접 조회
    console.log('⚡ [TaskManagement] 훅 초기화 - 캐시 로드 스킵');
  }, []); // 빈 배열로 변경 (초기 1회만)

  return {
    tasks,
    getTasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    deleteTasks,
    checkCodeExists
  };
};
