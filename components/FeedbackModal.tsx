import React, { useState } from 'react';
import { X, Send, MessageSquare, Bug, Lightbulb, AlertTriangle, ArrowRight } from 'lucide-react';

interface FeedbackModalProps {
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const [category, setCategory] = useState<'bug' | 'suggestion' | 'valuation' | 'general'>('bug');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    
    // Constructing mailto link to direct Gmail submission
    const subject = encodeURIComponent(`[QuantCasa Tester Feedback] ${category.toUpperCase()} - ${new Date().toLocaleDateString()}`);
    const body = encodeURIComponent(
      `TESTER FEEDBACK REPORT\n` +
      `======================\n` +
      `Category: ${category}\n` +
      `Date: ${new Date().toLocaleString()}\n\n` +
      `Description:\n${description}\n\n` +
      `----------------------\n` +
      `Sent via QuantCasa Intelligence Layer v5.3`
    );

    // Opening user's email client
    window.location.href = `mailto:bakshiaviral993@gmail.com?subject=${subject}&body=${body}`;
    
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[600] bg-neo-bg/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-neo-bg border border-white/10 rounded-[48px] p-10 md:p-12 shadow-neo-glow relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 transition-transform group-hover:scale-110 duration-1000">
          <MessageSquare size={160} className="text-neo-pink" />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neo-pink/10 rounded-2xl text-neo-pink shadow-pink-glow">
                <MessageSquare size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Tester Node</h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black opacity-60 mt-1">Submit Feedback Signals</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-white/5 rounded-xl hover:bg-neo-pink hover:text-white transition-all text-gray-500">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Signal Category</span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'bug', icon: <Bug size={14}/>, label: 'Bug' },
                  { id: 'suggestion', icon: <Lightbulb size={14}/>, label: 'Suggestion' },
                  { id: 'valuation', icon: <AlertTriangle size={14}/>, label: 'Valuation Error' },
                  { id: 'general', icon: <MessageSquare size={14}/>, label: 'General' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as any)}
                    className={`flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      category === cat.id ? 'bg-neo-pink text-white border-neo-pink shadow-pink-glow' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Report Details</span>
              <textarea
                autoFocus
                required
                placeholder="Describe the issue, valuation mismatch, or your idea for improvement..."
                className="w-full bg-white/5 border border-white/10 rounded-[32px] p-6 text-sm font-bold text-white focus:border-neo-pink outline-none min-h-[160px] resize-none transition-all focus:bg-white/10"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="w-full py-6 bg-neo-pink text-white rounded-[24px] text-sm font-black uppercase tracking-widest shadow-pink-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border-t border-white/20 disabled:opacity-30"
            >
              {isSubmitting ? 'Syncing...' : 'Transmit Signal'} <ArrowRight size={18} />
            </button>
            
            <p className="text-[9px] text-center text-gray-600 uppercase font-black tracking-widest">
              Direct Link Established to bakshiaviral993@gmail.com
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;