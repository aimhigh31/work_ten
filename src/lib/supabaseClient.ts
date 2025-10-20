import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ 싱글톤 패턴으로 Supabase 클라이언트 관리 (Anon Key 사용 - 보안 개선)
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    console.log('✅ Supabase Anon 클라이언트 싱글톤 생성 (보안 개선)');
  }
  return supabaseInstance;
};

// 기본 export는 Anon 클라이언트
export default getSupabaseClient();
