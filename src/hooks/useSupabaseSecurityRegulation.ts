import { useState, useCallback, useEffect } from 'react';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// 캐시 키
const CACHE_KEY = createCacheKey('security_regulation', 'tree');

// 보안규정 데이터 타입
export interface SecurityRegulationItem {
  id: number;
  parent_id?: number;
  type: 'folder' | 'file';
  name: string;
  path?: string;
  level: number;
  sort_order: number;
  file_size?: string;
  file_extension?: string;
  description?: string;
  document_type?: string; // GROUP007 서브코드
  status?: string; // GROUP002 서브코드
  team?: string; // 팀
  assignee?: string;
  code?: string;
  revision?: string;
  revision_date?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
  metadata?: any;
  children?: SecurityRegulationItem[];
}

// 폴더/파일 생성 요청 타입
export interface CreateSecurityRegulationRequest {
  parent_id?: number;
  type: 'folder' | 'file';
  name: string;
  description?: string;
  document_type?: string;
  status?: string;
  team?: string;
  assignee?: string;
  code?: string;
  revision?: string;
  file_size?: string;
  file_extension?: string;
}

export function useSupabaseSecurityRegulation() {
  const [items, setItems] = useState<SecurityRegulationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 폴더/파일 목록 조회
  const fetchItems = useCallback(async (parentId?: number | 'root') => {
    try {
      setLoading(true);
      setError(null);

      // 모든 데이터를 가져오기 (트리 구조 생성용)
      let url = '/api/security-regulation?all=true';

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setItems(result.data || []);
      } else {
        setError(result.error || '데이터 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('데이터 조회 오류:', error);
      setError('데이터 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 트리 구조 데이터 조회
  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📡 fetchTree: API 호출 시작');
      const response = await fetch('/api/security-regulation?all=true');
      const result = await response.json();

      console.log('📥 fetchTree: API 응답:', result);

      if (result.success) {
        // 트리 구조로 변환
        const allItems = result.data || [];
        console.log('🔄 fetchTree: 받은 데이터 개수:', allItems.length);
        console.log('📊 fetchTree: 원본 데이터:', allItems);

        const tree = buildTree(allItems);
        console.log('🌳 fetchTree: 트리 구조로 변환 완료:', tree);
        setItems(tree);
        saveToCache(CACHE_KEY, tree); // 캐시에 저장
      } else {
        console.error('❌ fetchTree: API 실패:', result.error);
        setError(result.error || '데이터 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ fetchTree: 조회 오류:', error);
      setError('데이터 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 폴더/파일 생성
  const createItem = useCallback(
    async (itemData: CreateSecurityRegulationRequest): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch('/api/security-regulation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(itemData)
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchTree();
          return true;
        } else {
          setError(result.error || '생성에 실패했습니다.');
          return false;
        }
      } catch (error) {
        console.error('생성 오류:', error);
        setError('생성에 실패했습니다.');
        return false;
      }
    },
    [fetchTree]
  );

  // 폴더/파일 수정
  const updateItem = useCallback(
    async (id: number, updateData: Partial<SecurityRegulationItem>): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch('/api/security-regulation', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id, ...updateData })
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchTree();
          return true;
        } else {
          setError(result.error || '수정에 실패했습니다.');
          return false;
        }
      } catch (error) {
        console.error('수정 오류:', error);
        setError('수정에 실패했습니다.');
        return false;
      }
    },
    [fetchTree]
  );

  // 폴더/파일 삭제
  const deleteItem = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch(`/api/security-regulation?id=${id}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchTree();
          return true;
        } else {
          setError(result.error || '삭제에 실패했습니다.');
          return false;
        }
      } catch (error) {
        console.error('삭제 오류:', error);
        setError('삭제에 실패했습니다.');
        return false;
      }
    },
    [fetchTree]
  );

  // 트리 구조 빌드 함수
  const buildTree = (items: SecurityRegulationItem[]): SecurityRegulationItem[] => {
    console.log('🏗️ buildTree 시작:', items.length, '개 아이템');

    const itemsMap = new Map<number, SecurityRegulationItem>();
    const roots: SecurityRegulationItem[] = [];

    // 먼저 모든 아이템을 맵에 저장
    items.forEach((item) => {
      itemsMap.set(item.id, { ...item, children: [] });
    });

    console.log('📦 itemsMap 생성 완료:', itemsMap.size, '개');

    // 부모-자식 관계 설정
    items.forEach((item) => {
      const currentItem = itemsMap.get(item.id)!;

      if (item.parent_id) {
        const parent = itemsMap.get(item.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(currentItem);
          console.log(`➡️ ${item.name} (id: ${item.id}) → ${parent.name} (id: ${parent.id})`);
        } else {
          console.warn(`⚠️ 부모를 찾을 수 없음: ${item.name} (parent_id: ${item.parent_id})`);
        }
      } else {
        roots.push(currentItem);
        console.log(`🌲 루트 아이템: ${item.name} (id: ${item.id})`);
      }
    });

    console.log('🌳 루트 아이템 개수:', roots.length);
    console.log(
      '🌳 루트 아이템 상세:',
      roots.map((r) => ({ name: r.name, children: r.children?.length || 0 }))
    );

    // 정렬
    const sortItems = (items: SecurityRegulationItem[]) => {
      items.sort((a, b) => {
        // 폴더 먼저, 파일 나중
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        // 정렬 순서, 이름 순
        return a.sort_order - b.sort_order || a.name.localeCompare(b.name);
      });

      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          sortItems(item.children);
        }
      });
    };

    sortItems(roots);
    console.log('✅ buildTree 완료');
    return roots;
  };

  // 특정 폴더의 하위 항목 조회
  const getFolderContents = useCallback(
    (folderId: number) => {
      const findFolder = (items: SecurityRegulationItem[]): SecurityRegulationItem | null => {
        for (const item of items) {
          if (item.id === folderId) {
            return item;
          }
          if (item.children) {
            const found = findFolder(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      const folder = findFolder(items);
      return folder?.children || [];
    },
    [items]
  );

  // 컴포넌트 마운트 시 데이터 로드 (캐시 우선 전략)
  useEffect(() => {
    console.log('🚀 useSupabaseSecurityRegulation: 마운트 시 데이터 로드 시작');

    // 1. 캐시에서 먼저 로드 (즉시 표시)
    const cachedData = loadFromCache<SecurityRegulationItem[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      setItems(cachedData);
      setLoading(false);
      console.log('⚡ [SecurityRegulation] 캐시 데이터 즉시 표시 (깜빡임 방지)');
    }

    // 2. 백그라운드에서 최신 데이터 가져오기 (항상 실행)
    fetchTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    items,
    loading,
    error,
    clearError,
    fetchItems,
    fetchTree,
    createItem,
    updateItem,
    deleteItem,
    getFolderContents,
    buildTree
  };
}
