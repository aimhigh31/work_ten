import { NextRequest, NextResponse } from 'next/server';

// PostgreSQL 연결
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

// PUT: 사용자 상태 토글
export async function PUT(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    const query = `
      UPDATE admin_users_userprofiles
      SET status = CASE
        WHEN status = 'active' THEN 'inactive'
        ELSE 'active'
      END,
      updated_by = 'system'
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자를 찾을 수 없습니다.'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('사용자 상태 변경 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '사용자 상태 변경에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
