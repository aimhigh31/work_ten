const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertSampleRevisions() {
  try {
    console.log('🚀 샘플 리비전 데이터 삽입 시작...');

    // security_regulation_data에서 파일 목록 가져오기
    const { data: files, error: filesError } = await supabase
      .from('security_regulation_data')
      .select('*')
      .eq('type', 'file')
      .eq('is_active', true);

    if (filesError) {
      console.error('❌ 파일 목록 조회 실패:', filesError);
      return;
    }

    console.log('📄 파일 목록:', files);

    if (!files || files.length === 0) {
      console.log('⚠️ 파일이 없습니다.');
      return;
    }

    // 각 파일에 대해 샘플 리비전 추가
    for (const file of files) {
      console.log(`\n📝 파일: ${file.name} (id: ${file.id})`);

      // 해당 파일의 리비전 개수 확인
      const { data: existingRevisions, error: revError } = await supabase
        .from('security_regulation_revision')
        .select('*')
        .eq('security_regulation_id', file.id)
        .eq('is_active', true);

      if (revError) {
        console.error('❌ 리비전 조회 실패:', revError);
        continue;
      }

      if (existingRevisions && existingRevisions.length > 0) {
        console.log(`  ✓ 이미 ${existingRevisions.length}개의 리비전이 있습니다. 스킵.`);
        continue;
      }

      // 샘플 리비전 3개 추가
      const sampleRevisions = [
        {
          security_regulation_id: file.id,
          file_name: file.name,
          file_size: '1.2MB',
          file_description: '초기 버전',
          file_path: '',
          revision: 'R1',
          upload_date: '2025-01-15',
          created_by: 'admin',
          updated_by: 'admin'
        },
        {
          security_regulation_id: file.id,
          file_name: file.name,
          file_size: '1.5MB',
          file_description: '일부 내용 수정',
          file_path: '',
          revision: 'R2',
          upload_date: '2025-05-20',
          created_by: 'admin',
          updated_by: 'admin'
        },
        {
          security_regulation_id: file.id,
          file_name: file.name,
          file_size: '1.8MB',
          file_description: '최신 버전 - 보안 정책 업데이트',
          file_path: '',
          revision: 'R3',
          upload_date: '2025-09-01',
          created_by: 'admin',
          updated_by: 'admin'
        }
      ];

      const { data: insertedData, error: insertError } = await supabase
        .from('security_regulation_revision')
        .insert(sampleRevisions)
        .select();

      if (insertError) {
        console.error(`  ❌ 리비전 삽입 실패:`, insertError);
      } else {
        console.log(`  ✅ ${insertedData.length}개 리비전 삽입 성공`);
      }
    }

    console.log('\n✅ 모든 샘플 데이터 삽입 완료');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

insertSampleRevisions();
