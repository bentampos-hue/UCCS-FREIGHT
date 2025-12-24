
import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, CartesianGrid, XAxis, YAxis 
} from 'recharts';
import { Clock, TrendingUp, Briefcase, Activity, ArrowRight, Target, AlertTriangle, Ship, Plane, Globe, Zap } from 'lucide-react';
import { ActivityLog, SharedProps, QuoteStatus, AppView, Quotation, VendorEnquiry } from '../types';

interface DashboardProps extends SharedProps {
  activityLog: ActivityLog[];
  quotations: Quotation[];
  enquiries: VendorEnquiry[];
  onNavigateToReports: (filter: QuoteStatus | 'ALL') => void;
}

const COLORS = {
  confirmed: '#10b981',
  sent: '#3b82f6',
  lost: '#ef4444',
  pending: '#f59e0b'
};

const Dashboard: React.FC<DashboardProps> = ({ activityLog, quotations, enquiries, onNavigateToReports, onNavigate, userRole }) => {
  
  const statusDistribution = useMemo(() => {
    const counts = {
      Confirmed: quotations.filter(q => q.status === 'CONFIRMED').length,
      Active: quotations.filter(q => q.status === 'SENT' || q.status === 'RENEGOTIATE').length,
      Pending: quotations.filter(q => q.status === 'PENDING_APPROVAL').length,
      Lost: quotations.filter(q => q.status === 'LOST' || q.status === 'CANCELLED').length,
    };
    return [
      { name: 'Confirmed', value: counts.Confirmed, color: COLORS.confirmed },
      { name: 'Active', value: counts.Active, color: COLORS.sent },
      { name: 'Pending Approval', value: counts.Pending, color: COLORS.pending },
      { name: 'Lost/Cancelled', value: counts.Lost, color: COLORS.lost },
    ].filter(item => item.value > 0);
  }, [quotations]);

  const shipmentStats = useMemo(() => {
    const confirmed = quotations.filter(q => q.status === 'CONFIRMED');
    const stats = { booked: 0, transit: 0, cleared: 0, delivered: 0, exception: 0 };
    confirmed.forEach(q => {
        const latest = q.milestones?.[0]?.status || 'BOOKING_CONFIRMED';
        if (latest === 'EXCEPTION') stats.exception++;
        else if (latest === 'DELIVERED') stats.delivered++;
        else if (latest === 'CUSTOMS_CLEARED') stats.cleared++;
        else if (['CARGO_PICKED_UP', 'DEPARTED_POL', 'ARRIVED_POD', 'FLIGHT_DEPARTED', 'FLIGHT_ARRIVED'].includes(latest)) stats.transit++;
        else stats.booked++;
    });
    return stats;
  }, [quotations]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-indigo-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden border-b-8 border-indigo-700">
        <div className="absolute top-0 right-0 p-12 opacity-10"><Zap size={140} /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h3 className="text-3xl font-black tracking-tight mb-2 uppercase italic">Operations Control Center</h3>
                <p className="text-indigo-300 font-medium max-w-lg">Monitoring {quotations.length} active multi-modal corridors across global trade lanes.</p>
            </div>
            <div className="flex gap-4">
                <div className="bg-white/10 p-5 rounded-3xl border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-1 tracking-widest text-center">Sea Port Volume</p>
                    <div className="flex items-baseline justify-center space-x-2">
                        <Ship size={14} className="text-blue-400" />
                        <span className="text-2xl font-black">{quotations.filter(q => q.modality === 'SEA').length}</span>
                    </div>
                </div>
                <div className="bg-white/10 p-5 rounded-3xl border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-1 tracking-widest text-center">Air Hub Volume</p>
                    <div className="flex items-baseline justify-center space-x-2">
                        <Plane size={14} className="text-indigo-400" />
                        <span className="text-2xl font-black">{quotations.filter(q => q.modality === 'AIR').length}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-10">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center">
              <Activity className="mr-3 text-indigo-600" size={18}/> Live Logistics Pulse
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { label: 'Booked', val: shipmentStats.booked, color: 'slate' },
                { label: 'In Transit', val: shipmentStats.transit, color: 'blue' },
                { label: 'Customs', val: shipmentStats.cleared, color: 'violet' },
                { label: 'Delivered', val: shipmentStats.delivered, color: 'emerald' },
                { label: 'Exceptions', val: shipmentStats.exception, color: 'red' }
              ].map((stat, i) => (
                <div key={i} className={`p-6 rounded-3xl border border-slate-100 bg-${stat.color}-50/30 transition-all hover:shadow-lg`}>
                    <p className={`text-[10px] font-black uppercase mb-2 tracking-widest text-${stat.color}-600`}>{stat.label}</p>
                    <p className={`text-4xl font-black text-${stat.color}-900`}>{stat.val}</p>
                </div>
              ))}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 h-96">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Revenue Projections</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                        { m: 'Jan', s: 4000, a: 2400 },
                        { m: 'Feb', s: 3000, a: 1398 },
                        { m: 'Mar', s: 2000, a: 9800 },
                        { m: 'Apr', s: 2780, a: 3908 },
                        { m: 'May', s: 1890, a: 4800 },
                    ]}>
                        <defs>
                            <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                            <linearGradient id="air" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                        </defs>
                        <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <Area type="monotone" dataKey="s" stroke="#3b82f6" fill="url(#sea)" strokeWidth={3} />
                        <Area type="monotone" dataKey="a" stroke="#6366f1" fill="url(#air)" strokeWidth={3} />
                        <Tooltip />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center">
              <Activity className="mr-3 text-indigo-600" size={16} /> Activity Stream
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {activityLog.map((log) => (
                <div key={log.id} className="flex gap-4 group">
                    <div className="mt-1">
                        <div className={`w-3 h-3 rounded-full border-4 border-white shadow-sm ${log.action.includes('Awarded') ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800 tracking-tight leading-snug">{log.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded tracking-widest">{log.module}</span>
                            <span className="text-[10px] text-slate-300 font-black">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
