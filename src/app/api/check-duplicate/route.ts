import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 (Service Role Key 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// POST: 중복 체크
export async function POST(request: NextRequest) {
  try {
    const { type, value, currentUserId } = await request.json();

    console.log('🔍 [check-duplicate] 중복체크 요청:', { type, value, currentUserId });

    if (!type || !value) {
      console.error('❌ [check-duplicate] 필수 파라미터 누락:', { type, value });
      return NextResponse.json(
        {
          success: false,
          error: '체크할 타입과 값이 필요합니다.'
        },
        { status: 400 }
      );
    }

    let count = 0;

    if (type === 'userAccount') {
      // 사용자계정 중복 체크
      console.log('🔍 [check-duplicate] userAccount 중복체크 시작:', value);
      let query = supabase.from('admin_users_userprofiles').select('id', { count: 'exact', head: true }).eq('user_account_id', value);

      if (currentUserId) {
        // 수정 중인 경우 - 자기 자신은 제외
        console.log('🔍 [check-duplicate] 현재 사용자 제외:', currentUserId);
        query = query.neq('id', currentUserId);
      }

      const { count: resultCount, error } = await query;

      if (error) {
        console.error('❌ [check-duplicate] 사용자계정 중복 체크 실패:', error);
        console.error('❌ [check-duplicate] 에러 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      count = resultCount || 0;
      console.log('✅ [check-duplicate] userAccount 중복체크 결과:', { count, isDuplicate: count > 0 });
    } else if (type === 'email') {
      // 이메일 중복 체크
      console.log('🔍 [check-duplicate] email 중복체크 시작:', value);
      let query = supabase.from('admin_users_userprofiles').select('id', { count: 'exact', head: true }).eq('email', value);

      if (currentUserId) {
        // 수정 중인 경우 - 자기 자신은 제외
        console.log('🔍 [check-duplicate] 현재 사용자 제외:', currentUserId);
        query = query.neq('id', currentUserId);
      }

      const { count: resultCount, error } = await query;

      if (error) {
        console.error('❌ [check-duplicate] 이메일 중복 체크 실패:', error);
        console.error('❌ [check-duplicate] 에러 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      count = resultCount || 0;
      console.log('✅ [check-duplicate] email 중복체크 결과:', { count, isDuplicate: count > 0 });
    } else {
      console.error('❌ [check-duplicate] 잘못된 타입:', type);
      return NextResponse.json(
        {
          success: false,
          error: '잘못된 체크 타입입니다.'
        },
        { status: 400 }
      );
    }

    const isDuplicate = count > 0;

    return NextResponse.json({
      success: true,
      isDuplicate,
      message: isDuplicate
        ? type === 'userAccount'
          ? '이미 사용 중인 사용자계정입니다.'
          : '이미 사용 중인 이메일입니다.'
        : type === 'userAccount'
          ? '사용 가능한 사용자계정입니다.'
          : '사용 가능한 이메일입니다.'
    });
  } catch (error: any) {
    console.error('중복 체크 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '중복 체크 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
