"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger"
}: ConfirmModalProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop" style={{ zIndex: 1000 }}>
          <motion.div
            className="modal-panel"
            style={{ maxWidth: 400 }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ marginBottom: 16 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: variant === "danger" ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: variant === "danger" ? "#ef4444" : "#f59e0b",
                marginBottom: 16
              }}>
                <AlertTriangle size={24} />
              </div>
              <button className="icon-button" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>{title}</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 24 }}>{description}</p>

            <div className="toolbar" style={{ marginTop: 0 }}>
              <button className="secondary-button" onClick={onClose} style={{ flex: 1 }}>
                {cancelLabel}
              </button>
              <button 
                ref={confirmButtonRef}
                className="primary-button" 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                style={{ 
                  flex: 1, 
                  background: variant === "danger" ? "#ef4444" : "var(--accent)",
                  borderColor: variant === "danger" ? "#ef4444" : "var(--accent)"
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
