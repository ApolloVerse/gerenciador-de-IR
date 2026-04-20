import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  MoreVertical, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Asset } from '../types';
import { cn, formatCurrency, formatNumber } from '../lib/utils';
import { dbService } from '../services/dbService';
import { useAuth } from '../contexts/AuthContext';

export default function Assets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 5000);

    const unsubscribe = dbService.subscribeToAssets(user.uid, (data) => {
      setAssets(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [user]);


  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Carregando Ativos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col">
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-display">Consolidado de Ativos</h3>
           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-none mt-2 opacity-70">Monitoramento Multimercado (B3, Crypto, Bens)</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Localizar ticker..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 glass-card rounded-2xl text-[12px] font-black w-full md:w-72 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 transition-all uppercase tracking-wider placeholder:text-slate-300 placeholder:normal-case"
            />
          </div>
          <div className="flex glass-card rounded-2xl p-1.5 premium-shadow">
            {['ALL', 'ACAO', 'FII', 'CRIPTO'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  filterType === type 
                    ? "bg-slate-900 text-white shadow-xl scale-105" 
                    : "text-slate-400 hover:text-slate-700 hover:bg-white/50"
                )}
              >
                {type === 'ALL' ? 'Todos' : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[32px] premium-shadow overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-white/40">
                <th className="px-8 py-5">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                    Ticker / Ativo
                    <ArrowUpDown size={12} className="opacity-30" />
                  </div>
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Tipo</th>
                <th className="px-8 py-5">
                  <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                    Qtd
                  </div>
                </th>
                <th className="px-8 py-5">
                   <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-right">
                    P. Médio
                  </div>
                </th>
                <th className="px-8 py-5">
                  <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-right">
                    Patrimônio
                  </div>
                </th>
                <th className="px-8 py-5">
                  <div className="flex items-center justify-end gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] text-right">
                    Performance
                  </div>
                </th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredAssets.length > 0 ? filteredAssets.map((asset) => {
                const totalValue = asset.quantity * (asset.currentPrice || asset.averagePrice);
                const profit = ((asset.currentPrice || asset.averagePrice) - asset.averagePrice) / asset.averagePrice * 100;
                const isPositive = profit >= 0;

                return (
                  <tr key={asset.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-[13px] tracking-tight font-display uppercase group-hover:text-emerald-600 transition-colors">{asset.ticker}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase font-sans truncate max-w-[200px] mt-1 opacity-70 group-hover:opacity-100">{asset.name || 'Ativo'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={cn(
                        "text-[9px] font-black px-2 py-1 rounded-lg tracking-widest border shadow-sm",
                        asset.type === 'ACAO' ? "bg-blue-500/10 text-blue-600 border-blue-500/10" :
                        asset.type === 'FII' ? "bg-orange-500/10 text-orange-600 border-orange-500/10" :
                        asset.type === 'CRIPTO' ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/10" :
                        "bg-slate-500/10 text-slate-600 border-slate-500/10"
                      )}>
                        {asset.type}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className="text-[12px] font-bold text-slate-700 tracking-tight">
                        {formatNumber(asset.quantity, asset.type === 'CRIPTO' ? 8 : 2)}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className="text-[11px] font-bold text-slate-400 tracking-tight">
                        {formatCurrency(asset.averagePrice)}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className="text-[13px] font-black text-slate-900 tracking-tight font-display">
                        {formatCurrency(totalValue)}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-tight premium-shadow border",
                        isPositive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/10" : "bg-rose-500/10 text-rose-600 border-rose-500/10"
                      )}>
                        {isPositive ? '+' : ''}{profit.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button className="w-8 h-8 rounded-xl bg-slate-50 text-slate-300 hover:bg-slate-200 hover:text-slate-600 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center text-slate-300 font-black uppercase tracking-[0.3em] text-[10px]">
                    Nenhum ativo detectado na custódia digital.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-slate-950 p-3 px-8 flex items-center justify-between mt-auto">
           <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.25em]">
                Live Analytics • Criptografia AES-256 Ativa
              </span>
           </div>
           <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">Protocolo LINO-PROJ v2.4.5</span>
        </div>
      </div>
    </div>

  );
}
