// SalesDashboard.tsx

import React, { useState } from 'react';

// Material-UI
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

// Icons
import { TrendUp, TrendDown, MoneyRecive, Profile2User, ShoppingBag, Calendar1 } from '@wandersonalwes/iconsax-react';

const SalesDashboard: React.FC = () => {
  const [period, setPeriod] = useState('이번달');
  const [team, setTeam] = useState('전체');

  const periodOptions = ['이번달', '지난달', '최근 3개월', '올해', '작년'];
  const teamOptions = ['전체', '영업팀', '마케팅팀', '기술팀'];

  // 요약 데이터
  const summaryData = [
    {
      title: '총 매출',
      value: '2,850,000,000',
      unit: '원',
      change: '+12.5%',
      isPositive: true,
      icon: <MoneyRecive size={24} />,
      color: '#2196F3'
    },
    {
      title: '계약 건수',
      value: '156',
      unit: '건',
      change: '+8.2%',
      isPositive: true,
      icon: <ShoppingBag size={24} />,
      color: '#4CAF50'
    },
    {
      title: '신규 고객',
      value: '23',
      unit: '명',
      change: '-2.1%',
      isPositive: false,
      icon: <Profile2User size={24} />,
      color: '#FF9800'
    },
    {
      title: '평균 계약금액',
      value: '18,269,230',
      unit: '원',
      change: '+15.3%',
      isPositive: true,
      icon: <TrendUp size={24} />,
      color: '#9C27B0'
    }
  ];

  // 월별 매출 데이터
  const monthlyData = [
    { month: '1월', sales: 200000000, contracts: 12 },
    { month: '2월', sales: 250000000, contracts: 15 },
    { month: '3월', sales: 180000000, contracts: 10 },
    { month: '4월', sales: 320000000, contracts: 18 },
    { month: '5월', sales: 280000000, contracts: 16 },
    { month: '6월', sales: 350000000, contracts: 20 },
    { month: '7월', sales: 400000000, contracts: 22 },
    { month: '8월', sales: 285000000, contracts: 17 }
  ];

  // 팀별 성과 데이터
  const teamPerformance = [
    {
      team: '영업팀',
      target: 1500000000,
      actual: 1650000000,
      achievement: 110,
      contracts: 89,
      color: '#2196F3'
    },
    {
      team: '마케팅팀',
      target: 800000000,
      actual: 720000000,
      achievement: 90,
      contracts: 42,
      color: '#4CAF50'
    },
    {
      team: '기술팀',
      target: 500000000,
      actual: 480000000,
      achievement: 96,
      contracts: 25,
      color: '#FF9800'
    }
  ];

  // 상위 고객 데이터
  const topCustomers = [
    { name: '삼성전자', amount: 450000000, contracts: 8, growth: '+25%' },
    { name: 'LG전자', amount: 380000000, contracts: 6, growth: '+18%' },
    { name: '현대자동차', amount: 320000000, contracts: 5, growth: '+12%' },
    { name: 'SK텔레콤', amount: 280000000, contracts: 4, growth: '+8%' },
    { name: 'KT', amount: 250000000, contracts: 3, growth: '+15%' }
  ];

  // 상품별 매출 데이터
  const productSales = [
    { product: '보안솔루션 A', amount: 850000000, share: 30, contracts: 45 },
    { product: '보안솔루션 B', amount: 680000000, share: 24, contracts: 38 },
    { product: '보안솔루션 C', amount: 570000000, share: 20, contracts: 32 },
    { product: '보안솔루션 D', amount: 420000000, share: 15, contracts: 25 },
    { product: '기타', amount: 330000000, share: 11, contracts: 16 }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* 필터 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>기간</InputLabel>
          <Select value={period} label="기간" onChange={(e) => setPeriod(e.target.value)}>
            {periodOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>팀</InputLabel>
          <Select value={team} label="팀" onChange={(e) => setTeam(e.target.value)}>
            {teamOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 요약 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryData.map((item, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {item.value.toLocaleString()} {item.unit}
                    </Typography>
                    <Chip
                      label={item.change}
                      size="small"
                      icon={item.isPositive ? <TrendUp size={14} /> : <TrendDown size={14} />}
                      sx={{
                        backgroundColor: item.isPositive ? '#E8F5E8' : '#FFEBEE',
                        color: item.isPositive ? '#2E7D32' : '#D32F2F',
                        fontSize: '12px'
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '50%',
                      backgroundColor: `${item.color}20`,
                      color: item.color
                    }}
                  >
                    {item.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* 월별 매출 추이 */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                📈 월별 매출 추이
              </Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'end', gap: 1, px: 2 }}>
                {monthlyData.map((data, index) => {
                  const maxSales = Math.max(...monthlyData.map((d) => d.sales));
                  const height = (data.sales / maxSales) * 250;
                  return (
                    <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ mb: 1, fontWeight: 500 }}>
                        {(data.sales / 100000000).toFixed(1)}억
                      </Typography>
                      <Box
                        sx={{
                          width: '100%',
                          height: `${height}px`,
                          backgroundColor: '#2196F3',
                          borderRadius: '4px 4px 0 0',
                          mb: 1,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: '#1976D2',
                            transform: 'scale(1.05)'
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {data.month}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 팀별 성과 */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                🎯 팀별 성과
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {teamPerformance.map((team, index) => (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {team.team}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {team.achievement}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(team.achievement, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#f5f5f5',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: team.color,
                          borderRadius: 4
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        목표: {(team.target / 100000000).toFixed(0)}억
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        실적: {(team.actual / 100000000).toFixed(0)}억
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 상위 고객 */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                👑 상위 고객
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>순위</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>고객명</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>매출액</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>계약수</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>성장률</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topCustomers.map((customer, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {customer.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{(customer.amount / 100000000).toFixed(1)}억원</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{customer.contracts}건</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={customer.growth}
                            size="small"
                            sx={{
                              backgroundColor: '#E8F5E8',
                              color: '#2E7D32',
                              fontSize: '11px'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 상품별 매출 */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                📦 상품별 매출
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {productSales.map((product, index) => (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {product.product}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {product.share}%
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {(product.amount / 100000000).toFixed(1)}억원
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={product.share}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#f5f5f5',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: `hsl(${210 + index * 30}, 70%, 50%)`,
                          borderRadius: 3
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      계약 {product.contracts}건
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesDashboard;
