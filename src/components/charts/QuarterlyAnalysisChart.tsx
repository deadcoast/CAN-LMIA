import React from 'react';
import ReactECharts from 'echarts-for-react';
import { EmployerWithApprovals } from '../../types/lmia';
import { purplePassionTheme } from '../../theme/purplePassionTheme';

interface QuarterlyAnalysisChartProps {
  employers: EmployerWithApprovals[];
  title?: string;
  height?: number;
}

const QuarterlyAnalysisChart: React.FC<QuarterlyAnalysisChartProps> = ({
  employers,
  title = "Quarterly Analysis",
  height = 400
}) => {
  // Process data to get quarterly trends
  const quarterlyData = employers.reduce((acc, employer) => {
    employer.approvals.forEach(approval => {
      const key = `${approval.year}-${approval.quarter}`;
      if (!acc[key]) {
        acc[key] = {
          period: key,
          year: approval.year,
          quarter: approval.quarter,
          employers: new Set(),
          positions: 0,
          lmia: 0
        };
      }
      acc[key].employers.add(employer.id);
      acc[key].positions += approval.approved_positions;
      acc[key].lmia += approval.approved_lmias;
    });
    return acc;
  }, {} as Record<string, { period: string; year: number; quarter: string; employers: Set<string>; positions: number; lmia: number }>);

  const chartData = Object.values(quarterlyData)
    .sort((a, b) => a.year - b.year || a.quarter.localeCompare(b.quarter))
    .slice(-12); // Show last 12 quarters

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
        let result = `Period: ${params[0].axisValue}<br/>`;
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
      bottom: '15%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.map(item => item.period),
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
        data: chartData.map(item => item.employers.size),
        itemStyle: {
          color: purplePassionTheme.colors.primary,
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: 'Positions',
        type: 'bar',
        data: chartData.map(item => item.positions),
        itemStyle: {
          color: purplePassionTheme.colors.secondary,
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: 'LMIAs',
        type: 'bar',
        data: chartData.map(item => item.lmia),
        itemStyle: {
          color: purplePassionTheme.colors.accent,
          borderRadius: [4, 4, 0, 0]
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

export default QuarterlyAnalysisChart;
