import { useState, useEffect } from 'react';
import { taskService } from '@/services/supabase/task.service';
import type { TaskRecord } from '@/services/supabase/task.service';

export function useSupabaseTask() {
  const [taskRecords, setTaskRecords] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 업무 기록 목록 가져오기
  const fetchTaskRecords = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTaskRecords();
      setTaskRecords(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch task records:', err);
    } finally {
      setLoading(false);
    }
  };

  // 업무 기록 생성
  const createTaskRecord = async (record: Omit<TaskRecord, 'id' | 'no' | 'created_at' | 'updated_at'>) => {
    try {
      const newRecord = await taskService.createTaskRecord(record);
      setTaskRecords((prev) => [newRecord, ...prev]);
      return newRecord;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // 업무 기록 수정
  const updateTaskRecord = async (id: string, updates: Partial<TaskRecord>) => {
    try {
      const updatedRecord = await taskService.updateTaskRecord(id, updates);
      setTaskRecords((prev) => prev.map((record) => (record.id === id ? updatedRecord : record)));
      return updatedRecord;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // 업무 기록 삭제
  const deleteTaskRecord = async (id: string) => {
    try {
      await taskService.deleteTaskRecord(id);
      setTaskRecords((prev) => prev.filter((record) => record.id !== id));
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // 팀별 업무 조회
  const fetchTasksByTeam = async (team: string) => {
    try {
      setLoading(true);
      const data = await taskService.getTasksByTeam(team);
      setTaskRecords(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch tasks by team:', err);
    } finally {
      setLoading(false);
    }
  };

  // 상태별 업무 조회
  const fetchTasksByStatus = async (status: string) => {
    try {
      setLoading(true);
      const data = await taskService.getTasksByStatus(status);
      setTaskRecords(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch tasks by status:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchTaskRecords();
  }, []);

  return {
    taskRecords,
    loading,
    error,
    fetchTaskRecords,
    createTaskRecord,
    updateTaskRecord,
    deleteTaskRecord,
    fetchTasksByTeam,
    fetchTasksByStatus
  };
}
