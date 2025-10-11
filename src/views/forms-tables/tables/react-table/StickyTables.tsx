// material-ui
import Grid from '@mui/material/Grid2';

// project-imports
import StickyHeader from 'sections/tables/react-table/StickyHeader';

// ==============================|| REACT TABLE - STICKY ||============================== //

export default function StickyTable() {
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <StickyHeader />
      </Grid>
    </Grid>
  );
}
