import { useState } from 'react';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { FeedbackData, CreateFeedbackInput, UpdateFeedbackInput } from 'types/feedback';

// Phase 2-1: SWR fetcher 함수
// 🚀 최적화: 전체 데이터 조회 (클라이언트 측에서 페이지네이션)
const feedbackFetcher = async (key: string) => {
  console.time('⏱️ Feedback Fetch');
  const [, page, recordId] = key.split('|');
  const supabase = createClient();

  // 디버깅: 쿼리 파라미터 확인
  console.log('🔍 feedbackFetcher 쿼리 파라미터:', {
    'SWR key': key,
    'page': page,
    'recordId': recordId,
    'recordId 타입': typeof recordId,
    'recordId가 undefined 문자열인가?': recordId === 'undefined'
  });

  let query = supabase
    .from('common_feedback_data')
    .select('*', { count: 'exact' })  // 전체 개수도 함께 조회
    .eq('page', page)
    .order('created_at', { ascending: false });

  if (recordId && recordId !== 'undefined') {
    console.log('✅ record_id 필터 적용:', recordId);
    query = query.eq('record_id', recordId);
  } else {
    console.warn('⚠️ record_id 필터 미적용:', { recordId });
  }

  const { data, error, count } = await query;

  if (error) {
    console.timeEnd('⏱️ Feedback Fetch');
    throw error;
  }

  console.timeEnd('⏱️ Feedback Fetch');
  console.log(`📊 피드백 ${count || 0}개 로드 완료`);

  return data || [];
};

export function useSupabaseFeedback(page: string, recordId?: string | number) {
  // recordId를 명시적으로 string으로 변환 (DB의 record_id는 TEXT 타입)
  const normalizedRecordId = recordId != null ? String(recordId) : undefined;

  // 디버깅: recordId 변환 확인
  console.log('🔍 useSupabaseFeedback 초기화:', {
    '원본 recordId': recordId,
    '원본 타입': typeof recordId,
    '변환된 normalizedRecordId': normalizedRecordId,
    '변환된 타입': typeof normalizedRecordId,
    'page': page
  });

  // 개별 작업 loading 상태 (Phase 1-2: Loading State 개선)
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();

  // Phase 2-1: SWR로 캐싱 적용
  // Phase 2-2: recordId가 없거나 유효하지 않으면 데이터를 가져오지 않음 (쿼리 최적화, 성능 개선)
  // 조건: normalizedRecordId가 존재하고, 'undefined' 문자열이 아니고, 빈 문자열이 아닌 경우에만 fetch
  const isValidRecordId = normalizedRecordId &&
                          normalizedRecordId !== 'undefined' &&
                          normalizedRecordId.trim() !== '';
  const swrKey = isValidRecordId ? `feedbacks|${page}|${normalizedRecordId}` : null;
  console.log('🔍 SWR Key:', swrKey, '| 유효한 recordId:', isValidRecordId);
  const { data: feedbacks = [], error, mutate, isLoading, isValidating } = useSWR<FeedbackData[]>(
    swrKey,
    feedbackFetcher,
    {
      // 초기 마운트 시 자동으로 데이터 가져오기
      revalidateOnMount: true, // ⚠️ 중요: 마운트 시 자동 fetch

      revalidateOnFocus: false, // 포커스 시 재검증 비활성화
      revalidateOnReconnect: false, // 재연결 시 재검증 비활성화
      dedupingInterval: 60000, // 60초 내 중복 요청 제거 (성능 최적화)

      // Phase 2-2: 초기 로딩 시에만 데이터 가져오기 (자동 재검증 최소화)
      revalidateIfStale: false, // stale 데이터여도 재검증 안 함
      shouldRetryOnError: false, // 에러 시 재시도 안 함

      // 🚀 Option 3: Prefetch 최적화
      keepPreviousData: true, // 이전 데이터 유지하면서 새 데이터 로드
    }
  );

  // 피드백 조회 (SWR mutate로 수동 갱신)
  const fetchFeedbacks = async () => {
    await mutate();
  };

  // 피드백 추가 (Optimistic UI + SWR)
  const addFeedback = async (input: CreateFeedbackInput) => {
    // Phase 1-2: Loading State 시작
    setIsAdding(true);

    // 성능 측정 시작
    const startTime = performance.now();
    console.time('⏱️ addFeedback Total');

    // 🔍 디버깅: input 데이터 확인
    console.log('🔍 addFeedback input:', JSON.stringify(input, null, 2));

    // 1. Optimistic Update: 즉시 UI에 추가 (임시 ID 사용)
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticFeedback: FeedbackData = {
      id: tempId,
      page: input.page,
      record_id: input.record_id,
      action_type: input.action_type,
      description: input.description,
      user_id: input.user_id,
      user_name: input.user_name,
      team: input.team,
      created_at: new Date().toISOString(),
      metadata: input.metadata,
      user_department: input.user_department,
      user_position: input.user_position,
      user_profile_image: input.user_profile_image
    };

    console.time('⏱️ Optimistic UI Update');
    // Phase 2-1: SWR mutate로 optimistic update
    await mutate([optimisticFeedback, ...feedbacks], false);
    console.timeEnd('⏱️ Optimistic UI Update');

    try {
      // 2. DB 저장 (백그라운드)
      console.time('⏱️ DB Insert');
      console.log('🔍 DB Insert 시작, input:', input);
      console.log('🔍 Supabase client 상태:', { hasClient: !!supabase });

      const { data, error: insertError } = await supabase
        .from('common_feedback_data')
        .insert([input])
        .select()
        .single();

      console.timeEnd('⏱️ DB Insert');
      console.log('🔍 DB Insert 결과:', { data, error: insertError });

      if (insertError) {
        console.error('❌ DB Insert Error - Full Object:', insertError);
        console.error('❌ DB Insert Error - Stringified:', JSON.stringify(insertError, null, 2));
        console.error('❌ DB Insert Error - Keys:', Object.keys(insertError));
        console.error('❌ DB Insert Error - Message:', insertError?.message);
        console.error('❌ DB Insert Error - Details:', insertError?.details);
        console.error('❌ DB Insert Error - Hint:', insertError?.hint);
        console.error('❌ DB Insert Error - Code:', insertError?.code);
        throw new Error(`Supabase Insert Failed: ${JSON.stringify(insertError)}`);
      }

      // 3. 성공: 임시 ID를 실제 ID로 교체 (SWR 캐시 업데이트)
      console.time('⏱️ Replace Temp ID');
      if (data) {
        // 현재 캐시에서 tempId를 data로 교체
        const currentCache = await mutate();
        await mutate(
          (currentCache || feedbacks).map(fb => fb.id === tempId ? data : fb),
          false
        );
      }
      console.timeEnd('⏱️ Replace Temp ID');

      const endTime = performance.now();
      console.log(`✅ addFeedback 완료: ${(endTime - startTime).toFixed(2)}ms`);
      console.timeEnd('⏱️ addFeedback Total');

      return { success: true, data };
    } catch (err: any) {
      // 4. 실패: 롤백 (임시 항목 제거)
      console.error('❌ 피드백 추가 실패:', err);
      console.time('⏱️ Rollback');
      await mutate(feedbacks.filter(fb => fb.id !== tempId), false);
      console.timeEnd('⏱️ Rollback');

      const endTime = performance.now();
      console.log(`❌ addFeedback 실패: ${(endTime - startTime).toFixed(2)}ms`);
      console.timeEnd('⏱️ addFeedback Total');

      return { success: false, error: err.message };
    } finally {
      // Phase 1-2: Loading State 종료
      setIsAdding(false);
    }
  };

  // 피드백 수정 (Optimistic UI + SWR)
  const updateFeedback = async (id: string, updates: UpdateFeedbackInput) => {
    // Phase 1-2: Loading State 시작
    setIsUpdating(true);

    const startTime = performance.now();
    console.time('⏱️ updateFeedback Total');

    // 1. 이전 데이터 백업 (롤백용) - 타입 안전한 비교
    const previousFeedback = feedbacks.find(fb => String(fb.id) === String(id));
    if (!previousFeedback) {
      console.error('❌ 수정할 피드백을 찾을 수 없습니다:', id);
      setIsUpdating(false);
      return { success: false, error: '수정할 피드백을 찾을 수 없습니다.' };
    }

    // 2. Optimistic Update: 즉시 UI에 반영
    console.time('⏱️ Optimistic UI Update');
    // Phase 2-1: SWR mutate로 optimistic update
    await mutate(
      feedbacks.map(fb => String(fb.id) === String(id) ? { ...fb, ...updates } : fb),
      false
    );
    console.timeEnd('⏱️ Optimistic UI Update');

    try {
      // 3. DB 업데이트 (백그라운드)
      console.time('⏱️ DB Update');
      const { data, error: updateError } = await supabase
        .from('common_feedback_data')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      console.timeEnd('⏱️ DB Update');

      if (updateError) {
        throw updateError;
      }

      // 4. 성공: 서버 데이터로 최종 업데이트 (SWR 캐시)
      if (data) {
        await mutate(
          feedbacks.map(fb => String(fb.id) === String(id) ? data : fb),
          false
        );
      }

      const endTime = performance.now();
      console.log(`✅ updateFeedback 완료: ${(endTime - startTime).toFixed(2)}ms`);
      console.timeEnd('⏱️ updateFeedback Total');

      return { success: true, data };
    } catch (err: any) {
      // 5. 실패: 롤백 (이전 데이터로 복원)
      console.error('❌ 피드백 수정 실패:', err);
      console.time('⏱️ Rollback');
      await mutate(
        feedbacks.map(fb => String(fb.id) === String(id) ? previousFeedback : fb),
        false
      );
      console.timeEnd('⏱️ Rollback');

      const endTime = performance.now();
      console.log(`❌ updateFeedback 실패: ${(endTime - startTime).toFixed(2)}ms`);
      console.timeEnd('⏱️ updateFeedback Total');

      return { success: false, error: err.message };
    } finally {
      // Phase 1-2: Loading State 종료
      setIsUpdating(false);
    }
  };

  // 피드백 삭제 (Optimistic UI + SWR)
  const deleteFeedback = async (id: string) => {
    // Phase 1-2: Loading State 시작
    setIsDeleting(true);

    const startTime = performance.now();
    console.time('⏱️ deleteFeedback Total');

    // 1. 이전 데이터 백업 (롤백용) - 타입 안전한 비교
    const previousFeedback = feedbacks.find(fb => String(fb.id) === String(id));
    if (!previousFeedback) {
      console.error('❌ 삭제할 피드백을 찾을 수 없습니다:', id);
      console.error('🔍 현재 feedbacks:', feedbacks.map(fb => ({ id: fb.id, type: typeof fb.id })));
      setIsDeleting(false);
      return { success: false, error: '삭제할 피드백을 찾을 수 없습니다.' };
    }

    // 2. Optimistic Update: 즉시 UI에서 제거
    console.time('⏱️ Optimistic UI Update');
    // Phase 2-1: SWR mutate로 optimistic update
    await mutate(
      feedbacks.filter(fb => String(fb.id) !== String(id)),
      false
    );
    console.timeEnd('⏱️ Optimistic UI Update');

    try {
      // 3. DB 삭제 (백그라운드)
      console.time('⏱️ DB Delete');
      const { error: deleteError } = await supabase
        .from('common_feedback_data')
        .delete()
        .eq('id', id);
      console.timeEnd('⏱️ DB Delete');

      if (deleteError) {
        throw deleteError;
      }

      const endTime = performance.now();
      console.log(`✅ deleteFeedback 완료: ${(endTime - startTime).toFixed(2)}ms`);
      console.timeEnd('⏱️ deleteFeedback Total');

      return { success: true };
    } catch (err: any) {
      // 4. 실패: 롤백 (삭제한 항목 복원)
      console.error('❌ 피드백 삭제 실패:', err);
      console.time('⏱️ Rollback');
      await mutate(
        [previousFeedback, ...feedbacks].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        false
      );
      console.timeEnd('⏱️ Rollback');

      const endTime = performance.now();
      console.log(`❌ deleteFeedback 실패: ${(endTime - startTime).toFixed(2)}ms`);
      console.timeEnd('⏱️ deleteFeedback Total');

      return { success: false, error: err.message };
    } finally {
      // Phase 1-2: Loading State 종료
      setIsDeleting(false);
    }
  };

  return {
    feedbacks,
    // 🚀 최적화: fallbackData가 있어서 isLoading은 항상 false, isValidating으로 실제 로딩 체크
    loading: isValidating,
    error: error?.message || null,
    fetchFeedbacks,
    addFeedback,
    updateFeedback,
    deleteFeedback,
    // Phase 1-2: Loading State 반환
    isAdding,
    isUpdating,
    isDeleting
  };
}
