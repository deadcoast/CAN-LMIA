import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Statistics } from '../../types/lmia';
import { purplePassionTheme } from '../../theme/purplePassionTheme';

interface OccupationTrendChartProps {
  statistics: Statistics;
  title?: string;
  height?: number;
}

const OccupationTrendChart: React.FC<OccupationTrendChartProps> = ({
  statistics,
  title = "Top Occupations",
  height = 400
}) => {
  const data = statistics.top_occupations.slice(0, 10).map(item => ({
    name: item.occupation.length > 30 ? item.occupation.substring(0, 30) + '...' : item.occupation,
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
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const data = params[0];
        return `${data.name}<br/>Employers: ${data.value}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name),
      axisLabel: {
        rotate: 45,
        fontSize: 11,
        color: purplePassionTheme.text.secondary
      },
      axisLine: {
        lineStyle: {
          color: purplePassionTheme.borders.primary
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 12,
        color: purplePassionTheme.text.secondary
      },
      axisLine: {
        lineStyle: {
          color: purplePassionTheme.borders.primary
        }
      },
      splitLine: {
        lineStyle: {
          color: purplePassionTheme.borders.primary
        }
      }
    },
    series: [
      {
        name: 'Employers',
        type: 'bar',
        data: data.map(item => item.value),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: purplePassionTheme.colors.primary },
              { offset: 1, color: purplePassionTheme.colors.secondary }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
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
      <ReactECharts 
        option={option} 
        style={{ height: height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        theme="purple-passion"
      />
    </div>
  );
};

export default OccupationTrendChart;
