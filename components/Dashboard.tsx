import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { MoreHorizontal, ArrowUpRight, ArrowDownRight, ArrowRight, User, MousePointer2, Smartphone, Monitor, Tablet } from 'lucide-react';
import { clsx } from 'clsx';

// --- DATA ---
const DATA_VISITORS = [
  { name: 'Feb', visitors: 10000 },
  { name: 'Mar', visitors: 15000 },
  { name: 'Apr', visitors: 12000 },
  { name: 'May', visitors: 19000 },
  { name: 'Jun', visitors: 16000 },
  { name: 'Jul', visitors: 24000 },
  { name: 'Aug', visitors: 21000 },
  { name: 'Sep', visitors: 28000 },
  { name: 'Oct', visitors: 25000 },
  { name: 'Nov', visitors: 32000 },
  { name: 'Dec', visitors: 28000 },
];

const DATA_OS = [
  { name: 'Mon', Android: 20, iOS: 30, Web: 20, Windows: 10 },
  { name: 'Tue', Android: 35, iOS: 35, Web: 20, Windows: 10 },
  { name: 'Wed', Android: 15, iOS: 25, Web: 20, Windows: 10 },
  { name: 'Thu', Android: 10, iOS: 30, Web: 15, Windows: 10 },
  { name: 'Fri', Android: 10, iOS: 15, Web: 20, Windows: 10 },
  { name: 'Sat', Android: 35, iOS: 25, Web: 10, Windows: 6 },
  { name: 'Sun', Android: 40, iOS: 30, Web: 20, Windows: 10 },
];

const DATA_BROWSER = [
  { name: 'Mon', Chrome: 45, Firefox: 20, Safari: 10, Edge: 10 },
  { name: 'Tue', Chrome: 40, Firefox: 10, Safari: 10, Edge: 10 },
  { name: 'Wed', Chrome: 52, Firefox: 12, Safari: 12, Edge: 12 },
  { name: 'Thu', Chrome: 28, Firefox: 12, Safari: 10, Edge: 10 },
  { name: 'Fri', Chrome: 30, Firefox: 15, Safari: 10, Edge: 7 },
  { name: 'Sat', Chrome: 45, Firefox: 32, Safari: 10, Edge: 3 },
  { name: 'Sun', Chrome: 68, Firefox: 17, Safari: 10, Edge: 5 },
];

const DATA_DONUT_1 = [
  { name: 'Delivery', value: 24.8, color: '#e2e8f0' }, 
  { name: 'Others', value: 75.2, color: '#334155' }, 
];
const DATA_DONUT_2 = [
  { name: 'Sales', value: 15.2, color: '#3b82f6' }, 
  { name: 'Marketing', value: 30, color: '#1e40af' },
  { name: 'Support', value: 20, color: '#60a5fa' },
  { name: 'Dev', value: 34.8, color: '#eff6ff' },
];
const DATA_DONUT_3 = [
    { name: 'Operations', value: 35, color: '#7c3aed' }, 
    { name: 'Personnel', value: 25, color: '#a78bfa' },
    { name: 'Tools', value: 20, color: '#ddd6fe' },
    { name: 'Office', value: 20, color: '#f3f4f6' },
];

const DATA_SMALL_LINE_1 = [{ v: 10 }, { v: 40 }, { v: 30 }, { v: 70 }, { v: 50 }, { v: 90 }, { v: 80 }];
const DATA_SMALL_LINE_2 = [{ v: 50 }, { v: 20 }, { v: 60 }, { v: 40 }, { v: 70 }, { v: 50 }, { v: 80 }];
const DATA_SMALL_LINE_3 = [{ v: 30 }, { v: 50 }, { v: 40 }, { v: 60 }, { v: 80 }, { v: 70 }, { v: 90 }];

// KPI Stat 8 Bars
const DATA_KPI_BARS = [
    { name: 'Mo', value: 40 },
    { name: 'Tu', value: 60 },
    { name: 'We', value: 45 },
    { name: 'Th', value: 70 },
    { name: 'Fr', value: 65 },
    { name: 'Sa', value: 50 },
    { name: 'Su', value: 40 },
];

const KPI_CHART_CARDS = [
    { title: 'Total Revenue', value: '$228k', change: '3%', trend: 'up', color: 'green', data: DATA_KPI_BARS },
    { title: 'Total Expenses', value: '$71.2k', change: '1%', trend: 'up', color: 'yellow', data: DATA_KPI_BARS.map(d => ({...d, value: d.value * 0.7})) },
    { title: 'Total Profit', value: '$156k', change: '8%', trend: 'down', color: 'red', data: DATA_KPI_BARS.map(d => ({...d, value: d.value * 0.9})) },
];

const SIMPLE_KPIS = [
    { title: 'Total Revenue', value: '$228,451', change: '33%', trend: 'up', color: 'green' },
    { title: 'Total Expenses', value: '$71,887', change: '13.0%', trend: 'up', color: 'red' }, // Red usually means bad expense increase
    { title: 'Total Profit', value: '$156,540', change: '0.0%', trend: 'flat', color: 'yellow' },
    { title: 'New Customers', value: '1,234', change: '1.0%', trend: 'up', color: 'green' },
];

const Dashboard: React.FC = () => {
  return (
    <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-900 h-full text-slate-900 dark:text-slate-100 overflow-y-auto font-sans transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1 border border-slate-300 dark:border-slate-700 w-fit">
                  <button className="px-4 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 rounded shadow-sm text-slate-900 dark:text-white transition-colors">Desktop</button>
                  <button className="px-4 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Tablet</button>
                  <button className="px-4 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Mobile</button>
              </div>
          </div>

          {/* Row 1: Simple Financial KPIs (Screenshot 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SIMPLE_KPIS.map((kpi, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl relative overflow-hidden group shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{kpi.title}</span>
                          <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1", 
                             kpi.color === 'green' ? "text-emerald-500 bg-emerald-500/10" : 
                             kpi.color === 'red' ? "text-rose-500 bg-rose-500/10" : "text-amber-500 bg-amber-500/10"
                          )}>
                              {kpi.trend === 'up' && <ArrowUpRight size={12} />}
                              {kpi.trend === 'down' && <ArrowDownRight size={12} />}
                              {kpi.trend === 'flat' && <ArrowRight size={12} />}
                              {kpi.change}
                          </span>
                      </div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">{kpi.value}</div>
                  </div>
              ))}
          </div>

          {/* Row 2: KPI Charts (KPI Stat 8 - Screenshot 4) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {KPI_CHART_CARDS.map((card, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl relative overflow-hidden flex items-end justify-between min-h-[160px] shadow-sm">
                      <div className="flex flex-col h-full justify-between z-10 w-1/2">
                          <div>
                              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium block mb-1">{card.title}</span>
                              <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">{card.value}</div>
                          </div>
                          <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit", 
                             card.color === 'green' ? "text-emerald-500 bg-emerald-500/10" : 
                             card.color === 'red' ? "text-rose-500 bg-rose-500/10" : "text-amber-500 bg-amber-500/10"
                          )}>
                              {card.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                              {card.change}
                          </span>
                      </div>
                      
                      <div className="w-1/2 h-24 absolute right-4 bottom-4">
                           <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={card.data} barGap={2}>
                                   <Bar dataKey="value" fill={card.color === 'green' ? '#10b981' : card.color === 'red' ? '#f43f5e' : '#f59e0b'} radius={[2, 2, 2, 2]} barSize={8} className="dark:opacity-80" />
                                   <Bar dataKey="value" fill="#334155" radius={[2, 2, 2, 2]} barSize={8} className="opacity-10 absolute -z-10" />
                               </BarChart>
                           </ResponsiveContainer>
                      </div>
                  </div>
              ))}
          </div>

          {/* Row 3: Line Chart Widgets (Screenshot 3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                  { title: 'New Subscriptions', value: '249', change: '33% vs last month', color: '#10b981', data: DATA_SMALL_LINE_1 },
                  { title: 'New Customers', value: '1159', change: '0% vs last month', color: '#f59e0b', data: DATA_SMALL_LINE_2 },
                  { title: 'Month\'s Revenue', value: '$228,441', change: '19% vs last month', color: '#ec4899', data: DATA_SMALL_LINE_3 }
              ].map((card, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 relative shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                          <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{card.title}</span>
                          <MoreHorizontal size={16} className="text-slate-500 cursor-pointer hover:text-slate-300" />
                      </div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{card.value}</div>
                      <div className={clsx("text-xs mb-4 flex items-center gap-1 font-medium", 
                          card.color === '#ec4899' ? "text-pink-500" : card.color === '#f59e0b' ? "text-amber-500" : "text-emerald-500"
                      )}>
                          {card.color === '#ec4899' ? '↘' : '↗'} {card.change}
                      </div>
                      <div className="h-16 w-32 absolute bottom-6 right-6">
                           <ResponsiveContainer width="100%" height="100%">
                               <LineChart data={card.data}>
                                   <Line type="monotone" dataKey="v" stroke={card.color} strokeWidth={2} dot={false} />
                               </LineChart>
                           </ResponsiveContainer>
                      </div>
                  </div>
              ))}
          </div>

          {/* Row 4: Big Area Chart - Analytics (Screenshot 5) */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
               <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
                   <div className="flex items-center gap-8">
                       <div className="bg-slate-100 dark:bg-slate-700/50 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600/50">
                           <div className="text-xs text-indigo-500 dark:text-indigo-400 font-bold mb-1">Unique Visitors</div>
                           <div className="flex items-center gap-2">
                               <span className="text-2xl font-bold text-slate-900 dark:text-white">147k</span>
                               <span className="text-xs bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold">↗ 12.8%</span>
                           </div>
                       </div>
                       <div>
                           <div className="text-xs text-slate-500 mb-1 font-medium">Total Visits</div>
                           <div className="flex items-center gap-2">
                               <span className="text-xl font-bold text-slate-700 dark:text-slate-300">623k</span>
                               <span className="text-xs bg-slate-100 dark:bg-slate-700/50 text-slate-500 px-1.5 py-0.5 rounded">→ -2.1%</span>
                           </div>
                       </div>
                       <div>
                           <div className="text-xs text-slate-500 mb-1 font-medium">Bounce Rate</div>
                           <div className="flex items-center gap-2">
                               <span className="text-xl font-bold text-slate-700 dark:text-slate-300">36.78%</span>
                               <span className="text-xs bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold">↗ 2.4%</span>
                           </div>
                       </div>
                   </div>
                   <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                       <button className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-700 rounded text-slate-900 dark:text-white shadow-sm">6 Months</button>
                       <button className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">30 Days</button>
                       <button className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">7 Days</button>
                   </div>
               </div>

               <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={DATA_VISITORS}>
                            <defs>
                                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                                itemStyle={{ color: '#f1f5f9' }}
                            />
                            <Area type="monotone" dataKey="visitors" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitors)" />
                        </AreaChart>
                    </ResponsiveContainer>
               </div>
          </div>

          {/* Row 5: Stacked Bar Charts (Screenshot 6) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* OS */}
               <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Operating Systems</h3>
                       <MoreHorizontal size={16} className="text-slate-500" />
                   </div>
                   <div className="flex gap-4 text-[10px] text-slate-400 mb-6 justify-center">
                       <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-600"></span> Android</span>
                       <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> iOS</span>
                       <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-200"></span> Web</span>
                       <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white border border-slate-700"></span> Win</span>
                   </div>
                   <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={DATA_OS} barSize={16}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <Bar dataKey="Android" stackId="a" fill="#475569" radius={[0,0,0,0]} />
                                <Bar dataKey="iOS" stackId="a" fill="#94a3b8" />
                                <Bar dataKey="Web" stackId="a" fill="#e2e8f0" />
                                <Bar dataKey="Windows" stackId="a" fill="#f8fafc" radius={[2,2,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                   </div>
               </div>

               {/* Browsers */}
               <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Browser Usage</h3>
                       <MoreHorizontal size={16} className="text-slate-500" />
                   </div>
                   <div className="h-[240px] mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={DATA_BROWSER} barSize={16}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <Bar dataKey="Chrome" stackId="a" fill="#1d4ed8" radius={[0,0,0,0]} />
                                <Bar dataKey="Firefox" stackId="a" fill="#3b82f6" />
                                <Bar dataKey="Safari" stackId="a" fill="#93c5fd" />
                                <Bar dataKey="Edge" stackId="a" fill="#dbeafe" radius={[2,2,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                   </div>
               </div>

                {/* Device Types */}
               <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Device Types</h3>
                       <MoreHorizontal size={16} className="text-slate-500" />
                   </div>
                   <div className="h-[240px] mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={DATA_OS} barSize={16}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <Bar dataKey="Android" stackId="a" fill="#4c1d95" radius={[0,0,0,0]} />
                                <Bar dataKey="iOS" stackId="a" fill="#7c3aed" />
                                <Bar dataKey="Web" stackId="a" fill="#a78bfa" />
                                <Bar dataKey="Windows" stackId="a" fill="#ddd6fe" radius={[2,2,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                   </div>
               </div>
          </div>

          {/* Row 6: Donuts (Screenshot 7) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                  { title: 'Personal Expenses', value: '$5,420', sub: 'avg', highlight: '↗ 24.8%', data: DATA_DONUT_1, icons: [MousePointer2, User] },
                  { title: 'Summary Expenses', value: '$12,345', sub: 'total', highlight: '↗ 15.2%', data: DATA_DONUT_2, icons: [Monitor, Smartphone] },
                  { title: 'Cost Distribution', value: '$8,790', sub: 'total', highlight: '↘ -5.4%', data: DATA_DONUT_3, icons: [Tablet, User] }
              ].map((card, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                           <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</span>
                           <div className="flex items-center gap-2">
                               <button className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">Per Day</button>
                               <MoreHorizontal size={16} className="text-slate-500" />
                           </div>
                      </div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
                          {card.value} <span className="text-sm font-normal text-slate-500">{card.sub}</span>
                      </div>
                      <div className="h-40 relative flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                    data={card.data}
                                    innerRadius={55}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    cornerRadius={4}
                                  >
                                      {card.data.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                  </Pie>
                              </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className={clsx("text-sm font-bold", card.highlight.includes('↗') ? "text-emerald-500" : "text-rose-500")}>
                                  {card.highlight}
                              </span>
                          </div>
                      </div>
                      <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-6 text-[10px] text-slate-500">
                          {card.data.map(item => (
                              <div key={item.name} className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                                  {item.name}
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default Dashboard;