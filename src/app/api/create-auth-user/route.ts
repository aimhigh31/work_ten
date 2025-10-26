import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, user_name, department, position, role, user_account_id, phone, country, address, profile_image_url } = body;

    console.log('📥📥📥 [create-auth-user] 받은 body 전체:', body);
    console.log('📥 [create-auth-user] 추출한 필드:', {
      email,
      user_name,
      department,
      position,
      role,
      user_account_id,
      phone,
      country,
      address,
      profile_image_url
    });

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

    console.log('✅ Auth 사용자 생성 성공:', authData.user.id);

    // 🔥 Supabase SDK로 프로필 INSERT (PostgreSQL 직접 연결 대신)
    try {
      // 현재 연도 기반 user_code 생성
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);

      // 해당 연도의 마지막 코드 조회
      const { data: lastCodeData, error: lastCodeError } = await supabaseAdmin
        .from('admin_users_userprofiles')
        .select('user_code')
        .like('user_code', `USER-${yearSuffix}-%`)
        .order('user_code', { ascending: false })
        .limit(1);

      if (lastCodeError) {
        console.error('❌ 마지막 user_code 조회 실패:', lastCodeError);
        throw lastCodeError;
      }

      let newUserCode: string;
      if (lastCodeData && lastCodeData.length > 0) {
        const lastCode = lastCodeData[0].user_code;
        const lastNumber = parseInt(lastCode.split('-')[2], 10);
        const newNumber = String(lastNumber + 1).padStart(3, '0');
        newUserCode = `USER-${yearSuffix}-${newNumber}`;
      } else {
        newUserCode = `USER-${yearSuffix}-001`;
      }

      console.log('📝 [create-auth-user] 생성할 user_code:', newUserCode);

      const insertData = {
        auth_user_id: authData.user.id,
        user_code: newUserCode,
        email: email,
        user_name: user_name || email.split('@')[0],
        department: department || '미지정',
        position: position || '미지정',
        role: role || '일반',
        user_account_id: user_account_id || null,
        phone: phone || null,
        country: country || null,
        address: address || null,
        profile_image_url: profile_image_url || null,
        avatar_url: profile_image_url || null,
        status: 'active',
        created_by: 'system',
        updated_by: 'system'
      };

      console.log('🔄🔄🔄 [create-auth-user] INSERT 데이터:', {
        auth_user_id: insertData.auth_user_id,
        user_code: insertData.user_code,
        email: insertData.email,
        user_name: insertData.user_name,
        department: insertData.department,
        position: insertData.position,
        role: insertData.role,
        user_account_id: insertData.user_account_id,
        phone: insertData.phone,
        country: insertData.country,
        address: insertData.address,
        profile_image_url: insertData.profile_image_url
      });

      const { data: insertedProfile, error: insertError } = await supabaseAdmin
        .from('admin_users_userprofiles')
        .upsert(insertData, {
          onConflict: 'auth_user_id'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ 프로필 INSERT 실패:', insertError);
        console.error('❌ 에러 상세:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw new Error(`프로필 생성 실패: ${insertError.message}`);
      }

      console.log('✅✅✅ [create-auth-user] 프로필 INSERT 완료:', {
        user_code: newUserCode,
        user_name: insertedProfile.user_name,
        department: insertedProfile.department,
        position: insertedProfile.position,
        role: insertedProfile.role,
        user_account_id: insertedProfile.user_account_id,
        phone: insertedProfile.phone,
        country: insertedProfile.country,
        address: insertedProfile.address,
        profile_image_url: insertedProfile.profile_image_url
      });

      // 프로필 조회 성공, insertedProfile 사용
      const userProfile = insertedProfile;

      return NextResponse.json({
        success: true,
        auth_user_id: authData.user.id,
        email: authData.user.email,
        user_profile: userProfile
      });
    } catch (insertError: any) {
      console.error('⚠️ 프로필 INSERT 실패:', insertError);
      console.error('⚠️ 에러 상세:', {
        message: insertError.message,
        code: insertError.code,
        detail: insertError.detail
      });
      // INSERT 실패하면 치명적 오류이므로 예외 발생
      throw new Error(`프로필 생성 실패: ${insertError.message}`);
    }
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
