// 임시로 API에서 profile_image_url을 완전히 제거하고 테스트

const fs = require('fs');
const path = require('path');

const apiFilePath = path.join(__dirname, 'src', 'app', 'api', 'users', 'route.ts');

// 기본적인 사용자 수정만 가능하도록 임시 수정
const tempApiCode = `import { NextRequest, NextResponse } from 'next/server';

// PostgreSQL 연결
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

// GET: 사용자 목록 조회
export async function GET() {
  try {
    const query = \`
      SELECT * FROM admin_users_userprofiles
      ORDER BY created_at DESC
    \`;

    const result = await pool.query(query);

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '사용자 목록을 불러오는데 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// POST: 사용자 생성
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();

    const query = \`
      INSERT INTO admin_users_userprofiles (
        user_code, user_name, email, department, position, role, status, phone, hire_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    \`;

    const values = [
      userData.user_code,
      userData.user_name,
      userData.email,
      userData.department,
      userData.position,
      userData.role || 'user',
      userData.status || 'active',
      userData.phone,
      userData.hire_date
    ];

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('사용자 생성 실패:', error);

    let errorMessage = '사용자 생성에 실패했습니다.';
    if (error.code === '23505') {
      errorMessage = '이미 존재하는 사용자 코드 또는 이메일입니다.';
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

// PUT: 사용자 수정 (임시로 profile_image_url 제외)
export async function PUT(request: NextRequest) {
  try {
    const userData = await request.json();

    const query = \`
      UPDATE admin_users_userprofiles
      SET
        user_code = $1,
        user_name = $2,
        email = $3,
        department = $4,
        position = $5,
        role = $6,
        status = $7,
        phone = $8,
        hire_date = $9,
        updated_by = 'system'
      WHERE id = $10
      RETURNING *
    \`;

    const values = [
      userData.user_code,
      userData.user_name,
      userData.email,
      userData.department,
      userData.position,
      userData.role,
      userData.status,
      userData.phone,
      userData.hire_date,
      userData.id
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '수정할 사용자를 찾을 수 없습니다.'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('사용자 수정 실패:', error);

    let errorMessage = '사용자 수정에 실패했습니다.';
    if (error.code === '23505') {
      errorMessage = '이미 존재하는 사용자 코드 또는 이메일입니다.';
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

// DELETE: 사용자 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    const query = 'DELETE FROM admin_users_userprofiles WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '삭제할 사용자를 찾을 수 없습니다.'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '사용자가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('사용자 삭제 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '사용자 삭제에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
`;

try {
  // 백업 생성
  const backupPath = apiFilePath + '.backup';
  const originalContent = fs.readFileSync(apiFilePath, 'utf8');
  fs.writeFileSync(backupPath, originalContent);
  console.log('✅ 원본 파일 백업 완료:', backupPath);

  // 임시 수정
  fs.writeFileSync(apiFilePath, tempApiCode);
  console.log('✅ API 파일 임시 수정 완료');
  console.log('🔧 profile_image_url 처리를 제거하여 기본 사용자 수정 기능만 활성화');
  console.log('');
  console.log('테스트 후 복원하려면:');
  console.log('  cp src/app/api/users/route.ts.backup src/app/api/users/route.ts');

} catch (error) {
  console.error('❌ 파일 수정 실패:', error.message);
}