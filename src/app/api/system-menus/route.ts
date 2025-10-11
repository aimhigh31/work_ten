import { NextRequest, NextResponse } from 'next/server';

// PostgreSQL 연결
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

// GET: 시스템 메뉴 목록 조회
export async function GET() {
  try {
    const query = `
      SELECT * FROM admin_systemsetting_menu
      ORDER BY display_order ASC, menu_level ASC, id ASC
    `;

    const result = await pool.query(query);

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('시스템 메뉴 목록 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '시스템 메뉴 목록을 불러오는데 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// PUT: 메뉴 권한 업데이트
export async function PUT(request: NextRequest) {
  try {
    const { menuId, permissions } = await request.json();

    if (!menuId) {
      return NextResponse.json(
        {
          success: false,
          error: '메뉴 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    const query = `
      UPDATE admin_systemsetting_menu
      SET permissions = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [JSON.stringify(permissions), menuId]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '메뉴를 찾을 수 없습니다.'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('메뉴 권한 업데이트 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '메뉴 권한 업데이트에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
