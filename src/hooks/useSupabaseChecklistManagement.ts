import { useState, useEffect, useCallback } from 'react';
import { TaskTableData } from 'types/task';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

const CACHE_KEY = createCacheKey('checklist_management', 'data');

// 체크리스트 데이터 타입 (DB 구조에 맞춤)
export interface ChecklistData {
  id: number;
  no: number;
  registration_date: string;
  code: string;
  department: string; // 체크리스트 분류 (서브코드)
  work_content: string; // 제목
  description?: string;
  status: string;
  team: string;
  assignee: string; // user_code
  completed_date?: string;
  progress: number;
  attachments?: any[];
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
}

// 체크리스트 생성 요청 타입
export interface CreateChecklistRequest {
  no?: number;
  registration_date?: string;
  code: string;
  department: string;
  work_content: string;
  description?: string;
  status: string;
  team: string;
  assignee: string;
  completed_date?: string;
  progress?: number;
  attachments?: any[];
}

// 체크리스트 수정 요청 타입
export interface UpdateChecklistRequest extends CreateChecklistRequest {
  id: number;
}

// TaskTableData로 변환하는 함수
function convertToTaskTableData(checklist: ChecklistData): TaskTableData {
  return {
    id: checklist.id, // Supabase DB의 고유 ID 추가
    no: checklist.no,
    registrationDate: checklist.registration_date,
    code: checklist.code,
    department: checklist.department,
    workContent: checklist.work_content,
    description: checklist.description || '',
    status: checklist.status as any,
    team: checklist.team,
    assignee: checklist.assignee,
    completedDate: checklist.completed_date || '',
    progress: checklist.progress,
    attachments: checklist.attachments || [],
    startDate: checklist.registration_date, // 시작일을 등록일로 사용
    dueDate: checklist.completed_date || '' // 마감일을 완료일로 사용
  };
}

// ChecklistData로 변환하는 함수
function convertToChecklistData(task: TaskTableData, existingId?: number): Partial<ChecklistData> {
  return {
    ...(existingId && { id: existingId }),
    no: task.no || 0,
    registration_date: task.registrationDate || new Date().toISOString().split('T')[0],
    code: task.code,
    department: task.department || '',
    work_content: task.workContent || '새 체크리스트',
    description: task.description,
    status: task.status || '대기',
    team: task.team || '',
    assignee: task.assignee || '',
    completed_date: task.completedDate || undefined,
    progress: task.progress || 0,
    attachments: task.attachments || []
  };
}

export function useSupabaseChecklistManagement() {
  const [checklists, setChecklists] = useState<TaskTableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 체크리스트 목록 조회
  const fetchChecklists = useCallback(async () => {
    try {
      console.log('🔄 Supabase 체크리스트 조회 시작...');
      setLoading(true);
      setError(null);

      const response = await fetch('/api/checklists');
      const result = await response.json();

      console.log('📡 API 응답:', {
        success: result.success,
        dataLength: result.data?.length || 0,
        error: result.error
      });

      if (result.success) {
        // DB 데이터를 TaskTableData 형식으로 변환
        const taskData = result.data.map((checklist: ChecklistData) => convertToTaskTableData(checklist));
        console.log('✅ 변환된 TaskTableData:', taskData.length, '개');
        console.log('📋 첫 번째 데이터 샘플:', taskData[0]);
        setChecklists(taskData);
        saveToCache(CACHE_KEY, taskData); // 캐시에 저장
      } else {
        console.error('❌ API 오류:', result.error);
        setError(result.error || '체크리스트 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('💥 체크리스트 목록 조회 실패:', err);
      setError('체크리스트 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      console.log('🏁 Supabase 체크리스트 조회 완료');
    }
  }, []);

  // 체크리스트 생성 (생성된 데이터 반환)
  const createChecklist = useCallback(
    async (checklistData: TaskTableData): Promise<{ success: boolean; data?: any }> => {
      try {
        const requestData = convertToChecklistData(checklistData);

        const response = await fetch('/api/checklists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchChecklists();
          return { success: true, data: result.data };
        } else {
          console.error('체크리스트 생성 실패:', result.error);
          alert(result.error || '체크리스트 생성에 실패했습니다.');
          return { success: false };
        }
      } catch (err) {
        console.error('체크리스트 생성 실패:', err);
        alert('체크리스트 생성에 실패했습니다.');
        return { success: false };
      }
    },
    [fetchChecklists]
  );

  // 체크리스트 수정
  const updateChecklist = useCallback(
    async (checklistData: TaskTableData): Promise<boolean> => {
      try {
        // 기존 체크리스트의 ID를 찾기
        const existingChecklist = checklists.find((c) => c.code === checklistData.code);
        if (!existingChecklist) {
          // 새로운 체크리스트인 경우 생성
          const result = await createChecklist(checklistData);
          return result.success;
        }

        const requestData = convertToChecklistData(checklistData);

        const response = await fetch('/api/checklists', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...requestData,
            code: checklistData.code // code를 기준으로 업데이트
          })
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchChecklists();
          return true;
        } else {
          console.error('체크리스트 수정 실패:', result.error);
          alert(result.error || '체크리스트 수정에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('체크리스트 수정 실패:', err);
        alert('체크리스트 수정에 실패했습니다.');
        return false;
      }
    },
    [checklists, createChecklist, fetchChecklists]
  );

  // 체크리스트 삭제
  const deleteChecklist = useCallback(
    async (code: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/checklists?code=${code}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchChecklists();
          return true;
        } else {
          console.error('체크리스트 삭제 실패:', result.error);
          alert(result.error || '체크리스트 삭제에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('체크리스트 삭제 실패:', err);
        alert('체크리스트 삭제에 실패했습니다.');
        return false;
      }
    },
    [fetchChecklists]
  );

  // 체크리스트 상태 토글
  const toggleChecklistStatus = useCallback(
    async (code: string): Promise<boolean> => {
      try {
        const response = await fetch('/api/checklists/toggle-status', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code })
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchChecklists();
          return true;
        } else {
          console.error('체크리스트 상태 변경 실패:', result.error);
          alert(result.error || '체크리스트 상태 변경에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('체크리스트 상태 변경 실패:', err);
        alert('체크리스트 상태 변경에 실패했습니다.');
        return false;
      }
    },
    [fetchChecklists]
  );

  // 체크리스트 코드 생성
  const generateChecklistCode = useCallback(async (): Promise<string> => {
    try {
      const currentYear = new Date().getFullYear().toString().slice(-2);

      // 현재 연도의 기존 코드 확인
      const existingCodes = checklists
        .filter((checklist) => checklist.code.startsWith(`ADMIN-CHECK-${currentYear}-`))
        .map((checklist) => {
          const match = checklist.code.match(/ADMIN-CHECK-\d{2}-(\d{3})/);
          return match ? parseInt(match[1], 10) : 0;
        });

      // 최대값 찾기
      const maxNumber = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
      const newNumber = maxNumber + 1;

      return `ADMIN-CHECK-${currentYear}-${newNumber.toString().padStart(3, '0')}`;
    } catch (err) {
      console.error('체크리스트 코드 생성 실패:', err);
      // 폴백: 타임스탬프 기반
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const sequence = String(Date.now()).slice(-3).padStart(3, '0');
      return `ADMIN-CHECK-${currentYear}-${sequence}`;
    }
  }, [checklists]);

  // 컴포넌트 마운트 시 데이터 로드 (캐시 우선 전략)
  useEffect(() => {
    const cachedData = loadFromCache<TaskTableData[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      setChecklists(cachedData);
      setLoading(false);
      console.log('⚡ [ChecklistManagement] 캐시 데이터 즉시 표시');
    }
    fetchChecklists();
  }, [fetchChecklists]);

  return {
    checklists,
    loading,
    error,
    clearError,
    fetchChecklists,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    toggleChecklistStatus,
    generateChecklistCode
  };
}
