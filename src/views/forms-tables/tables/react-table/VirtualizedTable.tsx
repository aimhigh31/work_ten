// material-ui
import Grid from '@mui/material/Grid2';

// project-imports
import { GRID_COMMON_SPACING } from 'config';
import VirtualizedInfiniteScrollTable from 'sections/tables/react-table/VirtualizedInfiniteScrollTable';
import VirtualizedRowsTable from 'sections/tables/react-table/VirtualizedRowsTable';

// ==============================|| REACT TABLE - VIRTUALIZED ||============================== //

export default function VirtualizedRows() {
  return (
    <Grid container spacing={GRID_COMMON_SPACING}>
      <Grid size={12}>
        <VirtualizedInfiniteScrollTable />
      </Grid>
      <Grid size={12}>
        <VirtualizedRowsTable />
      </Grid>
    </Grid>
  );
}
