import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface ChartTooltipProps {
  title: string;
  label: string;
  value: number;
  total: number;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ title, label, value, total }) => {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

  return (
    <Paper
      elevation={3}
      sx={{
        padding: '12px 16px',
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        minWidth: '180px'
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          color: '#000000',
          fontWeight: 600,
          marginBottom: '8px',
          fontSize: '14px'
        }}
      >
        {title}: {label}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: '#333333', fontSize: '13px' }}>
            건수:
          </Typography>
          <Typography variant="body2" sx={{ color: '#000000', fontWeight: 500, fontSize: '13px' }}>
            {value}건
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: '#333333', fontSize: '13px' }}>
            비율:
          </Typography>
          <Typography variant="body2" sx={{ color: '#000000', fontWeight: 500, fontSize: '13px' }}>
            {percentage}%
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

// HTML 문자열 생성 함수 (ApexCharts에서 사용)
export const createTooltipHTML = (title: string, label: string, value: number, total: number): string => {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

  return `
    <div style="
      padding: 12px 16px;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      min-width: 180px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    ">
      <div style="
        color: #000000;
        font-weight: 600;
        margin-bottom: 8px;
        font-size: 14px;
        font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
      ">
        ${title}: ${label}
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #333333; font-size: 13px; font-family: 'Roboto', sans-serif;">
            건수:
          </span>
          <span style="color: #000000; font-weight: 500; font-size: 13px; font-family: 'Roboto', sans-serif;">
            ${value}건
          </span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #333333; font-size: 13px; font-family: 'Roboto', sans-serif;">
            비율:
          </span>
          <span style="color: #000000; font-weight: 500; font-size: 13px; font-family: 'Roboto', sans-serif;">
            ${percentage}%
          </span>
        </div>
      </div>
    </div>
  `;
};

export default ChartTooltip;
