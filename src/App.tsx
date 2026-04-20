import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Receipt, 
  History, // Replaced BarChart3 with History for better icon mapping
  Settings,
  Menu,
  X,
  TrendingUp,
  Wallet,
  Calendar,
  AlertCircle,
  LogOut,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import Dashboard from './components/Dashboard';
import Assets from './components/Assets';
import Transactions from './components/Transactions';
import DARFs from './components/DARFs';
import IRReport from './components/IRReport';
import PDFUpload from './components/PDFUpload';
import { useAuth } from './contexts/AuthContext';

type Tab = 'dashboard' | 'assets' | 'transactions' | 'darfs' | 'ir-report' | 'upload' | 'settings';

export default function App() {
  const { user, profile, loading, signIn, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-950 items-center justify-center p-8 text-white">
        <div className="relative">
          <div className="absolute inset-0 w-24 h-24 border-4 border-emerald-500/20 rounded-full animate-ping"></div>
          <div className="w-24 h-24 border-t-4 border-emerald-500 rounded-full animate-spin"></div>
        </div>
        <div className="mt-8 text-center space-y-2">
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-emerald-500">Sincronizando</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Estabelecendo Conexão Segura com FinTax Cloud...</p>
        </div>
      </div>
    );
  }



  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assets', label: 'Ativos', icon: Wallet },
    { id: 'transactions', label: 'Operações', icon: History },
    { id: 'upload', label: 'Importar PDF', icon: PlusCircle },
    { id: 'darfs', label: 'DARFs Mensais', icon: Receipt },
    { id: 'ir-report', label: 'Declaração IRPF', icon: FileText },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ] as const;

  const activeLabel = menuItems.find(i => i.id === activeTab)?.label;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar - Glass Premium Theme */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="glass-sidebar text-white flex flex-col shrink-0 relative z-20 shadow-2xl"
      >
        <div className="p-6 flex items-center gap-3 h-16 border-b border-slate-800/30">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center font-black text-slate-950 text-xl shrink-0 animate-float">F</div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-black text-xl tracking-tighter uppercase font-display"
            >
              FinTax <span className="font-light text-slate-400">Universal</span>
            </motion.span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                activeTab === item.id 
                  ? "bg-emerald-500/10 text-emerald-400 font-bold sidebar-item-active" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={20} className={cn(
                "shrink-0",
                activeTab === item.id ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
              )} />
              {isSidebarOpen && <span className="text-xs truncate uppercase tracking-[0.1em] font-black">{item.label}</span>}
              {activeTab === item.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute right-0 w-1 h-5 bg-emerald-500 rounded-l-full" 
                />
              )}
            </button>
          ))}
        </nav>
        <div className={cn(
          "p-4 border-t border-slate-800/30",
          !isSidebarOpen && "items-center flex flex-col"
        )}>
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 premium-shadow">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0 shadow-inner">
                <img src={user?.photoURL || "https://ui-avatars.com/api/?name=Guest"} referrerPolicy="no-referrer" alt="User" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate text-slate-100 uppercase tracking-tight">{user?.displayName || 'Investidor'}</p>
                <span className="text-[10px] uppercase font-black text-emerald-500 flex items-center gap-1 transition-colors mt-0.5">
                  Guest Active
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-white/5 rounded-xl">
               <div className="w-5 h-5 rounded-full bg-emerald-500" />
            </div>
          )}
        </div>
      </motion.aside>



      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0 relative z-10 transition-all duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-none">{activeLabel}</h2>
              <div className="flex items-center gap-2 mt-1">
                 <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                 <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none">
                   Jan 2025 • Brasil • IRPF 2025
                 </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Período de Apuração</span>
              <span className="text-xs font-bold text-slate-700">Janeiro / 2025</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
               <AlertCircle size={14} />
               <span className="text-[10px] font-bold uppercase tracking-widest">Compliance OK</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <div key={activeTab}>
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'assets' && <Assets />}
              {activeTab === 'transactions' && <Transactions />}
              {activeTab === 'upload' && <PDFUpload onComplete={() => setActiveTab('assets')} />}
              {activeTab === 'darfs' && <DARFs />}
              {activeTab === 'ir-report' && <IRReport />}
              {activeTab === 'settings' && (
                <div className="py-24 text-center space-y-4">
                  <div className="w-20 h-20 bg-white shadow-sm border border-slate-200 rounded-[24px] flex items-center justify-center mx-auto text-slate-300">
                    <Settings size={40} />
                  </div>
                  <h3 className="text-xl font-bold uppercase text-slate-900 tracking-tight">Painel de Configurações</h3>
                  <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed font-medium">Configure seu regime tributário, integre APIs de corretoras e gerencie as preferências de exportação para o programa da Receita Federal.</p>
                  <button className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">Editar Perfil Fiscal</button>
                </div>
              )}
            </div>
          </AnimatePresence>
        </main>

        {/* Global Footer Status Bar */}
        <footer className="h-8 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-[10px] text-slate-400 shrink-0 font-mono">
          <div className="flex gap-6 uppercase tracking-wider font-bold">
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span>B3: CONNECTED</span>
            </div>
            <span>IBOV: 128.450 PTS</span>
            <span>DOLAR: R$ 5,48</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-slate-500">USER: {user.uid.slice(0, 8)}...</span>
            <span className="flex items-center gap-2">
               <span className="text-emerald-600 font-bold">SYNC EM TEMPO REAL ATIVO</span>
               <div className="w-px h-3 bg-slate-200" />
               <span>V.2.4.0-BETA</span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
