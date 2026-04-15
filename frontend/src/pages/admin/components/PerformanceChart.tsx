import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

export interface ChartDataPoint {
  date: string;
  total: number;
}

interface PerformanceChartProps {
  data: ChartDataPoint[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 transition-shadow hover:shadow-md">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Biểu đồ Lịch sử</h2>
          <p className="text-gray-500 text-sm mt-1">Số lượng quy trình được tạo theo ngày</p>
        </div>
        <select className="border border-gray-200 rounded-lg text-sm px-4 py-2 outline-none text-gray-700 bg-white hover:bg-gray-50 focus:border-[#005A9C] focus:ring-1 focus:ring-[#005A9C] transition-colors cursor-pointer shadow-sm">
          <option>Tuần này</option>
          <option>Tháng này</option>
          <option>Năm nay</option>
        </select>
      </div>
      
      <div className="h-80 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#005A9C" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#005A9C" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 500}}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 500}}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', fontWeight: 500 }}
              itemStyle={{ color: '#005A9C', fontWeight: 600 }}
            />
            <Area 
              type="monotone" 
              name="Số Quy trình"
              dataKey="total" 
              stroke="#005A9C" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorTotal)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#005A9C' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
