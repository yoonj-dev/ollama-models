'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Code,
  Layout,
  Plus,
  Trash2,
  Check,
  History,
  FileJson,
  ShieldAlert,
} from 'lucide-react';
import { OllamaModel } from './ModelsTab';

interface IntegrationConfig {
  models: string[];
  onboarded?: boolean;
}

interface OllamaConfigData {
  integrations?: Record<string, IntegrationConfig>;
  last_selection?: string;
  [key: string]: unknown;
}

interface ConfigTabProps {
  availableModels: OllamaModel[];
}

export function ConfigTab({ availableModels }: ConfigTabProps) {
  const [configData, setConfigData] = useState<OllamaConfigData | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [originalRawText, setOriginalRawText] = useState<string>('');
  const [backups, setBackups] = useState<string[]>([]);
  const [configPath, setConfigPath] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'visual' | 'json'>('visual');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New integration state
  const [newIntegrationName, setNewIntegrationName] = useState('');
  const [showAddIntegration, setShowAddIntegration] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.exists) {
        setConfigPath(data.path);
        setConfigData(data.config || {});
        const formatted = JSON.stringify(data.config || {}, null, 2);
        setRawText(formatted);
        setOriginalRawText(formatted);
        setBackups(data.backups || []);
        setStatusMessage(null);
      }
    } catch (err) {
      console.error('Failed to fetch config.json:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const hasUnsavedChanges = rawText !== originalRawText;

  // Sync from visual to raw
  const updateConfigData = (newObj: OllamaConfigData) => {
    setConfigData(newObj);
    const jsonStr = JSON.stringify(newObj, null, 2);
    setRawText(jsonStr);
  };

  const handleRawTextChange = (text: string) => {
    setRawText(text);
    try {
      const parsed = JSON.parse(text);
      setConfigData(parsed);
      setStatusMessage(null);
    } catch (err) {
      // JSON is currently invalid while typing
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Validate JSON
      let payloadObj = null;
      try {
        payloadObj = JSON.parse(rawText);
      } catch (err) {
        setStatusMessage({ text: `JSON 문법 오류: ${(err as Error).message}`, type: 'error' });
        setSaving(false);
        return;
      }

      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: payloadObj, format: 'json' }),
      });
      const data = await res.json();
      if (res.ok) {
        setOriginalRawText(rawText);
        setStatusMessage({
          text: `config.json이 안전하게 저장되었습니다 (백업 생성: ${data.backupPath ? data.backupPath.split('/').pop() : '완료'})`,
          type: 'success',
        });
        await fetchConfig();
      } else {
        setStatusMessage({ text: data.error || '저장 실패', type: 'error' });
      }
    } catch (err) {
      setStatusMessage({ text: (err as Error).message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddIntegration = () => {
    const name = newIntegrationName.trim();
    if (!name || !configData) return;
    const currentIntegrations = configData.integrations || {};
    if (currentIntegrations[name]) {
      alert('이미 존재하는 integration 이름입니다.');
      return;
    }
    const updated = {
      ...configData,
      integrations: {
        ...currentIntegrations,
        [name]: {
          models: availableModels.length > 0 ? [availableModels[0].name.split(':')[0]] : ['gemma4-agent'],
          onboarded: true,
        },
      },
    };
    updateConfigData(updated);
    setNewIntegrationName('');
    setShowAddIntegration(false);
  };

  const handleDeleteIntegration = (name: string) => {
    if (!configData || !confirm(`정말 '${name}' integration 설정을 삭제하시겠습니까?`)) return;
    const currentIntegrations = { ...(configData.integrations || {}) };
    delete currentIntegrations[name];
    const updated = {
      ...configData,
      integrations: currentIntegrations,
      last_selection: configData.last_selection === name ? Object.keys(currentIntegrations)[0] || '' : configData.last_selection,
    };
    updateConfigData(updated);
  };

  const handleToggleOnboarded = (name: string) => {
    if (!configData?.integrations?.[name]) return;
    const item = configData.integrations[name];
    const updated = {
      ...configData,
      integrations: {
        ...configData.integrations,
        [name]: {
          ...item,
          onboarded: !item.onboarded,
        },
      },
    };
    updateConfigData(updated);
  };

  const handleToggleModelForIntegration = (integrationName: string, modelName: string) => {
    if (!configData?.integrations?.[integrationName]) return;
    const item = configData.integrations[integrationName];
    const cleanModelName = modelName.split(':')[0]; // strip tag if needed or keep full
    const currentModels = item.models || [];
    let nextModels = [];
    if (currentModels.includes(cleanModelName) || currentModels.includes(modelName)) {
      nextModels = currentModels.filter((m) => m !== cleanModelName && m !== modelName);
    } else {
      nextModels = [...currentModels, cleanModelName];
    }
    const updated = {
      ...configData,
      integrations: {
        ...configData.integrations,
        [integrationName]: {
          ...item,
          models: nextModels,
        },
      },
    };
    updateConfigData(updated);
  };

  const integrations = configData?.integrations || {};

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
              Ollama & Hermes Integration Config
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] dark:bg-slate-800">
                {configPath || '~/.ollama/config.json'}
              </code>{' '}
              설정을 조회하고 Hermes 에이전트 연동 모델과 온보딩 상태를 제어합니다.
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Save Button */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
            <button
              onClick={() => setMode('visual')}
              className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                mode === 'visual'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Layout className="h-3.5 w-3.5" />
              <span>GUI 뷰</span>
            </button>
            <button
              onClick={() => setMode('json')}
              className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                mode === 'json'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              <span>Raw JSON</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className={`flex items-center space-x-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition-all ${
              hasUnsavedChanges
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <Save className="h-4 w-4" />
            <span>{saving ? '저장 중...' : '안전 저장'}</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs ${
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

      {/* Main Workspace */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">설정 파일을 불러오는 중...</div>
      ) : mode === 'visual' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Visual Form */}
          <div className="lg:col-span-8 space-y-4">
            {/* Last Selection Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                기본 활성 선택 (last_selection)
              </label>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Ollama CLI 및 Hermes Agent 실행 시 기본값으로 참조할 프로필입니다.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.keys(integrations).map((name) => (
                  <button
                    key={name}
                    onClick={() => updateConfigData({ ...configData, last_selection: name })}
                    className={`flex items-center space-x-1.5 rounded-xl border px-3 py-1.5 text-xs font-mono font-medium transition-all ${
                      configData?.last_selection === name
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-xs dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                    }`}
                  >
                    {configData?.last_selection === name && <Check className="h-3.5 w-3.5 text-indigo-500" />}
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Integrations List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  연동 프로필 (Integrations)
                </h3>
                <button
                  onClick={() => setShowAddIntegration(true)}
                  className="flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>새 연동 추가</span>
                </button>
              </div>

              {Object.entries(integrations).map(([name, conf]) => (
                <div
                  key={name}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                        {name}
                      </span>
                      {configData?.last_selection === name && (
                        <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleToggleOnboarded(name)}
                        className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                          conf.onboarded
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            conf.onboarded ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{conf.onboarded ? 'Onboarded' : 'Not Onboarded'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteIntegration(name)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Connected Models */}
                  <div className="mt-4">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      연동 모델 (클릭하여 추가/제거)
                    </label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {availableModels.map((m) => {
                        const clean = m.name.split(':')[0];
                        const isConnected =
                          conf.models?.includes(clean) || conf.models?.includes(m.name);
                        return (
                          <button
                            key={m.name}
                            type="button"
                            onClick={() => handleToggleModelForIntegration(name, m.name)}
                            className={`flex items-center space-x-1 rounded-lg border px-2.5 py-1 text-xs font-mono transition-all ${
                              isConnected
                                ? 'border-purple-500 bg-purple-50 font-semibold text-purple-700 dark:border-purple-500/70 dark:bg-purple-950/40 dark:text-purple-300'
                                : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                            }`}
                          >
                            <span>{clean}</span>
                            {isConnected && <Check className="h-3 w-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar: Backup & Safety Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <ShieldAlert className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">안전 백업 보존 정책</h3>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                설정을 저장할 때마다 기존 <code className="font-mono text-[11px]">config.json</code>은 타임스탬프가 부착된 백업 파일로 자동 복사 보관됩니다.
              </p>

              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400">최근 백업 파일 ({backups.length})</span>
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  {backups.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">백업 파일이 없습니다.</p>
                  ) : (
                    backups.map((bk) => (
                      <div
                        key={bk}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-600 dark:bg-slate-950 dark:text-slate-400"
                      >
                        <span className="truncate">{bk}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Raw JSON Editor */
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <FileJson className="h-4 w-4 text-purple-500" />
              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                config.json (Raw JSON Editor)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              저장 시 자동으로 문법 검증 및 백업이 진행됩니다.
            </span>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => handleRawTextChange(e.target.value)}
            spellCheck={false}
            className="mt-3 h-[450px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 p-4 font-mono text-xs leading-relaxed text-slate-800 transition-colors focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-[#070b12] dark:text-slate-200"
          />
        </div>
      )}

      {/* Add Integration Modal */}
      {showAddIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">새 Integration 프로필</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              새로운 연동 이름(예: <code>hermes-cli</code>)을 입력하세요.
            </p>

            <div className="mt-4">
              <input
                type="text"
                value={newIntegrationName}
                onChange={(e) => setNewIntegrationName(e.target.value)}
                placeholder="hermes-cli"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="mt-5 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowAddIntegration(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400"
              >
                취소
              </button>
              <button
                onClick={handleAddIntegration}
                disabled={!newIntegrationName.trim()}
                className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
