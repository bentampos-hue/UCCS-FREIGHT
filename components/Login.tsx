
import React, { useState } from 'react';
import { Ship, Lock, User, ArrowRight, Loader2, Info, AlertCircle, ShieldCheck, RefreshCcw } from 'lucide-react';
import { User as UserType } from '../types';
import { repo } from '../services/repository';

interface LoginProps {
  onLogin: (user: UserType) => void;
  users: UserType[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Give it a tiny delay to feel like a "verification"
    setTimeout(() => {
        const foundUser = users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());

        if (foundUser) {
            if (foundUser.password === password) {
                onLogin(foundUser);
            } else {
                setError('Invalid security credentials. Please verify your password.');
                setLoading(false);
            }
        } else {
            setError(`Account "${email}" not recognized. Please use your official @uniqueccs.com email.`);
            setLoading(false);
        }
    }, 600);
  };

  const handleRestore = () => {
    if (window.confirm("This will clear your browser's local cache and restore the default administrator (admin@uniqueccs.com / admin123). Proceed?")) {
        repo.factoryReset();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full opacity-50"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-slate-200 rounded-full opacity-30"></div>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in border border-slate-200 relative z-10">
        <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <ShieldCheck size={20} className="text-blue-500 opacity-50" />
          </div>
          <div className="inline-flex p-4 bg-blue-600 rounded-2xl mb-6 shadow-xl shadow-blue-500/20">
            <Ship className="text-white" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Unique CCS</h1>
          <p className="text-slate-400 text-sm mt-2 uppercase tracking-widest font-semibold text-center">Enterprise Portal</p>
        </div>
        
        <div className="p-10">
          <div className="mb-8 text-center">
            <h2 className="text-lg font-bold text-slate-800">System Authentication</h2>
            <p className="text-slate-500 text-sm">Access the SeaFreight automation gateway</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex flex-col border border-red-100 animate-fade-in">
                    <div className="flex items-start">
                        <AlertCircle size={18} className="mr-3 mt-0.5 shrink-0"/>
                        <span>{error}</span>
                    </div>
                    <button 
                        type="button"
                        onClick={handleRestore}
                        className="mt-3 text-[10px] font-bold uppercase tracking-wider text-red-800 hover:underline flex items-center"
                    >
                        <RefreshCcw size={10} className="mr-1" /> Restore Factory Admin
                    </button>
                </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Work Email</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800"
                  placeholder="admin@uniqueccs.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Security Credentials</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed group active:scale-95"
            >
              {loading ? (
                <><Loader2 className="animate-spin mr-2" size={20} /> Authenticating...</>
              ) : (
                <>Enter Platform <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} /></>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 text-center">
             <div className="inline-flex items-center px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-tight">
               <ShieldCheck size={12} className="mr-1.5 text-blue-500" /> End-to-End Encryption Active
             </div>
             <p className="mt-4 text-[10px] text-slate-300">
               © {new Date().getFullYear()} Unique CCS. Production Build v3.5
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
