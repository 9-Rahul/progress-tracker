import { motion } from "framer-motion";

export function ProjectSkeletons() {
  return (
    <div className="section-stack" style={{ marginTop: 24 }}>
      <div className="section-heading">
        <div className="skeleton-item" style={{ width: 120, height: 28 }} />
      </div>
      <div className="project-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="premium-project-card" style={{ pointerEvents: 'none' }}>
            <div className="premium-card-content">
              <div className="premium-top-section">
                <div className="premium-top-left">
                  <div className="skeleton-item" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="skeleton-item" style={{ width: 60, height: 12 }} />
                    <div className="skeleton-item" style={{ width: 80, height: 10 }} />
                  </div>
                </div>
              </div>

              <div className="skeleton-item" style={{ width: '70%', height: 24, marginTop: 16 }} />
              <div className="skeleton-item" style={{ width: '90%', height: 14, marginTop: 8 }} />
              
              <div className="premium-tags" style={{ marginTop: 16 }}>
                <div className="skeleton-item" style={{ width: 50, height: 20 }} />
                <div className="skeleton-item" style={{ width: 70, height: 20 }} />
              </div>

              <div className="premium-divider" style={{ margin: '20px 0' }}></div>

              <div className="premium-footer-card">
                <div className="premium-footer-left">
                  <div className="skeleton-item" style={{ width: 40, height: 40, borderRadius: '8px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 12 }}>
                    <div className="skeleton-item" style={{ width: 100, height: 12 }} />
                    <div className="skeleton-item" style={{ width: 60, height: 10 }} />
                  </div>
                </div>
                <div className="skeleton-item" style={{ width: 56, height: 56, borderRadius: '50%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MetricsSkeletons() {
  return (
    <div className="premium-metrics-row" style={{ marginTop: 24 }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="premium-metric-card-wrapper" style={{ flex: 1, marginLeft: i > 1 ? -16 : 0 }}>
          <div className="premium-metric-card" style={{ height: 120 }}>
            <div className="premium-metric-content" style={{ padding: '20px' }}>
              <div className="skeleton-item" style={{ width: 60, height: 12, marginBottom: 8 }} />
              <div className="skeleton-item" style={{ width: 40, height: 32, marginBottom: 8 }} />
              <div className="skeleton-item" style={{ width: 100, height: 10 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="project-detail-layout" style={{ opacity: 0.7 }}>
      <div className="premium-topbar" style={{ height: 72 }}>
        <div className="skeleton-item" style={{ width: 200, height: 24, margin: 'auto 24px' }} />
      </div>
      <div className="detail-grid">
        <div className="skeleton-item" style={{ height: 400, borderRadius: 16 }} />
        <div className="skeleton-item" style={{ height: 400, borderRadius: 16 }} />
      </div>
    </div>
  );
}
