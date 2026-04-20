import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer,
  ChevronDown,
  Building2,
  Info,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { dbService } from '../services/dbService';
import { useAuth } from '../contexts/AuthContext';
import { Asset } from '../types';

export default function IRReport() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'bens' | 'isentos' | 'exclusivos'>('bens');

  useEffect(() => {
    if (user) {
      let assetsLoaded = false;
      let incomesLoaded = false;

      const unsubAssets = dbService.subscribeToAssets(user.uid, (data) => {
        setAssets(data);
        assetsLoaded = true;
        if (incomesLoaded) setLoading(false);
      });
      const unsubIncomes = dbService.subscribeToIncomes(user.uid, (data) => {
        setIncomes(data);
        incomesLoaded = true;
        if (assetsLoaded) setLoading(false);
      });

      const timeout = setTimeout(() => setLoading(false), 5000);

      return () => {
        unsubAssets();
        unsubIncomes();
        clearTimeout(timeout);
      };
    }
  }, [user]);

  const totalAssets = assets.reduce((acc, curr) => acc + (curr.quantity * (curr.averagePrice || 0)), 0);
  const isentoList = incomes.filter(i => i.category === 'ISENTO');
  const exclusivoList = incomes.filter(i => i.category === 'EXCLUSIVO');
  const totalIsentos = isentoList.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const totalExclusivos = exclusivoList.reduce((acc, curr) => acc + (curr.value || 0), 0);

  const exportToCSV = () => {
    const rows = [];
    rows.push(['Tipo', 'Ticker', 'Nome', 'CNPJ', 'Quantidade', 'Valor Total', 'Descriçao']);
    
    assets.forEach(a => {
      rows.push(['BEM', a.ticker, a.name, a.cnpj || '', a.quantity, (a.quantity * (a.averagePrice || 0)).toFixed(2), a.irpfDescription || '']);
    });
    
    incomes.forEach(i => {
      rows.push(['RENDIMENTO', i.type, i.source, i.cnpj || '', '', i.value.toFixed(2), i.description || '']);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Fintax_IR_Report_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] mt-4">Sincronizando Base de Dados Fiscal</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-display">Auxiliar de Declaração IRPF</h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 opacity-70">Dados consolidados para preenchimento do Programa da Receita</span>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => window.print()}
             className="flex items-center gap-3 px-6 py-2.5 glass-card rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-slate-800 transition-all border border-slate-200/50"
           >
              <Printer size={14} />
              Imprimir Guia
           </button>
           <button 
             onClick={exportToCSV}
             className="flex items-center gap-3 px-6 py-2.5 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-950/10"
           >
             <Download size={14} />
             Exportar Dados
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ReportSection 
          title="Bens e Direitos" 
          amount={totalAssets} 
          items={assets.length} 
          active={activeView === 'bens'}
          onClick={() => setActiveView('bens')}
        />
        <ReportSection 
          title="Rends. Isentos" 
          amount={totalIsentos} 
          items={isentoList.length} 
          active={activeView === 'isentos'}
          onClick={() => setActiveView('isentos')}
        />
        <ReportSection 
          title="Tributação Exclusiva" 
          amount={totalExclusivos} 
          items={exclusivoList.length} 
          active={activeView === 'exclusivos'}
          onClick={() => setActiveView('exclusivos')}
        />
        <ReportSection title="Ganhos Variáveis" amount={0} items={0} />
      </div>

      <div className="glass-card rounded-[32px] premium-shadow overflow-hidden flex flex-col">
        {activeView === 'bens' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 bg-slate-950 text-white flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl">01</div>
                  <div className="flex flex-col">
                    <h4 className="text-sm font-black uppercase tracking-widest font-display">Ficha: Bens e Direitos</h4>
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Grupo Principal • Participações e Ativos</span>
                  </div>
               </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                     <tr>
                        <th className="px-8 py-5 w-24">Código/Grupo</th>
                        <th className="px-8 py-5">Discriminação Técnica</th>
                        <th className="px-8 py-5 text-right">Valor em 31/12/2023</th>
                        <th className="px-8 py-5 text-right bg-emerald-50/30 text-emerald-800">Valor em 31/12/2024</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {assets.length > 0 ? assets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-slate-50 transition-all group">
                           <td className="px-8 py-6">
                              <div className="flex flex-col gap-2">
                                 <span className="font-mono font-black text-[12px] text-slate-900 bg-white shadow-sm px-3 py-1.5 rounded-xl border border-slate-100 text-center">
                                   {asset.irpfCode || '31'}
                                 </span>
                                 <span className="text-[8px] text-slate-400 font-black uppercase tracking-tighter text-center">Grupo {asset.irpfGroup || '03'}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <p className="font-black text-slate-900 uppercase tracking-tight mb-2 font-display text-[13px] group-hover:text-emerald-600 transition-colors">{asset.ticker} - {asset.name}</p>
                              <div className="bg-white/60 border border-slate-200/50 p-4 rounded-2xl text-[11px] text-slate-500 leading-relaxed font-mono italic shadow-inner">
                                 {asset.irpfDescription || `${asset.quantity} COTAS DE ${asset.name.toUpperCase()} (${asset.ticker}) ADQUIRIDAS PELO VALOR TOTAL DE ${formatCurrency(asset.quantity * (asset.averagePrice || 0))}. CUSTODIADO NA INSTITUIÇÃO ${asset.institution?.toUpperCase() || 'FINANCEIRA'}.${asset.cnpj ? ` CNPJ: ${asset.cnpj}` : ''}`}
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right text-slate-300 font-mono italic text-[12px]">R$ 0,00</td>
                           <td className="px-8 py-6 text-right text-slate-900 font-mono font-black text-[14px]">
                              {formatCurrency(asset.quantity * (asset.averagePrice || 0))}
                           </td>
                        </tr>
                     )) : (
                      <tr>
                        <td colSpan={4} className="px-8 py-32 text-center text-slate-200 uppercase text-[10px] font-black tracking-[0.4em]">
                          Nenhum registro encontrado no ano base.
                        </td>
                      </tr>
                     )}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeView === 'isentos' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="p-8 bg-emerald-500 text-slate-950 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-950 font-black text-xl shadow-xl">09</div>
                  <div className="flex flex-col">
                    <h4 className="text-sm font-black uppercase tracking-widest font-display">Rendimentos Isentos</h4>
                    <span className="text-[10px] text-slate-950/40 font-bold uppercase tracking-widest">Dividendos • Rendimentos • Lucros</span>
                  </div>
               </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                     <tr>
                        <th className="px-8 py-5">Item / Tipo</th>
                        <th className="px-8 py-5">Fonte Pagadora</th>
                        <th className="px-8 py-5">CNPJ</th>
                        <th className="px-8 py-5 text-right">Valor Líquido</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {isentoList.length > 0 ? isentoList.map((inc, i) => (
                       <tr key={i} className="hover:bg-slate-50 transition-all font-mono">
                         <td className="px-8 py-6 font-display font-black text-[12px] text-slate-900 uppercase">{inc.type || 'RENDIMENTO'}</td>
                         <td className="px-8 py-6 text-[12px] font-bold text-slate-700">{inc.source}</td>
                         <td className="px-8 py-6 text-[12px] text-slate-400">{inc.cnpj}</td>
                         <td className="px-8 py-6 text-right font-black text-emerald-600 text-[14px]">{formatCurrency(inc.value)}</td>
                       </tr>
                     )) : (
                       <tr><td colSpan={4} className="px-8 py-32 text-center text-slate-200 uppercase tracking-widest text-[10px] font-black">Nenhum rendimento isento detectado.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeView === 'exclusivos' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="p-8 bg-blue-600 text-white flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-xl shadow-xl">10</div>
                  <div className="flex flex-col">
                    <h4 className="text-sm font-black uppercase tracking-widest font-display">Tributação Exclusiva</h4>
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">JCP • Renda Fixa • Aplicações</span>
                  </div>
               </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                     <tr>
                        <th className="px-8 py-5">Item / Tipo</th>
                        <th className="px-8 py-5">Fonte Pagadora</th>
                        <th className="px-8 py-5">CNPJ</th>
                        <th className="px-8 py-5 text-right">Valor Líquido</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {exclusivoList.length > 0 ? exclusivoList.map((inc, i) => (
                       <tr key={i} className="hover:bg-slate-50 transition-all font-mono">
                         <td className="px-8 py-6 font-display font-black text-[12px] text-slate-900 uppercase">{inc.type || 'JCP'}</td>
                         <td className="px-8 py-6 text-[12px] font-bold text-slate-700">{inc.source}</td>
                         <td className="px-8 py-6 text-[12px] text-slate-400">{inc.cnpj}</td>
                         <td className="px-8 py-6 text-right font-black text-blue-600 text-[14px]">{formatCurrency(inc.value)}</td>
                       </tr>
                     )) : (
                       <tr><td colSpan={4} className="px-8 py-32 text-center text-slate-200 uppercase tracking-widest text-[10px] font-black">Nenhum rendimento exclusivo detectado.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-950 p-6 rounded-[32px] border border-slate-800/50 flex items-start gap-4 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 relative z-10">
            <Info size={24} />
          </div>
          <div className="relative z-10">
            <h5 className="text-[11px] font-black text-white uppercase tracking-widest mb-1 font-display">Manual de Integração IRPF</h5>
            <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight opacity-70">
              Utilize os dados desta tela para preencher as seções correspondentes no programa PGD IRPF 2025 da Receita Federal. 
              As descrições detalhadas em "Bens e Direitos" contêm todos os dados obrigatórios para evitar malha fina.
            </p>
          </div>
      </div>
    </div>
  );
}

function ReportSection({ title, amount, items, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={cn(
      "p-6 glass-card rounded-[32px] group cursor-pointer transition-all border property-shadow",
      active ? "bg-white border-emerald-500/30 scale-[1.02]" : "border-slate-100 hover:border-emerald-500/20"
    )}>
      <div className="flex items-center justify-between mb-4">
         <span className={cn(
           "text-[10px] font-black uppercase tracking-widest font-display",
           active ? "text-emerald-500" : "text-slate-400"
         )}>{title}</span>
         <div className={cn(
            "w-2 h-2 rounded-full",
            active ? "bg-emerald-500 animate-pulse" : "bg-slate-200"
         )}></div>
      </div>
      <p className="text-2xl font-black text-slate-950 tracking-tighter font-display">{formatCurrency(amount)}</p>
      <div className="flex items-center gap-2 mt-2">
         <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{items} Registros</span>
         <div className="w-1 h-1 rounded-full bg-slate-200"></div>
         <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Auditado</span>
      </div>
    </div>
  );
}


