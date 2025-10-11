import { NextRequest, NextResponse } from 'next/server';

// PostgreSQL 연결
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

// GET: 역할 목록 조회
export async function GET() {
  try {
    const query = `
      SELECT * FROM admin_users_rules
      ORDER BY created_at DESC, id DESC
    `;

    const result = await pool.query(query);

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('역할 목록 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '역할 목록을 불러오는데 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// POST: 역할 생성
export async function POST(request: NextRequest) {
  try {
    const roleData = await request.json();

    const query = `
      INSERT INTO admin_users_rules (
        role_code, role_name, role_description, permissions, display_order
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      roleData.role_code,
      roleData.role_name,
      roleData.role_description,
      JSON.stringify(roleData.permissions || {}),
      roleData.display_order || 0
    ];

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('역할 생성 실패:', error);

    let errorMessage = '역할 생성에 실패했습니다.';
    if (error.code === '23505') {
      errorMessage = '이미 존재하는 역할 코드입니다.';
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

// PUT: 역할 수정
export async function PUT(request: NextRequest) {
  try {
    const roleData = await request.json();

    const query = `
      UPDATE admin_users_rules
      SET
        role_code = $1,
        role_name = $2,
        role_description = $3,
        permissions = $4,
        display_order = $5,
        updated_by = 'system'
      WHERE id = $6
      RETURNING *
    `;

    const values = [
      roleData.role_code,
      roleData.role_name,
      roleData.role_description,
      JSON.stringify(roleData.permissions || {}),
      roleData.display_order,
      roleData.id
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '수정할 역할을 찾을 수 없습니다.'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('역할 수정 실패:', error);

    let errorMessage = '역할 수정에 실패했습니다.';
    if (error.code === '23505') {
      errorMessage = '이미 존재하는 역할 코드입니다.';
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

// DELETE: 역할 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '역할 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    // 시스템 기본 역할인지 확인
    const systemCheck = await pool.query('SELECT is_system FROM admin_users_rules WHERE id = $1', [id]);

    if (systemCheck.rows.length > 0 && systemCheck.rows[0].is_system) {
      return NextResponse.json(
        {
          success: false,
          error: '시스템 기본 역할은 삭제할 수 없습니다.'
        },
        { status: 400 }
      );
    }

    const query = 'DELETE FROM admin_users_rules WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '삭제할 역할을 찾을 수 없습니다.'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '역할이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('역할 삭제 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '역할 삭제에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
