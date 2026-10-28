'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Plus,
  Save,
  Hammer,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Copy,
  Info,
  Terminal,
  FileText,
  Clock,
  HardDrive,
  Trash2,
} from 'lucide-react';

interface ModelfileItem {
  name: string;
  path: string;
  size: number;
  updatedAt: string;
  fromModel: string;
  parameters: Record<string, string>;
  systemPreview: string;
  lineCount: number;
}

interface ModelfilesTabProps {
  onTriggerBuild: (name: string, content: string) => void;
  onRefreshModels: () => void;
}

export function ModelfilesTab({ onTriggerBuild, onRefreshModels }: ModelfilesTabProps) {
  const [files, setFiles] = useState<ModelfileItem[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // New file modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'coding' | 'agent' | 'computer' | 'blank'>('coding');

  const fetchFiles = async (selectName?: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/modelfiles');
      const data = await res.json();
      if (data.modelfiles) {
        setFiles(data.modelfiles);
        const target = selectName || (data.modelfiles.length > 0 ? data.modelfiles[0].name : null);
        if (target) {
          loadFile(target);
        }
      }
    } catch (err) {
      console.error('Failed to fetch modelfiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (name: string) => {
    try {
      setSelectedFileName(name);
      const res = await fetch(`/api/modelfiles/${encodeURIComponent(name)}`);
      const data = await res.json();
      if (data.content !== undefined) {
        setContent(data.content);
        setOriginalContent(data.content);
        setStatusMessage(null);
      }
    } catch (err) {
      console.error(`Failed to load file ${name}:`, err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const hasUnsavedChanges = content !== originalContent;

  const handleSave = async () => {
    if (!selectedFileName) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/modelfiles/${encodeURIComponent(selectedFileName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok) {
        setOriginalContent(content);
        setStatusMessage({
          text: `안전하게 저장되었습니다 (백업 생성: ${data.backupPath ? data.backupPath.split('/').pop() : '완료'})`,
          type: 'success',
        });
        fetchFiles(selectedFileName);
      } else {
        setStatusMessage({ text: data.error || '저장에 실패했습니다.', type: 'error' });
      }
    } catch (err) {
      setStatusMessage({ text: (err as Error).message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newFileName.trim()) return;
    let initialCode = '';
    if (selectedTemplate === 'coding') {
      initialCode = `FROM gemma4:26b-a4b\nPARAMETER temperature 0.7\nPARAMETER top_p 0.95\nPARAMETER num_ctx 65536\nSYSTEM """당신은 수석 소프트웨어 엔지니어입니다. 고품질 코드를 작성합니다."""\n`;
    } else if (selectedTemplate === 'agent') {
      initialCode = `FROM gemma4:26b-a4b\nPARAMETER temperature 0.3\nPARAMETER top_p 0.9\nPARAMETER num_ctx 65536\nSYSTEM """당신은 자율형 AI 에이전트입니다. 도구 호출과 구조화된 계획을 수립합니다."""\n`;
    } else if (selectedTemplate === 'computer') {
      initialCode = `FROM gemma4:26b-a4b\nPARAMETER temperature 0.2\nPARAMETER num_ctx 32768\nSYSTEM """당신은 시스템 제어 및 CLI 자동화 실행 엔진입니다."""\n`;
    } else {
      initialCode = `FROM gemma4:26b-a4b\nPARAMETER temperature 0.7\nSYSTEM """AI Assistant"""\n`;
    }

    try {
      const res = await fetch('/api/modelfiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFileName.trim(), content: initialCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsNewModalOpen(false);
        setNewFileName('');
        await fetchFiles(data.name);
      } else {
        alert(data.error || '생성 실패');
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const selectedFileMeta = files.find((f) => f.name === selectedFileName);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/50 p-4 dark:border-indigo-950/40 dark:from-indigo-950/20 dark:via-slate-900/40 dark:to-purple-950/20">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
            <FileCode className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
              Custom Modelfiles 매니저
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <code className="rounded bg-slate-200/60 px-1 py-0.5 font-mono text-[11px] dark:bg-slate-800">
                ~/.ollama/custom_modelfiles/
              </code>{' '}
              폴더의 모델 정의 파일을 관리하고 Ollama 모델로 직접 빌드합니다.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>새 Modelfile 생성</span>
        </button>
      </div>

      {/* Main Grid: Sidebar + Editor */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left: Files List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>파일 목록 ({files.length})</span>
              <span className="text-[10px] lowercase font-normal opacity-70">custom_modelfiles</span>
            </div>

            <div className="mt-2 space-y-1.5">
              {loading && files.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">목록을 불러오는 중...</div>
              ) : files.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">등록된 Modelfile이 없습니다.</div>
              ) : (
                files.map((file) => {
                  const isSelected = file.name === selectedFileName;
                  return (
                    <button
                      key={file.name}
                      onClick={() => {
                        if (hasUnsavedChanges) {
                          if (!confirm('저장하지 않은 변경사항이 있습니다. 계속 진행할까요?')) return;
                        }
                        loadFile(file.name);
                      }}
                      className={`group flex w-full flex-col rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/60 shadow-xs dark:border-indigo-500/70 dark:bg-indigo-950/30'
                          : 'border-slate-200/80 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/60 dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`font-mono text-xs font-semibold ${
                            isSelected
                              ? 'text-indigo-700 dark:text-indigo-300'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {file.name}
                        </span>
                        <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {file.lineCount} lines
                        </span>
                      </div>

                      <div className="mt-2 flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="truncate max-w-[150px]">FROM {file.fromModel}</span>
                        <span>•</span>
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                      </div>

                      {file.systemPreview && (
                        <p className="mt-1.5 line-clamp-1 text-[11px] text-slate-400 dark:text-slate-500">
                          {file.systemPreview}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Code Editor & Actions */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          {selectedFileName ? (
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
              {/* Editor Header Bar */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {selectedFileName}
                  </span>
                  {hasUnsavedChanges ? (
                    <span className="flex items-center space-x-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>수정됨 (미저장)</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      <span>동기화됨</span>
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (hasUnsavedChanges && !confirm('변경사항을 취소하고 원본을 다시 불러올까요?')) return;
                      loadFile(selectedFileName);
                    }}
                    title="되돌리기"
                    className="flex items-center space-x-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>되돌리기</span>
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saving || !hasUnsavedChanges}
                    className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all ${
                      hasUnsavedChanges
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{saving ? '저장 중...' : '안전 저장'}</span>
                  </button>

                  <button
                    onClick={() => onTriggerBuild(selectedFileName, content)}
                    className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95"
                  >
                    <Hammer className="h-3.5 w-3.5" />
                    <span>Ollama 모델 빌드</span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              {statusMessage && (
                <div
                  className={`mx-4 mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-xs ${
                    statusMessage.type === 'success'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                  }`}
                >
                  <span>{statusMessage.text}</span>
                  <button onClick={() => setStatusMessage(null)} className="ml-2 opacity-70 hover:opacity-100">
                    ✕
                  </button>
                </div>
              )}

              {/* Editor Workspace */}
              <div className="relative p-4">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  spellCheck={false}
                  className="h-[460px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 p-4 font-mono text-xs leading-relaxed text-slate-800 transition-colors focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-[#070b12] dark:text-slate-200"
                  placeholder="FROM model:tag..."
                />

                {/* Modelfile syntax guide footer */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">구문 키워드:</span>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">FROM</code>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">PARAMETER</code>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">SYSTEM """..."""</code>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">TEMPLATE</code>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">ADAPTER</code>
                  <span className="ml-auto text-[10px] text-slate-400">
                    저장 시 <code>~/.ollama/backup/</code>에 자동 백업됩니다.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-400">좌측 목록에서 Modelfile을 선택하세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Modelfile Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">새 Modelfile 생성</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              파일명(예: <code>Modelfile.new-model</code>)과 시작 템플릿을 선택하세요.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  파일 이름
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Modelfile.my-expert"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  시작 템플릿
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {[
                    { id: 'coding', label: '코딩 특화', desc: 'gemma4:26b 기반 개발자' },
                    { id: 'agent', label: '에이전트', desc: '도구 호출 & 계획 수립' },
                    { id: 'computer', label: 'CLI/컴퓨터', desc: '터미널 및 스크립팅' },
                    { id: 'blank', label: '빈 파일', desc: '기본 템플릿' },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tpl.id as unknown as typeof selectedTemplate)}
                      className={`flex flex-col rounded-xl border p-2.5 text-left transition-all ${
                        selectedTemplate === tpl.id
                          ? 'border-indigo-500 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/40'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {tpl.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{tpl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                취소
              </button>
              <button
                onClick={handleCreateNew}
                disabled={!newFileName.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
              >
                생성하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
