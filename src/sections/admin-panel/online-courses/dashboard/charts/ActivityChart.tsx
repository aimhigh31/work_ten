import { useState, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';

// third-party
import ReactApexChart, { Props as ChartProps } from 'react-apexcharts';

// project-imports
import { ThemeMode } from 'config';

type ChartData = {
  name: string;
  data: number[];
};

// chart options
const areaChartOptions = {
  chart: {
    type: 'line',
    toolbar: { show: false },
    zoom: { enabled: false }
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  legend: { show: true, position: 'top', horizontalAlign: 'right' },
  markers: { size: 3, strokeWidth: 2, hover: { size: 6 } },
  tooltip: {
    shared: true,
    intersect: false,
    y: {
      formatter: function (val: number) {
        return `${val}`;
      }
    }
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    axisBorder: { show: false },
    axisTicks: { show: false }
  },
  yaxis: {
    labels: {
      formatter: function (value: number) {
        return `${value}`;
      }
    }
  }
};

// ==============================|| DASHBOARD - ACTIVITY CHART ||============================== //

export default function ActivityChart({ data }: { data: ChartData[] }) {
  const theme = useTheme();
  const [chartSeries, setChartSeries] = useState(data);
  const [chartOptions, setChartOptions] = useState<ChartProps>(areaChartOptions);

  useEffect(() => {
    const { mode, text, divider, primary, success } = theme.palette;
    setChartOptions((prev) => ({
      ...prev,
      colors: [primary.main, success.main],
      xaxis: {
        ...prev.xaxis,
        labels: { style: { colors: text.secondary } },
        axisBorder: { color: divider }
      },
      yaxis: { ...prev.yaxis, labels: { ...prev.yaxis.labels, style: { colors: text.secondary } } },
      markers: { ...prev.markers, colors: [primary.main, success.main], strokeColors: 'white' },
      grid: { borderColor: divider },
      theme: { mode: mode === ThemeMode.DARK ? 'dark' : 'light' }
    }));
  }, [theme]);

  useEffect(() => {
    setChartSeries(data);
  }, [data]);

  return <ReactApexChart options={chartOptions} series={chartSeries} type="line" height={240} />;
}
