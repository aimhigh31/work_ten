import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 사용상태 옵션 인터페이스
export interface UserStatusOption {
  subcode: string;
  subcode_name: string;
  subcode_order: number;
}

export const useGroup020 = () => {
  const [userStatuses, setUserStatuses] = useState<UserStatusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroup020Data = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 GROUP020 마스터코드 데이터 조회 시작...');

        const { data, error } = await supabase
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('group_code', 'GROUP020')
          .eq('codetype', 'subcode')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });

        if (error) {
          console.error('❌ GROUP020 데이터 조회 실패:', error);
          setError('사용상태 목록을 불러오는데 실패했습니다.');

          // 에러 시 기본 옵션 제공
          setUserStatuses([
            { subcode: 'active', subcode_name: '사용중', subcode_order: 1 },
            { subcode: 'inactive', subcode_name: '종료', subcode_order: 2 }
          ]);
          return;
        }

        if (!data || data.length === 0) {
          console.warn('⚠️ GROUP020 데이터가 없습니다. 기본 데이터를 사용합니다.');

          // 데이터가 없을 시 기본 옵션 제공
          setUserStatuses([
            { subcode: 'active', subcode_name: '사용중', subcode_order: 1 },
            { subcode: 'inactive', subcode_name: '종료', subcode_order: 2 }
          ]);
          return;
        }

        console.log('✅ GROUP020 데이터 조회 성공:', data.length + '개');
        setUserStatuses(data);

      } catch (err: any) {
        console.error('❌ GROUP020 데이터 조회 중 오류:', err);
        setError('사용상태 목록을 불러오는데 실패했습니다.');

        // 에러 시 기본 옵션 제공
        setUserStatuses([
          { subcode: 'active', subcode_name: '사용중', subcode_order: 1 },
          { subcode: 'inactive', subcode_name: '종료', subcode_order: 2 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup020Data();
  }, []);

  // 서브코드를 서브코드명으로 변환하는 유틸리티 함수
  const getStatusName = (subcode: string): string => {
    const status = userStatuses.find(s => s.subcode === subcode);
    return status ? status.subcode_name : subcode;
  };

  // 서브코드명을 서브코드로 변환하는 유틸리티 함수
  const getStatusCode = (subcodeName: string): string => {
    const status = userStatuses.find(s => s.subcode_name === subcodeName);
    return status ? status.subcode : subcodeName;
  };

  // Select 옵션용 배열 생성
  const statusOptions = userStatuses.map(status => ({
    value: status.subcode,
    label: status.subcode_name
  }));

  return {
    userStatuses,
    statusOptions,
    loading,
    error,
    getStatusName,
    getStatusCode
  };
};