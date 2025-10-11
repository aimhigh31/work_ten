import { useState, useCallback } from 'react';

// 체크리스트 개요 타입
export interface ChecklistOverview {
  title: string;
  assignee: string;
  status: string;
  category: string;
  code: string;
  registration_date: string;
  start_date: string;
  completed_date: string;
  description: string;
  team: string;
  department: string;
  progress: string;
}

// 체크리스트 에디터 항목 타입
export interface ChecklistEditorItem {
  item_no: number;
  major_category: string;
  sub_category: string;
  title: string;
  description: string;
  evaluation: string;
  score: string;
}

// 체크리스트 전체 데이터 타입
export interface ChecklistData {
  overview: ChecklistOverview;
  editorItems: ChecklistEditorItem[];
}

export function useSupabaseChecklistData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 체크리스트 데이터 조회
  const fetchChecklistData = useCallback(async (checklistId: number): Promise<ChecklistData | null> => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 체크리스트 데이터 조회 중...', checklistId);

      const response = await fetch(`/api/checklist-data?checklist_id=${checklistId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '데이터 조회 실패');
      }

      console.log('✅ 체크리스트 데이터 조회 완료');
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      console.error('❌ 체크리스트 데이터 조회 실패:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 체크리스트 데이터 저장
  const saveChecklistData = useCallback(async (checklistId: number, data: ChecklistData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      console.log('💾 체크리스트 데이터 저장 중...', checklistId);
      console.log('📋 저장할 데이터:', data);

      const response = await fetch('/api/checklist-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          checklist_id: checklistId,
          data
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '데이터 저장 실패');
      }

      console.log('✅ 체크리스트 데이터 저장 완료:', result.message);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      console.error('❌ 체크리스트 데이터 저장 실패:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 체크리스트 필드 업데이트 (부분 업데이트)
  const updateChecklistFields = useCallback(
    async (
      checklistId: number,
      fieldUpdates: Array<{
        data_type: 'overview' | 'editor_item';
        item_no?: number;
        field_name: string;
        field_value: string;
      }>
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 체크리스트 필드 업데이트 중...', checklistId);

        const response = await fetch('/api/checklist-data', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            checklist_id: checklistId,
            field_updates: fieldUpdates
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '필드 업데이트 실패');
        }

        console.log('✅ 체크리스트 필드 업데이트 완료:', result.message);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
        console.error('❌ 체크리스트 필드 업데이트 실패:', errorMessage);
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 체크리스트 데이터 삭제
  const deleteChecklistData = useCallback(async (checklistId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🗑️ 체크리스트 데이터 삭제 중...', checklistId);

      const response = await fetch(`/api/checklist-data?checklist_id=${checklistId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '데이터 삭제 실패');
      }

      console.log('✅ 체크리스트 데이터 삭제 완료');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      console.error('❌ 체크리스트 데이터 삭제 실패:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // TaskTableData 형식으로 변환 (호환성 유지)
  const convertToTaskData = useCallback((checklistId: number, data: ChecklistData): any => {
    return {
      id: checklistId,
      no: checklistId,
      workContent: data.overview.title || '',
      assignee: data.overview.assignee || '',
      status: data.overview.status || '대기',
      code: data.overview.code || '',
      registrationDate: data.overview.registration_date || '',
      startDate: data.overview.start_date || '',
      completedDate: data.overview.completed_date || '',
      description: data.overview.description || '',
      team: data.overview.team || '',
      department: data.overview.department || '',
      progress: parseInt(data.overview.progress) || 0,
      category: data.overview.category || '',
      attachments: []
    };
  }, []);

  // ChecklistEditorItem 형식 변환 (호환성 유지)
  const convertToEditorItems = useCallback((data: ChecklistData): any[] => {
    return data.editorItems.map((item) => ({
      id: item.item_no,
      majorCategory: item.major_category || '',
      subCategory: item.sub_category || '',
      title: item.title || '',
      description: item.description || '',
      evaluation: item.evaluation || '대기',
      score: parseInt(item.score) || 0
    }));
  }, []);

  // TaskTableData를 ChecklistData로 변환
  const convertFromTaskData = useCallback((task: any, editorItems?: any[]): ChecklistData => {
    const overview: ChecklistOverview = {
      title: task.workContent || '',
      assignee: task.assignee || '',
      status: task.status || '대기',
      category: task.category || '',
      code: task.code || '',
      registration_date: task.registrationDate || '',
      start_date: task.startDate || '',
      completed_date: task.completedDate || '',
      description: task.description || '',
      team: task.team || '',
      department: task.department || '',
      progress: String(task.progress || 0)
    };

    const items: ChecklistEditorItem[] = (editorItems || []).map((item, index) => ({
      item_no: index + 1,
      major_category: item.majorCategory || '',
      sub_category: item.subCategory || '',
      title: item.title || '',
      description: item.description || '',
      evaluation: item.evaluation || '대기',
      score: String(item.score || 0)
    }));

    return { overview, editorItems: items };
  }, []);

  return {
    loading,
    error,
    fetchChecklistData,
    saveChecklistData,
    updateChecklistFields,
    deleteChecklistData,
    convertToTaskData,
    convertToEditorItems,
    convertFromTaskData
  };
}
