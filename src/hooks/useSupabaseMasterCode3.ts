import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 캐시 키
const CACHE_KEY = createCacheKey('mastercode3', 'data');

// 플랫 구조 데이터 타입 정의
export interface MasterCodeFlat {
  id: number;

  // 레코드 타입 구분
  codetype: 'group' | 'subcode';

  // 그룹 정보
  group_code: string;
  group_code_name: string;
  group_code_description?: string;
  group_code_status: 'active' | 'inactive';
  group_code_order: number;

  // 서브코드 정보
  subcode: string;
  subcode_name: string;
  subcode_description?: string;
  subcode_status: 'active' | 'inactive';
  subcode_remark?: string;
  subcode_order: number;

  // 공통 필드
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

// 그룹 정보만 추출한 타입
export interface GroupInfo {
  group_code: string;
  group_code_name: string;
  group_code_description?: string;
  group_code_status: 'active' | 'inactive';
  group_code_order: number;
  subcode_count: number;
  created_at: string;
  updated_at: string;
}

// 서브코드 정보만 추출한 타입
export interface SubCodeInfo {
  id: number;
  group_code: string;
  subcode: string;
  subcode_name: string;
  subcode_description?: string;
  subcode_status: 'active' | 'inactive';
  subcode_remark?: string;
  subcode_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

// 훅 구현
export const useSupabaseMasterCode3 = () => {
  const [allData, setAllData] = useState<MasterCodeFlat[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [subCodes, setSubCodes] = useState<SubCodeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // allData로부터 groups와 subCodes를 계산하는 헬퍼 함수
  const processAllData = useCallback((parsedData: MasterCodeFlat[]) => {
    // allData 설정
    setAllData(parsedData);

    // groups 설정
    const groupRecords = parsedData.filter((item) => item.codetype === 'group') || [];
    const groupList: GroupInfo[] = groupRecords.map((item) => {
      const subcodeCount =
        parsedData.filter((subItem) => subItem.codetype === 'subcode' && subItem.group_code === item.group_code).length || 0;
      return {
        group_code: item.group_code,
        group_code_name: item.group_code_name,
        group_code_description: item.group_code_description,
        group_code_status: item.group_code_status,
        group_code_order: item.group_code_order,
        subcode_count: subcodeCount,
        created_at: item.created_at,
        updated_at: item.updated_at
      };
    });
    setGroups(groupList.sort((a, b) => a.group_code_order - b.group_code_order));

    // subCodes 설정
    const subcodeRecords = parsedData.filter((item) => item.codetype === 'subcode') || [];
    const subCodeList: SubCodeInfo[] = subcodeRecords.map((item) => ({
      id: item.id,
      group_code: item.group_code,
      subcode: item.subcode,
      subcode_name: item.subcode_name,
      subcode_description: item.subcode_description,
      subcode_status: item.subcode_status,
      subcode_remark: item.subcode_remark,
      subcode_order: item.subcode_order,
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at,
      created_by: item.created_by,
      updated_by: item.updated_by
    }));
    setSubCodes(subCodeList);
  }, []);

  // 전체 데이터 로드 (Investment 패턴 - 데이터 직접 반환)
  const getAllMasterCodes = useCallback(async (): Promise<MasterCodeFlat[]> => {
    // 1. 캐시 확인 (캐시가 있으면 즉시 반환)
    const cachedData = loadFromCache<MasterCodeFlat[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [MasterCode3] 캐시 데이터 반환 (깜빡임 방지)');
      return cachedData;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 getAllMasterCodes 시작 (codetype 활용)');

      const { data, error: fetchError } = await supabase
        .from('admin_mastercode_data')
        .select('*')
        .order('group_code_order', { ascending: true })
        .order('codetype', { ascending: false }) // group이 먼저
        .order('subcode_order', { ascending: true });

      if (fetchError) throw fetchError;

      console.log(`📊 총 ${data?.length || 0}개 레코드 로드됨`);

      // 캐시에 저장
      saveToCache(CACHE_KEY, data || []);

      console.log('✅ 데이터 로드 완료');
      return data || [];
    } catch (err) {
      console.error('❌ getAllMasterCodes 오류:', err);
      setError(err instanceof Error ? err.message : '데이터 로드 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 전체 데이터 로드 (내부 상태 업데이트용 - 후방 호환성)
  const fetchAllData = useCallback(async () => {
    const data = await getAllMasterCodes();
    processAllData(data);
  }, [getAllMasterCodes, processAllData]);

  // 다음 그룹 코드 생성 함수
  const generateNextGroupCode = useCallback(async () => {
    try {
      // 현재 그룹들 중에서 GROUP로 시작하는 코드 찾기
      const { data: existingGroups, error } = await supabase
        .from('admin_mastercode_data')
        .select('group_code')
        .eq('codetype', 'group')
        .like('group_code', 'GROUP%')
        .order('group_code', { ascending: false });

      if (error) throw error;

      let nextNumber = 1;
      if (existingGroups && existingGroups.length > 0) {
        // 가장 큰 번호 찾기
        const maxNumber = existingGroups.reduce((max, group) => {
          const match = group.group_code.match(/GROUP(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            return num > max ? num : max;
          }
          return max;
        }, 0);
        nextNumber = maxNumber + 1;
      }

      return `GROUP${nextNumber.toString().padStart(3, '0')}`;
    } catch (err) {
      console.error('그룹 코드 생성 오류:', err);
      return `GROUP001`;
    }
  }, []);

  // 새 그룹 생성 (그룹 레코드만 생성)
  const createGroup = useCallback(
    async (groupData: {
      group_code?: string; // 선택적으로 변경
      group_code_name: string;
      group_code_description?: string;
      group_code_status: 'active' | 'inactive';
      group_code_order: number;
    }) => {
      console.log('🏗️ createGroup 시작 (그룹 레코드만 생성)');
      console.log('받은 데이터:', groupData);

      setLoading(true);
      setError(null);

      try {
        // 그룹 코드가 제공되지 않으면 자동 생성
        const finalGroupCode = groupData.group_code || (await generateNextGroupCode());
        console.log('📝 사용할 그룹 코드:', finalGroupCode);

        // 그룹 레코드만 생성 (codetype='group')
        const groupRecord = {
          codetype: 'group',
          group_code: finalGroupCode,
          group_code_name: groupData.group_code_name,
          group_code_description: groupData.group_code_description || '',
          group_code_status: groupData.group_code_status,
          group_code_order: groupData.group_code_order,
          subcode: '', // 그룹 레코드는 서브코드 필드가 빈 값
          subcode_name: '',
          subcode_description: '',
          subcode_status: 'active' as const,
          subcode_remark: '',
          subcode_order: 0,
          is_active: true,
          created_by: 'user',
          updated_by: 'user'
        };

        console.log('💾 그룹 레코드 삽입:', groupRecord);

        const { data: groupData_result, error: groupError } = await supabase
          .from('admin_mastercode_data')
          .insert([groupRecord])
          .select()
          .single();

        if (groupError) {
          console.error('❌ 그룹 레코드 삽입 오류:', groupError);
          throw groupError;
        }

        console.log('✅ 그룹 레코드 생성 성공:', groupData_result);

        // 데이터 새로고침
        console.log('🔄 데이터 새로고침 시작');
        await fetchAllData();
        console.log('✅ 그룹 생성 완료');

        return groupData_result;
      } catch (err) {
        console.error('💥 createGroup 오류:', err);
        const errorMessage = err instanceof Error ? err.message : '그룹 생성 중 오류가 발생했습니다.';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [fetchAllData]
  );

  // 다음 서브코드 생성 함수
  const generateNextSubCode = useCallback(async (groupCode: string) => {
    try {
      // 해당 그룹의 기존 서브코드들 조회
      const { data: existingSubCodes, error } = await supabase
        .from('admin_mastercode_data')
        .select('subcode')
        .eq('codetype', 'subcode')
        .eq('group_code', groupCode)
        .like('subcode', `${groupCode}-SUB%`)
        .order('subcode', { ascending: false });

      if (error) throw error;

      let nextNumber = 1;
      if (existingSubCodes && existingSubCodes.length > 0) {
        // 가장 큰 번호 찾기
        const maxNumber = existingSubCodes.reduce((max, subcode) => {
          const match = subcode.subcode.match(new RegExp(`${groupCode}-SUB(\\d+)`));
          if (match) {
            const num = parseInt(match[1], 10);
            return num > max ? num : max;
          }
          return max;
        }, 0);
        nextNumber = maxNumber + 1;
      }

      return `${groupCode}-SUB${nextNumber.toString().padStart(3, '0')}`;
    } catch (err) {
      console.error('서브코드 생성 오류:', err);
      return `${groupCode}-SUB001`;
    }
  }, []);

  // 서브코드 추가 - codetype 활용
  const createSubCode = useCallback(
    async (subCodeData: {
      group_code: string;
      subcode?: string; // 선택적으로 변경
      subcode_name: string;
      subcode_description?: string;
      subcode_status: 'active' | 'inactive';
      subcode_remark?: string;
      subcode_order: number;
    }) => {
      console.log('🏗️ createSubCode 시작 (codetype 활용)');
      console.log('받은 데이터:', subCodeData);

      setLoading(true);
      setError(null);

      try {
        // 서브코드가 제공되지 않으면 자동 생성
        const finalSubCode = subCodeData.subcode || (await generateNextSubCode(subCodeData.group_code));
        console.log('📝 사용할 서브코드:', finalSubCode);
        // 해당 그룹의 그룹 레코드 조회 (codetype='group')
        const { data: groupRecord, error: groupError } = await supabase
          .from('admin_mastercode_data')
          .select('*')
          .eq('group_code', subCodeData.group_code)
          .eq('codetype', 'group')
          .single();

        if (groupError) {
          console.error('❌ 그룹 레코드 조회 오류:', groupError);
          throw new Error(`그룹 '${subCodeData.group_code}'을 찾을 수 없습니다.`);
        }

        console.log('📋 찾은 그룹 레코드:', groupRecord);

        // 해당 그룹의 서브코드들 조회 (순서 계산용)
        const { data: subcodeRecords, error: subcodeError } = await supabase
          .from('admin_mastercode_data')
          .select('subcode_order')
          .eq('group_code', subCodeData.group_code)
          .eq('codetype', 'subcode');

        if (subcodeError) {
          console.error('❌ 서브코드 레코드 조회 오류:', subcodeError);
          throw subcodeError;
        }

        // 서브코드 순서 계산
        const maxOrder =
          subcodeRecords && subcodeRecords.length > 0 ? Math.max(...subcodeRecords.map((record) => record.subcode_order || 0)) : 0;
        const newOrder = subCodeData.subcode_order || maxOrder + 1;

        console.log(`📊 순서 계산: 기존 서브코드 ${subcodeRecords?.length || 0}개, 최대 순서=${maxOrder}, 새 순서=${newOrder}`);

        // 새 서브코드 레코드 생성 (codetype='subcode')
        const newSubCodeRecord = {
          codetype: 'subcode',
          group_code: groupRecord.group_code,
          group_code_name: groupRecord.group_code_name,
          group_code_description: groupRecord.group_code_description,
          group_code_status: groupRecord.group_code_status,
          group_code_order: groupRecord.group_code_order,
          subcode: finalSubCode,
          subcode_name: subCodeData.subcode_name,
          subcode_description: subCodeData.subcode_description || '',
          subcode_status: subCodeData.subcode_status || 'active',
          subcode_remark: subCodeData.subcode_remark || '',
          subcode_order: newOrder,
          is_active: true,
          created_by: 'user',
          updated_by: 'user'
        };

        console.log('💾 DB에 삽입할 새 서브코드 레코드:', newSubCodeRecord);

        // 데이터베이스에 삽입
        const { data: insertedData, error: insertError } = await supabase
          .from('admin_mastercode_data')
          .insert([newSubCodeRecord])
          .select()
          .single();

        if (insertError) {
          console.error('❌ DB 삽입 오류:', insertError);
          throw insertError;
        }

        console.log('✅ 서브코드 생성 성공 (codetype=subcode):', insertedData);

        // 데이터 새로고침
        console.log('🔄 데이터 새로고침 시작');
        await fetchAllData();
        console.log('✅ 모든 작업 완료');

        return insertedData;
      } catch (err) {
        console.error('💥 createSubCode 오류:', err);
        const errorMessage = err instanceof Error ? err.message : '서브코드 생성 중 오류가 발생했습니다.';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [fetchAllData]
  );

  // 서브코드 수정
  const updateSubCode = useCallback(
    async (id: number, updates: Partial<SubCodeInfo>) => {
      setLoading(true);
      setError(null);

      try {
        const { data: updatedData, error: updateError } = await supabase
          .from('admin_mastercode_data')
          .update({
            subcode: updates.subcode,
            subcode_name: updates.subcode_name,
            subcode_description: updates.subcode_description,
            subcode_status: updates.subcode_status,
            subcode_remark: updates.subcode_remark,
            subcode_order: updates.subcode_order,
            is_active: updates.is_active,
            updated_by: 'user'
          })
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        // 데이터 새로고침
        await fetchAllData();
        return updatedData;
      } catch (err) {
        setError(err instanceof Error ? err.message : '서브코드 수정 중 오류가 발생했습니다.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAllData]
  );

  // 서브코드 삭제
  const deleteSubCode = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);

      try {
        // 삭제할 서브코드가 해당 그룹의 마지막 서브코드인지 확인
        const subCodeToDelete = allData.find((item) => item.id === id);
        if (!subCodeToDelete) {
          throw new Error('삭제할 서브코드를 찾을 수 없습니다.');
        }

        const groupSubCodes = allData.filter((item) => item.group_code === subCodeToDelete.group_code);
        if (groupSubCodes.length <= 1) {
          throw new Error('그룹에는 최소 1개의 서브코드가 있어야 합니다.');
        }

        const { error: deleteError } = await supabase.from('admin_mastercode_data').delete().eq('id', id);

        if (deleteError) throw deleteError;

        // 데이터 새로고침
        await fetchAllData();
      } catch (err) {
        setError(err instanceof Error ? err.message : '서브코드 삭제 중 오류가 발생했습니다.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [allData, fetchAllData]
  );

  // 그룹 수정
  const updateGroup = useCallback(
    async (groupCode: string, updates: Partial<GroupInfo>) => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔧 updateGroup 시작:', { groupCode, updates });

        const { data: updatedData, error: updateError } = await supabase
          .from('admin_mastercode_data')
          .update({
            group_code_name: updates.group_code_name,
            group_code_description: updates.group_code_description,
            group_code_status: updates.group_code_status,
            is_active: updates.group_code_status === 'active',
            updated_by: 'user'
          })
          .eq('group_code', groupCode)
          .eq('codetype', 'group')
          .select();

        if (updateError) throw updateError;

        console.log('✅ 그룹 수정 성공:', updatedData);

        // 데이터 새로고침
        await fetchAllData();
        return updatedData;
      } catch (err) {
        console.error('❌ updateGroup 오류:', err);
        setError(err instanceof Error ? err.message : '그룹 수정 중 오류가 발생했습니다.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAllData]
  );

  // 그룹 삭제 (해당 그룹의 모든 서브코드 삭제)
  const deleteGroup = useCallback(
    async (groupCode: string) => {
      setLoading(true);
      setError(null);

      try {
        const { error: deleteError } = await supabase.from('admin_mastercode_data').delete().eq('group_code', groupCode);

        if (deleteError) throw deleteError;

        // 데이터 새로고침
        await fetchAllData();
      } catch (err) {
        setError(err instanceof Error ? err.message : '그룹 삭제 중 오류가 발생했습니다.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAllData]
  );

  // 특정 그룹의 서브코드만 가져오기
  const getSubCodesByGroup = useCallback(
    (groupCode: string) => {
      return subCodes.filter((subCode) => subCode.group_code === groupCode).sort((a, b) => a.subcode_order - b.subcode_order);
    },
    [subCodes]
  );

  // Investment 패턴: 자동 로딩 제거 (페이지에서 수동 호출)
  // useEffect 제거로 병렬 로딩 가능

  return {
    allData,
    groups,
    subCodes,
    loading,
    error,
    getAllMasterCodes, // ⭐ Investment 패턴: 데이터 직접 반환
    processAllData, // ⭐ 전역 캐싱용: 데이터 처리 함수
    refreshData: fetchAllData, // 후방 호환성: 내부 상태 업데이트
    createGroup,
    updateGroup,
    createSubCode,
    updateSubCode,
    deleteSubCode,
    deleteGroup,
    getSubCodesByGroup
  };
};
