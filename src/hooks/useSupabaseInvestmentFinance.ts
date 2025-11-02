import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// 투자금액 항목 타입
export interface InvestmentFinanceItem {
  id: number;
  investment_id: number;
  item_order: number;
  investment_category: string;
  item_name: string;
  budget_amount: number;
  execution_amount: number;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  is_active?: boolean;
}

export function useSupabaseInvestmentFinance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 특정 투자의 금액 항목 조회
  const getFinanceItems = useCallback(async (investmentId: number): Promise<InvestmentFinanceItem[]> => {
    // 1. 동적 캐시 키 생성 (투자 ID별로 별도 캐시)
    const cacheKey = createCacheKey('investment_finance', `id_${investmentId}`);
    const cachedData = loadFromCache<InvestmentFinanceItem[]>(cacheKey, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [InvestmentFinance] 캐시 데이터 반환 (깜빡임 방지)');
      return cachedData;
    }

    try {
      console.log('📞 getFinanceItems 호출:', investmentId);
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('plan_investment_finance')
        .select('*')
        .eq('investment_id', investmentId)
        .eq('is_active', true)
        .order('item_order', { ascending: true });

      if (supabaseError) {
        console.error('❌ Supabase 조회 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ getFinanceItems 성공:', data?.length, '개');

      // 2. 캐시에 저장
      saveToCache(cacheKey, data || []);

      return data || [];
    } catch (err) {
      console.error('❌ getFinanceItems 실패:', err);
      setError(err instanceof Error ? err.message : '금액 항목 조회 실패');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 금액 항목 일괄 저장 (기존 삭제 후 재저장)
  const saveFinanceItems = useCallback(
    async (investmentId: number, items: Omit<InvestmentFinanceItem, 'id' | 'created_at' | 'updated_at'>[]): Promise<boolean> => {
      try {
        console.log('💾 saveFinanceItems 호출:', investmentId, items.length, '개');
        setLoading(true);
        setError(null);

        // 1단계: 기존 활성 데이터를 is_active = false로 변경
        const { error: updateError } = await supabase
          .from('plan_investment_finance')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('investment_id', investmentId)
          .eq('is_active', true);

        if (updateError) {
          console.error('❌ 기존 데이터 비활성화 오류:', updateError);
          throw updateError;
        }

        console.log('✅ 기존 데이터 비활성화 완료');

        // 2단계: 새 데이터 저장
        if (items.length > 0) {
          const insertData = items.map((item, index) => ({
            investment_id: investmentId,
            item_order: item.item_order || index + 1,
            investment_category: item.investment_category,
            item_name: item.item_name,
            budget_amount: item.budget_amount || 0,
            execution_amount: item.execution_amount || 0,
            remarks: item.remarks || '',
            is_active: true,
            created_by: 'user',
            updated_by: 'user'
          }));

          const { error: insertError } = await supabase.from('plan_investment_finance').insert(insertData);

          if (insertError) {
            console.error('❌ 데이터 저장 오류:', insertError);
            throw insertError;
          }
        }

        console.log('✅ saveFinanceItems 성공');

        // 캐시 무효화 (최신 데이터 보장)
        const cacheKey = createCacheKey('investment_finance', `id_${investmentId}`);
        sessionStorage.removeItem(cacheKey);

        return true;
      } catch (err) {
        console.error('❌ saveFinanceItems 실패:', err);
        setError(err instanceof Error ? err.message : '금액 항목 저장 실패');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 금액 항목 삭제
  const deleteFinanceItem = useCallback(async (id: number): Promise<boolean> => {
    try {
      console.log('🗑️ deleteFinanceItem 호출:', id);
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('plan_investment_finance')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (deleteError) {
        console.error('❌ 삭제 오류:', deleteError);
        throw deleteError;
      }

      console.log('✅ deleteFinanceItem 성공');
      return true;
    } catch (err) {
      console.error('❌ deleteFinanceItem 실패:', err);
      setError(err instanceof Error ? err.message : '금액 항목 삭제 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getFinanceItems,
    saveFinanceItems,
    deleteFinanceItem,
    loading,
    error
  };
}
