import React, { useCallback, memo } from 'react';
import { Box, Typography, TextField, Stack, Grid } from '@mui/material';

interface SecurityIncidentImprovementTabProps {
  postMeasures?: {
    rootCauseAnalysis: string;
    systemImprovements: string;
    policyChanges: string;
    trainingPlan: string;
    preventiveMeasures: string;
    monitoringEnhancement: string;
    responsiblePerson: string;
    implementationDeadline: string;
    budgetRequired: string;
    riskAssessment: string;
    lessonsLearned: string;
  };
  onPostMeasuresChange?: (field: string, value: string) => void;
}

const SecurityIncidentImprovementTab = memo(
  ({
    postMeasures = {
      rootCauseAnalysis: '',
      systemImprovements: '',
      policyChanges: '',
      trainingPlan: '',
      preventiveMeasures: '',
      monitoringEnhancement: '',
      responsiblePerson: '',
      implementationDeadline: '',
      budgetRequired: '',
      riskAssessment: '',
      lessonsLearned: ''
    },
    onPostMeasuresChange = () => {}
  }: SecurityIncidentImprovementTabProps) => {
    const handlePostMeasuresChange = useCallback(
      (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onPostMeasuresChange(field, e.target.value);
      },
      [onPostMeasuresChange]
    );

    return (
      <Box sx={{ height: '650px', overflowY: 'auto', px: 4, py: 3 }}>
        <Stack spacing={4}>
          {/* 근본개선 계획 */}
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#388e3c',
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              🔧 근본개선 계획
            </Typography>

            <Stack spacing={4}>
              {/* 원인 분석 */}
              <TextField
                fullWidth
                label="근본원인 분석"
                multiline
                rows={4}
                value={postMeasures.rootCauseAnalysis}
                onChange={handlePostMeasuresChange('rootCauseAnalysis')}
                placeholder="사고의 근본 원인을 상세히 분석하여 기록하세요..."
                variant="outlined"
              />

              {/* 개선 조치 */}
              <Grid container spacing={3} alignItems="flex-start">
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="시스템 개선사항"
                    multiline
                    rows={3}
                    value={postMeasures.systemImprovements}
                    onChange={handlePostMeasuresChange('systemImprovements')}
                    placeholder="기술적 개선사항을 기록하세요..."
                    variant="outlined"
                    sx={{
                      '& .MuiInputBase-root': {
                        alignItems: 'flex-start',
                        minHeight: '90px'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="정책/절차 변경사항"
                    multiline
                    rows={3}
                    value={postMeasures.policyChanges}
                    onChange={handlePostMeasuresChange('policyChanges')}
                    placeholder="정책이나 절차 변경사항을 기록하세요..."
                    variant="outlined"
                    sx={{
                      '& .MuiInputBase-root': {
                        alignItems: 'flex-start',
                        minHeight: '90px'
                      }
                    }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={3} alignItems="flex-start">
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="교육 계획"
                    multiline
                    rows={3}
                    value={postMeasures.trainingPlan}
                    onChange={handlePostMeasuresChange('trainingPlan')}
                    placeholder="직원 교육 및 인식 개선 계획을 기록하세요..."
                    variant="outlined"
                    sx={{
                      '& .MuiInputBase-root': {
                        alignItems: 'flex-start',
                        minHeight: '90px'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="예방 조치"
                    multiline
                    rows={3}
                    value={postMeasures.preventiveMeasures}
                    onChange={handlePostMeasuresChange('preventiveMeasures')}
                    placeholder="재발 방지를 위한 예방 조치를 기록하세요..."
                    variant="outlined"
                    sx={{
                      '& .MuiInputBase-root': {
                        alignItems: 'flex-start',
                        minHeight: '90px'
                      }
                    }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="모니터링 강화 방안"
                multiline
                rows={3}
                value={postMeasures.monitoringEnhancement}
                onChange={handlePostMeasuresChange('monitoringEnhancement')}
                placeholder="보안 모니터링 시스템 강화 방안을 기록하세요..."
                variant="outlined"
              />

              {/* 실행 계획 */}
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: '#666',
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  📅 실행 계획
                </Typography>

                <Stack spacing={3}>
                  <Grid container spacing={3} alignItems="flex-start">
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="담당자"
                        value={postMeasures.responsiblePerson}
                        onChange={handlePostMeasuresChange('responsiblePerson')}
                        variant="outlined"
                        sx={{ height: '56px' }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="완료 목표일"
                        type="date"
                        value={postMeasures.implementationDeadline}
                        onChange={handlePostMeasuresChange('implementationDeadline')}
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        sx={{ height: '56px' }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="소요 예산"
                        value={postMeasures.budgetRequired}
                        onChange={handlePostMeasuresChange('budgetRequired')}
                        placeholder="예: 1,000만원"
                        variant="outlined"
                        sx={{ height: '56px' }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    fullWidth
                    label="위험도 재평가"
                    multiline
                    rows={3}
                    value={postMeasures.riskAssessment}
                    onChange={handlePostMeasuresChange('riskAssessment')}
                    placeholder="개선 조치 후 잔여 위험도 및 관리 방안을 기록하세요..."
                    variant="outlined"
                  />

                  <TextField
                    fullWidth
                    label="교훈 및 개선사항"
                    multiline
                    rows={4}
                    value={postMeasures.lessonsLearned}
                    onChange={handlePostMeasuresChange('lessonsLearned')}
                    placeholder="이번 사고를 통해 얻은 교훈과 조직 차원의 개선사항을 기록하세요..."
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Stack>
          </Box>

          {/* 작성 현황 */}
          <Box sx={{ p: 3, bgcolor: '#f1f8e9', borderRadius: 2, border: 'none' }}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#388e3c'
              }}
            >
              📊 근본개선 작성 현황
            </Typography>
            <Box
              sx={{
                display: 'inline-block',
                px: 2,
                py: 1,
                bgcolor: Object.values(postMeasures).filter((v) => v && v.toString().trim()).length >= 6 ? '#e8f5e8' : '#fff3e0',
                color: Object.values(postMeasures).filter((v) => v && v.toString().trim()).length >= 6 ? '#2e7d32' : '#f57c00',
                borderRadius: 1,
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              {Object.values(postMeasures).filter((v) => v && v.toString().trim()).length}/11 완료
            </Box>
          </Box>
        </Stack>
      </Box>
    );
  }
);

SecurityIncidentImprovementTab.displayName = 'SecurityIncidentImprovementTab';

export default SecurityIncidentImprovementTab;
