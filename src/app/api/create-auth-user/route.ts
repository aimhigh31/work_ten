import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// PostgreSQL 연결
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, user_name, department, position, role, user_account_id, phone, country, address, profile_image_url } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: '이메일과 비밀번호는 필수입니다.'
        },
        { status: 400 }
      );
    }

    // 환경변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔍 환경변수 체크:');
    console.log('  SUPABASE_URL:', supabaseUrl ? '설정됨' : '❌ 없음');
    console.log('  SERVICE_ROLE_KEY:', serviceRoleKey ? '설정됨 (길이: ' + serviceRoleKey.length + ')' : '❌ 없음');

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: '서버 환경변수가 설정되지 않았습니다. SUPABASE_SERVICE_ROLE_KEY를 확인하세요.'
        },
        { status: 500 }
      );
    }

    // Supabase Admin 클라이언트 생성 (Service Role Key 사용)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Supabase Auth에 사용자 생성 (Admin API 사용)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 이메일 확인 자동 완료
      user_metadata: {
        user_name: user_name || email.split('@')[0],
        department: department || '미지정',
        position: position || '미지정',
        role: role || '일반'
      }
    });

    if (authError) {
      console.error('Auth 사용자 생성 오류:', authError);
      return NextResponse.json(
        {
          success: false,
          error: authError.message
        },
        { status: 400 }
      );
    }

    // 트리거에 의해 자동으로 admin_users_userprofiles에도 프로필이 생성됨
    console.log('✅ Auth 사용자 생성 성공:', authData.user.id);

    // 추가 필드들을 프로필 테이블에 업데이트
    // 트리거가 프로필을 생성할 시간을 주기 위해 약간의 delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const updateQuery = `
        UPDATE admin_users_userprofiles
        SET
          user_account_id = $1,
          phone = $2,
          country = $3,
          address = $4,
          profile_image_url = $5,
          updated_by = 'system'
        WHERE auth_user_id = $6
      `;

      const updateResult = await pool.query(updateQuery, [
        user_account_id || null,
        phone || null,
        country || null,
        address || null,
        profile_image_url || null,
        authData.user.id
      ]);

      console.log('✅ 프로필 추가 정보 업데이트 완료:', {
        rowsUpdated: updateResult.rowCount,
        user_account_id,
        phone,
        country,
        address
      });
    } catch (updateError) {
      console.error('⚠️ 프로필 추가 정보 업데이트 실패:', updateError);
      // 업데이트 실패해도 사용자 생성은 성공했으므로 계속 진행
    }

    return NextResponse.json({
      success: true,
      auth_user_id: authData.user.id,
      email: authData.user.email
    });
  } catch (error: any) {
    console.error('사용자 생성 중 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '사용자 생성 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
