import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';

type GenerationMode = 'replace' | 'insert';

interface AINoteGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle: string;
  onGenerate: (title: string, prompt: string, mode: GenerationMode) => Promise<void>;
  t: (key: string) => string;
}

export const AINoteGeneratorModal: React.FC<AINoteGeneratorModalProps> = ({ isOpen, onClose, noteTitle, onGenerate, t }) => {
  const [title, setTitle] = useState(noteTitle);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<GenerationMode>('replace');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(noteTitle);
      setPrompt('');
      setMode('replace');
      setIsGenerating(false);
    }
  }, [isOpen, noteTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
        alert(t('noteEditor.generateContentTitleMissing'));
        return;
    }
    setIsGenerating(true);
    try {
        await onGenerate(title, prompt, mode);
        onClose();
    } catch (error) {
        // Error is handled in the parent component
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('modals.generateAITitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="ai-note-title" className="block text-sm font-medium text-[--color-text-muted] mb-1">
            {t('modals.generateTopicLabel')}
          </label>
          <input
            id="ai-note-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('noteEditor.titlePlaceholder')}
            className="w-full bg-[--color-bg] text-lg text-[--color-text-base] focus:outline-none focus:ring-2 focus:ring-[--color-primary] rounded-md p-3"
          />
        </div>

        <div>
            <label htmlFor="ai-note-prompt" className="block text-sm font-medium text-[--color-text-muted] mb-1">
                {t('modals.generatePromptLabel')}
            </label>
            <textarea
                id="ai-note-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder={t('modals.generatePromptPlaceholder')}
                className="w-full bg-[--color-bg] text-base text-[--color-text-base] focus:outline-none focus:ring-2 focus:ring-[--color-primary] rounded-md p-3 resize-y"
            />
        </div>
        
        <div>
            <span className="block text-sm font-medium text-[--color-text-muted] mb-2">{t('modals.generateModeLabel')}</span>
            <div className="flex items-center gap-4 rounded-md bg-[--color-bg] p-1">
                <button
                    type="button"
                    onClick={() => setMode('replace')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${mode === 'replace' ? 'bg-[--color-primary] text-[--color-primary-text]' : 'hover:bg-[--color-panel-hover-bg]'}`}
                >
                    {t('modals.generateModeReplace')}
                </button>
                <button
                    type="button"
                    onClick={() => setMode('insert')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${mode === 'insert' ? 'bg-[--color-primary] text-[--color-primary-text]' : 'hover:bg-[--color-panel-hover-bg]'}`}
                >
                    {t('modals.generateModeInsert')}
                </button>
            </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="bg-[--color-panel-hover-bg] hover:bg-[--color-border] text-[--color-text-base] font-bold py-2 px-4 rounded-md transition-colors mr-2">
            {t('modals.cancel')}
          </button>
          <button type="submit" disabled={isGenerating} className="bg-[--color-primary] hover:bg-[--color-primary-hover] text-[--color-primary-text] font-bold py-2 px-4 rounded-md transition-colors disabled:bg-[--color-text-muted] disabled:opacity-60 disabled:cursor-not-allowed">
            {isGenerating ? t('noteEditor.generating') : t('modals.generateButton')}
          </button>
        </div>
      </form>
    </Modal>
  );
};