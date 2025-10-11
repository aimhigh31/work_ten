import React, { memo, useCallback } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  styled,
  StepIconProps,
  Paper,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  LinearProgress,
  Grid,
  Divider
} from '@mui/material';
import { ShieldSearch, Chart21, Setting4, TickCircle, ShieldTick, Clock, Calendar, User } from '@wandersonalwes/iconsax-react';

// 대응 단계 정의
const responseStages = [
  {
    label: '사고 탐지',
    icon: ShieldSearch,
    description: '보안 사고 발생 인지 및 초기 탐지',
    color: '#4A90E2'
  },
  {
    label: '현황 분석',
    icon: Chart21,
    description: '사고 영향 범위 및 원인 분석',
    color: '#4ECDC4'
  },
  {
    label: '개선 조치 중',
    icon: Setting4,
    description: '보안 취약점 개선 조치 진행',
    color: '#45B7D1'
  },
  {
    label: '즉시 해결',
    icon: TickCircle,
    description: '긴급 대응 및 임시 조치 완료',
    color: '#96CEB4'
  },
  {
    label: '근본개선',
    icon: ShieldTick,
    description: '근본 원인 제거 및 재발 방지 조치',
    color: '#6C5CE7'
  }
];

// 커스텀 스텝 커넥터
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: '#2196F3'
    }
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: '#2196F3'
    }
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1
  }
}));

// 커스텀 스텝 아이콘 래퍼
const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'all 0.3s ease',
  ...(ownerState.active && {
    backgroundColor: '#2196F3'
  }),
  ...(ownerState.completed && {
    backgroundColor: '#2196F3'
  })
}));

// 커스텀 스텝 아이콘 컴포넌트
function ColorlibStepIcon(props: StepIconProps) {
  const { active, completed, className, icon } = props;
  const iconIndex = Number(icon) - 1;
  const Icon = responseStages[iconIndex]?.icon;

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {Icon && <Icon size={24} />}
    </ColorlibStepIconRoot>
  );
}

// 사고현황탭 컴포넌트
const SecurityIncidentStatusTab = memo(
  ({ taskState, onFieldChange }: { taskState: any; onFieldChange: (field: string, value: string) => void }) => {
    // 현재 대응 단계의 인덱스 계산
    const getActiveStep = () => {
      const stage = taskState.responseStage;
      const index = responseStages.findIndex((s) => s.label === stage);
      return index >= 0 ? index : 0;
    };

    const handleStageChange = useCallback(
      (event: any) => {
        onFieldChange('responseStage', event.target.value);
      },
      [onFieldChange]
    );

    // 진행률 계산 (대응 단계 기준)
    const calculateProgress = () => {
      const currentStep = getActiveStep();
      return ((currentStep + 1) / responseStages.length) * 100;
    };

    // 현재 단계 정보 가져오기
    const getCurrentStageInfo = () => {
      const index = getActiveStep();
      return responseStages[index] || responseStages[0];
    };

    const currentStageInfo = getCurrentStageInfo();

    return (
      <Box sx={{ height: '650px', overflowY: 'auto', pr: 1, px: 3, py: 3 }}>
        <Stack spacing={3}>
          {/* 사고 대응 단계 진행 상황 */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            {/* 제목과 대응단계변경 버튼을 한 줄에 배치 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                사고 대응 단계
              </Typography>

              {/* 대응 단계 변경 버튼 */}
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel shrink size="small">
                  대응 단계 변경
                </InputLabel>
                <Select
                  size="small"
                  value={taskState.responseStage || '사고 탐지'}
                  label="대응 단계 변경"
                  onChange={handleStageChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                >
                  {responseStages.map((stage) => (
                    <MenuItem key={stage.label} value={stage.label}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {React.createElement(stage.icon, { size: 18 })}
                        <Typography variant="body2">{stage.label}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* 스테퍼 */}
            <Stepper alternativeLabel activeStep={getActiveStep()} connector={<ColorlibConnector />}>
              {responseStages.map((stage, index) => (
                <Step key={stage.label}>
                  <StepLabel StepIconComponent={ColorlibStepIcon}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: index === getActiveStep() ? 600 : 400,
                        color: index <= getActiveStep() ? 'primary.main' : 'text.secondary',
                        fontSize: '0.875rem'
                      }}
                    >
                      {stage.label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* 진행률 표시 */}
            <Box sx={{ mt: 4, mx: '5%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  전체 진행률
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {calculateProgress().toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={calculateProgress()}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#E3F2FD',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: '#2196F3'
                  }
                }}
              />
            </Box>
          </Paper>

          {/* 사고 정보 */}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    사고 정보
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Calendar size={20} color="#666" />
                      <Typography variant="body2" color="text.secondary">
                        발생일: {taskState.occurrenceDate || taskState.registrationDate}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Clock size={20} color="#666" />
                      <Typography variant="body2" color="text.secondary">
                        경과: {calculateElapsedDays(taskState.occurrenceDate || taskState.registrationDate)}일
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <User size={20} color="#666" />
                      <Typography variant="body2" color="text.secondary">
                        담당: {taskState.assignee}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        사고 유형
                      </Typography>
                      <Chip label={taskState.incidentType || '미분류'} color="primary" size="small" />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        심각도
                      </Typography>
                      <Chip label={taskState.severity || '중간'} color={getSeverityColor(taskState.severity)} size="small" />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 단계별 체크리스트 */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              현재 단계 체크리스트
            </Typography>
            {getChecklistItems(taskState.responseStage || '사고 탐지').map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 1,
                  borderBottom: index < getChecklistItems(taskState.responseStage || '사고 탐지').length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}
              >
                <TickCircle size={20} color="#4CAF50" />
                <Typography variant="body2">{item}</Typography>
              </Box>
            ))}
          </Paper>
        </Stack>
      </Box>
    );
  }
);

// 헬퍼 함수들
function calculateElapsedDays(date: string): number {
  if (!date) return 0;
  const startDate = new Date(date);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getSeverityColor(severity: string): 'error' | 'warning' | 'info' {
  switch (severity) {
    case '높음':
      return 'error';
    case '중간':
      return 'warning';
    case '낮음':
      return 'info';
    default:
      return 'info';
  }
}

function getChecklistItems(stage: string): string[] {
  switch (stage) {
    case '사고 탐지':
      return ['보안 사고 발생 확인', '초기 영향 범위 파악', '관련 담당자 통보', '사고 로그 수집 시작'];
    case '현황 분석':
      return ['상세 로그 분석', '피해 시스템 식별', '데이터 유출 여부 확인', '공격 벡터 분석', '영향받은 사용자 파악'];
    case '개선 조치 중':
      return ['취약점 패치 적용', '보안 정책 업데이트', '시스템 설정 강화', '모니터링 강화', '임시 차단 조치'];
    case '즉시 해결':
      return ['긴급 패치 완료', '서비스 정상화', '사용자 통지', '임시 보안 조치 적용'];
    case '근본개선':
      return [
        '근본 원인 분석 완료',
        '영구 보안 조치 적용',
        '프로세스 개선',
        '교육 및 인식 제고',
        '재발 방지 계획 수립',
        '사고 대응 보고서 작성'
      ];
    default:
      return [];
  }
}

SecurityIncidentStatusTab.displayName = 'SecurityIncidentStatusTab';

export default SecurityIncidentStatusTab;
