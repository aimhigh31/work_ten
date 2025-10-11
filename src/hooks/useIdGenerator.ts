// ID 생성 훅
import { useCallback, useEffect, useState } from 'react';

const ID_STORAGE_KEY = 'security_education_last_id';
const INITIAL_ID = 156675; // 현재 DB의 최대 ID

export const useIdGenerator = () => {
  const [lastId, setLastId] = useState<number>(() => {
    // 로컬 스토리지에서 마지막 ID 가져오기
    const stored = localStorage.getItem(ID_STORAGE_KEY);
    return stored ? parseInt(stored) : INITIAL_ID;
  });

  // ID 생성 함수
  const generateNextId = useCallback(() => {
    const nextId = lastId + 1;
    setLastId(nextId);
    localStorage.setItem(ID_STORAGE_KEY, nextId.toString());
    console.log(`🆔 새 ID 생성: ${nextId}`);
    return nextId;
  }, [lastId]);

  // 최대 ID 동기화 (DB에서 실제 최대값 확인)
  const syncMaxId = useCallback(async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from('security_education_data')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        const maxId = data.id;
        if (maxId > lastId) {
          setLastId(maxId);
          localStorage.setItem(ID_STORAGE_KEY, maxId.toString());
          console.log(`🔄 ID 동기화: 최대 ID를 ${maxId}로 업데이트`);
        }
      }
    } catch (error) {
      console.error('ID 동기화 실패:', error);
    }
  }, [lastId]);

  // 컴포넌트 마운트 시 동기화
  useEffect(() => {
    syncMaxId();
  }, []);

  return { generateNextId, syncMaxId };
};

export default useIdGenerator;
