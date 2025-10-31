'use client';

import { useEffect, useState, useMemo } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid2';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// third-party
import ReactApexChart, { Props as ChartProps } from 'react-apexcharts';

// project-imports
import Avatar from 'components/@extended/Avatar';
import MainCard from 'components/MainCard';
import { ThemeMode } from 'config';

// assets
import { ArrowSwapHorizontal, Chart, Clock, Diagram, TickCircle } from '@wandersonalwes/iconsax-react';

// ==============================|| CHART ||============================== //

function CostDataChart({ data, categories, counts }: { data: number[]; categories: string[]; counts: number[] }) {
  const theme = useTheme();
  const mode = theme.palette.mode;

  // chart options
  const areaChartOptions = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
        borderRadiusApplication: 'end'
      }
    },
    legend: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 3,
      colors: ['transparent']
    },
    fill: {
      opacity: 1
    },
    grid: {
      strokeDashArray: 4
    }
  };

  const { primary, secondary } = theme.palette.text;
  const line = theme.palette.divider;

  const [options, setOptions] = useState<ChartProps>(areaChartOptions);

  useEffect(() => {
    setOptions((prevState) => ({
      ...prevState,
      colors: [theme.palette.primary.main],
      xaxis: {
        categories: categories,
        labels: {
          style: { colors: secondary }
        },
        axisBorder: {
          show: false,
          color: line
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          style: { colors: secondary },
          formatter: (val: number) => '₩' + val.toLocaleString()
        }
      },
      grid: {
        borderColor: line
      },
      theme: {
        mode: mode === ThemeMode.DARK ? 'dark' : 'light'
      },
      tooltip: {
        custom: function({ seriesIndex, dataPointIndex, w }: any) {
          const count = counts[dataPointIndex] || 0;
          const amount = data[dataPointIndex] || 0;
          return `<div style="padding: 8px 12px; background: white; border: 1px solid #e0e0e0; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <span style="font-size: 13px; color: #333;">${count}건, ₩${amount.toLocaleString()}</span>
          </div>`;
        }
      }
    }));
  }, [mode, primary, secondary, line, theme, categories, counts, data]);

  const series = [
    {
      name: '',
      data: data
    }
  ];

  return <ReactApexChart options={options} series={series} type="bar" height={250} />;
}

// ==============================|| CHART WIDGET - PROJECT ANALYTICS ||============================== //

interface ProjectAnalyticsProps {
  costs: any[];
  userName: string;
}

export default function ProjectAnalytics({ costs = [], userName }: ProjectAnalyticsProps) {
  const [period, setPeriod] = useState('Monthly');

  // 현재 사용자의 비용 데이터만 필터링
  const myCosts = useMemo(() => {
    return costs.filter((cost) => cost.assignee === userName);
  }, [costs, userName]);

  // 기간별 데이터 계산
  const chartData = useMemo(() => {
    const today = new Date();

    if (period === 'Today') {
      // 최근 12일
      const days = [];
      const amounts = [];
      const counts = [];

      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayCosts = myCosts.filter((cost) => {
          const costDate = new Date(cost.start_date || cost.created_at);
          return costDate.toISOString().split('T')[0] === dateStr;
        });

        const dayAmount = dayCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);

        days.push(`${date.getMonth() + 1}/${date.getDate()}`);
        amounts.push(dayAmount);
        counts.push(dayCosts.length);
      }

      return { categories: days, data: amounts, counts };
    } else if (period === 'Weekly') {
      // 최근 12주
      const weeks = [];
      const amounts = [];
      const counts = [];

      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() - i * 7);

        const weekCosts = myCosts.filter((cost) => {
          const costDate = new Date(cost.start_date || cost.created_at);
          return costDate >= weekStart && costDate <= weekEnd;
        });

        const weekAmount = weekCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);

        weeks.push(`${weekStart.getMonth() + 1}/${weekStart.getDate()}`);
        amounts.push(weekAmount);
        counts.push(weekCosts.length);
      }

      return { categories: weeks, data: amounts, counts };
    } else {
      // Monthly - 최근 12개월
      const months = [];
      const amounts = [];
      const counts = [];

      for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        const monthCosts = myCosts.filter((cost) => {
          const costDate = new Date(cost.start_date || cost.created_at);
          return costDate.getFullYear() === year && costDate.getMonth() + 1 === month;
        });

        const monthAmount = monthCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);

        months.push(`${year}-${String(month).padStart(2, '0')}`);
        amounts.push(monthAmount);
        counts.push(monthCosts.length);
      }

      return { categories: months, data: amounts, counts };
    }
  }, [myCosts, period]);

  // 우측 통계 계산
  const stats = useMemo(() => {
    const total = myCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);
    const waiting = myCosts
      .filter((cost) => cost.status === '대기')
      .reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);
    const inProgress = myCosts
      .filter((cost) => cost.status === '진행')
      .reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);
    const completed = myCosts
      .filter((cost) => cost.status === '완료')
      .reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);
    const holding = myCosts
      .filter((cost) => cost.status === '홀딩')
      .reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);

    return { total, waiting, inProgress, completed, holding };
  }, [myCosts]);

  const handleChangePeriod = (event: SelectChangeEvent) => {
    setPeriod(event.target.value as string);
  };

  return (
    <MainCard
      title="비용관리"
      content={false}
      divider={false}
      sx={{
        '& .MuiCardHeader-root': {
          pb: 0
        }
      }}
    >
      <Box sx={{ width: '100%', p: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack sx={{ gap: 2 }}>
              <Stack direction="row" sx={{ gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                <Box sx={{ minWidth: 120 }}>
                  <FormControl fullWidth>
                    <Select id="period-select" value={period} onChange={handleChangePeriod}>
                      <MenuItem value="Today">Today</MenuItem>
                      <MenuItem value="Weekly">Weekly</MenuItem>
                      <MenuItem value="Monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Stack>
              <CostDataChart data={chartData.data} categories={chartData.categories} counts={chartData.counts} />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <List disablePadding sx={{ mt: -1.5, '& .MuiListItem-root': { px: 3, py: 0.75 } }}>
              <ListItem divider>
                <ListItemAvatar>
                  <Avatar variant="rounded" color="primary" sx={{ color: 'primary.main' }}>
                    <Chart />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ color: 'primary.main', fontWeight: 600 }}>총합계</Typography>}
                  secondary={<Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600 }}>₩{stats.total.toLocaleString()}</Typography>}
                />
              </ListItem>
              <ListItem divider>
                <ListItemAvatar>
                  <Avatar variant="rounded" color="secondary" sx={{ color: 'text.secondary' }}>
                    <Clock />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ color: 'text.secondary' }}>대기</Typography>}
                  secondary={<Typography variant="subtitle1">₩{stats.waiting.toLocaleString()}</Typography>}
                />
              </ListItem>
              <ListItem divider>
                <ListItemAvatar>
                  <Avatar variant="rounded" color="secondary" sx={{ color: 'text.secondary' }}>
                    <Diagram />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ color: 'text.secondary' }}>진행</Typography>}
                  secondary={<Typography variant="subtitle1">₩{stats.inProgress.toLocaleString()}</Typography>}
                />
              </ListItem>
              <ListItem divider>
                <ListItemAvatar>
                  <Avatar variant="rounded" color="secondary" sx={{ color: 'text.secondary' }}>
                    <TickCircle />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ color: 'text.secondary' }}>완료</Typography>}
                  secondary={<Typography variant="subtitle1">₩{stats.completed.toLocaleString()}</Typography>}
                />
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <Avatar variant="rounded" color="secondary" sx={{ color: 'text.secondary' }}>
                    <ArrowSwapHorizontal />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ color: 'text.secondary' }}>홀딩</Typography>}
                  secondary={<Typography variant="subtitle1">₩{stats.holding.toLocaleString()}</Typography>}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Box>
    </MainCard>
  );
}
