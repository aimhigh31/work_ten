import { NextRequest, NextResponse } from 'next/server';

// PostgreSQL 연결
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

// PUT: 역할 활성화/비활성화 토글
export async function PUT(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '역할 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    const query = `
      UPDATE admin_users_rules
      SET is_active = NOT is_active,
      updated_by = 'system'
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '역할을 찾을 수 없습니다.'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('역할 상태 변경 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '역할 상태 변경에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
