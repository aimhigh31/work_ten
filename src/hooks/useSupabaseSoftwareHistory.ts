import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 소프트웨어 구매/유지보수이력 인터페이스 (실제 테이블 구조와 일치)
export interface SoftwareHistoryData {
  id?: number;
  software_id: number;
  history_type: string; // '구매' | '유지보수' | '업그레이드' | '계약갱신'
  purchase_date?: string; // YYYY-MM-DD
  supplier?: string;
  price?: number;
  quantity?: number;
  maintenance_start_date?: string; // YYYY-MM-DD
  maintenance_end_date?: string; // YYYY-MM-DD
  contract_number?: string;
  description?: string;
  status?: string; // '계획중' | '진행중' | '완료' | '취소'
  memo?: string;
  registration_date?: string; // YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  is_active?: boolean;
}

// 프론트엔드 구매이력 인터페이스
export interface PurchaseHistory {
  id: number;
  historyType: string; // 서브코드명: '구매' | '유지보수' | '업그레이드' | '계약갱신'
  purchaseDate: string;
  supplier: string;
  price: string;
  quantity: number;
  contractNumber: string;
  description: string;
  status: string;
  memo: string;
  registrationDate: string;
}

// 프론트엔드 MaintenanceHistory 인터페이스 (SoftwareEditDialog와 동일)
export interface MaintenanceHistory {
  id: string;
  registrationDate: string;
  type: string; // 서브코드명: '구매' | '유지보수' | '업그레이드' | '계약갱신'
  content: string;
  vendor: string;
  amount: number;
  registrant: string;
  status: string;
  startDate: string;
  completionDate: string;
}

// 커스텀 훅
export const useSupabaseSoftwareHistory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 구매/유지보수이력 일괄 저장 (data_relation.md 패턴)
  const savePurchaseHistories = async (softwareId: number, purchaseHistories: PurchaseHistory[]): Promise<boolean> => {
    console.log('💾 구매/유지보수이력 일괄 저장 시작');
    console.log('📌 소프트웨어 ID:', softwareId);
    console.log('📌 저장할 이력 수:', purchaseHistories.length);
    console.log('📌 이력 데이터:', JSON.stringify(purchaseHistories, null, 2));

    try {
      setLoading(true);
      setError(null);

      // 입력 데이터 검증
      if (!softwareId || softwareId <= 0) {
        const error = '유효하지 않은 소프트웨어 ID입니다.';
        console.warn('❌', error, 'softwareId:', softwareId);
        setError(error);
        return false;
      }

      if (!Array.isArray(purchaseHistories)) {
        const error = '구매이력 데이터가 배열이 아닙니다.';
        console.warn('❌', error, 'type:', typeof purchaseHistories);
        setError(error);
        return false;
      }

      console.log('✅ 데이터 검증 통과');

      // 기존 데이터 삭제 (soft delete)
      console.log('🗑️ 기존 데이터 비활성화 중...', { softwareId });
      const { data: updateData, error: deleteError } = await supabase
        .from('it_software_history')
        .update({
          is_active: false,
          updated_by: 'user',
          updated_at: new Date().toISOString()
        })
        .eq('software_id', softwareId)
        .select('id');

      if (deleteError) {
        // 테이블이 없는 경우 처리
        if (deleteError.code === 'PGRST205' || deleteError.message?.includes('table')) {
          console.warn('⚠️ it_software_history 테이블이 존재하지 않습니다.');
          console.log('💡 node create_it_software_history.js 스크립트를 실행하여 테이블을 생성해주세요.');
          setError('it_software_history 테이블이 생성되지 않았습니다.');
          return true; // 테이블이 없어도 계속 진행 (소프트웨어 데이터는 저장되도록)
        }
        console.warn('❌ 기존 데이터 비활성화 실패:', deleteError);
        setError(`기존 데이터 비활성화 실패: ${deleteError.message}`);
        return false;
      }

      console.log('✅ 기존 데이터 비활성화 완료:', { 비활성화된_레코드_수: updateData?.length || 0 });

      // 새 데이터 저장
      if (purchaseHistories.length > 0) {
        console.log('📝 새 데이터 준비 중...');

        // 데이터 변환 및 검증
        const historyDataToSave: Omit<SoftwareHistoryData, 'id'>[] = [];

        for (let i = 0; i < purchaseHistories.length; i++) {
          const item = purchaseHistories[i];
          console.log(`📋 데이터 ${i + 1} 검증:`, item);

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
              console.warn(`⚠️ 잘못된 날짜 형식: ${dateStr}, 오류:`, e);
            }

            return null;
          };

          // historyType을 그대로 사용 (서브코드명)
          const historyType = item.historyType || '구매';

          const historyData: Omit<SoftwareHistoryData, 'id'> = {
            software_id: softwareId,
            history_type: historyType,
            purchase_date: formatDate(item.purchaseDate),
            supplier: item.supplier?.trim() || '',
            price: parseFloat(item.price) || 0,
            quantity: item.quantity || 1,
            contract_number: item.contractNumber?.trim() || '',
            description: item.description?.trim() || '',
            status: item.status?.trim() || '진행중',
            memo: item.memo?.trim() || '',
            registration_date: formatDate(item.registrationDate) || new Date().toISOString().split('T')[0],
            created_by: 'user',
            updated_by: 'user',
            is_active: true
          };

          // 유지보수 타입인 경우 시작/종료일 추가
          if (historyType === '유지보수') {
            // purchaseDate를 시작일로, 1년 후를 종료일로 설정 (기본값)
            historyData.maintenance_start_date = formatDate(item.purchaseDate);
            if (historyData.maintenance_start_date) {
              const startDate = new Date(historyData.maintenance_start_date);
              startDate.setFullYear(startDate.getFullYear() + 1);
              historyData.maintenance_end_date = startDate.toISOString().split('T')[0];
            }
          }

          historyDataToSave.push(historyData);
          console.log(`✅ 데이터 ${i + 1} 준비 완료:`, historyData);
        }

        if (historyDataToSave.length === 0) {
          console.log('⚠️ 저장할 유효한 데이터가 없습니다.');
          return true; // 데이터가 없어도 성공으로 처리
        }

        console.log('💾 데이터베이스에 저장 중...', `${historyDataToSave.length}개 데이터`);

        const { data: insertedData, error: insertError } = await supabase
          .from('it_software_history')
          .insert(historyDataToSave)
          .select('id, history_type, supplier');

        if (insertError) {
          console.warn('❌ 구매/유지보수이력 일괄 저장 실패');
          console.warn('📍 에러 객체:', insertError);
          console.warn('📍 에러 메시지:', insertError?.message);
          console.warn('📍 에러 코드:', insertError?.code);
          console.warn('📍 저장하려던 데이터:', JSON.stringify(historyDataToSave, null, 2));

          // 테이블이 없는 경우
          if (insertError.code === 'PGRST205' || insertError.message?.includes('table') || insertError.message?.includes('relation')) {
            console.warn('⚠️ it_software_history 테이블이 존재하지 않거나 접근할 수 없습니다.');
            return true; // 테이블이 없어도 계속 진행
          }

          // 외래 키 제약 오류
          if (insertError?.code === '23503' || insertError?.message?.includes('foreign key')) {
            console.warn('⚠️ 외래 키 오류: 소프트웨어 ID가 존재하지 않습니다.');
            setError(`소프트웨어 ID ${softwareId}가 데이터베이스에 존재하지 않습니다.`);
            return false;
          }

          const errorMsg = insertError?.message || '구매이력 저장 중 알 수 없는 오류가 발생했습니다.';
          setError(`구매이력 저장 실패: ${errorMsg}`);
          return false;
        }

        console.log('✅ 데이터 저장 성공:', insertedData?.length + '개');
        console.log('📋 저장된 데이터:', insertedData);
      } else {
        console.log('📝 저장할 구매/유지보수이력 데이터가 없음');
      }

      // 캐시 무효화 - 최신 데이터를 다시 로드하도록
      const cacheKey = createCacheKey('software_history', `sw_${softwareId}`);
      sessionStorage.removeItem(cacheKey);
      sessionStorage.removeItem(`${cacheKey}_timestamp`);
      console.log('🗑️ 캐시 무효화 완료:', cacheKey);

      console.log('🎉 구매/유지보수이력 일괄 저장 완료');
      return true;
    } catch (err: any) {
      console.warn('❌ savePurchaseHistories 예상치 못한 오류:', {
        name: err?.name,
        message: err?.message,
        stack: err?.stack?.split('\n').slice(0, 5),
        softwareId,
        historiesCount: purchaseHistories?.length || 0
      });

      const errorMessage = err?.message || '구매이력 저장 중 예상치 못한 오류가 발생했습니다.';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 구매/유지보수이력 조회 - useCallback으로 안정적인 참조 유지
  const getPurchaseHistories = useCallback(async (softwareId: number): Promise<PurchaseHistory[]> => {
    console.log('📖 구매/유지보수이력 조회:', softwareId);

    // 1. 동적 캐시 키 생성
    const cacheKey = createCacheKey('software_history', `sw_${softwareId}`);
    const cachedData = loadFromCache<PurchaseHistory[]>(cacheKey, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [SoftwareHistory] 캐시 데이터 반환');
      return cachedData;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Supabase 쿼리 실행 중...');
      const { data, error } = await supabase
        .from('it_software_history')
        .select('*')
        .eq('software_id', softwareId)
        .eq('is_active', true)
        .order('id', { ascending: false });

      console.log('🔍 Supabase 응답:', {
        dataCount: data?.length,
        error,
        rawData: data
      });

      if (error) {
        console.warn('⚠️ Supabase 쿼리 경고:');
        console.warn('📍 에러 객체:', error);
        console.warn('📍 에러 메시지:', error?.message);
        console.warn('📍 에러 코드:', error?.code);
        console.warn('📍 에러 상세:', JSON.stringify(error, null, 2));

        if (error.code === 'PGRST205' || error.message?.includes('table') || error.message?.includes('relation')) {
          console.warn('⚠️ it_software_history 테이블이 존재하지 않거나 접근할 수 없습니다.');
          return [];
        }

        // 다른 에러도 빈 배열 반환 (UI 중단 방지)
        console.warn('⚠️ 구매이력 조회 실패, 빈 배열 반환');
        return [];
      }

      console.log('🔍 데이터 매핑 시작...');
      // 데이터 변환
      const histories: PurchaseHistory[] = (data || []).map((item: SoftwareHistoryData, index) => {
        console.log(`🔍 매핑 중 [${index}]:`, item.id, item.supplier, item.history_type);
        return {
          id: item.id || 0,
          historyType: item.history_type || '구매', // DB의 history_type (서브코드명)
          purchaseDate: item.purchase_date || '',
          supplier: item.supplier || '',
          price: item.price?.toString() || '0',
          quantity: item.quantity || 1,
          contractNumber: item.contract_number || '',
          description: item.description || '',
          status: item.status || '진행중',
          memo: item.memo || '',
          registrationDate: item.registration_date || ''
        };
      });

      console.log('✅ 이력 조회 성공:', histories.length + '개');

      // 2. 캐시에 저장
      saveToCache(cacheKey, histories);

      return histories;
    } catch (err: any) {
      console.warn('❌ 구매/유지보수이력 조회 실패 (최종 catch):', err);
      console.warn('❌ 에러 스택:', err?.stack);
      setError(err?.message || '구매이력 조회 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []); // 의존성 없음 - supabase 클라이언트는 안정적인 참조

  // PurchaseHistory를 MaintenanceHistory로 변환 - useCallback으로 안정적인 참조 유지
  const convertToMaintenanceHistory = useCallback((item: PurchaseHistory): MaintenanceHistory => {
    console.log('🔄 convertToMaintenanceHistory 변환 시작:', item);

    // memo에서 완료일 추출
    const extractCompletionDate = (memo: string): string => {
      if (!memo) return '';
      const match = memo.match(/완료일:\s*([^\|]*)/);
      return match ? match[1].trim() : '';
    };

    const completionDateFromMemo = extractCompletionDate(item.memo);

    const result = {
      id: item.id.toString(),
      registrationDate: item.registrationDate || item.purchaseDate || '',
      type: item.historyType || '구매', // DB의 history_type을 그대로 사용 (서브코드명)
      content: item.description || '', // description을 그대로 사용 (type prefix 없음)
      vendor: item.supplier || '',
      amount: parseFloat(item.price) || 0,
      registrant: '시스템',
      status: item.status || '진행중',
      startDate: item.purchaseDate || '',
      completionDate: completionDateFromMemo || (item.status === '완료' ? item.purchaseDate || '' : '')
    };

    console.log('✅ convertToMaintenanceHistory 변환 완료:', result);
    return result;
  }, []); // 의존성 없음 - 순수 변환 함수

  return {
    savePurchaseHistories,
    getPurchaseHistories,
    convertToMaintenanceHistory,
    loading,
    error
  };
};
