const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertInitialData() {
  console.log('📝 초기 데이터 삽입 중...');

  const { Client } = require('pg');
  const connectionString = `postgresql://postgres.njbwafbxifebclvkkzke:Coding74!@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;

  const client = new Client({ connectionString });
  await client.connect();

  try {
    // 기존 데이터 삭제
    await client.query('DELETE FROM security_regulation_data');
    console.log('🗑️ 기존 데이터 삭제 완료');

    // GROUP007 서브코드 기반 폴더 구조 생성
    const folders = [
      { name: '보안규정', document_type: '보안규정', sort_order: 1 },
      { name: '보안지침', document_type: '보안지침', sort_order: 2 },
      { name: '보안매뉴얼', document_type: '보안매뉴얼', sort_order: 3 }
    ];

    const folderIds = {};

    // 폴더 생성
    for (const folder of folders) {
      const insertFolderSQL = `
        INSERT INTO security_regulation_data
        (type, name, path, level, document_type, sort_order, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;

      const result = await client.query(insertFolderSQL, [
        'folder',
        folder.name,
        `/${folder.name}`,
        0,
        folder.document_type,
        folder.sort_order,
        'system',
        'system'
      ]);

      folderIds[folder.name] = result.rows[0].id;
      console.log(`📁 폴더 생성: ${folder.name} (ID: ${result.rows[0].id})`);
    }

    // 각 폴더에 샘플 파일 추가
    const sampleFiles = [
      {
        parent: '보안규정',
        files: [
          {
            name: '정보보안 기본 규정.pdf',
            code: 'SEC-REG-001',
            status: '승인',
            assignee: '김개발자',
            description: '회사 전체 정보보안 기본 규정 문서',
            revision: 'v1.2',
            revision_date: '2025-01-15'
          },
          {
            name: '개인정보보호 규정.pdf',
            code: 'SEC-REG-002',
            status: '검토중',
            assignee: '이기획자',
            description: '개인정보 처리 및 보호에 관한 규정',
            revision: 'v2.0',
            revision_date: '2025-01-20'
          }
        ]
      },
      {
        parent: '보안지침',
        files: [
          {
            name: '비밀번호 관리 지침.docx',
            code: 'SEC-GUIDE-001',
            status: '승인',
            assignee: '박디자이너',
            description: '시스템 비밀번호 설정 및 관리 지침',
            revision: 'v1.0',
            revision_date: '2025-01-10'
          },
          {
            name: '외부저장매체 관리 지침.docx',
            code: 'SEC-GUIDE-002',
            status: '작성중',
            assignee: '최마케터',
            description: 'USB 등 외부저장매체 사용 통제 지침',
            revision: 'v0.9',
            revision_date: '2025-01-18'
          }
        ]
      },
      {
        parent: '보안매뉴얼',
        files: [
          {
            name: '보안사고 대응 매뉴얼.pptx',
            code: 'SEC-MAN-001',
            status: '승인',
            assignee: '안재식',
            description: '보안사고 발생 시 대응 절차 매뉴얼',
            revision: 'v3.1',
            revision_date: '2025-01-12'
          }
        ]
      }
    ];

    // 파일 삽입
    for (const folderData of sampleFiles) {
      const parentId = folderIds[folderData.parent];

      for (const file of folderData.files) {
        const fileExtension = file.name.split('.').pop();
        const fileSize = Math.floor(Math.random() * 5000) + 100 + ' KB';

        const insertFileSQL = `
          INSERT INTO security_regulation_data
          (parent_id, type, name, path, level, file_size, file_extension,
           description, document_type, status, assignee, code, revision, revision_date,
           created_by, updated_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `;

        await client.query(insertFileSQL, [
          parentId,
          'file',
          file.name,
          `/${folderData.parent}/${file.name}`,
          1,
          fileSize,
          fileExtension,
          file.description,
          folderData.parent,
          file.status,
          file.assignee,
          file.code,
          file.revision,
          file.revision_date,
          'system',
          'system'
        ]);

        console.log(`  📄 파일 생성: ${file.name}`);
      }
    }

    console.log('\n✅ 초기 데이터 삽입 완료!');

    // 데이터 확인
    const countResult = await client.query('SELECT COUNT(*) FROM security_regulation_data');
    console.log(`📊 총 ${countResult.rows[0].count}개 레코드 생성됨`);

    const folderCount = await client.query("SELECT COUNT(*) FROM security_regulation_data WHERE type = 'folder'");
    console.log(`  - 폴더: ${folderCount.rows[0].count}개`);

    const fileCount = await client.query("SELECT COUNT(*) FROM security_regulation_data WHERE type = 'file'");
    console.log(`  - 파일: ${fileCount.rows[0].count}개`);

  } catch (error) {
    console.error('❌ 데이터 삽입 실패:', error);
  } finally {
    await client.end();
    console.log('✅ 데이터베이스 연결 종료');
  }
}

insertInitialData();