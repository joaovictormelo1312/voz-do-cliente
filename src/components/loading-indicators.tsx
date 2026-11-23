export function Spinner() {
  return <span className="loading-spinner" aria-hidden="true" />;
}

export function DashboardSkeleton() {
  return <div role="status" aria-label="Carregando dados do painel" aria-busy="true">
    <div aria-hidden="true">
      <div className="skeleton-heading"><div className="skeleton-line skeleton-short" /><div className="skeleton-line skeleton-title" /><div className="skeleton-line skeleton-medium" /></div>
      <div className="overview-hero">
        <div className="panel skeleton-panel skeleton-hero"><div className="skeleton-line skeleton-short" /><div className="skeleton-line skeleton-title" /><div className="skeleton-line skeleton-medium" /></div>
        <div className="panel skeleton-panel skeleton-hero"><div className="skeleton-line skeleton-medium" /><div className="skeleton-chart" /></div>
      </div>
      <div className="metrics-grid">{[0, 1, 2, 3].map((item) => <div className="metric-card skeleton-panel" key={item}><div className="skeleton-line skeleton-medium" /><div className="skeleton-line skeleton-short" /></div>)}</div>
      <div className="overview-detail">
        {[0, 1].map((item) => <div className="panel skeleton-panel" key={item}><div className="skeleton-line skeleton-medium" /><div className="skeleton-line" /><div className="skeleton-line" /><div className="skeleton-line skeleton-medium" /></div>)}
      </div>
    </div>
  </div>;
}

export function SurveySkeleton() {
  return <main className="survey-page">
    <div className="survey-container" role="status" aria-label="Carregando pesquisa" aria-busy="true">
      <div aria-hidden="true" className="skeleton-survey">
        <div className="skeleton-heading"><div className="skeleton-line skeleton-short" /><div className="skeleton-line skeleton-title" /><div className="skeleton-line skeleton-medium" /></div>
        {[0, 1].map((item) => <div className="panel skeleton-panel" key={item}><div className="skeleton-line skeleton-medium" /><div className="skeleton-line" /><div className="skeleton-line skeleton-short" /></div>)}
      </div>
    </div>
  </main>;
}
