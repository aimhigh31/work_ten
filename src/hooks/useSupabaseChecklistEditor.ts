import { useState, useEffect, useCallback } from 'react';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// 체크리스트 에디터 데이터 타입 (DB 구조에 맞춤)
export interface ChecklistEditorData {
  id: number;
  checklist_id: number;
  no: number;
  major_category: string;
  sub_category: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
}

// 체크리스트 에디터 생성 요청 타입
export interface CreateChecklistEditorRequest {
  checklist_id: number;
  no?: number;
  major_category: string;
  sub_category: string;
  title: string;
  description?: string;
}

// 체크리스트 에디터 수정 요청 타입
export interface UpdateChecklistEditorRequest extends CreateChecklistEditorRequest {
  id: number;
}

// ChecklistEditDialog의 ChecklistEditorItem과 호환되는 타입
export interface ChecklistEditorItem {
  id: number;
  majorCategory: string;
  subCategory: string;
  title: string;
  description: string;
  selected?: boolean;
}

// DB 데이터를 ChecklistEditorItem으로 변환하는 함수
function convertToChecklistEditorItem(editorData: ChecklistEditorData): ChecklistEditorItem {
  return {
    id: editorData.id,
    majorCategory: editorData.major_category,
    subCategory: editorData.sub_category,
    title: editorData.title,
    description: editorData.description || '',
    selected: false
  };
}

// ChecklistEditorItem을 DB 데이터로 변환하는 함수
function convertToChecklistEditorData(
  item: ChecklistEditorItem,
  checklistId: number,
  no: number,
  existingId?: number
): Partial<ChecklistEditorData> {
  return {
    ...(existingId && { id: existingId }),
    checklist_id: checklistId,
    no: no,
    major_category: item.majorCategory || '',
    sub_category: item.subCategory || '',
    title: item.title || '',
    description: item.description || ''
  };
}

export function useSupabaseChecklistEditor() {
  const [editorItems, setEditorItems] = useState<ChecklistEditorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 체크리스트 에디터 항목 조회
  const fetchEditorItems = useCallback(async (checklistId: number): Promise<ChecklistEditorItem[]> => {
    // 1. 동적 캐시 키 생성
    const cacheKey = createCacheKey('checklist_editor', `checklist_${checklistId}`);
    const cachedData = loadFromCache<ChecklistEditorItem[]>(cacheKey, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData && cachedData.length > 0) {
      console.log('⚡ [ChecklistEditor] 캐시 데이터 반환:', cachedData.length, '개');
      setEditorItems(cachedData);
      return cachedData;
    }

    console.log('🔍 [ChecklistEditor] 캐시 없음 또는 빈 배열, API 호출 진행');

    try {
      console.log('🔄 체크리스트 에디터 항목 조회 시작...', { checklistId });
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/checklist-editor?checklist_id=${checklistId}`);
      const result = await response.json();

      console.log('📡 체크리스트 에디터 API 응답:', {
        success: result.success,
        dataLength: result.data?.length || 0,
        error: result.error
      });

      if (result.success) {
        // DB 데이터를 ChecklistEditorItem 형식으로 변환
        const items = result.data.map((editorData: ChecklistEditorData) => convertToChecklistEditorItem(editorData));
        console.log('✅ 변환된 ChecklistEditorItem:', items.length, '개');
        setEditorItems(items);
        saveToCache(cacheKey, items); // 2. 캐시에 저장
        return items;
      } else {
        // 테이블이 존재하지 않는 경우 조용히 처리
        if (result.error?.includes('Could not find the table')) {
          console.log('ℹ️ admin_checklist_editor 테이블이 아직 생성되지 않았습니다.');
          setEditorItems([]); // 빈 배열로 설정
          setError(null); // 에러는 표시하지 않음
        } else {
          console.error('❌ 체크리스트 에디터 API 오류:', result.error);
          setError(result.error || '체크리스트 에디터 항목을 불러오는데 실패했습니다.');
          setEditorItems([]); // 오류 시 빈 배열로 설정
        }
        return [];
      }
    } catch (err) {
      console.error('💥 체크리스트 에디터 항목 조회 실패:', err);
      setError('체크리스트 에디터 항목을 불러오는데 실패했습니다.');
      setEditorItems([]); // 오류 시 빈 배열로 설정
      return [];
    } finally {
      setLoading(false);
      console.log('🏁 체크리스트 에디터 항목 조회 완료');
    }
  }, []);

  // 체크리스트 에디터 항목 생성
  const createEditorItem = useCallback(
    async (checklistId: number, item: ChecklistEditorItem): Promise<boolean> => {
      try {
        // API에서 no 값을 자동 계산하도록 no 필드를 제외하고 보냄
        // 빈 필수 필드는 공백 한 칸으로 설정 (데이터베이스 필수 필드 통과용)
        const requestData = {
          checklist_id: checklistId,
          major_category: item.majorCategory || ' ',
          sub_category: item.subCategory || ' ',
          title: item.title || ' ',
          description: item.description
          // no 필드를 의도적으로 제외 - API에서 자동 계산
        };

        const createResponse = await fetch('/api/checklist-editor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        const result = await createResponse.json();

        if (result.success) {
          console.log('✅ 체크리스트 에디터 항목 생성 성공');
          // 캐시 무효화 (최신 데이터 보장)
          const cacheKey = createCacheKey('checklist_editor', `checklist_${checklistId}`);
          sessionStorage.removeItem(cacheKey);
          // 목록 새로고침
          await fetchEditorItems(checklistId);
          return true;
        } else {
          console.error('❌ 체크리스트 에디터 항목 생성 실패:', result.error);
          setError(result.error || '체크리스트 에디터 항목 생성에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('💥 체크리스트 에디터 항목 생성 실패:', err);
        setError('체크리스트 에디터 항목 생성에 실패했습니다.');
        return false;
      }
    },
    [editorItems, fetchEditorItems]
  );

  // 체크리스트 에디터 항목 수정
  const updateEditorItem = useCallback(
    async (checklistId: number, item: ChecklistEditorItem): Promise<boolean> => {
      try {
        const requestData = convertToChecklistEditorData(item, checklistId, item.id, item.id);

        const response = await fetch('/api/checklist-editor', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ 체크리스트 에디터 항목 수정 성공');
          // 캐시 무효화 (최신 데이터 보장)
          const cacheKey = createCacheKey('checklist_editor', `checklist_${checklistId}`);
          sessionStorage.removeItem(cacheKey);
          // 목록 새로고침
          await fetchEditorItems(checklistId);
          return true;
        } else {
          console.error('❌ 체크리스트 에디터 항목 수정 실패:', result.error);
          setError(result.error || '체크리스트 에디터 항목 수정에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('💥 체크리스트 에디터 항목 수정 실패:', err);
        setError('체크리스트 에디터 항목 수정에 실패했습니다.');
        return false;
      }
    },
    [fetchEditorItems]
  );

  // 체크리스트 에디터 항목 삭제
  const deleteEditorItem = useCallback(
    async (checklistId: number, itemId: number): Promise<boolean> => {
      try {
        const response = await fetch(`/api/checklist-editor?id=${itemId}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ 체크리스트 에디터 항목 삭제 성공');
          // 캐시 무효화 (최신 데이터 보장)
          const cacheKey = createCacheKey('checklist_editor', `checklist_${checklistId}`);
          sessionStorage.removeItem(cacheKey);
          // 목록 새로고침
          await fetchEditorItems(checklistId);
          return true;
        } else {
          console.error('❌ 체크리스트 에디터 항목 삭제 실패:', result.error);
          setError(result.error || '체크리스트 에디터 항목 삭제에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('💥 체크리스트 에디터 항목 삭제 실패:', err);
        setError('체크리스트 에디터 항목 삭제에 실패했습니다.');
        return false;
      }
    },
    [fetchEditorItems]
  );

  // 체크리스트 에디터 항목 일괄 저장
  const saveEditorItems = useCallback(
    async (checklistId: number, items: ChecklistEditorItem[]): Promise<boolean> => {
      try {
        console.log('💾 체크리스트 에디터 항목 일괄 저장 시작...', { checklistId, itemCount: items.length });
        console.log('📊 저장할 아이템 상세:', items);

        const dataToSave = items.map((item, index) => {
          const converted = convertToChecklistEditorData(item, checklistId, index + 1, item.id || undefined);
          console.log(`항목 ${index + 1} 변환:`, { original: item, converted });
          return converted;
        });

        console.log('📤 서버로 전송할 데이터:', {
          checklist_id: checklistId,
          items: dataToSave
        });

        const response = await fetch('/api/checklist-editor/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            checklist_id: checklistId,
            items: dataToSave
          })
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ 체크리스트 에디터 항목 일괄 저장 성공');
          // 캐시 무효화 (최신 데이터 보장)
          const cacheKey = createCacheKey('checklist_editor', `checklist_${checklistId}`);
          sessionStorage.removeItem(cacheKey);
          // 목록 새로고침
          await fetchEditorItems(checklistId);
          return true;
        } else {
          console.error('❌ 체크리스트 에디터 항목 일괄 저장 실패:', result.error);
          setError(result.error || '체크리스트 에디터 항목 일괄 저장에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('💥 체크리스트 에디터 항목 일괄 저장 실패:', err);
        setError('체크리스트 에디터 항목 일괄 저장에 실패했습니다.');
        return false;
      }
    },
    [fetchEditorItems]
  );

  return {
    editorItems,
    loading,
    error,
    clearError,
    fetchEditorItems,
    createEditorItem,
    updateEditorItem,
    deleteEditorItem,
    saveEditorItems
  };
}
