import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GROUP016 서브코드 타입 정의
export interface Group016Subcode {
  subcode: string;
  subcode_name: string;
  subcode_order: number;
}

export const useGroup016 = () => {
  const [licenseTypes, setLicenseTypes] = useState<string[]>([]);
  const [group016Data, setGroup016Data] = useState<Group016Subcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup016Data = async () => {
    console.log('🔍 GROUP016 라이센스 유형 데이터 조회...');

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('admin_mastercode_data')
        .select('subcode, subcode_name, subcode_order')
        .eq('group_code', 'GROUP016')
        .eq('codetype', 'subcode')
        .eq('is_active', true)
        .order('subcode_order', { ascending: true });

      if (error) {
        console.error('❌ GROUP016 데이터 조회 실패:', error);
        throw error;
      }

      console.log('✅ GROUP016 데이터 조회 성공:', data?.length + '개');

      const subcodes = data || [];
      setGroup016Data(subcodes);

      // 서브코드명 배열 추출 (기존 licenseTypes와 호환성을 위해)
      const licenseNames = subcodes.map(item => item.subcode_name);
      setLicenseTypes(licenseNames);

      console.log('📋 라이센스 유형 목록:', licenseNames);
      setError(null);

    } catch (err: any) {
      console.error('❌ fetchGroup016Data 오류:', err);
      setError(err.message || 'GROUP016 데이터 조회 중 오류가 발생했습니다.');
      setLicenseTypes([]);
      setGroup016Data([]);
    } finally {
      setLoading(false);
    }
  };

  // 서브코드명으로 서브코드 찾기
  const findSubcodeByName = (name: string): string => {
    const found = group016Data.find(item => item.subcode_name === name);
    return found?.subcode || '';
  };

  // 서브코드로 서브코드명 찾기
  const findNameBySubcode = (subcode: string): string => {
    const found = group016Data.find(item => item.subcode === subcode);
    return found?.subcode_name || '';
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchGroup016Data();
  }, []);

  return {
    licenseTypes,              // string[] - 서브코드명 배열 (기존 호환성)
    group016Data,              // Group016Subcode[] - 전체 데이터
    loading,
    error,
    fetchGroup016Data,
    findSubcodeByName,         // 서브코드명 → 서브코드
    findNameBySubcode          // 서브코드 → 서브코드명
  };
};