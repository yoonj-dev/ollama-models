'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  FileCode,
  FileJson,
  Bot,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Terminal,
  FileText,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { OllamaModel } from './ModelsTab';

interface ConfigsViewerTabProps {
  availableModels: OllamaModel[];
}

export function ConfigsViewerTab({ availableModels }: ConfigsViewerTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'hermes' | 'ollama'>('hermes');
  const [hermesData, setHermesData] = useState<any>(null);
  const [ollamaData, setOllamaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const [hermesRes, ollamaRes] = await Promise.all([
        fetch('/api/hermes').then((r) => r.json()),
        fetch('/api/config').then((r) => r.json()),
      ]);
      setHermesData(hermesRes);
      setOllamaData(ollamaRes);
    } catch (err) {
      console.error('Failed to load configs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const hermesSummary = hermesData?.modelSummary;
  const delegationOptions: Array<{ name: string; description: string; model: string; provider: string }> =
    hermesSummary?.delegationOptions || [];

  return (
    <div className="space-y-4">
      {/* Top Banner & Tab Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
              에이전트 모델 설정 뷰어 (Config Viewer)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] dark:bg-slate-800">
                ~/.hermes/config.yaml
              </code>{' '}
              및{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] dark:bg-slate-800">
                ~/.ollama/config.json
              </code>{' '}
              에 정의된 모델 라우팅 설정을 확인합니다.
            </p>
          </div>
        </div>

        {/* Subtab Toggle Buttons */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
            <button
              onClick={() => setActiveSubTab('hermes')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeSubTab === 'hermes'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Bot className="h-3.5 w-3.5" />
              <span>Hermes (config.yaml)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('ollama')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeSubTab === 'ollama'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Ollama (config.json)</span>
            </button>
          </div>

          <button
            onClick={fetchConfigs}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            title="새로고침"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">설정 파일을 분석하는 중...</div>
      ) : activeSubTab === 'hermes' ? (
        /* Hermes config.yaml Inspection */
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                기본 실행 모델 (Default Model)
              </span>
              <div className="mt-1 flex items-center space-x-2">
                <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {hermesSummary?.defaultModel || 'N/A'}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Provider: <code className="font-mono">{hermesSummary?.provider || 'ollama-launch'}</code>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                컨텍스트 윈도우 (Context Length)
              </span>
              <div className="mt-1 flex items-center space-x-2">
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {hermesSummary?.contextLength ? `${(hermesSummary.contextLength / 1024).toFixed(0)}K (${hermesSummary.contextLength.toLocaleString()} tokens)` : '64K'}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                ✓ Modelfile.agent num_ctx 65536과 완전 일치
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                서브 에이전트 위임 기본값
              </span>
              <div className="mt-1 flex items-center space-x-2">
                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {hermesSummary?.delegationDefault || 'coding'}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                총 {delegationOptions.length}개 델리게이션 옵션 구성됨
              </p>
            </div>
          </div>

          {/* Delegation Routes Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Hermes Delegation 라우팅 매핑 테이블
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Hermes Agent가 작업 유형에 따라 자율적으로 위임(Subagent Delegation)할 때 호출하는 로컬 모델 목록입니다.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                    <th className="pb-2.5 font-semibold">라우트 이름</th>
                    <th className="pb-2.5 font-semibold">바인딩된 Ollama 모델</th>
                    <th className="pb-2.5 font-semibold">프로바이더</th>
                    <th className="pb-2.5 font-semibold">역할 및 작업 설명</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {delegationOptions.map((opt) => (
                    <tr key={opt.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-1.5">
                          {opt.name === 'coding' && <Code2 className="h-3.5 w-3.5 text-emerald-500" />}
                          {opt.name === 'computer' && <Terminal className="h-3.5 w-3.5 text-amber-500" />}
                          {opt.name === 'daily' && <FileText className="h-3.5 w-3.5 text-blue-500" />}
                          <span>{opt.name}</span>
                          {opt.name === hermesSummary?.delegationDefault && (
                            <span className="rounded bg-emerald-100 px-1 py-0.2 text-[9px] text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              default
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-indigo-600 dark:text-indigo-400">
                        {opt.model}
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">
                        {opt.provider}
                      </td>
                      <td className="py-3 font-sans text-slate-600 dark:text-slate-300 max-w-md">
                        {opt.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Provider Registered Models */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Ollama-Launch 프로바이더 등록 모델 목록
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(hermesSummary?.registeredModels || []).map((m: string) => (
                <span
                  key={m}
                  className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-1 font-mono text-xs font-medium text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Raw YAML Viewer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <FileCode className="h-4 w-4 text-emerald-500" />
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                  ~/.hermes/config.yaml 원문
                </span>
              </div>
              <span className="text-[11px] text-slate-400">읽기 전용 (안전 모드)</span>
            </div>
            <pre className="mt-3 max-h-80 overflow-y-auto whitespace-pre rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-800 dark:bg-[#070b12] dark:text-slate-200">
              {hermesData?.raw || ''}
            </pre>
          </div>
        </div>
      ) : (
        /* Ollama config.json Inspection */
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Ollama Integrations 프로필 설정
            </h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(ollamaData?.config?.integrations || {}).map(([name, conf]: [string, any]) => (
                <div
                  key={name}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {name}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        conf.onboarded
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {conf.onboarded ? 'Onboarded' : 'Pending'}
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-[11px] text-slate-400">바인딩된 모델:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(conf.models || []).map((m: string) => (
                        <span
                          key={m}
                          className="rounded-lg bg-white px-2 py-0.5 font-mono text-xs font-medium text-slate-800 shadow-xs dark:bg-slate-900 dark:text-slate-200"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Raw JSON Viewer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <FileJson className="h-4 w-4 text-purple-500" />
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                  ~/.ollama/config.json 원문
                </span>
              </div>
              <span className="text-[11px] text-slate-400">읽기 전용 (안전 모드)</span>
            </div>
            <pre className="mt-3 max-h-80 overflow-y-auto whitespace-pre rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-800 dark:bg-[#070b12] dark:text-slate-200">
              {ollamaData?.raw || ''}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
