import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface HardwareData {
  id?: number;
  registration_date?: string;
  code?: string;
  team?: string;
  department?: string;
  work_content?: string;
  status?: string;
  assignee?: string;
  registrant?: string;                  // 등록자
  start_date?: string;
  completed_date?: string;
  attachments?: string[];

  // 하드웨어 특화 필드
  asset_category?: string;          // 자산 분류
  asset_name?: string;              // 자산명
  model?: string;                   // 모델명
  manufacturer?: string;            // 제조사
  vendor?: string;                  // 공급업체
  detail_spec?: string;             // 상세 스펙
  purchase_date?: string;           // 구매일
  warranty_end_date?: string;       // 보증 종료일
  serial_number?: string;           // 시리얼 번호
  assigned_user?: string;           // 할당된 사용자
  location?: string;                // 위치/장소
  images?: string[];                // 이미지 파일 배열

  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useSupabaseHardware = () => {
  const [hardware, setHardware] = useState<HardwareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 하드웨어 목록 조회
  const fetchHardware = async () => {
    console.log('🔍 하드웨어 데이터 조회 시작...');

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('it_hardware_data')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('❌ 하드웨어 데이터 조회 실패:', error);
        throw error;
      }

      console.log('✅ 하드웨어 데이터 조회 성공:', data?.length + '개');
      setHardware(data || []);
      setError(null);

    } catch (err: any) {
      console.warn('❌ fetchHardware 오류:', err);
      setError(err.message || '데이터 조회 중 오류가 발생했습니다.');
      setHardware([]);
    } finally {
      setLoading(false);
    }
  };

  // 하드웨어 생성
  const createHardware = async (hardwareData: Omit<HardwareData, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('🆕 하드웨어 생성 시작:', hardwareData);
    console.log('🖼️ 이미지 URL 확인:', {
      image_1_url: hardwareData.image_1_url,
      image_2_url: hardwareData.image_2_url
    });

    const insertData = {
      ...hardwareData,
      is_active: true,
      registration_date: new Date().toISOString().split('T')[0]  // YYYY-MM-DD 형식으로
    };

    console.log('📤 Supabase로 전송할 데이터:', insertData);

    try {
      const { data, error } = await supabase
        .from('it_hardware_data')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.warn('❌ 하드웨어 생성 실패:', error);
        console.warn('❌ 에러 상세:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code
        });
        console.warn('❌ 전송한 데이터:', {
          ...hardwareData,
          is_active: true,
          registration_date: new Date().toISOString().split('T')[0]
        });
        throw error;
      }

      console.log('✅ 하드웨어 생성 성공:', data);
      await fetchHardware();
      return data;

    } catch (err: any) {
      console.warn('❌ createHardware 오류:', err);
      throw err;
    }
  };

  // 하드웨어 수정
  const updateHardware = async (id: number, hardwareData: Partial<HardwareData>) => {
    console.log('🔄 하드웨어 수정 시작:', { id, hardwareData });
    console.log('🖼️ 수정 - 이미지 URL 확인:', {
      image_1_url: hardwareData.image_1_url,
      image_2_url: hardwareData.image_2_url
    });

    try {
      // null 값들을 제거하여 실제 업데이트할 데이터만 전송
      const cleanData = Object.fromEntries(
        Object.entries(hardwareData).filter(([_, value]) => value !== null && value !== undefined)
      );

      console.log('📝 정제된 업데이트 데이터:', cleanData);
      console.log('📝 정제된 데이터 키들:', Object.keys(cleanData));
      console.log('🖼️ 정제된 데이터의 이미지 URL:', {
        image_1_url: cleanData.image_1_url,
        image_2_url: cleanData.image_2_url
      });
      console.log('🔍 Supabase 업데이트 쿼리 실행:', { table: 'it_hardware_data', id, cleanData });
      console.log('🔍 실제 전송되는 데이터:', JSON.stringify(cleanData, null, 2));

      const { data, error } = await supabase
        .from('it_hardware_data')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single();

      console.log('🔍 Supabase 업데이트 응답:', { data: !!data, error: !!error });

      if (error) {
        console.warn('❌ 하드웨어 수정 실패 (Supabase 에러):', error);
        console.warn('❌ 에러 상세:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          keys: Object.keys(error || {}),
          errorString: JSON.stringify(error, null, 2)
        });
        console.warn('❌ 수정 시도 데이터:', { id, cleanData });
        throw new Error(`DB 수정 실패: ${error?.message || 'Unknown error'}`);
      }

      if (!data) {
        throw new Error('수정된 데이터가 반환되지 않았습니다.');
      }

      console.log('✅ 하드웨어 수정 성공:', data);
      await fetchHardware();
      return data;

    } catch (err: any) {
      console.warn('❌ updateHardware 전체 오류:', {
        message: err.message,
        stack: err.stack,
        err
      });
      throw err;
    }
  };

  // 하드웨어 삭제 (soft delete)
  const deleteHardware = async (id: number) => {
    console.log('🗑️ 하드웨어 삭제 시작:', id);

    try {
      const { data, error } = await supabase
        .from('it_hardware_data')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('❌ 하드웨어 삭제 실패:', error);
        throw error;
      }

      console.log('✅ 하드웨어 삭제 성공:', data);
      await fetchHardware();
      return data;

    } catch (err: any) {
      console.warn('❌ deleteHardware 오류:', err);
      throw err;
    }
  };

  // 여러 하드웨어 삭제 (soft delete)
  const deleteMultipleHardware = async (ids: number[]) => {
    console.log('🗑️ 여러 하드웨어 삭제 시작:', ids);

    if (!ids || ids.length === 0) {
      console.warn('⚠️ 삭제할 하드웨어 ID가 없습니다.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('it_hardware_data')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .in('id', ids)
        .select();

      if (error) {
        console.warn('❌ 여러 하드웨어 삭제 실패:', error);
        throw error;
      }

      console.log(`✅ ${ids.length}개 하드웨어 삭제 성공:`, data);
      await fetchHardware();
      return data;

    } catch (err: any) {
      console.warn('❌ deleteMultipleHardware 오류:', err);
      throw err;
    }
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchHardware();
  }, []);

  return {
    hardware,
    loading,
    error,
    fetchHardware,
    createHardware,
    updateHardware,
    deleteHardware,
    deleteMultipleHardware
  };
};