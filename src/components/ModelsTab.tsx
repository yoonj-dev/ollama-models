'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  RefreshCw,
  Trash2,
  Copy,
  Play,
  Info,
  CheckCircle2,
  HardDrive,
  Calendar,
  Cpu,
  AlertTriangle,
  X,
} from 'lucide-react';

interface ModelDetails {
  parent_model?: string;
  format?: string;
  family?: string;
  families?: string[];
  parameter_size?: string;
  quantization_level?: string;
}

export interface OllamaModel {
  name: string;
  model?: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: ModelDetails;
  isRunning?: boolean;
  runningInfo?: {
    size_vram?: number;
    expires_at?: string;
  };
}

interface ModelsTabProps {
  onSelectForPlayground: (modelName: string) => void;
}

export function ModelsTab({ onSelectForPlayground }: ModelsTabProps) {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<OllamaModel | null>(null);
  const [modelDetails, setModelDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy modal
  const [copySource, setCopySource] = useState<string | null>(null);
  const [copyDest, setCopyDest] = useState('');
  const [isCopying, setIsCopying] = useState(false);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/models');
      const data = await res.json();
      if (data.models) {
        setModels(data.models);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const openDetails = async (model: OllamaModel) => {
    setSelectedModel(model);
    try {
      setDetailsLoading(true);
      const res = await fetch('/api/models/show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model.name }),
      });
      const data = await res.json();
      setModelDetails(data);
    } catch (err) {
      console.error('Failed to load model details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await fetch('/api/models', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deleteTarget }),
      });
      if (res.ok) {
        setDeleteTarget(null);
        await fetchModels();
      } else {
        const err = await res.json();
        alert(err.error || '삭제 실패');
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = async () => {
    if (!copySource || !copyDest.trim()) return;
    try {
      setIsCopying(true);
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: copySource, destination: copyDest.trim() }),
      });
      if (res.ok) {
        setCopySource(null);
        setCopyDest('');
        await fetchModels();
      } else {
        const err = await res.json();
        alert(err.error || '복제 실패');
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsCopying(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    return `${(bytes / 1e3).toFixed(1)} KB`;
  };

  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="설치된 모델 검색..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end space-x-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            총 {models.length}개 모델
          </span>
          <button
            onClick={fetchModels}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {/* Models Grid */}
      {loading && models.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">모델 목록을 불러오는 중...</div>
      ) : filteredModels.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">검색 조건에 맞는 모델이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((model) => (
            <div
              key={model.name}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-mono text-xs font-bold text-slate-900 dark:text-white" title={model.name}>
                      {model.name}
                    </h3>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400 font-mono">
                      {model.digest ? model.digest.slice(0, 14) : ''}...
                    </p>
                  </div>
                  {model.isRunning ? (
                    <span className="flex items-center space-x-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Active</span>
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2 text-[11px] dark:bg-slate-950/60">
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
                    <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatSize(model.size)}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
                    <Cpu className="h-3.5 w-3.5 text-slate-400" />
                    <span>{model.details?.format || 'safetensors'}</span>
                  </div>
                  <div className="col-span-2 flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 text-[10px]">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>{new Date(model.modified_at).toLocaleString('ko-KR')}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
                <button
                  onClick={() => openDetails(model)}
                  className="flex items-center space-x-1 text-xs font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  <Info className="h-3.5 w-3.5" />
                  <span>스펙/설정</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setCopySource(model.name);
                      setCopyDest(`${model.name.split(':')[0]}:copy`);
                    }}
                    title="모델 복제"
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onSelectForPlayground(model.name)}
                    title="Playground에서 테스트"
                    className="flex items-center space-x-1 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>테스트</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(model.name)}
                    title="모델 삭제"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Model Details Modal */}
      {selectedModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-indigo-500" />
                <h3 className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {selectedModel.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedModel(null);
                  setModelDetails(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {detailsLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">모델 정보를 불러오는 중...</div>
              ) : modelDetails ? (
                <>
                  {/* System Prompt */}
                  {modelDetails.system && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        System Prompt
                      </h4>
                      <pre className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 font-mono text-xs text-slate-800 dark:bg-[#070b12] dark:text-slate-200">
                        {modelDetails.system}
                      </pre>
                    </div>
                  )}

                  {/* Modelfile Raw */}
                  {modelDetails.modelfile && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Modelfile 원문
                      </h4>
                      <pre className="mt-1.5 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 font-mono text-xs text-slate-800 dark:bg-[#070b12] dark:text-slate-200">
                        {modelDetails.modelfile}
                      </pre>
                    </div>
                  )}

                  {/* Parameters */}
                  {modelDetails.parameters && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Parameters
                      </h4>
                      <pre className="mt-1.5 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 font-mono text-xs text-slate-800 dark:bg-[#070b12] dark:text-slate-200">
                        {modelDetails.parameters}
                      </pre>
                    </div>
                  )}

                  {/* Template */}
                  {modelDetails.template && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Chat Template
                      </h4>
                      <pre className="mt-1.5 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 font-mono text-[11px] text-slate-700 dark:bg-[#070b12] dark:text-slate-300">
                        {modelDetails.template}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">세부 정보를 불러올 수 없습니다.</div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 px-5 py-3 dark:border-slate-800">
              <button
                onClick={() => {
                  setSelectedModel(null);
                  setModelDetails(null);
                }}
                className="rounded-xl bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose-200 bg-white p-5 shadow-2xl dark:border-rose-900/60 dark:bg-slate-900">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">모델 삭제 확인</h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
              정말로 <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">{deleteTarget}</span> 모델을 Ollama에서 영구 삭제하시겠습니까?
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              (커스텀 Modelfile 소스 파일은 보존되며, Ollama 내부 바이너리 레이어만 삭제됩니다.)
            </p>

            <div className="mt-5 flex items-center justify-end space-x-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? '삭제 중...' : '삭제 실행'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Model Modal */}
      {copySource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">모델 복제 (Copy)</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              <code className="font-mono font-semibold">{copySource}</code> 모델을 새로운 태그로 복제합니다.
            </p>

            <div className="mt-4">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                대상 모델 이름 / 태그
              </label>
              <input
                type="text"
                value={copyDest}
                onChange={(e) => setCopyDest(e.target.value)}
                placeholder="my-model:v2"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="mt-5 flex items-center justify-end space-x-2">
              <button
                onClick={() => setCopySource(null)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400"
              >
                취소
              </button>
              <button
                onClick={handleCopy}
                disabled={isCopying || !copyDest.trim()}
                className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isCopying ? '복제 중...' : '복제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
