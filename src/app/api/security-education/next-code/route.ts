import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const currentYear = new Date().getFullYear().toString().slice(-2);
    const codePattern = `SEC-EDU-${currentYear}-%`;

    // 현재 연도의 모든 교육 코드 조회
    const { data, error } = await supabase
      .from('security_education_data')
      .select('code')
      .like('code', codePattern)
      .order('code', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Supabase 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let nextSequence = 1;

    if (data && data.length > 0) {
      // 가장 큰 코드에서 일련번호 추출
      const latestCode = data[0].code;
      const match = latestCode.match(/^SEC-EDU-(\d{2})-(\d{3})$/);
      if (match) {
        const currentMaxSequence = parseInt(match[2], 10);
        nextSequence = currentMaxSequence + 1;
      }
    }

    const newCode = `SEC-EDU-${currentYear}-${nextSequence.toString().padStart(3, '0')}`;

    return NextResponse.json({ code: newCode, year: currentYear, sequence: nextSequence });
  } catch (error: any) {
    console.error('❌ 서버 에러:', error);
    return NextResponse.json({ error: error.message || '서버 오류' }, { status: 500 });
  }
}
