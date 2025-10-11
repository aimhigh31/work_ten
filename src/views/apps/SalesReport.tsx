// SalesReport.tsx

import React, { useState } from 'react';

// Material-UI
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  Alert,
  Stack
} from '@mui/material';

// Icons
import { DocumentText, DocumentDownload, Eye, Setting2, TrendUp } from '@wandersonalwes/iconsax-react';

const SalesReport: React.FC = () => {
  const [reportType, setReportType] = useState('월간매출');
  const [period, setPeriod] = useState('2024-08');
  const [format, setFormat] = useState('PDF');

  const reportTypes = [
    { value: '월간매출', label: '월간 매출 리포트' },
    { value: '분기매출', label: '분기 매출 리포트' },
    { value: '년간매출', label: '년간 매출 리포트' },
    { value: '고객별매출', label: '고객별 매출 분석' },
    { value: '상품별매출', label: '상품별 매출 분석' },
    { value: '팀별성과', label: '팀별 성과 리포트' },
    { value: '매출예측', label: '매출 예측 리포트' }
  ];

  const formatOptions = ['PDF', 'Excel', 'Word', 'PowerPoint'];

  // 기존 리포트 목록
  const existingReports = [
    {
      id: 1,
      name: '2024년 8월 월간 매출 리포트',
      type: '월간매출',
      createdDate: '2024-08-05',
      createdBy: '김영업',
      format: 'PDF',
      size: '2.3MB',
      status: '완료'
    },
    {
      id: 2,
      name: '2024년 2분기 매출 분석',
      type: '분기매출',
      createdDate: '2024-07-15',
      createdBy: '이관리자',
      format: 'Excel',
      size: '1.8MB',
      status: '완료'
    },
    {
      id: 3,
      name: '고객별 매출 현황 (2024년 상반기)',
      type: '고객별매출',
      createdDate: '2024-07-01',
      createdBy: '박분석가',
      format: 'PDF',
      size: '3.1MB',
      status: '완료'
    },
    {
      id: 4,
      name: '영업팀 성과 리포트 (2024년 7월)',
      type: '팀별성과',
      createdDate: '2024-08-01',
      createdBy: '최팀장',
      format: 'PowerPoint',
      size: '4.2MB',
      status: '생성중'
    }
  ];

  // 리포트 템플릿
  const reportTemplates = [
    {
      name: '표준 월간 매출 리포트',
      description: '기본적인 월간 매출 현황과 전월 대비 분석',
      sections: ['요약', '월간 매출 현황', '전월 대비 분석', '팀별 성과', '주요 고객']
    },
    {
      name: '상세 분기 매출 분석',
      description: '분기별 상세 매출 분석 및 목표 대비 실적',
      sections: ['경영진 요약', '분기 매출 현황', '목표 대비 실적', '시장 분석', '향후 전망']
    },
    {
      name: '고객 세그먼트 분석',
      description: '고객별 매출 분석 및 고객 세그먼트별 특성',
      sections: ['고객 개요', '매출 분석', '세그먼트 특성', '만족도 분석', '개선 방안']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '완료':
        return { bgcolor: '#E8F5E8', color: '#2E7D32' };
      case '생성중':
        return { bgcolor: '#FFF3E0', color: '#F57C00' };
      case '실패':
        return { bgcolor: '#FFEBEE', color: '#D32F2F' };
      default:
        return { bgcolor: '#F5F5F5', color: '#757575' };
    }
  };

  const handleGenerateReport = () => {
    console.log('리포트 생성:', { reportType, period, format });
    // TODO: 실제 리포트 생성 로직 구현
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* 리포트 생성 */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DocumentText size={20} />새 리포트 생성
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>리포트 유형</InputLabel>
                    <Select value={reportType} label="리포트 유형" onChange={(e) => setReportType(e.target.value)}>
                      {reportTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="기간"
                    type="month"
                    fullWidth
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>출력 형식</InputLabel>
                    <Select value={format} label="출력 형식" onChange={(e) => setFormat(e.target.value)}>
                      {formatOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleGenerateReport}
                    startIcon={<TrendUp size={20} />}
                    sx={{ mt: 2 }}
                  >
                    리포트 생성
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 리포트 템플릿 */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Setting2 size={20} />
                리포트 템플릿
              </Typography>

              <Stack spacing={2}>
                {reportTemplates.map((template, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {template.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {template.sections.map((section, idx) => (
                        <Chip key={idx} label={section} size="small" variant="outlined" sx={{ fontSize: '11px' }} />
                      ))}
                    </Box>
                    <Button size="small" variant="outlined">
                      이 템플릿 사용
                    </Button>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 기존 리포트 목록 */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DocumentText size={20} />
                기존 리포트
              </Typography>

              <List>
                {existingReports.map((report, index) => (
                  <React.Fragment key={report.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                              {report.name}
                            </Typography>
                            <Chip
                              label={report.status}
                              size="small"
                              sx={{
                                ...getStatusColor(report.status),
                                fontSize: '11px'
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary" component="span">
                            {report.createdDate} · {report.createdBy} · {report.format} · {report.size}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" disabled={report.status !== '완료'}>
                            <Eye size={16} />
                          </IconButton>
                          <IconButton size="small" disabled={report.status !== '완료'}>
                            <DocumentDownload size={16} />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < existingReports.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* 리포트 설정 */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Setting2 size={20} />
                자동 리포트 설정
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                정기적으로 생성할 리포트를 설정할 수 있습니다.
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>자동 생성 주기</InputLabel>
                    <Select label="자동 생성 주기" defaultValue="월간">
                      <MenuItem value="주간">주간</MenuItem>
                      <MenuItem value="월간">월간</MenuItem>
                      <MenuItem value="분기">분기</MenuItem>
                      <MenuItem value="연간">연간</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>수신자</InputLabel>
                    <Select label="수신자" defaultValue="경영진">
                      <MenuItem value="경영진">경영진</MenuItem>
                      <MenuItem value="팀장">팀장급</MenuItem>
                      <MenuItem value="전체">전체 구성원</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Button variant="outlined" fullWidth size="small">
                    자동 리포트 설정 저장
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesReport;
