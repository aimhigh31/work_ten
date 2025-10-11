const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
const client = new Client({ connectionString });

async function createVocTable() {
  try {
    await client.connect();
    console.log("✅ PostgreSQL 연결 성공");

    // 기존 테이블 삭제 (있는 경우)
    console.log("🗑️ 기존 테이블 확인 및 삭제...");
    await client.query(`DROP TABLE IF EXISTS it_voc_data CASCADE`);

    // 테이블 생성
    console.log("📋 it_voc_data 테이블 생성 중...");
    await client.query(`
      CREATE TABLE it_voc_data (
        id SERIAL PRIMARY KEY,
        no INTEGER NOT NULL DEFAULT 1,
        
        -- 기본 정보
        registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
        reception_date DATE,
        customer_name VARCHAR(100),
        company_name VARCHAR(200),
        
        -- VOC 유형 및 내용
        voc_type VARCHAR(50),
        channel VARCHAR(50),
        title VARCHAR(500) NOT NULL,
        content TEXT,
        
        -- 처리 정보
        team VARCHAR(100),
        assignee VARCHAR(100),
        status VARCHAR(50) DEFAULT '접수',
        priority VARCHAR(20) DEFAULT '보통',
        
        -- 응대 정보
        response_content TEXT,
        resolution_date DATE,
        satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
        
        -- 파일 첨부
        attachments JSONB DEFAULT '[]'::jsonb,
        
        -- 시스템 필드
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by VARCHAR(100) DEFAULT 'system',
        updated_by VARCHAR(100) DEFAULT 'system',
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    console.log("✅ 테이블 생성 완료!");

    // 인덱스 생성
    console.log("📑 인덱스 생성 중...");
    await client.query(`CREATE INDEX idx_voc_registration_date ON it_voc_data(registration_date DESC)`);
    await client.query(`CREATE INDEX idx_voc_status ON it_voc_data(status)`);
    await client.query(`CREATE INDEX idx_voc_assignee ON it_voc_data(assignee)`);
    await client.query(`CREATE INDEX idx_voc_is_active ON it_voc_data(is_active)`);

    // 샘플 데이터 삽입
    console.log("📝 샘플 데이터 삽입 중...");
    const sampleData = [
      {
        no: 1,
        registration_date: "2024-01-15",
        reception_date: "2024-01-15",
        customer_name: "김고객",
        company_name: "삼성전자",
        voc_type: "불만",
        channel: "전화",
        title: "시스템 로그인 오류 문의",
        content: "로그인 시도시 계속 오류가 발생합니다. 비밀번호를 정확히 입력했는데도 접속이 안됩니다.",
        team: "IT지원팀",
        assignee: "이지원",
        status: "처리중",
        priority: "높음",
        response_content: "고객님의 계정을 확인중입니다. 임시 비밀번호를 발급해드리겠습니다.",
        satisfaction_score: 4
      },
      {
        no: 2,
        registration_date: "2024-01-16",
        reception_date: "2024-01-16",
        customer_name: "박민수",
        company_name: "LG전자",
        voc_type: "개선요청",
        channel: "이메일",
        title: "대시보드 UI 개선 요청",
        content: "대시보드에서 차트가 너무 작아서 잘 안보입니다. 크기 조절 기능을 추가해주세요.",
        team: "개발팀",
        assignee: "김개발",
        status: "접수",
        priority: "보통"
      },
      {
        no: 3,
        registration_date: "2024-01-17",
        reception_date: "2024-01-17",
        customer_name: "이영희",
        company_name: "현대자동차",
        voc_type: "문의",
        channel: "채팅",
        title: "신규 기능 사용법 문의",
        content: "최근 업데이트된 보고서 생성 기능을 어떻게 사용하는지 알려주세요.",
        team: "고객지원팀",
        assignee: "최상담",
        status: "완료",
        priority: "낮음",
        response_content: "사용 매뉴얼을 이메일로 발송해드렸습니다. 추가 문의사항이 있으시면 연락주세요.",
        resolution_date: "2024-01-18",
        satisfaction_score: 5
      },
      {
        no: 4,
        registration_date: "2024-01-18",
        reception_date: "2024-01-18",
        customer_name: "정대리",
        company_name: "SK텔레콤",
        voc_type: "칭찬",
        channel: "방문",
        title: "신속한 처리에 감사드립니다",
        content: "어제 문의드린 건에 대해 빠르게 처리해주셔서 감사합니다. 서비스가 매우 만족스럽습니다.",
        team: "고객지원팀",
        assignee: "최상담",
        status: "완료",
        priority: "낮음",
        resolution_date: "2024-01-18",
        satisfaction_score: 5
      },
      {
        no: 5,
        registration_date: "2024-01-19",
        reception_date: "2024-01-19",
        customer_name: "최과장",
        company_name: "네이버",
        voc_type: "불만",
        channel: "전화",
        title: "데이터 동기화 오류",
        content: "모바일 앱과 웹 버전의 데이터가 동기화되지 않습니다.",
        team: "개발팀",
        assignee: "박개발",
        status: "처리중",
        priority: "긴급"
      }
    ];

    for (const data of sampleData) {
      await client.query(`
        INSERT INTO it_voc_data (
          no, registration_date, reception_date, customer_name, company_name,
          voc_type, channel, title, content, team, assignee, status, priority,
          response_content, resolution_date, satisfaction_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        data.no, data.registration_date, data.reception_date, data.customer_name, 
        data.company_name, data.voc_type, data.channel, data.title, data.content,
        data.team, data.assignee, data.status, data.priority, data.response_content,
        data.resolution_date, data.satisfaction_score
      ]);
    }

    console.log("✅ 샘플 데이터 삽입 완료!");

    // RLS 비활성화 (요청에 따라)
    console.log("🔓 RLS 비활성화 중...");
    await client.query(`ALTER TABLE it_voc_data DISABLE ROW LEVEL SECURITY`);
    
    console.log("🎉 it_voc_data 테이블 생성 및 설정 완료!");

  } catch (error) {
    console.error("❌ 오류 발생:", error.message);
    console.error("상세:", error);
  } finally {
    await client.end();
  }
}

createVocTable();
