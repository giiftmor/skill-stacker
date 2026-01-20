// app/components/NotificationModal.tsx
"use client";

import { useEffect } from "react";

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
      bg: "bg-green-50/50",
      border: "border-green-500",
      icon: "✅",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      titleColor: "text-green-900",
      messageColor: "text-green-700",
    },
    error: {
      bg: "bg-red-50/50",
      border: "border-red-500",
      icon: "❌",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      titleColor: "text-red-900",
      messageColor: "text-red-700",
    },
    warning: {
      bg: "bg-yellow-50/50",
      border: "border-yellow-500",
      icon: "⚠️",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      titleColor: "text-yellow-900",
      messageColor: "text-yellow-700",
    },
    saving: {
      bg: "bg-purple-50/50",
      border: "border-purple-500",
      icon: "💾",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      titleColor: "text-purple-900",
      messageColor: "text-purple-700",
    },
    info: {
      bg: "bg-blue-50/50",
      border: "border-blue-500",
      icon: "ℹ️",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      titleColor: "text-blue-900",
      messageColor: "text-blue-700",
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
          className={`${styles.bg} ${styles.border} rounded-lg shadow-xl max-w-md w-full transform transition-all animate-bounce-in overflow-hidden`}
        >
          <div className="pt-6 px-6">
            {/* Header */}
            <div className="flex items-start gap-4 ">
              {/* Icon */}
              <div
                className={`${styles.iconBg} rounded-full size-8 inserts-center flex items-center justify-center flex-shrink-0`}
              >
                <span className="text-sm ">{styles.icon}</span>
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
            <div className="mt-4 h-1 bg-gray-200 w-full rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  type === "success"
                    ? "bg-green-500"
                    : type === "error"
                    ? "bg-red-500"
                    : type === "warning"
                    ? "bg-yellow-500"
                    : type === "saving"
                    ? "bg-purple-500"
                    : "bg-blue-500"
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
