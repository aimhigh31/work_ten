'use client';

import { useState, useEffect, useMemo } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project-imports
import EcommerceDataCard from 'components/cards/statistics/EcommerceDataCard';
import { GRID_COMMON_SPACING } from 'config';

import WelcomeBanner from 'sections/dashboard/default/WelcomeBanner';
import ProjectRelease from 'sections/dashboard/default/ProjectRelease';
import KpiWidget from 'sections/dashboard/default/KpiWidget';
import EducationWidget from 'sections/dashboard/default/EducationWidget';
import Transactions from 'sections/widget/data/Transactions';
import DashboardCalendar from 'sections/admin-panel/online-courses/dashboard/DashboardCalendar';
import ProjectAnalytics from 'sections/widget/chart/ProjectAnalytics';

// hooks
import useUser from 'hooks/useUser';
import { useSupabaseTaskManagement } from 'hooks/useSupabaseTaskManagement';
import { useSupabaseEducation } from 'hooks/useSupabaseEducation';
import { useSupabaseCalendar } from 'hooks/useSupabaseCalendar';
import { useSupabaseCost } from 'hooks/useSupabaseCost';
import { useMenuPermission } from 'hooks/usePermissions';

// assets
import { ArrowUp2, Task, Book, Calendar, DollarCircle } from '@wandersonalwes/iconsax-react';

// ==============================|| DASHBOARD - ADMIN ||============================== //

export default function DashboardDefault() {
  const theme = useTheme();
  const user = useUser();
  const { canViewCategory, canReadData, canCreateData, canEditOwn, canEditOthers, loading: permissionLoading } = useMenuPermission('/dashboard/default');

  // ⭐ Investment 패턴: 데이터 로딩 함수만 가져오기
  const { getTasks } = useSupabaseTaskManagement();
  const { getEducations } = useSupabaseEducation();
  const { getEvents } = useSupabaseCalendar();
  const { getCosts } = useSupabaseCost();

  // ⭐ 페이지 레벨 상태 관리
  const [tasks, setTasks] = useState<any[]>([]);
  const [educations, setEducations] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ⭐ 병렬 로딩: Promise.all로 모든 데이터 동시 로딩
  useEffect(() => {
    const loadAllData = async () => {
      try {
        console.time('⚡ Dashboard - 병렬 로딩');
        setIsLoading(true);

        // 🍽️ 4명의 요리사가 동시에 작업 시작!
        const [tasksData, educationsData, eventsData, costsData] = await Promise.all([
          getTasks(), // 요리사 A: 업무 데이터
          getEducations(), // 요리사 B: 교육 데이터
          getEvents(), // 요리사 C: 일정 데이터
          getCosts() // 요리사 D: 비용 데이터
        ]);

        console.timeEnd('⚡ Dashboard - 병렬 로딩');

        // 상태 업데이트
        setTasks(tasksData);
        setEducations(educationsData);
        setEvents(eventsData);
        setCosts(costsData);

        console.log('✅ 모든 데이터 로딩 완료', {
          tasks: tasksData.length,
          educations: educationsData.length,
          events: eventsData.length,
          costs: costsData.length
        });
      } catch (error) {
        console.error('❌ 데이터 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [getTasks, getEducations, getEvents, getCosts]);

  // 사용자 이름으로 필터링된 데이터 계산
  const dashboardStats = useMemo(() => {
    console.log('📊 대시보드 통계 계산 시작');
    console.log('👤 user 객체:', user);
    console.log('👤 user.korName:', user?.korName);
    console.log('👤 user.name:', user?.name);

    const userName = user?.korName || user?.name || '';

    console.log('👤 최종 사용자 이름:', userName);
    console.log('📋 전체 업무 데이터:', tasks.length, '건');

    if (tasks.length > 0) {
      console.log('📋 업무 데이터 샘플:', tasks.slice(0, 3));
      console.log('📋 첫번째 업무의 assignee_name:', tasks[0]?.assignee_name);
    }

    // 업무관리 통계
    const userTasks = tasks.filter((task) => task.assignee_name === userName);
    console.log('✅ 필터링된 사용자 업무:', userTasks.length, '건');

    if (userTasks.length > 0) {
      console.log('📋 사용자 업무 샘플:', userTasks.slice(0, 3));
    }

    const taskStats = {
      total: userTasks.length,
      waiting: userTasks.filter((t) => t.status === '대기').length,
      progress: userTasks.filter((t) => t.status === '진행').length,
      completed: userTasks.filter((t) => t.status === '완료').length,
      holding: userTasks.filter((t) => t.status === '홀딩').length
    };
    console.log('📊 업무 통계:', taskStats);

    // 개인교육관리 통계
    const userEducations = educations.filter((edu) => edu.assignee_name === userName);
    const educationStats = {
      total: userEducations.length,
      waiting: userEducations.filter((e) => e.status === '대기').length,
      progress: userEducations.filter((e) => e.status === '진행').length,
      completed: userEducations.filter((e) => e.status === '완료').length,
      holding: userEducations.filter((e) => e.status === '홀딩').length
    };

    // 일정관리 통계 (오늘, 이번주, 당월)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const userEvents = events.filter((event) => event.assignee === userName);
    const calendarStats = {
      total: userEvents.length,
      today: userEvents.filter((e) => {
        const eventDate = new Date(e.start_date);
        return eventDate >= today && eventDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      }).length,
      thisWeek: userEvents.filter((e) => {
        const eventDate = new Date(e.start_date);
        return eventDate >= startOfWeek && eventDate <= endOfWeek;
      }).length,
      thisMonth: userEvents.filter((e) => {
        const eventDate = new Date(e.start_date);
        return eventDate >= startOfMonth && eventDate <= endOfMonth;
      }).length
    };

    // 비용관리 통계
    const userCosts = costs.filter((cost) => cost.assignee === userName);
    const costStats = {
      total: userCosts.length,
      waiting: userCosts.filter((c) => c.status === '대기').length,
      progress: userCosts.filter((c) => c.status === '진행').length,
      completed: userCosts.filter((c) => c.status === '완료').length,
      holding: userCosts.filter((c) => c.status === '홀딩').length
    };

    return {
      task: taskStats,
      education: educationStats,
      calendar: calendarStats,
      cost: costStats
    };
  }, [user, tasks, educations, events, costs]);

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
      {/* 권한 체크: 카테고리 보기만 있는 경우 */}
      {canViewCategory && !canReadData ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            py: 8
          }}
        >
          <Typography variant="h5" color="text.secondary">
            이 페이지에 대한 데이터 조회 권한이 없습니다.
          </Typography>
          <Typography variant="body2" color="text.disabled">
            관리자에게 권한을 요청하세요.
          </Typography>
        </Box>
      ) : (
        <>
          {/* 기존 컨텐츠 시작 */}
          <Grid container spacing={GRID_COMMON_SPACING}>
            <Grid size={12}>
              <WelcomeBanner />
            </Grid>
            {/* row 1 - 개인 업무 통계 카드 */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EcommerceDataCard
            title="업무관리"
            count={`총 ${dashboardStats.task.total}건`}
            iconPrimary={<Task />}
            percentage={
              <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', fontSize: '0.875rem' }}>
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                  대기
                </Typography>
                <Typography component="span" color="primary" sx={{ fontWeight: 600 }}>
                  {dashboardStats.task.waiting}
                </Typography>
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                  진행
                </Typography>
                <Typography component="span" color="primary" sx={{ fontWeight: 600 }}>
                  {dashboardStats.task.progress}
                </Typography>
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                  완료
                </Typography>
                <Typography component="span" color="primary" sx={{ fontWeight: 600 }}>
                  {dashboardStats.task.completed}
                </Typography>
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                  홀딩
                </Typography>
                <Typography component="span" color="primary" sx={{ fontWeight: 600 }}>
                  {dashboardStats.task.holding}
                </Typography>
              </Stack>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EcommerceDataCard
            title="개인교육관리"
            count={`총 ${dashboardStats.education.total}건`}
            color="warning"
            iconPrimary={<Book />}
            percentage={
              <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', fontSize: '0.875rem' }}>
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                  대기
                </Typography>
                <Typography component="span" sx={{ color: 'warning.dark', fontWeight: 600 }}>
                  {dashboardStats.education.waiting}
                </Typography>
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                  진행
                </Typography>
                <Typography component="span" sx={{ color: 'warning.dark', fontWeight: 600 }}>
                  {dashboardStats.education.progress}
                </Typography>
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                  완료
                </Typography>
                <Typography component="span" sx={{ color: 'warning.dark', fontWeight: 600 }}>
                  {dashboardStats.education.completed}
                </Typography>
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                  홀딩
                </Typography>
                <Typography component="span" sx={{ color: 'warning.dark', fontWeight: 600 }}>
                  {dashboardStats.education.holding}
                </Typography>
              </Stack>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EcommerceDataCard
            title="일정관리"
            count={`총 ${dashboardStats.calendar.total}건`}
            color="success"
            iconPrimary={<Calendar />}
            percentage={
              <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', fontSize: '0.875rem' }}>
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                  오늘
                </Typography>
                <Typography component="span" sx={{ color: 'success.darker', fontWeight: 600 }}>
                  {dashboardStats.calendar.today}
                </Typography>
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                  이번주
                </Typography>
                <Typography component="span" sx={{ color: 'success.darker', fontWeight: 600 }}>
                  {dashboardStats.calendar.thisWeek}
                </Typography>
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                  당월
                </Typography>
                <Typography component="span" sx={{ color: 'success.darker', fontWeight: 600 }}>
                  {dashboardStats.calendar.thisMonth}
                </Typography>
              </Stack>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EcommerceDataCard
            title="비용관리"
            count={`총 ${dashboardStats.cost.total}건`}
            color="error"
            iconPrimary={<DollarCircle />}
            percentage={
              <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', fontSize: '0.875rem' }}>
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                  대기
                </Typography>
                <Typography component="span" sx={{ color: 'error.dark', fontWeight: 600 }}>
                  {dashboardStats.cost.waiting}
                </Typography>
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                  진행
                </Typography>
                <Typography component="span" sx={{ color: 'error.dark', fontWeight: 600 }}>
                  {dashboardStats.cost.progress}
                </Typography>
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                  완료
                </Typography>
                <Typography component="span" sx={{ color: 'error.dark', fontWeight: 600 }}>
                  {dashboardStats.cost.completed}
                </Typography>
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                  홀딩
                </Typography>
                <Typography component="span" sx={{ color: 'error.dark', fontWeight: 600 }}>
                  {dashboardStats.cost.holding}
                </Typography>
              </Stack>
            }
          />
        </Grid>
        {/* row 2 - 업무관리 & 달력 */}
        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
          <Transactions />
        </Grid>
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <DashboardCalendar />
        </Grid>
        {/* row 3 - KPI관리, 개인교육관리, 변경로그 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiWidget />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <EducationWidget />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <ProjectRelease />
        </Grid>
        {/* row 4 - Project Analytics */}
        <Grid size={12}>
          <ProjectAnalytics costs={costs} userName={user?.name || ''} />
        </Grid>
      </Grid>
          {/* 기존 컨텐츠 끝 */}
        </>
      )}
    </Box>
  );
}
