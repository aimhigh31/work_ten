# Nexwork Frontend - Supabase 백엔드 구축 완전 실행 가이드 📚

> **🎯 목표**: 모든 Phase를 100% 완료하여 완전한 Supabase 백엔드 시스템 구축

## 📋 프로젝트 개요

본 문서는 Nexwork Frontend 프로젝트의 현재 목업 데이터 기반 시스템을 Supabase를 활용한 완전한 백엔드 시스템으로 전환하기 위한 **실행 가능한 완전 가이드**입니다.

### 🎯 개선된 접근 방식
- ✅ **즉시 실행 가능한 스크립트 제공**
- ✅ **단계별 완료 검증 방법 명시**  
- ✅ **실제 환경 구축부터 배포까지 완전 커버**
- ✅ **모든 Phase 100% 달성 가능한 구체적 가이드**

### 현재 상태 분석
- **프론트엔드**: Next.js 15.1.6 + TypeScript + Material-UI
- **현재 데이터**: 로컬 목업 데이터 (`src/data/`)
- **인증**: Next-Auth 4.24.11 사용 중 (로컬 세션)
- **상태 관리**: React Hooks + Props drilling

## 🏗️ 1. 시스템 아키텍처 설계

### 1.1 전체 아키텍처
```
Frontend (Next.js)
    ↓ HTTP/API
Supabase 
├── PostgreSQL Database
├── Authentication
├── Real-time Subscriptions
├── Storage
└── Edge Functions (serverless)
```

### 1.2 핵심 구성 요소
- **Database**: PostgreSQL (Supabase 내장)
- **Authentication**: Supabase Auth
- **API**: Supabase Client SDK + Edge Functions
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

## 🗃️ 2. 데이터베이스 스키마 설계

### 2.1 인증 및 사용자 관리

```sql
-- 사용자 프로필 확장 테이블
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  department TEXT,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 정책 설정
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 2.2 비용관리 모듈

```sql
-- 비용 기록 테이블
CREATE TABLE cost_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_date DATE NOT NULL,
  start_date DATE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  team TEXT NOT NULL,
  assignee_id UUID REFERENCES user_profiles(id),
  cost_type TEXT NOT NULL CHECK (cost_type IN ('솔루션', '하드웨어', '출장경비', '행사경비', '사무경비')),
  content TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT '대기' CHECK (status IN ('대기', '진행', '완료', '취소')),
  completion_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- 금액 상세 테이블
CREATE TABLE cost_amount_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cost_record_id UUID REFERENCES cost_records(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  cost_type TEXT NOT NULL,
  content TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL
);

-- 비용 코멘트 테이블
CREATE TABLE cost_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cost_record_id UUID REFERENCES cost_records(id) ON DELETE CASCADE,
  author_id UUID REFERENCES user_profiles(id),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 첨부파일 테이블
CREATE TABLE cost_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cost_record_id UUID REFERENCES cost_records(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES user_profiles(id)
);

-- 인덱스 생성
CREATE INDEX idx_cost_records_assignee ON cost_records(assignee_id);
CREATE INDEX idx_cost_records_status ON cost_records(status);
CREATE INDEX idx_cost_records_team ON cost_records(team);
CREATE INDEX idx_cost_records_date ON cost_records(registration_date);
```

### 2.3 업무관리 모듈

```sql
-- 업무 테이블
CREATE TABLE task_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  no SERIAL,
  registration_date DATE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  team TEXT NOT NULL CHECK (team IN ('개발팀', '디자인팀', '기획팀', '마케팅팀')),
  department TEXT NOT NULL CHECK (department IN ('IT', '기획')),
  work_content TEXT NOT NULL,
  status TEXT DEFAULT '대기' CHECK (status IN ('대기', '진행', '완료', '홀딩')),
  assignee_id UUID REFERENCES user_profiles(id),
  start_date DATE,
  completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- 업무 첨부파일 테이블
CREATE TABLE task_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_record_id UUID REFERENCES task_records(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_task_records_assignee ON task_records(assignee_id);
CREATE INDEX idx_task_records_status ON task_records(status);
CREATE INDEX idx_task_records_team ON task_records(team);
```

### 2.4 교육관리 모듈

```sql
-- 교육 기록 테이블
CREATE TABLE education_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_date DATE NOT NULL,
  start_date DATE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  education_type TEXT NOT NULL CHECK (education_type IN ('신입교육', '담당자교육', '관리자교육', '수시교육')),
  content TEXT NOT NULL,
  participants INTEGER DEFAULT 0,
  location TEXT NOT NULL,
  status TEXT DEFAULT '예정' CHECK (status IN ('예정', '진행', '완료', '취소')),
  completion_date DATE,
  assignee_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- 커리큘럼 테이블
CREATE TABLE education_curriculum (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  education_record_id UUID REFERENCES education_records(id) ON DELETE CASCADE,
  time_slot TEXT NOT NULL,
  subject TEXT NOT NULL,
  instructor TEXT NOT NULL,
  content TEXT NOT NULL,
  attachment_path TEXT,
  sort_order INTEGER DEFAULT 0
);

-- 참석자 테이블
CREATE TABLE education_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  education_record_id UUID REFERENCES education_records(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  attendance TEXT DEFAULT '예정' CHECK (attendance IN ('예정', '참석', '불참')),
  report_path TEXT,
  note TEXT
);

-- 교육 실적 테이블
CREATE TABLE education_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  education_record_id UUID REFERENCES education_records(id) ON DELETE CASCADE,
  performance TEXT,
  improvement TEXT,
  feedback TEXT
);

-- 인덱스 생성
CREATE INDEX idx_education_records_status ON education_records(status);
CREATE INDEX idx_education_records_type ON education_records(education_type);
```

### 2.5 공통 시스템 테이블

```sql
-- 코드 자동 생성을 위한 시퀀스 테이블
CREATE TABLE code_sequences (
  module_type TEXT PRIMARY KEY,
  current_year INTEGER NOT NULL,
  current_sequence INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 시스템 설정 테이블
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES user_profiles(id)
);

-- 활동 로그 테이블 (감사 추적용)
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET
);
```

## 🔌 3. API 엔드포인트 설계

### 3.1 Supabase Client 기본 설정

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// 타입 정의
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
      }
      cost_records: {
        Row: CostRecord
        Insert: Omit<CostRecord, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CostRecord, 'id' | 'created_at'>>
      }
      // ... 다른 테이블 타입들
    }
  }
}
```

### 3.2 비용관리 API

```typescript
// api/cost.ts
import { supabase } from '@/lib/supabase'
import type { CostRecord } from '@/types/cost'

export class CostAPI {
  // 비용 목록 조회
  static async getCostRecords(filters?: {
    team?: string
    status?: string
    assignee?: string
    dateRange?: { start: string; end: string }
  }) {
    let query = supabase
      .from('cost_records')
      .select(`
        *,
        assignee:user_profiles(name, email),
        comments:cost_comments(
          id, content, timestamp,
          author:user_profiles(name, avatar_url)
        ),
        attachments:cost_attachments(*),
        amount_details:cost_amount_details(*)
      `)

    if (filters?.team) {
      query = query.eq('team', filters.team)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.assignee) {
      query = query.eq('assignee_id', filters.assignee)
    }
    if (filters?.dateRange) {
      query = query
        .gte('registration_date', filters.dateRange.start)
        .lte('registration_date', filters.dateRange.end)
    }

    return query.order('registration_date', { ascending: false })
  }

  // 비용 기록 생성
  static async createCostRecord(data: Omit<CostRecord, 'id'>) {
    const { data: newRecord, error } = await supabase
      .from('cost_records')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return newRecord
  }

  // 비용 기록 수정
  static async updateCostRecord(id: string, data: Partial<CostRecord>) {
    const { data: updatedRecord, error } = await supabase
      .from('cost_records')
      .update({ ...data, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updatedRecord
  }

  // 댓글 추가
  static async addComment(costRecordId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('인증되지 않은 사용자')

    const { data: comment, error } = await supabase
      .from('cost_comments')
      .insert({
        cost_record_id: costRecordId,
        author_id: user.id,
        content
      })
      .select(`
        *,
        author:user_profiles(name, avatar_url)
      `)
      .single()

    if (error) throw error
    return comment
  }

  // 파일 업로드
  static async uploadFile(costRecordId: string, file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${costRecordId}/${Date.now()}.${fileExt}`

    // Supabase Storage에 파일 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cost-attachments')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // 첨부파일 기록 저장
    const { data: { user } } = await supabase.auth.getUser()
    const { data: attachment, error: dbError } = await supabase
      .from('cost_attachments')
      .insert({
        cost_record_id: costRecordId,
        name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: fileName,
        uploaded_by: user?.id
      })
      .select()
      .single()

    if (dbError) throw dbError
    return attachment
  }
}
```

### 3.3 업무관리 API

```typescript
// api/task.ts
export class TaskAPI {
  static async getTaskRecords(filters?: TaskFilterOptions) {
    let query = supabase
      .from('task_records')
      .select(`
        *,
        assignee:user_profiles(name, email, avatar_url),
        attachments:task_attachments(*)
      `)

    // 필터 적용 로직
    if (filters?.department) {
      query = query.eq('department', filters.department)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    return query.order('created_at', { ascending: false })
  }

  static async createTaskRecord(data: Omit<TaskRecord, 'id' | 'no'>) {
    // 자동 증가 코드 생성 로직
    const code = await this.generateTaskCode()
    
    const { data: newRecord, error } = await supabase
      .from('task_records')
      .insert({ ...data, code })
      .select()
      .single()

    if (error) throw error
    return newRecord
  }

  private static async generateTaskCode(): Promise<string> {
    // 연도별 시퀀스 관리
    const year = new Date().getFullYear()
    const { data: sequence, error } = await supabase
      .rpc('get_next_sequence', { 
        module_type: 'TASK',
        year: year
      })

    if (error) throw error
    return `TASK-${year.toString().slice(-2)}-${String(sequence).padStart(3, '0')}`
  }
}
```

### 3.4 교육관리 API

```typescript
// api/education.ts
export class EducationAPI {
  static async getEducationRecords() {
    return supabase
      .from('education_records')
      .select(`
        *,
        assignee:user_profiles(name, email),
        curriculum:education_curriculum(*),
        participants:education_participants(*),
        result:education_results(*)
      `)
      .order('start_date', { ascending: false })
  }

  static async createEducationRecord(data: Omit<EducationRecord, 'id'>) {
    const { curriculum, participants, result, ...mainData } = data

    // 트랜잭션 처리
    const { data: newRecord, error } = await supabase
      .from('education_records')
      .insert(mainData)
      .select()
      .single()

    if (error) throw error

    // 커리큘럼 추가
    if (curriculum.length > 0) {
      await supabase
        .from('education_curriculum')
        .insert(curriculum.map(item => ({
          ...item,
          education_record_id: newRecord.id
        })))
    }

    // 참석자 추가
    if (participants.length > 0) {
      await supabase
        .from('education_participants')
        .insert(participants.map(item => ({
          ...item,
          education_record_id: newRecord.id
        })))
    }

    return newRecord
  }
}
```

## 🔐 4. 인증 및 보안 설정

### 4.1 Supabase Auth 설정

```typescript
// contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: any) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // 프로필 정보 동기화
        if (session?.user) {
          await syncUserProfile(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, userData: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// 사용자 프로필 동기화
async function syncUserProfile(user: User) {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    // 프로필이 없으면 생성
    await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url
      })
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### 4.2 Row Level Security (RLS) 정책

```sql
-- 사용자 프로필 정책
CREATE POLICY "Enable read access for authenticated users" ON user_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 비용 기록 정책
CREATE POLICY "Enable read access for authenticated users" ON cost_records
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON cost_records
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for record owners and managers" ON cost_records
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 첨부파일 정책
CREATE POLICY "Users can upload files to their records" ON cost_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cost_records 
      WHERE id = cost_record_id AND 
      (created_by = auth.uid() OR assignee_id = auth.uid())
    )
  );
```

### 4.3 Edge Functions 예시

```typescript
// supabase/functions/generate-report/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
      }
    )

    const { type, filters } = await req.json()

    switch (type) {
      case 'cost-report':
        const { data: costData } = await supabaseClient
          .from('cost_records')
          .select('*')
          .gte('registration_date', filters.startDate)
          .lte('registration_date', filters.endDate)

        // 리포트 생성 로직
        const report = generateCostReport(costData)
        
        return new Response(
          JSON.stringify({ report }),
          { headers: { "Content-Type": "application/json" } }
        )

      default:
        throw new Error('지원되지 않는 리포트 타입')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

## 📱 5. Real-time 기능 구현

### 5.1 실시간 데이터 동기화

```typescript
// hooks/useRealtime.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useRealtimeCosts() {
  const [costs, setCosts] = useState<CostRecord[]>([])

  useEffect(() => {
    // 초기 데이터 로드
    loadCosts()

    // 실시간 구독
    const channel = supabase
      .channel('cost_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cost_records'
        },
        (payload) => {
          handleRealtimeUpdate(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadCosts = async () => {
    const { data } = await CostAPI.getCostRecords()
    setCosts(data || [])
  }

  const handleRealtimeUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setCosts(prev => [payload.new, ...prev])
    } else if (payload.eventType === 'UPDATE') {
      setCosts(prev => 
        prev.map(item => 
          item.id === payload.new.id ? payload.new : item
        )
      )
    } else if (payload.eventType === 'DELETE') {
      setCosts(prev => 
        prev.filter(item => item.id !== payload.old.id)
      )
    }
  }

  return costs
}
```

## 🗂️ 6. Storage 설정

### 6.1 파일 저장소 구성

```sql
-- Storage Bucket 생성 (Supabase 대시보드에서)
INSERT INTO storage.buckets (id, name, public) VALUES 
('cost-attachments', 'cost-attachments', false),
('task-attachments', 'task-attachments', false),
('education-materials', 'education-materials', false),
('user-avatars', 'user-avatars', true);

-- Storage 정책 설정
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view files in their records" ON storage.objects
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    bucket_id IN ('cost-attachments', 'task-attachments', 'education-materials')
  );

CREATE POLICY "Public avatar access" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-avatars');
```

### 6.2 파일 업로드 컴포넌트

```typescript
// components/FileUpload.tsx
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface FileUploadProps {
  bucket: string
  onUpload: (path: string, file: File) => void
  accept?: string
  maxSize?: number
}

export function FileUpload({ bucket, onUpload, accept, maxSize = 10 * 1024 * 1024 }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (maxSize && file.size > maxSize) {
      alert('파일 크기가 너무 큽니다.')
      return
    }

    try {
      setUploading(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      onUpload(data.path, file)
    } catch (error) {
      console.error('파일 업로드 실패:', error)
      alert('파일 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept={accept}
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>업로드 중...</p>}
    </div>
  )
}
```

## 🚀 Phase 1: 사전 준비 완전 가이드 (100% 달성)

### ✅ 1.1 팀 교육 및 환경 준비 (즉시 실행)

#### 📚 Supabase 교육 자료 준비
```bash
# 1. 교육 자료 폴더 생성
mkdir -p docs/supabase-guide

# 2. 기본 개념 문서 생성
cat > docs/supabase-guide/01-basic-concepts.md << 'EOF'
# Supabase 기본 개념

## 1. PostgreSQL 데이터베이스
- ACID 속성을 보장하는 관계형 데이터베이스
- 강력한 쿼리 성능과 확장성

## 2. Row Level Security (RLS)
- 테이블 행 단위 보안 정책
- 사용자별/역할별 데이터 접근 제어

## 3. Real-time 구독
- WebSocket 기반 실시간 데이터 동기화
- INSERT, UPDATE, DELETE 이벤트 구독 가능

## 4. Storage
- 파일 업로드/다운로드 관리
- 이미지 변환 및 최적화 지원
EOF

# 3. PostgreSQL 쿼리 가이드 생성
cat > docs/supabase-guide/02-postgresql-queries.md << 'EOF'
# PostgreSQL 쿼리 작성 가이드

## 기본 쿼리 패턴
```sql
-- 데이터 조회 (필터링 + 정렬)
SELECT * FROM cost_records 
WHERE status = '진행' 
ORDER BY created_at DESC;

-- 조인 쿼리
SELECT cr.*, up.name as assignee_name
FROM cost_records cr
LEFT JOIN user_profiles up ON cr.assignee_id = up.id;

-- 집계 쿼리
SELECT status, COUNT(*) as count, SUM(amount) as total
FROM cost_records 
GROUP BY status;
```
EOF

# 4. RLS 정책 가이드 생성  
cat > docs/supabase-guide/03-rls-policies.md << 'EOF'
# Row Level Security 정책 작성 가이드

## 기본 패턴
```sql
-- 1. RLS 활성화
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 2. 읽기 정책
CREATE POLICY "사용자는 본인 데이터만 조회 가능" ON table_name
  FOR SELECT USING (user_id = auth.uid());

-- 3. 쓰기 정책  
CREATE POLICY "사용자는 본인 데이터만 수정 가능" ON table_name
  FOR UPDATE USING (user_id = auth.uid());
```
EOF
```

#### 🛠️ 개발 도구 자동 설치 스크립트
```bash
# setup-dev-environment.sh 생성
cat > setup-dev-environment.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Nexwork Supabase 개발 환경 설정 시작..."

# 1. Supabase CLI 설치
echo "📦 Supabase CLI 설치 중..."
npm install -g supabase

# 2. PostgreSQL 클라이언트 설치 안내
echo "🔧 PostgreSQL 클라이언트 설치 안내:"
echo "- Windows: https://www.pgadmin.org/download/pgadmin-4-windows/"
echo "- macOS: brew install --cask pgadmin4"
echo "- Ubuntu: sudo apt install pgadmin4-desktop"

# 3. Git hooks 설정
echo "🔗 Git hooks 설정 중..."
mkdir -p .git/hooks

cat > .git/hooks/pre-commit << 'HOOK'
#!/bin/bash
# TypeScript 타입 체크
npm run typecheck
# ESLint 검사
npm run lint
HOOK

chmod +x .git/hooks/pre-commit

# 4. VSCode 설정 추가
mkdir -p .vscode
cat > .vscode/extensions.json << 'VSCODE'
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "supabase.supabase-vscode",
    "ms-vscode.vscode-json"
  ]
}
VSCODE

echo "✅ 개발 환경 설정 완료!"
echo "🎯 다음 단계: Phase 2 - 인프라 구축"
EOF

chmod +x setup-dev-environment.sh
./setup-dev-environment.sh
```

### ✅ 1.2 성능 요구사항 정량화 (완료 검증 포함)

#### 📊 성능 기준 명세서 생성
```bash
cat > docs/performance-requirements.md << 'EOF'
# 성능 요구사항 명세서

## 🎯 목표 성능 지표
| 항목 | 목표값 | 측정 방법 |
|------|--------|-----------|
| 페이지 로딩 시간 | < 2초 | Lighthouse Performance |
| API 응답 시간 | < 500ms | Network 탭 측정 |
| DB 쿼리 시간 | < 100ms | EXPLAIN ANALYZE |
| 파일 업로드 속도 | > 1MB/s | 실제 파일 업로드 테스트 |

## 📈 예상 사용량
- **동시 사용자**: 100명
- **일일 활성 사용자**: 500명  
- **DB 크기**: 1GB (1년 운영 기준)
- **월간 API 요청**: 100만 건
- **Storage 사용량**: 10GB

## 🔍 성능 측정 스크립트
```bash
# 성능 테스트 실행
npm run test:performance
```
EOF

# 성능 테스트 스크립트 생성
cat > scripts/performance-test.js << 'EOF'
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runPerformanceTest() {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {logLevel: 'info', output: 'html', onlyCategories: ['performance'], port: chrome.port};
  const runnerResult = await lighthouse('http://localhost:3000', options);
  
  console.log('Performance Score:', runnerResult.lhr.categories.performance.score * 100);
  
  await chrome.kill();
}

runPerformanceTest();
EOF
```

---

## 🏗️ Phase 2: 인프라 구축 완전 가이드 (100% 달성)

### ✅ 2.1 Supabase 프로젝트 자동 설정

#### 🚀 완전 자동화 설치 스크립트
```bash
# create-supabase-project.sh 생성
cat > create-supabase-project.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Supabase 프로젝트 생성 가이드"
echo "================================="

# 1. Supabase 계정 확인
echo "1️⃣ Supabase 계정 생성 확인"
echo "   - https://supabase.com/dashboard 방문"
echo "   - GitHub 또는 이메일로 회원가입"
echo "   - 계정 생성 완료했습니까? (y/n)"
read -r account_created
if [[ $account_created != "y" ]]; then
  echo "❌ 계정을 먼저 생성해주세요"
  exit 1
fi

# 2. 프로젝트 생성 가이드
echo ""
echo "2️⃣ 새 프로젝트 생성"
echo "   - 'New project' 클릭"
echo "   - Project name: nexwork-backend"
echo "   - Database password: [강력한 비밀번호 생성]"
echo "   - Region: Asia Pacific (ap-northeast-1) 선택"
echo "   - Pricing plan: Free tier 선택"
echo ""
echo "프로젝트 생성을 완료했습니까? (y/n)"
read -r project_created
if [[ $project_created != "y" ]]; then
  echo "❌ 프로젝트를 먼저 생성해주세요"
  exit 1
fi

# 3. API Keys 정보 입력
echo ""
echo "3️⃣ API Keys 설정"
echo "Dashboard > Settings > API 페이지에서 다음 정보를 확인하세요:"
echo ""
echo "Project URL을 입력하세요:"
read -r project_url
echo "anon public key를 입력하세요:"
read -r anon_key
echo "service_role key를 입력하세요:"  
read -r service_key

# 4. 환경변수 파일 생성
echo ""
echo "4️⃣ 환경변수 설정 중..."
cat > .env.local << ENV
## Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${project_url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon_key}
SUPABASE_SERVICE_ROLE_KEY=${service_key}

## Database URL (for migrations)
DATABASE_URL=${project_url/https:\/\//postgresql://postgres:[PASSWORD]@}/postgres?sslmode=require

## 기존 설정 유지
NEXT_PUBLIC_VERSION=v3.0.0
GENERATE_SOURCEMAP=false
NEXT_PUBLIC_API_URL=https://mock-data-api-nextjs.vercel.app/
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAXv4RQK39CskcIB8fvM1Q7XCofZcLxUXw
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoicmFrZXNoLW5ha3JhbmkiLCJhIjoiY2xsNjNkZm0yMGhvcDNlb3phdjF4dHlzeiJ9.ps6azYbr7M3rGk_QTguMEQ
NEXTAUTH_URL=http://localhost:3200
NEXTAUTH_SECRET=LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=
NEXT_APP_JWT_TIMEOUT=86400
JWT_SECRET=ikRgjkhi15HJiU78-OLKfjngiu
ENV

# 5. Supabase 패키지 설치
echo ""
echo "5️⃣ Supabase 패키지 설치 중..."
npm install @supabase/supabase-js
npm install -D supabase

# 6. Supabase 초기화
echo ""
echo "6️⃣ Supabase 로컬 환경 초기화 중..."
npx supabase init

# 7. 설정 완료 확인
echo ""
echo "✅ Supabase 인프라 설정 완료!"
echo ""
echo "📋 다음 단계:"
echo "   1. npx supabase start (로컬 환경 시작)"
echo "   2. Database 스키마 생성"
echo "   3. 데이터 마이그레이션"
echo ""
echo "🔗 유용한 링크:"
echo "   - Supabase Dashboard: ${project_url}"
echo "   - 로컬 Studio: http://localhost:54323"
EOF

chmod +x create-supabase-project.sh
```

#### 🔧 로컬 개발 환경 검증 스크립트
```bash
# verify-local-setup.sh 생성
cat > verify-local-setup.sh << 'EOF'
#!/bin/bash
set -e

echo "🔍 Supabase 로컬 환경 검증 중..."

# 1. Docker 실행 상태 확인
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker가 실행되지 않았습니다. Docker Desktop을 시작해주세요."
    exit 1
fi
echo "✅ Docker 실행 확인"

# 2. Supabase CLI 설치 확인
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI가 설치되지 않았습니다."
    exit 1
fi
echo "✅ Supabase CLI 설치 확인"

# 3. 환경변수 파일 확인
if [ ! -f .env.local ]; then
    echo "❌ .env.local 파일이 없습니다."
    exit 1
fi
echo "✅ 환경변수 파일 확인"

# 4. Supabase 로컬 서비스 시작
echo "🚀 Supabase 로컬 서비스 시작 중..."
supabase start

# 5. 서비스 상태 확인
sleep 10
if curl -f http://localhost:54323 > /dev/null 2>&1; then
    echo "✅ Supabase Studio 접근 가능 (http://localhost:54323)"
else
    echo "❌ Supabase Studio 접근 불가"
    exit 1
fi

if curl -f http://localhost:54321/health > /dev/null 2>&1; then
    echo "✅ Supabase API 정상 작동"
else
    echo "❌ Supabase API 접근 불가"
    exit 1
fi

echo ""
echo "🎉 로컬 환경 설정 완료!"
echo "📋 접근 정보:"
echo "   - Studio UI: http://localhost:54323"
echo "   - API URL: http://localhost:54321"  
echo "   - DB URL: postgresql://postgres:postgres@localhost:54322/postgres"
EOF

chmod +x verify-local-setup.sh
```

---

## 🗄️ Phase 3: 데이터베이스 완전 구현 가이드 (100% 달성)

### ✅ 3.1 실행 가능한 스키마 생성

#### 📋 완전한 마이그레이션 스크립트
```bash
# 마이그레이션 파일 생성
supabase migration new "01_create_initial_schema"

# SQL 스크립트 작성
cat > supabase/migrations/$(ls supabase/migrations/ | grep "01_create_initial_schema").sql << 'EOF'
-- =========================================
-- 1. Extensions and Functions
-- =========================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Updated at 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 코드 생성 시퀀스 함수
CREATE OR REPLACE FUNCTION get_next_sequence(p_module_type TEXT, p_year INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_current_sequence INTEGER;
BEGIN
    INSERT INTO code_sequences (module_type, current_year, current_sequence)
    VALUES (p_module_type, p_year, 1)
    ON CONFLICT (module_type) 
    DO UPDATE SET 
        current_sequence = CASE 
            WHEN code_sequences.current_year = p_year THEN code_sequences.current_sequence + 1
            ELSE 1
        END,
        current_year = p_year,
        updated_at = NOW();
    
    SELECT current_sequence INTO v_current_sequence 
    FROM code_sequences 
    WHERE module_type = p_module_type;
    
    RETURN v_current_sequence;
END;
$$ language 'plpgsql';

-- =========================================
-- 2. 사용자 프로필 테이블
-- =========================================

CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    department TEXT,
    position TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by authenticated users" 
ON user_profiles FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile" 
ON user_profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = id);

-- Updated at 트리거
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- 3. 코드 시퀀스 관리 테이블
-- =========================================

CREATE TABLE code_sequences (
    module_type TEXT PRIMARY KEY,
    current_year INTEGER NOT NULL,
    current_sequence INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 4. 비용관리 테이블들
-- =========================================

-- 비용 기록 메인 테이블
CREATE TABLE cost_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    registration_date DATE NOT NULL,
    start_date DATE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    team TEXT NOT NULL,
    assignee_id UUID REFERENCES user_profiles(id),
    cost_type TEXT NOT NULL CHECK (cost_type IN ('솔루션', '하드웨어', '출장경비', '행사경비', '사무경비')),
    content TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT '대기' CHECK (status IN ('대기', '진행', '완료', '취소')),
    completion_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- 금액 계산 검증 제약조건
ALTER TABLE cost_records ADD CONSTRAINT check_amount_calculation 
CHECK (amount = quantity * unit_price);

-- 인덱스 생성
CREATE INDEX idx_cost_records_assignee ON cost_records(assignee_id);
CREATE INDEX idx_cost_records_status ON cost_records(status);
CREATE INDEX idx_cost_records_team ON cost_records(team);
CREATE INDEX idx_cost_records_date ON cost_records(registration_date DESC);
CREATE INDEX idx_cost_records_compound ON cost_records(status, team, registration_date DESC);

-- RLS 정책
ALTER TABLE cost_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cost records" 
ON cost_records FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create cost records" 
ON cost_records FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own cost records" 
ON cost_records FOR UPDATE 
USING (created_by = auth.uid() OR assignee_id = auth.uid());

-- Updated at 트리거
CREATE TRIGGER update_cost_records_updated_at 
    BEFORE UPDATE ON cost_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 금액 상세 테이블
CREATE TABLE cost_amount_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cost_record_id UUID REFERENCES cost_records(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    cost_type TEXT NOT NULL,
    content TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL
);

-- 비용 댓글 테이블
CREATE TABLE cost_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cost_record_id UUID REFERENCES cost_records(id) ON DELETE CASCADE,
    author_id UUID REFERENCES user_profiles(id),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 비용 첨부파일 테이블
CREATE TABLE cost_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cost_record_id UUID REFERENCES cost_records(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES user_profiles(id)
);

-- =========================================
-- 5. 업무관리 테이블들
-- =========================================

CREATE TABLE task_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    no SERIAL,
    registration_date DATE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    team TEXT NOT NULL CHECK (team IN ('개발팀', '디자인팀', '기획팀', '마케팅팀')),
    department TEXT NOT NULL CHECK (department IN ('IT', '기획')),
    work_content TEXT NOT NULL,
    status TEXT DEFAULT '대기' CHECK (status IN ('대기', '진행', '완료', '홀딩')),
    assignee_id UUID REFERENCES user_profiles(id),
    start_date DATE,
    completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- 인덱스 생성
CREATE INDEX idx_task_records_assignee_status ON task_records(assignee_id, status) WHERE status != '완료';
CREATE INDEX idx_task_records_team ON task_records(team);

-- RLS 정책
ALTER TABLE task_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view task records" 
ON task_records FOR SELECT 
USING (auth.role() = 'authenticated');

-- Updated at 트리거
CREATE TRIGGER update_task_records_updated_at 
    BEFORE UPDATE ON task_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 업무 첨부파일 테이블
CREATE TABLE task_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_record_id UUID REFERENCES task_records(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 6. 교육관리 테이블들
-- =========================================

CREATE TABLE education_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    registration_date DATE NOT NULL,
    start_date DATE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    education_type TEXT NOT NULL CHECK (education_type IN ('신입교육', '담당자교육', '관리자교육', '수시교육')),
    content TEXT NOT NULL,
    participants INTEGER DEFAULT 0,
    location TEXT NOT NULL,
    status TEXT DEFAULT '예정' CHECK (status IN ('예정', '진행', '완료', '취소')),
    completion_date DATE,
    assignee_id UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- 인덱스 생성
CREATE INDEX idx_education_records_status ON education_records(status);
CREATE INDEX idx_education_records_type ON education_records(education_type);

-- RLS 정책
ALTER TABLE education_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view education records" 
ON education_records FOR SELECT 
USING (auth.role() = 'authenticated');

-- Updated at 트리거
CREATE TRIGGER update_education_records_updated_at 
    BEFORE UPDATE ON education_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 교육 커리큘럼 테이블
CREATE TABLE education_curriculum (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    education_record_id UUID REFERENCES education_records(id) ON DELETE CASCADE,
    time_slot TEXT NOT NULL,
    subject TEXT NOT NULL,
    instructor TEXT NOT NULL,
    content TEXT NOT NULL,
    attachment_path TEXT,
    sort_order INTEGER DEFAULT 0
);

-- 교육 참석자 테이블
CREATE TABLE education_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    education_record_id UUID REFERENCES education_records(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    department TEXT NOT NULL,
    position TEXT NOT NULL,
    attendance TEXT DEFAULT '예정' CHECK (attendance IN ('예정', '참석', '불참')),
    report_path TEXT,
    note TEXT
);

-- 교육 실적 테이블
CREATE TABLE education_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    education_record_id UUID REFERENCES education_records(id) ON DELETE CASCADE,
    performance TEXT,
    improvement TEXT,
    feedback TEXT
);

-- =========================================
-- 7. 시스템 테이블들
-- =========================================

-- 시스템 설정 테이블
CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES user_profiles(id)
);

-- 활동 로그 테이블 (감사 추적용)
CREATE TABLE activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET
);

-- 성능 로그 테이블
CREATE TABLE performance_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    query_name TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 8. 초기 데이터 삽입
-- =========================================

-- 코드 시퀀스 초기화
INSERT INTO code_sequences (module_type, current_year, current_sequence) VALUES 
('COST', EXTRACT(YEAR FROM NOW()), 0),
('TASK', EXTRACT(YEAR FROM NOW()), 0),
('EDU', EXTRACT(YEAR FROM NOW()), 0);

-- 시스템 설정 초기값
INSERT INTO system_settings (key, value, description) VALUES 
('app_name', '"Nexwork Management System"', '애플리케이션 이름'),
('version', '"1.0.0"', '현재 버전'),
('maintenance_mode', 'false', '유지보수 모드'),
('max_file_size_mb', '10', '최대 파일 크기 (MB)'),
('allowed_file_types', '["jpg", "jpeg", "png", "pdf", "docx", "xlsx", "pptx"]', '허용된 파일 형식');
EOF

echo "✅ 마이그레이션 파일 생성 완료!"
```

#### 🔍 스키마 검증 스크립트
```bash
# validate-schema.sh 생성
cat > validate-schema.sh << 'EOF'
#!/bin/bash
set -e

echo "🔍 데이터베이스 스키마 검증 중..."

# 1. 마이그레이션 적용
echo "📋 마이그레이션 적용 중..."
supabase db reset

# 2. 테이블 존재 확인
echo "🔍 테이블 존재 확인 중..."
TABLES="user_profiles cost_records task_records education_records"
for table in $TABLES; do
    if supabase db psql -c "\dt $table" | grep -q "$table"; then
        echo "✅ $table 테이블 존재 확인"
    else
        echo "❌ $table 테이블 없음"
        exit 1
    fi
done

# 3. 제약조건 확인
echo "🔍 제약조건 확인 중..."
supabase db psql -c "
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('CHECK', 'FOREIGN KEY', 'UNIQUE')
ORDER BY tc.table_name;
"

# 4. 인덱스 확인
echo "🔍 인덱스 확인 중..."
supabase db psql -c "
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename;
"

# 5. RLS 정책 확인
echo "🔍 RLS 정책 확인 중..."
supabase db psql -c "
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = true;
"

# 6. 트리거 확인
echo "🔍 트리거 확인 중..."
supabase db psql -c "
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
"

echo ""
echo "✅ 데이터베이스 스키마 검증 완료!"
echo "🎯 다음 단계: Phase 4 - 보안 및 권한 관리"
EOF

chmod +x validate-schema.sh
```

---

## 🔐 Phase 4: 보안 및 권한 관리 완전 가이드 (100% 달성)

### ✅ 4.1 Supabase Auth 완전 설정

#### 🔑 인증 시스템 자동 설정 스크립트
```bash
# setup-authentication.sh 생성
cat > setup-authentication.sh << 'EOF'
#!/bin/bash
set -e

echo "🔐 Supabase Authentication 설정 시작..."

# 1. Supabase 클라이언트 라이브러리 생성
mkdir -p lib
cat > lib/supabase.ts << 'CLIENT'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// 서버사이드 클라이언트 (Service Role Key 사용)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
CLIENT

# 2. 인증 컨텍스트 생성
mkdir -p contexts
cat > contexts/AuthContext.tsx << 'CONTEXT'
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url?: string
  role: 'admin' | 'manager' | 'user'
  department?: string
  position?: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: AuthError }>
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<{ error?: AuthError }>
  signOut: () => Promise<{ error?: AuthError }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: Error }>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        // 프로필이 없으면 기본 프로필 생성
        const defaultProfile = {
          id: userId,
          email: user?.email || '',
          name: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
          role: 'user' as const
        }
        
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert(defaultProfile)
          .select()
          .single()

        if (!insertError) {
          setProfile(newProfile)
        }
      } else if (!error) {
        setProfile(profile)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error: result.error }
  }

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name || email.split('@')[0]
        }
      }
    })

    // 회원가입 성공 시 프로필 생성
    if (result.data.user && !result.error) {
      await supabase.from('user_profiles').insert({
        id: result.data.user.id,
        email,
        name: userData.name || email.split('@')[0],
        role: userData.role || 'user',
        department: userData.department,
        position: userData.position
      })
    }

    return { error: result.error }
  }

  const signOut = async () => {
    const result = await supabase.auth.signOut()
    setProfile(null)
    return { error: result.error }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('사용자가 인증되지 않았습니다') }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (!error && profile) {
        setProfile({ ...profile, ...updates })
      }

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
CONTEXT

# 3. 보호된 라우트 컴포넌트
cat > contexts/ProtectedRoute.tsx << 'PROTECTED'
'use client'

import { useAuth } from './AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'manager' | 'user'
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredRole = 'user', 
  fallback = <div>접근 권한이 없습니다.</div> 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>로딩 중...</div>
  }

  if (!user || !profile) {
    return null
  }

  // 역할 기반 접근 제어
  const roleHierarchy = { admin: 3, manager: 2, user: 1 }
  const userLevel = roleHierarchy[profile.role]
  const requiredLevel = roleHierarchy[requiredRole]

  if (userLevel < requiredLevel) {
    return fallback
  }

  return <>{children}</>
}
PROTECTED

echo "✅ 인증 시스템 설정 완료!"
EOF

chmod +x setup-authentication.sh
./setup-authentication.sh
```

#### 🔒 RLS 정책 테스트 스크립트
```bash
# test-rls-policies.sh 생성
cat > test-rls-policies.sh << 'EOF'
#!/bin/bash
set -e

echo "🔍 RLS 정책 테스트 시작..."

# 테스트용 사용자 생성 함수
create_test_user() {
    local email=$1
    local role=$2
    
    # Supabase Auth API를 통해 사용자 생성
    supabase db psql -c "
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        '$email',
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );
    "
}

# 1. 테스트 사용자들 생성
echo "📋 테스트 사용자 생성 중..."
create_test_user "admin@test.com" "admin"
create_test_user "manager@test.com" "manager"
create_test_user "user@test.com" "user"

# 2. 사용자 프로필 생성
echo "👤 사용자 프로필 생성 중..."
supabase db psql -c "
INSERT INTO user_profiles (id, email, name, role, department)
SELECT 
    id,
    email,
    SPLIT_PART(email, '@', 1),
    CASE 
        WHEN email = 'admin@test.com' THEN 'admin'
        WHEN email = 'manager@test.com' THEN 'manager'
        ELSE 'user'
    END,
    'IT팀'
FROM auth.users
WHERE email IN ('admin@test.com', 'manager@test.com', 'user@test.com');
"

# 3. 테스트 데이터 생성
echo "📊 테스트 데이터 생성 중..."
ADMIN_ID=$(supabase db psql -t -c "SELECT id FROM user_profiles WHERE email = 'admin@test.com';")
USER_ID=$(supabase db psql -t -c "SELECT id FROM user_profiles WHERE email = 'user@test.com';")

supabase db psql -c "
INSERT INTO cost_records (
    registration_date, start_date, code, team, assignee_id, 
    cost_type, content, quantity, unit_price, amount, 
    status, created_by
) VALUES 
(
    CURRENT_DATE, CURRENT_DATE, 'TEST-001', 'IT팀', '$USER_ID',
    '솔루션', 'RLS 테스트용 데이터', 1, 100000, 100000,
    '대기', '$USER_ID'
);
"

# 4. RLS 정책 테스트 실행
echo "🔍 RLS 정책 테스트 실행..."

# 일반 사용자가 본인 데이터만 수정 가능한지 테스트
echo "테스트 1: 사용자가 본인 데이터만 수정 가능한지 확인"
RESULT=$(supabase db psql -t -c "
SET LOCAL \"request.jwt.claims\" TO '{\"sub\": \"$USER_ID\", \"role\": \"authenticated\"}';
UPDATE cost_records SET content = '수정된 내용' WHERE code = 'TEST-001';
SELECT ROW_COUNT();
" 2>/dev/null || echo "0")

if [ "$RESULT" = "1" ]; then
    echo "✅ 테스트 1 통과: 사용자가 본인 데이터 수정 가능"
else
    echo "❌ 테스트 1 실패: 사용자가 본인 데이터 수정 불가"
fi

# 관리자가 모든 데이터 접근 가능한지 테스트
echo "테스트 2: 관리자가 모든 데이터 접근 가능한지 확인"
ADMIN_ACCESS=$(supabase db psql -t -c "
SET LOCAL \"request.jwt.claims\" TO '{\"sub\": \"$ADMIN_ID\", \"role\": \"authenticated\"}';
SELECT COUNT(*) FROM cost_records;
" 2>/dev/null || echo "0")

if [ "$ADMIN_ACCESS" -gt "0" ]; then
    echo "✅ 테스트 2 통과: 관리자가 모든 데이터 접근 가능"
else
    echo "❌ 테스트 2 실패: 관리자가 데이터에 접근 불가"
fi

echo ""
echo "✅ RLS 정책 테스트 완료!"
echo "🎯 다음 단계: Phase 5 - 데이터 마이그레이션"
EOF

chmod +x test-rls-policies.sh
```

---

## 📦 Phase 5: 데이터 마이그레이션 완전 가이드 (100% 달성)

### ✅ 5.1 완전 자동화 마이그레이션 스크립트

#### 🔄 전체 데이터 마이그레이션 실행
```bash
# migrate-all-data.sh 생성
cat > migrate-all-data.sh << 'EOF'
#!/bin/bash
set -e

echo "📦 전체 데이터 마이그레이션 시작..."

# 1. 백업 생성
echo "💾 현재 목업 데이터 백업 생성..."
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

# 목업 데이터 백업
cp -r src/data/ $BACKUP_DIR/
echo "✅ 백업 완료: $BACKUP_DIR"

# 2. 마이그레이션 진행 상황 로깅
exec > >(tee -a migration.log)
exec 2>&1

echo "📋 마이그레이션 시작 시간: $(date)"

# 3. TypeScript 마이그레이션 스크립트 생성 및 실행
cat > scripts/data-migration.ts << 'MIGRATION'
import { supabaseAdmin } from '@/lib/supabase'
import { costData } from '@/data/cost'
import { taskData } from '@/data/task'  
import { educationData } from '@/data/education'

interface MigrationStats {
  total: number
  success: number
  failed: number
  errors: string[]
}

class DataMigrator {
  private stats = {
    users: { total: 0, success: 0, failed: 0, errors: [] } as MigrationStats,
    costs: { total: 0, success: 0, failed: 0, errors: [] } as MigrationStats,
    tasks: { total: 0, success: 0, failed: 0, errors: [] } as MigrationStats,
    education: { total: 0, success: 0, failed: 0, errors: [] } as MigrationStats
  }

  async migrateAllData() {
    console.log('🚀 데이터 마이그레이션 시작...')
    
    try {
      await this.createDefaultUsers()
      await this.migrateCostData()
      await this.migrateTaskData()
      await this.migrateEducationData()
      
      this.printMigrationReport()
      console.log('✅ 데이터 마이그레이션 완료!')
    } catch (error) {
      console.error('❌ 마이그레이션 실패:', error)
      throw error
    }
  }

  private async createDefaultUsers() {
    console.log('👤 기본 사용자 생성 중...')
    
    const defaultUsers = [
      { email: 'admin@nexwork.com', name: '시스템 관리자', role: 'admin', department: 'IT팀' },
      { email: 'kim@nexwork.com', name: '김철수', role: 'user', department: 'IT팀' },
      { email: 'park@nexwork.com', name: '박영희', role: 'user', department: '마케팅팀' },
      { email: 'lee@nexwork.com', name: '이민수', role: 'user', department: 'IT팀' },
      { email: 'choi@nexwork.com', name: '최윤정', role: 'user', department: '영업팀' },
      { email: 'jung@nexwork.com', name: '정상현', role: 'manager', department: '기획팀' }
    ]

    this.stats.users.total = defaultUsers.length

    for (const userData of defaultUsers) {
      try {
        // 1. Auth 사용자 생성
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: 'temp123456!',
          email_confirm: true,
          user_metadata: {
            name: userData.name
          }
        })

        if (authError) throw authError

        // 2. 프로필 생성
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            id: authUser.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            department: userData.department
          })

        if (profileError) throw profileError

        this.stats.users.success++
        console.log(`✅ 사용자 생성 완료: ${userData.name}`)
      } catch (error) {
        this.stats.users.failed++
        this.stats.users.errors.push(`${userData.name}: ${error.message}`)
        console.error(`❌ 사용자 생성 실패: ${userData.name}`, error)
      }
    }
  }

  private async migrateCostData() {
    console.log('💰 비용 데이터 마이그레이션 중...')
    
    this.stats.costs.total = costData.length

    for (const record of costData) {
      try {
        // 담당자 ID 찾기
        const assigneeId = await this.getUserIdByName(record.assignee)
        
        // 비용 기록 생성
        const { data: newRecord, error: recordError } = await supabaseAdmin
          .from('cost_records')
          .insert({
            registration_date: record.registrationDate,
            start_date: record.startDate,
            code: record.code,
            team: record.team,
            assignee_id: assigneeId,
            cost_type: record.costType,
            content: record.content,
            quantity: record.quantity,
            unit_price: record.unitPrice,
            amount: record.amount,
            status: record.status,
            completion_date: record.completionDate || null,
            created_by: assigneeId
          })
          .select()
          .single()

        if (recordError) throw recordError

        // 댓글 마이그레이션
        if (record.comments?.length > 0) {
          for (const comment of record.comments) {
            const commentAuthorId = await this.getUserIdByName(comment.author)
            await supabaseAdmin
              .from('cost_comments')
              .insert({
                cost_record_id: newRecord.id,
                author_id: commentAuthorId,
                content: comment.content,
                timestamp: comment.timestamp
              })
          }
        }

        // 첨부파일 정보 마이그레이션
        if (record.attachments?.length > 0) {
          for (const attachment of record.attachments) {
            await supabaseAdmin
              .from('cost_attachments')
              .insert({
                cost_record_id: newRecord.id,
                name: attachment.name,
                file_type: attachment.type,
                file_size: this.parseFileSize(attachment.size),
                storage_path: `migrated/${attachment.name}`,
                upload_date: attachment.uploadDate,
                uploaded_by: assigneeId
              })
          }
        }

        this.stats.costs.success++
        console.log(`✅ 비용 기록 마이그레이션 완료: ${record.code}`)
      } catch (error) {
        this.stats.costs.failed++
        this.stats.costs.errors.push(`${record.code}: ${error.message}`)
        console.error(`❌ 비용 기록 마이그레이션 실패: ${record.code}`, error)
      }
    }
  }

  private async migrateTaskData() {
    console.log('📋 업무 데이터 마이그레이션 중...')
    
    this.stats.tasks.total = taskData.length

    for (const record of taskData) {
      try {
        const assigneeId = await this.getUserIdByName(record.assignee)
        
        const { error } = await supabaseAdmin
          .from('task_records')
          .insert({
            registration_date: record.registrationDate,
            code: record.code,
            team: record.team,
            department: record.department,
            work_content: record.workContent,
            status: record.status,
            assignee_id: assigneeId,
            start_date: record.startDate || null,
            completed_date: record.completedDate || null,
            created_by: assigneeId
          })

        if (error) throw error

        this.stats.tasks.success++
        console.log(`✅ 업무 기록 마이그레이션 완료: ${record.code}`)
      } catch (error) {
        this.stats.tasks.failed++
        this.stats.tasks.errors.push(`${record.code}: ${error.message}`)
        console.error(`❌ 업무 기록 마이그레이션 실패: ${record.code}`, error)
      }
    }
  }

  private async migrateEducationData() {
    console.log('📚 교육 데이터 마이그레이션 중...')
    
    this.stats.education.total = educationData.length

    for (const record of educationData) {
      try {
        const assigneeId = await this.getUserIdByName(record.assignee)
        
        // 교육 기록 생성
        const { data: newRecord, error: recordError } = await supabaseAdmin
          .from('education_records')
          .insert({
            registration_date: record.registrationDate,
            start_date: record.startDate,
            code: record.code,
            education_type: record.educationType,
            content: record.content,
            participants: record.participants,
            location: record.location,
            status: record.status,
            completion_date: record.completionDate || null,
            assignee_id: assigneeId,
            created_by: assigneeId
          })
          .select()
          .single()

        if (recordError) throw recordError

        // 커리큘럼 마이그레이션
        if (record.curriculum?.length > 0) {
          await supabaseAdmin
            .from('education_curriculum')
            .insert(
              record.curriculum.map((item, index) => ({
                education_record_id: newRecord.id,
                time_slot: item.time,
                subject: item.subject,
                instructor: item.instructor,
                content: item.content,
                attachment_path: item.attachment,
                sort_order: index
              }))
            )
        }

        // 참석자 마이그레이션
        if (record.participantList?.length > 0) {
          await supabaseAdmin
            .from('education_participants')
            .insert(
              record.participantList.map(item => ({
                education_record_id: newRecord.id,
                participant_name: item.name,
                department: item.department,
                position: item.position,
                attendance: item.attendance,
                report_path: item.report,
                note: item.note
              }))
            )
        }

        // 교육 실적 마이그레이션
        if (record.result) {
          await supabaseAdmin
            .from('education_results')
            .insert({
              education_record_id: newRecord.id,
              performance: record.result.performance,
              improvement: record.result.improvement,
              feedback: record.result.feedback
            })
        }

        this.stats.education.success++
        console.log(`✅ 교육 기록 마이그레이션 완료: ${record.code}`)
      } catch (error) {
        this.stats.education.failed++
        this.stats.education.errors.push(`${record.code}: ${error.message}`)
        console.error(`❌ 교육 기록 마이그레이션 실패: ${record.code}`, error)
      }
    }
  }

  private async getUserIdByName(name: string): Promise<string | null> {
    const { data } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('name', name)
      .single()
    
    return data?.id || null
  }

  private parseFileSize(sizeStr: string): number {
    const match = sizeStr.match(/([\d.]+)\s*(MB|KB|GB)/i)
    if (!match) return 0
    
    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()
    
    switch (unit) {
      case 'KB': return value * 1024
      case 'MB': return value * 1024 * 1024
      case 'GB': return value * 1024 * 1024 * 1024
      default: return value
    }
  }

  private printMigrationReport() {
    console.log('\n📊 마이그레이션 결과 리포트')
    console.log('================================')
    
    const categories = ['users', 'costs', 'tasks', 'education']
    const categoryNames = ['사용자', '비용', '업무', '교육']
    
    categories.forEach((category, index) => {
      const stats = this.stats[category]
      console.log(`\n${categoryNames[index]}:`)
      console.log(`  전체: ${stats.total}`)
      console.log(`  성공: ${stats.success}`)
      console.log(`  실패: ${stats.failed}`)
      console.log(`  성공률: ${((stats.success / stats.total) * 100).toFixed(1)}%`)
      
      if (stats.errors.length > 0) {
        console.log('  오류:')
        stats.errors.forEach(error => console.log(`    - ${error}`))
      }
    })

    const totalRecords = Object.values(this.stats).reduce((sum, stat) => sum + stat.total, 0)
    const totalSuccess = Object.values(this.stats).reduce((sum, stat) => sum + stat.success, 0)
    const totalFailed = Object.values(this.stats).reduce((sum, stat) => sum + stat.failed, 0)

    console.log('\n📈 전체 요약:')
    console.log(`  전체 레코드: ${totalRecords}`)
    console.log(`  성공: ${totalSuccess}`)
    console.log(`  실패: ${totalFailed}`)
    console.log(`  전체 성공률: ${((totalSuccess / totalRecords) * 100).toFixed(1)}%`)
  }
}

// 마이그레이션 실행
const migrator = new DataMigrator()
migrator.migrateAllData().catch(console.error)
MIGRATION

# 4. TypeScript 컴파일 및 실행
echo "🔄 마이그레이션 스크립트 실행 중..."
npx tsx scripts/data-migration.ts

# 5. 데이터 무결성 검증
echo "🔍 데이터 무결성 검증 중..."
./verify-migration.sh

echo "📋 마이그레이션 완료 시간: $(date)"
EOF

chmod +x migrate-all-data.sh
```

#### 🔍 마이그레이션 검증 스크립트
```bash
# verify-migration.sh 생성
cat > verify-migration.sh << 'EOF'
#!/bin/bash
set -e

echo "🔍 마이그레이션 결과 검증 중..."

# 1. 레코드 수 확인
echo "📊 레코드 수 검증..."
USER_COUNT=$(supabase db psql -t -c "SELECT COUNT(*) FROM user_profiles;")
COST_COUNT=$(supabase db psql -t -c "SELECT COUNT(*) FROM cost_records;")
TASK_COUNT=$(supabase db psql -t -c "SELECT COUNT(*) FROM task_records;")
EDU_COUNT=$(supabase db psql -t -c "SELECT COUNT(*) FROM education_records;")

echo "사용자: $USER_COUNT"
echo "비용 기록: $COST_COUNT"
echo "업무 기록: $TASK_COUNT"
echo "교육 기록: $EDU_COUNT"

# 2. 외래키 참조 무결성 확인
echo "🔗 참조 무결성 확인..."
ORPHAN_COSTS=$(supabase db psql -t -c "SELECT COUNT(*) FROM cost_records WHERE assignee_id NOT IN (SELECT id FROM user_profiles);")
ORPHAN_TASKS=$(supabase db psql -t -c "SELECT COUNT(*) FROM task_records WHERE assignee_id NOT IN (SELECT id FROM user_profiles);")

if [ "$ORPHAN_COSTS" -eq "0" ] && [ "$ORPHAN_TASKS" -eq "0" ]; then
    echo "✅ 외래키 참조 무결성 정상"
else
    echo "❌ 참조 무결성 문제 발견 - 고아 레코드: 비용($ORPHAN_COSTS), 업무($ORPHAN_TASKS)"
fi

# 3. 금액 계산 정확성 검증
echo "💰 금액 계산 검증..."
AMOUNT_ERRORS=$(supabase db psql -t -c "SELECT COUNT(*) FROM cost_records WHERE amount != quantity * unit_price;")

if [ "$AMOUNT_ERRORS" -eq "0" ]; then
    echo "✅ 금액 계산 정확성 정상"
else
    echo "❌ 금액 계산 오류 $AMOUNT_ERRORS건 발견"
fi

# 4. 샘플 데이터 수동 검증
echo "🔍 샘플 데이터 검증..."
supabase db psql -c "
SELECT 
    cr.code,
    cr.content,
    cr.amount,
    up.name as assignee_name
FROM cost_records cr
LEFT JOIN user_profiles up ON cr.assignee_id = up.id
LIMIT 5;
"

echo ""
echo "✅ 마이그레이션 검증 완료!"
echo "🎯 다음 단계: Phase 6 - API 및 프론트엔드 통합"
EOF

chmod +x verify-migration.sh
```

---

## 🔌 Phase 6: API 및 프론트엔드 통합 완전 가이드 (100% 달성)

### ✅ 6.1 Supabase 클라이언트 완전 통합

#### 🚀 타입 안전한 API 클래스 생성
```bash
# generate-api-classes.sh 생성
cat > generate-api-classes.sh << 'EOF'
#!/bin/bash
set -e

echo "🔧 API 클래스 생성 중..."

# 1. 데이터베이스 타입 생성
echo "📝 TypeScript 타입 생성 중..."
npx supabase gen types typescript --project-id $(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2 | cut -d'/' -f3 | cut -d'.' -f1) > types/database.types.ts

# 2. 비용관리 API 클래스
mkdir -p lib/api
cat > lib/api/cost.ts << 'COST_API'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type CostRecord = Database['public']['Tables']['cost_records']['Row']
type CostRecordInsert = Database['public']['Tables']['cost_records']['Insert']
type CostRecordUpdate = Database['public']['Tables']['cost_records']['Update']

export class CostAPI {
  // 비용 목록 조회 (필터링 포함)
  static async getCostRecords(filters?: {
    team?: string
    status?: string
    assignee?: string
    dateRange?: { start: string; end: string }
  }) {
    let query = supabase
      .from('cost_records')
      .select(`
        *,
        assignee:user_profiles(name, email, avatar_url),
        comments:cost_comments(
          id, content, timestamp,
          author:user_profiles(name, avatar_url)
        ),
        attachments:cost_attachments(*),
        amount_details:cost_amount_details(*)
      `)

    // 필터 적용
    if (filters?.team) {
      query = query.eq('team', filters.team)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.assignee) {
      query = query.eq('assignee_id', filters.assignee)
    }
    if (filters?.dateRange) {
      query = query
        .gte('registration_date', filters.dateRange.start)
        .lte('registration_date', filters.dateRange.end)
    }

    return query.order('registration_date', { ascending: false })
  }

  // 비용 기록 생성
  static async createCostRecord(data: Omit<CostRecordInsert, 'id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('인증되지 않은 사용자')

    // 코드 자동 생성
    const year = new Date().getFullYear()
    const { data: sequence } = await supabase.rpc('get_next_sequence', {
      p_module_type: 'COST',
      p_year: year
    })

    const code = `COST-${year.toString().slice(-2)}-${String(sequence).padStart(3, '0')}`

    const { data: newRecord, error } = await supabase
      .from('cost_records')
      .insert({
        ...data,
        code,
        created_by: user.id
      })
      .select(`
        *,
        assignee:user_profiles(name, email)
      `)
      .single()

    if (error) throw error
    return newRecord
  }

  // 비용 기록 수정
  static async updateCostRecord(id: string, data: CostRecordUpdate) {
    const { data: updatedRecord, error } = await supabase
      .from('cost_records')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        assignee:user_profiles(name, email)
      `)
      .single()

    if (error) throw error
    return updatedRecord
  }

  // 비용 기록 삭제
  static async deleteCostRecord(id: string) {
    const { error } = await supabase
      .from('cost_records')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // 댓글 추가
  static async addComment(costRecordId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('인증되지 않은 사용자')

    const { data: comment, error } = await supabase
      .from('cost_comments')
      .insert({
        cost_record_id: costRecordId,
        author_id: user.id,
        content
      })
      .select(`
        *,
        author:user_profiles(name, avatar_url)
      `)
      .single()

    if (error) throw error
    return comment
  }

  // 파일 업로드
  static async uploadFile(costRecordId: string, file: File) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('인증되지 않은 사용자')

    const fileExt = file.name.split('.').pop()
    const fileName = `${costRecordId}/${Date.now()}.${fileExt}`

    // 파일 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cost-attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // 메타데이터 저장
    const { data: attachment, error: dbError } = await supabase
      .from('cost_attachments')
      .insert({
        cost_record_id: costRecordId,
        name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: fileName,
        uploaded_by: user.id
      })
      .select()
      .single()

    if (dbError) throw dbError
    return attachment
  }

  // 파일 다운로드 URL 생성
  static async getFileDownloadUrl(storagePath: string) {
    const { data } = await supabase.storage
      .from('cost-attachments')
      .createSignedUrl(storagePath, 3600) // 1시간 유효

    return data?.signedUrl
  }

  // 통계 데이터 조회
  static async getCostStatistics() {
    const { data: records } = await this.getCostRecords()
    
    if (!records) return null

    const totalAmount = records.reduce((sum, record) => sum + record.amount, 0)
    const statusStats = records.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const typeStats = records.reduce((acc, record) => {
      acc[record.cost_type] = (acc[record.cost_type] || 0) + record.amount
      return acc
    }, {} as Record<string, number>)

    return {
      totalAmount,
      totalCount: records.length,
      statusStats,
      typeStats
    }
  }
}
COST_API

# 3. 업무관리 API 클래스  
cat > lib/api/task.ts << 'TASK_API'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type TaskRecord = Database['public']['Tables']['task_records']['Row']
type TaskRecordInsert = Database['public']['Tables']['task_records']['Insert']
type TaskRecordUpdate = Database['public']['Tables']['task_records']['Update']

export class TaskAPI {
  static async getTaskRecords(filters?: {
    department?: string
    status?: string
    assignee?: string
    team?: string
  }) {
    let query = supabase
      .from('task_records')
      .select(`
        *,
        assignee:user_profiles(name, email, avatar_url),
        attachments:task_attachments(*)
      `)

    if (filters?.department) {
      query = query.eq('department', filters.department)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.assignee) {
      query = query.eq('assignee_id', filters.assignee)
    }
    if (filters?.team) {
      query = query.eq('team', filters.team)
    }

    return query.order('created_at', { ascending: false })
  }

  static async createTaskRecord(data: Omit<TaskRecordInsert, 'id' | 'code' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('인증되지 않은 사용자')

    // 자동 코드 생성
    const year = new Date().getFullYear()
    const { data: sequence } = await supabase.rpc('get_next_sequence', {
      p_module_type: 'TASK',
      p_year: year
    })

    const code = `TASK-${year.toString().slice(-2)}-${String(sequence).padStart(3, '0')}`

    const { data: newRecord, error } = await supabase
      .from('task_records')
      .insert({
        ...data,
        code,
        created_by: user.id
      })
      .select(`
        *,
        assignee:user_profiles(name, email)
      `)
      .single()

    if (error) throw error
    return newRecord
  }

  static async updateTaskRecord(id: string, data: TaskRecordUpdate) {
    const { data: updatedRecord, error } = await supabase
      .from('task_records')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        assignee:user_profiles(name, email)
      `)
      .single()

    if (error) throw error
    return updatedRecord
  }

  static async deleteTaskRecord(id: string) {
    const { error } = await supabase
      .from('task_records')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
TASK_API

# 4. 교육관리 API 클래스
cat > lib/api/education.ts << 'EDU_API'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type EducationRecord = Database['public']['Tables']['education_records']['Row']
type EducationRecordInsert = Database['public']['Tables']['education_records']['Insert']

export class EducationAPI {
  static async getEducationRecords() {
    return supabase
      .from('education_records')
      .select(`
        *,
        assignee:user_profiles(name, email),
        curriculum:education_curriculum(*),
        participants:education_participants(*),
        result:education_results(*)
      `)
      .order('start_date', { ascending: false })
  }

  static async createEducationRecord(data: {
    main: Omit<EducationRecordInsert, 'id' | 'code' | 'created_at' | 'updated_at'>
    curriculum: Array<{
      time_slot: string
      subject: string
      instructor: string
      content: string
      attachment_path?: string
    }>
    participants: Array<{
      participant_name: string
      department: string
      position: string
      attendance?: string
    }>
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('인증되지 않은 사용자')

    // 트랜잭션 처리를 위한 RPC 함수 호출
    const year = new Date().getFullYear()
    const { data: sequence } = await supabase.rpc('get_next_sequence', {
      p_module_type: 'EDU',
      p_year: year
    })

    const typeCode = {
      '신입교육': 'I',
      '담당자교육': 'S',
      '관리자교육': 'M',  
      '수시교육': 'A'
    }[data.main.education_type]

    const code = `EDU-${typeCode}-${year.toString().slice(-2)}-${String(sequence).padStart(3, '0')}`

    // 메인 레코드 생성
    const { data: newRecord, error: recordError } = await supabase
      .from('education_records')
      .insert({
        ...data.main,
        code,
        created_by: user.id
      })
      .select()
      .single()

    if (recordError) throw recordError

    // 커리큘럼 추가
    if (data.curriculum.length > 0) {
      const { error: curriculumError } = await supabase
        .from('education_curriculum')
        .insert(
          data.curriculum.map((item, index) => ({
            ...item,
            education_record_id: newRecord.id,
            sort_order: index
          }))
        )

      if (curriculumError) throw curriculumError
    }

    // 참석자 추가
    if (data.participants.length > 0) {
      const { error: participantsError } = await supabase
        .from('education_participants')
        .insert(
          data.participants.map(item => ({
            ...item,
            education_record_id: newRecord.id
          }))
        )

      if (participantsError) throw participantsError
    }

    return newRecord
  }
}
EDU_API

echo "✅ API 클래스 생성 완료!"
echo "🎯 다음 단계: React Hook 생성"
EOF

chmod +x generate-api-classes.sh
./generate-api-classes.sh
```

#### Phase 3: 핵심 모듈 마이그레이션 (2-3주)

**Week 1: 비용관리 모듈**
```typescript
// 기존 목업 데이터를 Supabase로 이전
async function migrateCostData() {
  const existingData = await import('@/data/cost')
  
  for (const record of existingData.costData) {
    await supabase
      .from('cost_records')
      .insert({
        ...record,
        assignee_id: await getUserIdByName(record.assignee),
        created_by: 'system-migration'
      })
  }
}
```

**Week 2: 업무관리 모듈**
- Task 데이터 마이그레이션
- 칸반 보드 실시간 동기화 구현

**Week 3: 교육관리 모듈**
- Education 데이터 마이그레이션
- 복잡한 관계형 데이터 처리

#### Phase 4: 고급 기능 구현 (1-2주)
1. **실시간 기능 구현**
2. **파일 업로드/다운로드 시스템**
3. **검색 및 필터링 최적화**
4. **리포트 생성 시스템**

#### Phase 5: 성능 최적화 및 테스팅 (1주)
1. **쿼리 최적화**
2. **인덱스 튜닝**
3. **로드 테스팅**
4. **보안 감사**

### 7.2 데이터 마이그레이션 스크립트

```typescript
// scripts/migrate-data.ts
import { supabase } from '@/lib/supabase'
import { costData } from '@/data/cost'
import { taskData } from '@/data/task'
import { educationData } from '@/data/education'

class DataMigrator {
  async migrateAllData() {
    console.log('데이터 마이그레이션 시작...')
    
    try {
      await this.createDefaultUsers()
      await this.migrateCostData()
      await this.migrateTaskData()
      await this.migrateEducationData()
      
      console.log('데이터 마이그레이션 완료!')
    } catch (error) {
      console.error('마이그레이션 실패:', error)
    }
  }

  private async createDefaultUsers() {
    const defaultUsers = [
      { email: 'admin@nexwork.com', name: '관리자', role: 'admin' },
      { email: 'kim@nexwork.com', name: '김철수', role: 'user' },
      // ... 더 많은 사용자
    ]

    for (const user of defaultUsers) {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'temp123456',
        email_confirm: true
      })

      if (!authError && authUser.user) {
        await supabase
          .from('user_profiles')
          .insert({
            id: authUser.user.id,
            email: user.email,
            name: user.name,
            role: user.role
          })
      }
    }
  }

  private async migrateCostData() {
    console.log('비용 데이터 마이그레이션 중...')
    
    for (const record of costData) {
      const assigneeId = await this.getUserIdByName(record.assignee)
      
      const { data: newRecord, error } = await supabase
        .from('cost_records')
        .insert({
          registration_date: record.registrationDate,
          start_date: record.startDate,
          code: record.code,
          team: record.team,
          assignee_id: assigneeId,
          cost_type: record.costType,
          content: record.content,
          quantity: record.quantity,
          unit_price: record.unitPrice,
          amount: record.amount,
          status: record.status,
          completion_date: record.completionDate || null
        })
        .select()
        .single()

      if (error) {
        console.error(`비용 기록 ${record.code} 마이그레이션 실패:`, error)
        continue
      }

      // 첨부파일 정보 마이그레이션
      if (record.attachments?.length > 0) {
        for (const attachment of record.attachments) {
          await supabase
            .from('cost_attachments')
            .insert({
              cost_record_id: newRecord.id,
              name: attachment.name,
              file_type: attachment.type,
              file_size: this.parseFileSize(attachment.size),
              storage_path: `migrated/${attachment.name}`,
              upload_date: attachment.uploadDate
            })
        }
      }
    }
  }

  private async getUserIdByName(name: string): Promise<string | null> {
    const { data } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('name', name)
      .single()
    
    return data?.id || null
  }

  private parseFileSize(sizeStr: string): number {
    const match = sizeStr.match(/([\d.]+)\s*(MB|KB|GB)/i)
    if (!match) return 0
    
    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()
    
    switch (unit) {
      case 'KB': return value * 1024
      case 'MB': return value * 1024 * 1024
      case 'GB': return value * 1024 * 1024 * 1024
      default: return value
    }
  }
}

// 실행
const migrator = new DataMigrator()
migrator.migrateAllData()
```

## 🔧 8. 배포 및 운영 계획

### 8.1 환경별 설정

#### 개발 환경
```yaml
# .env.development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local_anon_key
SUPABASE_SERVICE_ROLE_KEY=local_service_role_key
```

#### 스테이징 환경
```yaml
# .env.staging
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging_anon_key
SUPABASE_SERVICE_ROLE_KEY=staging_service_role_key
```

#### 프로덕션 환경
```yaml
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_role_key
```

### 8.2 CI/CD 파이프라인

```yaml
# .github/workflows/deploy.yml
name: Deploy to Supabase

on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build application
        run: npm run build
        
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Deploy to Supabase
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 8.3 모니터링 및 로깅

```typescript
// lib/monitoring.ts
import { supabase } from '@/lib/supabase'

export class MonitoringService {
  static async logActivity(
    action: string,
    tableName: string,
    recordId?: string,
    oldValues?: any,
    newValues?: any
  ) {
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user?.id,
        action,
        table_name: tableName,
        record_id: recordId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: await this.getClientIP()
      })
  }

  static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  // 성능 모니터링
  static async trackQueryPerformance(
    queryName: string,
    startTime: number
  ) {
    const duration = Date.now() - startTime
    
    if (duration > 1000) { // 1초 이상 걸린 쿼리 로깅
      console.warn(`Slow query detected: ${queryName} took ${duration}ms`)
      
      await supabase
        .from('performance_logs')
        .insert({
          query_name: queryName,
          duration_ms: duration,
          timestamp: new Date()
        })
    }
  }
}
```

### 8.4 백업 및 복구 계획

```bash
# 데이터베이스 백업 스크립트
#!/bin/bash
# backup.sh

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/supabase"

# PostgreSQL 덤프 생성
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Supabase Storage 백업
supabase storage download --project-ref $PROJECT_REF

# 백업 파일 압축
gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# 30일 이상 된 백업 파일 삭제
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "백업 완료: backup_$TIMESTAMP.sql.gz"
```

## 📊 9. 성능 최적화 방안

### 9.1 데이터베이스 최적화

```sql
-- 인덱스 최적화
CREATE INDEX CONCURRENTLY idx_cost_records_compound 
ON cost_records (status, team, registration_date DESC);

CREATE INDEX CONCURRENTLY idx_task_records_assignee_status 
ON task_records (assignee_id, status) WHERE status != '완료';

-- 파티셔닝 (대용량 데이터 처리용)
CREATE TABLE cost_records_2024 PARTITION OF cost_records
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE cost_records_2025 PARTITION OF cost_records  
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- 통계 정보 업데이트 자동화
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'update-table-stats',
  '0 2 * * *',
  'ANALYZE cost_records, task_records, education_records;'
);
```

### 9.2 프론트엔드 최적화

```typescript
// hooks/useOptimizedQuery.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useOptimizedCostRecords() {
  return useQuery({
    queryKey: ['cost-records'],
    queryFn: async () => {
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('cost_records')
        .select(`
          id, code, content, amount, status, team,
          assignee:user_profiles(name)
        `)
        .order('registration_date', { ascending: false })
        .limit(50) // 페이지네이션
      
      // 성능 모니터링
      MonitoringService.trackQueryPerformance('cost-records-list', startTime)
      
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분 후 가비지 컬렉션
  })
}

// 무한 스크롤 구현
export function useInfiniteCostRecords() {
  return useInfiniteQuery({
    queryKey: ['cost-records-infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('cost_records')
        .select('*')
        .range(pageParam * 20, (pageParam + 1) * 20 - 1)
        .order('registration_date', { ascending: false })
      
      if (error) throw error
      return {
        data,
        nextCursor: data.length === 20 ? pageParam + 1 : undefined
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor
  })
}
```

## 🎯 10. 결론 및 기대 효과

### 10.1 구현 후 기대 효과

#### 기술적 개선사항
1. **확장성**: PostgreSQL 기반으로 대용량 데이터 처리 가능
2. **실시간성**: Realtime 구독으로 즉각적인 데이터 동기화
3. **보안성**: RLS 기반 세밀한 접근 제어
4. **성능**: 인덱싱과 쿼리 최적화로 빠른 응답 시간

#### 비즈니스 개선사항
1. **협업 효율성**: 실시간 데이터 공유로 팀 협업 향상
2. **데이터 신뢰성**: ACID 속성 보장으로 데이터 무결성 확보
3. **감사 추적**: 모든 변경사항 로깅으로 투명성 확보
4. **모바일 지원**: 반응형 설계로 모든 기기에서 접근 가능

### 10.2 추가 개선 계획

#### 단기 계획 (3-6개월)
- **고급 검색**: Full-text search 구현
- **알림 시스템**: 이메일/푸시 알림 구현
- **대시보드 강화**: 실시간 차트 및 위젯
- **모바일 앱**: React Native 기반 앱 개발

#### 중장기 계획 (6개월-1년)
- **AI 통합**: 비용 예측 및 업무 자동화
- **워크플로우**: 승인 프로세스 자동화
- **API 개방**: 외부 시스템 연동 지원
- **글로벌화**: 다국어 지원 및 타임존 처리

### 10.3 리스크 관리

#### 기술적 리스크
- **데이터 마이그레이션 실패**: 단계별 검증 및 롤백 계획 수립
- **성능 저하**: 로드 테스팅 및 점진적 최적화
- **보안 취약점**: 정기적 보안 감사 및 업데이트

#### 운영 리스크  
- **사용자 적응**: 충분한 교육 및 가이드 제공
- **데이터 손실**: 정기 백업 및 복구 테스트
- **서비스 중단**: 모니터링 및 알림 시스템 구축

---

## 📚 부록

### A. 필수 패키지 설치 목록

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.3",
    "@tanstack/react-query": "^5.62.16",
    "next": "15.1.6",
    "react": "18.3.1",
    "typescript": "5.7.3"
  },
  "devDependencies": {
    "supabase": "^1.123.4"
  }
}
```

### B. 유용한 Supabase CLI 명령어

```bash
# 프로젝트 초기화
supabase init

# 로컬 개발 환경 시작
supabase start

# 마이그레이션 생성
supabase migration new migration_name

# 데이터베이스 리셋
supabase db reset

# 타입 생성
supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts

# 함수 배포
supabase functions deploy function_name

# 로그 확인
supabase functions logs function_name
```

### C. 참고 링크

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [Next.js 공식 문서](https://nextjs.org/docs)
- [React Query 공식 문서](https://tanstack.com/query/latest)

---

*이 문서는 Nexwork Frontend 프로젝트의 Supabase 백엔드 구축을 위한 포괄적인 계획서입니다. 구현 과정에서 세부 사항은 요구사항에 따라 조정될 수 있습니다.*