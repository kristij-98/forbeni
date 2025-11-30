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
      setErrorMsg('Invalid YouTube URL'); setStatus('error'); return;
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
        throw new Error(data.error || 'Processing failed.');
      }

      setResult(data.data);
      setStatus('complete');

    } catch (err) { 
      console.error(err); 
      setStatus('error'); 
      setErrorMsg('Ensure the video has subtitles or API limits are met.'); 
    }
  };

  const handleDownload = () => {
    const element = document.getElementById('report-content');
    const opt = {
      margin: 10,
      filename: result ? `${result.title}.pdf` : 'document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().set(opt).from(element).save();
  };

  const reset = () => { setStatus('idle'); setResult(null); setUrl(''); };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-[-apple-system,BlinkMacSystemFont,sans-serif] selection:bg-blue-500 selection:text-white">
      
      {/* Navbar - Glassmorphism */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-white/20 px-6 py-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-2">
          <div className="bg-black text-white p-1.5 rounded-lg">
            <Youtube size={20} strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-lg tracking-tight">VideoSummarizer</span>
        </div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-widest">For Dad</div>
      </nav>

      <main className="pt-32 pb-20 px-4 max-w-4xl mx-auto flex flex-col items-center">
        
        {/* Hero / Input Section */}
        <div className={`w-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${status === 'complete' ? 'opacity-0 h-0 overflow-hidden translate-y-[-20px]' : 'opacity-100 translate-y-0'}`}>
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[#1D1D1F]">
              Turn videos into <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">beautiful documents.</span>
            </h1>
            <p className="text-xl text-[#86868B] max-w-lg mx-auto leading-relaxed">
              Paste a YouTube link below and let AI create a detailed Albanian summary for you.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-2 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] border border-white/50 max-w-2xl mx-auto flex items-center transition-all focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-500/50">
            <div className="pl-6 pr-4 text-gray-400">
              <Youtube size={24} />
            </div>
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube Link..."
              className="flex-1 py-5 text-lg bg-transparent border-none outline-none placeholder:text-gray-300 text-[#1D1D1F]"
            />
            <button 
              onClick={processVideo}
              disabled={status === 'fetching' || !url}
              className={`m-2 px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-300 shadow-lg flex items-center gap-2
                ${status === 'fetching' ? 'bg-[#86868B] cursor-wait' : 'bg-[#0071E3] hover:bg-[#0077ED] hover:scale-[1.02] active:scale-[0.98]'}
              `}
            >
              {status === 'fetching' ? <Loader2 className="animate-spin" /> : <ArrowRight strokeWidth={2.5} />}
            </button>
          </div>

          {status === 'fetching' && (
            <div className="mt-8 flex flex-col items-center gap-3 text-[#86868B] animate-pulse">
              <div className="h-1 w-32 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#0071E3] w-1/2 animate-[shimmer_1s_infinite]"></div>
              </div>
              <p className="text-sm font-medium">Analyzing video content...</p>
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
            
            {/* Action Bar */}
            <div className="sticky top-24 z-40 flex justify-between items-center bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-white/20 mb-8 max-w-3xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 text-green-600 p-2 rounded-full">
                  <CheckCircle2 size={20} />
                </div>
                <span className="font-semibold text-sm text-[#1D1D1F]">Ready to export</span>
              </div>
              <div className="flex gap-2">
                <button onClick={reset} className="p-2.5 rounded-full text-[#1D1D1F] hover:bg-gray-100 transition-colors" title="Start Over">
                  <RefreshCw size={20} />
                </button>
                <button 
                  onClick={handleDownload}
                  className="bg-[#1D1D1F] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-black transition-all shadow-md flex items-center gap-2"
                >
                  <Download size={16} /> Save as PDF
                </button>
              </div>
            </div>

            {/* The Document */}
            <div id="report-content" className="bg-white rounded-[40px] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.08)] p-12 md:p-16 max-w-3xl mx-auto text-[#1D1D1F]">
              
              <div className="border-b border-gray-100 pb-10 mb-10">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold tracking-wider uppercase mb-4">
                  AI Generated Report
                </span>
                <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4 tracking-tight">
                  {result.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-[#86868B]">
                  <span>{new Date().toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>Video Summary</span>
                </div>
              </div>

              <div className="space-y-12">
                {result.sections && result.sections.map((s, i) => (
                  <div key={i} className="group">
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

              <div className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center text-xs text-[#86868B] font-medium tracking-wide">
                <span>Created with ❤️ for Dad</span>
                <span className="opacity-50">VideoSummarizer AI</span>
              </div>
            </div>
            
            <div className="h-20"></div> {/* Spacer */}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
