import { useState, useMemo } from 'react';

// material-ui
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import dayjs, { Dayjs } from 'dayjs';

// project-imports
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';
import { useSupabaseCalendar } from 'hooks/useSupabaseCalendar';

// ==============================|| DASHBOARD - CALENDAR ||============================== //

export default function DashboardCalendar() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const user = useUser();
  const { events } = useSupabaseCalendar();

  // 선택된 날짜의 일정 필터링
  const selectedDateEvents = useMemo(() => {
    const userName = user?.korName || user?.name || '';
    const selectedDateStr = selectedDate.format('YYYY-MM-DD');

    return events.filter((event) => {
      const eventDate = dayjs(event.start_date).format('YYYY-MM-DD');
      return event.assignee === userName && eventDate === selectedDateStr;
    });
  }, [events, user, selectedDate]);

  return (
    <MainCard content={false} sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, pb: 1 }}>
        <Typography variant="h5">일정관리</Typography>
      </Box>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateCalendar
          value={selectedDate}
          onChange={(newValue) => setSelectedDate(newValue || dayjs())}
        />
      </LocalizationProvider>

      {/* 선택된 날짜의 일정 목록 */}
      <Box sx={{ borderTop: 1, borderColor: 'divider', flex: 1, overflow: 'auto' }}>
        <Box sx={{ p: 2 }}>
          <List disablePadding>
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => (
                <ListItem
                  key={event.id}
                  sx={{
                    px: 0,
                    py: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 400 }}>
                    <Typography component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                      {dayjs(event.start_date).format('YYYY-MM-DD HH:mm')}
                    </Typography>
                    {event.title}
                  </Typography>
                </ListItem>
              ))
            ) : (
              <ListItem sx={{ px: 0, py: 2 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      등록된 일정이 없습니다
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </Box>
      </Box>
    </MainCard>
  );
}
