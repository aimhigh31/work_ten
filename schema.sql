-- ========================================
-- 개발 DB 스키마 덤프
-- ========================================
-- 생성일: 2025-11-21
-- 프로젝트: exxumujwufzqnovhzvif
-- 총 테이블 수: 62
-- ========================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: admin_checklist_data
DROP TABLE IF EXISTS admin_checklist_data CASCADE;
CREATE TABLE admin_checklist_data (
  id SERIAL NOT NULL,
  no integer NOT NULL,
  registration_date date NOT NULL DEFAULT CURRENT_DATE,
  code varchar(50) NOT NULL,
  department varchar(50) NOT NULL,
  work_content text NOT NULL,
  description text,
  status varchar(20) NOT NULL DEFAULT '대기'::character varying,
  team varchar(50) NOT NULL,
  assignee varchar(50) NOT NULL,
  completed_date date,
  progress integer DEFAULT 0,
  attachments jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by varchar(50) NOT NULL DEFAULT 'system'::character varying,
  updated_by varchar(50) NOT NULL DEFAULT 'system'::character varying,
  is_active boolean DEFAULT true
);


-- Table: admin_checklist_editor
DROP TABLE IF EXISTS admin_checklist_editor CASCADE;
CREATE TABLE admin_checklist_editor (
  id BIGSERIAL NOT NULL,
  checklist_id bigint NOT NULL,
  no integer NOT NULL,
  major_category varchar(100) NOT NULL,
  sub_category varchar(100) NOT NULL,
  title varchar(500) NOT NULL,
  description text,
  evaluation varchar(50) DEFAULT '대기'::character varying,
  score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying,
  is_active boolean DEFAULT true
);


-- Table: admin_mastercode_data
DROP TABLE IF EXISTS admin_mastercode_data CASCADE;
CREATE TABLE admin_mastercode_data (
  id SERIAL NOT NULL,
  codetype varchar(10) NOT NULL,
  group_code varchar(50) NOT NULL,
  group_code_name varchar(200) NOT NULL,
  group_code_description text DEFAULT ''::text,
  group_code_status varchar(20) DEFAULT 'active'::character varying,
  group_code_order integer DEFAULT 0,
  subcode varchar(50) DEFAULT ''::character varying,
  subcode_name varchar(200) DEFAULT ''::character varying,
  subcode_description text DEFAULT ''::text,
  subcode_status varchar(20) DEFAULT 'active'::character varying,
  subcode_remark text DEFAULT ''::text,
  subcode_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying
);


-- Table: admin_systemsetting_menu
DROP TABLE IF EXISTS admin_systemsetting_menu CASCADE;
CREATE TABLE admin_systemsetting_menu (
  id BIGSERIAL NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  menu_level integer NOT NULL DEFAULT 0,
  menu_category varchar(100) NOT NULL,
  menu_icon varchar(50),
  menu_page varchar(100) NOT NULL,
  menu_description text,
  menu_url varchar(200) NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_by varchar(100) NOT NULL DEFAULT 'system'::character varying,
  updated_by varchar(100) NOT NULL DEFAULT 'system'::character varying,
  menu_database text
);


-- Table: admin_systemsetting_system
DROP TABLE IF EXISTS admin_systemsetting_system CASCADE;
CREATE TABLE admin_systemsetting_system (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  setting_key varchar(100) NOT NULL,
  setting_value jsonb NOT NULL,
  setting_type varchar(50) DEFAULT 'general'::character varying,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- Table: admin_users_department
DROP TABLE IF EXISTS admin_users_department CASCADE;
CREATE TABLE admin_users_department (
  id SERIAL NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  department_code varchar(50) NOT NULL,
  department_name varchar(100) NOT NULL,
  parent_department_id integer,
  department_level integer DEFAULT 1,
  display_order integer DEFAULT 0,
  manager_name varchar(100),
  manager_email varchar(255),
  phone varchar(20),
  location varchar(200),
  description text,
  is_active boolean DEFAULT true,
  is_system boolean DEFAULT false,
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying,
  metadata jsonb
);


-- Table: admin_users_rules
DROP TABLE IF EXISTS admin_users_rules CASCADE;
CREATE TABLE admin_users_rules (
  id SERIAL NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  role_code varchar(50) NOT NULL,
  role_name varchar(100) NOT NULL,
  role_description text,
  permissions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  is_system boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying,
  metadata jsonb DEFAULT '{}'::jsonb
);


-- Table: admin_users_rules_permissions
DROP TABLE IF EXISTS admin_users_rules_permissions CASCADE;
CREATE TABLE admin_users_rules_permissions (
  id SERIAL NOT NULL,
  role_id integer NOT NULL,
  menu_id bigint NOT NULL,
  can_read boolean DEFAULT false,
  can_write boolean DEFAULT false,
  can_full boolean DEFAULT false,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(255) DEFAULT 'system'::character varying,
  updated_by varchar(255) DEFAULT 'system'::character varying,
  can_view_category boolean DEFAULT false,
  can_read_data boolean DEFAULT false,
  can_create_data boolean DEFAULT false,
  can_edit_own boolean DEFAULT false,
  can_edit_others boolean DEFAULT false,
  can_manage_own boolean DEFAULT false
);


-- Table: admin_users_userprofiles
DROP TABLE IF EXISTS admin_users_userprofiles CASCADE;
CREATE TABLE admin_users_userprofiles (
  id SERIAL NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_code varchar(50) NOT NULL,
  user_name varchar(100) NOT NULL,
  email varchar(255) NOT NULL,
  department varchar(100),
  position varchar(100),
  role varchar(100) DEFAULT 'user'::character varying,
  status varchar(20) DEFAULT 'active'::character varying,
  last_login timestamptz,
  avatar_url text,
  phone varchar(20),
  hire_date date,
  is_active boolean DEFAULT true,
  is_system boolean DEFAULT false,
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying,
  metadata jsonb,
  profile_image_url text,
  country varchar(100),
  address text,
  user_account_id varchar(50),
  assigned_roles jsonb DEFAULT '[]'::jsonb,
  rule varchar(50),
  auth_user_id uuid,
  role_id integer
);


-- Table: code_sequences
DROP TABLE IF EXISTS code_sequences CASCADE;
CREATE TABLE code_sequences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  module_type text NOT NULL,
  year integer NOT NULL,
  current_sequence integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- Table: common_feedback_data
DROP TABLE IF EXISTS common_feedback_data CASCADE;
CREATE TABLE common_feedback_data (
  page text NOT NULL,
  record_id text NOT NULL,
  action_type text NOT NULL,
  description text,
  user_id uuid,
  user_name text,
  team text,
  created_at timestamptz DEFAULT now(),
  metadata jsonb,
  user_department text,
  user_position text,
  user_profile_image text,
  id SERIAL NOT NULL
);


-- Table: common_files_data
DROP TABLE IF EXISTS common_files_data CASCADE;
CREATE TABLE common_files_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  page text NOT NULL,
  record_id text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  user_id uuid,
  user_name text,
  team text,
  created_at timestamptz DEFAULT now(),
  metadata jsonb
);


-- Table: common_log_data
DROP TABLE IF EXISTS common_log_data CASCADE;
CREATE TABLE common_log_data (
  id SERIAL NOT NULL,
  page text NOT NULL,
  record_id text NOT NULL,
  action_type text NOT NULL,
  description text NOT NULL,
  before_value text,
  after_value text,
  user_id text,
  user_name text NOT NULL,
  team text,
  user_department text,
  user_position text,
  user_profile_image text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  changed_field text,
  title text,
  change_location text DEFAULT '개요탭'::text
);


-- Table: cost_amount_details
DROP TABLE IF EXISTS cost_amount_details CASCADE;
CREATE TABLE cost_amount_details (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cost_record_id uuid,
  code text NOT NULL,
  cost_type text NOT NULL,
  content text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(15,2) NOT NULL,
  amount numeric(15,2) NOT NULL
);


-- Table: cost_attachments
DROP TABLE IF EXISTS cost_attachments CASCADE;
CREATE TABLE cost_attachments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cost_record_id uuid,
  name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'cost-attachments'::text,
  upload_date timestamptz DEFAULT now(),
  uploaded_by uuid
);


-- Table: cost_comments
DROP TABLE IF EXISTS cost_comments CASCADE;
CREATE TABLE cost_comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cost_record_id uuid,
  author_id uuid,
  content text NOT NULL,
  timestamp timestamptz DEFAULT now()
);


-- Table: cost_records
DROP TABLE IF EXISTS cost_records CASCADE;
CREATE TABLE cost_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  registration_date date NOT NULL,
  start_date date NOT NULL,
  code text NOT NULL,
  team text NOT NULL,
  assignee_id uuid,
  cost_type text NOT NULL,
  content text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(15,2) NOT NULL,
  amount numeric(15,2) NOT NULL,
  status text DEFAULT '대기'::text,
  completion_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid
);


-- Table: education_curriculum
DROP TABLE IF EXISTS education_curriculum CASCADE;
CREATE TABLE education_curriculum (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  education_record_id uuid,
  time_slot text NOT NULL,
  subject text NOT NULL,
  instructor text NOT NULL,
  content text NOT NULL,
  attachment_path text,
  sort_order integer DEFAULT 0
);


-- Table: education_participants
DROP TABLE IF EXISTS education_participants CASCADE;
CREATE TABLE education_participants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  education_record_id uuid,
  participant_id uuid,
  department text NOT NULL,
  attendance_status text DEFAULT '예정'::text,
  completion_status text DEFAULT '미완료'::text,
  registered_at timestamptz DEFAULT now()
);


-- Table: education_records
DROP TABLE IF EXISTS education_records CASCADE;
CREATE TABLE education_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  registration_date date NOT NULL,
  start_date date NOT NULL,
  code text NOT NULL,
  education_type text NOT NULL,
  content text NOT NULL,
  participants integer DEFAULT 0,
  location text NOT NULL,
  status text DEFAULT '예정'::text,
  completion_date date,
  assignee_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid
);


-- Table: hr_evaluation_data
DROP TABLE IF EXISTS hr_evaluation_data CASCADE;
CREATE TABLE hr_evaluation_data (
  id SERIAL NOT NULL,
  evaluation_title text NOT NULL,
  details text,
  evaluation_type text,
  management_category text,
  status text DEFAULT '대기'::text,
  start_date date,
  end_date date,
  team text,
  manager text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text,
  updated_by text,
  checklist_id integer,
  checklist_evaluation_type text,
  evaluation_code text,
  performance text,
  improvements text,
  thoughts text,
  notes text,
  checklist_guide text
);


-- Table: hr_evaluation_submission_items
DROP TABLE IF EXISTS hr_evaluation_submission_items CASCADE;
CREATE TABLE hr_evaluation_submission_items (
  id SERIAL NOT NULL,
  submission_id integer,
  item_id integer,
  item_name text,
  checked_behaviors bool[] DEFAULT ARRAY[false, false, false],
  recommended_score integer DEFAULT 0,
  actual_score integer DEFAULT 0,
  difference_score integer DEFAULT 0,
  difference_reason text,
  created_at timestamptz DEFAULT now(),
  item_no integer,
  major_category text,
  sub_category text,
  title text,
  evaluation text,
  score integer DEFAULT 0,
  description text
);


-- Table: hr_evaluation_submissions
DROP TABLE IF EXISTS hr_evaluation_submissions CASCADE;
CREATE TABLE hr_evaluation_submissions (
  id SERIAL NOT NULL,
  evaluation_id text,
  target_person text NOT NULL,
  department text NOT NULL,
  position text NOT NULL,
  evaluator text NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  total_recommended_score integer DEFAULT 0,
  total_actual_score integer DEFAULT 0,
  total_difference_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  evaluator_department text,
  evaluator_position text,
  total_score integer DEFAULT 0
);


-- Table: it_education_attendee
DROP TABLE IF EXISTS it_education_attendee CASCADE;
CREATE TABLE it_education_attendee (
  id SERIAL NOT NULL,
  education_id integer NOT NULL,
  user_id integer,
  user_name varchar NOT NULL,
  user_code varchar,
  department varchar,
  position varchar,
  email varchar,
  phone varchar,
  attendance_status varchar DEFAULT '예정'::character varying,
  attendance_date timestamp,
  completion_status varchar DEFAULT '미완료'::character varying,
  score integer,
  certificate_issued boolean DEFAULT false,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  created_by varchar DEFAULT 'user'::character varying,
  updated_by varchar DEFAULT 'user'::character varying,
  is_active boolean DEFAULT true
);


-- Table: it_education_curriculum
DROP TABLE IF EXISTS it_education_curriculum CASCADE;
CREATE TABLE it_education_curriculum (
  id SERIAL NOT NULL,
  education_id integer NOT NULL,
  session_order integer NOT NULL,
  session_title varchar NOT NULL,
  session_description text,
  duration_minutes varchar,
  instructor varchar,
  session_type varchar,
  materials text,
  objectives text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  created_by varchar DEFAULT 'user'::character varying,
  updated_by varchar DEFAULT 'user'::character varying,
  is_active boolean DEFAULT true
);


-- Table: it_education_data
DROP TABLE IF EXISTS it_education_data CASCADE;
CREATE TABLE it_education_data (
  id SERIAL NOT NULL,
  registration_date date DEFAULT CURRENT_DATE,
  code varchar(100),
  education_type varchar(50) DEFAULT '온라인'::character varying,
  education_name text NOT NULL,
  description text,
  location text,
  participant_count integer DEFAULT 0,
  execution_date date,
  status varchar(50) DEFAULT '계획'::character varying,
  assignee varchar(100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  achievements text,
  improvements text,
  education_feedback text,
  report_notes text,
  team text
);


-- Table: it_hardware_data
DROP TABLE IF EXISTS it_hardware_data CASCADE;
CREATE TABLE it_hardware_data (
  id bigint NOT NULL,
  registration_date date NOT NULL DEFAULT CURRENT_DATE,
  code varchar(50) NOT NULL,
  team varchar(100),
  department varchar(100),
  work_content text,
  status varchar(50) DEFAULT '예비'::character varying,
  assignee varchar(100),
  start_date date,
  completed_date date,
  attachments text[],
  asset_category varchar(100),
  asset_name varchar(200),
  model varchar(200),
  manufacturer varchar(200),
  vendor varchar(200),
  detail_spec text,
  purchase_date date,
  warranty_end_date date,
  serial_number varchar(200),
  assigned_user varchar(100),
  location varchar(200),
  images text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by varchar(100) DEFAULT 'user'::character varying,
  updated_by varchar(100) DEFAULT 'user'::character varying,
  image_1_url text,
  image_2_url text,
  asset_description text
);


-- Table: it_hardware_history
DROP TABLE IF EXISTS it_hardware_history CASCADE;
CREATE TABLE it_hardware_history (
  id SERIAL NOT NULL,
  hardware_id integer NOT NULL,
  registration_date date DEFAULT CURRENT_DATE,
  type varchar(20) NOT NULL DEFAULT 'purchase'::character varying,
  content text,
  vendor varchar(200),
  amount numeric(15,2) DEFAULT 0,
  registrant varchar(100),
  status varchar(50) DEFAULT 'completed'::character varying,
  start_date date,
  completion_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by varchar(50) DEFAULT 'system'::character varying,
  updated_by varchar(50) DEFAULT 'system'::character varying,
  is_active boolean DEFAULT true,
  metadata jsonb
);


-- Table: it_hardware_user
DROP TABLE IF EXISTS it_hardware_user CASCADE;
CREATE TABLE it_hardware_user (
  id SERIAL NOT NULL,
  hardware_id integer NOT NULL,
  user_name varchar(100) NOT NULL,
  department varchar(100),
  start_date date,
  end_date date,
  reason text,
  status varchar(20) DEFAULT 'active'::character varying,
  registration_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying,
  is_active boolean DEFAULT true
);


-- Table: it_software_data
DROP TABLE IF EXISTS it_software_data CASCADE;
CREATE TABLE it_software_data (
  id SERIAL NOT NULL,
  registration_date date DEFAULT now(),
  code varchar(255),
  team varchar(50),
  department varchar(50),
  work_content text,
  status varchar(50) DEFAULT '사용중'::character varying,
  assignee varchar(100),
  start_date date,
  completed_date date,
  attachments text[],
  software_name varchar(255),
  description text,
  software_category varchar(100),
  spec text,
  current_users varchar(100),
  solution_provider varchar(100),
  user_count integer DEFAULT 0,
  license_type varchar(100),
  license_key text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- Table: it_software_history
DROP TABLE IF EXISTS it_software_history CASCADE;
CREATE TABLE it_software_history (
  id SERIAL NOT NULL,
  software_id integer NOT NULL,
  history_type varchar(50) DEFAULT '구매'::character varying,
  purchase_date date,
  supplier varchar(200),
  price numeric(12,2),
  quantity integer DEFAULT 1,
  contract_number varchar(100),
  description text,
  status varchar(50) DEFAULT '진행중'::character varying,
  memo text,
  registration_date date DEFAULT CURRENT_DATE,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying,
  is_active boolean DEFAULT true
);


-- Table: it_software_user
DROP TABLE IF EXISTS it_software_user CASCADE;
CREATE TABLE it_software_user (
  id BIGSERIAL NOT NULL,
  software_id bigint NOT NULL,
  user_name text NOT NULL,
  department text,
  exclusive_id text,
  reason text,
  usage_status text DEFAULT '사용중'::text,
  start_date date,
  end_date date,
  registration_date date DEFAULT CURRENT_DATE,
  created_by text DEFAULT 'user'::text,
  updated_by text DEFAULT 'user'::text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- Table: it_solution_data
DROP TABLE IF EXISTS it_solution_data CASCADE;
CREATE TABLE it_solution_data (
  id SERIAL NOT NULL,
  no integer NOT NULL,
  registration_date date NOT NULL DEFAULT CURRENT_DATE,
  start_date date,
  code varchar(50) NOT NULL,
  solution_type varchar(50) NOT NULL,
  development_type varchar(50) NOT NULL,
  detail_content text NOT NULL,
  team varchar(50) NOT NULL,
  assignee varchar(50) NOT NULL,
  status varchar(50) NOT NULL DEFAULT '대기'::character varying,
  completed_date date,
  attachments text[],
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying,
  is_active boolean DEFAULT true,
  title varchar(200) NOT NULL DEFAULT ''::character varying
);


-- Table: it_voc_data
DROP TABLE IF EXISTS it_voc_data CASCADE;
CREATE TABLE it_voc_data (
  id SERIAL NOT NULL,
  no integer NOT NULL DEFAULT 1,
  registration_date date NOT NULL DEFAULT CURRENT_DATE,
  reception_date date,
  customer_name varchar(100),
  company_name varchar(200),
  voc_type varchar(50),
  channel varchar(50),
  title varchar(500) NOT NULL,
  content text,
  team varchar(100),
  assignee varchar(100),
  status varchar(50) DEFAULT '접수'::character varying,
  priority varchar(20) DEFAULT '보통'::character varying,
  response_content text,
  resolution_date date,
  satisfaction_score integer,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying,
  is_active boolean DEFAULT true,
  code varchar(50)
);


-- Table: main_calendar_data
DROP TABLE IF EXISTS main_calendar_data CASCADE;
CREATE TABLE main_calendar_data (
  id SERIAL NOT NULL,
  event_id varchar(255) NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  team varchar(100),
  assignee varchar(100),
  attendees text,
  color varchar(50),
  text_color varchar(50),
  all_day boolean DEFAULT false,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  event_code varchar(50)
);


-- Table: main_cost_data
DROP TABLE IF EXISTS main_cost_data CASCADE;
CREATE TABLE main_cost_data (
  id SERIAL NOT NULL,
  no integer,
  registration_date date NOT NULL DEFAULT CURRENT_DATE,
  code varchar(50) NOT NULL,
  cost_type varchar(50) NOT NULL,
  title varchar(255),
  content text,
  amount bigint DEFAULT 0,
  team varchar(100),
  assignee varchar(100),
  status varchar(50) DEFAULT '대기'::character varying,
  start_date date,
  completion_date date,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying,
  is_active boolean DEFAULT true
);


-- Table: main_cost_finance
DROP TABLE IF EXISTS main_cost_finance CASCADE;
CREATE TABLE main_cost_finance (
  id SERIAL NOT NULL,
  cost_id integer NOT NULL,
  item_order integer NOT NULL,
  code varchar(50),
  cost_type varchar(50),
  content text,
  quantity integer DEFAULT 1,
  unit_price bigint DEFAULT 0,
  amount bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by varchar(100) DEFAULT 'user'::character varying,
  updated_by varchar(100) DEFAULT 'user'::character varying,
  is_active boolean DEFAULT true
);


-- Table: main_education_data
DROP TABLE IF EXISTS main_education_data CASCADE;
CREATE TABLE main_education_data (
  code varchar(50) NOT NULL,
  registration_date date NOT NULL,
  start_date date,
  completion_date date,
  education_category varchar(100),
  title varchar(500),
  description text,
  education_type varchar(100),
  team varchar(100),
  assignee_id uuid,
  assignee_name varchar(100),
  status varchar(50) DEFAULT '예정'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  id SERIAL NOT NULL,
  no integer,
  company_name text,
  channel text,
  priority text DEFAULT '보통'::text,
  response_content text,
  satisfaction_score integer,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_by text DEFAULT 'system'::text,
  updated_by text DEFAULT 'system'::text
);


-- Table: main_kpi_data
DROP TABLE IF EXISTS main_kpi_data CASCADE;
CREATE TABLE main_kpi_data (
  id BIGSERIAL NOT NULL,
  code varchar(50) NOT NULL,
  work_content text NOT NULL,
  description text,
  management_category varchar(100),
  target_kpi varchar(255),
  current_kpi varchar(255),
  department varchar(100),
  progress integer DEFAULT 0,
  status varchar(50) DEFAULT '대기'::character varying,
  start_date date,
  completed_date date,
  team varchar(100),
  assignee varchar(100),
  registration_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  evaluation_criteria_a text,
  evaluation_criteria_b text,
  evaluation_criteria_c text,
  evaluation_criteria_d text,
  selection_background text,
  impact text,
  evaluation_criteria_s text
);


-- Table: main_kpi_record
DROP TABLE IF EXISTS main_kpi_record CASCADE;
CREATE TABLE main_kpi_record (
  id SERIAL NOT NULL,
  kpi_id integer,
  month text NOT NULL,
  target_kpi text,
  actual_kpi text,
  traffic_light text DEFAULT 'green'::text,
  overall_progress text DEFAULT '0'::text,
  plan_performance text,
  achievement_reflection text,
  attachments text[],
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);


-- Table: main_kpi_task
DROP TABLE IF EXISTS main_kpi_task CASCADE;
CREATE TABLE main_kpi_task (
  id SERIAL NOT NULL,
  kpi_id integer,
  text text NOT NULL,
  checked boolean DEFAULT false,
  parent_id integer,
  level integer DEFAULT 0,
  expanded boolean DEFAULT true,
  status text DEFAULT '대기'::text,
  due_date date,
  start_date date,
  progress_rate integer DEFAULT 0,
  assignee text,
  team text,
  priority text,
  weight integer DEFAULT 0,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);


-- Table: main_task_data
DROP TABLE IF EXISTS main_task_data CASCADE;
CREATE TABLE main_task_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code varchar(50) NOT NULL,
  registration_date date NOT NULL,
  start_date date,
  completed_date date,
  department varchar(100),
  work_content varchar(500),
  team varchar(100),
  assignee_id uuid,
  assignee_name varchar(100),
  progress integer DEFAULT 0,
  status varchar(50) DEFAULT '대기'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  description text,
  task_type varchar(20) DEFAULT '일반'::character varying,
  kpi_id varchar(100),
  kpi_work_content text,
  kpi_record_id integer
);


-- Table: main_task_management
DROP TABLE IF EXISTS main_task_management CASCADE;
CREATE TABLE main_task_management (
  id SERIAL NOT NULL,
  task_id varchar(50) NOT NULL,
  item_id bigint NOT NULL,
  text text NOT NULL,
  checked boolean DEFAULT false,
  parent_id bigint,
  level integer DEFAULT 0,
  expanded boolean DEFAULT true,
  status varchar(20) DEFAULT '대기'::character varying,
  due_date date,
  progress_rate integer DEFAULT 0,
  assignee varchar(100),
  priority varchar(20) DEFAULT 'Medium'::character varying,
  start_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying
);


-- Table: menu_settings
DROP TABLE IF EXISTS menu_settings CASCADE;
CREATE TABLE menu_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  menu_id varchar(100) NOT NULL,
  menu_title varchar(200) NOT NULL,
  menu_level integer DEFAULT 0,
  menu_url varchar(500),
  parent_group varchar(200),
  menu_type varchar(50) DEFAULT 'item'::character varying,
  icon_name varchar(100),
  is_enabled boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- Table: migration_log
DROP TABLE IF EXISTS migration_log CASCADE;
CREATE TABLE migration_log (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  migration_type text NOT NULL,
  status text NOT NULL,
  error_message text,
  migrated_at timestamptz DEFAULT now()
);


-- Table: plan_investment_data
DROP TABLE IF EXISTS plan_investment_data CASCADE;
CREATE TABLE plan_investment_data (
  id SERIAL NOT NULL,
  no integer,
  registration_date date NOT NULL DEFAULT CURRENT_DATE,
  code varchar(50) NOT NULL,
  investment_type varchar(20) NOT NULL,
  investment_name varchar(200) NOT NULL,
  amount bigint NOT NULL DEFAULT 0,
  team varchar(50) NOT NULL,
  assignee varchar(100),
  status varchar(20) NOT NULL DEFAULT '대기'::character varying,
  start_date date,
  completed_date date,
  expected_return numeric(15,2) DEFAULT 0,
  actual_return numeric(15,2),
  risk_level varchar(20) NOT NULL DEFAULT '보통'::character varying,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying,
  is_active boolean DEFAULT true
);


-- Table: plan_investment_finance
DROP TABLE IF EXISTS plan_investment_finance CASCADE;
CREATE TABLE plan_investment_finance (
  id SERIAL NOT NULL,
  investment_id integer NOT NULL,
  item_order integer NOT NULL,
  investment_category varchar NOT NULL,
  item_name varchar NOT NULL,
  budget_amount numeric DEFAULT 0,
  execution_amount numeric DEFAULT 0,
  remarks text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  created_by varchar DEFAULT 'user'::character varying,
  updated_by varchar DEFAULT 'user'::character varying,
  is_active boolean DEFAULT true
);


-- Table: plan_sales_data
DROP TABLE IF EXISTS plan_sales_data CASCADE;
CREATE TABLE plan_sales_data (
  id SERIAL NOT NULL,
  registration_date date NOT NULL DEFAULT CURRENT_DATE,
  code text NOT NULL,
  customer_name text NOT NULL,
  sales_type text NOT NULL,
  status text NOT NULL DEFAULT '대기'::text,
  business_unit text NOT NULL,
  model_code text NOT NULL,
  item_code text NOT NULL,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  unit_price numeric(15,2) NOT NULL DEFAULT 0,
  total_amount numeric(15,2) NOT NULL DEFAULT 0,
  team text,
  registrant text NOT NULL,
  delivery_date date NOT NULL,
  notes text,
  contract_date date,
  assignee text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- Table: security_accident_data
DROP TABLE IF EXISTS security_accident_data CASCADE;
CREATE TABLE security_accident_data (
  id SERIAL NOT NULL,
  no integer,
  registration_date date NOT NULL DEFAULT CURRENT_DATE,
  code varchar(50) NOT NULL,
  incident_type varchar(50) NOT NULL,
  request_content text,
  main_content text NOT NULL,
  response_action text,
  description text,
  severity varchar(50) NOT NULL DEFAULT '중간'::character varying,
  status varchar(50) NOT NULL DEFAULT '대기'::character varying,
  response_stage varchar(20),
  assignee varchar(100),
  team varchar(50),
  discoverer varchar(100),
  impact_scope text,
  cause_analysis text,
  prevention_plan text,
  occurrence_date date,
  completed_date date,
  start_date date,
  progress integer DEFAULT 0,
  attachment boolean DEFAULT false,
  attachment_count integer DEFAULT 0,
  attachments jsonb DEFAULT '[]'::jsonb,
  likes integer DEFAULT 0,
  liked_by jsonb DEFAULT '[]'::jsonb,
  views integer DEFAULT 0,
  viewed_by jsonb DEFAULT '[]'::jsonb,
  comments jsonb DEFAULT '[]'::jsonb,
  incident_report jsonb,
  post_measures jsonb,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying,
  is_active boolean DEFAULT true
);


-- Table: security_accident_improvement
DROP TABLE IF EXISTS security_accident_improvement CASCADE;
CREATE TABLE security_accident_improvement (
  id SERIAL NOT NULL,
  accident_id integer NOT NULL,
  plan text NOT NULL,
  status varchar(20) DEFAULT '미완료'::character varying,
  completion_date date,
  assignee varchar(100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying,
  is_active boolean DEFAULT true
);


-- Table: security_accident_report
DROP TABLE IF EXISTS security_accident_report CASCADE;
CREATE TABLE security_accident_report (
  id SERIAL NOT NULL,
  accident_id integer NOT NULL,
  discovery_datetime timestamp,
  discoverer varchar(100),
  discovery_method varchar(100),
  report_datetime timestamp,
  reporter varchar(100),
  report_method varchar(100),
  incident_target text,
  incident_cause text,
  affected_systems text,
  affected_data text,
  service_impact varchar(50),
  business_impact varchar(50),
  situation_details text,
  response_method varchar(100),
  improvement_executor varchar(100),
  expected_completion_date date,
  improvement_details text,
  completion_date date,
  completion_approver varchar(100),
  resolution_details text,
  prevention_details text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying
);


-- Table: security_education_attendee
DROP TABLE IF EXISTS security_education_attendee CASCADE;
CREATE TABLE security_education_attendee (
  id SERIAL NOT NULL,
  education_id integer NOT NULL,
  user_id integer,
  user_name varchar(100) NOT NULL,
  user_code varchar(50),
  department varchar(100),
  position varchar(50),
  email varchar(255),
  phone varchar(50),
  attendance_status varchar(50) DEFAULT '등록'::character varying,
  attendance_date date,
  completion_status varchar(50) DEFAULT '미완료'::character varying,
  score numeric(5,2),
  certificate_issued boolean DEFAULT false,
  notes text,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(100) DEFAULT 'user'::character varying,
  updated_by varchar(100) DEFAULT 'user'::character varying,
  is_active boolean DEFAULT true
);


-- Table: security_education_curriculum
DROP TABLE IF EXISTS security_education_curriculum CASCADE;
CREATE TABLE security_education_curriculum (
  id SERIAL NOT NULL,
  education_id integer NOT NULL,
  session_order integer NOT NULL,
  session_title varchar(255) NOT NULL,
  session_description text,
  duration_minutes integer,
  instructor varchar(100),
  session_type varchar(50),
  materials text,
  objectives text,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(100) DEFAULT 'user'::character varying,
  updated_by varchar(100) DEFAULT 'user'::character varying,
  is_active boolean DEFAULT true
);


-- Table: security_education_data
DROP TABLE IF EXISTS security_education_data CASCADE;
CREATE TABLE security_education_data (
  id SERIAL NOT NULL,
  education_name varchar(255) NOT NULL,
  description text,
  education_type varchar(100),
  assignee varchar(100),
  execution_date date,
  location varchar(255),
  status varchar(50) DEFAULT '계획'::character varying,
  participant_count integer DEFAULT 0,
  registration_date date DEFAULT CURRENT_DATE,
  code varchar(100),
  achievements text,
  feedback text,
  improvement_points text,
  effectiveness_score integer,
  completion_rate numeric(5,2),
  satisfaction_score numeric(3,2),
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(100) DEFAULT 'user'::character varying,
  updated_by varchar(100) DEFAULT 'user'::character varying,
  is_active boolean DEFAULT true,
  metadata jsonb,
  no SERIAL NOT NULL,
  team text
);


-- Table: security_inspection_checksheet
DROP TABLE IF EXISTS security_inspection_checksheet CASCADE;
CREATE TABLE security_inspection_checksheet (
  id BIGSERIAL NOT NULL,
  inspection_id bigint NOT NULL,
  checklist_id bigint,
  major_category text NOT NULL DEFAULT ''::text,
  minor_category text NOT NULL DEFAULT ''::text,
  title text NOT NULL DEFAULT ''::text,
  description text DEFAULT ''::text,
  evaluation text DEFAULT ''::text,
  score integer DEFAULT 0,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text DEFAULT 'system'::text,
  updated_by text DEFAULT 'system'::text,
  is_active boolean DEFAULT true
);


-- Table: security_inspection_data
DROP TABLE IF EXISTS security_inspection_data CASCADE;
CREATE TABLE security_inspection_data (
  id SERIAL NOT NULL,
  no SERIAL NOT NULL,
  registration_date date NOT NULL DEFAULT CURRENT_DATE,
  code varchar(50) NOT NULL,
  inspection_type varchar(50) NOT NULL,
  inspection_target varchar(50) NOT NULL,
  inspection_content text NOT NULL,
  inspection_date date,
  team varchar(50) NOT NULL DEFAULT '보안팀'::character varying,
  assignee varchar(100) NOT NULL,
  status varchar(20) NOT NULL DEFAULT '대기'::character varying,
  progress integer DEFAULT 0,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying,
  details text,
  is_active boolean DEFAULT true,
  performance text,
  improvements text,
  thoughts text,
  notes text
);


-- Table: security_inspection_opl
DROP TABLE IF EXISTS security_inspection_opl CASCADE;
CREATE TABLE security_inspection_opl (
  id SERIAL NOT NULL,
  inspection_id integer,
  registration_date date DEFAULT CURRENT_DATE,
  code varchar(100),
  before text,
  before_image text,
  after text,
  after_image text,
  completion_date date,
  assignee varchar(100),
  status varchar(50) DEFAULT '대기'::character varying,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- Table: security_regulation_data
DROP TABLE IF EXISTS security_regulation_data CASCADE;
CREATE TABLE security_regulation_data (
  id SERIAL NOT NULL,
  parent_id integer,
  type varchar(10) NOT NULL,
  name varchar(255) NOT NULL,
  path varchar(500),
  level integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  file_size varchar(20),
  file_extension varchar(10),
  description text,
  document_type varchar(100),
  status varchar(50),
  assignee varchar(100),
  code varchar(50),
  revision varchar(20),
  revision_date date,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(100) DEFAULT 'system'::character varying,
  updated_by varchar(100) DEFAULT 'system'::character varying,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  team varchar(100)
);


-- Table: security_regulation_revision
DROP TABLE IF EXISTS security_regulation_revision CASCADE;
CREATE TABLE security_regulation_revision (
  id SERIAL NOT NULL,
  security_regulation_id integer NOT NULL,
  file_name varchar(255) NOT NULL,
  file_size varchar(50),
  file_description text,
  file_path text,
  revision varchar(20) NOT NULL,
  upload_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(100) NOT NULL,
  updated_by varchar(100) NOT NULL,
  is_active boolean DEFAULT true
);


-- Table: task_attachments
DROP TABLE IF EXISTS task_attachments CASCADE;
CREATE TABLE task_attachments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  task_record_id uuid,
  filename text NOT NULL,
  storage_path text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'task-attachments'::text,
  upload_date timestamptz DEFAULT now(),
  uploaded_by uuid
);


-- Table: task_records
DROP TABLE IF EXISTS task_records CASCADE;
CREATE TABLE task_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  no SERIAL NOT NULL,
  registration_date date NOT NULL,
  code text NOT NULL,
  team text NOT NULL,
  department text NOT NULL,
  work_content text NOT NULL,
  status text DEFAULT '대기'::text,
  assignee_id uuid,
  start_date date,
  completed_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid
);


-- Table: user_profiles
DROP TABLE IF EXISTS user_profiles CASCADE;
CREATE TABLE user_profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  avatar_url text,
  role text DEFAULT 'user'::text,
  department text,
  position text,
  nextauth_migrated boolean DEFAULT false,
  nextauth_original_id text,
  migration_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ========================================
-- 스키마 덤프 완료
-- ========================================
