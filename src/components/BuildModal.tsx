'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Hammer, X, CheckCircle2, AlertCircle, Terminal, Loader2 } from 'lucide-react';

interface BuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelfileName: string;
  modelfileContent: string;
  onBuildComplete: () => void;
}

export function BuildModal({
  isOpen,
  onClose,
  modelfileName,
  modelfileContent,
  onBuildComplete,
}: BuildModalProps) {
  const [modelName, setModelName] = useState('');
  const [building, setBuilding] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [progress, setProgress] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modelfileName) {
      // Suggest model name from Modelfile name (e.g. Modelfile.coding -> gemma4-coding:latest)
      const base = modelfileName.replace(/^Modelfile\.?/, '');
      const suggested = base ? `gemma4-${base}:latest` : 'custom-model:latest';
      setModelName(suggested);
      setLogs([]);
      setCurrentStatus('');
      setProgress(null);
      setIsSuccess(null);
    }
  }, [modelfileName, isOpen]);

  useEffect(() => {
    consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  const startBuild = async () => {
    if (!modelName.trim()) return;
    try {
      setBuilding(true);
      setIsSuccess(null);
      setLogs([`[BUILD START] Building Ollama model '${modelName}' from ${modelfileName}...`]);
      setCurrentStatus('Initializing build...');

      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName.trim(),
          modelfileName,
          modelfileContent,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setLogs((prev) => [...prev, `[ERROR] ${err.error || 'Build failed'}`]);
        setIsSuccess(false);
        setBuilding(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setLogs((prev) => [...prev, '[ERROR] No response stream from server']);
        setIsSuccess(false);
        setBuilding(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.status) {
              setCurrentStatus(data.status);
              let logMsg = `> ${data.status}`;
              if (data.total && data.completed) {
                const pct = Math.round((data.completed / data.total) * 100);
                setProgress(pct);
                logMsg += ` (${pct}%)`;
              }
              setLogs((prev) => [...prev, logMsg]);
            }
            if (data.error) {
              setLogs((prev) => [...prev, `[ERROR] ${data.error}`]);
              setIsSuccess(false);
            }
          } catch {
            setLogs((prev) => [...prev, line]);
          }
        }
      }

      setLogs((prev) => [...prev, `[SUCCESS] Model '${modelName}' successfully built!`]);
      setIsSuccess(true);
      setCurrentStatus('Build completed successfully!');
      onBuildComplete();
    } catch (err) {
      setLogs((prev) => [...prev, `[FATAL] ${(err as Error).message}`]);
      setIsSuccess(false);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Hammer className="h-5 w-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ollama 모델 빌드 (Create Model)
            </h3>
          </div>
          <button
            onClick={() => {
              if (building && !confirm('빌드가 진행 중입니다. 정말 닫으시겠습니까?')) return;
              onClose();
            }}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              생성/등록할 모델 이름 (Tag 포함)
            </label>
            <div className="mt-1.5 flex items-center space-x-2">
              <input
                type="text"
                disabled={building}
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="gemma4-custom:latest"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
              <button
                onClick={startBuild}
                disabled={building || !modelName.trim()}
                className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 disabled:opacity-50 active:scale-95"
              >
                {building ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>빌드 중...</span>
                  </>
                ) : (
                  <>
                    <Hammer className="h-3.5 w-3.5" />
                    <span>빌드 시작</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              소스 파일: <code className="font-mono">{modelfileName}</code>
            </p>
          </div>

          {/* Progress Bar */}
          {progress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>{currentStatus}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Terminal Console */}
          <div>
            <div className="flex items-center justify-between pb-1.5 text-xs font-semibold text-slate-500">
              <span className="flex items-center space-x-1.5">
                <Terminal className="h-3.5 w-3.5" />
                <span>Build Console Output</span>
              </span>
              {isSuccess === true && (
                <span className="flex items-center space-x-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>완료</span>
                </span>
              )}
              {isSuccess === false && (
                <span className="flex items-center space-x-1 text-rose-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>오류 발생</span>
                </span>
              )}
            </div>
            <div className="h-64 overflow-y-auto rounded-xl bg-[#090d16] p-3.5 font-mono text-xs leading-relaxed text-emerald-400 border border-slate-800">
              {logs.length === 0 ? (
                <span className="text-slate-600">// '빌드 시작' 버튼을 누르면 실시간 로그가 여기에 출력됩니다.</span>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap">
                    {log}
                  </div>
                ))
              )}
              <div ref={consoleBottomRef} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 px-5 py-3 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
