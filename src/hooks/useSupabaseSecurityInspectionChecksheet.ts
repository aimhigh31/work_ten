import { useState, useCallback } from 'react';
import { ChecklistEditorItem } from '../types/checklist';

// DB 데이터 타입
export interface ChecksheetData {
  id: number;
  inspection_id: number;
  checklist_id?: number | null;
  major_category: string;
  minor_category: string;
  title: string;
  description?: string;
  evaluation?: string;
  score?: number;
  attachments?: any[];
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
}

// 생성 요청 타입
export interface CreateChecksheetRequest {
  inspection_id: number;
  checklist_id?: number | null;
  major_category: string;
  minor_category: string;
  title: string;
  description?: string;
  evaluation?: string;
  score?: number;
  attachments?: any[];
}

// 수정 요청 타입
export interface UpdateChecksheetRequest extends CreateChecksheetRequest {
  id: number;
}

// DB 데이터를 ChecklistEditorItem으로 변환
function convertToChecklistEditorItem(data: ChecksheetData): ChecklistEditorItem {
  return {
    id: data.id,
    majorCategory: data.major_category,
    minorCategory: data.minor_category,
    title: data.title,
    description: data.description || '',
    evaluation: data.evaluation || '',
    score: data.score || 0,
    attachments: data.attachments || []
  };
}

// ChecklistEditorItem을 DB 데이터로 변환
function convertToChecksheetData(
  item: ChecklistEditorItem,
  inspectionId: number,
  checklistId?: number | null
): CreateChecksheetRequest {
  return {
    inspection_id: inspectionId,
    checklist_id: checklistId,
    major_category: item.majorCategory || '',
    minor_category: item.minorCategory || '',
    title: item.title || '',
    description: item.description || '',
    evaluation: item.evaluation || '',
    score: item.score || 0,
    attachments: item.attachments || []
  };
}

export function useSupabaseSecurityInspectionChecksheet() {
  const [checksheetItems, setChecksheetItems] = useState<ChecklistEditorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 체크시트 항목 조회
  const fetchChecksheetItems = useCallback(async (inspectionId: number): Promise<ChecklistEditorItem[]> => {
    try {
      console.log('🔄 체크시트 항목 조회 시작...', { inspectionId });
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/security-inspection-checksheet?inspection_id=${inspectionId}`);
      const result = await response.json();

      console.log('📡 체크시트 API 응답:', {
        success: result.success,
        dataLength: result.data?.length || 0,
        error: result.error
      });

      if (result.success) {
        const items = result.data.map((data: ChecksheetData) => convertToChecklistEditorItem(data));
        console.log('✅ 변환된 체크시트 항목:', items.length, '개');
        setChecksheetItems(items);
        return items;
      } else {
        console.error('❌ 체크시트 API 오류:', result.error);
        setError(result.error || '체크시트 항목을 불러오는데 실패했습니다.');
        setChecksheetItems([]);
        return [];
      }
    } catch (err) {
      console.error('💥 체크시트 항목 조회 실패:', err);
      setError('체크시트 항목을 불러오는데 실패했습니다.');
      setChecksheetItems([]);
      return [];
    } finally {
      setLoading(false);
      console.log('🏁 체크시트 항목 조회 완료');
    }
  }, []);

  // 특정 체크리스트 항목만 조회
  const fetchChecksheetItemsByChecklist = useCallback(
    async (inspectionId: number, checklistId: number): Promise<ChecklistEditorItem[]> => {
      try {
        console.log('🔄 체크시트 항목 조회 시작...', { inspectionId, checklistId });
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/security-inspection-checksheet?inspection_id=${inspectionId}&checklist_id=${checklistId}`
        );
        const result = await response.json();

        console.log('📡 체크시트 API 응답:', {
          success: result.success,
          dataLength: result.data?.length || 0,
          error: result.error
        });

        if (result.success) {
          const items = result.data.map((data: ChecksheetData) => convertToChecklistEditorItem(data));
          console.log('✅ 변환된 체크시트 항목:', items.length, '개');
          return items;
        } else {
          console.error('❌ 체크시트 API 오류:', result.error);
          setError(result.error || '체크시트 항목을 불러오는데 실패했습니다.');
          return [];
        }
      } catch (err) {
        console.error('💥 체크시트 항목 조회 실패:', err);
        setError('체크시트 항목을 불러오는데 실패했습니다.');
        return [];
      } finally {
        setLoading(false);
        console.log('🏁 체크시트 항목 조회 완료');
      }
    },
    []
  );

  // 체크시트 항목 생성 (일괄)
  const createChecksheetItems = useCallback(
    async (inspectionId: number, items: ChecklistEditorItem[], checklistId?: number | null): Promise<boolean> => {
      try {
        console.log('🔄 체크시트 항목 일괄 생성 시작...', { inspectionId, itemsCount: items.length });
        setLoading(true);
        setError(null);

        const requestData = items.map((item) => convertToChecksheetData(item, inspectionId, checklistId));

        const response = await fetch('/api/security-inspection-checksheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ 체크시트 항목 일괄 생성 성공');
          await fetchChecksheetItems(inspectionId);
          return true;
        } else {
          console.error('❌ 체크시트 항목 일괄 생성 실패:', result.error);
          setError(result.error || '체크시트 항목 생성에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('💥 체크시트 항목 일괄 생성 실패:', err);
        setError('체크시트 항목 생성에 실패했습니다.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchChecksheetItems]
  );

  // 체크시트 항목 수정
  const updateChecksheetItem = useCallback(
    async (inspectionId: number, item: ChecklistEditorItem): Promise<boolean> => {
      try {
        console.log('🔄 체크시트 항목 수정 시작...', { inspectionId, itemId: item.id });
        setLoading(true);
        setError(null);

        const response = await fetch('/api/security-inspection-checksheet', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            major_category: item.majorCategory || '',
            minor_category: item.minorCategory || '',
            title: item.title || '',
            description: item.description || '',
            evaluation: item.evaluation || '',
            score: item.score || 0,
            attachments: item.attachments || []
          })
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ 체크시트 항목 수정 성공');
          await fetchChecksheetItems(inspectionId);
          return true;
        } else {
          console.error('❌ 체크시트 항목 수정 실패:', result.error);
          setError(result.error || '체크시트 항목 수정에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('💥 체크시트 항목 수정 실패:', err);
        setError('체크시트 항목 수정에 실패했습니다.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchChecksheetItems]
  );

  // 체크시트 항목 삭제
  const deleteChecksheetItem = useCallback(
    async (inspectionId: number, itemId: number): Promise<boolean> => {
      try {
        console.log('🔄 체크시트 항목 삭제 시작...', { inspectionId, itemId });
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/security-inspection-checksheet?id=${itemId}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ 체크시트 항목 삭제 성공');
          await fetchChecksheetItems(inspectionId);
          return true;
        } else {
          console.error('❌ 체크시트 항목 삭제 실패:', result.error);
          setError(result.error || '체크시트 항목 삭제에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('💥 체크시트 항목 삭제 실패:', err);
        setError('체크시트 항목 삭제에 실패했습니다.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchChecksheetItems]
  );

  // 점검 ID에 해당하는 모든 체크시트 삭제
  const deleteAllChecksheetItems = useCallback(async (inspectionId: number): Promise<boolean> => {
    try {
      console.log('🔄 모든 체크시트 항목 삭제 시작...', { inspectionId });
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/security-inspection-checksheet?inspection_id=${inspectionId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ 모든 체크시트 항목 삭제 성공');
        setChecksheetItems([]);
        return true;
      } else {
        console.error('❌ 모든 체크시트 항목 삭제 실패:', result.error);
        setError(result.error || '체크시트 항목 삭제에 실패했습니다.');
        return false;
      }
    } catch (err) {
      console.error('💥 모든 체크시트 항목 삭제 실패:', err);
      setError('체크시트 항목 삭제에 실패했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checksheetItems,
    loading,
    error,
    clearError,
    fetchChecksheetItems,
    fetchChecksheetItemsByChecklist,
    createChecksheetItems,
    updateChecksheetItem,
    deleteChecksheetItem,
    deleteAllChecksheetItems
  };
}
