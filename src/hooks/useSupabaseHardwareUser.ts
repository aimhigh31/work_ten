import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 프론트엔드 UserHistory 인터페이스 (HardwareEditDialog와 동일)
interface UserHistory {
  id: string;
  registrationDate: string;
  userId: string;
  userName: string;
  department: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'active' | 'inactive';
}

// 하드웨어 사용자 이력 인터페이스
export interface HardwareUserHistory {
  id: number;
  hardware_id: number;
  user_name: string;
  department: string;
  start_date: string;
  end_date?: string | null;
  reason: string;
  status: 'active' | 'inactive';
  registration_date: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
}

// 사용자 이력 생성 요청 타입
export interface CreateHardwareUserRequest {
  hardware_id: number;
  user_name: string;
  department: string;
  start_date: string;
  end_date?: string | null;
  reason: string;
  status?: 'active' | 'inactive';
}

// 사용자 이력 수정 요청 타입
export interface UpdateHardwareUserRequest {
  user_name?: string;
  department?: string;
  start_date?: string;
  end_date?: string | null;
  reason?: string;
  status?: 'active' | 'inactive';
}

export const useSupabaseHardwareUser = () => {
  const [userHistories, setUserHistories] = useState<HardwareUserHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supabase 연결 확인
  const testConnection = async () => {
    try {
      console.log('🔍 Supabase 연결 테스트 시작...');
      console.log('📍 Supabase URL:', supabaseUrl);
      console.log('🔑 Supabase Key (첫 20자):', supabaseKey?.substring(0, 20) + '...');

      const { count, error } = await supabase
        .from('it_hardware_user')
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

  // 특정 하드웨어의 사용자 이력 조회
  const fetchUserHistories = useCallback(async (hardwareId: number) => {
    console.log('🔍 하드웨어 사용자 이력 조회 시작:', hardwareId);

    // 하드웨어 ID 유효성 검사
    if (!hardwareId || isNaN(hardwareId) || hardwareId <= 0) {
      console.warn('⚠️ 유효하지 않은 하드웨어 ID:', hardwareId);
      setError('유효하지 않은 하드웨어 ID입니다.');
      setUserHistories([]);
      return;
    }

    // 1. 동적 캐시 키 생성
    const cacheKey = createCacheKey('hardware_user', `hw_${hardwareId}`);
    const cachedData = loadFromCache<HardwareUserHistory[]>(cacheKey, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [HardwareUser] 캐시 데이터 반환');
      setUserHistories(cachedData);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Supabase에서 특정 하드웨어의 사용자 이력만 조회
      const { data, error } = await supabase
        .from('it_hardware_user')
        .select('*')
        .eq('hardware_id', hardwareId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('❌ Supabase 조회 실패:', JSON.stringify(error, null, 2));
        console.log('❌ 에러 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setError(`사용자 이력을 불러오는데 실패했습니다: ${error.message}`);
        setUserHistories([]);
        return;
      }

      console.log('✅ Supabase 조회 성공:', data?.length || 0, '개');
      setUserHistories(data || []);

      // 2. 캐시에 저장
      saveToCache(cacheKey, data || []);

    } catch (err: any) {
      console.log('❌ fetchUserHistories 오류:', JSON.stringify(err, null, 2));
      setError('사용자 이력을 불러오는데 실패했습니다.');
      setUserHistories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 사용자 이력 생성 (실제 DB 연동)
  const createUserHistory = async (userHistoryData: CreateHardwareUserRequest): Promise<{ success: boolean; data?: any; error?: string }> => {
    console.log('🆕 사용자 이력 생성 시작:', userHistoryData);

    // 데이터 유효성 검사
    if (!userHistoryData.hardware_id) {
      const errorMsg = 'hardware_id가 필요합니다.';
      console.log('❌ 유효성 검사 실패:', errorMsg);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!userHistoryData.start_date) {
      const errorMsg = 'start_date가 필요합니다.';
      console.log('❌ 유효성 검사 실패:', errorMsg);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    const newHistoryData = {
      hardware_id: userHistoryData.hardware_id,
      user_name: userHistoryData.user_name || '',
      department: userHistoryData.department || '',
      start_date: userHistoryData.start_date,
      end_date: userHistoryData.end_date || null,
      reason: userHistoryData.reason || '',
      status: userHistoryData.status || 'GROUP020-SUB001',
      registration_date: new Date().toISOString().split('T')[0],
      created_by: 'system',
      updated_by: 'system',
      is_active: true
    };

    console.log('📝 Supabase에 삽입할 데이터:', newHistoryData);

    const { data, error } = await supabase
      .from('it_hardware_user')
      .insert([newHistoryData])
      .select()
      .single();

    console.log('📊 Supabase 응답 - data:', data);
    console.log('📊 Supabase 응답 - error:', error);

    if (error) {
      console.log('🚨 ERROR DETECTED 🚨');
      console.log('❌ 사용자 이력 생성 실패 - 전체 에러 타입:', typeof error);
      console.log('❌ 사용자 이력 생성 실패 - 전체 에러 JSON:', JSON.stringify(error, null, 2));
      console.log('❌ 사용자 이력 생성 실패 - 전체 에러 키들:', Object.keys(error));
      console.log('❌ 에러 message 직접 접근:', error.message);
      console.log('❌ 에러 details 직접 접근:', error.details);
      console.log('❌ 에러 hint 직접 접근:', error.hint);
      console.log('❌ 에러 code 직접 접근:', error.code);
      console.log('❌ 에러 status 직접 접근:', (error as any).status);
      console.log('❌ 에러 statusCode 직접 접근:', (error as any).statusCode);
      console.log('❌ 에러 toString():', error.toString());

      // 모든 속성을 수동으로 확인
      for (const key in error) {
        console.log(`❌ 에러.${key}:`, (error as any)[key]);
      }

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

    console.log('✅ 새 사용자 이력 생성 성공:', data);

    // 목록을 다시 조회하여 최신 상태로 업데이트
    await fetchUserHistories(userHistoryData.hardware_id);
    setError(null);

    return { success: true, data };
  };

  // 사용자 이력 수정 (실제 DB 연동)
  const updateUserHistory = async (id: number, userHistoryData: UpdateHardwareUserRequest) => {
    console.log('🔄 사용자 이력 수정 시작:', { id, userHistoryData });

    try {
      const updateData = {
        ...userHistoryData,
        updated_at: new Date().toISOString(),
        updated_by: 'system'
      };

      const { data, error } = await supabase
        .from('it_hardware_user')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.log('❌ 사용자 이력 수정 실패:', JSON.stringify(error, null, 2));
        throw new Error('사용자 이력 수정에 실패했습니다.');
      }

      console.log('✅ 사용자 이력 수정 성공:', data);

      // 로컬 상태 업데이트
      setUserHistories(prev =>
        prev.map(history =>
          history.id === id ? { ...history, ...data } : history
        )
      );
      setError(null);

      return data;

    } catch (err: any) {
      console.log('❌ updateUserHistory 오류:', JSON.stringify(err, null, 2));
      throw err;
    }
  };

  // 사용자 이력 삭제 (실제 DB 연동)
  const deleteUserHistory = async (id: number) => {
    console.log('🗑️ 사용자 이력 삭제 시작:', id);

    try {
      const { error } = await supabase
        .from('it_hardware_user')
        .update({ is_active: false, updated_by: 'system' })
        .eq('id', id);

      if (error) {
        console.log('❌ 사용자 이력 삭제 실패:', JSON.stringify(error, null, 2));
        throw new Error('사용자 이력 삭제에 실패했습니다.');
      }

      console.log('✅ 사용자 이력 삭제 성공');

      // 로컬 상태에서 제거
      setUserHistories(prev => prev.filter(history => history.id !== id));
      setError(null);

      return { id };

    } catch (err: any) {
      console.log('❌ deleteUserHistory 오류:', JSON.stringify(err, null, 2));
      throw err;
    }
  };

  // 현재 사용 중인 사용자 조회
  const getCurrentUser = async (hardwareId: number): Promise<HardwareUserHistory | null> => {
    try {
      const { data, error } = await supabase
        .from('it_hardware_user')
        .select('*')
        .eq('hardware_id', hardwareId)
        .eq('status', 'active')
        .eq('is_active', true)
        .is('end_date', null)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
        console.log('❌ 현재 사용자 조회 실패:', JSON.stringify(error, null, 2));
        throw error;
      }

      return data || null;

    } catch (err: any) {
      console.log('❌ getCurrentUser 오류:', JSON.stringify(err, null, 2));
      return null;
    }
  };

  // 사용자 이력 통계
  const getUserHistoryStats = async (hardwareId: number) => {
    try {
      const { data, error } = await supabase
        .from('it_hardware_user')
        .select('status')
        .eq('hardware_id', hardwareId)
        .eq('is_active', true);

      if (error) {
        console.log('❌ 통계 조회 실패:', JSON.stringify(error, null, 2));
        return { total: 0, active: 0, inactive: 0 };
      }

      const total = data.length;
      const active = data.filter(item => item.status === 'active').length;
      const inactive = data.filter(item => item.status === 'inactive').length;

      return { total, active, inactive };

    } catch (err: any) {
      console.log('❌ getUserHistoryStats 오류:', JSON.stringify(err, null, 2));
      return { total: 0, active: 0, inactive: 0 };
    }
  };

  // 하드웨어 사용자이력 조회 (데이터를 직접 반환)
  const getUserHistories = async (hardwareId: number): Promise<HardwareUserHistory[]> => {
    console.log('🔍 getUserHistories 호출:', hardwareId);

    try {
      setLoading(true);
      setError(null);

      // Supabase에서 특정 하드웨어의 사용자 이력만 조회
      const { data, error } = await supabase
        .from('it_hardware_user')
        .select('*')
        .eq('hardware_id', hardwareId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ getUserHistories 조회 실패:', error);
        setError(`사용자 이력을 불러오는데 실패했습니다: ${error.message}`);
        return [];
      }

      console.log('✅ getUserHistories 조회 성공:', data?.length || 0, '개');
      console.log('📋 조회된 데이터:', data);
      return data || [];

    } catch (err: any) {
      console.error('❌ getUserHistories 오류:', err);
      setError('사용자 이력을 불러오는데 실패했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // HardwareUserHistory를 UserHistory(프론트엔드 형식)로 변환
  const convertToUserHistory = (item: HardwareUserHistory): UserHistory => {
    // status 값 변환: DB의 GROUP020-SUB001 등을 프론트엔드 형식으로 변환
    let frontendStatus: 'active' | 'inactive' = 'active';
    if (item.status === 'GROUP020-SUB001' || item.status === 'active') {
      frontendStatus = 'active';
    } else if (item.status === 'GROUP020-SUB002' || item.status === 'inactive') {
      frontendStatus = 'inactive';
    }

    return {
      id: item.id.toString(),
      registrationDate: item.registration_date || '',
      userId: '', // 사용자 ID는 별도 필드가 없으므로 빈 값
      userName: item.user_name || '',
      department: item.department || '',
      startDate: item.start_date || '',
      endDate: item.end_date || '',
      reason: item.reason || '',
      status: frontendStatus
    };
  };

  // 소프트웨어와 동일한 사용자 이력 일괄 저장 함수
  const saveUserHistories = async (hardwareId: number, histories: HardwareUserHistory[]) => {
    console.log('💾 하드웨어 사용자이력 일괄 저장 시작:', { hardwareId, count: histories.length });

    try {
      // 기존 데이터 삭제 (소프트웨어와 동일하게)
      const { error: deleteError } = await supabase
        .from('it_hardware_user')
        .update({ is_active: false })
        .eq('hardware_id', hardwareId);

      if (deleteError) {
        console.error('❌ 기존 데이터 비활성화 실패:', deleteError);
        return false;
      }

      // 새 데이터 삽입
      if (histories.length > 0) {
        console.log('📝 원본 사용자이력 데이터:', JSON.stringify(histories, null, 2));

        // 데이터 변환 및 검증
        const insertData = histories.map((history, index) => {
          console.log(`📋 데이터 ${index + 1} 변환:`, history);

          // 날짜 형식 검증 및 변환
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

          // status 값 정규화
          let normalizedStatus = 'GROUP020-SUB001'; // 기본값: 사용중
          if (history.status === 'active' || history.status === '사용중') {
            normalizedStatus = 'GROUP020-SUB001';
          } else if (history.status === 'inactive' || history.status === '종료') {
            normalizedStatus = 'GROUP020-SUB002';
          }

          const convertedData = {
            hardware_id: hardwareId,
            user_name: history.user_name?.trim() || '',
            department: history.department?.trim() || '',
            start_date: formatDate(history.start_date) || new Date().toISOString().split('T')[0],
            end_date: formatDate(history.end_date),
            reason: history.reason?.trim() || '',
            status: normalizedStatus,
            registration_date: new Date().toISOString().split('T')[0],
            created_by: 'system',
            updated_by: 'system',
            is_active: true
          };

          console.log(`✅ 데이터 ${index + 1} 변환 완료:`, convertedData);
          return convertedData;
        });

        console.log('📝 최종 삽입할 데이터:', JSON.stringify(insertData, null, 2));

        const { data, error: insertError } = await supabase
          .from('it_hardware_user')
          .insert(insertData)
          .select();

        if (insertError) {
          console.error('❌ 사용자이력 삽입 실패');
          console.error('📍 에러 객체:', insertError);
          console.error('📍 에러 메시지:', insertError?.message);
          console.error('📍 에러 코드:', insertError?.code);
          console.error('📍 에러 상세:', JSON.stringify(insertError, null, 2));
          console.error('📍 삽입하려던 데이터:', JSON.stringify(insertData, null, 2));

          // 테이블이 없는 경우
          if (insertError.code === 'PGRST205' || insertError.message?.includes('table')) {
            console.warn('⚠️ it_hardware_user 테이블이 존재하지 않습니다.');
            console.log('💡 테이블 생성 스크립트를 실행해주세요.');
            return true; // 테이블이 없어도 계속 진행
          }

          // 외래 키 제약 오류
          if (insertError?.code === '23503' || insertError?.message?.includes('foreign key')) {
            console.error('⚠️ 외래 키 오류: 하드웨어 ID가 존재하지 않습니다.');
            return false;
          }

          return false;
        }

        console.log('✅ 사용자이력 삽입 성공:', data?.length || 0, '개');
      }

      console.log('✅ 하드웨어 사용자이력 일괄 저장 완료');
      return true;

    } catch (error) {
      console.error('❌ saveUserHistories 오류:', error);
      return false;
    }
  };

  return {
    userHistories,
    loading,
    error,
    fetchUserHistories,
    createUserHistory,
    updateUserHistory,
    deleteUserHistory,
    getCurrentUser,
    getUserHistoryStats,
    testConnection,
    getUserHistories,
    convertToUserHistory,
    saveUserHistories
  };
};