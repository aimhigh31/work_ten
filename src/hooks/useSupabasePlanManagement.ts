import { useState, useCallback } from 'react';
import supabase from '../lib/supabaseClient';

// 계획 항목 타입 (DB 스키마)
export interface PlanItem {
  id: number;
  task_id: string;
  item_id: number;  // BIGINT (JavaScript에서는 number로 처리)
  text: string;
  checked: boolean;
  parent_id: number | null;  // BIGINT (JavaScript에서는 number로 처리)
  level: number;
  expanded: boolean;
  status: string;
  due_date: string | null;
  progress_rate: number;
  assignee: string | null;
  priority: 'High' | 'Medium' | 'Low';
  start_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 계획 항목 입력 타입
export interface PlanItemInput {
  task_id: string;
  item_id: number;  // BIGINT (JavaScript에서는 number로 처리)
  text: string;
  checked?: boolean;
  parent_id?: number | null;  // BIGINT (JavaScript에서는 number로 처리)
  level?: number;
  expanded?: boolean;
  status?: string;
  due_date?: string | null;
  progress_rate?: number;
  assignee?: string | null;
  priority?: 'High' | 'Medium' | 'Low';
  start_date?: string | null;
}

export const useSupabasePlanManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 특정 task의 계획 항목 조회
  const fetchPlanItems = useCallback(async (taskId: string): Promise<PlanItem[]> => {
    try {
      console.log('🔄 계획 항목 조회 시작:', taskId);
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('main_task_management')
        .select('*')
        .eq('task_id', taskId)
        .eq('is_active', true)
        .order('item_id', { ascending: true });

      if (fetchError) {
        console.error('❌ 계획 항목 조회 실패:', fetchError);
        setError(fetchError.message);
        return [];
      }

      console.log(`✅ 계획 항목 ${data?.length || 0}개 조회 성공`);
      return data || [];
    } catch (err) {
      console.error('❌ 계획 항목 조회 중 오류:', err);
      setError('계획 항목을 불러오는데 실패했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 계획 항목 일괄 저장 (기존 삭제 후 재저장)
  const savePlanItems = useCallback(async (taskId: string, items: PlanItemInput[]): Promise<boolean> => {
    try {
      console.log('📝 계획 항목 일괄 저장 시작:', { taskId, count: items.length });
      console.log('📝 저장할 데이터:', JSON.stringify(items, null, 2));
      setLoading(true);
      setError(null);

      // 1. 기존 데이터 삭제
      const { error: deleteError } = await supabase
        .from('main_task_management')
        .delete()
        .eq('task_id', taskId);

      if (deleteError) {
        console.error('❌ 기존 계획 항목 삭제 실패:', deleteError);
        console.error('❌ 상세 에러:', JSON.stringify(deleteError, null, 2));
        setError(deleteError.message);
        return false;
      }

      console.log('✅ 기존 데이터 삭제 완료');

      // 2. 새 데이터 저장 (데이터가 있을 경우에만)
      if (items.length > 0) {
        const insertData = items.map(item => ({
          task_id: taskId,
          item_id: item.item_id,
          text: item.text,
          checked: item.checked || false,
          parent_id: item.parent_id || null,
          level: item.level || 0,
          expanded: item.expanded !== undefined ? item.expanded : true,
          status: item.status || '대기',
          due_date: item.due_date || null,
          progress_rate: item.progress_rate || 0,
          assignee: item.assignee || null,
          priority: item.priority || 'Medium',
          start_date: item.start_date || null
        }));

        console.log('📝 INSERT 데이터:', JSON.stringify(insertData, null, 2));

        const { error: insertError, data: insertedData } = await supabase
          .from('main_task_management')
          .insert(insertData)
          .select();

        if (insertError) {
          console.error('❌ 계획 항목 저장 실패:', insertError);
          console.error('❌ 상세 에러:', JSON.stringify(insertError, null, 2));
          console.error('❌ 에러 코드:', insertError.code);
          console.error('❌ 에러 메시지:', insertError.message);
          console.error('❌ 에러 힌트:', insertError.hint);
          console.error('❌ 에러 details:', insertError.details);
          setError(insertError.message);
          return false;
        }

        console.log('✅ 데이터 INSERT 완료:', insertedData);
      }

      console.log('✅ 계획 항목 저장 성공');
      return true;
    } catch (err: any) {
      console.error('❌ 계획 항목 저장 중 오류:', err);
      console.error('❌ 오류 상세:', err.message, err.stack);
      setError(err.message || '계획 항목 저장에 실패했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 단일 계획 항목 업데이트
  const updatePlanItem = useCallback(async (id: number, updates: Partial<PlanItemInput>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('main_task_management')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        console.error('계획 항목 수정 실패:', updateError);
        setError(updateError.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error('계획 항목 수정 중 오류:', err);
      setError('계획 항목 수정에 실패했습니다.');
      return false;
    }
  }, []);

  return {
    loading,
    error,
    fetchPlanItems,
    savePlanItems,
    updatePlanItem
  };
};
