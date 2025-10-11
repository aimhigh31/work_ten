import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { auth_user_id, new_password } = body;

    if (!auth_user_id || !new_password) {
      return NextResponse.json(
        { error: 'auth_user_id와 new_password는 필수입니다.' },
        { status: 400 }
      );
    }

    // Supabase Admin 클라이언트 생성
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Admin API로 비밀번호 업데이트
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(auth_user_id, {
      password: new_password
    });

    if (error) {
      console.error('비밀번호 변경 오류:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.log('✅ 비밀번호 변경 성공:', auth_user_id);

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    });
  } catch (error: any) {
    console.error('비밀번호 변경 중 오류:', error);
    return NextResponse.json(
      { error: error.message || '비밀번호 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
