// app/hooks/useAutoSave.ts
"use client";
import { useEffect, useRef, useCallback, useState } from "react";

interface UseAutoSaveOptions {
  data: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  interval?: number;
  enabled?: boolean;
}

export function useAutoSave({
  data,
  onSave,
  interval = 30000,
  enabled = true,
}: UseAutoSaveOptions) {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const lastSavedRef = useRef<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const save = useCallback(async () => {
    const dataString = JSON.stringify(data);
    if (dataString === lastSavedRef.current) return;

    setStatus("saving");
    try {
      await onSave(data);
      lastSavedRef.current = dataString;
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("Auto-save failed:", error);
      setStatus("error");
    }
  }, [data, onSave]);

  useEffect(() => {
    if (!enabled) return;

    timerRef.current = setInterval(save, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, interval, save]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      save();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [save]);

  return { status, saveNow: save };
}