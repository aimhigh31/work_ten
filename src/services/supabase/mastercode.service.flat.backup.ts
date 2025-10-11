// ========================================
// 마스터코드 관리 Supabase 서비스 클래스 (플랫 구조)
// ========================================

import { supabase } from 'lib/supabase';
import {
  MasterCodeData,
  SubCodeData,
  MasterCodeWithSubCodes,
  CreateMasterCodeRequest,
  UpdateMasterCodeRequest,
  CreateSubCodeRequest,
  UpdateSubCodeRequest,
  MasterCodeTableRow,
  SubCodeTableRow,
  MasterCodeSearchFilter,
  SubCodeSearchFilter,
  MasterCodeStats,
  MasterCodeSelectOption,
  SubCodeSelectOption
} from 'types/mastercode';

// 플랫 구조 데이터 타입
interface FlatMasterCodeData {
  id: number;
  group_code: string;
  group_name: string;
  group_description: string;
  group_status: string;
  sub_code: string;
  sub_name: string;
  sub_description: string;
  sub_status: string;
  code_value1?: string | null;
  code_value2?: string | null;
  code_value3?: string | null;
  display_order: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export class MasterCodeService {
  // ========================================
  // 마스터코드 관련 메서드 (플랫 구조)
  // ========================================

  /**
   * 모든 마스터코드 그룹 조회 (중복 제거)
   */
  async getMasterCodes(filter?: MasterCodeSearchFilter): Promise<MasterCodeTableRow[]> {
    try {
      console.log('🔄 Fetching master codes from flat structure...', filter);

      // 그룹별로 중복 제거하여 조회
      let query = supabase
        .from('admin_mastercode_data')
        .select('group_code, group_name, group_description, group_status, display_order, is_system, created_at, updated_at')
        .eq('group_status', 'active');

      // 필터 적용
      if (filter?.search) {
        query = query.or(`group_code.ilike.%${filter.search}%,group_name.ilike.%${filter.search}%`);
      }

      if (filter?.is_system !== undefined) {
        query = query.eq('is_system', filter.is_system);
      }

      // 정렬
      query = query.order('display_order').order('created_at');

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching master codes:', error);
        throw new Error('Failed to fetch master codes');
      }

      // 중복 제거 (그룹코드 기준)
      const uniqueGroups = new Map();
      data?.forEach((item) => {
        if (!uniqueGroups.has(item.group_code)) {
          uniqueGroups.set(item.group_code, item);
        }
      });

      // 각 그룹의 서브코드 개수 조회
      const tableRows: MasterCodeTableRow[] = [];

      for (const group of uniqueGroups.values()) {
        const { data: subCodes } = await supabase
          .from('admin_mastercode_data')
          .select('id')
          .eq('group_code', group.group_code)
          .eq('sub_status', 'active');

        tableRows.push({
          id: group.id, // 실제 DB id 사용
          code_group: group.group_code,
          code_group_name: group.group_name,
          code_group_description: group.group_description,
          subcodes_count: subCodes?.length || 0,
          is_active: group.group_status === 'active',
          is_system: group.is_system,
          display_order: group.display_order,
          created_at: group.created_at,
          updated_at: group.updated_at
        });
      }

      console.log('✅ Master codes fetched successfully:', tableRows.length, 'groups');
      return tableRows;
    } catch (error) {
      console.error('❌ Master codes fetch error:', error);
      throw error;
    }
  }

  /**
   * 특정 마스터코드 그룹 조회
   */
  async getMasterCode(code_group: string): Promise<MasterCodeData | null> {
    try {
      const { data, error } = await supabase.from('admin_mastercode_data').select('*').eq('group_code', code_group).limit(1).single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch master code: ${code_group}`);
      }

      if (!data) return null;

      // 기존 형식으로 변환
      return {
        id: data.id, // 실제 DB id 사용
        code_group: data.group_code,
        code_group_name: data.group_name,
        code_group_description: data.group_description,
        display_order: data.display_order,
        is_active: data.group_status === 'active',
        is_system: data.is_system,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        updated_by: data.updated_by
      };
    } catch (error) {
      console.error(`❌ Error fetching master code ${code_group}:`, error);
      throw error;
    }
  }

  /**
   * 서브코드와 함께 마스터코드 조회
   */
  async getMasterCodeWithSubCodes(code_group: string): Promise<MasterCodeWithSubCodes | null> {
    try {
      const { data, error } = await supabase.from('admin_mastercode_data').select('*').eq('group_code', code_group).order('display_order');

      if (error) {
        throw new Error(`Failed to fetch master code with subcodes: ${code_group}`);
      }

      if (!data || data.length === 0) return null;

      const firstItem = data[0];

      return {
        id: firstItem.id,
        code_group: firstItem.group_code,
        code_group_name: firstItem.group_name,
        code_group_description: firstItem.group_description,
        display_order: firstItem.display_order,
        is_active: firstItem.group_status === 'active',
        is_system: firstItem.is_system,
        created_at: firstItem.created_at,
        updated_at: firstItem.updated_at,
        created_by: firstItem.created_by,
        updated_by: firstItem.updated_by,
        subcodes: data.map((item) => ({
          id: item.id,
          mastercode_id: firstItem.id, // 실제 DB id 사용
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
        })),
        subcodes_count: data.length
      };
    } catch (error) {
      console.error(`❌ Error fetching master code with subcodes ${code_group}:`, error);
      throw error;
    }
  }

  /**
   * 마스터코드 그룹 생성
   */
  async createMasterCode(request: CreateMasterCodeRequest): Promise<MasterCodeData> {
    try {
      console.log(`🔄 Creating master code group:`, request);

      // 첫 번째 서브코드와 함께 생성 (기본값)
      const { data, error } = await supabase
        .from('admin_mastercode_data')
        .insert({
          group_code: request.code_group,
          group_name: request.code_group_name,
          group_description: request.code_group_description,
          group_status: request.is_active !== false ? 'active' : 'inactive',
          sub_code: 'DEFAULT',
          sub_name: '기본값',
          sub_description: '기본 서브코드',
          sub_status: 'active',
          display_order: request.display_order || 0,
          is_system: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating master code:', error);
        throw new Error(`Failed to create master code: ${error.message}`);
      }

      console.log(`✅ Master code created successfully:`, data);

      // 기존 형식으로 변환하여 반환
      return {
        id: 0,
        code_group: data.group_code,
        code_group_name: data.group_name,
        code_group_description: data.group_description,
        display_order: data.display_order,
        is_active: data.group_status === 'active',
        is_system: data.is_system,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        updated_by: data.updated_by
      };
    } catch (error) {
      console.error(`❌ Create master code error:`, error);
      throw error;
    }
  }

  /**
   * 마스터코드 그룹 업데이트
   */
  async updateMasterCode(request: UpdateMasterCodeRequest): Promise<MasterCodeData> {
    try {
      console.log(`🔄 Updating master code group:`, request);

      const updateData: any = { updated_at: new Date().toISOString() };

      if (request.code_group_name !== undefined) updateData.group_name = request.code_group_name;
      if (request.code_group_description !== undefined) updateData.group_description = request.code_group_description;
      if (request.display_order !== undefined) updateData.display_order = request.display_order;
      if (request.is_active !== undefined) updateData.group_status = request.is_active ? 'active' : 'inactive';

      // 해당 그룹의 모든 레코드 업데이트
      const { data, error } = await supabase
        .from('admin_mastercode_data')
        .update(updateData)
        .eq('group_code', request.code_group || '')
        .select()
        .limit(1)
        .single();

      if (error) {
        console.error('❌ Error updating master code:', error);
        throw new Error(`Failed to update master code: ${error.message}`);
      }

      console.log(`✅ Master code updated successfully`);

      return {
        id: 0,
        code_group: data.group_code,
        code_group_name: data.group_name,
        code_group_description: data.group_description,
        display_order: data.display_order,
        is_active: data.group_status === 'active',
        is_system: data.is_system,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        updated_by: data.updated_by
      };
    } catch (error) {
      console.error(`❌ Update master code error:`, error);
      throw error;
    }
  }

  /**
   * 마스터코드 그룹 삭제
   */
  async deleteMasterCode(code_group: string): Promise<boolean> {
    try {
      console.log(`🔄 Deleting master code group ${code_group}`);

      // 해당 그룹의 모든 레코드 삭제
      const { error } = await supabase.from('admin_mastercode_data').delete().eq('group_code', code_group);

      if (error) {
        console.error('❌ Error deleting master code:', error);
        throw new Error(`Failed to delete master code: ${error.message}`);
      }

      console.log(`✅ Master code group deleted successfully: ${code_group}`);
      return true;
    } catch (error) {
      console.error(`❌ Delete master code error:`, error);
      throw error;
    }
  }

  // ========================================
  // 서브코드 관련 메서드 (플랫 구조)
  // ========================================

  /**
   * 특정 그룹의 서브코드 목록 조회
   */
  async getSubCodes(group_code: string, filter?: SubCodeSearchFilter): Promise<SubCodeTableRow[]> {
    try {
      console.log('🔄 Fetching subcodes from flat structure...', { group_code, filter });

      let query = supabase.from('admin_mastercode_data').select('*').eq('group_code', group_code);

      // 필터 적용
      if (filter?.search) {
        query = query.or(`sub_code.ilike.%${filter.search}%,sub_name.ilike.%${filter.search}%`);
      }

      if (filter?.is_active !== undefined) {
        query = query.eq('sub_status', filter.is_active ? 'active' : 'inactive');
      }

      if (filter?.is_system !== undefined) {
        query = query.eq('is_system', filter.is_system);
      }

      // 정렬
      query = query.order('display_order').order('created_at');

      // 페이징
      if (filter?.limit) {
        query = query.limit(filter.limit);
      }

      if (filter?.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching subcodes:', error);
        throw new Error('Failed to fetch subcodes');
      }

      // 기존 형식으로 변환
      const subCodes =
        data?.map((item) => ({
          id: item.id,
          mastercode_id: 0,
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

      console.log('✅ Subcodes fetched successfully:', subCodes.length, 'records');
      return subCodes;
    } catch (error) {
      console.error('❌ Subcodes fetch error:', error);
      throw error;
    }
  }

  /**
   * 특정 서브코드 조회
   */
  async getSubCode(id: number): Promise<SubCodeData | null> {
    try {
      const { data, error } = await supabase.from('admin_mastercode_data').select('*').eq('id', id).single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch subcode: ${id}`);
      }

      if (!data) return null;

      // 기존 형식으로 변환
      return {
        id: data.id,
        mastercode_id: 0,
        sub_code: data.sub_code,
        sub_code_name: data.sub_name,
        sub_code_description: data.sub_description,
        code_value1: data.code_value1,
        code_value2: data.code_value2,
        code_value3: data.code_value3,
        display_order: data.display_order,
        is_active: data.sub_status === 'active',
        is_system: data.is_system,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        updated_by: data.updated_by
      };
    } catch (error) {
      console.error(`❌ Error fetching subcode ${id}:`, error);
      throw error;
    }
  }

  /**
   * 서브코드 생성
   */
  async createSubCode(request: CreateSubCodeRequest): Promise<SubCodeData> {
    try {
      console.log(`🔄 Creating subcode:`, request);

      // 그룹 정보를 먼저 조회
      const groupInfo = await this.getMasterCode(request.group_code || '');
      if (!groupInfo) {
        throw new Error(`Group not found: ${request.group_code}`);
      }

      const { data, error } = await supabase
        .from('admin_mastercode_data')
        .insert({
          group_code: request.group_code || groupInfo.code_group,
          group_name: groupInfo.code_group_name,
          group_description: groupInfo.code_group_description,
          group_status: groupInfo.is_active ? 'active' : 'inactive',
          sub_code: request.sub_code,
          sub_name: request.sub_code_name,
          sub_description: request.sub_code_description,
          sub_status: request.is_active !== false ? 'active' : 'inactive',
          code_value1: request.code_value1,
          code_value2: request.code_value2,
          code_value3: request.code_value3,
          display_order: request.display_order || 0,
          is_system: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating subcode:', error);
        throw new Error(`Failed to create subcode: ${error.message}`);
      }

      console.log(`✅ Subcode created successfully:`, data);

      return {
        id: data.id,
        mastercode_id: 0,
        sub_code: data.sub_code,
        sub_code_name: data.sub_name,
        sub_code_description: data.sub_description,
        code_value1: data.code_value1,
        code_value2: data.code_value2,
        code_value3: data.code_value3,
        display_order: data.display_order,
        is_active: data.sub_status === 'active',
        is_system: data.is_system,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        updated_by: data.updated_by
      };
    } catch (error) {
      console.error(`❌ Create subcode error:`, error);
      throw error;
    }
  }

  /**
   * 서브코드 업데이트
   */
  async updateSubCode(request: UpdateSubCodeRequest): Promise<SubCodeData> {
    try {
      console.log(`🔄 Updating subcode ${request.id}:`, request);

      const updateData: any = { updated_at: new Date().toISOString() };

      if (request.sub_code !== undefined) updateData.sub_code = request.sub_code;
      if (request.sub_code_name !== undefined) updateData.sub_name = request.sub_code_name;
      if (request.sub_code_description !== undefined) updateData.sub_description = request.sub_code_description;
      if (request.code_value1 !== undefined) updateData.code_value1 = request.code_value1;
      if (request.code_value2 !== undefined) updateData.code_value2 = request.code_value2;
      if (request.code_value3 !== undefined) updateData.code_value3 = request.code_value3;
      if (request.display_order !== undefined) updateData.display_order = request.display_order;
      if (request.is_active !== undefined) updateData.sub_status = request.is_active ? 'active' : 'inactive';

      const { data, error } = await supabase.from('admin_mastercode_data').update(updateData).eq('id', request.id).select().single();

      if (error) {
        console.error('❌ Error updating subcode:', error);
        throw new Error(`Failed to update subcode: ${error.message}`);
      }

      console.log(`✅ Subcode updated successfully:`, data);

      return {
        id: data.id,
        mastercode_id: 0,
        sub_code: data.sub_code,
        sub_code_name: data.sub_name,
        sub_code_description: data.sub_description,
        code_value1: data.code_value1,
        code_value2: data.code_value2,
        code_value3: data.code_value3,
        display_order: data.display_order,
        is_active: data.sub_status === 'active',
        is_system: data.is_system,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        updated_by: data.updated_by
      };
    } catch (error) {
      console.error(`❌ Update subcode error:`, error);
      throw error;
    }
  }

  /**
   * 서브코드 삭제
   */
  async deleteSubCode(id: number): Promise<boolean> {
    try {
      console.log(`🔄 Deleting subcode ${id}`);

      // 시스템 코드인지 확인
      const subCode = await this.getSubCode(id);
      if (subCode?.is_system) {
        throw new Error('시스템 기본 코드는 삭제할 수 없습니다.');
      }

      const { error } = await supabase.from('admin_mastercode_data').delete().eq('id', id);

      if (error) {
        console.error('❌ Error deleting subcode:', error);
        throw new Error(`Failed to delete subcode: ${error.message}`);
      }

      console.log(`✅ Subcode deleted successfully: ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Delete subcode error:`, error);
      throw error;
    }
  }

  // ========================================
  // 유틸리티 메서드 (플랫 구조)
  // ========================================

  /**
   * 마스터코드 선택 옵션 조회 (드롭다운용)
   */
  async getMasterCodeSelectOptions(): Promise<MasterCodeSelectOption[]> {
    try {
      const { data, error } = await supabase
        .from('admin_mastercode_data')
        .select('group_code, group_name, group_description, group_status')
        .eq('group_status', 'active')
        .order('display_order');

      if (error) {
        throw new Error('Failed to fetch master code options');
      }

      // 중복 제거
      const uniqueGroups = new Map();
      data?.forEach((item) => {
        if (!uniqueGroups.has(item.group_code)) {
          uniqueGroups.set(item.group_code, {
            value: item.group_code,
            label: item.group_name,
            description: item.group_description,
            disabled: item.group_status !== 'active'
          });
        }
      });

      return Array.from(uniqueGroups.values());
    } catch (error) {
      console.error('❌ Error fetching master code options:', error);
      throw error;
    }
  }

  /**
   * 서브코드 선택 옵션 조회 (드롭다운용) - 핵심 기능!
   */
  async getSubCodeSelectOptions(group_code: string): Promise<SubCodeSelectOption[]> {
    try {
      const { data, error } = await supabase
        .from('admin_mastercode_data')
        .select('sub_code, sub_name, sub_description, code_value1, sub_status')
        .eq('group_code', group_code)
        .eq('sub_status', 'active')
        .order('display_order');

      if (error) {
        throw new Error('Failed to fetch subcode options');
      }

      return (
        data?.map((item) => ({
          value: item.sub_code,
          label: item.sub_name,
          description: item.sub_description,
          color: item.code_value1,
          disabled: item.sub_status !== 'active'
        })) || []
      );
    } catch (error) {
      console.error('❌ Error fetching subcode options:', error);
      throw error;
    }
  }

  /**
   * 마스터코드 통계 조회
   */
  async getMasterCodeStats(): Promise<MasterCodeStats> {
    try {
      const { data, error } = await supabase.from('admin_mastercode_data').select('group_status, sub_status, is_system');

      if (error) {
        throw new Error('Failed to fetch master code statistics');
      }

      const allData = data || [];

      // 그룹별 중복 제거
      const uniqueGroups = new Map();
      allData.forEach((item) => {
        if (!uniqueGroups.has(item.group_code)) {
          uniqueGroups.set(item.group_code, item);
        }
      });

      const groupData = Array.from(uniqueGroups.values());

      return {
        total_master_codes: groupData.length,
        total_sub_codes: allData.length,
        active_master_codes: groupData.filter((item) => item.group_status === 'active').length,
        active_sub_codes: allData.filter((item) => item.sub_status === 'active').length,
        system_codes: groupData.filter((item) => item.is_system).length,
        custom_codes: groupData.filter((item) => !item.is_system).length
      };
    } catch (error) {
      console.error('❌ Error fetching master code stats:', error);
      throw error;
    }
  }

  /**
   * 코드 그룹 중복 확인
   */
  async checkCodeGroupExists(code_group: string, excludeId?: number): Promise<boolean> {
    try {
      let query = supabase.from('admin_mastercode_data').select('id').eq('group_code', code_group).limit(1);

      const { data, error } = await query;

      if (error) {
        throw new Error('Failed to check code group existence');
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('❌ Error checking code group existence:', error);
      throw error;
    }
  }

  /**
   * 서브코드 중복 확인
   */
  async checkSubCodeExists(group_code: string, sub_code: string, excludeId?: number): Promise<boolean> {
    try {
      let query = supabase.from('admin_mastercode_data').select('id').eq('group_code', group_code).eq('sub_code', sub_code);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('Failed to check subcode existence');
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('❌ Error checking subcode existence:', error);
      throw error;
    }
  }

  // ========================================
  // 플랫 구조 전용 메서드
  // ========================================

  /**
   * 모든 플랫 구조 데이터 조회
   */
  async getAllFlatCodes(groupCode?: string): Promise<any[]> {
    try {
      let query = supabase.from('admin_mastercode_data').select('*').order('group_code').order('display_order');

      if (groupCode) {
        query = query.eq('group_code', groupCode);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('Failed to fetch flat codes');
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching flat codes:', error);
      throw error;
    }
  }

  /**
   * 플랫 구조 데이터 생성
   */
  async createFlatCode(data: {
    group_code: string;
    group_name: string;
    group_description?: string;
    sub_code: string;
    sub_name: string;
    sub_description?: string;
    code_value1?: string;
    code_value2?: string;
    code_value3?: string;
    display_order?: number;
  }): Promise<any> {
    try {
      const { data: result, error } = await supabase
        .from('admin_mastercode_data')
        .insert({
          group_code: data.group_code,
          group_name: data.group_name,
          group_description: data.group_description || '',
          group_status: 'active',
          sub_code: data.sub_code,
          sub_name: data.sub_name,
          sub_description: data.sub_description || '',
          sub_status: 'active',
          code_value1: data.code_value1,
          code_value2: data.code_value2,
          code_value3: data.code_value3,
          display_order: data.display_order || 0,
          is_system: false
        })
        .select()
        .single();

      if (error) {
        throw new Error('Failed to create flat code');
      }

      return result;
    } catch (error) {
      console.error('❌ Error creating flat code:', error);
      throw error;
    }
  }

  /**
   * 플랫 구조 데이터 업데이트
   */
  async updateFlatCode(
    id: number,
    data: {
      group_name?: string;
      group_description?: string;
      sub_name?: string;
      sub_description?: string;
      code_value1?: string;
      code_value2?: string;
      code_value3?: string;
      display_order?: number;
      group_status?: string;
      sub_status?: string;
    }
  ): Promise<any> {
    try {
      const { data: result, error } = await supabase
        .from('admin_mastercode_data')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error('Failed to update flat code');
      }

      return result;
    } catch (error) {
      console.error('❌ Error updating flat code:', error);
      throw error;
    }
  }

  /**
   * 플랫 구조 데이터 삭제
   */
  async deleteFlatCode(id: number): Promise<boolean> {
    try {
      const { error } = await supabase.from('admin_mastercode_data').delete().eq('id', id);

      if (error) {
        throw new Error('Failed to delete flat code');
      }

      return true;
    } catch (error) {
      console.error('❌ Error deleting flat code:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const masterCodeService = new MasterCodeService();
