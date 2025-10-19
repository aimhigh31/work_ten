import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: '사용자 ID를 입력해주세요.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: '서버 환경변수가 설정되지 않았습니다.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // user_code 또는 user_account_id로 사용자 검색
    const { data: users, error: queryError } = await supabaseAdmin
      .from('admin_users_userprofiles')
      .select('email, status, is_active')
      .or(`user_code.eq.${user_id},user_account_id.eq.${user_id}`)
      .limit(1);

    if (queryError) {
      console.error('사용자 조회 오류:', queryError);
      return NextResponse.json({ error: '사용자 조회 중 오류가 발생했습니다.' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: '존재하지 않는 사용자 ID입니다.' }, { status: 404 });
    }

    const user = users[0];

    // 사용자 상태 확인
    if (!user.is_active || user.status !== 'active') {
      return NextResponse.json({ error: '비활성화된 사용자입니다.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      email: user.email
    });
  } catch (error: any) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
