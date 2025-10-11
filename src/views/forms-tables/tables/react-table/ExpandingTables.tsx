// material-ui
import Grid from '@mui/material/Grid2';

// project-imports
import { GRID_COMMON_SPACING } from 'config';

import ExpandingTable from 'sections/tables/react-table/ExpandingTable';
import ExpandingDetails from 'sections/tables/react-table/ExpandingDetails';
import ExpandingSubTable from 'sections/tables/react-table/ExpandingSubTable';

// ==============================|| REACT TABLE - EXPANDING ||============================== //

export default function Expanding() {
  return (
    <Grid container spacing={GRID_COMMON_SPACING}>
      <Grid size={12}>
        <ExpandingTable />
      </Grid>
      <Grid size={12}>
        <ExpandingDetails />
      </Grid>
      <Grid size={12}>
        <ExpandingSubTable />
      </Grid>
    </Grid>
  );
}
