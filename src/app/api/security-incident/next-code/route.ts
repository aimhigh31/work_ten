import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const currentYear = new Date().getFullYear().toString().slice(-2);

    // 현재 연도의 모든 보안사고 코드 조회 (SEC-ACC와 SECACC 형식 모두 포함)
    const { data, error } = await supabase
      .from('security_accident_data')
      .select('code')
      .order('code', { ascending: false });

    if (error) {
      console.error('❌ Supabase 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let maxSequence = 0;

    if (data && data.length > 0) {
      // 모든 코드를 확인하고 현재 연도의 최대 일련번호 찾기
      data.forEach((item) => {
        // SEC-ACC-25-XXX 형식
        const match1 = item.code?.match(/^SEC-ACC-(\d{2})-(\d{3})$/);
        if (match1 && match1[1] === currentYear) {
          const seq = parseInt(match1[2], 10);
          if (seq > maxSequence) maxSequence = seq;
        }

        // SECACC-25-XXX 형식 (기존 형식)
        const match2 = item.code?.match(/^SECACC-(\d{2})-(\d{3})$/);
        if (match2 && match2[1] === currentYear) {
          const seq = parseInt(match2[2], 10);
          if (seq > maxSequence) maxSequence = seq;
        }
      });
    }

    const nextSequence = maxSequence + 1;
    const newCode = `SEC-ACC-${currentYear}-${nextSequence.toString().padStart(3, '0')}`;

    return NextResponse.json({ code: newCode, year: currentYear, sequence: nextSequence });
  } catch (error: any) {
    console.error('❌ 서버 에러:', error);
    return NextResponse.json({ error: error.message || '서버 오류' }, { status: 500 });
  }
}
