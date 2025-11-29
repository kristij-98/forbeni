import React, { useState } from 'react';
import { Youtube, ArrowRight, Loader2, CheckCircle, Download } from 'lucide-react';

const API_URL = 'http://localhost:5000';

const App = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); 
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  const processVideo = async () => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      setErrorMsg('Të lutem vendos një link të saktë YouTube.'); setStatus('error'); return;
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
        throw new Error(data.error || 'Dështoi procesimi.');
      }

      setResult(data.data);
      setStatus('complete');

    } catch (err) { 
      console.error(err); 
      setStatus('error'); 
      setErrorMsg('Sigurohu që video ka titra dhe API Key është OK.'); 
    }
  };

  const handleDownload = () => {
    const element = document.getElementById('report-content');
    const opt = {
      margin: 10,
      filename: result ? `${result.title}.pdf` : 'dokumenti.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().set(opt).from(element).save();
  };

  const reset = () => { setStatus('idle'); setResult(null); setUrl(''); };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <nav className="bg-red-600 text-white p-4 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Youtube className="w-8 h-8" />
          <div><h1 className="text-xl font-bold leading-none">Video në PDF</h1><p className="text-red-100 text-xs mt-1">Për Babin ❤️</p></div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-4 md:p-8">
        
        <div className={`transition-all duration-500 ${status === 'complete' ? 'hidden' : 'block'}`}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Ngjit Linkun e Videos</h2>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full p-5 text-lg border-2 border-slate-200 rounded-xl focus:border-red-500 focus:outline-none" />
            
            <button onClick={processVideo} disabled={status === 'fetching'} className="w-full py-5 rounded-xl text-xl font-bold text-white shadow-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-70 flex items-center justify-center gap-2">
              {status === 'idle' && <>Gjenëro PDF <ArrowRight /></>}
              {status === 'fetching' && <><Loader2 className="animate-spin" /> Duke analizuar...</>}
              {status === 'error' && <>Provo Përsëri</>}
            </button>
            
            {status === 'fetching' && (
              <p className="text-sm text-slate-500 animate-pulse">Kjo mund të zgjasë pak sekonda...</p>
            )}

            {status === 'error' && <p className="text-red-500 bg-red-50 p-3 rounded">{errorMsg}</p>}
          </div>
        </div>

        {status === 'complete' && result && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-slate-900 text-white p-4 rounded-xl mb-8 flex justify-between items-center shadow-lg">
              <span className="font-semibold text-green-400 flex items-center gap-2"><CheckCircle size={20}/> Dokumenti u krijua!</span>
              <div className="flex gap-3">
                <button onClick={reset} className="px-4 py-2 text-slate-300 hover:text-white">Kthehu</button>
                <button onClick={handleDownload} className="bg-white text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-slate-100 flex items-center gap-2">
                  <Download size={18} /> Shkarko PDF
                </button>
              </div>
            </div>
            
            <div id="report-content" className="bg-white shadow-2xl p-12 min-h-[29.7cm] text-slate-900">
              <div className="border-b pb-6 mb-6">
                <h1 className="text-3xl font-extrabold mb-2 text-slate-900">{result.title}</h1>
                <div className="text-slate-500 text-sm">Përmbledhje e detajuar nga AI</div>
              </div>
              
              {result.sections && result.sections.map((s, i) => (
                <div key={i} className="mb-8">
                  <h3 className="text-xl font-bold border-l-4 border-red-500 pl-3 mb-3 text-slate-800">{s.headline}</h3>
                  <div className="text-lg text-slate-700 leading-relaxed whitespace-pre-line text-justify">{s.content}</div>
                </div>
              ))}
              
              <div className="mt-12 pt-6 border-t text-center text-slate-400 text-sm">
                Gjeneruar automatikisht për Babin ❤️
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default App;
