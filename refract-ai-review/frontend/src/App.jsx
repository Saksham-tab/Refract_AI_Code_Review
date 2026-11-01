import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Command,
  History,
  LayoutDashboard,
  LoaderCircle,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { api } from './api.js';

const LazyWorkspace = lazy(() => import('./components/ReviewWorkspace.jsx'));
const LazyHistory = lazy(() => import('./components/ReviewHistory.jsx'));

function ScreenFallback() {
  return <div className="screen-fallback"><LoaderCircle size={18} className="spin" /> Preparing workspace…</div>;
}

function Toast({ message, onClose }) {
  return (
    <motion.div className="toast" initial={{ opacity: 0, y: 12, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 10, x: '-50%' }} transition={{ duration: 0.2 }} role="status">
      <CheckCircle2 size={15} /><span>{message}</span><button onClick={onClose} aria-label="Dismiss notification"><X size={13} /></button>
    </motion.div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState('workspace');
  const [code, setCode] = useState('');
  const [filename, setFilename] = useState('snippet.py');
  const [language, setLanguage] = useState('python');
  const [review, setReview] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [health, setHealth] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3200);
  }, []);

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await api.history();
      setReviews(data.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      setHealth(await api.health());
    } catch {
      setHealth({ status: 'offline', ollama_connected: false, model: null });
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    refreshHistory();
    return () => window.clearTimeout(toastTimer.current);
  }, [refreshHealth, refreshHistory]);

  useEffect(() => {
    const handleNavigationShortcut = (event) => {
      if (!(event.metaKey || event.ctrlKey) || !['1', '2'].includes(event.key)) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      event.preventDefault();
      if (event.key === '1') setActiveView('workspace');
      if (event.key === '2') { setActiveView('history'); refreshHistory(); }
    };
    window.addEventListener('keydown', handleNavigationShortcut);
    return () => window.removeEventListener('keydown', handleNavigationShortcut);
  }, [refreshHistory]);

  const handleReview = useCallback(async (focus = 'balanced') => {
    if (!code.trim() || isReviewing) return;
    setIsReviewing(true);
    setActiveView('workspace');
    try {
      const result = await api.review({ code, filename, language, focus });
      setReview(result);
      notify(`${result.metrics?.total_findings ?? result.findings?.length ?? 0} findings returned · review saved`);
      refreshHistory();
      refreshHealth();
    } catch (error) {
      notify(error.message || 'Review failed. Check that Ollama is running and the Qwen model is installed.');
    } finally {
      setIsReviewing(false);
    }
  }, [code, filename, language, isReviewing, notify, refreshHistory, refreshHealth]);

  const openReview = useCallback(async (item) => {
    try {
      const fullReview = await api.reviewById(item.id);
      setReview(fullReview);
      setCode(fullReview.code || '');
      setFilename(fullReview.filename || 'snippet.py');
      setLanguage(fullReview.language || 'python');
      setActiveView('workspace');
      notify('Saved review opened in the workspace.');
    } catch (error) {
      notify(error.message || 'Unable to open this review.');
    }
  }, [notify]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><span /><span /><span /></div>
          <div><strong>refract<span>.</span></strong><small>AI CODE REVIEW</small></div>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Primary navigation">
          <button className={activeView === 'workspace' ? 'active' : ''} onClick={() => setActiveView('workspace')}>
            <LayoutDashboard size={16} /><span>Code workspace</span><span className="nav-shortcut"><Command size={10} /> 1</span>
          </button>
          <button className={activeView === 'history' ? 'active' : ''} onClick={() => { setActiveView('history'); refreshHistory(); }}>
            <History size={16} /><span>Review history</span>{reviews.length > 0 && <span className="nav-count">{reviews.length}</span>}
          </button>
        </nav>

        <div className="sidebar-divider" />
        <div className="sidebar-section-label">YOUR WORKFLOW</div>
        <div className="workflow-card">
          <div className="workflow-icon"><ShieldCheck size={16} /></div>
          <div><strong>Quality gate</strong><span>Catch issues before merge</span></div>
          <span className="workflow-pulse" />
        </div>

        <div className="sidebar-bottom">
          <div className="model-card">
            <div className="model-card-top"><span className="model-symbol">QW</span><span className="model-provider">LOCAL OLLAMA</span><span className={`connection-dot ${health?.ollama_connected ? 'online' : 'offline'}`} /></div>
            <strong>{health?.model || 'qwen2.5-coder:1.5b'}</strong>
            <span>{health?.ollama_connected ? 'Model service connected' : 'Ollama required to run reviews'}</span>
            <button className="model-doc-link" onClick={() => window.open('https://ollama.com/library/qwen2.5-coder', '_blank', 'noopener,noreferrer')}>Model details <ArrowUpRight size={11} /></button>
          </div>
          <div className="sidebar-user"><div className="user-avatar">SD</div><div><strong>Local workspace</strong><span>Personal instance</span></div><button className="icon-button compact" title="Workspace details" onClick={() => notify('Refract is running as a local workspace.')}><Settings2 size={15} /></button></div>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-left"><span className="topbar-context">Personal workspace</span><span className="topbar-slash">/</span><strong>{activeView === 'workspace' ? 'Code review' : 'Activity'}</strong></div>
          <div className="topbar-right">
            <div className={`api-status ${health?.status === 'ok' ? 'connected' : 'disconnected'}`}><span className="api-status-light" /><span>{health?.status === 'ok' ? 'API online' : 'API offline'}</span></div>
            <span className="topbar-divider" />
            <div className="topbar-avatar">SD</div>
          </div>
        </header>

        <div className="content-scroll">
          <AnimatePresence mode="wait">
            {activeView === 'workspace' ? (
              <Suspense fallback={<ScreenFallback />} key="workspace">
                <LazyWorkspace
                  code={code} setCode={setCode}
                  filename={filename} setFilename={setFilename}
                  language={language} setLanguage={setLanguage}
                  review={review} isReviewing={isReviewing}
                  onReview={handleReview} health={health}
                  onToast={notify} onReviewLoaded={setReview}
                />
              </Suspense>
            ) : (
              <Suspense fallback={<ScreenFallback />} key="history">
                <LazyHistory reviews={reviews} loading={historyLoading} onOpen={openReview} />
              </Suspense>
            )}
          </AnimatePresence>
        </div>
        <footer className="app-footer"><span><span className="footer-brand-mark">◈</span> REFRACT <span className="footer-version">v1.0</span></span><span>Built for thoughtful code reviews</span><span className="footer-right"><Activity size={12} /> {health?.status === 'ok' ? 'Systems operational' : 'Waiting for API'}</span></footer>
      </main>

      <AnimatePresence>{toast && <Toast message={toast} onClose={() => setToast('')} />}</AnimatePresence>
    </div>
  );
}
