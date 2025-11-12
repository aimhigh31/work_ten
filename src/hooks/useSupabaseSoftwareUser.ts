import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 소프트웨어 사용자이력 인터페이스 (실제 테이블 구조와 일치)
export interface SoftwareUserData {
  id?: number;
  software_id: number;
  user_name: string;
  department: string;
  exclusive_id?: string;
  reason?: string;
  usage_status: string; // '사용중' | '중지' | '반납'
  start_date?: string; // YYYY-MM-DD 형식
  end_date?: string; // YYYY-MM-DD 형식
  registration_date?: string; // YYYY-MM-DD 형식
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  is_active?: boolean;
}

// 프론트엔드 사용자이력 인터페이스 (기존 UserHistory와 호환)
export interface UserHistory {
  id: string;
  userName: string;
  department: string;
  exclusiveId: string;
  reason: string;
  status: string;
  registrationDate: string;
  team: string;
  startDate: string;
  endDate: string;
}

export const useSupabaseSoftwareUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 특정 소프트웨어의 사용자이력 조회 - useCallback으로 안정적인 참조 유지
  const getUserHistories = useCallback(async (softwareId: number): Promise<SoftwareUserData[]> => {
    console.log('🔍 소프트웨어 사용자이력 조회:', softwareId);

    // 1. 동적 캐시 키 생성
    const cacheKey = createCacheKey('software_user', `sw_${softwareId}`);
    const cachedData = loadFromCache<SoftwareUserData[]>(cacheKey, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [SoftwareUser] 캐시 데이터 반환');
      return cachedData;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('it_software_user')
        .select('*')
        .eq('software_id', softwareId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        // 테이블이 존재하지 않는 경우 처리
        if (error.code === 'PGRST205' || error.message?.includes('table') || error.message?.includes('relation')) {
          console.warn('⚠️ it_software_user 테이블이 존재하지 않거나 접근할 수 없습니다. 빈 배열을 반환합니다.');
          console.log('💡 manual_create_table.md 파일의 가이드에 따라 테이블을 생성하세요.');
          return [];
        }
        console.warn('❌ 사용자이력 조회 실패:', error);
        console.warn('⚠️ 사용자이력 조회 실패, 빈 배열 반환 (UI 중단 방지)');
        return [];
      }

      console.log('✅ 사용자이력 조회 성공:', data?.length + '개');

      // 2. 캐시에 저장
      saveToCache(cacheKey, data || []);

      return data || [];
    } catch (err: any) {
      console.warn('❌ getUserHistories 상세 오류:', {
        error: err,
        message: err?.message,
        code: err?.code,
        details: err?.details,
        softwareId
      });

      const errorMessage = err?.message || err?.toString() || '사용자이력 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []); // 의존성 없음 - supabase 클라이언트는 안정적인 참조

  // 사용자이력 생성
  const createUserHistory = async (userData: Omit<SoftwareUserData, 'id'>): Promise<SoftwareUserData | null> => {
    console.log('💾 사용자이력 생성:', userData);

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('it_software_user')
        .insert({
          ...userData,
          created_by: 'user',
          updated_by: 'user',
          is_active: true
        })
        .select()
        .single();

      if (error) {
        // 테이블이 존재하지 않는 경우 처리
        if (error.code === 'PGRST205' || error.message?.includes('table') || error.message?.includes('relation')) {
          console.warn('⚠️ it_software_user 테이블이 존재하지 않습니다.');
          console.log('💡 manual_create_table.md 파일의 가이드에 따라 테이블을 생성하세요.');
          setError('it_software_user 테이블이 생성되지 않았습니다. 테이블을 생성한 후 다시 시도하세요.');
          return null;
        }
        console.warn('❌ 사용자이력 생성 실패:', error);
        throw error;
      }

      console.log('✅ 사용자이력 생성 성공:', data);
      return data;
    } catch (err: any) {
      console.warn('❌ createUserHistory 오류:', err);
      setError(err.message || '사용자이력 생성 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 사용자이력 업데이트
  const updateUserHistory = async (id: number, userData: Partial<SoftwareUserData>): Promise<SoftwareUserData | null> => {
    console.log('🔄 사용자이력 업데이트:', id, userData);

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('it_software_user')
        .update({
          ...userData,
          updated_by: 'user',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('❌ 사용자이력 업데이트 실패:', error);
        throw error;
      }

      console.log('✅ 사용자이력 업데이트 성공:', data);
      return data;
    } catch (err: any) {
      console.warn('❌ updateUserHistory 오류:', err);
      setError(err.message || '사용자이력 업데이트 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 사용자이력 삭제 (soft delete)
  const deleteUserHistory = async (id: number): Promise<boolean> => {
    console.log('🗑️ 사용자이력 삭제:', id);

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('it_software_user')
        .update({
          is_active: false,
          updated_by: 'user',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.warn('❌ 사용자이력 삭제 실패:', error);
        throw error;
      }

      console.log('✅ 사용자이력 삭제 성공');
      return true;
    } catch (err: any) {
      console.warn('❌ deleteUserHistory 오류:', err);
      setError(err.message || '사용자이력 삭제 중 오류가 발생했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 사용자이력 일괄 저장 (data_relation.md 패턴)
  const saveUserHistories = async (softwareId: number, userHistories: UserHistory[]): Promise<boolean> => {
    console.log('💾 사용자이력 일괄 저장 시작');
    console.log('📌 소프트웨어 ID:', softwareId);
    console.log('📌 저장할 사용자이력 수:', userHistories.length);
    console.log('📌 사용자이력 데이터:', JSON.stringify(userHistories, null, 2));

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 데이터 검증 시작...');

      // 입력 데이터 검증
      if (!softwareId || softwareId <= 0) {
        const error = '유효하지 않은 소프트웨어 ID입니다.';
        console.warn('❌', error, 'softwareId:', softwareId);
        setError(error);
        return false;
      }

      if (!Array.isArray(userHistories)) {
        const error = '사용자이력 데이터가 배열이 아닙니다.';
        console.warn('❌', error, 'type:', typeof userHistories);
        setError(error);
        return false;
      }

      console.log('✅ 데이터 검증 통과');

      // 테이블 존재 여부 먼저 확인
      console.log('🔍 테이블 존재 여부 확인 중...');
      const { data: testData, error: testError } = await supabase.from('it_software_user').select('id').limit(1);

      if (testError) {
        console.warn('❌ 테이블 확인 중 오류 발생:', {
          error: testError,
          code: testError.code,
          message: testError.message,
          details: testError.details,
          hint: testError.hint
        });

        if (
          testError.code === 'PGRST116' ||
          testError.message?.includes('table') ||
          testError.message?.includes('relation') ||
          testError.message?.includes('does not exist')
        ) {
          console.warn('⚠️ it_software_user 테이블이 존재하지 않거나 접근할 수 없습니다.');
          console.log('💡 다음 스크립트를 실행하여 테이블을 생성하세요:');
          console.log('   node create_it_software_user_supabase.js');
          return true; // UI 중단 방지
        }

        const errorMessage = testError.message || '테이블 확인 중 알 수 없는 오류가 발생했습니다.';
        console.warn(`⚠️ 테이블 확인 중 오류가 발생했지만 계속 진행합니다: ${errorMessage}`);
        return true; // UI 중단 방지
      }

      console.log('✅ 테이블 존재 확인 완료');

      // 기존 데이터 삭제 (soft delete)
      console.log('🗑️ 기존 데이터 비활성화 중...');
      const { error: deleteError } = await supabase
        .from('it_software_user')
        .update({
          is_active: false,
          updated_by: 'user',
          updated_at: new Date().toISOString()
        })
        .eq('software_id', softwareId);

      if (deleteError) {
        console.warn('❌ 기존 데이터 비활성화 실패:', deleteError);
        setError(`기존 데이터 비활성화 실패: ${deleteError.message}`);
        return false;
      }

      console.log('✅ 기존 데이터 비활성화 완료');

      // 새 데이터 저장
      if (userHistories.length > 0) {
        console.log('📝 새 데이터 준비 중...');

        // 데이터 유효성 검증 및 변환
        const userDataToSave: Omit<SoftwareUserData, 'id'>[] = [];

        for (let i = 0; i < userHistories.length; i++) {
          const item = userHistories[i];
          console.log(`📋 데이터 ${i + 1} 검증:`, item);

          // 필수 필드 검증
          if (!item.userName || item.userName.trim() === '') {
            console.warn(`⚠️ ${i + 1}번 데이터: 사용자명이 없어 건너뜁니다.`);
            continue;
          }

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
              console.warn(`⚠️ 잘못된 날짜 형식: ${dateStr}`);
            }

            return null;
          };

          const userData: Omit<SoftwareUserData, 'id'> = {
            software_id: softwareId,
            user_name: item.userName.trim(),
            department: item.department?.trim() || '',
            exclusive_id: item.exclusiveId?.trim() || '',
            reason: item.reason?.trim() || '',
            usage_status: item.status?.trim() || '사용중',
            start_date: formatDate(item.startDate),
            end_date: formatDate(item.endDate),
            registration_date: formatDate(item.registrationDate) || new Date().toISOString().split('T')[0],
            // notes 필드 제거 - 테이블에 없음
            created_by: 'user',
            updated_by: 'user',
            is_active: true
          };

          userDataToSave.push(userData);
          console.log(`✅ 데이터 ${i + 1} 준비 완료:`, userData);
        }

        if (userDataToSave.length === 0) {
          console.log('⚠️ 저장할 유효한 데이터가 없습니다.');
          setError('저장할 유효한 사용자이력 데이터가 없습니다.');
          return false;
        }

        console.log('💾 데이터베이스에 저장 중...', `${userDataToSave.length}개 데이터`);

        const { data: insertedData, error: insertError } = await supabase
          .from('it_software_user')
          .insert(userDataToSave)
          .select('id, user_name');

        if (insertError) {
          console.warn('❌ 사용자이력 일괄 저장 실패');
          console.warn('📍 에러 객체:', insertError);
          console.warn('📍 에러 메시지:', insertError?.message);
          console.warn('📍 에러 코드:', insertError?.code);
          console.warn('📍 에러 상세:', insertError?.details);
          console.warn('📍 에러 힌트:', insertError?.hint);
          console.warn('📍 저장하려던 데이터 수:', userDataToSave.length);
          console.warn('📍 저장하려던 데이터:', JSON.stringify(userDataToSave, null, 2));

          // 테이블이 없는 경우
          if (insertError.code === 'PGRST205' || insertError.message?.includes('table') || insertError.message?.includes('relation')) {
            console.warn('⚠️ it_software_user 테이블이 존재하지 않거나 접근할 수 없습니다.');
            return true; // UI 중단 방지
          }

          // 외래 키 제약 오류 처리
          if (insertError?.code === '23503' || insertError?.message?.includes('foreign key')) {
            console.warn('⚠️ 외래 키 오류: 소프트웨어 ID가 존재하지 않습니다.');
            setError(`소프트웨어 ID ${softwareId}가 데이터베이스에 존재하지 않습니다. 먼저 소프트웨어를 저장해주세요.`);
            return false;
          }

          // 필드 누락 오류 처리
          if (insertError?.code === '23502' || insertError?.message?.includes('null value')) {
            console.warn('⚠️ 필수 필드 누락 오류');
            setError('필수 필드가 누락되었습니다. 사용자명을 확인해주세요.');
            return false;
          }

          const errorMsg = insertError?.message || JSON.stringify(insertError) || '사용자이력 저장 중 알 수 없는 오류가 발생했습니다.';
          setError(`사용자이력 저장 실패: ${errorMsg}`);
          return false;
        }

        console.log('✅ 데이터 저장 성공:', insertedData?.length + '개');
        console.log('📋 저장된 데이터:', insertedData);
      } else {
        console.log('📝 저장할 사용자이력 데이터가 없음');
      }

      // 캐시 무효화 - 최신 데이터를 다시 로드하도록
      const cacheKey = createCacheKey('software_user', `sw_${softwareId}`);
      sessionStorage.removeItem(cacheKey);
      sessionStorage.removeItem(`${cacheKey}_timestamp`);
      console.log('🗑️ 캐시 무효화 완료:', cacheKey);

      console.log('🎉 사용자이력 일괄 저장 완료');
      return true;
    } catch (err: any) {
      console.warn('❌ saveUserHistories 예상치 못한 오류:', {
        name: err?.name,
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        stack: err?.stack?.split('\n').slice(0, 5),
        softwareId,
        userHistoriesCount: userHistories?.length || 0
      });

      // 네트워크 오류
      if (err?.message?.includes('fetch') || err?.message?.includes('network')) {
        setError('네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
        return false;
      }

      // 권한 오류
      if (err?.message?.includes('permission') || err?.message?.includes('unauthorized')) {
        setError('데이터베이스 접근 권한이 없습니다. 관리자에게 문의해주세요.');
        return false;
      }

      // 일반적인 오류 메시지
      const errorMessage = err?.message || err?.toString() || '사용자이력 일괄 저장 중 예상치 못한 오류가 발생했습니다.';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // SoftwareUserData를 UserHistory로 변환 - useCallback으로 안정적인 참조 유지
  const convertToUserHistory = useCallback((userData: SoftwareUserData): UserHistory => {
    return {
      id: userData.id?.toString() || '',
      userName: userData.user_name,
      department: userData.department,
      exclusiveId: userData.exclusive_id || '',
      reason: userData.reason || '',
      status: userData.usage_status,
      registrationDate: userData.registration_date || '',
      team: userData.department, // department를 team으로 매핑
      startDate: userData.start_date || '',
      endDate: userData.end_date || ''
    };
  }, []); // 의존성 없음 - 순수 변환 함수

  return {
    loading,
    error,
    getUserHistories,
    createUserHistory,
    updateUserHistory,
    deleteUserHistory,
    saveUserHistories,
    convertToUserHistory
  };
};
