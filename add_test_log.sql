-- 테스트 변경로그 추가
INSERT INTO common_log_data (
  page,
  record_id,
  action_type,
  description,
  before_value,
  after_value,
  changed_field,
  user_name,
  team,
  created_at
) VALUES (
  'security_education',
  'SEC-EDU-25-009',
  '수정',
  '보안교육관리 "SEC-EDU-25-009" 정보가 개요탭 상태필드가 대기에서 홀딩으로 수정되었습니다.',
  '대기',
  '홀딩',
  '상태',
  '안재식',
  '보안팀',
  NOW()
);
