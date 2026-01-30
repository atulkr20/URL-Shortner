import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, User, Mail, Lock, ChevronRight, Cpu, ArrowRight, ShieldCheck, AlertTriangle, Check, XCircle } from 'lucide-react';

// --- CUSTOM TOAST COMPONENT ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  const isError = type === 'error';
  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: 'rgba(0, 0, 0, 0.95)', border: `1px solid ${isError ? '#ff0033' : '#00ff41'}`, padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '12px', color: isError ? '#ff0033' : '#00ff41', fontFamily: '"Courier New", monospace', fontSize: '12px', fontWeight: 'bold', boxShadow: `0 0 20px ${isError ? 'rgba(255, 0, 51, 0.2)' : 'rgba(0, 255, 65, 0.2)'}`, zIndex: 1000, animation: 'slideIn 0.3s ease-out' }}>
      {isError ? <AlertTriangle size={18} /> : <Check size={18} />} <div>{message}</div> <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '10px' }}><XCircle size={14} /></button>
    </div>
  );
};

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    const nameParts = formData.username.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    const payload = { firstName, lastName, email: formData.email, password: formData.password };

    try {
      const response = await fetch('http://localhost:8000/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("IDENTITY NODE CREATED. REDIRECTING...");
        setTimeout(() => navigate('/login'), 1500);
      } else {
        showToast(data.error || "REGISTRATION FAILED", 'error');
      }
    } catch (error) {
      showToast("CONNECTION REFUSED: SERVER OFFLINE", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={styles.scanline}></div>
      <div style={styles.gridBackground}></div>
      
      <div style={styles.brandingSection}>
        <div style={styles.logoBox}><Terminal size={40} color="#00ff41" /></div>
        <h1 style={styles.mainTitle}>PROJECT LOKI</h1>
        <p style={styles.subTitle}>AUTHENTICATION_GATEWAY_V2.0.4</p>
      </div>

      <div style={styles.window}>
        <div style={styles.cardHeader}>
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <ChevronRight size={20} color="#00ff41" />
                <span style={styles.cardTitle}>INITIALIZE_NEW_ENTITY</span>
            </div>
            <ShieldCheck size={24} color="#00ff41" style={{opacity: 0.2}} />
        </div>

        <form onSubmit={handleSignup} style={styles.form}>
            <div style={styles.inputContainer}><div style={styles.iconLabel}><User size={14} /><span>USR:</span></div><input name="username" value={formData.username} onChange={handleChange} type="text" placeholder="IDENTITY_HANDLE" required style={styles.input} /></div>
            <div style={styles.inputContainer}><div style={styles.iconLabel}><Mail size={14} /><span>EML:</span></div><input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="COMM_CHANNEL@ADDR.NET" required style={styles.input} /></div>
            <div style={styles.inputContainer}><div style={styles.iconLabel}><Lock size={14} /><span>PWD:</span></div><input name="password" value={formData.password} onChange={handleChange} type="password" placeholder="••••••••••••" required style={styles.input} /></div>
            <button disabled={loading} style={styles.button}>{loading ? <Cpu size={16} className="animate-spin" /> : <ArrowRight size={16} />}{loading ? "INITIALIZING..." : "CREATE_IDENTITY_NODE"}</button>
        </form>
      </div>
      
      <div style={styles.footer}><span>ALREADY OPERATIONAL?</span><Link to="/login" style={styles.link}>LOGIN SEQUENCE</Link></div>
      <style>{`@keyframes slideIn { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .animate-spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// STYLES (Kept exactly same)
const styles = {
  pageContainer: { height: '100vh', width: '100vw', backgroundColor: '#020202', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace', color: '#00ff41', overflow: 'hidden', position: 'relative' },
  gridBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' },
  scanline: { position: 'absolute', top: 0, left: 0, right: 0, height: '100vh', background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1))', backgroundSize: '100% 3px', pointerEvents: 'none', zIndex: 5, opacity: 0.3 },
  brandingSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px', zIndex: 10 },
  logoBox: { width: '80px', height: '80px', border: '2px solid #00ff41', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 255, 65, 0.2)', marginBottom: '20px', backgroundColor: 'rgba(0, 20, 0, 0.5)' },
  mainTitle: { fontSize: '32px', fontWeight: 'bold', letterSpacing: '5px', margin: '0 0 10px 0', textShadow: '0 0 15px rgba(0, 255, 65, 0.6)', color: '#fff' },
  subTitle: { fontSize: '10px', letterSpacing: '3px', opacity: 0.6, margin: 0 },
  window: { width: '500px', border: '1px solid rgba(0, 255, 65, 0.5)', boxShadow: '0 0 30px rgba(0, 255, 65, 0.05)', backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)', zIndex: 10, padding: '30px', position: 'relative' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid rgba(0, 255, 65, 0.2)', paddingBottom: '15px' },
  cardTitle: { fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px', color: '#00ff41' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputContainer: { display: 'flex', alignItems: 'center', border: '1px solid rgba(0, 255, 65, 0.3)', backgroundColor: 'rgba(0, 20, 0, 0.2)', padding: '0 15px', height: '50px', transition: 'border 0.3s ease' },
  iconLabel: { display: 'flex', alignItems: 'center', gap: '8px', width: '80px', fontSize: '12px', fontWeight: 'bold', opacity: 0.8, borderRight: '1px solid rgba(0, 255, 65, 0.2)', marginRight: '15px', height: '60%' },
  input: { flex: 1, background: 'transparent', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: '14px', outline: 'none', letterSpacing: '1px', textTransform: 'uppercase' },
  button: { marginTop: '10px', height: '50px', background: 'transparent', color: '#00ff41', border: '1px solid #00ff41', fontWeight: 'bold', letterSpacing: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', transition: 'all 0.2s' },
  footer: { marginTop: '30px', fontSize: '10px', opacity: 0.5, zIndex: 10, display: 'flex', gap: '10px' },
  link: { color: '#00ff41', textDecoration: 'none', fontWeight: 'bold', borderBottom: '1px solid rgba(0, 255, 65, 0.3)' }
};