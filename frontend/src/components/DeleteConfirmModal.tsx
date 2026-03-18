import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '确认删除?',
  description = '此操作无法撤销。'
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-full">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-text">{title}</h3>
            <p className="text-sm text-text-muted">
              {description}
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-bold text-text-muted bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}