'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header, StudioTab } from '@/components/Header';
import { TopologyTab } from '@/components/TopologyTab';
import { ModelfilesTab } from '@/components/ModelfilesTab';
import { ModelsTab, OllamaModel } from '@/components/ModelsTab';
import { ConfigsViewerTab } from '@/components/ConfigsViewerTab';
import { PlaygroundTab } from '@/components/PlaygroundTab';
import { BuildModal } from '@/components/BuildModal';

export default function Home() {
  const [activeTab, setActiveTab] = useState<StudioTab>('topology');
  const [status, setStatus] = useState<{
    online: boolean;
    version?: string | null;
    host?: string;
    modelfileCount?: number;
  }>({
    online: false,
  });
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [playgroundTargetModel, setPlaygroundTargetModel] = useState<string | null>(null);

  // Build modal state
  const [buildModalState, setBuildModalState] = useState<{
    isOpen: boolean;
    fileName: string;
    content: string;
  }>({
    isOpen: false,
    fileName: '',
    content: '',
  });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus({
        online: data.online,
        version: data.version,
        host: data.host,
        modelfileCount: data.modelfileCount,
      });
    } catch {
      setStatus({ online: false });
    }
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch('/api/models');
      const data = await res.json();
      if (data.models) {
        setModels(data.models);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchModels();
  }, [fetchStatus, fetchModels]);

  const handleTriggerBuild = (fileName: string, content: string) => {
    setBuildModalState({
      isOpen: true,
      fileName,
      content,
    });
  };

  const handleSelectForPlayground = (modelName: string) => {
    setPlaygroundTargetModel(modelName);
    setActiveTab('playground');
  };

  const handleSelectModelfile = (name: string) => {
    setActiveTab('modelfiles');
  };

  const handleBuildComplete = () => {
    fetchModels();
    fetchStatus();
  };

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-[#090d16]">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
        onRefreshStatus={() => {
          fetchStatus();
          fetchModels();
        }}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === 'topology' && (
          <TopologyTab
            installedModels={models}
            onSelectModelfile={handleSelectModelfile}
            onSelectPlayground={handleSelectForPlayground}
          />
        )}

        {activeTab === 'modelfiles' && (
          <ModelfilesTab
            onTriggerBuild={handleTriggerBuild}
            onRefreshModels={fetchModels}
          />
        )}

        {activeTab === 'models' && (
          <ModelsTab onSelectForPlayground={handleSelectForPlayground} />
        )}

        {activeTab === 'configs' && (
          <ConfigsViewerTab availableModels={models} />
        )}

        {activeTab === 'playground' && (
          <PlaygroundTab
            availableModels={models}
            initialModel={playgroundTargetModel}
          />
        )}
      </main>

      {/* Build Modal */}
      <BuildModal
        isOpen={buildModalState.isOpen}
        onClose={() => setBuildModalState((prev) => ({ ...prev, isOpen: false }))}
        modelfileName={buildModalState.fileName}
        modelfileContent={buildModalState.content}
        onBuildComplete={handleBuildComplete}
      />
    </div>
  );
}
