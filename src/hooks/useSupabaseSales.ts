import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  SalesRecord,
  SalesRecordDB,
  CreateSalesInput,
  UpdateSalesInput,
  convertSalesFromDB,
  convertSalesToDB
} from '../types/sales';

// Supabase 클라이언트 설정 (RLS 해지 후 ANON_KEY 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase Sales 환경 변수가 설정되지 않았습니다!');
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface UseSupabaseSalesReturn {
  getSales: () => Promise<SalesRecord[]>;
  getSalesById: (id: number) => Promise<SalesRecord | null>;
  createSales: (sales: CreateSalesInput) => Promise<SalesRecord | null>;
  updateSales: (id: number, sales: UpdateSalesInput) => Promise<boolean>;
  deleteSales: (id: number) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export const useSupabaseSales = (): UseSupabaseSalesReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DB에서 모든 매출 데이터 조회 (registration_date 기준 역순정렬)
  const getSales = useCallback(async (): Promise<SalesRecord[]> => {
    try {
      console.log('📞 getSales 호출');
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('plan_sales_data')
        .select('*')
        .order('registration_date', { ascending: false }); // 최신순 정렬

      if (supabaseError) {
        console.log('❌ Supabase 조회 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ getSales 성공:', data?.length || 0, '개');

      // DB 데이터를 프론트엔드 형식으로 변환
      const salesRecords = (data || []).map((dbData: SalesRecordDB) => convertSalesFromDB(dbData));
      return salesRecords;

    } catch (error) {
      console.log('❌ getSales 실패:', error);
      setError(error instanceof Error ? error.message : '매출 데이터 조회 실패');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ID로 특정 매출 조회
  const getSalesById = useCallback(async (id: number): Promise<SalesRecord | null> => {
    try {
      console.log('📞 getSalesById 호출:', id);
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('plan_sales_data')
        .select('*')
        .eq('id', id)
        .single();

      if (supabaseError) {
        console.log('❌ Supabase 조회 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ getSalesById 성공:', data);
      return convertSalesFromDB(data as SalesRecordDB);

    } catch (error) {
      console.log('❌ getSalesById 실패:', error);
      setError(error instanceof Error ? error.message : '매출 데이터 조회 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 새 매출 생성
  const createSales = useCallback(async (
    sales: CreateSalesInput
  ): Promise<SalesRecord | null> => {
    try {
      console.log('🚀 createSales 시작');
      console.log('📝 생성할 매출 데이터:', sales);
      setLoading(true);
      setError(null);

      // 프론트엔드 데이터를 DB 형식으로 변환
      const insertData = {
        registration_date: sales.registrationDate || new Date().toISOString().split('T')[0],
        code: sales.code,
        customer_name: sales.customerName,
        sales_type: sales.salesType,
        status: sales.status || '대기',
        business_unit: sales.businessUnit,
        model_code: sales.modelCode,
        item_code: sales.itemCode,
        item_name: sales.itemName,
        quantity: sales.quantity,
        unit_price: sales.unitPrice,
        total_amount: sales.totalAmount,
        team: sales.team,
        registrant: sales.registrant,
        delivery_date: sales.deliveryDate,
        notes: sales.notes || '',
        contract_date: sales.contractDate || null,
        assignee: sales.assignee || null
      };

      console.log('💾 최종 삽입 데이터:', insertData);

      const { data, error: supabaseError } = await supabase
        .from('plan_sales_data')
        .insert([insertData])
        .select()
        .single();

      if (supabaseError) {
        console.log('❌ Supabase 생성 오류:', supabaseError);
        console.log('❌ 오류 메시지:', supabaseError.message);
        console.log('❌ 오류 코드:', supabaseError.code);
        console.log('❌ 상세 오류:', supabaseError.details);
        setError(`매출 생성 오류: ${supabaseError.message || '알 수 없는 오류'}`);
        return null;
      }

      console.log('✅ createSales 성공:', data);
      return convertSalesFromDB(data as SalesRecordDB);

    } catch (error) {
      console.log('❌ createSales 실패:', error);
      setError(error instanceof Error ? error.message : '매출 생성 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 매출 업데이트
  const updateSales = useCallback(async (
    id: number,
    sales: UpdateSalesInput
  ): Promise<boolean> => {
    try {
      console.log('📞 updateSales 호출:', id);
      console.log('📦 업데이트할 데이터:', sales);
      setLoading(true);
      setError(null);

      // 프론트엔드 형식을 DB 형식으로 변환
      const updateData: Partial<SalesRecordDB> = {};

      if (sales.customerName !== undefined) updateData.customer_name = sales.customerName;
      if (sales.salesType !== undefined) updateData.sales_type = sales.salesType;
      if (sales.status !== undefined) updateData.status = sales.status;
      if (sales.businessUnit !== undefined) updateData.business_unit = sales.businessUnit;
      if (sales.modelCode !== undefined) updateData.model_code = sales.modelCode;
      if (sales.itemCode !== undefined) updateData.item_code = sales.itemCode;
      if (sales.itemName !== undefined) updateData.item_name = sales.itemName;
      if (sales.quantity !== undefined) updateData.quantity = sales.quantity;
      if (sales.unitPrice !== undefined) updateData.unit_price = sales.unitPrice;
      if (sales.totalAmount !== undefined) updateData.total_amount = sales.totalAmount;
      if (sales.team !== undefined) updateData.team = sales.team;
      if (sales.registrant !== undefined) updateData.registrant = sales.registrant;
      if (sales.deliveryDate !== undefined) updateData.delivery_date = sales.deliveryDate;
      if (sales.notes !== undefined) updateData.notes = sales.notes;
      if (sales.contractDate !== undefined) updateData.contract_date = sales.contractDate;
      if (sales.assignee !== undefined) updateData.assignee = sales.assignee;

      console.log('💾 Supabase로 전송할 데이터:', JSON.stringify(updateData, null, 2));

      const { data, error: supabaseError } = await supabase
        .from('plan_sales_data')
        .update(updateData)
        .eq('id', id)
        .select();

      if (supabaseError) {
        console.log('❌ Supabase 업데이트 오류 상세:');
        console.log('  message:', supabaseError.message);
        console.log('  details:', supabaseError.details);
        console.log('  hint:', supabaseError.hint);
        console.log('  code:', supabaseError.code);
        setError(`매출 업데이트 오류: ${supabaseError.message || '알 수 없는 오류'}`);
        return false;
      }

      console.log('✅ 업데이트된 데이터:', data);
      console.log('✅ updateSales 성공');
      return true;

    } catch (error) {
      console.log('❌ updateSales 실패:', error);
      setError(error instanceof Error ? error.message : '매출 업데이트 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 매출 삭제 (hard delete)
  const deleteSales = useCallback(async (id: number): Promise<boolean> => {
    try {
      console.log('📞 deleteSales 호출:', id);
      setLoading(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from('plan_sales_data')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        console.log('❌ Supabase 삭제 오류:', supabaseError);
        setError(`매출 삭제 오류: ${supabaseError.message || '알 수 없는 오류'}`);
        return false;
      }

      console.log('✅ deleteSales 성공');
      return true;

    } catch (error) {
      console.log('❌ deleteSales 실패:', error);
      setError(error instanceof Error ? error.message : '매출 삭제 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getSales,
    getSalesById,
    createSales,
    updateSales,
    deleteSales,
    loading,
    error
  };
};

export default useSupabaseSales;
