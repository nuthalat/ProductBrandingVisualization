import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Newspaper, 
  Monitor, 
  Instagram, 
  Loader2, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { generateBrandConcept, generateProductImage, type BrandConcept } from './services/geminiService';

type GenerationStatus = 'idle' | 'analyzing' | 'generating' | 'completed' | 'error';

interface Medium {
  key: 'billboard' | 'newspaper' | 'social';
  name: string;
  icon: any;
  aspectRatio: '16:9' | '3:4' | '1:1';
  image: string | null;
  loading: boolean;
}

export default function App() {
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [concept, setConcept] = useState<BrandConcept | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [mediums, setMediums] = useState<Medium[]>([
    { key: 'billboard', name: 'Billboard', icon: Monitor, aspectRatio: '16:9', image: null, loading: false },
    { key: 'newspaper', name: 'Newspaper', icon: Newspaper, aspectRatio: '3:4', image: null, loading: false },
    { key: 'social', name: 'Social Post', icon: Instagram, aspectRatio: '1:1', image: null, loading: false },
  ]);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setStatus('analyzing');
    setErrorMessage(null);
    setConcept(null);
    setMediums(m => m.map(item => ({ ...item, image: null, loading: false })));

    try {
      const newConcept = await generateBrandConcept(description);
      setConcept(newConcept);
      setStatus('generating');

      // Trigger generations in parallel
      const generationPromises = mediums.map(async (medium) => {
        setMediums(prev => prev.map(m => m.key === medium.key ? { ...m, loading: true } : m));
        try {
          const imageUrl = await generateProductImage(newConcept, medium.key, medium.aspectRatio);
          setMediums(prev => prev.map(m => m.key === medium.key ? { ...m, image: imageUrl, loading: false } : m));
        } catch (err) {
          console.error(`Error generating ${medium.key}:`, err);
          setMediums(prev => prev.map(m => m.key === medium.key ? { ...m, loading: false } : m));
        }
      });

      await Promise.all(generationPromises);
      setStatus('completed');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-[#E0E0E0] font-sans selection:bg-accent/30">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-sidebar-bg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
          <h1 className="font-bold text-lg tracking-tight text-white uppercase">Brand Builder</h1>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          <span>Consistency Engine</span>
          <span className="w-1 h-1 bg-border rounded-full" />
          <span>Nano-Banana v2.1</span>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-[320px_1fr] h-[calc(100vh-65px)]">
        {/* Sidebar / Controls */}
        <aside className="border-r border-border p-6 overflow-y-auto bg-sidebar-bg flex flex-col gap-8">
          <section>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2 block">
              Product Definition
            </label>
            <form onSubmit={handleGenerate} className="space-y-4">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product (e.g. minimalist espresso machine...)"
                className="w-full h-40 p-4 bg-card-bg border border-border-light rounded-lg resize-none focus:outline-none focus:border-accent transition-all placeholder:text-gray-600 text-sm leading-relaxed text-gray-300"
                disabled={status === 'analyzing' || status === 'generating'}
              />
              <button
                type="submit"
                disabled={status === 'analyzing' || status === 'generating' || !description.trim()}
                className="w-full bg-white text-black h-12 rounded-lg font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:opacity-90 disabled:bg-border disabled:text-gray-600 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {status === 'analyzing' || status === 'generating' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Visualize Assets</span>
                )}
              </button>
            </form>
          </section>

          <AnimatePresence>
            {concept && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 pt-6 border-t border-border"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1 block">
                    Product Identity
                  </label>
                  <p className="font-bold text-white tracking-tight">{concept.productName}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1 block">
                    Visual Strategy
                  </label>
                  <p className="text-xs text-gray-400 leading-relaxed italic">
                    "{concept.visualIdentity}"
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
                    <span>Detail Density</span>
                    <span className="text-accent">High</span>
                  </div>
                  <div className="h-1 bg-brand-bg rounded-full overflow-hidden">
                    <div className="h-full bg-accent w-[85%] shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {status === 'error' && (
            <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg flex items-start gap-3 mt-auto">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-200 leading-normal font-medium">{errorMessage}</p>
            </div>
          )}
          
          <div className="text-[9px] text-gray-600 mt-auto pt-6 border-t border-border uppercase tracking-widest">
            Project: {concept ? concept.productName.toUpperCase().replace(/\s+/g, '_') : 'IDLE_WAITING'}
          </div>
        </aside>

        {/* Preview Area */}
        <section className="p-8 lg:p-10 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="flex items-end justify-between border-b border-border pb-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Generation Stage</h3>
                <p className="text-white text-xl font-light mt-1 tracking-tight">Medium Imaginaries</p>
              </div>
              <div className="flex gap-2">
                {['Idle', 'Generating', 'Completed'].map((s) => {
                  const isActive = (s === 'Generating' && (status === 'generating' || status === 'analyzing')) || 
                                 (s === 'Completed' && status === 'completed') || 
                                 (s === 'Idle' && status === 'idle');
                  return (
                    <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors ${isActive ? 'border-accent/40 bg-accent/5' : 'border-border bg-sidebar-bg'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-accent animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.8)]' : 'bg-border'}`} />
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-accent' : 'text-gray-600'}`}>{s}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
              {mediums.map((medium, idx) => (
                <motion.div
                  key={medium.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`group relative bg-sidebar-bg border border-border rounded-xl overflow-hidden shadow-2xl ${
                    medium.key === 'billboard' ? 'md:col-span-2 aspect-[16/7]' : 
                    medium.key === 'newspaper' ? 'aspect-[3/4]' : 'aspect-square'
                  }`}
                >
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-brand-bg/80 backdrop-blur px-2.5 py-1 rounded border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                    <medium.icon className="w-3 h-3 text-accent" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white">{medium.name}</span>
                  </div>

                  <div className={`w-full h-full flex items-center justify-center ${medium.key === 'newspaper' && medium.image ? 'bg-[#F5F5F0]' : 'bg-[#151515]'}`}>
                    {medium.loading ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <Loader2 className="w-8 h-8 text-accent animate-spin" />
                          <div className="absolute inset-0 blur-md bg-accent/20 animate-pulse" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Rendering...</span>
                      </div>
                    ) : medium.image ? (
                      <motion.img
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={medium.image}
                        alt={`${medium.name} view`}
                        className={`w-full h-full object-cover transition-all duration-700 ${medium.key === 'newspaper' ? 'grayscale contrast-125' : 'group-hover:scale-105'}`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 opacity-10">
                        <ImageIcon className="w-10 h-10" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Pending</span>
                      </div>
                    )}
                  </div>
                  
                  {medium.image && (
                    <div className="absolute bottom-4 left-4 z-20">
                      <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40 bg-black/40 px-2 py-1 rounded backdrop-blur">
                        0{idx + 1} / {medium.name}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
