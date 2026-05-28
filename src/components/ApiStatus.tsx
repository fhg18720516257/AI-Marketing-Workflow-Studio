import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';

export function ApiStatus() {
  const settings = useWorkflowStore((state) => state.apiSettings);
  const configured = Boolean(settings.apiKey.trim() && settings.baseUrl.trim() && settings.modelName.trim());

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${configured ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' : 'border-amber-400/30 bg-amber-400/10 text-amber-100'}`}>
      {configured ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
      {configured ? `API 已配置｜${settings.modelName}` : 'API 未配置'}
    </div>
  );
}
