import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Terminal, LogOut, ShieldCheck, ChevronRight, 
  Cpu, Hash, Activity, Check, Copy, AlertTriangle, XCircle 
} from "lucide-react";

// --- TOAST COMPONENT ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  const isError = type === 'error';
  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: 'rgba(0, 0, 0, 0.95)', border: `1px solid ${isError ? '#ff0033' : '#00ff41'}`, padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '12px', color: isError ? '#ff0033' : '#00ff41', fontFamily: '"Courier New", monospace', fontSize: '12px', fontWeight: 'bold', boxShadow: `0 0 20px ${isError ? 'rgba(255, 0, 51, 0.2)' : 'rgba(0, 255, 65, 0.2)'}`, zIndex: 1000, animation: 'slideIn 0.3s ease-out' }}>
      {isError ? <AlertTriangle size={18} /> : <Check size={18} />} <div>{message}</div> <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '10px' }}><XCircle size={14} /></button>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // This is where your logs live. If this stays empty, the list is empty.
  const [history, setHistory] = useState([]); 
  
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });

  // Helper function to add timeout to fetch requests
  const fetchWithTimeout = async (url, options, timeout = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error("Connection timeout - backend server not responding");
      }
      throw error;
    }
  };

  // 1. FETCH HISTORY ON LOAD + POLLING
  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetchWithTimeout('http://localhost:8000/url/codes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data.codes)) {
         setHistory(data.codes);
      } else {
         console.error("Format Error: Expected 'codes' array", data);
      }
    } catch (error) {
      console.error("History fetch error:", error.message);
      showToast("SERVER NOT RESPONDING - START BACKEND", 'error');
    }
  };

  useEffect(() => {
    // initial load
    fetchHistory();

    // poll every 5s to pick up visit-count changes
    const interval = setInterval(() => {
      fetchHistory();
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // 2. CREATE NEW LINK
  const handleShorten = async (e) => {
    e.preventDefault();
    if (!longUrl) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetchWithTimeout('http://localhost:8000/url/shorten', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: longUrl }), 
      }, 15000);

      const data = await response.json();

      if (response.ok) {
        const generatedLink = `http://localhost:8000/${data.shortCode}`;
        setShortUrl(generatedLink);
        
        // Add new item to the top of the list immediately
        const newEntry = { 
            id: data.id,
            shortCode: data.shortCode, 
            targetURL: data.targetURL, 
            visits: 0 // New links start at 0
        };
        setHistory([newEntry, ...history]);
        setLongUrl(""); 
        showToast("ENCRYPTION SUCCESSFUL. LINK GENERATED.");
      } else {
        const errorMessage = data.error?.issues?.[0]?.message || data.error || "Failed to shorten";
        showToast("ERROR: " + errorMessage, 'error');
      }
    } catch (error) {
      console.error("Shorten error:", error);
      if (error.message.includes("timeout")) {
        showToast("CONNECTION TIMEOUT - START BACKEND SERVER", 'error');
      } else {
        showToast("CONNECTION REFUSED - SERVER OFFLINE", 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    showToast("COPIED TO CLIPBOARD");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={styles.pageContainer}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={styles.scanline}></div>
      <div style={styles.gridBackground}></div>

      <div style={styles.window}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={18} color="#00ff41" />
            <span style={styles.logoText}>PROJECT LOKI</span>
          </div>
          <button onClick={handleLogout} style={styles.abortButton}>
            <LogOut size={12} /> ABORT_SESSION
          </button>
        </header>

        <div style={styles.body}>
          {/* LEFT: INPUT */}
          <div style={styles.leftPanel}>
            <div style={styles.bgIcon}><ShieldCheck size={200} /></div>
            <div style={{ position: 'relative', zIndex: 10 }}>
              <h2 style={styles.heading}><ChevronRight size={20} /> INITIALIZE INTERCEPT</h2>
              <p style={styles.subText}>Enter target URL for secure encryption.</p>

              <form onSubmit={handleShorten} style={{ marginTop: '2rem' }}>
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  <span style={styles.inputLabel}>SOURCE:</span>
                  <input type="url" value={longUrl} onChange={(e) => setLongUrl(e.target.value)} placeholder="HTTPS://TARGET-SOURCE..." required style={styles.input} />
                </div>
                <button disabled={loading} style={styles.button}>
                  {loading ? <Cpu size={16} className="animate-spin" /> : <Hash size={16} />}
                  {loading ? "PROCESSING..." : "EXECUTE"}
                </button>
              </form>

              {shortUrl && (
                <div style={styles.resultBox}>
                  <div>
                    <span style={{ fontSize: '10px', opacity: 0.5 }}>GENERATED_ASSET:</span>
                    <div style={styles.resultLink}>{shortUrl}</div>
                  </div>
                  <button onClick={copyToClipboard} style={styles.copyButton}>
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: HISTORY LOGS */}
          <div style={styles.rightPanel}>
            <div style={styles.statsHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00ff41' }}>
                <Activity size={16} /> <span style={{ fontWeight: 'bold' }}>NETWORK_STATS</span>
              </div>
              <div style={{ fontSize: '10px', opacity: 0.7 }}>LATENCY: 12ms</div>
            </div>

            <div style={styles.historyList}>
              {history.length === 0 ? (
                 <div style={{padding:'20px', opacity:0.3, fontSize:'10px'}}>NO_LOGS_FOUND...</div>
               ) : (
                 history.map((item, idx) => (
                     <div key={idx} style={styles.historyItem}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                         <span style={{ fontSize: '10px', opacity: 0.5 }}>LOG_{idx + 1}</span>
                         <span style={styles.hitBadge}>HITS: {item.visits || 0}</span>
                     </div>
                     <div style={{ fontWeight: 'bold', color: '#fff' }}>{`localhost:8000/${item.shortCode}`}</div>
                     <div style={{ fontSize: '10px', opacity: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.targetURL}</div>
                     </div>
                 ))
               )}
            </div>
            <div style={styles.footerStatus}>SECURE CONNECTION ESTABLISHED</div>
          </div>
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .animate-spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// STYLES
const styles = {
  pageContainer: { height: '100vh', width: '100vw', backgroundColor: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace', color: '#00ff41', overflow: 'hidden', position: 'relative' },
  gridBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(0, 255, 65, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.05) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' },
  scanline: { position: 'absolute', top: 0, left: 0, right: 0, height: '100vh', background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2))', backgroundSize: '100% 4px', pointerEvents: 'none', zIndex: 5, opacity: 0.6 },
  window: { width: '1000px', height: '650px', backgroundColor: 'rgba(0, 0, 0, 0.9)', border: '1px solid rgba(0, 255, 65, 0.3)', boxShadow: '0 0 40px rgba(0, 255, 65, 0.15)', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10, borderRadius: '4px', backdropFilter: 'blur(10px)' },
  header: { height: '50px', borderBottom: '1px solid rgba(0, 255, 65, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', backgroundColor: 'rgba(0, 255, 65, 0.05)' },
  logoText: { fontWeight: 'bold', letterSpacing: '2px', textShadow: '0 0 10px rgba(0, 255, 65, 0.5)' },
  abortButton: { background: 'transparent', border: '1px solid rgba(0, 255, 65, 0.3)', color: '#00ff41', padding: '5px 10px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' },
  body: { flex: 1, display: 'flex', overflow: 'hidden' },
  leftPanel: { width: '65%', borderRight: '1px solid rgba(0, 255, 65, 0.2)', padding: '40px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  bgIcon: { position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05, pointerEvents: 'none', color: '#00ff41' },
  heading: { margin: 0, fontSize: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '2px' },
  subText: { margin: '5px 0 0 32px', fontSize: '12px', opacity: 0.6 },
  inputLabel: { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 'bold', color: '#00ff41', opacity: 0.7 },
  input: { width: '100%', padding: '15px 15px 15px 70px', background: '#000', border: '1px solid rgba(0, 255, 65, 0.4)', color: '#00ff41', fontFamily: 'inherit', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  button: { width: '100%', padding: '15px', background: '#00ff41', color: '#000', border: 'none', fontWeight: 'bold', letterSpacing: '3px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' },
  resultBox: { marginTop: '20px', border: '1px solid rgba(0, 255, 65, 0.3)', background: 'rgba(0, 255, 65, 0.05)', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  resultLink: { fontSize: '18px', fontWeight: 'bold', color: '#fff', textShadow: '0 0 10px rgba(0, 255, 65, 0.5)' },
  copyButton: { background: 'none', border: '1px solid rgba(0, 255, 65, 0.3)', color: '#00ff41', padding: '8px', cursor: 'pointer' },
  rightPanel: { width: '35%', background: 'rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'column' },
  statsHeader: { padding: '20px', borderBottom: '1px solid rgba(0, 255, 65, 0.2)', background: 'rgba(0, 255, 65, 0.02)' },
  historyList: { flex: 1, overflowY: 'auto', padding: '20px' },
  historyItem: { padding: '10px', border: '1px solid rgba(0, 255, 65, 0.1)', background: 'rgba(0, 0, 0, 0.5)', marginBottom: '10px', cursor: 'pointer' },
  hitBadge: { fontSize: '9px', background: 'rgba(0, 255, 65, 0.1)', padding: '2px 4px', borderRadius: '2px', color: '#00ff41' },
  footerStatus: { padding: '10px', borderTop: '1px solid rgba(0, 255, 65, 0.2)', fontSize: '10px', opacity: 0.5, textAlign: 'center', background: 'rgba(0, 255, 65, 0.05)' }
};
