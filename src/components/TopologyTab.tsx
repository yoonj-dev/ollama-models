'use client';

import React, { useState, useEffect } from 'react';
import {
  Network,
  Bot,
  Code2,
  Terminal,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  Cpu,
  FileCode,
  HardDrive,
  Check,
} from 'lucide-react';
import { OllamaModel } from './ModelsTab';

interface TopologyTabProps {
  installedModels: OllamaModel[];
  onSelectModelfile: (name: string) => void;
  onSelectPlayground: (name: string) => void;
}

export function TopologyTab({
  installedModels,
  onSelectModelfile,
  onSelectPlayground,
}: TopologyTabProps) {
  const [hermesData, setHermesData] = useState<any>(null);
  const [ollamaConfig, setOllamaConfig] = useState<any>(null);
  const [modelfiles, setModelfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        const [hermesRes, configRes, modelfilesRes] = await Promise.all([
          fetch('/api/hermes').then((r) => r.json()).catch(() => null),
          fetch('/api/config').then((r) => r.json()).catch(() => null),
          fetch('/api/modelfiles').then((r) => r.json()).catch(() => null),
        ]);

        setHermesData(hermesRes);
        setOllamaConfig(configRes?.config || null);
        setModelfiles(modelfilesRes?.modelfiles || []);
      } catch (err) {
        console.error('Failed to load topology data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const installedNames = new Set(installedModels.map((m) => m.name));
  const modelfileNames = new Set(modelfiles.map((m) => m.name));

  const registeredRoles = [
    {
      id: 'agent',
      roleTitle: 'Hermes Master Agent (오케스트레이터)',
      description: '도구 호출, JSON 스키마 준수 및 전체 멀티 에이전트 라우팅 지휘',
      targetModel: 'gemma4-agent:latest',
      modelfile: 'Modelfile.agent',
      icon: Bot,
      color: 'indigo',
      hermesBinding: hermesData?.modelSummary?.defaultModel === 'gemma4-agent:latest',
      delegationDefault: false,
    },
    {
      id: 'coding',
      roleTitle: 'Coding Specialist (수석 엔지니어)',
      description: 'TypeScript, React, Python, 아키텍처 설계, 버그 수정 및 리팩토링',
      targetModel: 'gemma4-coding:latest',
      modelfile: 'Modelfile.coding',
      icon: Code2,
      color: 'emerald',
      hermesBinding: true,
      delegationDefault: hermesData?.modelSummary?.delegationDefault === 'coding',
    },
    {
      id: 'computer',
      roleTitle: 'Computer Use & CLI Automation (시스템 제어)',
      description: 'macOS/Linux 시스템 제어, 쉘 스크립트 실행, 터미널 및 환경 자동화',
      targetModel: 'gemma4-computer:latest',
      modelfile: 'Modelfile.computer',
      icon: Terminal,
      color: 'amber',
      hermesBinding: true,
      delegationDefault: false,
    },
    {
      id: 'daily',
      roleTitle: 'Daily & Text Analyst (문서/번역)',
      description: '한국어 문서 작성, 데이터 분석, 신속 요약 및 일반 질의응답',
      targetModel: 'gemma4-daily:latest',
      modelfile: 'Modelfile.daily',
      icon: FileText,
      color: 'blue',
      hermesBinding: true,
      delegationDefault: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/50 p-5 dark:border-indigo-950/40 dark:from-indigo-950/20 dark:via-slate-900/40 dark:to-purple-950/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Ollama × Hermes 에코시스템 토폴로지
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                실제 Ollama 바이너리 모델, 커스텀 Modelfile 소스, Ollama 연동 설정 및 Hermes Agent의 모델 위임(Delegation) 매핑 상태를 한눈에 조망합니다.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-mono text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              Base: <strong className="text-indigo-600 dark:text-indigo-400">gemma4:26b-a4b</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 4 Pillars Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              1. Ollama 엔진 모델
            </span>
            <Layers className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {installedModels.length}개
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              로컬에 설치되어 서빙 가능한 모델 가중치
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              2. 커스텀 Modelfile
            </span>
            <FileCode className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {modelfiles.length}개 정의
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              <code className="text-[10px]">~/.ollama/custom_modelfiles/</code>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              3. Ollama Config
            </span>
            <Cpu className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {ollamaConfig?.integrations ? Object.keys(ollamaConfig.integrations).length : 0}개 연동
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              선택 프로필: <code className="text-indigo-600 dark:text-indigo-400">{ollamaConfig?.last_selection || 'none'}</code>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              4. Hermes Agent
            </span>
            <Bot className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {hermesData?.modelSummary?.delegationOptions?.length || 0}개 델리게이션
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              기본 모델: <code className="text-indigo-600 dark:text-indigo-400">{hermesData?.modelSummary?.defaultModel?.split(':')[0] || 'none'}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Model Delegation Topology Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            역할별 모델 매핑 및 연동 상태 (Ecosystem Role Mappings)
          </h3>
          <span className="text-[11px] text-slate-400">
            Base: <code className="font-mono">gemma4:26b-a4b</code> (16 GB)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {registeredRoles.map((item) => {
            const Icon = item.icon;
            const isInstalled = installedNames.has(item.targetModel);
            const hasModelfile = modelfileNames.has(item.modelfile);

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.roleTitle}
                        </h4>
                        <div className="mt-0.5 flex items-center space-x-1.5 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                          <span>{item.targetModel}</span>
                          {item.delegationDefault && (
                            <span className="rounded bg-emerald-50 px-1 py-0.2 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              Default Route
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Binding Inspection Badges */}
                  <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-950/60">
                    {/* Ollama Engine Installed */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Ollama 바이너리 등록:</span>
                      {isInstalled ? (
                        <span className="flex items-center space-x-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>설치됨 (Ready)</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 font-semibold text-amber-600 dark:text-amber-400">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>미빌드 (Build 필요)</span>
                        </span>
                      )}
                    </div>

                    {/* Modelfile Source */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">소스 파일:</span>
                      <button
                        onClick={() => onSelectModelfile(item.modelfile)}
                        className="flex items-center space-x-1 font-mono text-[11px] text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        <span>{item.modelfile}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Hermes config.yaml Binding */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Hermes 바인딩:</span>
                      <span className="flex items-center space-x-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                        <span>config.yaml 연동됨</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    onClick={() => onSelectModelfile(item.modelfile)}
                    className="flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                  >
                    <FileCode className="h-3.5 w-3.5" />
                    <span>Modelfile 보기</span>
                  </button>

                  <button
                    onClick={() => onSelectPlayground(item.targetModel)}
                    className="flex items-center space-x-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                  >
                    <span>Playground 테스트</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
