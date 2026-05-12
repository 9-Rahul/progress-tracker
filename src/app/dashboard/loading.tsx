import React from "react";

export default function DashboardLoading() {
  return (
    <div className="dashboard-container">
      {/* Header Skeleton */}
      <div className="premium-dashboard-header" style={{ borderBottom: 'none' }}>
        <div className="premium-header-top">
          <div className="premium-header-left">
            <div className="skeleton-item" style={{ width: '200px', height: '32px', marginBottom: '8px' }}></div>
            <div className="skeleton-item" style={{ width: '300px', height: '16px' }}></div>
          </div>
          <div className="skeleton-item" style={{ width: '140px', height: '40px', borderRadius: '8px' }}></div>
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="premium-metrics-row" style={{ marginTop: '24px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="premium-metric-card-wrapper">
            <div className="premium-metric-card skeleton-item" style={{ height: '90px', border: 'none' }}></div>
          </div>
        ))}
      </div>

      {/* Project Grid Skeleton */}
      <div className="section-heading" style={{ marginTop: '40px' }}>
        <div className="skeleton-item" style={{ width: '150px', height: '24px' }}></div>
      </div>
      
      <div className="project-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-item" style={{ height: '180px', borderRadius: '12px' }}></div>
        ))}
      </div>
    </div>
  );
}
