'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Container,
  Stepper,
  Step,
  StepLabel,
  Divider,
  CircularProgress,
  Select,
  MenuItem
} from '@mui/material';
import { createClient } from '@/lib/supabase/client';

// 평가 상세 항목 타입
interface EvaluationDetailItem {
  id: number;
  no: number;
  major_category: string; // 대분류
  sub_category: string; // 소분류
  title: string; // 점검항목
  description: string; // 평가내용
  evaluation: string; // 평가 (미흡/보통/우수)
  score: number; // 점수
}

interface PublicEvaluationFormProps {
  evaluationId?: string;
}

const PublicEvaluationForm: React.FC<PublicEvaluationFormProps> = ({ evaluationId }) => {
  // 현재 단계 (1: 안내, 2: 평가개요서, 3: 체크시트)
  const [currentStep, setCurrentStep] = useState(1);

  // 로딩 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 평가 기본 정보
  const [evaluationTitle, setEvaluationTitle] = useState('');
  const [evaluationInfo, setEvaluationInfo] = useState<any>(null);
  const [evaluationType, setEvaluationType] = useState<'3단계' | '5단계'>('5단계');
  const [checklistGuide, setChecklistGuide] = useState('');

  // 피평가자 정보
  const [targetPerson, setTargetPerson] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');
  const [targetPosition, setTargetPosition] = useState('');

  // 평가자 정보
  const [evaluatorName, setEvaluatorName] = useState('');
  const [evaluatorDepartment, setEvaluatorDepartment] = useState('');
  const [evaluatorPosition, setEvaluatorPosition] = useState('');

  // 등록일 (자동)
  const registrationDate = new Date().toISOString().split('T')[0];

  // 평가 상세 항목 상태
  const [evaluationItems, setEvaluationItems] = useState<EvaluationDetailItem[]>([]);

  // DB에서 평가 정보와 체크리스트 불러오기
  useEffect(() => {
    const loadEvaluationData = async () => {
      if (!evaluationId) {
        setError('평가 ID가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const supabase = createClient();

        console.log('📝 평가 코드로 데이터 조회:', evaluationId);

        // 1. 평가 코드로 hr_evaluation_data 조회
        const { data: evalData, error: evalError } = await supabase
          .from('hr_evaluation_data')
          .select('*')
          .eq('evaluation_code', evaluationId)
          .single();

        console.log('📝 Supabase 응답:', { evalData, evalError });

        if (evalError) {
          console.error('❌ 평가 데이터 조회 오류:', evalError);
          console.error('❌ 오류 타입:', typeof evalError);
          console.error('❌ 오류 keys:', Object.keys(evalError));
          console.error('❌ 오류 message:', evalError?.message);
          console.error('❌ 오류 code:', evalError?.code);
          console.error('❌ 오류 details:', evalError?.details);
          console.error('❌ 오류 hint:', evalError?.hint);

          // PGRST116은 "no rows returned" 오류
          if (evalError.code === 'PGRST116') {
            throw new Error(`평가 코드 '${evaluationId}'에 해당하는 데이터를 찾을 수 없습니다. 평가를 다시 저장해주세요.`);
          }

          throw new Error(`평가 데이터 조회 실패: ${evalError.message || evalError.code || '알 수 없는 오류'}`);
        }

        console.log('✅ 평가 데이터 조회 성공:', evalData);

        if (!evalData) {
          throw new Error(`평가 데이터가 없습니다. (코드: ${evaluationId})`);
        }

        setEvaluationInfo(evalData);
        setEvaluationTitle(evalData.evaluation_title || '');
        setEvaluationType(evalData.checklist_evaluation_type || '5단계');
        setChecklistGuide(evalData.checklist_guide || '');

        console.log('📝 안내가이드 내용:', evalData.checklist_guide);
        console.log('📝 안내가이드 길이:', evalData.checklist_guide?.length || 0);

        // 2. checklist_id로 체크리스트 항목 조회
        if (!evalData.checklist_id) {
          throw new Error('체크리스트가 연결되지 않았습니다.');
        }

        console.log('📝 체크리스트 항목 조회:', evalData.checklist_id);

        const { data: checklistItems, error: checklistError } = await supabase
          .from('admin_checklist_editor')
          .select('*')
          .eq('checklist_id', evalData.checklist_id)
          .order('no', { ascending: true });

        if (checklistError) {
          console.error('❌ 체크리스트 항목 조회 오류:', checklistError);
          throw new Error('체크리스트 항목을 불러올 수 없습니다.');
        }

        console.log('✅ 체크리스트 항목 조회 성공:', checklistItems?.length, '개');

        // 3. 체크리스트 항목을 EvaluationDetailItem 형식으로 변환
        const items: EvaluationDetailItem[] = checklistItems.map((item, index) => {
          return {
            id: item.id || index + 1,
            no: item.no || index + 1,
            major_category: item.major_category || '',
            sub_category: item.sub_category || '',
            title: item.title || '',
            description: '', // 사용자가 입력할 내용
            evaluation: '선택', // 항상 '선택'으로 초기화 (DB 값 무시)
            score: 0 // 항상 0으로 초기화
          };
        });

        setEvaluationItems(items);
        console.log('✅ 평가 항목 설정 완료:', items.length, '개');

      } catch (err: any) {
        console.error('❌ 평가 데이터 로드 오류:', err);
        console.error('❌ 오류 타입:', typeof err);
        console.error('❌ 오류 전체:', JSON.stringify(err, null, 2));
        console.error('❌ 오류 message:', err?.message);
        console.error('❌ 오류 stack:', err?.stack);

        const errorMessage = err?.message ||
                            (typeof err === 'string' ? err : '') ||
                            (err?.toString && err.toString() !== '[object Object]' ? err.toString() : '') ||
                            '데이터를 불러오는 중 오류가 발생했습니다.';

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadEvaluationData();
  }, [evaluationId]);

  // 평가 선택 변경 핸들러
  const handleEvaluationChange = (itemId: number, evaluation: string) => {
    // 평가에 따라 자동으로 점수 설정
    let newScore = 0;

    if (evaluationType === '3단계') {
      newScore = evaluation === '우수' ? 3 : evaluation === '보통' ? 2 : evaluation === '미흡' ? 1 : 0;
    } else {
      newScore =
        evaluation === '매우 우수'
          ? 5
          : evaluation === '양호'
            ? 4
            : evaluation === '보통'
              ? 3
              : evaluation === '미흡'
                ? 2
                : evaluation === '매우 부족'
                  ? 1
                  : 0;
    }

    setEvaluationItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, evaluation, score: newScore } : item
      )
    );
  };

  // 점수 변경 핸들러
  const handleScoreChange = (itemId: number, score: number) => {
    setEvaluationItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, score } : item
      )
    );
  };

  // 평가내용 변경 핸들러
  const handleDescriptionChange = (itemId: number, description: string) => {
    setEvaluationItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, description } : item
      )
    );
  };

  // 2단계(평가개요서) 다음 버튼 핸들러
  const handleStep2Next = () => {
    if (!targetPerson || !targetDepartment || !targetPosition || !evaluatorName || !evaluatorDepartment || !evaluatorPosition) {
      alert('모든 정보를 입력해주세요.');
      return;
    }
    setCurrentStep(3);
  };

  // 제출 유효성 검사
  const handleSubmitEvaluation = async () => {
    console.log('🔍 제출 시도 - 현재 평가 항목:', evaluationItems);
    console.log('🔍 총 항목 수:', evaluationItems.length);
    console.log('🔍 평가 유형:', evaluationType);

    // 유효한 평가값 정의
    const validEvaluations3 = ['미흡', '보통', '우수'];
    const validEvaluations5 = ['매우 부족', '미흡', '보통', '양호', '매우 우수'];
    const validEvaluations = evaluationType === '3단계' ? validEvaluations3 : validEvaluations5;

    console.log('🔍 유효한 평가값:', validEvaluations);

    // 평가가 선택되지 않았거나 유효하지 않은 항목 찾기
    const invalidItems = evaluationItems.filter(
      (item) => !item.evaluation || item.evaluation === '' || item.evaluation === '선택' || !validEvaluations.includes(item.evaluation)
    );

    console.log('❌ 미입력 항목 수:', invalidItems.length);
    console.log('❌ 미입력 항목 상세:', invalidItems.map((item, idx) => ({
      no: evaluationItems.length - evaluationItems.indexOf(item),
      evaluation: item.evaluation,
      title: item.title
    })));

    if (invalidItems.length > 0) {
      // 첫 번째 미입력 항목의 NO 찾기
      const firstInvalidIndex = evaluationItems.findIndex(
        (item) => !item.evaluation || item.evaluation === '' || item.evaluation === '선택' || !validEvaluations.includes(item.evaluation)
      );
      const firstInvalidNo = evaluationItems.length - firstInvalidIndex;

      console.warn('⚠️ 제출 차단 - 미입력 항목 있음');

      alert(
        `❌ 평가 항목을 모두 선택해주세요!\n\n` +
        `📋 총 항목: ${evaluationItems.length}개\n` +
        `✅ 평가 완료: ${evaluationItems.length - invalidItems.length}개\n` +
        `❌ 미입력 항목: ${invalidItems.length}개\n\n` +
        `👉 첫 번째 미입력 항목: NO ${firstInvalidNo}`
      );
      return;
    }

    console.log('✅ 모든 항목 평가 완료 - 제출 진행');

    // 데이터 제출
    try {
      console.log('제출 데이터:', {
        evaluationId,
        targetPerson,
        department: targetDepartment,
        position: targetPosition,
        evaluator: evaluatorName,
        itemsCount: evaluationItems.length
      });

      const response = await fetch('/api/evaluation-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          evaluationId,
          targetPerson,
          department: targetDepartment,
          position: targetPosition,
          evaluator: evaluatorName,
          evaluatorDepartment,
          evaluatorPosition,
          items: evaluationItems
        })
      });

      console.log('응답 상태:', response.status, response.statusText);

      const responseText = await response.text();
      console.log('응답 원본:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        alert(`서버 응답 파싱 오류:\n${responseText.substring(0, 200)}`);
        return;
      }

      console.log('API 응답 객체:', JSON.stringify(responseData, null, 2));

      if (response.ok) {
        setCurrentStep(4); // 완료 단계로 이동
      } else {
        console.error('제출 오류:', responseData);
        alert(`제출 중 오류가 발생했습니다.\n${responseData.details || responseData.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('제출 오류:', error);
      alert(`제출 중 오류가 발생했습니다.\n${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 로딩 중
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>
            평가 데이터를 불러오는 중...
          </Typography>
        </Box>
      </Container>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Paper sx={{ p: 4, textAlign: 'center', border: '2px solid #f44336' }}>
          <Typography variant="h5" color="error" sx={{ mb: 2 }}>
            오류가 발생했습니다
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {error}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
            sx={{ mt: 3 }}
          >
            다시 시도
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3.5 }}>
      {/* 단계 표시 */}
      <Box sx={{ mb: 3.5 }}>
        <Stepper
          activeStep={currentStep - 1}
          alternativeLabel
          sx={{
            '& .MuiStepLabel-root': {
              fontSize: '1.045rem'
            },
            '& .MuiStepLabel-label': {
              fontSize: '1.045rem',
              fontWeight: 500,
              mt: 0.95
            },
            '& .MuiStepIcon-root': {
              fontSize: '2.375rem'
            },
            '& .MuiStepConnector-line': {
              borderTopWidth: '2.85px'
            }
          }}
        >
          <Step>
            <StepLabel>평가 안내</StepLabel>
          </Step>
          <Step>
            <StepLabel>평가개요서 작성</StepLabel>
          </Step>
          <Step>
            <StepLabel>체크시트 작성</StepLabel>
          </Step>
          <Step>
            <StepLabel>완료</StepLabel>
          </Step>
        </Stepper>
      </Box>

      {/* 단계 1: 설문조사 입장 안내 소개 */}
      {currentStep === 1 && (
        <Paper elevation={3} sx={{ p: 4.275, textAlign: 'center' }}>
          <Box sx={{ mb: 3.325 }}>
            <Box sx={{ fontSize: 58.9, mb: 1.615 }}>📋</Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1.615, color: '#1976d2', fontSize: '1.9rem' }}>
              인사평가 설문조사
            </Typography>
            <Typography variant="h6" sx={{ mb: 2.09, color: 'text.secondary', fontSize: '1.14rem' }}>
              평가 코드: {evaluationId || '미지정'}
            </Typography>
          </Box>

          <Divider sx={{ my: 3.325 }} />

          <Box sx={{ mb: 3.325, textAlign: 'left', maxWidth: 570, mx: 'auto' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.615, fontSize: '1.14rem' }}>
              📋 안내사항
            </Typography>
            {checklistGuide ? (
              <Box sx={{
                p: 1.9,
                bgcolor: '#f8f9fa',
                borderRadius: 1,
                border: '1px solid #e0e0e0'
              }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '0.9975rem',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.71
                  }}
                >
                  {checklistGuide}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.615}>
                <Typography variant="body1" sx={{ fontSize: '0.9975rem' }}>
                  • 본 평가는 13개 항목에 대한 행동지표 기반 평가입니다.
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.9975rem' }}>
                  • 각 항목마다 3개의 행동지표를 체크하고 실제점수를 입력해주세요.
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.9975rem' }}>
                  • 권장점수와 실제점수의 차이가 1점 이상일 경우 차이 사유를 반드시 입력해야 합니다.
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.9975rem' }}>
                  • 모든 항목 작성 후 제출하면 평가가 완료됩니다.
                </Typography>
                <Typography variant="body1" sx={{ color: '#d32f2f', fontWeight: 600, fontSize: '0.9975rem' }}>
                  • 평가 시간은 약 15~20분 정도 소요됩니다.
                </Typography>
              </Stack>
            )}
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={() => setCurrentStep(2)}
            sx={{ mt: 3.325, px: 5.225, py: 1.235, fontSize: '15.2px' }}
          >
            시작하기 →
          </Button>
        </Paper>
      )}

      {/* 단계 2: 평가개개서 작성 */}
      {currentStep === 2 && (
        <Paper elevation={3} sx={{ p: 3.325 }}>
          <Box sx={{ mb: 3.325 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.855, fontSize: '1.3775rem' }}>
              평가개요서 작성
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
              대상자와 평가자 정보를 입력해주세요
            </Typography>
          </Box>

          <Stack spacing={3.325}>
            {/* 평가 정보 */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.615, color: '#1976d2', fontSize: '1.045rem' }}>
                평가 정보
              </Typography>
              <Grid container spacing={1.9}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="등록일"
                    size="small"
                    value={registrationDate}
                    InputProps={{ readOnly: true }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="평가 코드"
                    size="small"
                    value={evaluationId || ''}
                    InputProps={{ readOnly: true }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* 대상자 정보 */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.615, color: '#1976d2', fontSize: '1.045rem' }}>
                대상자 정보
              </Typography>
              <Grid container spacing={1.9}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="성명"
                    size="small"
                    value={targetPerson}
                    onChange={(e) => setTargetPerson(e.target.value)}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="부서"
                    size="small"
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="직위"
                    size="small"
                    value={targetPosition}
                    onChange={(e) => setTargetPosition(e.target.value)}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* 평가자 정보 */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.615, color: '#1976d2', fontSize: '1.045rem' }}>
                평가자 정보
              </Typography>
              <Grid container spacing={1.9}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="성명"
                    size="small"
                    value={evaluatorName}
                    onChange={(e) => setEvaluatorName(e.target.value)}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="부서"
                    size="small"
                    value={evaluatorDepartment}
                    onChange={(e) => setEvaluatorDepartment(e.target.value)}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="직위"
                    size="small"
                    value={evaluatorPosition}
                    onChange={(e) => setEvaluatorPosition(e.target.value)}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* 버튼 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2.09 }}>
              <Button variant="outlined" onClick={() => setCurrentStep(1)} sx={{ fontSize: '0.95rem' }}>
                ← 이전
              </Button>
              <Button variant="contained" onClick={handleStep2Next} sx={{ fontSize: '0.95rem' }}>
                다음 →
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* 단계 3: 체크시트 작성 제출 */}
      {currentStep === 3 && (
        <Paper elevation={3} sx={{ p: 2.85 }}>
          <Box sx={{ mb: 2.375 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.57, fontSize: '1.2825rem' }}>
              체크시트 작성
            </Typography>
          </Box>

          <Stack spacing={1.615}>

          {/* 통계 카드 */}
          <Grid container spacing={1.14}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 1.14, bgcolor: '#f8f9fa' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.76rem' }}>
                  총 항목
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1.3775rem', textAlign: 'center' }}>
                  {evaluationItems.length}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 1.14, bgcolor: '#f8f9fa' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.76rem' }}>
                  평가 완료
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#ff9800', fontSize: '1.3775rem', textAlign: 'center' }}>
                  {evaluationItems.filter((item) => item.evaluation && item.evaluation !== '선택').length}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 1.14, bgcolor: '#f8f9fa' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.76rem' }}>
                  작성 진행률
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#9c27b0', fontSize: '1.3775rem', textAlign: 'center' }}>
                  {Math.round(
                    (evaluationItems.filter((item) => item.evaluation && item.evaluation !== '선택').length / evaluationItems.length) * 100
                  )}
                  %
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 1.14, bgcolor: '#f8f9fa' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.76rem' }}>
                  종합점수
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#4caf50', fontSize: '1.3775rem', textAlign: 'center' }}>
                  {evaluationItems.reduce((sum, item) => sum + item.score, 0)}점 / {evaluationItems.length * (evaluationType === '3단계' ? 3 : 5)}점
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* 평가 항목 테이블 */}
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              maxHeight: '503.5px',
              overflowY: 'auto',
              overflowX: 'auto',
              position: 'relative'
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{
                    width: 47.5,
                    fontWeight: 600,
                    bgcolor: '#f5f5f5',
                    fontSize: '0.76rem',
                    py: 0.57,
                    position: 'sticky !important',
                    top: 0,
                    zIndex: 100,
                    borderBottom: '2px solid #e0e0e0',
                    textAlign: 'center'
                  }}>NO</TableCell>
                  <TableCell sx={{
                    width: 114,
                    fontWeight: 600,
                    bgcolor: '#f5f5f5',
                    fontSize: '0.76rem',
                    py: 0.57,
                    position: 'sticky !important',
                    top: 0,
                    zIndex: 100,
                    borderBottom: '2px solid #e0e0e0'
                  }}>대분류</TableCell>
                  <TableCell sx={{
                    width: 114,
                    fontWeight: 600,
                    bgcolor: '#f5f5f5',
                    fontSize: '0.76rem',
                    py: 0.57,
                    position: 'sticky !important',
                    top: 0,
                    zIndex: 100,
                    borderBottom: '2px solid #e0e0e0'
                  }}>소분류</TableCell>
                  <TableCell sx={{
                    width: 171,
                    fontWeight: 600,
                    bgcolor: '#f5f5f5',
                    fontSize: '0.76rem',
                    py: 0.57,
                    position: 'sticky !important',
                    top: 0,
                    zIndex: 100,
                    borderBottom: '2px solid #e0e0e0'
                  }}>점검항목</TableCell>
                  <TableCell sx={{
                    width: 114,
                    fontWeight: 600,
                    bgcolor: '#f5f5f5',
                    fontSize: '0.76rem',
                    py: 0.57,
                    position: 'sticky !important',
                    top: 0,
                    zIndex: 100,
                    borderBottom: '2px solid #e0e0e0'
                  }}>평가</TableCell>
                  <TableCell sx={{
                    width: 76,
                    fontWeight: 600,
                    bgcolor: '#f5f5f5',
                    fontSize: '0.76rem',
                    py: 0.57,
                    position: 'sticky !important',
                    top: 0,
                    zIndex: 100,
                    borderBottom: '2px solid #e0e0e0',
                    textAlign: 'center'
                  }}>점수</TableCell>
                  <TableCell sx={{
                    width: 237.5,
                    fontWeight: 600,
                    bgcolor: '#f5f5f5',
                    fontSize: '0.76rem',
                    py: 0.57,
                    position: 'sticky !important',
                    top: 0,
                    zIndex: 100,
                    borderBottom: '2px solid #e0e0e0'
                  }}>평가내용</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {evaluationItems.map((item, index) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ textAlign: 'center', fontSize: '0.76rem', py: 0.475 }}>
                      {evaluationItems.length - index}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.76rem', py: 0.475 }}>
                      {item.major_category}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.76rem', py: 0.475 }}>
                      {item.sub_category}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.76rem', py: 0.475 }}>
                      {item.title}
                    </TableCell>
                    <TableCell sx={{ py: 0.475 }}>
                      <Select
                        size="small"
                        fullWidth
                        value={item.evaluation}
                        onChange={(e) => handleEvaluationChange(item.id, e.target.value)}
                        sx={{ fontSize: '0.76rem' }}
                      >
                        {[
                          <MenuItem key="선택" value="선택">선택</MenuItem>,
                          ...(evaluationType === '3단계' ? [
                            <MenuItem key="미흡" value="미흡">미흡</MenuItem>,
                            <MenuItem key="보통" value="보통">보통</MenuItem>,
                            <MenuItem key="우수" value="우수">우수</MenuItem>
                          ] : [
                            <MenuItem key="매우 부족" value="매우 부족">매우 부족</MenuItem>,
                            <MenuItem key="미흡" value="미흡">미흡</MenuItem>,
                            <MenuItem key="보통" value="보통">보통</MenuItem>,
                            <MenuItem key="양호" value="양호">양호</MenuItem>,
                            <MenuItem key="매우 우수" value="매우 우수">매우 우수</MenuItem>
                          ])
                        ]}
                      </Select>
                    </TableCell>
                    <TableCell sx={{ py: 0.475, textAlign: 'center', fontSize: '0.76rem' }}>
                      {item.score}점
                    </TableCell>
                    <TableCell sx={{ py: 0.475 }}>
                      <TextField
                        multiline
                        rows={2}
                        size="small"
                        fullWidth
                        value={item.description}
                        onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
                        placeholder="평가 내용 입력 (필수)"
                        sx={{
                          '& textarea': {
                            fontSize: '0.7125rem',
                            py: 0.57
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 버튼 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1.615 }}>
            <Button variant="outlined" onClick={() => setCurrentStep(2)} sx={{ fontSize: '0.9025rem' }}>
              ← 이전
            </Button>
            <Button
              variant="contained"
              size="medium"
              onClick={handleSubmitEvaluation}
              sx={{ px: 4.275, fontSize: '0.95rem' }}
            >
              ✓ 평가 제출
            </Button>
          </Box>
        </Stack>
      </Paper>
      )}

      {/* 단계 4: 완료 */}
      {currentStep === 4 && (
        <Paper elevation={3} sx={{ p: 5.7, textAlign: 'center' }}>
          <Box sx={{ mb: 3.8 }}>
            <Box sx={{ fontSize: 76, mb: 1.9 }}>✓</Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1.9, color: '#4caf50' }}>
              평가 제출 완료
            </Typography>
            <Typography variant="h6" sx={{ mb: 2.85, color: 'text.secondary' }}>
              인사평가가 성공적으로 제출되었습니다
            </Typography>
          </Box>

          <Divider sx={{ my: 3.8 }} />

          <Box sx={{ mb: 3.8, textAlign: 'left', maxWidth: 570, mx: 'auto' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.85 }}>
              제출 정보
            </Typography>
            <Stack spacing={1.9}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.9, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>평가 코드</Typography>
                <Typography variant="body1">{evaluationId || '미지정'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.9, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>피평가자</Typography>
                <Typography variant="body1">{targetPerson}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.9, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>부서</Typography>
                <Typography variant="body1">{targetDepartment}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.9, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>평가자</Typography>
                <Typography variant="body1">{evaluatorName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.9, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>제출일시</Typography>
                <Typography variant="body1">
                  {new Date().toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.9, justifyContent: 'center', mt: 3.8 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                setCurrentStep(1);
                setTargetPerson('');
                setTargetDepartment('');
                setTargetPosition('');
                setEvaluatorName('');
                setEvaluatorDepartment('');
                setEvaluatorPosition('');
                setEvaluationItems(evaluationItems.map(item => ({
                  ...item,
                  checkedBehaviors: [false, false, false],
                  recommended: 0,
                  actual: 0,
                  differenceReason: ''
                })));
              }}
              sx={{ px: 3.8, fontSize: '0.95rem' }}
            >
              새 평가 작성
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                window.close();
                // 창이 닫히지 않으면 (직접 URL로 접속한 경우) 홈으로 이동
                setTimeout(() => {
                  window.location.href = '/';
                }, 100);
              }}
              sx={{ px: 3.8, fontSize: '0.95rem' }}
            >
              닫기
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default PublicEvaluationForm;
