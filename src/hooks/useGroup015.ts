import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GROUP015 서브코드 타입 정의
export interface Group015Subcode {
  subcode: string;
  subcode_name: string;
  subcode_order: number;
}

export const useGroup015 = () => {
  const [softwareCategories, setSoftwareCategories] = useState<string[]>([]);
  const [group015Data, setGroup015Data] = useState<Group015Subcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup015Data = async () => {
    console.log('🔍 GROUP015 소프트웨어분류 데이터 조회...');

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('admin_mastercode_data')
        .select('subcode, subcode_name, subcode_order')
        .eq('group_code', 'GROUP015')
        .eq('codetype', 'subcode')
        .eq('is_active', true)
        .order('subcode_order', { ascending: true });

      if (error) {
        console.error('❌ GROUP015 데이터 조회 실패:', error);
        throw error;
      }

      console.log('✅ GROUP015 데이터 조회 성공:', data?.length + '개');

      const subcodes = data || [];
      setGroup015Data(subcodes);

      // 서브코드명 배열 추출 (기존 softwareCategories와 호환성을 위해)
      const categoryNames = subcodes.map(item => item.subcode_name);
      setSoftwareCategories(categoryNames);

      console.log('📋 소프트웨어분류 목록:', categoryNames);
      setError(null);

    } catch (err: any) {
      console.error('❌ fetchGroup015Data 오류:', err);
      setError(err.message || 'GROUP015 데이터 조회 중 오류가 발생했습니다.');
      setSoftwareCategories([]);
      setGroup015Data([]);
    } finally {
      setLoading(false);
    }
  };

  // 서브코드명으로 서브코드 찾기
  const findSubcodeByName = (name: string): string => {
    const found = group015Data.find(item => item.subcode_name === name);
    return found?.subcode || '';
  };

  // 서브코드로 서브코드명 찾기
  const findNameBySubcode = (subcode: string): string => {
    const found = group015Data.find(item => item.subcode === subcode);
    return found?.subcode_name || '';
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchGroup015Data();
  }, []);

  return {
    softwareCategories,       // string[] - 서브코드명 배열 (기존 호환성)
    group015Data,            // Group015Subcode[] - 전체 데이터
    loading,
    error,
    fetchGroup015Data,
    findSubcodeByName,       // 서브코드명 → 서브코드
    findNameBySubcode        // 서브코드 → 서브코드명
  };
};