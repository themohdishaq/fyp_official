'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getNDVITimeseries } from '@/services/api';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface NDVIChartProps {
  fieldId: string;
}

const NDVIChart: React.FC<NDVIChartProps> = ({ fieldId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [fieldId]);

  const loadData = async () => {
    try {
      const result = await getNDVITimeseries(fieldId);

      if (!result || !result.readings || result.readings.length === 0) {
        setLoading(false);
        return;
      }

      // Sort by date
      const readings = result.readings.sort(
        (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const chartData = {
        labels: readings.map((r: any) => format(new Date(r.date), 'MMM dd')),
        datasets: [
          {
            label: 'Average NDVI',
            data: readings.map((r: any) => r.average_ndvi),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Max NDVI',
            data: readings.map((r: any) => r.max_ndvi),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderDash: [5, 5],
            tension: 0.4,
          },
          {
            label: 'Min NDVI',
            data: readings.map((r: any) => r.min_ndvi),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderDash: [5, 5],
            tension: 0.4,
          },
        ],
      };

      setData(chartData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading NDVI data:', error);
      setLoading(false);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'NDVI Time Series (Phenotyping)',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 1,
        title: {
          display: true,
          text: 'NDVI Value',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading NDVI data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No NDVI data available</div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <Line options={options} data={data} />
    </div>
  );
};

export default NDVIChart;
