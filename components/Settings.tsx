
import React, { useState } from 'react';
import { Save, RefreshCw, Bell, Globe, Layout, Mail, Shield, UserPlus, Users, Trash2, Key, Database, AlertOctagon } from 'lucide-react';
import { AppSettings, Currency, SharedProps, User, UserRole } from '../types';

interface SettingsProps extends SharedProps {
  onUpdateSettings: (newSettings: AppSettings) => void;
  users?: User[];
  onAddUser?: (user: User) => void;
  onDeleteUser?: (id: string) => void;
  onUpdatePassword?: (password: string) => void;
  onResetData?: (type: 'TRANSACTIONS' | 'FULL') => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, onNotify, users, onAddUser, onDeleteUser, onUpdatePassword, onResetData, userRole, currentUser }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('SALES');
  const [newUserPass, setNewUserPass] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChange = (field: keyof AppSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdateSettings(formData);
    onNotify('success', 'System settings updated successfully.');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddUser || !newUserEmail || !newUserPass || !newUserName) return;

    if (users?.some(u => u.email === newUserEmail)) {
        onNotify('error', 'User with this email already exists.');
        return;
    }

    const newUser: User = {
        id: `U${Date.now()}`,
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        password: newUserPass,
        lastLogin: 'Never'
    };

    onAddUser(newUser);
    setNewUserEmail('');
    setNewUserName('');
    setNewUserPass('');
    setNewUserRole('SALES');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdatePassword) return;
    if (newPassword !== confirmPassword) {
      onNotify('error', 'Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      onNotify('error', 'Password must be at least 6 characters.');
      return;
    }
    onUpdatePassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl flex justify-between items-center border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold flex items-center"><Layout className="mr-3 text-blue-500" /> Unique CCS Administration</h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">Global system defaults and corporate access control.</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center shadow-lg transition-all active:scale-95"
        >
          <Save className="mr-2" size={18} /> Apply Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Profile Security */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b pb-3">
                <Key className="mr-2 text-blue-600" size={20} /> Profile Security
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">New Account Password</label>
                    <input 
                        type="password"
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Verify Password</label>
                    <input 
                        type="password"
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </div>
                <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors">
                    Save New Credentials
                </button>
            </form>
        </div>

        {/* User Management */}
        {userRole === 'ADMIN' && users && onAddUser && (
            <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                 <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center border-b pb-3">
                    <Users className="mr-2 text-indigo-600" size={20} /> Workforce & Access Management
                 </h3>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-700 uppercase mb-6 flex items-center tracking-widest">
                            <UserPlus size={16} className="mr-2 text-indigo-500"/> Register New Workforce
                        </h4>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <input 
                                placeholder="Employee Full Name" 
                                value={newUserName}
                                onChange={e => setNewUserName(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
                                required
                            />
                            <input 
                                type="email"
                                placeholder="Work Email (@uniqueccs.com)" 
                                value={newUserEmail}
                                onChange={e => setNewUserEmail(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <select 
                                    value={newUserRole}
                                    onChange={e => setNewUserRole(e.target.value as UserRole)}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white font-medium"
                                >
                                    <option value="ADMIN">Administrator</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="SALES">Sales Agent</option>
                                    <option value="OPS">Operations Specialist</option>
                                </select>
                                <input 
                                    type="password"
                                    placeholder="Initial Password" 
                                    value={newUserPass}
                                    onChange={e => setNewUserPass(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg text-sm transition-all shadow-lg shadow-indigo-100">
                                Create Employee Account
                            </button>
                        </form>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="p-4">Personnel</th>
                                    <th className="p-4">Access Level</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{u.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">{u.role}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {u.id !== currentUser.id && onDeleteUser && (
                                                <button onClick={() => onDeleteUser(u.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all">
                                                    <Trash2 size={16}/>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>
            </div>
        )}

        {/* Corporate Identity */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b pb-3">
            <Globe className="mr-2 text-emerald-600" size={20} /> Corporate Identity
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Company Display Name</label>
              <input 
                type="text" 
                value={formData.companyName}
                onChange={e => handleChange('companyName', e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Primary Currency</label>
                <select 
                  value={formData.defaultCurrency}
                  onChange={e => handleChange('defaultCurrency', e.target.value as Currency)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white outline-none font-medium"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CNY">CNY (¥)</option>
                  <option value="AED">AED</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Standard Margin (%)</label>
                <input 
                  type="number" 
                  value={formData.defaultMarginPercent}
                  onChange={e => handleChange('defaultMarginPercent', Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Corporate Communications */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b pb-3">
            <Mail className="mr-2 text-blue-600" size={20} /> Corporate Communications
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Primary Email Gateway</label>
              <select 
                  value={formData.emailProvider || 'OFFICE365'}
                  onChange={e => handleChange('emailProvider', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white outline-none font-bold text-blue-700"
              >
                  <option value="OFFICE365">Microsoft Office 365 (Corporate Standard)</option>
                  <option value="NATIVE">Native Local Client (Outlook/Mail App)</option>
                  <option value="GMAIL">Google Workspace (Gmail Web)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-2 italic flex items-center"><Shield size={10} className="mr-1"/> Integrated with @uniqueccs.com domain</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Universal Email Signature</label>
              <textarea 
                value={formData.emailSignature}
                onChange={e => handleChange('emailSignature', e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg h-24 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* System & Compliance */}
        <div className="md:col-span-2 bg-slate-900 p-8 rounded-2xl border border-slate-800 text-white">
          <h3 className="text-lg font-bold mb-6 flex items-center border-b border-slate-800 pb-3">
            <Shield className="mr-2 text-blue-500" size={20} /> Unique CCS Compliance & Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Infrastructure</p>
              <p className="font-mono text-sm text-slate-300">Enterprise Build v3.5.0</p>
              <p className="text-[10px] text-slate-600 mt-1">Microsoft 365 Connected</p>
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Production Domain</p>
               <p className="font-mono text-sm text-slate-300">uniqueccs.com</p>
               <p className="text-[10px] text-emerald-500 mt-1 flex items-center"><Database size={10} className="mr-1" /> SQL Storage Sync: Active</p>
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Licensing</p>
               <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-blue-600/20 text-blue-400 border border-blue-500/30">
                 Platinum Enterprise
               </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
