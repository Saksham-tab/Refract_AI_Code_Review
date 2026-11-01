import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Code2,
  Copy,
  FileCode2,
  FileUp,
  Filter,
  Info,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import { SAMPLE_CODE } from '../data/sample.js';

const LazyCodeEditor = lazy(() => import('./CodeEditor.jsx'));
const languages = [
  ['python', 'Python'], ['javascript', 'JavaScript'], ['typescript', 'TypeScript'],
  ['java', 'Java'], ['go', 'Go'], ['rust', 'Rust'], ['cpp', 'C++'], ['csharp', 'C#'],
  ['php', 'PHP'], ['ruby', 'Ruby'], ['sql', 'SQL'], ['json', 'JSON'], ['bash', 'Shell'],
  ['c', 'C'], ['html', 'HTML'], ['css', 'CSS'], ['yaml', 'YAML'], ['text', 'Plain text'],
];

const extensionLanguage = {
  py: 'python', js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript', java: 'java', go: 'go', rs: 'rust', cpp: 'cpp', cc: 'cpp',
  c: 'c', h: 'c', cs: 'csharp', php: 'php', rb: 'ruby', sql: 'sql', json: 'json',
  sh: 'bash', yml: 'yaml', yaml: 'yaml', html: 'html', css: 'css',
};

const severityMeta = {
  critical: { label: 'Critical', icon: AlertCircle, className: 'critical' },
  high: { label: 'High', icon: AlertTriangle, className: 'high' },
  medium: { label: 'Medium', icon: AlertTriangle, className: 'medium' },
  low: { label: 'Low', icon: Info, className: 'low' },
  info: { label: 'Info', icon: Info, className: 'info' },
};

function formatCount(value) {
  return new Intl.NumberFormat().format(value || 0);
}

function EditorFallback() {
  return <div className="editor-loading"><LoaderCircle size={17} className="spin" /> Loading editor…</div>;
}

function ReviewEmptyState({ health, onLoadSample }) {
  return (
    <div className="review-empty">
      <div className="empty-orbit"><div className="orbit-core"><Sparkles size={22} /></div><span className="orbit-dot orbit-dot-a" /><span className="orbit-dot orbit-dot-b" /></div>
      <span className="eyebrow">AI REVIEW ENGINE</span>
      <h3>Clarity before commit.</h3>
      <p>Run a review to surface bugs, security risks, performance traps, and maintainability issues before they make it downstream.</p>
      <button className="text-action" onClick={onLoadSample}>Explore with sample code <ArrowUpRight size={14} /></button>
      <div className="review-checklist">
        <div><ShieldCheck size={15} /><span>Security & input validation</span></div>
        <div><Zap size={15} /><span>Correctness & edge cases</span></div>
        <div><Code2 size={15} /><span>Performance & maintainability</span></div>
      </div>
      {!health?.ollama_connected && (
        <div className="setup-note"><CircleHelp size={14} /><span>Start Ollama and run <code>ollama pull qwen2.5-coder:1.5b</code> to enable live reviews.</span></div>
      )}
    </div>
  );
}

function FindingCard({ finding, index, onSelect }) {
  const [expanded, setExpanded] = useState(index === 0);
  const meta = severityMeta[finding.severity] || severityMeta.info;
  const Icon = meta.icon;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index * 0.035, 0.2) }}
      className={`finding-card ${meta.className} ${expanded ? 'is-expanded' : ''}`}
    >
      <button className="finding-main" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
        <span className={`severity-icon ${meta.className}`}><Icon size={14} /></span>
        <span className="finding-title-wrap">
          <span className="finding-title">{finding.title}</span>
          <span className="finding-meta"><span className={`severity-text ${meta.className}`}>{meta.label}</span><span>·</span><span>{finding.category || 'general'}</span></span>
        </span>
        <span className="line-pill" onClick={(event) => { event.stopPropagation(); onSelect(finding.line); }}>L{finding.line || '—'} <ArrowUpRight size={11} /></span>
        <ChevronDown size={15} className={`finding-chevron ${expanded ? 'expanded' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div className="finding-detail" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <p>{finding.description}</p>
            {finding.code && <pre className="finding-snippet"><code>{finding.code}</code></pre>}
            <div className="recommendation"><span>RECOMMENDATION</span><p>{finding.recommendation}</p></div>
            <button className="line-action" onClick={() => onSelect(finding.line)}>View line {finding.line || ''} in editor <ArrowUpRight size={13} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function FindingsPanel({ review, isReviewing, onToast, onLineSelect, onClear, health, onLoadSample }) {
  const [severity, setSeverity] = useState('all');
  const [query, setQuery] = useState('');
  const findings = review?.findings || [];
  const visibleFindings = useMemo(() => findings.filter((finding) => {
    const matchesSeverity = severity === 'all' || finding.severity === severity;
    const haystack = `${finding.title} ${finding.description} ${finding.category}`.toLowerCase();
    return matchesSeverity && haystack.includes(query.toLowerCase());
  }), [findings, severity, query]);
  const issueCounts = review?.metrics?.issues_by_severity || {};
  const total = review?.metrics?.total_findings ?? findings.length;

  useEffect(() => {
    setSeverity('all');
    setQuery('');
  }, [review?.id]);

  function exportReport() {
    if (!review) return;
    const blob = new Blob([JSON.stringify(review, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `refract-review-${review.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    onToast('Review report exported.');
  }

  async function copySummary() {
    if (!review) return;
    const text = [review.summary?.overall, '', ...findings.map((finding) => `[${finding.severity.toUpperCase()}] ${finding.title} (line ${finding.line || 'n/a'})\n${finding.description}\nFix: ${finding.recommendation}`)].join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      onToast('Review copied to clipboard.');
    } catch {
      onToast('Clipboard access is unavailable in this browser.');
    }
  }

  return (
    <section className="panel findings-panel">
      <div className="panel-heading findings-heading">
        <div><span className="eyebrow">REVIEW OUTPUT</span><h2>Findings <span className="count-bubble">{review ? total : '—'}</span></h2></div>
        {review && <button className="icon-button" title="Export report" onClick={exportReport}><ArrowDownToLine size={16} /></button>}
      </div>
      {isReviewing ? (
        <div className="review-running">
          <div className="running-visual"><div className="running-ring" /><Sparkles size={19} /></div>
          <span className="eyebrow">ANALYZING SOURCE</span>
          <h3>Reading between the lines.</h3>
          <p>Checking control flow, edge cases, security boundaries, and implementation quality.</p>
          <div className="running-state"><LoaderCircle size={14} className="spin" /> Waiting for model response</div>
          <div className="running-skeleton"><i /><i /><i /></div>
        </div>
      ) : review ? (
        <>
          <div className={`review-summary risk-${review.summary?.risk_level || 'medium'}`}>
            <div className="summary-topline"><span className="risk-label"><span className="risk-dot" />{(review.summary?.risk_level || 'medium').toUpperCase()} RISK</span><span className="summary-model">{review.model || 'qwen2.5-coder:1.5b'}</span></div>
            <p>{review.summary?.overall || 'Review complete.'}</p>
            {review.summary?.key_takeaway && <div className="key-takeaway"><Sparkles size={13} /><span>{review.summary.key_takeaway}</span></div>}
          </div>
          <div className="severity-overview">
            {['critical', 'high', 'medium', 'low'].map((item) => (
              <button key={item} className={`severity-stat ${severity === item ? 'selected' : ''}`} onClick={() => setSeverity(severity === item ? 'all' : item)}>
                <strong className={`severity-text ${item}`}>{formatCount(issueCounts[item])}</strong><span>{item}</span>
              </button>
            ))}
          </div>
          <div className="findings-toolbar">
            <div className="finding-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter findings…" /></div>
            <button className={`filter-button ${severity !== 'all' ? 'active' : ''}`} onClick={() => setSeverity('all')} title="Show all severities"><Filter size={14} /><span>{severity === 'all' ? 'All' : 'Reset'}</span></button>
          </div>
          <div className="findings-list">
            {visibleFindings.length ? visibleFindings.map((finding, index) => <FindingCard key={finding.id || `${finding.title}-${finding.line}`} finding={finding} index={index} onSelect={onLineSelect} />) : (
              <div className="findings-empty"><CheckCircle2 size={21} /><strong>No matching findings</strong><span>{findings.length ? 'Try a different severity or search term.' : 'The model did not return actionable findings.'}</span></div>
            )}
          </div>
          <div className="findings-footer">
            <span>{visibleFindings.length} of {findings.length} findings</span>
            <div><button onClick={copySummary}><Copy size={13} /> Copy</button><button onClick={onClear}><X size={13} /> Clear</button></div>
          </div>
        </>
      ) : (
        <ReviewEmptyState health={health} onLoadSample={onLoadSample} />
      )}
    </section>
  );
}

export default function ReviewWorkspace({
  code,
  setCode,
  filename,
  setFilename,
  language,
  setLanguage,
  review,
  isReviewing,
  onReview,
  health,
  onToast,
  onReviewLoaded,
}) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [focus, setFocus] = useState('balanced');
  const [showOptions, setShowOptions] = useState(false);
  const lineCount = code ? code.split('\n').length : 0;
  const charCount = code.length;

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if (code.trim() && !isReviewing && charCount <= 60000) onReview(focus);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [code, isReviewing, charCount, onReview, focus]);

  async function loadFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 250_000) {
      onToast('Files must be smaller than 250 KB for this review workspace.');
      event.target.value = '';
      return;
    }
    const text = await file.text();
    if (text.length > 60000) {
      onToast('This file contains more than 60,000 characters. Trim it before loading.');
      event.target.value = '';
      return;
    }
    const extension = file.name.split('.').pop()?.toLowerCase();
    setCode(text);
    setFilename(file.name);
    setLanguage(extensionLanguage[extension] || 'text');
    onReviewLoaded(null);
    onToast(`Loaded ${file.name}`);
    event.target.value = '';
  }

  function clearCode() {
    setCode('');
    onReviewLoaded(null);
    editorRef.current?.clearHighlight();
  }

  function pasteSample() {
    setCode(SAMPLE_CODE);
    setFilename('user_service.py');
    setLanguage('python');
    onReviewLoaded(null);
    onToast('Sample code loaded. Run a review to see the findings.');
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return onToast('Clipboard is empty.');
      setCode(text);
      onReviewLoaded(null);
      onToast('Code pasted from clipboard.');
    } catch {
      onToast('Clipboard access was blocked. Use Ctrl+V in the editor instead.');
    }
  }

  function revealLine(line) {
    if (!line) return onToast('The model did not provide a reliable line reference for this finding.');
    editorRef.current?.revealLine(line);
  }

  return (
    <motion.div className="workspace-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
      <div className="page-intro">
        <div>
          <div className="breadcrumb"><span>WORKSPACE</span><span className="breadcrumb-separator">/</span><span>NEW REVIEW</span></div>
          <h1>Code review, <span>without the blind spots.</span></h1>
          <p>Drop in a file or paste a code snippet. Refract will look for the issues that matter.</p>
        </div>
        <div className="intro-actions">
          <span className={`api-availability ${health?.ollama_connected ? 'ready' : 'offline'}`}><span />{health?.ollama_connected ? 'Model connected' : 'Ollama not connected'}</span>
          <button className="button button-secondary button-small" onClick={pasteSample} disabled={isReviewing}><FileCode2 size={14} /> Load sample</button>
        </div>
      </div>

      <div className="workspace-grid">
        <section className="panel editor-panel">
          <div className="editor-panel-head">
            <div className="editor-heading"><div className="editor-file-icon"><FileCode2 size={16} /></div><div><span className="eyebrow">SOURCE INPUT</span><strong>Review target</strong></div></div>
            <div className="editor-head-actions">
              <button className="icon-button" title="Paste from clipboard" onClick={pasteFromClipboard} disabled={isReviewing}><Copy size={15} /></button>
              <button className="icon-button" title="Upload a code file" onClick={() => fileInputRef.current?.click()} disabled={isReviewing}><FileUp size={15} /></button>
              <button className="icon-button" title="Clear editor" onClick={clearCode} disabled={isReviewing}><X size={15} /></button>
              <input ref={fileInputRef} className="visually-hidden" type="file" accept=".py,.js,.jsx,.mjs,.ts,.tsx,.java,.go,.rs,.cpp,.cc,.c,.h,.cs,.php,.rb,.sql,.json,.sh,.yaml,.yml,.html,.css,.txt" onChange={loadFile} />
            </div>
          </div>
          <div className="editor-meta-row">
            <label className="filename-field"><span className="eyebrow">FILE</span><input value={filename} onChange={(event) => setFilename(event.target.value)} disabled={isReviewing} aria-label="File name" placeholder="untitled.py" /></label>
            <label className="language-field"><span className="eyebrow">LANGUAGE</span><span className="select-wrap"><select value={language} onChange={(event) => setLanguage(event.target.value)} disabled={isReviewing} aria-label="Programming language">{languages.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><ChevronDown size={13} /></span></label>
          </div>
          <div className="monaco-wrap">
            <Suspense fallback={<EditorFallback />}>
              <LazyCodeEditor ref={editorRef} value={code} onChange={(next) => { setCode(next); onReviewLoaded(null); }} language={language} readOnly={isReviewing} />
            </Suspense>
            {!code && <div className="editor-placeholder" aria-hidden="true"><span>Start typing or drop a file here…</span><span className="placeholder-hint">Try <kbd>Ctrl</kbd> + <kbd>V</kbd> to paste code</span></div>}
          </div>
          <div className="editor-statusbar"><span><span className="status-dot" /> Ready</span><span>{formatCount(lineCount)} lines</span><span>{formatCount(charCount)} characters</span><span className="editor-status-spacer" /><span>{language.toUpperCase()}</span><span>UTF-8</span></div>
          <div className="editor-actions-row">
            <div className="review-focus-control">
              <button className="focus-trigger" onClick={() => setShowOptions((value) => !value)} disabled={isReviewing} aria-expanded={showOptions}><span className="focus-icon"><WandSparkles size={14} /></span><span><small>REVIEW FOCUS</small><strong>{focus === 'balanced' ? 'Balanced review' : focus === 'security' ? 'Security first' : focus === 'performance' ? 'Performance' : 'Correctness'}</strong></span><ChevronDown size={14} /></button>
              <AnimatePresence>
                {showOptions && <motion.div className="focus-menu" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}>
                  {[['balanced', 'Balanced review', 'A broad review across quality dimensions'], ['security', 'Security first', 'Prioritize vulnerabilities and unsafe boundaries'], ['performance', 'Performance', 'Prioritize complexity, memory, and runtime costs'], ['correctness', 'Correctness', 'Prioritize bugs, edge cases, and reliability']].map(([value, label, description]) => <button key={value} onClick={() => { setFocus(value); setShowOptions(false); }} className={focus === value ? 'selected' : ''}><span><strong>{label}</strong><small>{description}</small></span>{focus === value && <Check size={14} />}</button>)}
                </motion.div>}
              </AnimatePresence>
            </div>
            <div className="run-actions">
              <span className="shortcut-hint"><kbd>⌘</kbd><kbd>↵</kbd> to run</span>
              <button className="button button-primary review-button" onClick={() => onReview(focus)} disabled={!code.trim() || isReviewing || charCount > 60000}>
                {isReviewing ? <><LoaderCircle size={16} className="spin" /> Reviewing…</> : <><Sparkles size={16} /> Review code <ArrowUpRight size={14} /></>}
              </button>
            </div>
          </div>
          {charCount > 60000 && <div className="editor-warning"><AlertTriangle size={13} /> This input is over the 60,000-character review limit. Trim it before submitting.</div>}
        </section>

        <FindingsPanel
          review={review}
          isReviewing={isReviewing}
          health={health}
          onLoadSample={pasteSample}
          onToast={onToast}
          onLineSelect={revealLine}
          onClear={() => onReviewLoaded(null)}
        />
      </div>
      <div className="workspace-footnote"><ShieldCheck size={13} /><span>Code is sent only to the local Ollama service through your Python API.</span></div>
    </motion.div>
  );
}
