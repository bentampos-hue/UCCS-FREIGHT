import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { TrendingUp, Briefcase, DollarSign, Activity, Package, Globe, BarChart3, ShieldCheck } from 'lucide-react';
import { Job, SharedProps } from '../types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface DashboardProps extends SharedProps {
  activityLog: any[];
  jobs: Job[];
}

const COLORS = {
  shipped: '#3b82f6',
  quoted: '#94a3b8',
  done: '#10b981'
};

const Dashboard: React.FC<DashboardProps> = ({ activityLog, jobs, settings }) => {
  const stats = useMemo(() => {
    const shipped = jobs.filter(j => j.status === 'SHIPMENT').length;
    const completed = jobs.filter(j => j.status === 'COMPLETED').length;
    const total = jobs.length;
    const revenue = jobs.reduce((acc, j) => {
        const accepted = j.quoteVersions.find(q => q.status === 'CONFIRMED' || q.status === 'SENT');
        return acc + (accepted?.sellPrice || 0);
    }, 0);
    const profit = jobs.reduce((acc, j) => {
        const accepted = j.quoteVersions.find(q => q.status === 'CONFIRMED');
        return acc + (accepted ? (accepted.sellPrice - accepted.buyPrice) : 0);
    }, 0);
    return { total, shipped, completed, revenue, profit, margin: revenue > 0 ? (profit / revenue) * 100 : 0 };
  }, [jobs]);

  const pieData = [
    { name: 'In Transit', value: stats.shipped, color: COLORS.shipped },
    { name: 'Completed', value: stats.completed, color: COLORS.done },
    { name: 'Draft/Quoting', value: stats.total - stats.shipped - stats.completed, color: COLORS.quoted },
  ].filter(x => x.value > 0);

  return (
    <div className="max-w-screen-2xl mx-auto px-10 pb-24 animate-slide-up">
      <header className="py-16">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Analytics Console</h1>
        <p className="text-slate-500 text-base mt-2 font-medium max-w-2xl leading-relaxed">Platform performance architecture and commercial node liquidity telemetry.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
        <Card className="group hover:-translate-y-2 transition-all p-10 border-white/20">
           <div className="flex items-center gap-4 text-blue-600 mb-8">
              <div className="p-3 bg-blue-50 rounded-2xl ring-1 ring-blue-100 shadow-sm"><DollarSign size={20} /></div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] italic">Revenue Forecast</span>
           </div>
           <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-slate-900 tracking-tighter">{stats.revenue.toLocaleString()}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{settings.baseCurrency}</span>
           </div>
        </Card>
        <Card className="group hover:-translate-y-2 transition-all p-10 border-white/20">
           <div className="flex items-center gap-4 text-emerald-600 mb-8">
              <div className="p-3 bg-emerald-50 rounded-2xl ring-1 ring-emerald-100 shadow-sm"><TrendingUp size={20} /></div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] italic">Target Margin</span>
           </div>
           <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-slate-900 tracking-tighter">{stats.margin.toFixed(1)}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">% YIELD SIGNAL</span>
           </div>
        </Card>
        <Card className="group hover:-translate-y-2 transition-all p-10 border-white/20">
           <div className="flex items-center gap-4 text-slate-500 mb-8">
              <div className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-100 shadow-sm"><Briefcase size={20} /></div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] italic">Active Projects</span>
           </div>
           <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-slate-900 tracking-tighter">{stats.total}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">PROTOCOL NODES</span>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <Card title="Traffic Performance Signal" className="h-[520px] border-white/20">
            <div className="h-[400px] mt-8 pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                    { name: 'Node A', v: 400 }, { name: 'Node B', v: 320 }, { name: 'Node C', v: 640 },
                    { name: 'Node D', v: 480 }, { name: 'Node E', v: 820 }, { name: 'Node F', v: 740 },
                    { name: 'Node G', v: 960 }
                ]}>
                  <defs>
                    <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} dy={15} />
                  <YAxis hide />
                  <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="url(#areaColor)" strokeWidth={3} animationDuration={1500} />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 12px 40px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)'}}
                    itemStyle={{fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase'}}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Card title="Architecture Integrity" className="h-[520px] border-white/20">
            <div className="h-[300px] mt-10 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={80} outerRadius={110} paddingAngle={10} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-12 space-y-5 px-4">
              {pieData.map((x, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-black/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: x.color}}></div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{x.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 tracking-tight">{x.value} Files</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;