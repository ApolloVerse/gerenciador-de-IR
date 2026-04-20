import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Download,
  Filter,
  Loader2
} from 'lucide-react';
import { cn, formatCurrency, formatNumber } from '../lib/utils';
import { dbService } from '../services/dbService';
import { useAuth } from '../contexts/AuthContext';
import { Transaction } from '../types';

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 5000);

    const unsubscribe = dbService.subscribeToTransactions(user.uid, (data) => {
      setTransactions(data);
      setLoading(false);
    });
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [user]);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-display">Livro de Operações</h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-none mt-2 opacity-70">Histórico de Ordens e Movimentações</span>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-3 px-6 py-2.5 glass-card rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-slate-800 transition-all border border-slate-200/50">
            <Filter size={14} className="text-emerald-500" />
            Configurar Filtros
          </button>
          <button className="flex items-center gap-3 px-6 py-2.5 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-950/10">
            <Download size={14} />
            Exportar XLS
          </button>
        </div>
      </div>

      <div className="glass-card rounded-[32px] premium-shadow overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-white/40">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Execução</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Ticker</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Movimentação</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Volume</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Preço Exerc.</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Montante Total</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {transactions.length > 0 ? transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 group transition-all">
                  <td className="px-8 py-4 text-nowrap">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity">
                      {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="font-black text-slate-900 font-display text-[13px] uppercase group-hover:text-emerald-600 transition-colors">{tx.ticker || 'ATIVO'}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={cn(
                      "text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border shadow-sm",
                      tx.type === 'COMPRA' ? "bg-blue-500/10 text-blue-600 border-blue-500/10" :
                      tx.type === 'VENDA' ? "bg-orange-500/10 text-orange-600 border-orange-500/10" :
                      "bg-emerald-500/10 text-emerald-600 border-emerald-500/10"
                    )}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-[12px] font-bold text-slate-700 tracking-tight">
                      {formatNumber(tx.quantity, 2)}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-[11px] font-bold text-slate-400 italic">
                      {formatCurrency(tx.unitPrice)}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-[13px] font-black text-slate-900 font-display">
                      {formatCurrency(tx.totalValue)}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button className="w-8 h-8 rounded-xl bg-slate-50 text-slate-200 hover:bg-slate-200 hover:text-emerald-500 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center">
                      <ArrowUpRight size={14} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="text-center py-32 text-slate-300 font-black uppercase tracking-[0.4em] text-[10px]">
                    Nenhum registro no ledger digital.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-950 p-3 px-8 flex items-center justify-between mt-auto">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">Registros Auditáveis via Protocolo SSL-TLS</span>
           </div>
           <span className="text-[10px] text-white/10 font-black uppercase tracking-widest">End-to-End SECURE</span>
        </div>
      </div>
    </div>

  );
}
