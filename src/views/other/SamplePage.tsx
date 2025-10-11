'use client';

// material-ui
import Typography from '@mui/material/Typography';

// project-imports
import MainCard from 'components/MainCard';

// ==============================|| SAMPLE PAGE ||============================== //

export default function SamplePage() {
  return (
    <MainCard title="Sample Card">
      <Typography variant="body1">
        Do you Know? Mainly is used by more than 2.4K+ Customers worldwide. This new v9 version is the major release of Mainly Dashboard
        Template with having brand new modern User Interface.
      </Typography>
    </MainCard>
  );
}
