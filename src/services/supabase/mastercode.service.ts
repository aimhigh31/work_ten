// ========================================
// 마스터코드 관리 Service Layer - 계층 구조 (플랫 테이블 사용)
// admin_mastercode_data 테이블을 계층 구조처럼 사용
// ========================================

import { supabase } from 'lib/supabase';
import {
  MasterCodeData,
  SubCodeData,
  MasterCodeTableRow,
  SubCodeTableRow,
  MasterCodeSearchFilter,
  SubCodeSearchFilter,
  CreateMasterCodeRequest,
  UpdateMasterCodeRequest,
  CreateSubCodeRequest,
  UpdateSubCodeRequest,
  MasterCodeStats,
  MasterCodeSelectOption,
  SubCodeSelectOption,
  MasterCodeWithSubCodes
} from 'types/mastercode';

class MasterCodeService {
  // ========================================
  // 마스터코드 관련 메소드
  // ========================================

  /**
   * 마스터코드 목록 조회 (플랫 테이블에서 그룹화)
   */
  async getMasterCodes(filter?: MasterCodeSearchFilter): Promise<MasterCodeTableRow[]> {
    try {
      console.log('📋 Fetching master codes from flat table...');

      // 플랫 테이블에서 고유한 그룹 코드만 추출
      const { data, error } = await supabase.from('admin_mastercode_data').select('*').order('group_code');

      if (error) {
        throw new Error('Failed to fetch master codes');
      }

      // 그룹별로 데이터 집계
      const groupMap = new Map<string, any>();

      data?.forEach((item) => {
        if (!groupMap.has(item.group_code)) {
          groupMap.set(item.group_code, {
            id: item.id, // 첫 번째 레코드의 ID 사용
            code_group: item.group_code,
            code_group_name: item.group_name,
            code_group_description: item.group_description,
            display_order: item.display_order || 0,
            is_active: item.group_status === 'active',
            is_system: item.is_system || false,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sub_count: 0
          });
        }
        // 서브코드 개수 카운트
        const group = groupMap.get(item.group_code);
        group.sub_count++;
      });

      const masterCodes = Array.from(groupMap.values());

      // 필터 적용
      let filtered = masterCodes;
      if (filter) {
        if (filter.searchKeyword) {
          const keyword = filter.searchKeyword.toLowerCase();
          filtered = filtered.filter(
            (mc) => mc.code_group.toLowerCase().includes(keyword) || mc.code_group_name.toLowerCase().includes(keyword)
          );
        }
        if (filter.isActive !== undefined) {
          filtered = filtered.filter((mc) => mc.is_active === filter.isActive);
        }
      }

      console.log('✅ Master codes fetched:', filtered.length);
      return filtered;
    } catch (error) {
      console.error('❌ Master codes fetch error:', error);
      throw error;
    }
  }

  /**
   * 마스터코드 단일 조회
   */
  async getMasterCode(id: number): Promise<MasterCodeData | null> {
    try {
      // 플랫 테이블에서 해당 ID의 레코드 조회
      const { data, error } = await supabase.from('admin_mastercode_data').select('*').eq('id', id).single();

      if (error && error.code !== 'PGRST116') {
        throw new Error('Failed to fetch master code');
      }

      if (!data) return null;

      return {
        id: data.id,
        code_group: data.group_code,
        code_group_name: data.group_name,
        code_group_description: data.group_description,
        is_active: data.group_status === 'active',
        is_system: data.is_system || false,
        display_order: data.display_order || 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        updated_by: data.updated_by
      };
    } catch (error) {
      console.error('❌ Master code fetch error:', error);
      throw error;
    }
  }

  /**
   * 마스터코드 생성
   */
  async createMasterCode(request: CreateMasterCodeRequest): Promise<MasterCodeData> {
    try {
      const { data, error } = await supabase
        .from('admin_mastercode_data')
        .insert({
          group_code: request.code_group,
          group_name: request.code_group_name,
          group_description: request.code_group_description,
          group_status: request.is_active ? 'active' : 'inactive',
          is_system: request.is_system || false,
          display_order: request.display_order || 0,
          sub_code: 'MASTER',
          sub_name: 'Master Record',
          sub_status: 'active'
        })
        .select()
        .single();

      if (error) {
        throw new Error('Failed to create master code');
      }

      return {
        id: data.id,
        code_group: data.group_code,
        code_group_name: data.group_name,
        code_group_description: data.group_description,
        is_active: data.group_status === 'active',
        is_system: data.is_system,
        display_order: data.display_order,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        updated_by: data.updated_by
      };
    } catch (error) {
      console.error('❌ Master code creation error:', error);
      throw error;
    }
  }

  /**
   * 마스터코드 업데이트
   */
  async updateMasterCode(request: UpdateMasterCodeRequest): Promise<MasterCodeData> {
    try {
      // 해당 그룹의 모든 레코드 업데이트
      const { data: currentData } = await supabase.from('admin_mastercode_data').select('group_code').eq('id', request.id).single();

      if (!currentData) {
        throw new Error('Master code not found');
      }

      const updateData: any = {};
      if (request.code_group !== undefined) updateData.group_code = request.code_group;
      if (request.code_group_name !== undefined) updateData.group_name = request.code_group_name;
      if (request.code_group_description !== undefined) updateData.group_description = request.code_group_description;
      if (request.is_active !== undefined) updateData.group_status = request.is_active ? 'active' : 'inactive';
      if (request.display_order !== undefined) updateData.display_order = request.display_order;

      const { error } = await supabase.from('admin_mastercode_data').update(updateData).eq('group_code', currentData.group_code);

      if (error) {
        throw new Error('Failed to update master code');
      }

      return (await this.getMasterCode(request.id)) as MasterCodeData;
    } catch (error) {
      console.error('❌ Master code update error:', error);
      throw error;
    }
  }

  /**
   * 마스터코드 삭제
   */
  async deleteMasterCode(id: number): Promise<void> {
    try {
      // 해당 그룹의 모든 레코드 삭제
      const { data: currentData } = await supabase.from('admin_mastercode_data').select('group_code').eq('id', id).single();

      if (!currentData) {
        throw new Error('Master code not found');
      }

      const { error } = await supabase.from('admin_mastercode_data').delete().eq('group_code', currentData.group_code);

      if (error) {
        throw new Error('Failed to delete master code');
      }
    } catch (error) {
      console.error('❌ Master code deletion error:', error);
      throw error;
    }
  }

  // ========================================
  // 서브코드 관련 메소드
  // ========================================

  /**
   * 서브코드 목록 조회
   */
  async getSubCodes(mastercode_id: number, filter?: SubCodeSearchFilter): Promise<SubCodeTableRow[]> {
    try {
      console.log('📋 Fetching subcodes for mastercode:', mastercode_id);

      // 마스터코드 ID로 그룹 코드 찾기
      const { data: masterData } = await supabase.from('admin_mastercode_data').select('group_code').eq('id', mastercode_id).single();

      if (!masterData) {
        return [];
      }

      // 해당 그룹의 서브코드들 조회
      let query = supabase
        .from('admin_mastercode_data')
        .select('*')
        .eq('group_code', masterData.group_code)
        .neq('sub_code', 'MASTER') // MASTER 레코드 제외
        .order('display_order');

      if (filter) {
        if (filter.searchKeyword) {
          query = query.or(`sub_code.ilike.%${filter.searchKeyword}%,sub_name.ilike.%${filter.searchKeyword}%`);
        }
        if (filter.isActive !== undefined) {
          query = query.eq('sub_status', filter.isActive ? 'active' : 'inactive');
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('Failed to fetch subcodes');
      }

      const subCodes =
        data?.map((item) => ({
          id: item.id,
          mastercode_id: mastercode_id,
          sub_code: item.sub_code,
          sub_code_name: item.sub_name,
          sub_code_description: item.sub_description,
          code_value1: item.code_value1,
          code_value2: item.code_value2,
          code_value3: item.code_value3,
          display_order: item.display_order,
          is_active: item.sub_status === 'active',
          is_system: item.is_system,
          created_at: item.created_at,
          updated_at: item.updated_at,
          created_by: item.created_by,
          updated_by: item.updated_by
        })) || [];

      console.log('✅ Subcodes fetched:', subCodes.length);
      return subCodes;
    } catch (error) {
      console.error('❌ Subcodes fetch error:', error);
      throw error;
    }
  }

  /**
   * 서브코드 생성
   */
  async createSubCode(request: CreateSubCodeRequest): Promise<SubCodeData> {
    try {
      // 마스터코드 정보 가져오기
      const { data: masterData } = await supabase
        .from('admin_mastercode_data')
        .select('group_code, group_name, group_description, group_status')
        .eq('id', request.mastercode_id)
        .single();

      if (!masterData) {
        throw new Error('Master code not found');
      }

      const { data, error } = await supabase
        .from('admin_mastercode_data')
        .insert({
          group_code: masterData.group_code,
          group_name: masterData.group_name,
          group_description: masterData.group_description,
          group_status: masterData.group_status,
          sub_code: request.sub_code,
          sub_name: request.sub_code_name,
          sub_description: request.sub_code_description,
          sub_status: request.is_active ? 'active' : 'inactive',
          code_value1: request.code_value1,
          code_value2: request.code_value2,
          code_value3: request.code_value3,
          display_order: request.display_order || 0,
          is_system: request.is_system || false
        })
        .select()
        .single();

      if (error) {
        throw new Error('Failed to create subcode');
      }

      return {
        id: data.id,
        mastercode_id: request.mastercode_id,
        sub_code: data.sub_code,
        sub_code_name: data.sub_name,
        sub_code_description: data.sub_description,
        code_value1: data.code_value1,
        code_value2: data.code_value2,
        code_value3: data.code_value3,
        is_active: data.sub_status === 'active',
        is_system: data.is_system,
        display_order: data.display_order,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        updated_by: data.updated_by
      };
    } catch (error) {
      console.error('❌ Subcode creation error:', error);
      throw error;
    }
  }

  /**
   * 서브코드 업데이트
   */
  async updateSubCode(request: UpdateSubCodeRequest): Promise<SubCodeData> {
    try {
      const updateData: any = {};
      if (request.sub_code !== undefined) updateData.sub_code = request.sub_code;
      if (request.sub_code_name !== undefined) updateData.sub_name = request.sub_code_name;
      if (request.sub_code_description !== undefined) updateData.sub_description = request.sub_code_description;
      if (request.code_value1 !== undefined) updateData.code_value1 = request.code_value1;
      if (request.code_value2 !== undefined) updateData.code_value2 = request.code_value2;
      if (request.code_value3 !== undefined) updateData.code_value3 = request.code_value3;
      if (request.is_active !== undefined) updateData.sub_status = request.is_active ? 'active' : 'inactive';
      if (request.display_order !== undefined) updateData.display_order = request.display_order;

      const { data, error } = await supabase.from('admin_mastercode_data').update(updateData).eq('id', request.id).select().single();

      if (error) {
        throw new Error('Failed to update subcode');
      }

      return {
        id: data.id,
        mastercode_id: request.mastercode_id || 0,
        sub_code: data.sub_code,
        sub_code_name: data.sub_name,
        sub_code_description: data.sub_description,
        code_value1: data.code_value1,
        code_value2: data.code_value2,
        code_value3: data.code_value3,
        is_active: data.sub_status === 'active',
        is_system: data.is_system,
        display_order: data.display_order,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        updated_by: data.updated_by
      };
    } catch (error) {
      console.error('❌ Subcode update error:', error);
      throw error;
    }
  }

  /**
   * 서브코드 삭제
   */
  async deleteSubCode(id: number): Promise<void> {
    try {
      const { error } = await supabase.from('admin_mastercode_data').delete().eq('id', id);

      if (error) {
        throw new Error('Failed to delete subcode');
      }
    } catch (error) {
      console.error('❌ Subcode deletion error:', error);
      throw error;
    }
  }

  // ========================================
  // 유틸리티 메소드
  // ========================================

  /**
   * 코드 그룹 중복 확인
   */
  async checkCodeGroupExists(codeGroup: string, excludeId?: number): Promise<boolean> {
    try {
      let query = supabase.from('admin_mastercode_data').select('id').eq('group_code', codeGroup).eq('sub_code', 'MASTER');

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data } = await query;
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('❌ Code group check error:', error);
      return false;
    }
  }

  /**
   * 서브코드 중복 확인
   */
  async checkSubCodeExists(mastercode_id: number, subCode: string, excludeId?: number): Promise<boolean> {
    try {
      // 마스터코드의 그룹 코드 가져오기
      const { data: masterData } = await supabase.from('admin_mastercode_data').select('group_code').eq('id', mastercode_id).single();

      if (!masterData) return false;

      let query = supabase.from('admin_mastercode_data').select('id').eq('group_code', masterData.group_code).eq('sub_code', subCode);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data } = await query;
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('❌ Subcode check error:', error);
      return false;
    }
  }

  /**
   * 마스터코드와 서브코드 함께 조회
   */
  async getMasterCodeWithSubCodes(id: number): Promise<MasterCodeWithSubCodes | null> {
    try {
      const masterCode = await this.getMasterCode(id);
      if (!masterCode) return null;

      const subCodes = await this.getSubCodes(id);

      return {
        ...masterCode,
        subCodes
      };
    } catch (error) {
      console.error('❌ Master code with subcodes fetch error:', error);
      throw error;
    }
  }

  /**
   * 마스터코드 선택 옵션 조회
   */
  async getMasterCodeSelectOptions(): Promise<MasterCodeSelectOption[]> {
    try {
      const masterCodes = await this.getMasterCodes({ isActive: true });
      return masterCodes.map((mc) => ({
        value: mc.id,
        label: mc.code_group_name,
        code: mc.code_group
      }));
    } catch (error) {
      console.error('❌ Master code options fetch error:', error);
      throw error;
    }
  }

  /**
   * 서브코드 선택 옵션 조회 (마스터코드 ID 기반)
   */
  async getSubCodeSelectOptions(mastercode_id: number): Promise<SubCodeSelectOption[]> {
    try {
      const subCodes = await this.getSubCodes(mastercode_id, { isActive: true });
      return subCodes.map((sc) => ({
        value: sc.sub_code,
        label: sc.sub_code_name,
        description: sc.sub_code_description,
        color: sc.code_value1
      }));
    } catch (error) {
      console.error('❌ Subcode options fetch error:', error);
      throw error;
    }
  }

  /**
   * 마스터코드 통계 조회
   */
  async getMasterCodeStats(): Promise<MasterCodeStats> {
    try {
      const { data } = await supabase.from('admin_mastercode_data').select('group_code, sub_status');

      const stats = {
        totalMasterCodes: 0,
        activeMasterCodes: 0,
        totalSubCodes: 0,
        activeSubCodes: 0
      };

      if (data) {
        const groups = new Set<string>();
        const activeGroups = new Set<string>();

        data.forEach((item) => {
          groups.add(item.group_code);
          if (item.sub_status === 'active') {
            activeGroups.add(item.group_code);
          }
          if (item.sub_code !== 'MASTER') {
            stats.totalSubCodes++;
            if (item.sub_status === 'active') {
              stats.activeSubCodes++;
            }
          }
        });

        stats.totalMasterCodes = groups.size;
        stats.activeMasterCodes = activeGroups.size;
      }

      return stats;
    } catch (error) {
      console.error('❌ Stats fetch error:', error);
      throw error;
    }
  }
}

export const masterCodeService = new MasterCodeService();
