import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // 공개 폼을 위한 anon 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const body = await request.json();
    console.log('📥 제출 받은 데이터:', JSON.stringify(body, null, 2));

    const {
      evaluationId,
      targetPerson,
      department,
      position,
      evaluator,
      evaluatorDepartment,
      evaluatorPosition,
      items
    } = body;

    // 데이터 검증
    if (!targetPerson || !department || !position || !evaluator || !items || items.length === 0) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 총 점수 계산
    const totalScore = items.reduce((sum: number, item: any) => sum + (item.score || 0), 0);

    // Supabase에 데이터 저장
    // 1. 메인 평가 정보 저장
    const { data: evaluationData, error: evaluationError } = await supabase
      .from('hr_evaluation_submissions')
      .insert([
        {
          evaluation_id: evaluationId,
          target_person: targetPerson,
          department: department,
          position: position,
          evaluator: evaluator,
          evaluator_department: evaluatorDepartment,
          evaluator_position: evaluatorPosition,
          submitted_at: new Date().toISOString(),
          total_score: totalScore
        }
      ])
      .select()
      .single();

    if (evaluationError) {
      console.error('❌ 평가 저장 오류:', evaluationError);
      return NextResponse.json({
        error: '평가 저장 중 오류가 발생했습니다.',
        details: evaluationError.message,
        code: evaluationError.code
      }, { status: 500 });
    }

    console.log('✅ 평가 메인 정보 저장 성공:', evaluationData);

    // 2. 평가 상세 항목 저장
    const itemsToInsert = items.map((item: any) => ({
      submission_id: evaluationData.id,
      item_no: item.no,
      major_category: item.major_category,
      sub_category: item.sub_category,
      title: item.title,
      evaluation: item.evaluation,
      score: item.score,
      description: item.description
    }));

    console.log('📝 저장할 항목들:', JSON.stringify(itemsToInsert, null, 2));

    const { error: itemsError } = await supabase
      .from('hr_evaluation_submission_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('❌ 평가 항목 저장 오류:', itemsError);
      return NextResponse.json({
        error: '평가 항목 저장 중 오류가 발생했습니다.',
        details: itemsError.message,
        code: itemsError.code
      }, { status: 500 });
    }

    console.log('✅ 평가 항목 저장 성공');

    return NextResponse.json({
      success: true,
      submissionId: evaluationData.id
    }, { status: 200 });
  } catch (error: any) {
    console.error('❌ 서버 오류:', error);
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}
