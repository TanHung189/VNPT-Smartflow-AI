import React from 'react';
import { Users, FileText, Clock, TrendingUp, TrendingDown } from 'lucide-react';

export interface StatData {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  iconType: 'users' | 'workflows' | 'time';
}

interface StatsCardsProps {
  stats: StatData[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'users':
        return <Users className="w-6 h-6 text-[#005A9C]" />;
      case 'workflows':
        return <FileText className="w-6 h-6 text-[#005A9C]" />;
      case 'time':
        return <Clock className="w-6 h-6 text-[#005A9C]" />;
      default:
        return <FileText className="w-6 h-6 text-[#005A9C]" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'users':
        return 'bg-blue-50';
      case 'workflows':
        return 'bg-indigo-50';
      case 'time':
        return 'bg-cyan-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 p-6 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-2 uppercase tracking-wide">{stat.title}</p>
              <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">{stat.value}</h3>
            </div>
            <div className={`p-4 rounded-xl ${getBgColor(stat.iconType)} bg-opacity-80`}>
              {getIcon(stat.iconType)}
            </div>
          </div>
          
          {(stat.change || stat.trend) && (
            <div className="mt-6 flex items-center">
              <span className={`flex items-center text-sm font-semibold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'text-green-700 bg-green-50' : stat.trend === 'down' ? 'text-red-700 bg-red-50' : 'text-gray-600 bg-gray-50'}`}>
                {stat.trend === 'up' && <TrendingUp className="w-4 h-4 mr-1" />}
                {stat.trend === 'down' && <TrendingDown className="w-4 h-4 mr-1" />}
                {stat.change}
              </span>
              <span className="text-gray-400 text-xs ml-3 font-medium">so với tháng trước</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
