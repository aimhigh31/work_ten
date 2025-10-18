import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 프론트엔드 MaintenanceHistory 인터페이스 (HardwareEditDialog와 동일)
interface MaintenanceHistory {
  id: string;
  registrationDate: string;
  type: 'purchase' | 'repair' | 'other';
  content: string;
  vendor: string;
  amount: number;
  registrant: string;
  status: string;
  startDate: string;
  completionDate: string;
}

// 하드웨어 이력 인터페이스
export interface HardwareHistory {
  id: number;
  hardware_id: number;
  registration_date: string;
  type: 'purchase' | 'repair' | 'other';
  content: string;
  vendor: string;
  amount: number;
  registrant: string;
  status: string;
  start_date: string;
  completion_date?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
}

// 이력 생성 요청 타입
export interface CreateHardwareHistoryRequest {
  hardware_id: number;
  registration_date?: string;
  type: 'purchase' | 'repair' | 'other';
  content: string;
  vendor: string;
  amount: number;
  registrant: string;
  status?: string;
  start_date: string;
  completion_date?: string | null;
}

// 이력 수정 요청 타입
export interface UpdateHardwareHistoryRequest {
  registration_date?: string;
  type?: 'purchase' | 'repair' | 'other';
  content?: string;
  vendor?: string;
  amount?: number;
  registrant?: string;
  status?: string;
  start_date?: string;
  completion_date?: string | null;
}

export const useSupabaseHardwareHistory = () => {
  const [histories, setHistories] = useState<HardwareHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supabase 연결 확인
  const testConnection = async () => {
    try {
      console.log('🔍 Supabase 연결 테스트 시작...');
      console.log('📍 Supabase URL:', supabaseUrl);
      console.log('🔑 Supabase Key (첫 20자):', supabaseKey?.substring(0, 20) + '...');

      const { count, error } = await supabase
        .from('it_hardware_history')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log('❌ Supabase 연결 실패:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('✅ Supabase 연결 성공');
      return true;
    } catch (err) {
      console.log('❌ Supabase 연결 테스트 오류:', JSON.stringify(err, null, 2));
      return false;
    }
  };

  // 특정 하드웨어의 이력 조회
  const fetchHistories = useCallback(async (hardwareId: number) => {
    console.log('🔍 하드웨어 이력 조회 시작:', hardwareId);

    // 하드웨어 ID 유효성 검사
    if (!hardwareId || isNaN(hardwareId) || hardwareId <= 0) {
      console.log('⚠️ 유효하지 않은 하드웨어 ID:', hardwareId);
      setError('유효하지 않은 하드웨어 ID입니다.');
      setHistories([]);
      return;
    }

    // 1. 동적 캐시 키 생성
    const cacheKey = createCacheKey('hardware_history', `hw_${hardwareId}`);
    const cachedData = loadFromCache<HardwareHistory[]>(cacheKey, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [HardwareHistory] 캐시 데이터 반환');
      setHistories(cachedData);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Supabase에서 특정 하드웨어의 이력만 조회
      const { data, error } = await supabase
        .from('it_hardware_history')
        .select('*')
        .eq('hardware_id', hardwareId)
        .eq('is_active', true)
        .order('registration_date', { ascending: false });

      if (error) {
        console.log('❌ Supabase 조회 실패:', JSON.stringify(error, null, 2));
        console.log('❌ 에러 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setError(`이력을 불러오는데 실패했습니다: ${error.message}`);
        setHistories([]);
        return;
      }

      console.log('✅ Supabase 조회 성공:', data?.length || 0, '개');
      setHistories(data || []);

      // 2. 캐시에 저장
      saveToCache(cacheKey, data || []);

    } catch (err: any) {
      console.log('❌ fetchHistories 오류:', JSON.stringify(err, null, 2));
      setError('이력을 불러오는데 실패했습니다.');
      setHistories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 이력 생성 (실제 DB 연동)
  const createHistory = async (historyData: CreateHardwareHistoryRequest): Promise<{ success: boolean; data?: any; error?: string }> => {
    console.log('🆕 이력 생성 시작:', historyData);

    // 데이터 유효성 검사
    if (!historyData.hardware_id) {
      const errorMsg = 'hardware_id가 필요합니다.';
      console.log('❌ 유효성 검사 실패:', errorMsg);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!historyData.content) {
      const errorMsg = '내용이 필요합니다.';
      console.log('❌ 유효성 검사 실패:', errorMsg);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    const newHistoryData = {
      hardware_id: historyData.hardware_id,
      registration_date: historyData.registration_date || new Date().toISOString().split('T')[0],
      type: historyData.type || 'purchase',
      content: historyData.content,
      vendor: historyData.vendor || '',
      amount: historyData.amount || 0,
      registrant: historyData.registrant || '시스템',
      status: historyData.status || 'completed',
      start_date: historyData.start_date,
      completion_date: historyData.completion_date || null,
      created_by: 'system',
      updated_by: 'system',
      is_active: true
    };

    console.log('📝 Supabase에 삽입할 데이터:', newHistoryData);

    const { data, error } = await supabase
      .from('it_hardware_history')
      .insert([newHistoryData])
      .select()
      .single();

    console.log('📊 Supabase 응답 - data:', data);
    console.log('📊 Supabase 응답 - error:', error);

    if (error) {
      console.log('🚨 ERROR DETECTED 🚨');
      console.log('❌ 이력 생성 실패 - 전체 에러 JSON:', JSON.stringify(error, null, 2));
      console.log('❌ 에러 message 직접 접근:', error.message);
      console.log('❌ 에러 details 직접 접근:', error.details);
      console.log('❌ 에러 hint 직접 접근:', error.hint);
      console.log('❌ 에러 code 직접 접근:', error.code);

      const errorMessage = error.message || error.details || error.hint || `오류 코드: ${error.code}` || '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    if (!data) {
      const errorMsg = '데이터가 생성되지 않았습니다';
      console.log('❌', errorMsg);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log('✅ 새 이력 생성 성공:', data);

    // 목록을 다시 조회하여 최신 상태로 업데이트
    await fetchHistories(historyData.hardware_id);
    setError(null);

    return { success: true, data };
  };

  // 이력 수정 (실제 DB 연동)
  const updateHistory = async (id: number, historyData: UpdateHardwareHistoryRequest) => {
    console.log('🔄 이력 수정 시작:', { id, historyData });

    try {
      const updateData = {
        ...historyData,
        updated_at: new Date().toISOString(),
        updated_by: 'system'
      };

      const { data, error } = await supabase
        .from('it_hardware_history')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.log('❌ 이력 수정 실패:', JSON.stringify(error, null, 2));
        throw new Error('이력 수정에 실패했습니다.');
      }

      console.log('✅ 이력 수정 성공:', data);

      // 로컬 상태 업데이트
      setHistories(prev =>
        prev.map(history =>
          history.id === id ? { ...history, ...data } : history
        )
      );
      setError(null);

      return data;

    } catch (err: any) {
      console.log('❌ updateHistory 오류:', JSON.stringify(err, null, 2));
      throw err;
    }
  };

  // 이력 삭제 (실제 DB 연동)
  const deleteHistory = async (id: number) => {
    console.log('🗑️ 이력 삭제 시작:', id);

    try {
      const { error } = await supabase
        .from('it_hardware_history')
        .update({ is_active: false, updated_by: 'system' })
        .eq('id', id);

      if (error) {
        console.log('❌ 이력 삭제 실패:', JSON.stringify(error, null, 2));
        throw new Error('이력 삭제에 실패했습니다.');
      }

      console.log('✅ 이력 삭제 성공');

      // 로컬 상태에서 제거
      setHistories(prev => prev.filter(history => history.id !== id));
      setError(null);

      return { id };

    } catch (err: any) {
      console.log('❌ deleteHistory 오류:', JSON.stringify(err, null, 2));
      throw err;
    }
  };

  // 이력 통계
  const getHistoryStats = async (hardwareId: number) => {
    try {
      const { data, error } = await supabase
        .from('it_hardware_history')
        .select('type, amount')
        .eq('hardware_id', hardwareId)
        .eq('is_active', true);

      if (error) {
        console.log('❌ 통계 조회 실패:', JSON.stringify(error, null, 2));
        return { total: 0, purchase: 0, repair: 0, other: 0, totalAmount: 0 };
      }

      const total = data.length;
      const purchase = data.filter(item => item.type === 'purchase').length;
      const repair = data.filter(item => item.type === 'repair').length;
      const other = data.filter(item => item.type === 'other').length;
      const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0);

      return { total, purchase, repair, other, totalAmount };

    } catch (err: any) {
      console.log('❌ getHistoryStats 오류:', JSON.stringify(err, null, 2));
      return { total: 0, purchase: 0, repair: 0, other: 0, totalAmount: 0 };
    }
  };

  // 하드웨어 구매/수리이력 조회 (데이터를 직접 반환)
  const getMaintenanceHistories = async (hardwareId: number): Promise<HardwareHistory[]> => {
    console.log('🔍 getMaintenanceHistories 호출:', hardwareId);

    try {
      setLoading(true);
      setError(null);

      // Supabase에서 특정 하드웨어의 이력만 조회
      const { data, error } = await supabase
        .from('it_hardware_history')
        .select('*')
        .eq('hardware_id', hardwareId)
        .eq('is_active', true)
        .order('registration_date', { ascending: false });

      if (error) {
        console.error('❌ getMaintenanceHistories 조회 실패:', error);
        setError(`구매/수리이력을 불러오는데 실패했습니다: ${error.message}`);
        return [];
      }

      console.log('✅ getMaintenanceHistories 조회 성공:', data?.length || 0, '개');
      console.log('📋 조회된 데이터:', data);
      return data || [];

    } catch (err: any) {
      console.error('❌ getMaintenanceHistories 오류:', err);
      setError('구매/수리이력을 불러오는데 실패했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // HardwareHistory를 MaintenanceHistory(프론트엔드 형식)로 변환
  const convertToMaintenanceHistory = (item: HardwareHistory): MaintenanceHistory => {
    return {
      id: item.id.toString(),
      registrationDate: item.registration_date || '',
      type: item.type,
      content: item.content || '',
      vendor: item.vendor || '',
      amount: item.amount || 0,
      registrant: item.registrant || '',
      status: item.status || '',
      startDate: item.start_date || '',
      completionDate: item.completion_date || ''
    };
  };

  // 구매/수리이력 일괄 저장 함수
  const saveMaintenanceHistories = async (hardwareId: number, histories: MaintenanceHistory[]): Promise<boolean> => {
    console.log('💾 하드웨어 구매/수리이력 일괄 저장 시작:', { hardwareId, count: histories.length });

    try {
      // 기존 데이터 삭제 (소프트 삭제)
      const { error: deleteError } = await supabase
        .from('it_hardware_history')
        .update({
          is_active: false,
          updated_by: 'system',
          updated_at: new Date().toISOString()
        })
        .eq('hardware_id', hardwareId);

      if (deleteError) {
        console.error('❌ 기존 데이터 비활성화 실패:', deleteError);
        return false;
      }

      console.log('✅ 기존 데이터 비활성화 완료');

      // 새 데이터 삽입
      if (histories.length > 0) {
        console.log('📝 원본 구매/수리이력 데이터:', JSON.stringify(histories, null, 2));

        // 데이터 변환 및 검증
        const insertData = histories.map((history, index) => {
          console.log(`📋 데이터 ${index + 1} 변환:`, history);

          // 날짜 형식 변환
          const formatDate = (dateStr: string | null | undefined): string | null => {
            if (!dateStr || dateStr.trim() === '') return null;

            // YYYY-MM-DD 형식 검증
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(dateStr)) {
              return dateStr;
            }

            // Date 객체로 변환 시도
            try {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
              }
            } catch (e) {
              console.warn(`⚠️ 잘못된 날짜 형식: ${dateStr}`, e);
            }

            return null;
          };

          const convertedData = {
            hardware_id: hardwareId,
            registration_date: formatDate(history.registrationDate) || new Date().toISOString().split('T')[0],
            type: history.type || 'other',
            content: history.content?.trim() || '',
            vendor: history.vendor?.trim() || '',
            amount: parseFloat(history.amount?.toString()) || 0,
            registrant: history.registrant?.trim() || '',
            status: history.status?.trim() || '진행중',
            start_date: formatDate(history.startDate) || new Date().toISOString().split('T')[0],
            completion_date: (history.completionDate?.trim() && history.completionDate.trim() !== '') ? formatDate(history.completionDate) : null,
            created_by: 'system',
            updated_by: 'system',
            is_active: true
          };

          console.log(`✅ 데이터 ${index + 1} 변환 완료:`, convertedData);
          return convertedData;
        });

        console.log('📝 최종 삽입할 데이터:', JSON.stringify(insertData, null, 2));

        const { data, error: insertError } = await supabase
          .from('it_hardware_history')
          .insert(insertData)
          .select('id, type, content');

        if (insertError) {
          console.error('❌ 구매/수리이력 삽입 실패');
          console.error('📍 에러 객체:', insertError);
          console.error('📍 에러 메시지:', insertError?.message);
          console.error('📍 에러 코드:', insertError?.code);
          console.error('📍 에러 상세:', JSON.stringify(insertError, null, 2));
          console.error('📍 삽입하려던 데이터:', JSON.stringify(insertData, null, 2));

          // 테이블이 없는 경우
          if (insertError.code === 'PGRST205' || insertError.message?.includes('table')) {
            console.warn('⚠️ it_hardware_history 테이블이 존재하지 않습니다.');
            return true; // 테이블이 없어도 계속 진행
          }

          // 외래 키 제약 오류
          if (insertError?.code === '23503' || insertError?.message?.includes('foreign key')) {
            console.error('⚠️ 외래 키 오류: 하드웨어 ID가 존재하지 않습니다.');
            return false;
          }

          return false;
        }

        console.log('✅ 구매/수리이력 삽입 성공:', data?.length || 0, '개');
        console.log('📋 저장된 데이터:', data);
      } else {
        console.log('📝 저장할 구매/수리이력 데이터가 없음');
      }

      console.log('🎉 구매/수리이력 일괄 저장 완료');
      return true;

    } catch (err: any) {
      console.error('❌ saveMaintenanceHistories 예상치 못한 오류:', {
        name: err?.name,
        message: err?.message,
        stack: err?.stack?.split('\n').slice(0, 5),
        hardwareId,
        historiesCount: histories?.length || 0
      });

      const errorMessage = err?.message || '구매/수리이력 저장 중 예상치 못한 오류가 발생했습니다.';
      setError(errorMessage);
      return false;
    }
  };

  return {
    histories,
    loading,
    error,
    fetchHistories,
    createHistory,
    updateHistory,
    deleteHistory,
    getHistoryStats,
    testConnection,
    getMaintenanceHistories,
    convertToMaintenanceHistory,
    saveMaintenanceHistories
  };
};