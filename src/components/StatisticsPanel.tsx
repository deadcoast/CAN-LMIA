import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Briefcase, MapPin } from 'lucide-react';
import { Statistics } from '../types/lmia';

interface StatisticsPanelProps {
  statistics: Statistics;
  isVisible: boolean;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ statistics, isVisible }) => {
  if (!isVisible) return null;

  const COLORS = ['#0F4C75', '#14B8A6', '#F97316', '#EF4444', '#8B5CF6'];

  return (
    <div className="bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <h2 className="text-lg font-semibold text-white">Labour Market Statistics</h2>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Employers</p>
                <p className="text-2xl font-bold text-blue-900">{statistics.total_employers.toLocaleString()}</p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-600 text-sm font-medium">Total Positions</p>
                <p className="text-2xl font-bold text-teal-900">{statistics.total_positions.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-teal-600" />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Total LMIAs</p>
                <p className="text-2xl font-bold text-orange-900">{statistics.total_lmias.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Avg Positions/LMIA</p>
                <p className="text-2xl font-bold text-purple-900">
                  {statistics.total_lmias > 0 ? (statistics.total_positions / statistics.total_lmias).toFixed(1) : '0'}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Occupations Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Occupations</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statistics.top_occupations.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="occupation" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0F4C75" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Program Distribution Pie Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statistics.top_programs}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ program, percent }) => `${program} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statistics.top_programs.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Provincial Distribution */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Provincial Distribution</h3>
          <div className="space-y-2">
            {statistics.provinces_distribution.slice(0, 10).map((item) => (
              <div key={item.province} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.province}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.count / Math.max(...statistics.provinces_distribution.map(p => p.count))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;