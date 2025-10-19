import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GROUP018 서브코드 타입 정의 (자산분류)
export interface Group018Subcode {
  subcode: string;
  subcode_name: string;
  subcode_order: number;
}

export const useGroup018 = () => {
  const [assetCategories, setAssetCategories] = useState<string[]>([]);
  const [group018Data, setGroup018Data] = useState<Group018Subcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup018Data = async () => {
    console.log('🔍 GROUP018 자산분류 데이터 조회...');

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('admin_mastercode_data')
        .select('subcode, subcode_name, subcode_order')
        .eq('group_code', 'GROUP018')
        .eq('codetype', 'subcode')
        .eq('is_active', true)
        .order('subcode_order', { ascending: true });

      if (error) {
        console.error('❌ GROUP018 데이터 조회 실패:', error);
        throw error;
      }

      console.log('✅ GROUP018 데이터 조회 성공:', data?.length + '개');

      const subcodes = data || [];
      setGroup018Data(subcodes);

      // 서브코드명 배열 추출 (자산분류 목록)
      const categoryNames = subcodes.map((item) => item.subcode_name);
      setAssetCategories(categoryNames);

      console.log('📋 자산분류 목록:', categoryNames);
      setError(null);
    } catch (err: any) {
      console.error('❌ fetchGroup018Data 오류:', err);
      setError(err.message || 'GROUP018 데이터 조회 중 오류가 발생했습니다.');
      setAssetCategories([]);
      setGroup018Data([]);
    } finally {
      setLoading(false);
    }
  };

  // 서브코드명으로 서브코드 찾기
  const findSubcodeByName = (name: string): string => {
    const found = group018Data.find((item) => item.subcode_name === name);
    return found?.subcode || '';
  };

  // 서브코드로 서브코드명 찾기
  const findNameBySubcode = (subcode: string): string => {
    const found = group018Data.find((item) => item.subcode === subcode);
    return found?.subcode_name || '';
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchGroup018Data();
  }, []);

  return {
    assetCategories, // string[] - 서브코드명 배열 (자산분류 목록)
    group018Data, // Group018Subcode[] - 전체 데이터
    loading,
    error,
    fetchGroup018Data,
    findSubcodeByName, // 서브코드명 → 서브코드
    findNameBySubcode // 서브코드 → 서브코드명
  };
};
