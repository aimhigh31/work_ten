import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase-types';

// 환경변수가 없을 때 기본값 설정 (클라이언트 사이드 빌드 문제 해결)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NTYwMDksImV4cCI6MjA3MzIzMjAwOX0.zTU0q24c72ewx8DKHqD5lUB1VuuuwBY0jLzWel9DIME';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing. Using default values.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// 서버사이드용 클라이언트 (Service Role Key 사용) - 서버사이드에서만 사용
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

export const supabaseAdmin =
  typeof window === 'undefined'
    ? createClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null;

export default supabase;
