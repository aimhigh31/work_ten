import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

// 싱글톤 패턴으로 Supabase 클라이언트 관리 (Service Role Key 사용)
let supabaseServiceInstance: SupabaseClient | null = null;

export const getSupabaseServiceClient = (): SupabaseClient => {
  if (!supabaseServiceInstance) {
    supabaseServiceInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log('✅ Supabase Service Role 클라이언트 싱글톤 생성');
  }
  return supabaseServiceInstance;
};

// 기본 export는 Service Role 클라이언트
export default getSupabaseServiceClient();
