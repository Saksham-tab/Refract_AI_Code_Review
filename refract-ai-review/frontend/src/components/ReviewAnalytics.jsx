import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const SEVERITY_COLORS = {
  critical: '#fa6b72',
  high: '#f29b72',
  medium: '#e8bd70',
  low: '#75bda3',
  info: '#8d91ff',
};

const tooltipStyle = {
  background: '#171b27',
  border: '1px solid #2b3245',
  borderRadius: 10,
  color: '#e4e8f0',
  fontSize: 12,
};

export default function ReviewAnalytics({ reviews }) {
  const severityData = ['critical', 'high', 'medium', 'low', 'info'].map((severity) => ({
    name: severity,
    value: reviews.reduce((sum, review) => sum + (review.metrics?.issues_by_severity?.[severity] || 0), 0),
  }));
  const daily = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - offset));
    const key = date.toDateString();
    return {
      day: date.toLocaleDateString(undefined, { weekday: 'short' }),
      reviews: reviews.filter((review) => new Date(review.created_at).toDateString() === key).length,
    };
  });
  const hasIssues = severityData.some((item) => item.value > 0);
  const hasActivity = daily.some((item) => item.reviews > 0);

  return (
    <div className="analytics-grid">
      <section className="panel chart-panel">
        <div className="panel-heading">
          <div><span className="eyebrow">ACTIVITY</span><h3>Review volume</h3></div>
          <span className="chart-note">Last 7 days</span>
        </div>
        {hasActivity ? (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="#252b3a" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#737f95', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#737f95', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#ffffff08' }} />
                <Bar dataKey="reviews" name="Reviews" fill="#898bff" radius={[5, 5, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="chart-empty">Your review activity will appear here.</div>}
      </section>
      <section className="panel chart-panel">
        <div className="panel-heading">
          <div><span className="eyebrow">FINDINGS</span><h3>Severity mix</h3></div>
          <span className="chart-note">All reviews</span>
        </div>
        {hasIssues ? (
          <div className="severity-chart-layout">
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={severityData.filter((item) => item.value > 0)} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="88%" paddingAngle={3} stroke="none">
                    {severityData.filter((item) => item.value > 0).map((entry) => <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="severity-legend">
              {severityData.map((item) => (
                <div key={item.name} className="legend-row">
                  <span className="legend-dot" style={{ background: SEVERITY_COLORS[item.name] }} />
                  <span>{item.name}</span><strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : <div className="chart-empty">No findings yet. Run your first review to populate this chart.</div>}
      </section>
    </div>
  );
}
