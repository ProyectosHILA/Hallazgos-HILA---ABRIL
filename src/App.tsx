import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  MessageSquare, 
  LogOut, 
  Upload, 
  Search, 
  Menu, 
  X, 
  ChevronRight, 
  BrainCircuit, 
  Loader2, 
  RefreshCw, 
  Sliders, 
  SlidersHorizontal,
  Bot, 
  User as UserIcon,
  HelpCircle,
  FileText,
  AlertCircle,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

// --- Interfaces ---
interface User {
  username: string;
  area: string;
  role?: string;
}

// Credenciales y procesos autorizados
const AUTHORIZED_USERS: Record<string, { area: string; pass: string }> = {
  'CE-001': { area: 'Consulta Externa', pass: 'CE21#' },
  'CE-002': { area: 'Consulta Externa', pass: 'CE21#' },
  'URG-001': { area: 'Urgencias', pass: 'UR22#' },
  'CIR-001': { area: 'Cirugía', pass: 'CI23#' },
  'HOS-001': { area: 'Hospitalización', pass: 'HO24#' },
  'GAF-001': { area: 'Gestión Ambiente Físico', pass: 'AF25#' },
  'GCL-001': { area: 'Gestión Cliente', pass: 'GC26#' },
  'IMG-001': { area: 'Imágenes Diagnósticas', pass: 'ID27#' },
  'LAB-001': { area: 'Laboratorio Clínico', pass: 'LC28#' },
  'SFA-001': { area: 'Servicio Farmacéutico', pass: 'SF29#' },
  'GIN-001': { area: 'Gestión de la Información', pass: 'GI30#' },
  'GCF-001': { area: 'Gestión Contable y Financiera', pass: 'GF31#' },
  'NUT-001': { area: 'Nutrición', pass: 'NU32#' },
  'GRF-001': { area: 'Gestión Recursos Físicos', pass: 'RF33#' },
  'GHU-001': { area: 'Gestión Humana', pass: 'GH34#' },
  // Compatibilidad administrativa
  'proyectos': { area: 'Proyectos HILA', pass: 'Riesgo123-' },
  'Admin1': { area: 'Administración HILA', pass: 'Riesgo123-' },
  'Admin2': { area: 'Administración HILA', pass: 'Riesgo123-' },
};


interface FindingRow {
  id: number;
  descripcion: string;
  proceso: string;
  tipologia: string;
  desc_tipologia: string;
  acto_inseguro: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

// --- Login Component ---
const Login = ({ onLogin, customLogo }: { onLogin: (user: User) => void, customLogo?: string }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const userFound = AUTHORIZED_USERS[cleanUsername];

    if (userFound && userFound.pass === password) {
      onLogin({ username: cleanUsername, area: userFound.area, role: cleanUsername });
    } else {
      setError('Credenciales inválidas o acceso no autorizado');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-8 bg-slate-950 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4 overflow-hidden border border-white/15 relative z-10 backdrop-blur-sm shadow-inner">
            <img 
              src={customLogo || "/logo.png"} 
              alt="Logo Hospital Infantil Los Ángeles" 
              className="w-full h-full object-contain p-2 drop-shadow" 
              onError={(e) => {
                // Fallback in case of broken image
                (e.currentTarget as HTMLImageElement).src = "/logo.png";
              }}
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight relative z-10">Abril</h1>
          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mt-1 relative z-10">Gestión de Hallazgos</p>
          <p className="text-slate-400 text-xs mt-1 relative z-10">Hospital Infantil Los Ángeles</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-semibold border border-rose-100 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</label>
            <input 
              type="text" 
              required
              placeholder="ejemplo: proyectos"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contraseña</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 font-medium"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 hover:scale-[1.01] flex items-center justify-center gap-2"
          >
            Ingresar al Sistema
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// --- App Container ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ia' | 'chat'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Custom logo states and persistence
  const [customLogo, setCustomLogo] = useState<string>('');

  // Dashboard configuration states (adjustable iframe dimensions)
  const [iframeHeight, setIframeHeight] = useState<string>('1250px');
  const [iframeWidth, setIframeWidth] = useState<string>('100%');

  // Spreadsheet and IA states
  const [findings, setFindings] = useState<FindingRow[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string>('');
  
  // Selected finding for AI analysis
  const [selectedFinding, setSelectedFinding] = useState<FindingRow | null>(null);
  const [aiAnalyses, setAiAnalyses] = useState<Record<number, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Search & Filter state for Findings table
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProceso, setFilterProceso] = useState('');
  const [filterTipologia, setFilterTipologia] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: '¡Hola! Soy el **Asistente de Inteligencia de Abril**. Puedo charlar a detalle sobre los hallazgos cargados de la base de datos institucional, analizar eventos adversos, tipologías, y recomendar planes de acción estratégicos. ¿De qué le gustaría hablar hoy?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLevel, setChatLevel] = useState<'short' | 'medium' | 'detailed'>('medium');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch logo on mount
  const loadLogo = async () => {
    try {
      const response = await fetch('/api/logo');
      if (response.ok) {
        const data = await response.json();
        if (data.logo) {
          setCustomLogo(data.logo);
          localStorage.setItem('hila_custom_logo', data.logo);
          return;
        }
      }
    } catch (e) {
      console.error("Error fetching logo from API:", e);
    }
    const localLogo = localStorage.getItem('hila_custom_logo');
    if (localLogo) {
      setCustomLogo(localLogo);
    }
  };

  // Fetch spreadsheet on mount/login
  const loadSpreadsheet = async () => {
    setIsDataLoading(true);
    setDataError('');
    try {
      const response = await fetch('/api/spreadsheet');
      if (response.ok) {
        const resData = await response.json();
        if (resData.success && resData.data) {
          setFindings(resData.data);
          // Set initial row as selected if available
          if (resData.data.length > 0) {
            setSelectedFinding(resData.data[0]);
          }
        } else {
          setDataError('No se recibieron datos de la hoja institucional.');
        }
      } else {
        setDataError('Ocurrió un error al cargar la base de datos de Google Sheets.');
      }
    } catch (e) {
      console.error("Error fetching spreadsheet:", e);
      setDataError('No se pudo conectar con el servidor para extraer la base de datos.');
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    loadLogo();
  }, []);

  useEffect(() => {
    if (user) {
      loadSpreadsheet();
    }
  }, [user]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Logo upload and reset
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      if (!base64String) return;

      setCustomLogo(base64String);
      localStorage.setItem('hila_custom_logo', base64String);

      try {
        await fetch('/api/logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logo: base64String }),
        });
      } catch (err) {
        console.error("Error saving logo to server:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoReset = async () => {
    setCustomLogo('');
    localStorage.removeItem('hila_custom_logo');
    try {
      await fetch('/api/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: '' }),
      });
    } catch (err) {
      console.error("Error resetting logo on server:", err);
    }
  };

  // Filter & Search computation
  const filteredFindings = useMemo(() => {
    return findings.filter(row => {
      const matchesSearch = 
        (row.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.proceso || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.tipologia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.desc_tipologia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.acto_inseguro || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProceso = filterProceso === '' || row.proceso === filterProceso;
      const matchesTipologia = filterTipologia === '' || row.tipologia === filterTipologia;

      return matchesSearch && matchesProceso && matchesTipologia;
    });
  }, [findings, searchTerm, filterProceso, filterTipologia]);

  // Paginated findings
  const paginatedFindings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFindings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFindings, currentPage]);

  const totalPages = Math.ceil(filteredFindings.length / itemsPerPage);

  // Unique lists for filtering dropdowns
  const uniqueProcesos = useMemo(() => {
    return [...new Set(findings.map(f => f.proceso).filter(Boolean))];
  }, [findings]);

  const uniqueTipologias = useMemo(() => {
    return [...new Set(findings.map(f => f.tipologia).filter(Boolean))];
  }, [findings]);

  // Request finding audit analysis from server
  const handleAnalyzeFinding = async (finding: FindingRow) => {
    if (aiAnalyses[finding.id]) {
      // Already cached
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finding, allFindings: findings })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analysis) {
          setAiAnalyses(prev => ({ ...prev, [finding.id]: data.analysis }));
        }
      }
    } catch (err) {
      console.error("Error fetching AI analysis:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-analyze when active tab is 'ia' and a row is selected
  useEffect(() => {
    if (activeTab === 'ia' && selectedFinding) {
      handleAnalyzeFinding(selectedFinding);
    }
  }, [selectedFinding, activeTab]);

  // Send message to Chatbot
  const handleSendChatMessage = async (msgText: string) => {
    if (!msgText.trim() || isChatLoading) return;

    const userMsgId = 'msg-' + Date.now();
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: msgText
    };

    setChatMessages(prev => [...prev, newUserMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Simple history context conversion
      const historyContext = chatMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, text: m.text }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgText,
          history: historyContext,
          level: chatLevel,
          allFindings: findings
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success && resData.text) {
          const assistantMsg: ChatMessage = {
            id: 'msg-' + Date.now() + '-assistant',
            role: 'assistant',
            text: resData.text
          };
          setChatMessages(prev => [...prev, assistantMsg]);
        } else {
          throw new Error();
        }
      } else {
        throw new Error();
      }
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: 'msg-error-' + Date.now(),
        role: 'assistant',
        text: 'Lo lamento, ocurrió un error temporal al procesar su solicitud de chatbot. Por favor intente de nuevo en un momento.'
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (!user) return <Login onLogin={setUser} customLogo={customLogo} />;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-slate-900 text-white flex flex-col sticky top-0 h-screen z-50 overflow-hidden shrink-0 border-r border-slate-800"
      >
        <div className="p-5 flex items-center gap-3 border-b border-slate-800 h-20">
          <div className="min-w-[40px] w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden border border-white/15 shrink-0">
            <img 
              src={customLogo || "/logo.png"} 
              alt="Logo Hospital Infantil Los Ángeles" 
              className="w-full h-full object-contain p-1 drop-shadow-sm" 
            />
          </div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
              <h2 className="font-black text-base tracking-tight leading-none text-white">Abril</h2>
              <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold mt-1 truncate">Gestión de Hallazgos</p>
            </motion.div>
          )}
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
              activeTab === 'dashboard' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Dashboard Global</span>}
          </button>

          <button
            onClick={() => setActiveTab('ia')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
              activeTab === 'ia' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <BrainCircuit className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Análisis con IA</span>}
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
              activeTab === 'chat' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Asistente IA (Chat)</span>}
          </button>
        </nav>

        {/* Custom Logo Manager & Session */}
        <div className="p-4 border-t border-slate-800 space-y-4">
          {isSidebarOpen && (
            <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/60 space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logo Institucional</h4>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Cambiar
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
                {customLogo && (
                  <button 
                    onClick={handleLogoReset}
                    className="p-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 rounded-lg transition-colors text-xs"
                    title="Restablecer logo predeterminado"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 border border-indigo-500/10 uppercase">
              {user.area ? user.area.slice(0, 2).toUpperCase() : user.username.slice(0, 2)}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold truncate text-white" title={user.area}>{user.area}</p>
                <p className="text-[10px] text-slate-400 truncate font-mono">{user.username}</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => setUser(null)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all font-semibold text-xs"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {isSidebarOpen && <span>Cerrar Sesión</span>}
          </button>
          {isSidebarOpen ? (
            <div className="pt-2 text-center border-t border-slate-800/80">
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                creado por: <span className="text-slate-300 font-semibold">Proyectos HILA</span>
              </p>
            </div>
          ) : (
            <div className="pt-2 text-center" title="creado por: Proyectos HILA">
              <span className="text-[9px] text-slate-500 font-bold block">HILA</span>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-40 h-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-xl font-black text-slate-900 tracking-tight capitalize">
              {activeTab === 'dashboard' ? 'Dashboard Global' : activeTab === 'ia' ? 'Análisis con IA' : 'Asistente IA Chatbot'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Hospital Infantil Los Ángeles
            </span>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* 1. VIEW DASHBOARD GLOBAL */}
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5 text-indigo-500" />
                      Tablero de Auditoría de Hallazgos
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Información interactiva en tiempo real sobre incidentes, procesos, y tipologías hospitalarias.
                    </p>
                  </div>
                  
                  {/* Iframe size controls */}
                  <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200 self-start md:self-auto shrink-0">
                    <div className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-500">Alto:</span>
                      <select 
                        value={iframeHeight} 
                        onChange={(e) => setIframeHeight(e.target.value)}
                        className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="600px">600 px (Móvil)</option>
                        <option value="900px">900 px (Medio)</option>
                        <option value="1250px">1250 px (Predeterminado)</option>
                        <option value="1600px">1600 px (Completo)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-500">Ancho:</span>
                      <select 
                        value={iframeWidth} 
                        onChange={(e) => setIframeWidth(e.target.value)}
                        className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="100%">100% (Pantalla completa)</option>
                        <option value="90%">90% (Ancho mediano)</option>
                        <option value="80%">80% (Compacto)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center transition-all duration-300">
                  <div 
                    style={{ width: iframeWidth, height: iframeHeight }} 
                    className="bg-white rounded-[32px] overflow-hidden border border-slate-200 shadow-md transition-all duration-300"
                  >
                    <iframe 
                      src="https://datastudio.google.com/embed/reporting/45de1bae-a431-417a-be1b-de33faa2a326/page/p_viamxj454d" 
                      frameBorder="0" 
                      style={{ border: 0, width: "100%", height: "100%" }} 
                      allowFullScreen 
                      sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. VIEW ANALISIS CON IA */}
            {activeTab === 'ia' && (
              <motion.div 
                key="ia"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-500" />
                    Auditor de Hallazgos con IA
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Análisis clínico y organizacional riguroso limitado estrictamente a la matriz de auditoría HILA. No hay alucinaciones de IA.
                  </p>
                </div>

                {isDataLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-slate-500 text-sm font-semibold">Cargando base de datos de hallazgos HILA...</p>
                  </div>
                ) : dataError ? (
                  <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                    <p className="text-rose-700 font-bold text-sm">{dataError}</p>
                    <button 
                      onClick={loadSpreadsheet} 
                      className="mt-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                    >
                      Reintentar Carga
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    {/* Left: Table of Findings (7 columns / details) */}
                    <div className="xl:col-span-7 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
                        <div className="flex flex-col md:flex-row gap-3">
                          {/* Search bar */}
                          <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                            <input 
                              type="text" 
                              placeholder="Buscar hallazgos por descripción, tipología o área..."
                              value={searchTerm}
                              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700"
                            />
                          </div>

                          {/* Process selector */}
                          <div className="w-full md:w-48">
                            <select 
                              value={filterProceso}
                              onChange={(e) => { setFilterProceso(e.target.value); setCurrentPage(1); }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Todos los Procesos</option>
                              {uniqueProcesos.map((p, index) => (
                                <option key={index} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>

                          {/* Typology selector */}
                          <div className="w-full md:w-48">
                            <select 
                              value={filterTipologia}
                              onChange={(e) => { setFilterTipologia(e.target.value); setCurrentPage(1); }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Todas las Tipologías</option>
                              {uniqueTipologias.map((t, index) => (
                                <option key={index} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                          <span>Se encontraron {filteredFindings.length} hallazgos</span>
                          {filteredFindings.length > 0 && (
                            <span>Página {currentPage} de {totalPages || 1}</span>
                          )}
                        </div>
                      </div>

                      {/* Spreadsheet Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/20">
                              <th className="py-4 px-6">ID</th>
                              <th className="py-4 px-6 min-w-[200px]">Descripción</th>
                              <th className="py-4 px-6">Proceso/Área</th>
                              <th className="py-4 px-6">Tipología</th>
                              <th className="py-4 px-6">Descripción de Tipología</th>
                              <th className="py-4 px-6">Acto Inseguro</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {paginatedFindings.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="text-center py-12 text-slate-400 font-semibold">
                                  No se encontraron hallazgos con los filtros seleccionados.
                                </td>
                              </tr>
                            ) : (
                              paginatedFindings.map((row) => (
                                <tr 
                                  key={row.id} 
                                  onClick={() => setSelectedFinding(row)}
                                  className={`hover:bg-slate-50/80 cursor-pointer transition-colors relative ${
                                    selectedFinding?.id === row.id 
                                      ? "bg-indigo-50/50 text-indigo-900 border-l-4 border-indigo-600" 
                                      : ""
                                  }`}
                                >
                                  <td className="py-4 px-6 font-bold text-slate-500">{row.id}</td>
                                  <td className="py-4 px-6 font-medium line-clamp-3 max-w-[250px] leading-relaxed mt-1" title={row.descripcion}>
                                    {row.descripcion}
                                  </td>
                                  <td className="py-4 px-6 font-semibold text-slate-700">{row.proceso}</td>
                                  <td className="py-4 px-6 font-semibold">
                                    <span className="bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded-md text-[10px]">
                                      {row.tipologia}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-slate-500 leading-normal line-clamp-3 max-w-[200px]" title={row.desc_tipologia}>
                                    {row.desc_tipologia}
                                  </td>
                                  <td className="py-4 px-6 text-slate-600 font-semibold">
                                    {row.acto_inseguro || '—'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
                          <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                          >
                            Anterior
                          </button>
                          <div className="text-xs font-semibold text-slate-500">
                            Página {currentPage} de {totalPages}
                          </div>
                          <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                          >
                            Siguiente
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right: Capsule Panel for selected row AI Analysis */}
                    <div className="xl:col-span-5 bg-white rounded-[32px] border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col min-h-[550px] relative">
                      {selectedFinding ? (
                        <div className="space-y-6 flex flex-col h-full">
                          {/* Row Details Header */}
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 relative overflow-hidden">
                            <div className="absolute right-3 top-3 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-xl text-[10px] font-black border border-indigo-100">
                              ID: {selectedFinding.id}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hallazgo Seleccionado</span>
                            <p className="text-xs font-bold text-slate-800 line-clamp-2 mt-1 leading-relaxed">
                              {selectedFinding.descripcion}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200/60 text-[10px] font-semibold text-slate-500">
                              <div>
                                <span className="block text-slate-400 text-[9px] uppercase tracking-wider font-bold">Proceso</span>
                                <span className="text-slate-800 font-bold truncate block">{selectedFinding.proceso}</span>
                              </div>
                              <div>
                                <span className="block text-slate-400 text-[9px] uppercase tracking-wider font-bold">Tipología</span>
                                <span className="text-slate-800 font-bold truncate block">{selectedFinding.tipologia}</span>
                              </div>
                            </div>
                          </div>

                          {/* Analysis container */}
                          <div className="flex-1 overflow-y-auto space-y-4 max-h-[600px] pr-1">
                            {isAnalyzing ? (
                              <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                <div className="space-y-1.5 max-w-xs">
                                  <p className="text-sm font-bold text-slate-800 animate-pulse">Generando Auditoría IA...</p>
                                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                    Analizando causas de raíz, correlación con la base histórica, y trazando recomendaciones preventivas para el HILA...
                                  </p>
                                </div>
                              </div>
                            ) : aiAnalyses[selectedFinding.id] ? (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="prose prose-slate prose-xs max-w-none space-y-1 text-slate-700 text-xs leading-relaxed"
                              >
                                <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/60 mb-4 flex items-center gap-2 text-[11px] font-bold text-indigo-800">
                                  <Sparkles className="w-4 h-4 text-indigo-500" />
                                  <span>Informe del Auditor Clínico de Inteligencia Artificial</span>
                                </div>
                                <div className="markdown-body">
                                  <Markdown>{aiAnalyses[selectedFinding.id]}</Markdown>
                                </div>
                              </motion.div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                  <Bot className="w-6 h-6" />
                                </div>
                                <div className="max-w-xs">
                                  <p className="text-sm font-bold text-slate-800">Sin Análisis Generado</p>
                                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                                    Haga clic en el botón de abajo para que el auditor de IA examine este hallazgo, analice el tiempo de ocurrencia y recomiende medidas correctivas.
                                  </p>
                                </div>
                                <button 
                                  onClick={() => handleAnalyzeFinding(selectedFinding)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Generar Análisis IA
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center h-full space-y-4 flex-1">
                          <HelpCircle className="w-12 h-12 text-slate-300" />
                          <div className="max-w-xs">
                            <h4 className="text-sm font-bold text-slate-700">Ningún hallazgo seleccionado</h4>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              Seleccione una fila de la tabla a la izquierda para ver su desglose y activar el análisis del auditor de IA.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. VIEW CHATBOT */}
            {activeTab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Header card with detail control */}
                <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-indigo-500" />
                      Asistente de Auditoría HILA
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Chat directo con la IA sobre tipologías, eventos adversos y recomendaciones hospitalarias.
                    </p>
                  </div>

                  {/* Chat detail selector */}
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 self-start md:self-auto shrink-0">
                    <span className="text-xs font-bold text-slate-500 px-1">Charlar a nivel:</span>
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'short', label: 'Corta ⏱️' },
                        { id: 'medium', label: 'Mediana 📊' },
                        { id: 'detailed', label: 'Detallada 🧠' }
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          onClick={() => setChatLevel(lvl.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            chatLevel === lvl.id 
                              ? "bg-white text-slate-950 shadow-sm border border-slate-200" 
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chat Panel */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
                  {/* Messages container */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/30">
                    {chatMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex gap-4 max-w-[85%] ${
                          msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                          msg.role === 'user' 
                            ? "bg-indigo-600 border-indigo-500 text-white" 
                            : "bg-white border-slate-200 text-slate-800"
                        }`}>
                          {msg.role === 'user' ? (
                            <UserIcon className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4 text-indigo-500" />
                          )}
                        </div>

                        {/* Speech Bubble */}
                        <div className={`p-4 rounded-[22px] text-xs leading-relaxed space-y-2 border shadow-sm ${
                          msg.role === 'user' 
                            ? "bg-indigo-600 border-indigo-500 text-white rounded-tr-none" 
                            : "bg-white border-slate-200 text-slate-800 rounded-tl-none"
                        }`}>
                          {msg.role === 'user' ? (
                            <p className="font-semibold whitespace-pre-wrap">{msg.text}</p>
                          ) : (
                            <div className="prose prose-slate prose-xs max-w-none text-slate-700 leading-relaxed markdown-body">
                              <Markdown>{msg.text}</Markdown>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isChatLoading && (
                      <div className="flex gap-4 max-w-[85%] mr-auto items-center">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                          <Bot className="w-4 h-4 text-indigo-500 animate-bounce" />
                        </div>
                        <div className="bg-white border border-slate-200 px-4 py-3 rounded-[22px] rounded-tl-none flex items-center gap-2 shadow-sm">
                          <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                          <span className="text-xs font-semibold text-slate-400">Analizando base de hallazgos HILA...</span>
                        </div>
                      </div>
                    )}
                    
                    <div ref={chatEndRef} />
                  </div>

                  {/* Suggestion Chips */}
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Sugerencias:</span>
                    {[
                      { text: "🎯 ¿Cuáles son los hallazgos más recurrentes?", label: "Hallazgos Recurrentes" },
                      { text: "⚠️ ¿Qué eventos adversos o actos inseguros críticos identificas?", label: "Eventos Adversos" },
                      { text: "📂 Explícame las tipologías comunes en los hallazgos.", label: "Tipologías Comunes" },
                      { text: "💡 Dame sugerencias de mejora para la gestión del HILA.", label: "Mejoras HILA" }
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        disabled={isChatLoading}
                        onClick={() => handleSendChatMessage(chip.text)}
                        className="bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-40"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Input form */}
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(chatInput); }}
                    className="p-4 bg-white border-t border-slate-200 flex gap-3 items-center"
                  >
                    <input 
                      type="text" 
                      placeholder="Pregunte a la IA sobre riesgos, áreas críticas o recomendaciones..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isChatLoading}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-700 disabled:opacity-50"
                    />
                    <button 
                      type="submit"
                      disabled={!chatInput.trim() || isChatLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-100 hover:scale-[1.01] flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <span>Preguntar</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
