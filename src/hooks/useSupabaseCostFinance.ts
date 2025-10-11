import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Supabase DB 타입
export interface DbCostFinanceItem {
  id: number;
  cost_id: number;
  item_order: number;
  code: string;
  cost_type: string;
  content: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
}

// Frontend 타입 (AmountDetail)
export interface CostFinanceItem {
  id: string | number;
  code: string;
  costType: string;
  content: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// DB → Frontend 변환
function convertToFrontendData(dbData: DbCostFinanceItem): CostFinanceItem {
  return {
    id: dbData.id,
    code: dbData.code,
    costType: dbData.cost_type,
    content: dbData.content,
    quantity: dbData.quantity,
    unitPrice: dbData.unit_price,
    amount: dbData.amount
  };
}

// Frontend → DB 변환
function convertToDbData(frontendData: Partial<CostFinanceItem>, costId: number, itemOrder: number): Partial<DbCostFinanceItem> {
  return {
    cost_id: costId,
    item_order: itemOrder,
    code: frontendData.code || '',
    cost_type: frontendData.costType || '',
    content: frontendData.content || '',
    quantity: frontendData.quantity || 1,
    unit_price: frontendData.unitPrice || 0,
    amount: frontendData.amount || 0
  };
}

export function useSupabaseCostFinance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 특정 비용의 금액 항목 조회
  const getFinanceItems = useCallback(async (costId: number): Promise<CostFinanceItem[]> => {
    try {
      console.log('📞 getFinanceItems 호출:', costId);
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('main_cost_finance')
        .select('*')
        .eq('cost_id', costId)
        .eq('is_active', true)
        .order('item_order', { ascending: true });

      if (supabaseError) {
        console.error('❌ Supabase 조회 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ getFinanceItems 성공:', data?.length || 0, '개');
      return (data || []).map(convertToFrontendData);

    } catch (err) {
      console.error('❌ getFinanceItems 실패:', err);
      setError(err instanceof Error ? err.message : '금액 항목 조회 실패');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 금액 항목 일괄 저장 (기존 삭제 후 재저장 - data_relation.md 패턴)
  const saveFinanceItems = useCallback(async (
    costId: number,
    items: CostFinanceItem[]
  ): Promise<boolean> => {
    try {
      console.log('💾 saveFinanceItems 호출:', costId, items.length, '개');
      setLoading(true);
      setError(null);

      // 1단계: 기존 데이터 삭제 (물리적 삭제)
      const { error: deleteError } = await supabase
        .from('main_cost_finance')
        .delete()
        .eq('cost_id', costId);

      if (deleteError) {
        console.error('❌ 기존 데이터 삭제 오류:', deleteError);
        throw deleteError;
      }

      console.log('✅ 기존 데이터 삭제 완료');

      // 2단계: 새 데이터 저장 (items가 있을 경우에만)
      if (items.length > 0) {
        const insertData = items.map((item, index) => ({
          cost_id: costId,
          item_order: index + 1,
          code: item.code || '',
          cost_type: item.costType || '',
          content: item.content || '',
          quantity: item.quantity || 1,
          unit_price: item.unitPrice || 0,
          amount: item.amount || 0,
          is_active: true,
          created_by: 'user',
          updated_by: 'user'
        }));

        const { error: insertError } = await supabase
          .from('main_cost_finance')
          .insert(insertData);

        if (insertError) {
          console.error('❌ 데이터 저장 오류:', insertError);
          throw insertError;
        }

        console.log('✅ 새 데이터 저장 완료:', items.length, '개');
      }

      console.log('✅ saveFinanceItems 성공');
      return true;

    } catch (err) {
      console.error('❌ saveFinanceItems 실패:', err);
      setError(err instanceof Error ? err.message : '금액 항목 저장 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 금액 항목 삭제 (단일 항목 - 물리적 삭제)
  const deleteFinanceItem = useCallback(async (id: number): Promise<boolean> => {
    try {
      console.log('🗑️ deleteFinanceItem 호출:', id);
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('main_cost_finance')
        .delete()
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
