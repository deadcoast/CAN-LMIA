import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Statistics } from '../../types/lmia';
import { purplePassionTheme } from '../../theme/purplePassionTheme';

interface ProgramDistributionChartProps {
  statistics: Statistics;
  title?: string;
  height?: number;
}

const ProgramDistributionChart: React.FC<ProgramDistributionChartProps> = ({
  statistics,
  title = "Program Stream Distribution",
  height = 400
}) => {
  const data = statistics.top_programs.map(item => ({
    name: item.program,
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
      formatter: '{a} <br/>{b}: {c} ({d}%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      textStyle: {
        color: purplePassionTheme.text.primary
      }
    },
    legend: {
      orient: 'horizontal',
      bottom: '5%',
      left: 'center',
      textStyle: {
        fontSize: 11,
        color: purplePassionTheme.text.secondary
      }
    },
    series: [
      {
        name: 'Programs',
        type: 'pie',
        radius: '60%',
        center: ['50%', '45%'],
        data: data,
        itemStyle: {
          borderRadius: 6,
          borderColor: purplePassionTheme.borders.primary,
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {d}%',
          fontSize: 11,
          color: purplePassionTheme.text.primary
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          },
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 5
        }
      }
    ],
    color: purplePassionTheme.chartColors
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

export default ProgramDistributionChart;
