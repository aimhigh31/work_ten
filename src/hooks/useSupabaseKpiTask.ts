import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

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
      const { data, error: updateError } = await supabase
        .from('main_kpi_task')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setTasks((prev) => prev.map((task) => (task.id === id ? data : task)));
      return data;
    } catch (err: any) {
      console.error('KPI Task 수정 오류:', err);
      setError(err.message);
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
    addTask,
    updateTask,
    deleteTask,
    deleteTasks,
    deleteAllTasksByKpiId
  };
};
