import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GROUP019 서브코드 타입 정의 (하드웨어자산상태)
export interface Group019Subcode {
  subcode: string;
  subcode_name: string;
  subcode_order: number;
}

export const useGroup019 = () => {
  const [hardwareStatuses, setHardwareStatuses] = useState<string[]>([]);
  const [group019Data, setGroup019Data] = useState<Group019Subcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup019Data = async () => {
    console.log('🔍 GROUP019 하드웨어자산상태 데이터 조회...');

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('admin_mastercode_data')
        .select('subcode, subcode_name, subcode_order')
        .eq('group_code', 'GROUP019')
        .eq('codetype', 'subcode')
        .eq('is_active', true)
        .order('subcode_order', { ascending: true });

      if (error) {
        console.error('❌ GROUP019 데이터 조회 실패:', error);
        throw error;
      }

      console.log('✅ GROUP019 데이터 조회 성공:', data?.length + '개');

      const subcodes = data || [];
      setGroup019Data(subcodes);

      // 서브코드명 배열 추출 (하드웨어자산상태 목록)
      const statusNames = subcodes.map((item) => item.subcode_name);
      setHardwareStatuses(statusNames);

      console.log('📋 하드웨어자산상태 목록:', statusNames);
      setError(null);
    } catch (err: any) {
      console.error('❌ fetchGroup019Data 오류:', err);
      setError(err.message || 'GROUP019 데이터 조회 중 오류가 발생했습니다.');
      setHardwareStatuses([]);
      setGroup019Data([]);
    } finally {
      setLoading(false);
    }
  };

  // 서브코드명으로 서브코드 찾기
  const findSubcodeByName = (name: string): string => {
    const found = group019Data.find((item) => item.subcode_name === name);
    return found?.subcode || '';
  };

  // 서브코드로 서브코드명 찾기
  const findNameBySubcode = (subcode: string): string => {
    const found = group019Data.find((item) => item.subcode === subcode);
    return found?.subcode_name || '';
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchGroup019Data();
  }, []);

  return {
    hardwareStatuses, // string[] - 서브코드명 배열 (하드웨어자산상태 목록)
    group019Data, // Group019Subcode[] - 전체 데이터
    loading,
    error,
    fetchGroup019Data,
    findSubcodeByName, // 서브코드명 → 서브코드
    findNameBySubcode // 서브코드 → 서브코드명
  };
};
