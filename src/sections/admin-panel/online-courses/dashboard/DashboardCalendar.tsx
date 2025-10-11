// material-ui
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

// project-imports
import MainCard from 'components/MainCard';

// ==============================|| DASHBOARD - CALENDAR ||============================== //

export default function DashboardCalendar() {
  return (
    <MainCard content={false} sx={{ height: 1 }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateCalendar />
      </LocalizationProvider>
    </MainCard>
  );
}
