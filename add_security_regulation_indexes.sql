-- 보안규정 테이블 성능 최적화를 위한 인덱스 추가
-- 실행일: 2025-10-12
-- 목적: 폴더 트리 조회 성능 개선

-- 1. parent_id 인덱스 추가 (부모-자식 관계 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_security_regulation_parent_id
ON security_regulation(parent_id);

-- 2. sort_order 인덱스 추가 (정렬 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_security_regulation_sort_order
ON security_regulation(sort_order);

-- 3. parent_id + sort_order 복합 인덱스 (트리 조회 시 가장 효율적)
CREATE INDEX IF NOT EXISTS idx_security_regulation_parent_sort
ON security_regulation(parent_id, sort_order);

-- 4. type 인덱스 추가 (폴더/파일 필터링 최적화)
CREATE INDEX IF NOT EXISTS idx_security_regulation_type
ON security_regulation(type);

-- 5. is_active 인덱스 추가 (활성 항목만 조회 시 최적화)
CREATE INDEX IF NOT EXISTS idx_security_regulation_is_active
ON security_regulation(is_active);

-- 인덱스 확인 쿼리
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'security_regulation';

-- 실행 방법:
-- 1. Supabase Dashboard > SQL Editor에서 실행
-- 2. 또는 psql로 실행: psql -h [host] -U postgres -d postgres -f add_security_regulation_indexes.sql
