import React from 'react';
import { 
  FileUp, 
  ScanText, 
  BrainCircuit,
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export default function PipelineTracker({ 
  currentStep = 5, 
  isAnalyzing = false,
  failedStep = null,
  fileName,
  fileSize,
  fileHash
}) {
  const steps = [
    {
      id: 1,
      number: '01',
      title: 'Upload Dossier',
      desc: 'PDF ingestion & hash verification',
      icon: FileUp,
    },
    {
      id: 2,
      number: '02',
      title: 'Document Extraction',
      desc: 'Multilingual OCR & tabular text parsing',
      icon: ScanText,
    },
    {
      id: 3,
      number: '03',
      title: 'ML Risk Analysis',
      desc: 'Anomaly & risk pattern evaluation',
      icon: BrainCircuit,
    },
    {
      id: 4,
      number: '04',
      title: 'Statutory Validation',
      desc: 'PAN, GSTIN & Make in India rules',
      icon: ShieldCheck,
    },
    {
      id: 5,
      number: '05',
      title: 'Final Decision',
      desc: 'Compliance & L1 eligibility verdict',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-[#D0D5DD] dark:border-slate-800 shadow-sm mb-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-[#E4E7EC] dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#101828] dark:text-slate-100 uppercase tracking-wider text-[11px]">
            Verification Sequence:
          </span>
          <span className="font-mono bg-[#EEF2F6] dark:bg-slate-800 text-[#101828] dark:text-slate-300 px-2 py-0.5 rounded font-semibold truncate max-w-xs border border-[#D0D5DD] dark:border-slate-700">
            {fileName || "Awaiting dossier"}
          </span>
          {fileSize && (
            <span className="text-[#667085] dark:text-slate-500 font-mono text-[11px]">({fileSize})</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[#667085] dark:text-slate-400 font-mono text-[11px]">
          <span>Hash:</span>
          <span className="text-[#101828] dark:text-slate-300 font-medium">{fileHash || "sha256:awaiting..."}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#DDF7EE] dark:bg-emerald-950/40 text-[#087F5B] dark:text-emerald-400 border border-[#8ED8C1] dark:border-emerald-800 text-[10px] font-bold">
            INTEGRITY READY
          </span>
        </div>
      </div>

      {/* 5-Step Pipeline Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative">
        {steps.map((step) => {
          const Icon = step.icon;
          const isFailed = failedStep === step.id;
          const isCurrent = isAnalyzing && currentStep === step.id;
          const isCompleted = !isFailed && (currentStep > step.id || (!isAnalyzing && currentStep >= step.id));

          return (
            <div 
              key={step.id} 
              className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between relative min-h-[142px] ${
                isFailed
                  ? 'bg-[#FDE7EA] dark:bg-rose-950/40 border-[#F1A3AE] dark:border-rose-800 ring-2 ring-[#B4233D]/15 shadow-xs'
                  : isCurrent 
                  ? 'bg-[#E8F7F2] dark:bg-emerald-950/40 border-[#8ED8C1] dark:border-emerald-600 ring-2 ring-[#008F6C]/20 shadow-xs' 
                  : isCompleted 
                  ? 'bg-[#F8FAFC] dark:bg-slate-800/70 border-[#D0D5DD] dark:border-slate-700 shadow-xs' 
                  : 'bg-white dark:bg-slate-900/60 border-[#E4E7EC] dark:border-slate-800/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isFailed
                      ? 'bg-[#B4233D] text-white'
                      : isCurrent 
                      ? 'bg-[#008F6C] text-white shadow-xs' 
                      : isCompleted 
                      ? 'bg-[#DDF7EE] dark:bg-emerald-900/70 text-[#087F5B] dark:text-emerald-300 border border-[#8ED8C1] dark:border-transparent' 
                      : 'bg-slate-100 dark:bg-slate-800 text-[#667085] dark:text-slate-400'
                  }`}>
                    {isFailed ? (
                      <AlertCircle className="w-4 h-4 text-white" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-[#087F5B] dark:text-emerald-400" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border tracking-wide shrink-0 ${
                    isFailed
                      ? 'bg-[#FDE7EA] dark:bg-rose-950/80 text-[#B4233D] dark:text-rose-300 border-[#F1A3AE] dark:border-rose-800'
                      : isCurrent 
                      ? 'bg-[#E8F7F2] dark:bg-emerald-900/80 text-[#006B52] dark:text-emerald-200 border-[#8ED8C1] dark:border-emerald-700 animate-pulse font-extrabold' 
                      : isCompleted 
                      ? 'bg-[#DDF7EE] dark:bg-emerald-950/70 text-[#087F5B] dark:text-emerald-300 border-[#8ED8C1] dark:border-emerald-800' 
                      : 'bg-[#EEF2F6] dark:bg-slate-800 text-[#475467] dark:text-slate-400 border-[#D0D5DD] dark:border-slate-700'
                  }`}>
                    {isFailed ? 'FAILED' : isCurrent ? 'PROCESSING' : isCompleted ? 'COMPLETED' : 'PENDING'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-[#101828] dark:text-slate-100 text-sm flex items-center gap-1.5 leading-snug">
                    <span className="text-[#667085] dark:text-slate-400 font-mono text-xs font-bold">{step.number}</span>
                    <span>{step.title}</span>
                  </div>
                  <p className="text-[12.5px] sm:text-[13px] leading-relaxed text-[#475467] dark:text-slate-300 font-normal">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
