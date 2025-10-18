import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface KpiTaskData {
  id: number;
  kpi_id: number;
  text: string;
  checked: boolean;
  parent_id?: number | null;
  level: number;
  expanded: boolean;
  status?: string;
  due_date?: string | null;
  start_date?: string | null;
  progress_rate?: number;
  assignee?: string | null;
  team?: string | null;
  priority?: string | null;
  weight?: number;
  created_at?: string;
  updated_at?: string;
  // JOIN된 KPI 데이터
  impact?: string | null;
  kpi_work_content?: string | null;
}

export const useSupabaseKpiTask = (kpiId?: number) => {
  const [tasks, setTasks] = useState<KpiTaskData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 특정 KPI의 태스크 목록 조회
  const fetchTasks = useCallback(async (targetKpiId?: number) => {
    const fetchKpiId = targetKpiId || kpiId;
    if (!fetchKpiId) {
      console.warn('KPI ID가 제공되지 않았습니다.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('main_kpi_task')
        .select('*')
        .eq('kpi_id', fetchKpiId)
        .order('id', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setTasks(data || []);
    } catch (err: any) {
      console.error('KPI Task 조회 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [kpiId]);

  // 태스크 추가
  const addTask = useCallback(async (taskData: Omit<KpiTaskData, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('📝 KPI Task 추가 데이터:', taskData);

      const { data, error: insertError } = await supabase
        .from('main_kpi_task')
        .insert([taskData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Supabase Insert 오류:', insertError);
        throw insertError;
      }

      console.log('✅ KPI Task 추가 성공:', data);
      setTasks((prev) => [...prev, data]);
      return data;
    } catch (err: any) {
      console.error('KPI Task 추가 오류:', err);
      setError(err?.message || JSON.stringify(err));
      throw err;
    }
  }, []);

  // 태스크 수정
  const updateTask = useCallback(async (id: number, updates: Partial<KpiTaskData>) => {
    try {
      console.log('🔧 KPI Task 수정 시작:', { id, updates });

      const { data, error: updateError } = await supabase
        .from('main_kpi_task')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      console.log('📥 Supabase update 응답:', { data, error: updateError });

      if (updateError) {
        console.error('❌ Supabase update 에러 상세:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        });
        throw updateError;
      }

      console.log('✅ KPI Task 수정 성공:', data);
      setTasks((prev) => prev.map((task) => (task.id === id ? data : task)));
      return data;
    } catch (err: any) {
      console.error('❌ KPI Task 수정 오류 (catch):', err);
      console.error('❌ 에러 타입:', typeof err);
      console.error('❌ 에러 JSON:', JSON.stringify(err, null, 2));
      console.error('❌ 에러 message:', err?.message);
      console.error('❌ 에러 stack:', err?.stack);
      setError(err?.message || JSON.stringify(err));
      throw err;
    }
  }, []);

  // 태스크 삭제
  const deleteTask = useCallback(async (id: number) => {
    try {
      const { error: deleteError } = await supabase.from('main_kpi_task').delete().eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (err: any) {
      console.error('KPI Task 삭제 오류:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // 여러 태스크 삭제
  const deleteTasks = useCallback(async (ids: number[]) => {
    try {
      const { error: deleteError } = await supabase.from('main_kpi_task').delete().in('id', ids);

      if (deleteError) {
        throw deleteError;
      }

      setTasks((prev) => prev.filter((task) => !ids.includes(task.id)));
    } catch (err: any) {
      console.error('KPI Task 일괄 삭제 오류:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // 특정 KPI의 모든 태스크 삭제
  const deleteAllTasksByKpiId = useCallback(async (targetKpiId: number) => {
    try {
      const { error: deleteError } = await supabase.from('main_kpi_task').delete().eq('kpi_id', targetKpiId);

      if (deleteError) {
        throw deleteError;
      }

      if (targetKpiId === kpiId) {
        setTasks([]);
      }
    } catch (err: any) {
      console.error('KPI Task 전체 삭제 오류:', err);
      setError(err.message);
      throw err;
    }
  }, [kpiId]);

  // 사용자의 모든 KPI Task 조회 (KPI 데이터와 조인, 계층 구조 포함)
  const fetchAllTasksByUser = useCallback(async (userName: string) => {
    // 캐시 키 (사용자별로 다르게 생성)
    const cacheKey = createCacheKey('kpi_task', `user_${userName}`);

    // 1. 캐시에서 먼저 로드 (즉시 표시)
    const cachedData = loadFromCache<any[]>(cacheKey, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      setTasks(cachedData);
      setLoading(false);
      console.log('⚡ [KpiTask] 캐시 데이터 즉시 표시 (깜빡임 방지)');
    }

    try {
      console.log('🔍 fetchAllTasksByUser 시작:', userName);
      setLoading(true);
      setError(null);

      // 2. 사용자의 모든 task 조회 (KPI 데이터 포함)
      const { data, error: fetchError } = await supabase
        .from('main_kpi_task')
        .select(`
          *,
          main_kpi_data!main_kpi_task_kpi_id_fkey (
            impact,
            work_content,
            selection_background
          )
        `)
        .eq('assignee', userName)
        .order('id', { ascending: false });

      console.log('📥 Supabase 응답:', { data, error: fetchError });

      if (fetchError) {
        console.error('❌ Supabase 쿼리 에러:', fetchError);
        throw fetchError;
      }

      console.log('📊 조회된 raw 데이터:', data);
      console.log('📊 데이터 개수:', data?.length);

      // 3. parent_id 수집 (조회되지 않은 parent task ID들)
      const parentIds = new Set<number>();
      (data || []).forEach((task: any) => {
        if (task.parent_id) {
          parentIds.add(task.parent_id);
        }
      });

      // 4. 조회되지 않은 parent task들을 별도로 조회
      let parentTasks: any[] = [];
      if (parentIds.size > 0) {
        const missingParentIds = Array.from(parentIds).filter(
          (parentId) => !data?.some((task: any) => task.id === parentId)
        );

        if (missingParentIds.length > 0) {
          console.log('🔍 누락된 parent task 조회:', missingParentIds);
          const { data: parentData, error: parentError } = await supabase
            .from('main_kpi_task')
            .select(`
              *,
              main_kpi_data!main_kpi_task_kpi_id_fkey (
                impact,
                work_content,
                selection_background
              )
            `)
            .in('id', missingParentIds);

          if (parentError) {
            console.error('❌ Parent task 조회 에러:', parentError);
          } else {
            parentTasks = parentData || [];
            console.log('📥 Parent task 조회 성공:', parentTasks.length);
          }
        }
      }

      // 5. 모든 task를 합쳐서 Map 생성
      const taskMap = new Map();
      [...(data || []), ...parentTasks].forEach((task: any) => {
        taskMap.set(task.id, task);
      });

      // 6. 조인된 데이터를 평탄화 + parent task 정보 추가
      const flattenedData = (data || []).map((item: any) => {
        const parentTask = item.parent_id ? taskMap.get(item.parent_id) : null;

        return {
          ...item,
          impact: item.main_kpi_data?.impact || null,
          kpi_work_content: item.main_kpi_data?.work_content || null,
          kpi_selection_background: item.main_kpi_data?.selection_background || null,
          parent_task_text: parentTask?.text || null,
          parent_task_level: parentTask?.level || null,
          main_kpi_data: undefined // 중복 제거
        };
      });

      console.log('✅ 평탄화된 데이터:', flattenedData);
      console.log('✅ 최종 개수:', flattenedData.length);

      // 캐시에 저장
      saveToCache(cacheKey, flattenedData);

      setTasks(flattenedData);
      return flattenedData;
    } catch (err: any) {
      console.error('❌ 사용자 KPI Task 조회 오류:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    if (kpiId) {
      fetchTasks(kpiId);
    }
  }, [kpiId, fetchTasks]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    fetchAllTasksByUser,
    addTask,
    updateTask,
    deleteTask,
    deleteTasks,
    deleteAllTasksByKpiId
  };
};
