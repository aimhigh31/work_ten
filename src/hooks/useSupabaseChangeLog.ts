import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChangeLogData, CreateChangeLogInput } from 'types/changelog';

/**
 * 변경로그 관리 Hook
 * @param page 페이지 식별자 (예: 'security_education')
 * @param recordId 레코드 ID (선택적, 없으면 전체 페이지 로그 조회)
 */
export function useSupabaseChangeLog(page: string, recordId?: string | number) {
  // recordId를 명시적으로 string으로 변환
  const normalizedRecordId = recordId != null ? String(recordId) : undefined;

  console.log('🔍 useSupabaseChangeLog 초기화:', {
    '원본 recordId': recordId,
    '원본 타입': typeof recordId,
    '변환된 normalizedRecordId': normalizedRecordId,
    '변환된 타입': typeof normalizedRecordId,
    'page': page
  });

  // 상태 관리
  const [logs, setLogs] = useState<ChangeLogData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 변경로그 조회 함수
  const fetchChangeLogs = useCallback(async () => {
    console.log('🚀 fetchChangeLogs 시작!', { page, normalizedRecordId });
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      console.log('✅ Supabase 클라이언트 생성 완료');

      console.time('⏱️ ChangeLog Fetch');

      console.log('🔍 쿼리 실행 전:', {
        page,
        normalizedRecordId,
        테이블명: 'common_log_data'
      });

      let query = supabase
        .from('common_log_data')
        .select('id, page, record_id, action_type, title, description, before_value, after_value, changed_field, user_name, team, user_department, created_at')
        .eq('page', page)
        .order('created_at', { ascending: false })
        .limit(100); // 최근 100개만 가져오기

      // recordId가 제공된 경우 (특정 레코드의 변경 이력)
      if (normalizedRecordId && normalizedRecordId !== 'undefined') {
        console.log('✅ record_id 필터 적용:', normalizedRecordId);
        query = query.eq('record_id', normalizedRecordId);
      } else {
        console.log('ℹ️ record_id 필터 미적용: 전체 페이지 변경 이력 조회 (최근 100개)');
      }

      console.log('🚀 쿼리 실행 중...');
      const { data, error: fetchError } = await query;
      console.log('✅ 쿼리 실행 완료');

      console.timeEnd('⏱️ ChangeLog Fetch');

      console.log('🔍 쿼리 결과:', {
        '데이터 개수': data?.length || 0,
        '에러 발생?': !!fetchError,
        '에러 타입': typeof fetchError,
        '에러 생성자': fetchError?.constructor?.name,
        'data 타입': typeof data
      });

      if (fetchError) {
        // 타임아웃 에러인 경우 경고만 출력하고 무시
        if (fetchError.code === '57014' || !fetchError.message) {
          console.warn('⚠️ 변경로그 조회 타임아웃 - 빈 배열 반환');
          console.warn('에러 코드:', fetchError.code);
          setError(null);
          setLogs([]);
        } else {
          // 다른 에러인 경우에만 에러 로그 출력
          console.error('❌ 변경로그 조회 실패 - 전체 에러:', fetchError);
          console.error('❌ 변경로그 조회 실패 - JSON:', JSON.stringify(fetchError, null, 2));

          // 에러 객체의 모든 속성 순회
          console.error('❌ 변경로그 조회 실패 - 모든 속성:');
          for (const key in fetchError) {
            console.error(`  ${key}:`, (fetchError as any)[key]);
          }

          // Object.keys로도 확인
          console.error('❌ Object.keys:', Object.keys(fetchError));
          console.error('❌ Object.getOwnPropertyNames:', Object.getOwnPropertyNames(fetchError));

          console.error('❌ 변경로그 조회 실패 - 상세:', {
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint,
            code: fetchError.code
          });

          setError(fetchError.message || '변경로그 조회 중 오류가 발생했습니다.');
          setLogs([]);
        }
      } else {
        console.log(`📊 변경로그 ${data?.length || 0}개 로드 완료`, data);
        setLogs(data || []);
      }
    } catch (err: any) {
      console.error('❌ 변경로그 조회 예외:', err);
      setError(err.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, normalizedRecordId]);

  // 초기 로드 및 refreshKey 변경 시 데이터 가져오기
  useEffect(() => {
    console.log('🔄 useEffect 실행 - 변경로그 데이터 가져오기');
    fetchChangeLogs();
  }, [fetchChangeLogs, refreshKey]);

  // 변경로그 추가
  const addChangeLog = async (input: CreateChangeLogInput) => {
    setIsAdding(true);

    const startTime = performance.now();
    console.time('⏱️ addChangeLog Total');

    console.log('🔍 addChangeLog input:', JSON.stringify(input, null, 2));

    try {
      const supabase = createClient();

      // DB 저장
      console.time('⏱️ DB Insert');
      console.log('🔍 DB Insert 시작, input:', input);

      const { data, error: insertError } = await supabase
        .from('common_log_data')
        .insert([input])
        .select()
        .single();

      console.timeEnd('⏱️ DB Insert');
      console.log('🔍 DB Insert 결과:', { data, error: insertError });

      if (insertError) {
        console.error('❌ DB Insert Error - Full Object:', insertError);
        console.error('❌ DB Insert Error - Stringified:', JSON.stringify(insertError, null, 2));
        console.error('❌ DB Insert Error - Message:', insertError?.message);
        console.error('❌ DB Insert Error - Details:', insertError?.details);
        console.error('❌ DB Insert Error - Hint:', insertError?.hint);
        console.error('❌ DB Insert Error - Code:', insertError?.code);
        throw new Error(`Supabase Insert Failed: ${JSON.stringify(insertError)}`);
      }

      // 로컬 상태 갱신 및 자동 새로고침
      if (data) {
        setLogs([data, ...logs]);
        // 새로고침 트리거
        setRefreshKey(prev => prev + 1);
      }

      const endTime = performance.now();
      console.log(`✅ addChangeLog 완료: ${(endTime - startTime).toFixed(2)}ms`);
      console.timeEnd('⏱️ addChangeLog Total');

      return { success: true, data };
    } catch (err: any) {
      console.error('❌ 변경로그 추가 실패:', err);

      const endTime = performance.now();
      console.log(`❌ addChangeLog 실패: ${(endTime - startTime).toFixed(2)}ms`);
      console.timeEnd('⏱️ addChangeLog Total');

      return { success: false, error: err.message };
    } finally {
      setIsAdding(false);
    }
  };

  return {
    logs,
    loading,
    error,
    fetchChangeLogs,
    addChangeLog,
    isAdding
  };
}
