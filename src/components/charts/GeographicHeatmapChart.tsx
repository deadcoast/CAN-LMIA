import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Statistics } from '../../types/lmia';
import { purplePassionTheme } from '../../theme/purplePassionTheme';

interface GeographicHeatmapChartProps {
  statistics: Statistics;
  title?: string;
  height?: number;
}

const GeographicHeatmapChart: React.FC<GeographicHeatmapChartProps> = ({
  statistics,
  title = "Geographic Distribution Heatmap",
  height = 400
}) => {
  // Convert provincial data to heatmap format
  const data = statistics.provinces_distribution.map(item => ({
    name: item.province,
    value: item.count
  }));

  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: purplePassionTheme.text.primary
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} employers',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      textStyle: {
        color: purplePassionTheme.text.primary
      }
    },
    visualMap: {
      min: 0,
      max: Math.max(...data.map(item => item.value)),
      left: 'left',
      top: 'bottom',
      text: ['High', 'Low'],
      textStyle: {
        fontSize: 12,
        color: purplePassionTheme.text.secondary
      },
      inRange: {
        color: purplePassionTheme.visualMapColors
      },
      calculable: true
    },
    series: [
      {
        name: 'Employers',
        type: 'map',
        map: 'Canada',
        roam: false,
        emphasis: {
          label: {
            show: true
          },
          itemStyle: {
            areaColor: purplePassionTheme.colors.lightPurple
          }
        },
        data: data
      }
    ]
  };

  return (
    <div 
      className="rounded-lg shadow-md border p-4"
      style={{ 
        backgroundColor: purplePassionTheme.backgrounds.card,
        borderColor: purplePassionTheme.borders.primary
      }}
    >
      <div 
        className="text-center text-sm mb-4"
        style={{ color: purplePassionTheme.text.secondary }}
      >
        Note: This chart requires Canada map data to be loaded
      </div>
      <ReactECharts 
        option={option} 
        style={{ height: height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        theme="purple-passion"
      />
    </div>
  );
};

export default GeographicHeatmapChart;
