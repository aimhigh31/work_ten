-- admin_checklist_editor 테이블 생성
CREATE TABLE admin_checklist_editor (
    id BIGSERIAL PRIMARY KEY,
    checklist_id BIGINT NOT NULL,
    no INTEGER NOT NULL,
    major_category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    evaluation VARCHAR(50) DEFAULT '대기',
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system',
    is_active BOOLEAN DEFAULT true,

    -- 외래키 제약조건
    CONSTRAINT fk_checklist_editor_checklist
        FOREIGN KEY (checklist_id)
        REFERENCES admin_checklist_data(id)
        ON DELETE CASCADE,

    -- 체크 제약조건
    CONSTRAINT chk_evaluation
        CHECK (evaluation IN ('대기', '진행', '완료', '보류', '불가')),

    CONSTRAINT chk_score
        CHECK (score >= 0 AND score <= 100)
);

-- 인덱스 생성
CREATE INDEX idx_checklist_editor_checklist_id ON admin_checklist_editor(checklist_id);
CREATE INDEX idx_checklist_editor_no ON admin_checklist_editor(checklist_id, no);

-- RLS 활성화
ALTER TABLE admin_checklist_editor ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "Allow all operations on admin_checklist_editor"
    ON admin_checklist_editor FOR ALL
    USING (true)
    WITH CHECK (true);

-- 샘플 데이터 삽입
INSERT INTO admin_checklist_editor (checklist_id, no, major_category, sub_category, title, description, evaluation, score) VALUES
(1, 1, '보안', '접근통제', '시스템 권한 점검', '시스템 사용자 권한이 적절히 설정되어 있는지 확인', '대기', 0),
(1, 2, '보안', '패스워드', '패스워드 정책 점검', '패스워드 복잡성 및 변경 주기 확인', '대기', 0),
(1, 3, '시스템', '백업', '데이터 백업 상태', '정기적인 백업 수행 여부 확인', '대기', 0),
(2, 1, '네트워크', '방화벽', '방화벽 설정 검토', '불필요한 포트 및 서비스 차단 확인', '대기', 0),
(2, 2, '네트워크', '모니터링', '트래픽 모니터링', '네트워크 트래픽 이상 여부 모니터링', '대기', 0),
(4, 1, '보안', '라이선스', '라이선스 점검', '소프트웨어 라이선스 만료일 확인', '대기', 0),
(4, 2, '보안', '정책', '보안 정책 준수', '회사 보안 정책 준수 여부 확인', '대기', 0);