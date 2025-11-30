import React, { useState } from 'react';
import { Youtube, ArrowRight, Loader2, CheckCircle2, Download, RefreshCw } from 'lucide-react';

const API_URL = 'http://localhost:5000';

const App = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); 
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  const processVideo = async () => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      setErrorMsg('Linku i YouTube nuk është i saktë. Provo përsëri.'); setStatus('error'); return;
    }
    
    setStatus('fetching'); 
    setErrorMsg('');
    setResult(null);

    try {
      let backendUrl = API_URL;
      if (import.meta.env.VITE_API_URL) {
          backendUrl = import.meta.env.VITE_API_URL;
      }

      const response = await fetch(`${backendUrl}/api/get-transcript`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Procesimi dështoi.');
      }

      setResult(data.data);
      setStatus('complete');

    } catch (err) { 
      console.error(err); 
      setStatus('error'); 
      setErrorMsg('Ndodhi një gabim. Sigurohu që video ka titra.'); 
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById('report-content');
    const clone = element.cloneNode(true);
    
    clone.style.boxShadow = 'none';
    clone.style.borderRadius = '0';
    clone.style.padding = '20px';
    clone.style.background = 'white';
    clone.style.maxWidth = '800px'; 
    clone.style.margin = '0 auto';

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px'; 
    container.style.top = '0';
    container.appendChild(clone);
    document.body.appendChild(container);

    const opt = {
      margin: [10, 10, 15, 10], 
      filename: result ? `${result.title}.pdf` : 'dokumenti.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await window.html2pdf().set(opt).from(clone).save();
    } catch (e) {
      console.error("PDF Error:", e);
    } finally {
      document.body.removeChild(container);
    }
  };

  const reset = () => { setStatus('idle'); setResult(null); setUrl(''); };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-[-apple-system,BlinkMacSystemFont,sans-serif] selection:bg-blue-500 selection:text-white">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-white/20 px-6 py-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-2">
          <div className="bg-black text-white p-1.5 rounded-lg">
            <Youtube size={20} strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-lg tracking-tight">VideoAI</span>
        </div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-widest">Për Babin</div>
      </nav>

      <main className="pt-32 pb-20 px-4 max-w-4xl mx-auto flex flex-col items-center">
        
        {/* Input Section */}
        <div className={`w-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${status === 'complete' ? 'opacity-0 h-0 overflow-hidden translate-y-[-20px]' : 'opacity-100 translate-y-0'}`}>
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1D1D1F]">
              Kthe videot në <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">dokumente.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#86868B] max-w-lg mx-auto leading-relaxed">
              Vendos linkun e YouTube dhe lëre AI të krijojë përmbledhjen.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-2 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] border border-white/50 max-w-2xl mx-auto flex flex-col md:flex-row items-center transition-all focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-500/50 gap-2">
            
            <div className="flex items-center w-full">
              <div className="pl-4 md:pl-6 pr-2 text-gray-400">
                <Youtube size={24} />
              </div>
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Ngjit linkun e YouTube..."
                className="flex-1 py-4 md:py-5 text-base md:text-lg bg-transparent border-none outline-none placeholder:text-gray-300 text-[#1D1D1F] w-full"
              />
            </div>
            
            {/* Butoni i Përmirësuar: 100% gjerësi në celular, auto në PC */}
            <button 
              onClick={processVideo}
              disabled={status === 'fetching' || !url}
              className={`w-full md:w-auto m-0 md:m-2 px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-300 shadow-lg flex items-center justify-center gap-2
                ${status === 'fetching' ? 'bg-[#86868B] cursor-wait' : 'bg-[#0071E3] hover:bg-[#0077ED] hover:scale-[1.02] active:scale-[0.98]'}
              `}
            >
              {status === 'fetching' ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <span>Vazhdo</span>
                  <ArrowRight strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>

          {status === 'fetching' && (
            <div className="mt-8 flex flex-col items-center gap-3 text-[#86868B] animate-pulse">
              <div className="h-1 w-32 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#0071E3] w-1/2 animate-[shimmer_1s_infinite]"></div>
              </div>
              <p className="text-sm font-medium">Duke analizuar videon...</p>
            </div>
          )}

          {status === 'error' && (
             <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-center text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
               {errorMsg}
             </div>
          )}
        </div>

        {/* Results Section */}
        {status === 'complete' && result && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-10 duration-700 ease-out fill-mode-forwards">
            
            <div className="sticky top-24 z-40 flex flex-col md:flex-row justify-between items-center bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-white/20 mb-8 max-w-3xl mx-auto gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 text-green-600 p-2 rounded-full">
                  <CheckCircle2 size={20} />
                </div>
                <span className="font-semibold text-sm text-[#1D1D1F]">Gati për eksport</span>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={reset} className="p-2.5 rounded-full text-[#1D1D1F] hover:bg-gray-100 transition-colors md:flex-none flex-1 flex justify-center" title="Fillo nga e para">
                  <RefreshCw size={20} />
                </button>
                <button 
                  onClick={handleDownload}
                  className="bg-[#1D1D1F] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-black transition-all shadow-md flex items-center justify-center gap-2 md:flex-none flex-[3]"
                >
                  <Download size={16} /> Ruaj si PDF
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div id="report-content" className="bg-white rounded-[30px] md:rounded-[40px] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.08)] p-8 md:p-16 max-w-3xl mx-auto text-[#1D1D1F]">
              
              <div className="border-b border-gray-100 pb-10 mb-10 break-inside-avoid">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold tracking-wider uppercase mb-4">
                  Raport i Gjeneruar nga AI
                </span>
                <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-4 tracking-tight">
                  {result.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-[#86868B]">
                  <span>{new Date().toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>Përmbledhje Video</span>
                </div>
              </div>

              <div className="space-y-12">
                {result.sections && result.sections.map((s, i) => (
                  <div key={i} className="group break-inside-avoid page-break-auto">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-3 text-[#1D1D1F]">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-400 text-xs font-bold group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        {i + 1}
                      </span>
                      {s.headline}
                    </h3>
                    <div className="text-[17px] leading-relaxed text-[#424245] pl-11 text-justify">
                      {s.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center text-xs text-[#86868B] font-medium tracking-wide break-inside-avoid">
                <span>Krijuar me ❤️ për Babin</span>
                <span className="opacity-50">VideoAI</span>
              </div>
            </div>
            
            <div className="h-20"></div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
