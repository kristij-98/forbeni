import React, { useState, useEffect } from 'react';
import { Youtube, ArrowRight, Loader2, CheckCircle2, Download, RefreshCw, Quote, ArrowLeft, Sparkles, BookOpen } from 'lucide-react';

const API_URL = 'http://localhost:5000';

// --- KOMPONENTI: KARTA E ZGJEDHJES ---
const MenuCard = ({ title, desc, icon: Icon, onClick, color }) => (
  <button 
    onClick={onClick}
    className="group relative overflow-hidden bg-white p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 text-left w-full h-full flex flex-col justify-between min-h-[240px]"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-150`}></div>
    
    <div className={`w-14 h-14 rounded-2xl bg-${color}-100 flex items-center justify-center text-${color}-600 mb-6 group-hover:scale-110 transition-transform duration-300`}>
      <Icon size={28} strokeWidth={2.5} />
    </div>
    
    <div>
      <h3 className="text-2xl font-bold text-[#1D1D1F] mb-2">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>

    <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-gray-400 group-hover:text-[#1D1D1F] transition-colors">
      <span>Fillo tani</span>
      <ArrowRight size={16} />
    </div>
  </button>
);

// --- KOMPONENTI: GJETESI I SHPREHJES ---
const QuoteGenerator = ({ onBack }) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);

  const getQuote = async () => {
    setLoading(true);
    try {
      let backendUrl = API_URL;
      if (import.meta.env.VITE_API_URL) backendUrl = import.meta.env.VITE_API_URL;
      
      const res = await fetch(`${backendUrl}/api/daily-quote`);
      const data = await res.json();
      if (data.success) setQuote(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Merr shprehjen sa hapet faqja
  useEffect(() => { getQuote(); }, []);

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-medium">
        <ArrowLeft size={20} /> Kthehu te menuja
      </button>

      <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl border border-gray-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
        
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-purple-600" size={40} />
            <p className="text-gray-400 animate-pulse">Duke kërkuar mençuri...</p>
          </div>
        ) : quote ? (
          <>
            <div className="mb-8 flex justify-center">
              <div className="bg-purple-50 p-4 rounded-full text-purple-600">
                <Quote size={32} />
              </div>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-[#1D1D1F] mb-6 leading-tight font-serif italic">
              "{quote.quote}"
            </h2>
            <div className="w-16 h-1 bg-purple-100 mx-auto mb-6 rounded-full"></div>
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-widest mb-2">{quote.author}</h3>
            <p className="text-gray-500 text-sm font-medium bg-gray-50 inline-block px-4 py-2 rounded-xl">
              💡 {quote.context}
            </p>
            <div className="mt-10">
              <button onClick={getQuote} className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-all flex items-center gap-2 mx-auto">
                <Sparkles size={18} />
                Shprehje tjetër
              </button>
            </div>
          </>
        ) : (
          <div className="py-10 text-red-500">Pati një problem. Provo përsëri.</div>
        )}
      </div>
    </div>
  );
};

// --- KOMPONENTI: PERKTHYESI I VIDEOS (I VJETRI) ---
const VideoTranslator = ({ onBack }) => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); 
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  const processVideo = async () => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      setErrorMsg('Linku i YouTube nuk është i saktë.'); setStatus('error'); return;
    }
    setStatus('fetching'); setErrorMsg(''); setResult(null);

    try {
      let backendUrl = API_URL;
      if (import.meta.env.VITE_API_URL) backendUrl = import.meta.env.VITE_API_URL;

      const response = await fetch(`${backendUrl}/api/get-transcript`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data); setStatus('complete');
    } catch (err) { 
      setStatus('error'); setErrorMsg('Ndodhi një gabim. Sigurohu që video ka titra.'); 
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById('report-content');
    const clone = element.cloneNode(true);
    clone.style.boxShadow = 'none'; clone.style.padding = '20px'; clone.style.maxWidth = '800px'; clone.style.margin = '0 auto';
    
    const opt = {
      margin: [10, 10, 15, 10], 
      filename: result ? `${result.title}.pdf` : 'dokumenti.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    await window.html2pdf().set(opt).from(clone).save();
  };

  const reset = () => { setStatus('idle'); setResult(null); setUrl(''); };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-medium">
        <ArrowLeft size={20} /> Kthehu te menuja
      </button>

      <div className={`w-full transition-all duration-700 ${status === 'complete' ? 'hidden' : 'block'}`}>
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1D1D1F]">
            Përkthe <span className="text-blue-600">Video</span>
          </h1>
          <p className="text-lg text-[#86868B]">Ngjit linkun e YouTube dhe krijo dokumentin.</p>
        </div>

        <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-200 max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-2">
          <div className="flex items-center w-full">
            <div className="pl-6 pr-2 text-gray-400"><Youtube size={24} /></div>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Linku këtu..." className="flex-1 py-4 text-lg outline-none text-[#1D1D1F] w-full" />
          </div>
          <button onClick={processVideo} disabled={status === 'fetching' || !url} className="w-full md:w-auto px-8 py-4 rounded-2xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all flex justify-center gap-2">
            {status === 'fetching' ? <Loader2 className="animate-spin" /> : <span>Vazhdo</span>}
          </button>
        </div>
        {status === 'error' && <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-2xl text-center">{errorMsg}</div>}
      </div>

      {status === 'complete' && result && (
        <div className="w-full">
          <div className="sticky top-24 z-40 flex justify-between items-center bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center gap-3 font-semibold text-sm"><CheckCircle2 size={20} className="text-green-600" /> Gati</div>
            <div className="flex gap-2">
              <button onClick={reset} className="p-2.5 rounded-full hover:bg-gray-100"><RefreshCw size={20} /></button>
              <button onClick={handleDownload} className="bg-black text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2"><Download size={16} /> Ruaj PDF</button>
            </div>
          </div>
          <div id="report-content" className="bg-white rounded-[40px] shadow-sm p-12 md:p-16 text-[#1D1D1F]">
            <h1 className="text-3xl font-bold mb-4">{result.title}</h1>
            <div className="space-y-8">{result.sections.map((s, i) => (<div key={i}><h3 className="text-xl font-bold mb-2">{s.headline}</h3><div className="text-lg text-gray-600 leading-relaxed text-justify">{s.content}</div></div>))}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- APLIKACIONI KRYESOR ---
const App = () => {
  // 'home', 'video', 'quote'
  const [view, setView] = useState('home');

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-[-apple-system,BlinkMacSystemFont,sans-serif]">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-white/20 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl">A</div>
          <span className="font-semibold text-lg tracking-tight">Përshëndetje Arben</span>
        </div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-widest">Versioni 2.0</div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        {view === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-[#1D1D1F]">Çfarë do të bësh sot?</h1>
            <p className="text-xl text-gray-500 mb-12">Zgjidh një nga opsionet më poshtë.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <MenuCard 
                title="Përkthe Video" 
                desc="Kthe videot e YouTube në dokumente të lexueshme në shqip."
                icon={Youtube}
                color="blue"
                onClick={() => setView('video')}
              />
              <MenuCard 
                title="Shprehja e Ditës" 
                desc="Merr motivim ditor nga filozofët më të mëdhenj të historisë."
                icon={BookOpen}
                color="purple"
                onClick={() => setView('quote')}
              />
            </div>
          </div>
        )}

        {view === 'video' && <VideoTranslator onBack={() => setView('home')} />}
        {view === 'quote' && <QuoteGenerator onBack={() => setView('home')} />}
      </main>
    </div>
  );
};

export default App;
