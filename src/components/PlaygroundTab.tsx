'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PlayCircle,
  Send,
  Bot,
  User,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { OllamaModel } from './ModelsTab';

interface PlaygroundTabProps {
  availableModels: OllamaModel[];
  initialModel?: string | null;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function PlaygroundTab({ availableModels, initialModel }: PlaygroundTabProps) {
  const [selectedModel, setSelectedModel] = useState<string>(
    initialModel || (availableModels[0] ? availableModels[0].name : '')
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialModel) {
      setSelectedModel(initialModel);
    } else if (!selectedModel && availableModels.length > 0) {
      setSelectedModel(availableModels[0].name);
    }
  }, [initialModel, availableModels]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputPrompt.trim() || !selectedModel || isStreaming) return;

    const userMsg: Message = { role: 'user', content: inputPrompt.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputPrompt('');
    setIsStreaming(true);

    // Prepare payload
    const payloadMessages: Message[] = [];
    if (systemPrompt.trim()) {
      payloadMessages.push({ role: 'system', content: systemPrompt.trim() });
    }
    payloadMessages.push(...newMessages);

    // Add empty assistant response to stream into
    const assistantIndex = newMessages.length;
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: payloadMessages,
          options: {
            temperature: Number(temperature),
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = {
            role: 'assistant',
            content: `[오류] ${err.error || '응답을 받아오지 못했습니다.'}`,
          };
          return updated;
        });
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setIsStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

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
            if (data.message?.content) {
              accumulatedContent += data.message.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIndex] = {
                  role: 'assistant',
                  content: accumulatedContent,
                };
                return updated;
              });
            }
          } catch {
            // Ignore parse chunk
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantIndex] = {
          role: 'assistant',
          content: `[통신 오류] ${(err as Error).message}`,
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const handleResetChat = () => {
    if (messages.length > 0 && !confirm('대화 내용을 초기화하시겠습니까?')) return;
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] min-h-[550px] space-y-3">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center space-x-2">
          <PlayCircle className="h-4 w-4 text-indigo-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            테스트 대상 모델:
          </span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            {availableModels.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center space-x-1 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
              showSettings
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500/70 dark:bg-indigo-950/40 dark:text-indigo-300'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>파라미터 설정</span>
          </button>

          <button
            onClick={handleResetChat}
            disabled={messages.length === 0}
            className="flex items-center space-x-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>대화 초기화</span>
          </button>
        </div>
      </div>

      {/* Optional Settings Panel */}
      {showSettings && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              System Prompt Override
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="모델의 기본 시스템 프롬프트를 덮어씌울 내용을 입력하세요."
              className="mt-1.5 h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Temperature
              </label>
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {temperature}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.5"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="mt-3 w-full accent-indigo-600"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>0.0 (결정론적 / 정밀함)</span>
              <span>1.0 (창의적)</span>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages Workspace */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {selectedModel || '선택된 모델'} 모델 플레이그라운드
            </h4>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              Modelfile을 수정한 후 모델이 지침대로 올바르게 답변하는지 실시간으로 대화하며 즉시 테스트할 수 있습니다.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`group relative max-w-2xl rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-200/90 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-[#070b12] dark:text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {!isUser && msg.content && (
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="absolute -top-2 right-2 rounded-lg border border-slate-200 bg-white p-1 text-slate-400 opacity-0 shadow-xs transition-opacity group-hover:opacity-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                      title="답변 복사"
                    >
                      {copiedIdx === idx ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>

                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="relative">
        <textarea
          rows={2}
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`${selectedModel || '선택된 모델'}에게 질문을 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)`}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white py-3 pl-4 pr-14 text-xs text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
        <button
          onClick={handleSend}
          disabled={!inputPrompt.trim() || isStreaming || !selectedModel}
          className="absolute right-2.5 bottom-3.5 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs transition-all hover:bg-indigo-700 disabled:opacity-40"
        >
          {isStreaming ? (
            <Zap className="h-4 w-4 animate-pulse" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
