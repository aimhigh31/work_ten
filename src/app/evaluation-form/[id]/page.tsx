import PublicEvaluationForm from '@/components/PublicEvaluationForm';

// 메타데이터
export const metadata = {
  title: '인사평가 작성',
  description: '인사평가를 작성하는 페이지입니다.'
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EvaluationFormPage({ params }: PageProps) {
  const { id } = await params;
  return <PublicEvaluationForm evaluationId={id} />;
}
