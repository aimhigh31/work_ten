# Nexwork Supabase 데이터베이스 구조 분석 보고서

**분석 일시:** 2025-10-10
**총 테이블 수:** 37개
**총 레코드 수:** 약 788개

---

## 📊 1. 전체 개요

### 1.1 카테고리별 통계

| 카테고리 | 테이블 수 | 총 레코드 수 | 주요 기능 |
|---------|----------|------------|----------|
| **ADMIN (관리)** | 6개 | 262개 | 사용자, 부서, 권한, 시스템 설정, 마스터코드 |
| **MAIN (메인)** | 8개 | 72개 | 업무, 교육, 비용, KPI, 캘린더 |
| **IT (IT관리)** | 11개 | 219개 | 하드웨어, 소프트웨어, VOC, 솔루션, IT교육 |
| **SECURITY (보안)** | 8개 | 53개 | 사고, 점검, 교육 |
| **PLAN (계획)** | 3개 | 47개 | 투자, 재무 계획 |
| **COMMON (공통)** | 1개 | 96개 | 피드백 시스템 |

---

## 📋 2. 테이블 상세 분석

### 2.1 ADMIN (관리) 카테고리

#### 2.1.1 `admin_users_userprofiles` (사용자 프로필) - 9개
**주요 컬럼 (26개):**
- `id`, `user_code`, `user_name`, `email`
- `department`, `position`, `role`, `status`
- `phone`, `country`, `address`
- `profile_image_url`, `auth_user_id`
- `assigned_roles` (JSONB), `rule`
- `is_active`, `is_system`
- `created_at`, `updated_at`, `created_by`, `updated_by`

**특징:**
- Supabase Auth 연동 (`auth_user_id`)
- 직급(position)과 직책(role) 구분
- 다중 역할 할당 지원 (`assigned_roles`)

#### 2.1.2 `admin_mastercode_data` (마스터코드) - 223개
**주요 컬럼 (18개):**
- `id`, `codetype` (groupcode/subcode)
- **그룹코드:** `group_code`, `group_code_name`, `group_code_description`, `group_code_status`, `group_code_order`
- **서브코드:** `subcode`, `subcode_name`, `subcode_description`, `subcode_status`, `subcode_order`
- `is_active`, `created_at`, `updated_at`

**특징:**
- 플랫 구조로 그룹코드와 서브코드를 하나의 테이블에서 관리
- 223개의 코드 데이터 (업무 상태, 사용자 레벨 등)

#### 2.1.3 `admin_systemsetting_menu` (시스템 메뉴 설정) - 26개
**주요 컬럼 (13개):**
- `id`, `menu_level`, `menu_category`
- `menu_icon`, `menu_page`, `menu_description`
- `menu_url`, `is_enabled`, `display_order`

**특징:**
- 동적 메뉴 시스템
- 아이콘 매핑 (React 컴포넌트)
- 표시 순서 관리

#### 2.1.4 `admin_users_department` (부서 관리) - 4개
**주요 컬럼 (18개):**
- `id`, `department_code`, `department_name`
- `parent_department_id`, `department_level`
- `manager_name`, `manager_email`
- `phone`, `location`, `description`
- `display_order`, `is_active`, `is_system`

**특징:**
- 계층적 부서 구조 지원
- 부서별 담당자 정보

#### 2.1.5 `admin_mastercode_code` - 0개 (빈 테이블)
#### 2.1.6 `admin_usersettings_role` - 0개 (빈 테이블)

---

### 2.2 MAIN (메인) 카테고리

#### 2.2.1 `main_task_data` (업무 관리) - 3개
**주요 컬럼 (16개):**
- `id` (UUID), `code`, `registration_date`
- `start_date`, `completed_date`, `department`
- `work_content`, `team`, `assignee_name`
- `progress`, `status`, `is_active`

#### 2.2.2 `main_cost_data` (비용 관리) - 28개
**주요 컬럼 (19개):**
- `id`, `code`, `registration_date`
- `cost_type`, `title`, `content`, `amount`
- `team`, `assignee`, `status`
- `start_date`, `completion_date`, `attachments`

**관련 테이블:** `main_cost_finance` (재무 상세) - 7개

#### 2.2.3 `main_kpi_data` (KPI 관리) - 8개
**주요 컬럼 (24개):**
- `id`, `code`, `work_content`, `description`
- `management_category`, `target_kpi`, `current_kpi`
- `department`, `progress`, `status`
- `start_date`, `completed_date`

**관련 테이블:**
- `main_kpi_record` (KPI 기록) - 2개
- `main_kpi_task` (KPI 하위 태스크) - 12개

#### 2.2.4 `main_education_data` (교육 관리) - 3개
**주요 컬럼 (16개):**
- `code`, `registration_date`, `start_date`, `completion_date`
- `education_category`, `title`, `description`
- `education_type`, `team`, `assignee_name`, `status`

#### 2.2.5 `main_calendar_data` (캘린더) - 9개
**주요 컬럼 (15개):**
- `id`, `event_id`, `title`, `description`
- `team`, `assignee`, `attendees`
- `color`, `text_color`, `all_day`
- `start_date`, `end_date`, `event_code`

---

### 2.3 IT (IT관리) 카테고리

#### 2.3.1 하드웨어 관리 (3개 테이블)

**`it_hardware_data`** (하드웨어 자산) - 5개
- 31개 컬럼: 자산정보, 구매정보, 스펙, 라이선스
- `asset_category`, `asset_name`, `model`, `manufacturer`
- `serial_number`, `purchase_date`, `warranty_period`

**`it_hardware_history`** (하드웨어 이력) - 7개
- 17개 컬럼: 구매, 수리, 폐기 이력
- `hardware_id` (FK), `type`, `content`, `vendor`, `amount`

**`it_hardware_user`** (하드웨어 사용자) - 23개
- 14개 컬럼: 사용자 할당 정보
- `hardware_id` (FK), `user_name`, `department`
- `start_date`, `end_date`, `reason`, `status`

#### 2.3.2 소프트웨어 관리 (3개 테이블)

**`it_software_data`** (소프트웨어 자산) - 17개
- 23개 컬럼
- `software_name`, `description`, `software_category`
- `spec`, `license_type`, `version`

**`it_software_history`** (소프트웨어 이력) - 68개
- 17개 컬럼: 구매, 업그레이드, 라이선스 갱신
- `software_id` (FK), `history_type`, `purchase_date`
- `supplier`, `price`, `quantity`

**`it_software_user`** (소프트웨어 사용자) - 44개
- 15개 컬럼
- `software_id` (FK), `user_name`, `department`
- `exclusive_id`, `usage_status`

#### 2.3.3 기타 IT 관리

**`it_solution_data`** (솔루션 개발) - 17개
- 19개 컬럼
- `solution_type`, `development_type`, `detail_content`

**`it_voc_data`** (VOC 관리) - 14개
- 23개 컬럼
- `customer_name`, `company_name`, `voc_type`
- `channel`, `title`, `content`, `response_content`

**`it_education_data`** (IT 교육) - 12개
- 19개 컬럼
- `education_type`, `education_name`, `description`
- `participant_count`, `execution_date`

**관련 테이블:**
- `it_education_curriculum` (커리큘럼) - 6개
- `it_education_attendee` (참석자) - 17개

---

### 2.4 SECURITY (보안) 카테고리

#### 2.4.1 사고 관리 (3개 테이블)

**`security_accident_data`** (사고 데이터) - 7개
**`security_accident_report`** (사고 보고서) - 7개
**`security_accident_improvement`** (개선 조치) - 0개

#### 2.4.2 점검 관리 (2개 테이블)

**`security_inspection_data`** (점검 데이터) - 8개
**`security_inspection_opl`** (OPL 데이터) - 13개

#### 2.4.3 보안 교육 (3개 테이블)

**`security_education_data`** (교육 데이터) - 5개
**`security_education_curriculum`** (커리큘럼) - 13개
**`security_education_attendee`** (참석자) - 3개

---

### 2.5 PLAN (계획) 카테고리

#### 2.5.1 투자 관리

**`plan_investment_data`** (투자 데이터) - 13개
- 21개 컬럼
- `investment_type`, `investment_name`, `amount`

**`plan_investment_finance`** (투자 재무) - 31개
- 14개 컬럼
- `investment_id` (FK), `item_order`, `code`
- `investment_type`, `content`, `quantity`, `unit_price`

#### 2.5.2 업무 계획

**`plan_task_management`** (업무 계획) - 3개

---

### 2.6 COMMON (공통) 카테고리

#### 2.6.1 `common_feedback_data` (피드백) - 96개
**주요 컬럼 (13개):**
- `id`, `page`, `record_id`, `action_type`
- `description`, `user_name`, `team`
- `user_department`, `user_position`
- `user_profile_image`, `metadata`

**특징:**
- 모든 페이지의 변경 이력 기록
- 사용자 정보 스냅샷 저장

---

## 🔗 3. 테이블 관계 분석

### 3.1 사용자 관리 흐름
```
auth.users (Supabase Auth)
    ↓ (auth_user_id)
admin_users_userprofiles
    ↓ (department)
admin_users_department
    ↓ (assigned_roles)
admin_usersettings_role
```

### 3.2 마스터코드 시스템
```
admin_mastercode_data
    └─ codetype: "groupcode" (그룹)
    └─ codetype: "subcode" (서브)
```

### 3.3 하드웨어 관리
```
it_hardware_data (자산)
    ├─→ it_hardware_history (이력)
    └─→ it_hardware_user (사용자)
```

### 3.4 소프트웨어 관리
```
it_software_data (자산)
    ├─→ it_software_history (이력)
    └─→ it_software_user (사용자)
```

### 3.5 교육 관리 (IT)
```
it_education_data (교육)
    ├─→ it_education_curriculum (커리큘럼)
    └─→ it_education_attendee (참석자)
```

### 3.6 교육 관리 (보안)
```
security_education_data (교육)
    ├─→ security_education_curriculum (커리큘럼)
    └─→ security_education_attendee (참석자)
```

### 3.7 사고 관리
```
security_accident_data (사고)
    ├─→ security_accident_report (보고서)
    └─→ security_accident_improvement (개선)
```

### 3.8 재무 관리
```
main_cost_data (비용)
    └─→ main_cost_finance (재무 상세)

plan_investment_data (투자)
    └─→ plan_investment_finance (투자 재무)
```

### 3.9 KPI 관리
```
main_kpi_data (KPI)
    ├─→ main_kpi_record (기록)
    └─→ main_kpi_task (하위 태스크)
```

---

## 🎯 4. 공통 패턴 분석

### 4.1 표준 컬럼 패턴

#### 기본 메타데이터 (대부분의 테이블)
- `id` (PK, int4 또는 UUID)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `created_by` (varchar)
- `updated_by` (varchar)
- `is_active` (boolean)

#### 업무 관리 패턴
- `code` (고유 코드, 예: HW-25-001)
- `registration_date` (등록일)
- `start_date` (시작일)
- `completed_date` (완료일)
- `team` (팀)
- `assignee` (담당자)
- `status` (상태)
- `attachments` (첨부파일, JSONB)

### 4.2 명명 규칙

**테이블명:**
```
{카테고리}_{기능}_{세부기능}
예: admin_users_userprofiles, it_hardware_data
```

**코드 생성 규칙:**
```
{카테고리}-{기능}-{연도}-{번호}
예: MAIN-TASK-25-001, HW-2025-3784
```

---

## 📈 5. 데이터 통계

### 5.1 카테고리별 데이터 분포

| 카테고리 | 총 데이터 | 주요 테이블 |
|---------|----------|-----------|
| IT 관리 | 219개 | it_software_history (68), it_software_user (44) |
| 마스터코드 | 223개 | admin_mastercode_data (223) |
| 피드백 | 96개 | common_feedback_data (96) |
| 재무 | 65개 | plan_investment_finance (31), main_cost_data (28) |
| 보안 | 53개 | 교육, 점검, 사고 관리 |

### 5.2 활성 데이터 비율
- **운영 중:** 35개 테이블
- **비어있음:** 2개 테이블 (admin_mastercode_code, admin_usersettings_role)

---

## 🔍 6. 발견 사항 및 특징

### 6.1 장점
✅ **체계적인 구조:** 카테고리별 명확한 분리
✅ **공통 패턴:** 일관된 컬럼 구조와 명명 규칙
✅ **확장성:** 마스터코드 기반 동적 데이터 관리
✅ **추적성:** 피드백 시스템으로 모든 변경 이력 기록
✅ **메타데이터:** created_at, updated_at, created_by 등 추적 정보

### 6.2 개선 가능 영역
⚠️ **빈 테이블:** 2개 테이블 사용 안 함 (삭제 고려)
⚠️ **외래키:** 명시적 FK 제약조건 부족 (참조 무결성)
⚠️ **인덱스:** 성능 최적화를 위한 인덱스 추가 필요

---

## 📝 7. 결론

**Nexwork 시스템**은 37개의 테이블로 구성된 종합 관리 플랫폼입니다:

- **관리 영역:** 사용자, 부서, 권한, 마스터코드, 시스템 설정
- **업무 영역:** 업무, KPI, 교육, 캘린더, 비용
- **IT 영역:** 하드웨어, 소프트웨어, VOC, 솔루션
- **보안 영역:** 사고, 점검, 교육
- **계획 영역:** 투자, 재무
- **공통 기능:** 피드백 및 변경 이력

체계적인 구조와 일관된 패턴으로 안정적이고 확장 가능한 시스템입니다.

---

**분석 완료 일시:** 2025-10-10
**분석 도구:** Supabase JS Client + PostgreSQL
