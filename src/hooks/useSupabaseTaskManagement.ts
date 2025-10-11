import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabaseClient';

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

export const useSupabaseTaskManagement = () => {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 업무 목록 조회
  const fetchTasks = useCallback(async () => {
    try {
      console.log('🔄 업무 목록 조회 시작...');
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('main_task_data')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      console.log('📥 업무 조회 응답:', { data, error: fetchError });

      if (fetchError) {
        console.error('❌ 업무 조회 실패:', fetchError);
        setError(fetchError.message);
        return;
      }

      console.log(`✅ 업무 ${data?.length || 0}개 조회 성공`);
      setTasks(data || []);
    } catch (err) {
      console.error('❌ 업무 조회 중 오류:', err);
      setError('업무를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 업무 추가
  const addTask = async (task: TaskInput): Promise<TaskRecord | null> => {
    try {
      console.log('📝 업무 추가 요청 데이터:', task);

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

      console.log('📤 Supabase insert 데이터:', insertData);

      const response = await supabase
        .from('main_task_data')
        .insert([insertData])
        .select()
        .single();

      console.log('📥 Supabase 응답:', response);

      if (response.error) {
        console.error('❌ 업무 추가 실패 - error 객체:', response.error);
        console.error('❌ 업무 추가 실패 - error 타입:', typeof response.error);
        console.error('❌ 업무 추가 실패 - error keys:', Object.keys(response.error));
        console.error('❌ 업무 추가 실패 - JSON:', JSON.stringify(response.error, null, 2));
        setError(response.error.message || '업무 추가 실패');
        return null;
      }

      console.log('✅ 업무 추가 성공:', response.data);
      await fetchTasks();
      return response.data;
    } catch (err) {
      console.error('❌ 업무 추가 중 예외 발생:', err);
      console.error('❌ 예외 타입:', typeof err);
      console.error('❌ 예외 JSON:', JSON.stringify(err, null, 2));
      setError('업무 추가에 실패했습니다.');
      return null;
    }
  };

  // 업무 수정
  const updateTask = async (id: string, updates: TaskUpdate): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('main_task_data')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        console.error('업무 수정 실패:', updateError);
        setError(updateError.message);
        return false;
      }

      await fetchTasks();
      return true;
    } catch (err) {
      console.error('업무 수정 중 오류:', err);
      setError('업무 수정에 실패했습니다.');
      return false;
    }
  };

  // 업무 삭제 (soft delete)
  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('main_task_data')
        .update({ is_active: false })
        .eq('id', id);

      if (deleteError) {
        console.error('업무 삭제 실패:', deleteError);
        setError(deleteError.message);
        return false;
      }

      await fetchTasks();
      return true;
    } catch (err) {
      console.error('업무 삭제 중 오류:', err);
      setError('업무 삭제에 실패했습니다.');
      return false;
    }
  };

  // 코드 중복 확인
  const checkCodeExists = async (code: string): Promise<boolean> => {
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
  };

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    checkCodeExists,
    fetchTasks
  };
};
