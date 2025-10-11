const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertSampleData() {
  try {
    console.log('🔨 샘플 데이터 삽입 시작...');

    // 1. 기존 데이터 확인
    const { data: existingData, error: checkError } = await supabase
      .from('security_regulation_data')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ 테이블 확인 오류:', checkError);
      return;
    }

    if (existingData && existingData.length > 0) {
      console.log('⚠️ 이미 데이터가 존재합니다. 삽입을 건너뜁니다.');
      console.log('📊 기존 데이터 개수:', existingData.length);
      return;
    }

    // 2. 샘플 폴더 데이터
    const folders = [
      {
        type: 'folder',
        name: '정책서',
        path: '/정책서',
        level: 0,
        sort_order: 0,
        is_active: true,
        created_by: 'system',
        updated_by: 'system'
      },
      {
        type: 'folder',
        name: '매뉴얼',
        path: '/매뉴얼',
        level: 0,
        sort_order: 1,
        is_active: true,
        created_by: 'system',
        updated_by: 'system'
      },
      {
        type: 'folder',
        name: '서식',
        path: '/서식',
        level: 0,
        sort_order: 2,
        is_active: true,
        created_by: 'system',
        updated_by: 'system'
      }
    ];

    console.log('📁 폴더 삽입 중...');
    const { data: insertedFolders, error: folderError } = await supabase
      .from('security_regulation_data')
      .insert(folders)
      .select();

    if (folderError) {
      console.error('❌ 폴더 삽입 오류:', folderError);
      return;
    }

    console.log('✅ 폴더 삽입 완료:', insertedFolders.length, '개');

    // 3. 샘플 파일 데이터 (정책서 폴더 안에)
    const policyFolderId = insertedFolders.find(f => f.name === '정책서')?.id;
    const manualFolderId = insertedFolders.find(f => f.name === '매뉴얼')?.id;

    const files = [];

    if (policyFolderId) {
      files.push(
        {
          parent_id: policyFolderId,
          type: 'file',
          name: '보안정책_2024.pdf',
          path: '/정책서/보안정책_2024.pdf',
          level: 1,
          sort_order: 0,
          file_size: '2.4MB',
          file_extension: 'pdf',
          description: '2024년 보안정책 문서',
          document_type: '보안규정',
          status: '작성중',
          code: 'SECDOC-25-001',
          is_active: true,
          created_by: 'system',
          updated_by: 'system'
        },
        {
          parent_id: policyFolderId,
          type: 'file',
          name: '개인정보보호정책.docx',
          path: '/정책서/개인정보보호정책.docx',
          level: 1,
          sort_order: 1,
          file_size: '856KB',
          file_extension: 'docx',
          description: '개인정보보호 정책 문서',
          document_type: '보안지침',
          status: '진행',
          code: 'SECDOC-25-002',
          is_active: true,
          created_by: 'system',
          updated_by: 'system'
        }
      );
    }

    if (manualFolderId) {
      files.push(
        {
          parent_id: manualFolderId,
          type: 'file',
          name: '보안업무가이드.pdf',
          path: '/매뉴얼/보안업무가이드.pdf',
          level: 1,
          sort_order: 0,
          file_size: '3.2MB',
          file_extension: 'pdf',
          description: '보안업무 매뉴얼',
          document_type: '보안매뉴얼',
          status: '승인',
          code: 'SECDOC-25-003',
          is_active: true,
          created_by: 'system',
          updated_by: 'system'
        }
      );
    }

    if (files.length > 0) {
      console.log('📄 파일 삽입 중...');
      const { data: insertedFiles, error: fileError } = await supabase
        .from('security_regulation_data')
        .insert(files)
        .select();

      if (fileError) {
        console.error('❌ 파일 삽입 오류:', fileError);
        return;
      }

      console.log('✅ 파일 삽입 완료:', insertedFiles.length, '개');
    }

    // 4. 최종 확인
    const { data: finalData, error: finalError } = await supabase
      .from('security_regulation_data')
      .select('*');

    if (finalError) {
      console.error('❌ 최종 확인 오류:', finalError);
      return;
    }

    console.log('\n✅ 샘플 데이터 삽입 완료!');
    console.log('📊 총 데이터 개수:', finalData.length);
    console.log('📁 폴더:', finalData.filter(d => d.type === 'folder').length, '개');
    console.log('📄 파일:', finalData.filter(d => d.type === 'file').length, '개');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 실행
insertSampleData();
