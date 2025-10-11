import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GROUP017 서브코드 타입 정의
export interface Group017Subcode {
  subcode: string;
  subcode_name: string;
  subcode_order: number;
}

export const useGroup017 = () => {
  const [historyTypes, setHistoryTypes] = useState<string[]>([]);
  const [group017Data, setGroup017Data] = useState<Group017Subcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup017Data = async () => {
    console.log('🔍 GROUP017 이력유형 데이터 조회...');

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('admin_mastercode_data')
        .select('subcode, subcode_name, subcode_order')
        .eq('group_code', 'GROUP017')
        .eq('codetype', 'subcode')
        .eq('is_active', true)
        .order('subcode_order', { ascending: true });

      if (error) {
        console.error('❌ GROUP017 데이터 조회 실패:', error);
        throw error;
      }

      console.log('✅ GROUP017 데이터 조회 성공:', data?.length + '개');

      const subcodes = data || [];
      setGroup017Data(subcodes);

      // 서브코드명 배열 추출 (이력유형 목록)
      const typeNames = subcodes.map(item => item.subcode_name);
      setHistoryTypes(typeNames);

      console.log('📋 이력유형 목록:', typeNames);
      setError(null);

    } catch (err: any) {
      console.error('❌ fetchGroup017Data 오류:', err);
      setError(err.message || 'GROUP017 데이터 조회 중 오류가 발생했습니다.');
      setHistoryTypes([]);
      setGroup017Data([]);
    } finally {
      setLoading(false);
    }
  };

  // 서브코드명으로 서브코드 찾기
  const findSubcodeByName = (name: string): string => {
    const found = group017Data.find(item => item.subcode_name === name);
    return found?.subcode || '';
  };

  // 서브코드로 서브코드명 찾기
  const findNameBySubcode = (subcode: string): string => {
    const found = group017Data.find(item => item.subcode === subcode);
    return found?.subcode_name || '';
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchGroup017Data();
  }, []);

  return {
    historyTypes,            // string[] - 서브코드명 배열 (이력유형 목록)
    group017Data,           // Group017Subcode[] - 전체 데이터
    loading,
    error,
    fetchGroup017Data,
    findSubcodeByName,      // 서브코드명 → 서브코드
    findNameBySubcode       // 서브코드 → 서브코드명
  };
};