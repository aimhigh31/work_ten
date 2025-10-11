import { useEffect, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';

// project-imports
import { ThemeMode } from 'config';

// third-party
import ReactApexChart, { Props as ChartProps } from 'react-apexcharts';

const pieChartOptions = {
  chart: {
    type: 'donut',
    height: 299
  },
  labels: ['Total Signup', 'Active Student'],
  legend: {
    show: true,
    position: 'bottom'
  },
  dataLabels: {
    enabled: false
  }
};

// ==============================|| STUDENT STATES - CHART ||============================== //s

export function ApexDonutChart() {
  const theme = useTheme();
  const { mode, divider, background } = theme.palette;
  const [options, setOptions] = useState<ChartProps>(pieChartOptions);

  const series = [70, 30];

  useEffect(() => {
    const primaryDark = theme.palette.primary.dark;
    const primaryLight = theme.palette.primary.light;

    setOptions((prevState) => ({
      ...prevState,
      colors: [primaryDark, primaryLight],
      grid: { borderColor: divider },
      stroke: { colors: ['background.paper'] },
      theme: { mode: mode === ThemeMode.DARK ? 'dark' : 'light' }
    }));
  }, [mode, divider, background, theme]);

  return (
    <div id="chart">
      <ReactApexChart options={options} series={series} type="donut" height={280} />
    </div>
  );
}
