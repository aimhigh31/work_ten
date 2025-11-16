import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { InvestmentData, DbInvestmentData } from '../types/investment';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// Supabase 클라이언트 설정 (RLS 해지 후 ANON_KEY 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 캐시 키
const CACHE_KEY = createCacheKey('investment', 'data');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase Investment 환경 변수가 설정되지 않았습니다!');
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface UseSupabaseInvestmentReturn {
  investments: DbInvestmentData[];
  getInvestments: () => Promise<DbInvestmentData[]>;
  getInvestmentById: (id: number) => Promise<DbInvestmentData | null>;
  createInvestment: (investment: Omit<DbInvestmentData, 'id' | 'created_at' | 'updated_at'>) => Promise<DbInvestmentData | null>;
  updateInvestment: (id: number, investment: Partial<DbInvestmentData>) => Promise<DbInvestmentData | null>;
  deleteInvestment: (id: number) => Promise<boolean>;
  convertToInvestmentData: (dbData: DbInvestmentData) => InvestmentData;
  convertToDbInvestmentData: (frontendData: InvestmentData) => Omit<DbInvestmentData, 'id' | 'created_at' | 'updated_at'>;
  loading: boolean;
  error: string | null;
}

export const useSupabaseInvestment = (): UseSupabaseInvestmentReturn => {
  const [investments, setInvestments] = useState<DbInvestmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DB에서 모든 투자 데이터 조회 (created_at 기준 역순정렬)
  const getInvestments = useCallback(async (): Promise<DbInvestmentData[]> => {
    // 1. 캐시 확인 (캐시가 있으면 즉시 반환)
    const cachedData = loadFromCache<DbInvestmentData[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [Investment] 캐시 데이터 반환 (깜빡임 방지)');
      setInvestments(cachedData); // ✅ 캐시 데이터로 상태 업데이트 (KPI 패턴)
      return cachedData;
    }

    try {
      console.log('📞 getInvestments 호출');
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('plan_investment_data')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }); // 최신순 정렬

      if (supabaseError) {
        console.log('❌ Supabase 조회 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ getInvestments 성공:', data?.length || 0, '개');

      // 2. 상태 업데이트 (KPI 패턴)
      setInvestments(data || []);

      // 3. 캐시에 저장
      saveToCache(CACHE_KEY, data || []);

      return data || [];
    } catch (error) {
      console.log('❌ getInvestments 실패:', error);
      setError(error instanceof Error ? error.message : '투자 데이터 조회 실패');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ID로 특정 투자 조회
  const getInvestmentById = useCallback(async (id: number): Promise<DbInvestmentData | null> => {
    try {
      console.log('📞 getInvestmentById 호출:', id);
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('plan_investment_data')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (supabaseError) {
        console.log('❌ Supabase 조회 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ getInvestmentById 성공:', data);
      return data;
    } catch (error) {
      console.log('❌ getInvestmentById 실패:', error);
      setError(error instanceof Error ? error.message : '투자 데이터 조회 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 새 투자 생성
  const createInvestment = useCallback(
    async (investment: Omit<DbInvestmentData, 'id' | 'created_at' | 'updated_at'>): Promise<DbInvestmentData | null> => {
      try {
        console.log('🚀 createInvestment 시작');
        console.log('📝 생성할 투자 데이터:', investment);
        setLoading(true);
        setError(null);

        const insertData = {
          ...investment,
          no: null, // DB에서 자동으로 관리
          attachments: investment.attachments || [],
          created_by: investment.created_by || 'system',
          updated_by: investment.updated_by || 'system',
          is_active: investment.is_active !== undefined ? investment.is_active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('💾 최종 삽입 데이터:', insertData);

        const { data, error: supabaseError } = await supabase.from('plan_investment_data').insert([insertData]).select().single();

        if (supabaseError) {
          console.error('❌ Supabase 생성 오류:', supabaseError);
          console.error('❌ 오류 메시지:', supabaseError.message);
          console.error('❌ 오류 코드:', supabaseError.code);
          console.error('❌ 상세 오류:', supabaseError.details);
          console.error('❌ 힌트:', supabaseError.hint);
          console.error('❌ 전체 오류 객체:', JSON.stringify(supabaseError, null, 2));
          setError(`투자 생성 오류: ${supabaseError.message || '알 수 없는 오류'}`);
          throw new Error(`Supabase 투자 생성 실패: ${supabaseError.message || '알 수 없는 오류'}`);
        }

        if (!data) {
          console.error('❌ createInvestment: 데이터가 반환되지 않았습니다');
          throw new Error('투자 데이터가 생성되었지만 반환되지 않았습니다.');
        }

        console.log('✅ createInvestment 성공:', data);
        console.log('✅ 생성된 투자 ID:', data.id);

        // ✅ 로컬 상태 즉시 업데이트 (KPI 패턴)
        setInvestments((prev) => [data, ...prev]);

        // 캐시 무효화 (최신 데이터 보장)
        sessionStorage.removeItem(CACHE_KEY);

        return data;
      } catch (error) {
        console.error('❌ createInvestment 실패:', error);
        console.error('❌ 에러 타입:', typeof error);
        console.error('❌ 에러 상세:', error instanceof Error ? error.message : String(error));
        setError(error instanceof Error ? error.message : '투자 생성 실패');
        throw error; // 에러를 다시 던져서 호출하는 쪽에서 처리하도록
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 투자 업데이트
  const updateInvestment = useCallback(async (id: number, investment: Partial<DbInvestmentData>): Promise<DbInvestmentData | null> => {
    try {
      console.log('📞 updateInvestment 호출:', id);
      console.log('📦 업데이트할 데이터:', investment);
      setLoading(true);
      setError(null);

      const updateData = {
        ...investment,
        updated_at: new Date().toISOString()
      };

      console.log('💾 Supabase로 전송할 데이터:', JSON.stringify(updateData, null, 2));

      const { data, error: supabaseError } = await supabase
        .from('plan_investment_data')
        .update(updateData)
        .eq('id', id)
        .eq('is_active', true)
        .select()
        .single();

      if (supabaseError) {
        console.error('❌ Supabase 업데이트 오류 상세:');
        console.error('  message:', supabaseError.message);
        console.error('  details:', supabaseError.details);
        console.error('  hint:', supabaseError.hint);
        console.error('  code:', supabaseError.code);
        console.error('  전체 오류 객체:', JSON.stringify(supabaseError, null, 2));
        setError(`투자 업데이트 오류: ${supabaseError.message || '알 수 없는 오류'}`);
        throw new Error(`Supabase 투자 업데이트 실패: ${supabaseError.message || '알 수 없는 오류'}`);
      }

      if (!data) {
        console.error('❌ updateInvestment: 데이터가 반환되지 않았습니다');
        throw new Error('업데이트된 데이터가 반환되지 않았습니다.');
      }

      console.log('✅ 업데이트된 데이터:', data);
      console.log('✅ 업데이트된 투자 ID:', data.id);
      console.log('✅ updateInvestment 성공');

      // ✅ 로컬 상태 즉시 업데이트 (KPI 패턴)
      setInvestments((prev) => prev.map((inv) => (inv.id === id ? data : inv)));

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return data;
    } catch (error) {
      console.error('❌ updateInvestment 실패:', error);
      console.error('❌ 에러 타입:', typeof error);
      console.error('❌ 에러 상세:', error instanceof Error ? error.message : String(error));
      setError(error instanceof Error ? error.message : '투자 업데이트 실패');
      throw error; // 에러를 다시 던져서 호출하는 쪽에서 처리하도록
    } finally {
      setLoading(false);
    }
  }, []);

  // 투자 삭제 (soft delete)
  const deleteInvestment = useCallback(async (id: number): Promise<boolean> => {
    try {
      console.log('📞 deleteInvestment 호출:', id);
      setLoading(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from('plan_investment_data')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (supabaseError) {
        console.log('❌ Supabase 삭제 오류:', supabaseError);
        setError(`투자 삭제 오류: ${supabaseError.message || '알 수 없는 오류'}`);
        return false;
      }

      console.log('✅ deleteInvestment 성공');

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return true;
    } catch (error) {
      console.log('❌ deleteInvestment 실패:', error);
      setError(error instanceof Error ? error.message : '투자 삭제 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // DB 데이터를 프론트엔드 형식으로 변환
  const convertToInvestmentData = useCallback((dbData: DbInvestmentData): InvestmentData => {
    // attachments가 객체 형태이면 description과 files를 분리
    let description = '';
    let attachments: string[] = [];

    if (dbData.attachments && typeof dbData.attachments === 'object') {
      if ((dbData.attachments as any).description) {
        description = (dbData.attachments as any).description;
      }
      if ((dbData.attachments as any).files && Array.isArray((dbData.attachments as any).files)) {
        attachments = (dbData.attachments as any).files;
      }
    } else if (Array.isArray(dbData.attachments)) {
      // 기존 방식 (배열 형태)
      attachments = dbData.attachments;
    }

    return {
      id: dbData.id,
      no: dbData.no,
      registrationDate: dbData.registration_date,
      code: dbData.code,
      investmentType: dbData.investment_type,
      investmentName: dbData.investment_name,
      description: description,
      amount: dbData.amount,
      team: dbData.team,
      assignee: dbData.assignee || '',
      status: dbData.status,
      startDate: dbData.start_date || '',
      completedDate: dbData.completed_date || '',
      expectedReturn: dbData.expected_return,
      actualReturn: dbData.actual_return,
      riskLevel: dbData.risk_level,
      attachments: attachments,
      createdBy: dbData.created_by // 데이터 생성자 (권한 체크용)
    };
  }, []);

  // 프론트엔드 데이터를 DB 형식으로 변환
  const convertToDbInvestmentData = useCallback(
    (frontendData: InvestmentData): Omit<DbInvestmentData, 'id' | 'created_at' | 'updated_at'> => {
      // description과 files를 attachments 객체로 결합
      const attachmentsData = {
        description: frontendData.description || '',
        files: frontendData.attachments || []
      };

      const dbData = {
        no: null, // DB에는 null로 저장 (프론트엔드에서 역순정렬로 관리)
        registration_date: frontendData.registrationDate || new Date().toISOString().split('T')[0],
        code: frontendData.code || '',
        investment_type: frontendData.investmentType || '',
        investment_name: frontendData.investmentName || '',
        amount: frontendData.amount || 0,
        team: frontendData.team || '',
        assignee: frontendData.assignee || null,
        status: frontendData.status || '대기',
        start_date: frontendData.startDate || frontendData.registrationDate || null,
        completed_date: frontendData.completedDate || null,
        expected_return: frontendData.expectedReturn || 0,
        actual_return: frontendData.actualReturn || null,
        risk_level: frontendData.riskLevel || '보통',
        attachments: attachmentsData as any,
        created_by: 'system',
        updated_by: 'system',
        is_active: true
      };

      console.log('🔄 convertToDbInvestmentData 결과:', dbData);
      return dbData;
    },
    []
  );

  return {
    investments,
    getInvestments,
    getInvestmentById,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    convertToInvestmentData,
    convertToDbInvestmentData,
    loading,
    error
  };
};

export default useSupabaseInvestment;
