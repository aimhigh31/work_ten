#!/bin/bash
echo "🚀 Nexwork Frontend Supabase 설정 시작..."

# 1. Supabase CLI 설치 확인
if ! command -v supabase &> /dev/null; then
    echo "📦 Supabase CLI 설치 중..."
    npm install -g supabase
else
    echo "✅ Supabase CLI 이미 설치됨"
fi

# 2. 프로젝트 초기화 (이미 되어있으면 스킵)
if [ ! -d "supabase" ]; then
    echo "🏗️ Supabase 프로젝트 초기화..."
    supabase init
else
    echo "✅ Supabase 프로젝트 이미 초기화됨"
fi

# 3. 프로젝트 연동
echo "🔗 Supabase 프로젝트 연동..."
supabase link --project-ref exxumujwufzqnovhzvif --password "tg1150ja5%"

# 4. 현재 상태 확인
echo "📊 프로젝트 상태 확인..."
supabase status

echo "✅ Supabase 기본 설정 완료!"
echo "📝 다음 단계: npm run setup:database"