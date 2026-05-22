// app/components/NotificationModal.tsx
"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Loader2, Info } from "lucide-react";

export type NotificationType =
  | "success"
  | "error"
  | "saving"
  | "warning"
  | "info";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: NotificationType;
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function NotificationModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  autoClose = true,
  autoCloseDelay = 3000,
}: NotificationModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const typeStyles = {
    success: {
      bg: "bg-[#1a1a1a]",
      border: "border-[#4caf50]",
      icon: CheckCircle,
      iconColor: "text-[#4caf50]",
      titleColor: "text-[#e8e6e3]",
      messageColor: "text-[#8a8a8a]",
    },
    error: {
      bg: "bg-[#1a1a1a]",
      border: "border-[#dc4444]",
      icon: XCircle,
      iconColor: "text-[#dc4444]",
      titleColor: "text-[#e8e6e3]",
      messageColor: "text-[#8a8a8a]",
    },
    warning: {
      bg: "bg-[#1a1a1a]",
      border: "border-[#f59e0b]",
      icon: AlertTriangle,
      iconColor: "text-[#f59e0b]",
      titleColor: "text-[#e8e6e3]",
      messageColor: "text-[#8a8a8a]",
    },
    saving: {
      bg: "bg-[#1a1a1a]",
      border: "border-[#d4a853]",
      icon: Loader2,
      iconColor: "text-[#d4a853]",
      titleColor: "text-[#e8e6e3]",
      messageColor: "text-[#8a8a8a]",
    },
    info: {
      bg: "bg-[#1a1a1a]",
      border: "border-[#d4a853]",
      icon: Info,
      iconColor: "text-[#d4a853]",
      titleColor: "text-[#e8e6e3]",
      messageColor: "text-[#8a8a8a]",
    },
  };

  const styles = typeStyles[type];

  return (
    <>
      {/* Backdrop */}
      {/* <div
        className="fixed inset-0 bg-black/0 z-40 transition-opacity"
        onClick={onClose}
      /> */}

      {/* Modal */}
      <div className="fixed top-4 left-[40%] insert-x-0 z-50 flex items-center justify-center p-0">
          <div
            className={`${styles.bg} ${styles.border} border rounded-lg shadow-xl max-w-md w-full transform transition-all animate-bounce-in overflow-hidden`}
          >
            <div className="pt-6 px-6">
              {/* Header */}
              <div className="flex items-start gap-4 ">
                {/* Icon */}
                <div className={`${styles.iconColor} flex-shrink-0`}>
                  <styles.icon className="w-6 h-6" />
                </div>

              {/* Content */}
              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold ${styles.titleColor} mb-1`}
                >
                  {title}
                </h3>
                <p className={`text-sm ${styles.messageColor}`}>{message}</p>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress Bar (if autoClose) */}
          {autoClose && (
            <div className="mt-4 h-1 bg-[#333] w-full rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  type === "success"
                    ? "bg-[#4caf50]"
                    : type === "error"
                    ? "bg-[#dc4444]"
                    : type === "warning"
                    ? "bg-[#f59e0b]"
                    : type === "saving"
                    ? "bg-[#d4a853]"
                    : "bg-[#d4a853]"
                } animate-progress`}
                style={{
                  animation: `progress ${autoCloseDelay}ms linear`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-progress {
          animation: progress linear;
        }
        @keyframes bounce-in {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          50% {
            transform: scale(1.02);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
