// 공통 파일 관리 타입 정의

export interface FileData {
  id: string;
  page: string; // 페이지 식별자 (예: 'security_education', 'it_education')
  record_id: string; // 해당 페이지의 레코드 ID
  file_name: string; // 파일명
  file_url: string; // Storage URL
  file_size?: number; // 파일 크기 (bytes)
  file_type?: string; // MIME type
  user_id?: string; // 업로드한 사용자 ID
  user_name?: string; // 업로드한 사용자명
  team?: string; // 팀
  created_at: string; // 생성일시
  metadata?: Record<string, any>; // 추가 메타데이터 (JSON)
}

export interface CreateFileInput {
  page: string;
  record_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  user_id?: string;
  user_name?: string;
  team?: string;
  metadata?: Record<string, any>;
}

export interface UpdateFileInput {
  file_name?: string;
  metadata?: Record<string, any>;
}
