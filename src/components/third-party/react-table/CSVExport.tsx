'use client';

// material-ui
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';

// third-party
import { CSVLink } from 'react-csv';
import { Headers } from 'react-csv/lib/core';

// assets
import { DocumentDownload } from '@wandersonalwes/iconsax-react';

interface CSVExportProps {
  data: never[] | any[];
  filename: string;
  headers?: Headers;
}

// ==============================|| CSV EXPORT ||============================== //

export default function CSVExport({ data, filename, headers }: CSVExportProps) {
  return (
    <CSVLink data={data} filename={filename} headers={headers}>
      <Tooltip title="CSV Export">
        <Box sx={{ color: 'text.secondary' }}>
          <DocumentDownload size={28} variant="Outline" style={{ marginTop: 4, marginRight: 4, marginLeft: 4 }} />
        </Box>
      </Tooltip>
    </CSVLink>
  );
}
