'use client';

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    Tooltip,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    BarChart,
    Bar,
    LineChart,
    Line,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from 'recharts';

// ============================================
// Types
// ============================================

interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}

interface DonutChartProps {
    data: { name: string; value: number; color: string }[];
    height?: number;
}

interface AreaChartProps {
    data: { name: string; value: number }[];
    color?: string;
    height?: number;
}

interface StackedBarChartProps {
    data: { name: string; income: number; expense: number }[];
    height?: number;
}

interface PieChartSimpleProps {
    data: { name: string; value: number; color: string }[];
    height?: number;
}

interface LineChartProps {
    data: { name: string; value: number }[];
    color?: string;
    height?: number;
}

interface RadarChartProps {
    data: { subject: string; value: number; fullMark: number }[];
    height?: number;
}

interface GaugeChartProps {
    value: number;
    height?: number;
    label?: string;
}

interface SessionTruancyChartProps {
    data: { name: string; alpha: number }[];
    height?: number;
}

// ============================================
// Chart Card Wrapper
// ============================================

export function ChartCard({ title, subtitle, children, className = '' }: ChartCardProps) {
    return (
        <div className={`bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-100 dark:border-[#1a1a1a] shadow-sm p-5 flex flex-col ${className}`}>
            <div className="mb-4 shrink-0">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500 dark:text-neutral-500">{subtitle}</p>}
            </div>
            <div className="flex-1 min-h-0 w-full relative">
                {children}
            </div>
        </div>
    );
}

// ============================================
// Donut Chart (User Distribution)
// ============================================

export function UserDistributionChart({ data, height = 250 }: DonutChartProps & { height?: number | string }) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                    stroke="none"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => [value, 'Jumlah']}
                    contentStyle={{
                        backgroundColor: '#111',
                        border: '1px solid #333',
                        borderRadius: '12px',
                        color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{value}</span>}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Area Chart (Login Traffic)
// ============================================

export function LoginTrafficChart({ data, color = '#8b5cf6', height = 250 }: AreaChartProps) {
    // Check if data is empty or all values are 0
    const hasData = data && data.length > 0 && data.some(d => d.value > 0);

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <svg className="w-16 h-16 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <p className="text-sm font-medium">Belum ada data</p>
                <p className="text-xs text-gray-500">Data akan muncul setelah ada aktivitas</p>
            </div>
        );
    }

    // Generate unique gradient ID to avoid conflicts
    const gradientId = `gradient-${color.replace('#', '')}`;

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" strokeOpacity={0.2} vertical={false} />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    allowDecimals={false}
                />
                <Tooltip
                    formatter={(value) => [value, 'Total']}
                    contentStyle={{
                        backgroundColor: '#111827',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                        color: '#fff'
                    }}
                    itemStyle={{ color: color }}
                    labelStyle={{ color: '#9ca3af', fontWeight: 600 }}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#${gradientId})`}
                    animationDuration={1200}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Stacked Bar Chart (Cashflow)
// ============================================

export function CashflowChart({ data, height = 280 }: StackedBarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#666' }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#666' }}
                    tickFormatter={(value) => `${(value / 1000000)}jt`}
                />
                <Tooltip
                    formatter={(value, name) => [
                        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value as number),
                        name === 'income' ? 'Pemasukan' : 'Pengeluaran'
                    ]}
                    contentStyle={{
                        backgroundColor: '#111',
                        border: '1px solid #333',
                        borderRadius: '12px',
                        color: '#fff'
                    }}
                />
                <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => (
                        <span className="text-xs font-semibold text-gray-400">
                            {value === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                    )}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Simple Pie Chart (Invoice Status)
// ============================================

export function InvoiceStatusChart({ data, height = 220 }: PieChartSimpleProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={true}
                    stroke="none"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => [value, 'Tagihan']}
                    contentStyle={{
                        backgroundColor: '#111',
                        border: '1px solid #333',
                        borderRadius: '12px',
                        color: '#fff'
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Line Chart (Hafalan Growth)
// ============================================

export function HafalanGrowthChart({ data, color = '#10b981', height = 250 }: LineChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#666' }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#666' }}
                />
                <Tooltip
                    formatter={(value) => [value, 'Total Ayat']}
                    contentStyle={{
                        backgroundColor: '#111',
                        border: '1px solid #333',
                        borderRadius: '12px',
                        color: '#fff'
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={3}
                    dot={{ fill: color, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: color }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Radar Chart (Academic Strength)
// ============================================

export function AcademicRadarChart({ data, height = 280 }: RadarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 10, fill: '#999' }}
                />
                <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 9, fill: '#666' }}
                />
                <Radar
                    name="Nilai"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.4}
                    strokeWidth={2}
                />
                <Tooltip
                    formatter={(value) => [value, 'Nilai']}
                    contentStyle={{
                        backgroundColor: '#111',
                        border: '1px solid #333',
                        borderRadius: '12px',
                        color: '#fff'
                    }}
                />
            </RadarChart>
        </ResponsiveContainer>
    );
}

// Re-export DormitoryChart
export { DormitoryChart } from './DormitoryChart';

// ============================================
// Daily Income Area Chart
// ============================================

interface DailyIncomeChartProps {
    data: { day: string; amount: number }[];
    height?: number;
}

export function DailyIncomeChart({ data, height = 250 }: DailyIncomeChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(value) => `${(value / 1000000)}jt`}
                />
                <Tooltip
                    formatter={(value) => [
                        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value as number),
                        'Pemasukan'
                    ]}
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Payment Method Donut Chart
// ============================================

interface PaymentMethodChartProps {
    data: { name: string; value: number; color: string }[];
    height?: number;
}

export function PaymentMethodChart({ data, height = 250 }: PaymentMethodChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => [
                        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value as number),
                        'Total'
                    ]}
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}
                />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Class Density Bar Chart (Vertical)
// ============================================

interface ClassDensityChartProps {
    data: { name: string; count: number; capacity: number }[];
    height?: number;
}

export function ClassDensityChart({ data, height = 250 }: ClassDensityChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <svg className="w-16 h-16 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm font-medium">Belum ada data kelas</p>
                <p className="text-xs text-gray-500">Tambahkan kelas terlebih dahulu</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <defs>
                    <linearGradient id="classGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={1} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" strokeOpacity={0.1} vertical={false} />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <Tooltip
                    formatter={(value, name) => [value, name === 'count' ? 'Jumlah Santri' : 'Kapasitas Kelas']}
                    contentStyle={{
                        backgroundColor: '#111827',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                        color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#9ca3af', fontWeight: 600 }}
                />
                <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingBottom: '10px' }}
                    formatter={(value) => <span className="text-xs text-gray-500 ml-1">{value}</span>}
                />
                <Bar dataKey="count" fill="url(#classGradient)" radius={[6, 6, 0, 0]} name="Santri" animationDuration={1200} />
                <Bar dataKey="capacity" fill="#374151" fillOpacity={0.3} radius={[6, 6, 0, 0]} name="Kapasitas" animationDuration={1200} />
            </BarChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Gender Ratio Pie Chart
// ============================================

interface GenderRatioChartProps {
    data: { name: string; value: number; color: string }[];
    height?: number;
}

export function GenderRatioChart({ data, height = 300 }: GenderRatioChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <svg className="w-16 h-16 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm font-medium">Belum ada data santri</p>
                <p className="text-xs text-gray-500">Tambahkan santri terlebih dahulu</p>
            </div>
        );
    }

    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="42%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                    label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => [`${value} santri`, '']}
                    contentStyle={{
                        backgroundColor: '#111827',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                        color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                />
                <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ paddingTop: '15px' }}
                    formatter={(value) => <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-2 uppercase tracking-wide">{value}</span>}
                />
                {/* Center Text */}
                <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-800 dark:fill-gray-200 text-2xl font-bold">{total}</text>
                <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-500 text-xs">Total</text>
            </PieChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Teacher Load Horizontal Bar Chart
// ============================================

interface TeacherLoadChartProps {
    data: { name: string; hours: number }[];
    height?: number;
}

export function TeacherLoadChart({ data, height = 350 }: TeacherLoadChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-72 text-gray-400">
                <svg className="w-20 h-20 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-base font-semibold text-gray-500 dark:text-gray-400">Belum ada data jadwal</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Buat jadwal pelajaran untuk melihat beban mengajar guru</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                barSize={28}
            >
                <defs>
                    <linearGradient id="loadGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" strokeOpacity={0.1} horizontal={false} />
                <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(v) => `${v} JP`}
                />
                <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 600, fill: '#374151' }}
                    width={120}
                />
                <Tooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                    formatter={(value) => [`${value} jam/minggu`, 'Beban Mengajar']}
                    contentStyle={{
                        backgroundColor: '#111827',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                        color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#9ca3af', fontWeight: 600 }}
                />
                <Bar
                    dataKey="hours"
                    fill="url(#loadGradient)"
                    radius={[0, 8, 8, 0]}
                    animationDuration={1200}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}



// ============================================
// Violation Trend Line Chart
// ============================================

interface ViolationTrendChartProps {
    data: { name: string; violations: number }[];
    height?: number | string;
}

export function ViolationTrendChart({ data, height = 300 }: ViolationTrendChartProps) {
    // Correctly handle percentage heights for ResponsiveContainer compatibility
    const chartHeight = typeof height === 'string' && height.includes('%') ? height : (typeof height === 'string' ? parseInt(height) || 300 : height);

    // Nice default scale logic
    const maxVal = Math.max(...(data.map(d => d.violations) || [0]), 4);

    return (
        <div className="w-full h-full min-h-[inherit]">
            <ResponsiveContainer width="100%" height={chartHeight as any}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -35, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTren" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" vertical={false} strokeOpacity={0.05} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#6b7280', fontWeight: 'bold' }}
                        padding={{ left: 10, right: 10 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#6b7280', fontWeight: 'bold' }}
                        allowDecimals={false}
                        domain={[0, maxVal]}
                        width={80}
                    />
                    <Tooltip
                        cursor={{ stroke: '#f43f5e', strokeWidth: 1, strokeDasharray: '4 4' }}
                        contentStyle={{
                            backgroundColor: '#000',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                            padding: '10px 14px'
                        }}
                        itemStyle={{ color: '#f43f5e', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                        labelStyle={{ color: '#4b5563', fontSize: '9px', marginBottom: '4px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        formatter={(value) => [value, 'Pelanggaran']}
                    />
                    <Area
                        type="monotone"
                        dataKey="violations"
                        stroke="#f43f5e"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorTren)"
                        filter="url(#glow)"
                        dot={{
                            r: 4,
                            fill: '#f43f5e',
                            stroke: '#000',
                            strokeWidth: 2,
                        }}
                        activeDot={{
                            r: 6,
                            fill: '#f43f5e',
                            stroke: '#fff',
                            strokeWidth: 3,
                        }}
                        animationDuration={1500}
                        name="Pelanggaran"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// ============================================
// Violation Radar Chart
// ============================================

interface ViolationRadarChartProps {
    data: { subject: string; value: number; fullMark: number }[];
    height?: number | string;
}

export function ViolationRadarChart({ data, height = 300 }: ViolationRadarChartProps) {
    const chartHeight = typeof height === 'string' && height.includes('%') ? height : (typeof height === 'string' ? parseInt(height) || 300 : height);

    return (
        <ResponsiveContainer width="100%" height={chartHeight as any}>
            <RadarChart cx="50%" cy="52%" outerRadius="80%" data={data}>
                <defs>
                    <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                <PolarGrid stroke="#333" strokeDasharray="3 3" />
                <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                />
                <PolarRadiusAxis
                    angle={30}
                    domain={[0, 'auto']}
                    tick={false}
                    axisLine={false}
                />
                <Radar
                    name="Frekuensi"
                    dataKey="value"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    fill="#f43f5e"
                    fillOpacity={0.3}
                    filter="url(#radarGlow)"
                    animationDuration={1500}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#000',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                        padding: '10px 14px'
                    }}
                    itemStyle={{ color: '#f43f5e', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                />
            </RadarChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Permission Stats Bar Chart
// ============================================

interface PermissionStatsChartProps {
    data: { name: string; value: number }[];
    height?: number | string;
}

export function PermissionStatsChart({ data, height = 300 }: PermissionStatsChartProps) {
    const chartHeight = typeof height === 'string' && height.includes('%') ? height : (typeof height === 'string' ? parseInt(height) || 300 : height);

    // Nice default scale logic
    const maxVal = Math.max(...(data.map(d => d.value) || [0]), 4);

    return (
        <ResponsiveContainer width="100%" height={chartHeight as any}>
            <BarChart data={data} margin={{ top: 20, right: 10, left: -30, bottom: 20 }}>
                <defs>
                    <linearGradient id="colorPerm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" vertical={false} strokeOpacity={0.05} />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#6b7280', fontWeight: 'bold' }}
                    dy={15}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#6b7280', fontWeight: 'bold' }}
                    allowDecimals={false}
                    domain={[0, maxVal]}
                    width={80}
                />
                <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    contentStyle={{
                        backgroundColor: '#000',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                        padding: '10px 14px'
                    }}
                    itemStyle={{ color: '#f59e0b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                    labelStyle={{ color: '#4b5563', fontSize: '9px', marginBottom: '4px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    formatter={(value) => [value, 'Santri']}
                />
                <Bar
                    dataKey="value"
                    fill="url(#colorPerm)"
                    radius={[8, 8, 0, 0]}
                    name="Jumlah Izin"
                    animationDuration={1500}
                    barSize={40}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Attendance Gauge Chart (Half Pie)
// ============================================

export function AttendanceGaugeChart({ value, height = 200, label = 'Hadir' }: GaugeChartProps) {
    const data = [
        { name: 'Hadir', value: value },
        { name: 'Absen', value: 100 - value },
    ];

    return (
        <div className="relative flex flex-col items-center justify-center w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="70%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        <Cell key="cell-0" fill="#10b981" />
                        <Cell key="cell-1" fill="#e5e7eb" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-x-0 bottom-[20%] flex flex-col items-center justify-center">
                <p className="text-4xl font-black text-gray-800 leading-none">{value}%</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</p>
            </div>
        </div>
    );
}

// ============================================
// Session Truancy Bar Chart
// ============================================

export function SessionTruancyChart({ data, height = 250 }: SessionTruancyChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                />
                <Tooltip
                    cursor={{ fill: '#fff5f5' }}
                    contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}
                />
                <Bar
                    dataKey="alpha"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    name="Jumlah Alpha"
                    barSize={40}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
