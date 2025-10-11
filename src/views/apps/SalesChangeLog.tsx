// SalesChangeLog.tsx

import React, { useState } from 'react';

// Material-UI
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
  Stack,
  LinearProgress
} from '@mui/material';

// Material-UI Lab
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';

// Icons
import {
  Archive,
  Add,
  Edit,
  Trash,
  DocumentText,
  Profile2User,
  Clock,
  Filter,
  SearchNormal1,
  TrendUp,
  TrendDown,
  InfoCircle
} from '@wandersonalwes/iconsax-react';

const SalesChangeLog: React.FC = () => {
  const [filterType, setFilterType] = useState('전체');
  const [filterUser, setFilterUser] = useState('전체');
  const [filterPeriod, setFilterPeriod] = useState('최근 7일');
  const [searchTerm, setSearchTerm] = useState('');

  const changeTypes = ['전체', '생성', '수정', '삭제', '상태변경', '계약완료', '취소'];
  const users = ['전체', '김영업', '이영업', '박마케팅', '최팀장', '정관리자'];
  const periods = ['최근 7일', '최근 30일', '최근 3개월', '최근 6개월', '올해'];

  // 변경 로그 데이터
  const changeLogs = [
    {
      id: 1,
      type: '계약완료',
      action: '상태 변경',
      target: '삼성전자 - 보안솔루션 A (S001)',
      user: '김영업',
      userAvatar: '',
      timestamp: '2024-08-05 14:30:25',
      changes: {
        status: { from: '협상중', to: '계약완료' },
        contractDate: { from: '', to: '2024-08-05' },
        totalAmount: { from: '45000000', to: '50000000' }
      },
      description: '고객과의 최종 협상 완료로 계약 체결',
      impact: 'high'
    },
    {
      id: 2,
      type: '수정',
      action: '데이터 수정',
      target: 'LG전자 - 보안솔루션 B (S002)',
      user: '이영업',
      userAvatar: '',
      timestamp: '2024-08-05 11:15:40',
      changes: {
        unitPrice: { from: '7000000', to: '8000000' },
        totalAmount: { from: '21000000', to: '24000000' }
      },
      description: '가격 재협상으로 단가 조정',
      impact: 'medium'
    },
    {
      id: 3,
      type: '생성',
      action: '새 매출 등록',
      target: '현대자동차 - 보안솔루션 C (S003)',
      user: '박마케팅',
      userAvatar: '',
      timestamp: '2024-08-05 09:45:12',
      changes: {
        customerName: { from: '', to: '현대자동차' },
        productName: { from: '', to: '보안솔루션 C' },
        totalAmount: { from: '0', to: '35000000' }
      },
      description: '신규 고객 매출 기회 등록',
      impact: 'high'
    },
    {
      id: 4,
      type: '삭제',
      action: '매출 삭제',
      target: '테스트 고객 - 테스트 상품 (S999)',
      user: '정관리자',
      userAvatar: '',
      timestamp: '2024-08-04 16:20:33',
      changes: {
        status: { from: '대기', to: '삭제됨' }
      },
      description: '테스트 데이터 정리',
      impact: 'low'
    },
    {
      id: 5,
      type: '상태변경',
      action: '상태 변경',
      target: 'SK텔레콤 - 보안솔루션 A (S004)',
      user: '김영업',
      userAvatar: '',
      timestamp: '2024-08-04 13:55:18',
      changes: {
        status: { from: '대기', to: '협상중' }
      },
      description: '고객 미팅 후 협상 단계로 진입',
      impact: 'medium'
    },
    {
      id: 6,
      type: '취소',
      action: '매출 취소',
      target: 'ABC회사 - 보안솔루션 D (S005)',
      user: '이영업',
      userAvatar: '',
      timestamp: '2024-08-04 10:30:45',
      changes: {
        status: { from: '협상중', to: '취소' },
        notes: { from: '진행중', to: '고객 예산 부족으로 취소' }
      },
      description: '고객 예산 문제로 프로젝트 취소',
      impact: 'high'
    }
  ];

  // 통계 데이터
  const stats = [
    { label: '총 변경사항', value: changeLogs.length, icon: <Archive size={20} />, color: '#2196F3' },
    { label: '오늘 변경사항', value: 3, icon: <Clock size={20} />, color: '#4CAF50' },
    { label: '활성 사용자', value: 4, icon: <Profile2User size={20} />, color: '#FF9800' },
    { label: '중요 변경사항', value: 2, icon: <InfoCircle size={20} />, color: '#F44336' }
  ];

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case '생성':
        return { bgcolor: '#E8F5E8', color: '#2E7D32' };
      case '수정':
        return { bgcolor: '#E3F2FD', color: '#1976D2' };
      case '삭제':
        return { bgcolor: '#FFEBEE', color: '#D32F2F' };
      case '계약완료':
        return { bgcolor: '#F3E5F5', color: '#7B1FA2' };
      case '취소':
        return { bgcolor: '#FFF3E0', color: '#F57C00' };
      default:
        return { bgcolor: '#F5F5F5', color: '#757575' };
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case '생성':
        return <Add size={16} />;
      case '수정':
        return <Edit size={16} />;
      case '삭제':
        return <Trash size={16} />;
      case '계약완료':
        return <TrendUp size={16} />;
      case '취소':
        return <TrendDown size={16} />;
      default:
        return <DocumentText size={16} />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const filteredLogs = changeLogs.filter((log) => {
    const matchesType = filterType === '전체' || log.type === filterType;
    const matchesUser = filterUser === '전체' || log.user === filterUser;
    const matchesSearch =
      searchTerm === '' ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesUser && matchesSearch;
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '50%',
                      backgroundColor: `${stat.color}20`,
                      color: stat.color
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* 필터 및 검색 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Filter size={20} />
                필터 및 검색
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchNormal1 size={20} style={{ marginRight: 8, color: '#666' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>변경 유형</InputLabel>
                    <Select value={filterType} label="변경 유형" onChange={(e) => setFilterType(e.target.value)}>
                      {changeTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>사용자</InputLabel>
                    <Select value={filterUser} label="사용자" onChange={(e) => setFilterUser(e.target.value)}>
                      {users.map((user) => (
                        <MenuItem key={user} value={user}>
                          {user}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>기간</InputLabel>
                    <Select value={filterPeriod} label="기간" onChange={(e) => setFilterPeriod(e.target.value)}>
                      {periods.map((period) => (
                        <MenuItem key={period} value={period}>
                          {period}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Button variant="outlined" fullWidth size="small">
                    필터 초기화
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 변경 로그 타임라인 */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Archive size={20} />
                변경 이력 ({filteredLogs.length}건)
              </Typography>

              <Timeline>
                {filteredLogs.map((log, index) => (
                  <TimelineItem key={log.id}>
                    <TimelineSeparator>
                      <TimelineDot
                        sx={{
                          backgroundColor: getChangeTypeColor(log.type).bgcolor,
                          color: getChangeTypeColor(log.type).color,
                          border: `2px solid ${getImpactColor(log.impact)}`
                        }}
                      >
                        {getChangeIcon(log.type)}
                      </TimelineDot>
                      {index < filteredLogs.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Chip
                                label={log.type}
                                size="small"
                                sx={{
                                  ...getChangeTypeColor(log.type),
                                  fontSize: '11px'
                                }}
                              />
                              <Badge
                                color={log.impact === 'high' ? 'error' : log.impact === 'medium' ? 'warning' : 'success'}
                                variant="dot"
                              >
                                <Typography variant="caption" color="text.secondary">
                                  영향도: {log.impact}
                                </Typography>
                              </Badge>
                            </Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {log.target}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {log.description}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Avatar sx={{ width: 24, height: 24 }}>{log.user.charAt(0)}</Avatar>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                {log.user}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {log.timestamp}
                            </Typography>
                          </Box>
                        </Box>

                        {/* 변경 상세 */}
                        <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                            변경 내용:
                          </Typography>
                          {Object.entries(log.changes).map(([field, change]) => (
                            <Box key={field} sx={{ mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                <strong>{field}:</strong>
                                {change.from && <span style={{ textDecoration: 'line-through', marginLeft: 4 }}>{change.from}</span>}
                                <span style={{ marginLeft: 4, color: '#2e7d32', fontWeight: 500 }}>{change.to}</span>
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>
        </Grid>

        {/* 활동 요약 */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Profile2User size={20} />
                사용자별 활동
              </Typography>

              <List>
                {['김영업', '이영업', '박마케팅', '정관리자'].map((user, index) => {
                  const userLogs = changeLogs.filter((log) => log.user === user);
                  const recentActivity = userLogs[0];

                  return (
                    <React.Fragment key={user}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32 }}>{user.charAt(0)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {user}
                              </Typography>
                              <Chip label={`${userLogs.length}건`} size="small" variant="outlined" sx={{ fontSize: '11px' }} />
                            </Box>
                          }
                          secondary={
                            recentActivity ? (
                              <Typography variant="caption" color="text.secondary">
                                최근: {recentActivity.type} · {recentActivity.timestamp.split(' ')[0]}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                활동 없음
                              </Typography>
                            )
                          }
                        />
                      </ListItem>
                      {index < 3 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            </CardContent>
          </Card>

          {/* 변경 유형별 통계 */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                변경 유형별 통계
              </Typography>

              <Stack spacing={2}>
                {changeTypes
                  .filter((type) => type !== '전체')
                  .map((type) => {
                    const count = changeLogs.filter((log) => log.type === type).length;
                    const percentage = (count / changeLogs.length) * 100;

                    return (
                      <Box key={type}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {type}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {count}건 ({percentage.toFixed(1)}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getChangeTypeColor(type).color,
                              borderRadius: 3
                            }
                          }}
                        />
                      </Box>
                    );
                  })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesChangeLog;
