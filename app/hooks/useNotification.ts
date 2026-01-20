// app/hooks/useNotification.ts
'use client';

import { useState, useCallback } from 'react';
import type { NotificationType } from '../components/NotificationModal';

interface NotificationState {
  isOpen: boolean;
  type: NotificationType;
  title: string;
  message: string;
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
  });

  const showNotification = useCallback(
    (type: NotificationType, title: string, message: string) => {
      setNotification({
        isOpen: true,
        type,
        title,
        message,
      });
    },
    []
  );

  const closeNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Helper methods for specific notification types
  const showSuccess = useCallback(
    (title: string, message: string) => {
      showNotification('success', title, message);
    },
    [showNotification]
  );

  const showError = useCallback(
    (title: string, message: string) => {
      showNotification('error', title, message);
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (title: string, message: string) => {
      showNotification('warning', title, message);
    },
    [showNotification]
  );

    const showSaving = useCallback(
    (title: string, message: string) => {
      showNotification('saving', title, message);
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (title: string, message: string) => {
      showNotification('info', title, message);
    },
    [showNotification]
  );

  return {
    notification,
    showNotification,
    closeNotification,
    showSuccess,
    showError,
    showWarning,
    showSaving,
    showInfo,
  };
}