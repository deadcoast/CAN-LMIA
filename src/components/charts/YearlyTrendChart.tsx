import React from 'react';
import ReactECharts from 'echarts-for-react';
import { EmployerWithApprovals } from '../../types/lmia';
import { purplePassionTheme } from '../../theme/purplePassionTheme';

interface YearlyTrendChartProps {
  employers: EmployerWithApprovals[];
  title?: string;
  height?: number;
}

const YearlyTrendChart: React.FC<YearlyTrendChartProps> = ({
  employers,
  title = "Yearly Trends",
  height = 400
}) => {
  // Process data to get yearly trends
  const yearlyData = employers.reduce((acc, employer) => {
    employer.approvals.forEach(approval => {
      const year = approval.year;
      if (!acc[year]) {
        acc[year] = {
          year,
          employers: new Set(),
          positions: 0,
          lmia: 0
        };
      }
      acc[year].employers.add(employer.id);
      acc[year].positions += approval.approved_positions;
      acc[year].lmia += approval.approved_lmias;
    });
    return acc;
  }, {} as Record<number, { year: number; employers: Set<string>; positions: number; lmia: number }>);

  const chartData = Object.values(yearlyData)
    .map(item => ({
      year: item.year,
      employers: item.employers.size,
      positions: item.positions,
      lmia: item.lmia
    }))
    .sort((a, b) => a.year - b.year);

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
        type: 'cross'
      },
      formatter: (params: any) => {
        let result = `Year: ${params[0].axisValue}<br/>`;
        params.forEach((param: any) => {
          result += `${param.seriesName}: ${param.value.toLocaleString()}<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: ['Employers', 'Positions', 'LMIAs'],
      top: '10%',
      textStyle: {
        fontSize: 12,
        color: purplePassionTheme.text.secondary
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.map(item => item.year),
      axisLabel: {
        fontSize: 12,
        color: purplePassionTheme.text.secondary
      },
      axisLine: {
        lineStyle: {
          color: purplePassionTheme.borders.primary
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Count',
        position: 'left',
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
      }
    ],
    series: [
      {
        name: 'Employers',
        type: 'line',
        data: chartData.map(item => item.employers),
        smooth: true,
        lineStyle: {
          color: purplePassionTheme.colors.primary,
          width: 3
        },
        itemStyle: {
          color: purplePassionTheme.colors.primary
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${purplePassionTheme.colors.primary}30` },
              { offset: 1, color: `${purplePassionTheme.colors.primary}05` }
            ]
          }
        }
      },
      {
        name: 'Positions',
        type: 'line',
        data: chartData.map(item => item.positions),
        smooth: true,
        lineStyle: {
          color: purplePassionTheme.colors.secondary,
          width: 3
        },
        itemStyle: {
          color: purplePassionTheme.colors.secondary
        }
      },
      {
        name: 'LMIAs',
        type: 'line',
        data: chartData.map(item => item.lmia),
        smooth: true,
        lineStyle: {
          color: purplePassionTheme.colors.accent,
          width: 3
        },
        itemStyle: {
          color: purplePassionTheme.colors.accent
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

export default YearlyTrendChart;
