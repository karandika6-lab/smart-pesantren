'use client';

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from 'recharts';

interface DormitoryChartProps {
    data: { name: string; value: number; color: string }[];
    height?: number;
}

export function DormitoryChart({ data, height = 280 }: DormitoryChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#737373' }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#737373' }}
                    tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                    formatter={(value) => [`${value}%`, 'Kepadatan']}
                    contentStyle={{
                        backgroundColor: '#171717',
                        border: '1px solid #262626',
                        borderRadius: '12px',
                        color: 'white'
                    }}
                    itemStyle={{ color: '#10b981' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
