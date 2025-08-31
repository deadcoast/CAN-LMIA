import React from 'react';
import { X, MapPin, Building, Calendar, TrendingUp, Users, Briefcase } from 'lucide-react';
import { EmployerWithApprovals } from '../types/lmia';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface EmployerModalProps {
  employer: EmployerWithApprovals | null;
  onClose: () => void;
}

const EmployerModal: React.FC<EmployerModalProps> = ({ employer, onClose }) => {
  if (!employer) return null;

  // Prepare chart data
  const occupationData = employer.approvals.reduce((acc, approval) => {
    const existing = acc.find(item => item.occupation === approval.occupation);
    if (existing) {
      existing.positions += approval.approved_positions;
      existing.lmias += approval.approved_lmias;
    } else {
      acc.push({
        occupation: approval.occupation.length > 30 
          ? approval.occupation.substring(0, 30) + '...' 
          : approval.occupation,
        positions: approval.approved_positions,
        lmias: approval.approved_lmias
      });
    }
    return acc;
  }, [] as Array<{ occupation: string; positions: number; lmias: number }>);

  // Timeline data
  const timelineData = employer.approvals
    .sort((a, b) => a.year - b.year || a.quarter.localeCompare(b.quarter))
    .reduce((acc, approval) => {
      const period = `${approval.year} ${approval.quarter}`;
      const existing = acc.find(item => item.period === period);
      if (existing) {
        existing.positions += approval.approved_positions;
      } else {
        acc.push({
          period,
          positions: approval.approved_positions
        });
      }
      return acc;
    }, [] as Array<{ period: string; positions: number }>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{employer.employer_name}</h2>
              <div className="flex items-center space-x-4 text-blue-100">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{employer.city}, {employer.province_territory}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Building className="w-4 h-4" />
                  <span className="text-sm">{employer.incorporate_status}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{employer.total_positions}</div>
              <div className="text-sm text-blue-600">Total Positions</div>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-teal-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-teal-900">{employer.total_lmias}</div>
              <div className="text-sm text-teal-600">Total LMIAs</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Briefcase className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-900">{employer.approvals.length}</div>
              <div className="text-sm text-orange-600">Unique Approvals</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">
                {(employer.total_positions / employer.total_lmias).toFixed(1)}
              </div>
              <div className="text-sm text-purple-600">Avg Positions/LMIA</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Occupations Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Positions by Occupation</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={occupationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="occupation" 
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="positions" fill="#0F4C75" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Timeline Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Timeline</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="positions" 
                    stroke="#14B8A6" 
                    strokeWidth={3}
                    dot={{ fill: '#14B8A6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Approvals Table */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Detailed LMIA Approvals</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NOC Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LMIAs</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Positions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employer.approvals.map((approval, index) => (
                    <tr key={approval.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900">{approval.year} {approval.quarter}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          approval.program_stream === 'High-wage' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-teal-100 text-teal-800'
                        }`}>
                          {approval.program_stream}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{approval.noc_code}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{approval.occupation}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{approval.approved_lmias}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-600">{approval.approved_positions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Address Information */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Employer Information</h4>
            <p className="text-sm text-gray-700"><span className="font-medium">Full Address:</span> {employer.address}</p>
            <p className="text-sm text-gray-700"><span className="font-medium">Postal Code:</span> {employer.postal_code}</p>
            <p className="text-sm text-gray-700"><span className="font-medium">Incorporation Status:</span> {employer.incorporate_status}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerModal;