"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState, useEffect } from "react";
import { Menu, Plus, X, Trash2, PanelLeftClose, PanelLeft } from "lucide-react";
import { useAuth, useTheme } from "@/components/providers";
import { useProjectStore } from "@/hooks/use-project-store";
import { stripEmojis } from "@/lib/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/focus", label: "Focus" },
  { href: "/reports", label: "Reports" }
];

function getPageTitle(pathname: string) {
  if (pathname === "/dashboard") return "Overview";
  if (pathname === "/focus") return "Focus";
  if (pathname === "/reports") return "Reports";
  if (pathname.startsWith("/projects/")) return "Track Detail";
  return "ExecTrack";
}

function isActive(pathname: string, href: string) {
  if (href.includes("?")) {
    return false;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, signOutUser } = useAuth();
  const { projects, loading, resetData, deleteProject } = useProjectStore();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("exectrack_sidebar_collapsed");
      if (saved !== null) {
        setSidebarCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("exectrack_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/auth");
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`} style={{ fontFamily: "var(--apple-font)" }}>
      {/* Floating Sidebar Expand Button (visible only when collapsed on desktop) */}
      {sidebarCollapsed && (
        <button
          type="button"
          className="apple-floating-expand-btn"
          onClick={toggleSidebar}
          title="Expand Sidebar (⌘B)"
          aria-label="Expand Sidebar"
        >
          <PanelLeft size={16} strokeWidth={2} />
        </button>
      )}

      {/* Apple macOS-Style Collapsible Sidebar (Pure Typography, NO ICONS) */}
      <aside className="apple-sidebar">
        {/* Brand Header with Collapse Toggle */}
        <div className="apple-sidebar-header">
          <Link className="apple-brand-link" href="/dashboard">
            <span className="apple-brand-dot" />
            <span className="apple-brand-name">ExecTrack</span>
          </Link>
          <button
            type="button"
            className="apple-sidebar-toggle-btn"
            onClick={toggleSidebar}
            title="Collapse Sidebar (⌘B)"
            aria-label="Collapse Sidebar"
          >
            <PanelLeftClose size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Quick New Track Action */}
        <Link className="apple-new-btn" href="/dashboard?new=1">
          <span>New Track</span>
          <span className="apple-new-btn-kbd">⌘K</span>
        </Link>

        {/* Primary Navigation (Pure Typography, NO ICONS) */}
        <div style={{ marginBottom: 20 }}>
          <p className="apple-nav-group-title">WORKSPACE</p>
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                className={`apple-nav-link ${active ? "active" : ""}`}
                href={item.href}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* My Tracks List (Pure Typography, NO ICONS) */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", marginBottom: 6 }}>
            <p className="apple-nav-group-title" style={{ margin: 0, padding: 0 }}>TRACKS</p>
            <span className="apple-count-pill">{projects.length}</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", paddingRight: 2 }}>
            {loading ? (
              <div style={{ padding: "8px 10px", color: "var(--apple-text-tertiary)", fontSize: 12 }}>
                Loading tracks…
              </div>
            ) : projects.length === 0 ? (
              <div style={{ padding: "8px 10px", color: "var(--apple-text-tertiary)", fontSize: 12 }}>
                No active tracks yet.
              </div>
            ) : (
              projects.map((project) => {
                const active = pathname === `/projects/${project.id}`;
                return (
                  <div key={project.id} style={{ display: "flex", alignItems: "center", position: "relative" }}>
                    <Link
                      className={`apple-track-link ${active ? "active" : ""}`}
                      href={`/projects/${project.id}`}
                    >
                      <span className={`apple-status-dot ${project.status}`} />
                      <span className="apple-track-name">{stripEmojis(project.title)}</span>
                      <span className="apple-track-pct">{project.progress}%</span>
                    </Link>
                    <button
                      type="button"
                      className="apple-track-delete-btn"
                      title="Delete track"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteId(project.id);
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Minimalist Footer with Clean Text Actions */}
        <div className="apple-sidebar-footer">
          <div className="apple-footer-user-row">
            <span className="apple-user-email">
              {user?.email || user?.name || "Builder"}
            </span>
          </div>
          <div className="apple-footer-text-actions">
            <button
              type="button"
              className="apple-footer-text-btn"
              onClick={() => setResetConfirmOpen(true)}
            >
              Reset
            </button>
            <span className="apple-footer-divider">·</span>
            <button
              type="button"
              className="apple-footer-text-btn"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="top-header" style={{ borderBottom: "1px solid var(--apple-border)", backdropFilter: "blur(20px)" }}>
        <Link className="top-header-brand" href="/dashboard" style={{ textDecoration: "none" }}>
          <span className="apple-brand-dot" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--apple-text-primary)" }}>ExecTrack</span>
        </Link>

        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--apple-text-primary)" }}>{getPageTitle(pathname)}</span>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            className="apple-btn-secondary"
            type="button"
            style={{ width: 32, height: 32, padding: 0 }}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={16} />
          </button>
        </div>
      </header>

      {/* Main Page Area */}
      <motion.main
        key={pathname}
        className="main"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {children}
      </motion.main>

      {/* Mobile iOS-Style Bottom Tab Bar */}
      <nav className="apple-bottom-tabbar" aria-label="Mobile navigation">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              className={`apple-tab-item ${active ? "active" : ""}`}
              href={item.href}
            >
              <span style={{ fontWeight: active ? 700 : 500 }}>{item.label}</span>
            </Link>
          );
        })}
        <button
          className="apple-tab-item"
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Tracks list"
        >
          <span>Tracks</span>
        </button>
      </nav>

      {/* Mobile Drawer (macOS Sheet style) */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeDrawer}
              aria-hidden
            />

            <motion.aside
              className="nav-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              aria-label="Navigation drawer"
              style={{ background: "var(--apple-card)", borderRight: "1px solid var(--apple-border)", fontFamily: "var(--apple-font)" }}
            >
              <div className="drawer-header" style={{ borderBottom: "1px solid var(--apple-border)" }}>
                <Link className="top-header-brand" href="/dashboard" onClick={closeDrawer} style={{ textDecoration: "none" }}>
                  <span className="apple-brand-dot" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--apple-text-primary)" }}>ExecTrack</span>
                </Link>
                <button
                  className="apple-btn-secondary"
                  type="button"
                  style={{ width: 32, height: 32, padding: 0 }}
                  onClick={closeDrawer}
                  aria-label="Close menu"
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{ padding: "16px 12px" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--apple-text-tertiary)", letterSpacing: "0.04em", margin: "0 0 8px" }}>
                  MY TRACKS
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {loading ? (
                    <div style={{ padding: "8px 0", color: "var(--apple-text-tertiary)", fontSize: 13 }}>
                      Loading tracks…
                    </div>
                  ) : projects.length === 0 ? (
                    <div style={{ padding: "8px 0", color: "var(--apple-text-tertiary)", fontSize: 13 }}>
                      No tracks defined.
                    </div>
                  ) : (
                    projects.map((project) => (
                      <li key={project.id} style={{ marginBottom: 4 }}>
                        <Link
                          className={`nav-link ${pathname === `/projects/${project.id}` ? "active" : ""}`}
                          href={`/projects/${project.id}`}
                          onClick={closeDrawer}
                          style={{
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: 13.5,
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            textDecoration: "none"
                          }}
                        >
                          <span className={`apple-status-dot ${project.status}`} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {stripEmojis(project.title)}
                          </span>
                        </Link>
                      </li>
                    ))
                  )}
                  <li style={{ marginTop: 8 }}>
                    <Link
                      className="apple-btn-secondary"
                      href="/dashboard?new=1"
                      onClick={closeDrawer}
                      style={{ width: "100%", justifyContent: "flex-start", textDecoration: "none" }}
                    >
                      <Plus size={14} />
                      <span>Add New Track</span>
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="drawer-footer" style={{ borderTop: "1px solid var(--apple-border)", padding: "16px 12px" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button
                    className="apple-btn-secondary"
                    type="button"
                    style={{ flex: 1, color: "var(--apple-red)" }}
                    onClick={() => {
                      closeDrawer();
                      setResetConfirmOpen(true);
                    }}
                  >
                    Reset Progress
                  </button>
                </div>

                <button
                  className="apple-btn-secondary"
                  type="button"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={handleSignOut}
                >
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={async () => {
          await resetData();
          router.push("/dashboard");
          router.refresh();
        }}
        title="Reset All Progress"
        description="Are you sure you want to reset all progress? This will clear your daily logs for all tracks but will NOT delete the tracks themselves."
        confirmLabel="Reset Data"
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteProject(deleteId);
          }
        }}
        title="Delete Track"
        description={`Are you sure you want to delete "${projects.find(p => p.id === deleteId)?.title}"? This cannot be undone.`}
        confirmLabel="Delete Track"
      />
    </div>
  );
}
