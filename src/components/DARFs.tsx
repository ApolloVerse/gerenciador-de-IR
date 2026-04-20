import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { dbService } from '../services/dbService';
import { useAuth } from '../contexts/AuthContext';
import { DARF } from '../types';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function DARFs() {
  const { user } = useAuth();
  const [darfs, setDarfs] = useState<DARF[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const unsubscribe = dbService.subscribeToDARFs(user.uid, (data) => {
        setDarfs(data.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        }));
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const upcomingDARF = darfs.find(d => d.status === 'PENDENTE');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] mt-4">Sincronizando Obrigações Fiscais</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Recolhimento de DARFs</h3>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Gestão de Impostos de Renda de Variável</span>
      </div>

      {upcomingDARF && (
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border-l-4 border-l-orange-500">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-orange-500" />
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Atenção ao Vencimento</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">DARF Pendente: {formatCurrency(upcomingDARF.amount)}</h3>
            <p className="text-xs text-slate-500 font-medium">
              Referente a <span className="font-bold text-slate-700">{MONTHS[upcomingDARF.month - 1]} {upcomingDARF.year}</span>. 
              Vence em <span className="font-bold text-slate-700">{new Date(upcomingDARF.dueDate).toLocaleDateString()}</span>.
            </p>
            <div className="flex gap-2 mt-6">
              <button className="px-5 py-2 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg">
                <Download size={14} />
                Gerar Guia PDF
              </button>
              <button 
                onClick={() => dbService.updateDARFStatus(user!.uid, upcomingDARF.id, 'PAGO')}
                className="px-5 py-2 bg-emerald-600/10 text-emerald-600 border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest rounded hover:bg-emerald-600/20 transition-all"
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
          <div className="hidden lg:block w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center text-orange-400 border border-orange-200">
             <FileText size={48} strokeWidth={1.5} />
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Histórico de Guias Processadas</span>
           <button className="text-[10px] font-bold text-emerald-600 hover:underline uppercase tracking-wider">Exportar Tudo</button>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Referência</th>
                <th className="px-6 py-3">Tipo / Código</th>
                <th className="px-6 py-3 text-right">Valor do Imposto</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[11px] font-mono">
              {darfs.length > 0 ? darfs.map((darf) => (
                <tr key={darf.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-700 font-sans uppercase">
                    {MONTHS[darf.month - 1]} {darf.year}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-800 font-black tracking-tight">{darf.assetType.replace('_', ' ')}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Cód: {darf.code} • Vcto: {new Date(darf.dueDate).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">
                    {formatCurrency(darf.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={cn(
                        "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border",
                        darf.status === 'PAGO' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-orange-50 text-orange-700 border-orange-100"
                      )}>
                        {darf.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                        <Download size={14} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    Nenhuma guia apurada até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="p-4 bg-slate-900 rounded-lg flex items-center gap-4 border border-slate-800">
        <div className="p-2 bg-emerald-500/10 rounded text-emerald-500">
          <InfoIcon size={18} />
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
          <span className="text-white font-bold uppercase">Nota Fiscal:</span> As guias são apuradas mensalmente. O pagamento deve ocorrer até o último dia útil do mês subsequente ao da operação. 
          Isenções de R$ 20k em ações (Swing Trade) são computadas automaticamente pelo sistema.
        </p>
      </div>
    </div>
  );
}

function InfoIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
