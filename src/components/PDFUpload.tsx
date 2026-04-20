import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileUp, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X,
  Plus,
  Upload,
  Database
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { parseFinancialPDF } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { useAuth } from '../contexts/AuthContext';
import { processMonthlyTaxes, getDARFCode } from '../lib/finance';

interface UploadStatus {
  file: File;
  status: 'idle' | 'processing' | 'completed' | 'error' | 'saved';
  progress: number;
  message?: string;
  result?: any;
}

export default function PDFUpload({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = dbService.subscribeToUploads(user.uid, (data) => {
      // Create a new array before sorting to avoid mutation issues
      const sorted = [...data].sort((a: any, b: any) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setHistory(sorted);
    });
    return () => unsubscribe();
  }, [user]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads = acceptedFiles.map(file => ({
      file,
      status: 'idle' as const,
      progress: 0,
    }));
    setUploads(prev => [...prev, ...newUploads]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true
  } as any);

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updatedUploads = [...uploads];
      const allTxToSave: any[] = [];

      for (let i = 0; i < updatedUploads.length; i++) {
        const upload = updatedUploads[i];
        if (upload.status === 'completed' && upload.result) {
          const { positions, transactions, documentType, institution, rendimentosIsentos, rendimentosExclusivos } = upload.result;

          // 1. Save ASSETS
          if (positions) {
            for (const pos of positions) {
              await dbService.upsertAsset(user.uid, {
                ...pos,
                institution: institution || 'Desconhecida'
              });
            }
          }

          // 2. Save TRANSACTIONS
          if (transactions) {
            for (const tx of transactions) {
              const txData = { ...tx, assetId: tx.ticker || 'UNKNOWN', userId: user.uid };
              await dbService.addTransaction(user.uid, txData);
              allTxToSave.push(txData);
            }
          }

          // 3. Save RENDIMENTOS ISENTOS
          if (rendimentosIsentos) {
             for (const inc of rendimentosIsentos) {
                await dbService.addIncome(user.uid, { ...inc, category: 'ISENTO' });
             }
          }

          // 4. Save RENDIMENTOS EXCLUSIVOS
          if (rendimentosExclusivos) {
             for (const inc of rendimentosExclusivos) {
                await dbService.addIncome(user.uid, { ...inc, category: 'EXCLUSIVO' });
             }
          }

          // 5. Save LOG for persistence
          await dbService.addUploadLog(user.uid, {
            filename: upload.file.name,
            documentType,
            institution: institution || 'Desconhecida',
            summary: `${positions?.length || 0} Ativos, ${transactions?.length || 0} Transações Extraídas`
          });

          updatedUploads[i].status = 'saved';
        }
      }

      // Recalculate DARFs if there are new transactions
      if (allTxToSave.length > 0) {
        const currentAssets = await dbService.getAssets(user.uid);
        const taxResults = processMonthlyTaxes(allTxToSave, currentAssets);

        for (const res of taxResults) {
          const dueDate = new Date(res.year, res.month, 0).toISOString().split('T')[0];
          await dbService.addDARF(user.uid, {
            userId: user.uid,
            month: res.month,
            year: res.year,
            amount: res.tax,
            status: 'PENDENTE',
            assetType: res.assetType,
            code: getDARFCode(res.assetType),
            dueDate: dueDate
          });
        }
      }

      setUploads([]); 
      onComplete();
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const processFile = async (index: number) => {
    const upload = uploads[index];
    if (upload.status !== 'idle') return;

    setUploads(prev => {
      const next = [...prev];
      next[index].status = 'processing';
      return next;
    });

    try {
      const base64Data = await fileToBase64(upload.file);
      const result = await parseFinancialPDF(base64Data, upload.file.name);
      setUploads(prev => {
        const next = [...prev];
        next[index].status = 'completed';
        next[index].result = result;
        return next;
      });
    } catch (error: any) {
      console.error("Erro na análise do PDF:", error);
      setUploads(prev => {
        const next = [...prev];
        next[index].status = 'error';
        next[index].message = error.message || 'Erro ao processar PDF';
        return next;
      });
    }

  };


  return (
    <div className="space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-display">Módulo de Interceptação de Dados</h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-none mt-2 opacity-70">Suporte para Notas de Corretagem, Informes e Declaracões</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 space-y-8">
           <div className="glass-card rounded-[32px] premium-shadow overflow-hidden flex flex-col">
              <div 
                {...getRootProps()} 
                className={cn(
                  "p-16 border-4 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center group",
                  isDragActive ? "border-emerald-500 bg-emerald-50/50" : "border-slate-100 hover:border-emerald-500/30 hover:bg-slate-50/50"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-20 h-20 rounded-[32px] bg-white shadow-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:scale-110 transition-all mb-6">
                  <FileUp size={32} />
                </div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2 font-display">Arraste seus PDFs aqui</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Ou clique para selecionar arquivos do seu computador
                </p>
                <div className="flex items-center gap-3 mt-8">
                   {['PDF', 'Max 10MB', 'Seguro'].map(tag => (
                     <span key={tag} className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[8px] font-black uppercase text-slate-400 tracking-widest">{tag}</span>
                   ))}
                </div>
              </div>

              {uploads.length > 0 && (
                <div className="p-8 space-y-4 border-t border-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                   {uploads.map((upload, i) => (
                      <div key={i} className="p-4 bg-slate-50/50 rounded-[20px] flex items-center gap-4 border border-slate-100/50 group">
                         <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                            <FileText size={18} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight">{upload.file.name}</p>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{upload.status} {upload.message && ` • ${upload.message}`}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            {upload.status === 'idle' && (
                               <button 
                                onClick={() => processFile(i)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                               >
                                 Analisar
                               </button>
                            )}
                            {upload.status === 'processing' && <Loader2 size={16} className="animate-spin text-emerald-500" />}
                            {upload.status === 'completed' && <CheckCircle2 size={16} className="text-emerald-500" />}
                            {upload.status === 'error' && <AlertCircle size={16} className="text-rose-500" />}
                            <button onClick={() => removeUpload(i)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                               <X size={16} />
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
              )}

              {uploads.some(u => u.status === 'completed') && (
                 <div className="p-8 bg-white/80 backdrop-blur-sm border-t border-slate-100/50 flex justify-end">
                    <button 
                     onClick={handleConfirm}
                     disabled={isSaving}
                     className="px-10 py-4 bg-slate-950 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-[20px] hover:bg-emerald-600 transition-all flex items-center gap-3 shadow-2xl hover:shadow-emerald-500/20 active:scale-95"
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                      Distribuir Dados para a Carteira
                    </button>
                 </div>
              )}
           </div>
           
           {/* History Section */}
           {history.length > 0 && (
             <div className="mt-12 space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Documentos Arquivados</h3>
                   <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{history.length} Arquivos</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {history.map((h, i) => (
                      <div 
                        key={h.id || i}
                        className="p-5 glass-card border border-slate-100/50 flex items-center gap-4 hover:border-emerald-500/20 transition-all group"
                      >
                         <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                            <FileText size={20} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight">{h.filename}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">{h.documentType}</span>
                               <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                               <span className="text-[9px] font-medium text-slate-400">{h.summary}</span>
                            </div>
                         </div>
                         <div className="text-[10px] text-slate-300 font-mono">
                            {h.timestamp?.toDate ? h.timestamp.toDate().toLocaleDateString() : 'Original'}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
