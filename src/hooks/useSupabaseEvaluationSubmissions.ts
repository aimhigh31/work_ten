import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface EvaluationSubmission {
  id: number;
  evaluation_id: string;
  target_person: string;
  department: string;
  position: string;
  evaluator: string;
  evaluator_department?: string;
  evaluator_position?: string;
  submitted_at: string;
  total_recommended_score?: number;
  total_actual_score?: number;
  total_difference_score?: number;
  total_score?: number;
  item_count?: number;
  created_at: string;
}

export interface EvaluationSubmissionItem {
  id: number;
  submission_id: number;
  item_id?: number;
  item_name?: string;
  checked_behaviors?: boolean[];
  recommended_score?: number;
  actual_score?: number;
  difference_score?: number;
  difference_reason?: string;
  // 새로운 체크리스트 구조
  item_no?: number;
  major_category?: string;
  sub_category?: string;
  title?: string;
  evaluation?: string;
  score?: number;
  description?: string;
  created_at: string;
}

export interface EvaluationSubmissionWithItems extends EvaluationSubmission {
  items: EvaluationSubmissionItem[];
}

export interface EvaluationData {
  id?: number;
  evaluation_title: string;
  details?: string;
  evaluation_type?: string;
  management_category?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  team?: string;
  manager?: string;
  evaluation_code?: string;
  checklist_id?: number;
  checklist_evaluation_type?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export const useSupabaseEvaluationSubmissions = () => {
  const [submissions, setSubmissions] = useState<EvaluationSubmission[]>([]);
  const [evaluationDataList, setEvaluationDataList] = useState<EvaluationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // 제출된 평가 목록 조회
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('hr_evaluation_submissions')
        .select('*')
        .order('submitted_at', { ascending: false});

      if (fetchError) {
        throw fetchError;
      }

      // 각 submission에 대해 item_count 조회
      if (data && data.length > 0) {
        const submissionsWithCount = await Promise.all(
          data.map(async (submission) => {
            const { count } = await supabase
              .from('hr_evaluation_submission_items')
              .select('*', { count: 'exact', head: true })
              .eq('submission_id', submission.id);

            return {
              ...submission,
              item_count: count || 0
            };
          })
        );
        setSubmissions(submissionsWithCount);
      } else {
        setSubmissions([]);
      }
    } catch (err: any) {
      console.error('제출된 평가 조회 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 특정 제출 평가의 상세 항목 조회
  const fetchSubmissionWithItems = async (submissionId: number): Promise<EvaluationSubmissionWithItems | null> => {
    try {
      const { data: submission, error: submissionError } = await supabase
        .from('hr_evaluation_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (submissionError) {
        throw submissionError;
      }

      const { data: items, error: itemsError } = await supabase
        .from('hr_evaluation_submission_items')
        .select('*')
        .eq('submission_id', submissionId)
        .order('item_id', { ascending: true });

      if (itemsError) {
        throw itemsError;
      }

      return {
        ...submission,
        items: items || []
      };
    } catch (err: any) {
      console.error('평가 상세 조회 오류:', err);
      setError(err.message);
      return null;
    }
  };

  // 제출된 평가 삭제
  const deleteSubmission = async (submissionId: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('hr_evaluation_submissions')
        .delete()
        .eq('id', submissionId);

      if (deleteError) {
        throw deleteError;
      }

      // 목록에서 제거
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      return true;
    } catch (err: any) {
      console.error('평가 삭제 오류:', err);
      setError(err.message);
      return false;
    }
  };

  // ====== hr_evaluation_data CRUD 함수들 ======

  // 평가 데이터 목록 조회
  const fetchEvaluationDataList = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('hr_evaluation_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setEvaluationDataList(data || []);
      return data || [];
    } catch (err: any) {
      console.error('평가 데이터 조회 오류:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 특정 평가 데이터 조회
  const fetchEvaluationData = async (id: number): Promise<EvaluationData | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('hr_evaluation_data')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return data;
    } catch (err: any) {
      console.error('평가 데이터 조회 오류:', err);
      setError(err.message);
      return null;
    }
  };

  // 평가 데이터 생성
  const createEvaluationData = async (data: Omit<EvaluationData, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('📝 평가 데이터 생성 시도:', data);

      const { data: newData, error: insertError } = await supabase
        .from('hr_evaluation_data')
        .insert([data])
        .select()
        .single();

      console.log('📝 Supabase 응답:', { newData, insertError });

      if (insertError) {
        console.error('❌ Supabase insertError:', insertError);
        console.error('❌ insertError 상세:', JSON.stringify(insertError, null, 2));
        throw insertError;
      }

      // 목록에 추가
      setEvaluationDataList((prev) => [newData, ...prev]);
      console.log('✅ 평가 데이터 생성 성공:', newData);
      return newData;
    } catch (err: any) {
      console.error('❌ 평가 데이터 생성 오류 (catch):', err);
      console.error('❌ 오류 타입:', typeof err);
      console.error('❌ 오류 메시지:', err?.message);
      console.error('❌ 오류 전체:', JSON.stringify(err, null, 2));
      setError(err?.message || '알 수 없는 오류');
      return null;
    }
  };

  // 평가 데이터 수정
  const updateEvaluationData = async (id: number, data: Partial<EvaluationData>) => {
    try {
      console.log('📝 평가 데이터 수정 시도:', { id, data });

      const { data: updatedData, error: updateError } = await supabase
        .from('hr_evaluation_data')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      console.log('📝 Supabase 응답:', { updatedData, updateError });

      if (updateError) {
        console.error('❌ Supabase updateError:', updateError);
        console.error('❌ updateError 상세:', JSON.stringify(updateError, null, 2));
        throw updateError;
      }

      // 목록 업데이트
      setEvaluationDataList((prev) => prev.map((item) => (item.id === id ? updatedData : item)));
      console.log('✅ 평가 데이터 수정 성공:', updatedData);
      return updatedData;
    } catch (err: any) {
      console.error('❌ 평가 데이터 수정 오류 (catch):', err);
      console.error('❌ 오류 타입:', typeof err);
      console.error('❌ 오류 메시지:', err?.message);
      console.error('❌ 오류 전체:', JSON.stringify(err, null, 2));
      setError(err?.message || '알 수 없는 오류');
      return null;
    }
  };

  // 평가 데이터 삭제
  const deleteEvaluationData = async (id: number) => {
    try {
      const { error: deleteError } = await supabase.from('hr_evaluation_data').delete().eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // 목록에서 제거
      setEvaluationDataList((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (err: any) {
      console.error('평가 데이터 삭제 오류:', err);
      setError(err.message);
      return false;
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchEvaluationDataList(); // hr_evaluation_data 초기 로드

    // 실시간 구독 설정
    const subscription = supabase
      .channel('evaluation_submissions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hr_evaluation_submissions'
        },
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    // hr_evaluation_data 실시간 구독
    const evaluationDataSubscription = supabase
      .channel('evaluation_data_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hr_evaluation_data'
        },
        () => {
          fetchEvaluationDataList();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      evaluationDataSubscription.unsubscribe();
    };
  }, []);

  return {
    submissions,
    evaluationDataList,
    loading,
    error,
    fetchSubmissions,
    fetchSubmissionWithItems,
    deleteSubmission,
    // hr_evaluation_data 관련
    fetchEvaluationDataList,
    fetchEvaluationData,
    createEvaluationData,
    updateEvaluationData,
    deleteEvaluationData
  };
};
