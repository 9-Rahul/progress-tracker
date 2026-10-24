"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, RotateCcw, CheckCircle2, X } from "lucide-react";
import { useEffect, useRef } from "react";

export interface ConfirmModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info" | "success";
  tone?: "danger" | "warning" | "info" | "success";
}

export function ConfirmModal({
  isOpen,
  open,
  onClose,
  onCancel,
  onConfirm,
  title,
  description,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant,
  tone
}: ConfirmModalProps) {
  const visible = Boolean(isOpen ?? open);
  const handleDismiss = onClose || onCancel || (() => {});
  const bodyText = description || message || "";
  const actualVariant = variant || tone || "danger";
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => confirmButtonRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [visible, handleDismiss]);

  const getToneVisuals = () => {
    switch (actualVariant) {
      case "danger":
        return {
          icon: <Trash2 size={18} strokeWidth={2} />,
          iconBg: "rgba(255, 69, 58, 0.12)",
          iconColor: "var(--apple-red, #ff453a)",
          confirmBg: "#ff453a",
          confirmText: "#ffffff"
        };
      case "warning":
        return {
          icon: <RotateCcw size={18} strokeWidth={2} />,
          iconBg: "rgba(255, 159, 10, 0.12)",
          iconColor: "var(--apple-orange, #ff9f0a)",
          confirmBg: "#ff9f0a",
          confirmText: "#000000"
        };
      case "success":
        return {
          icon: <CheckCircle2 size={18} strokeWidth={2} />,
          iconBg: "rgba(48, 209, 88, 0.12)",
          iconColor: "var(--apple-green, #30d158)",
          confirmBg: "#30d158",
          confirmText: "#000000"
        };
      default:
        return {
          icon: <AlertTriangle size={18} strokeWidth={2} />,
          iconBg: "var(--apple-inset, #242426)",
          iconColor: "var(--apple-text-primary, #ffffff)",
          confirmBg: "var(--apple-text-primary, #ffffff)",
          confirmText: "var(--apple-bg, #000000)"
        };
    }
  };

  const visuals = getToneVisuals();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleDismiss}
          style={{ zIndex: 1000 }}
        >
          <motion.div
            className="apple-card"
            style={{
              maxWidth: 420,
              width: "92%",
              padding: 24,
              borderRadius: 20,
              boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.55), 0 0 0 1px var(--apple-border)",
              background: "var(--apple-card)",
              border: "1px solid var(--apple-border)"
            }}
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: visuals.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: visuals.iconColor
                }}
              >
                {visuals.icon}
              </div>
              <button
                type="button"
                className="apple-icon-btn"
                onClick={handleDismiss}
                aria-label="Close"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "var(--apple-inset)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--apple-text-tertiary)",
                  cursor: "pointer"
                }}
              >
                <X size={15} />
              </button>
            </div>

            <h3
              id="confirm-modal-title"
              style={{
                fontSize: 17,
                fontWeight: 650,
                letterSpacing: "-0.015em",
                margin: "0 0 6px 0",
                color: "var(--apple-text-primary)"
              }}
            >
              {title}
            </h3>

            {bodyText && (
              <p
                id="confirm-modal-desc"
                style={{
                  fontSize: 13.5,
                  color: "var(--apple-text-secondary)",
                  lineHeight: 1.5,
                  margin: "0 0 22px 0"
                }}
              >
                {bodyText}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: bodyText ? 0 : 20 }}>
              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 10,
                  background: "var(--apple-inset)",
                  border: "1px solid var(--apple-border)",
                  color: "var(--apple-text-primary)",
                  fontSize: 13.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 120ms ease"
                }}
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={async () => {
                  await onConfirm();
                  handleDismiss();
                }}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 10,
                  background: visuals.confirmBg,
                  border: "none",
                  color: visuals.confirmText,
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 120ms ease"
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
