import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronRight, Clock3, FileCode2, LoaderCircle, ShieldAlert } from 'lucide-react';

const LazyAnalytics = lazy(() => import('./ReviewAnalytics.jsx'));

function riskClass(level) {
  return ['critical', 'high', 'medium', 'low'].includes(level) ? level : 'medium';
}

export default function ReviewHistory({ reviews, loading, onOpen }) {
  const totalFindings = reviews.reduce((sum, review) => sum + (review.metrics?.total_findings || 0), 0);
  const criticalAndHigh = reviews.reduce((sum, review) => sum + (review.metrics?.issues_by_severity?.critical || 0) + (review.metrics?.issues_by_severity?.high || 0), 0);
  const average = reviews.length ? Math.round(totalFindings / reviews.length) : 0;

  return (
    <motion.div className="history-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
      <div className="page-intro">
        <div><div className="breadcrumb"><span>WORKSPACE</span><span className="breadcrumb-separator">/</span><span>REVIEW HISTORY</span></div><h1>Review activity.</h1><p>A traceable view of what Refract has inspected and what it found.</p></div>
        <div className="intro-actions"><span className="history-total"><CalendarDays size={14} /> {reviews.length} saved {reviews.length === 1 ? 'review' : 'reviews'}</span></div>
      </div>

      <div className="history-stats">
        <div className="panel history-stat"><span className="eyebrow">TOTAL REVIEWS</span><strong>{reviews.length}</strong><span className="stat-caption">Saved in local history</span></div>
        <div className="panel history-stat"><span className="eyebrow">FINDINGS RAISED</span><strong>{totalFindings}</strong><span className="stat-caption">Across all saved reviews</span></div>
        <div className="panel history-stat"><span className="eyebrow">CRITICAL + HIGH</span><strong className={criticalAndHigh ? 'stat-danger' : ''}>{criticalAndHigh}</strong><span className="stat-caption">Findings that need attention</span></div>
        <div className="panel history-stat"><span className="eyebrow">AVG. FINDINGS / REVIEW</span><strong>{average}</strong><span className="stat-caption">A simple quality signal</span></div>
      </div>

      <Suspense fallback={<div className="panel analytics-loading"><LoaderCircle size={16} className="spin" /> Loading analytics…</div>}>
        <LazyAnalytics reviews={reviews} />
      </Suspense>

      <section className="panel history-list-panel">
        <div className="panel-heading"><div><span className="eyebrow">LOCAL ARCHIVE</span><h2>Recent reviews</h2></div><span className="chart-note">Newest first</span></div>
        {loading ? <div className="history-state"><LoaderCircle className="spin" size={18} /> Loading review history…</div> : reviews.length ? (
          <div className="history-list">
            {reviews.map((review, index) => (
              <motion.button key={review.id} className="history-row" onClick={() => onOpen(review)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.035, 0.18) }}>
                <span className="history-file-icon"><FileCode2 size={17} /></span>
                <span className="history-file-copy"><strong>{review.filename}</strong><small>{review.language} <span>·</span> {review.model || 'qwen2.5-coder:1.5b'}</small></span>
                <span className={`risk-chip ${riskClass(review.summary?.risk_level)}`}><ShieldAlert size={12} />{review.summary?.risk_level || 'unknown'} risk</span>
                <span className="history-issue-count">{review.metrics?.total_findings || 0} findings</span>
                <span className="history-date"><Clock3 size={12} />{new Date(review.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                <ChevronRight size={16} className="history-chevron" />
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="history-empty"><div><FileCode2 size={20} /></div><strong>No reviews saved yet</strong><span>Run your first code review and it will appear here.</span></div>
        )}
      </section>
    </motion.div>
  );
}
