import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Statistics } from '../../types/lmia';
import { purplePassionTheme } from '../../theme/purplePassionTheme';

interface ProvincialDistributionChartProps {
  statistics: Statistics;
  title?: string;
  height?: number;
}

const ProvincialDistributionChart: React.FC<ProvincialDistributionChartProps> = ({
  statistics,
  title = "Provincial Distribution",
  height = 400
}) => {
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
      formatter: '{a} <br/>{b}: {c} ({d}%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      textStyle: {
        color: purplePassionTheme.text.primary
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      textStyle: {
        fontSize: 12,
        color: purplePassionTheme.text.secondary
      }
    },
    series: [
      {
        name: 'Employers',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: purplePassionTheme.borders.primary,
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: false
        },
        data: data
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

export default ProvincialDistributionChart;
