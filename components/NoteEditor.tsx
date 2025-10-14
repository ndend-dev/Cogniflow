import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Note, AISummary } from '../types';
import { EditIcon, PreviewIcon, ColumnsIcon, MagicIcon, PlusIcon } from './icons';
import { MarkdownToolbar } from './MarkdownToolbar';
import { MarkdownPreview } from './MarkdownPreview';
import { summarizeNoteContent } from '../services/geminiService';
import { Modal } from './Modal';
import { useUndo } from '../hooks/useUndo';
import { AINoteGeneratorModal } from './AINoteGeneratorModal';
import { useToast } from '../hooks/useToast';

interface AISummaryViewProps {
    summary: AISummary;
    onAddFlashcard: (front: string, back: string) => void;
    t: (key: string, options?: { [key: string]: string | number }) => string;
    addToast: (message: string) => void;
}

const AISummaryView: React.FC<AISummaryViewProps> = ({ summary, onAddFlashcard, t, addToast }) => (
    <div className="space-y-6">
        <div>
            <h3 className="text-xl font-bold mb-2 text-[--color-primary]">{t('modals.summaryHeader')}</h3>
            <p className="text-[--color-text-base]">{summary.summary}</p>
        </div>
        <div>
            <h3 className="text-xl font-bold mb-2 text-[--color-primary]">{t('modals.keyPointsHeader')}</h3>
            <ul className="list-disc list-inside space-y-1 text-[--color-text-base]">
                {summary.keyPoints.map((point, index) => <li key={index}>{point}</li>)}
            </ul>
        </div>
        <div>
            <h3 className="text-xl font-bold mb-2 text-[--color-primary]">{t('modals.flashcardsHeader')}</h3>
            <div className="space-y-3">
                {summary.flashcards.map((card, index) => (
                    <div key={index} className="bg-[--color-bg] p-3 rounded-md border border-[--color-border] flex justify-between items-center">
                        <div>
                            <p><strong>{t('modals.flashcardFront')}:</strong> {card.front}</p>
                            <p><strong>{t('modals.flashcardBack')}:</strong> {card.back}</p>
                        </div>
                        <button
                            onClick={() => {
                                onAddFlashcard(card.front, card.back);
                                addToast(t('app.flashcardAdded'));
                            }}
                            className="bg-[--color-primary]/20 text-[--color-primary] hover:bg-[--color-primary]/30 font-semibold py-1 px-3 rounded-md text-sm transition-colors"
                        >
                            {t('modals.addFlashcard')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
);


interface NoteEditorProps {
  note: Note;
  onUpdateNote: (id: string, title: string, content: string) => void;
  onGenerateAIContent: (title: string, userPrompt: string) => Promise<{title: string; content: string}>;
  onAddFlashcard: (front: string, back: string, sourceNoteId: string) => void;
  onInternalLinkClick: (noteTitle: string) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, onUpdateNote, onGenerateAIContent, onAddFlashcard, onInternalLinkClick, t }) => {
  const [title, setTitle] = useState(note.title);
  const [contentState, setContent, undoContent, redoContent, resetContent] = useUndo(note.content);
  const content = contentState.present;

  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview'>('split');
  const [isAISummaryOpen, setAISummaryOpen] = useState(false);
  const [isAIGeneratorOpen, setAIGeneratorOpen] = useState(false);
  const [aiSummary, setAISummary] = useState<AISummary | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const { addToast } = useToast();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(note.title);
    resetContent(note.content);
  }, [note.id, resetContent]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (note.title !== title || note.content !== content) {
        onUpdateNote(note.id, title, content);
      }
    }, 500); // Debounce save

    return () => clearTimeout(handler);
  }, [title, content, note, onUpdateNote]);
  
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, [setContent]);

  const handleSummarize = async () => {
    setAISummaryOpen(true);
    setIsSummarizing(true);
    setAIError(null);
    setAISummary(null);
    try {
      const result = await summarizeNoteContent(content);
      setAISummary(result);
    } catch (error) {
      setAIError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSummarizing(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
            e.preventDefault();
            undoContent();
        } else if (e.key === 'y' || (e.key === 'Z' && e.shiftKey)) {
            e.preventDefault();
            redoContent();
        }
    }
  };

  const insertGeneratedContent = useCallback((generatedContent: string) => {
    const textarea = textareaRef.current;
    if (!textarea) { // fallback if no textarea (e.g. preview mode)
      handleContentChange(content + '\n' + generatedContent);
      return;
    }
    const start = textarea.selectionStart;
    const newContent = content.substring(0, start) + generatedContent + content.substring(start);
    handleContentChange(newContent);
  }, [content, handleContentChange]);

  const handleAIGenerate = async (genTitle: string, prompt: string, mode: 'replace' | 'insert') => {
    const { title: newTitle, content: newContent } = await onGenerateAIContent(genTitle, prompt);
    if (mode === 'replace') {
        setTitle(newTitle);
        handleContentChange(newContent);
    } else {
        insertGeneratedContent(newContent);
    }
  };


  return (
    <div className="flex flex-col h-full bg-[--color-bg]">
        <div className="p-4 border-b border-[--color-border] flex-shrink-0">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('noteEditor.titlePlaceholder')}
                className="w-full bg-transparent text-2xl md:text-3xl font-bold text-[--color-text-base] focus:outline-none"
            />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 border-b border-[--color-border] flex-shrink-0 gap-2">
            <div className="flex items-center space-x-1 p-1 bg-[--color-panel-bg] rounded-lg">
                <button onClick={() => setViewMode('edit')} title={t('noteEditor.viewEdit')} className={`p-2 rounded-md transition-colors ${viewMode === 'edit' ? 'bg-[--color-primary] text-[--color-primary-text]' : 'hover:bg-[--color-panel-hover-bg]'}`}><EditIcon className="w-5 h-5"/></button>
                <button onClick={() => setViewMode('split')} title={t('noteEditor.viewSplit')} className={`p-2 rounded-md transition-colors ${viewMode === 'split' ? 'bg-[--color-primary] text-[--color-primary-text]' : 'hover:bg-[--color-panel-hover-bg]'}`}><ColumnsIcon className="w-5 h-5"/></button>
                <button onClick={() => setViewMode('preview')} title={t('noteEditor.viewPreview')} className={`p-2 rounded-md transition-colors ${viewMode === 'preview' ? 'bg-[--color-primary] text-[--color-primary-text]' : 'hover:bg-[--color-panel-hover-bg]'}`}><PreviewIcon className="w-5 h-5"/></button>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => setAIGeneratorOpen(true)}
                className="flex items-center gap-2 bg-transparent border border-[--color-border] hover:bg-[--color-panel-hover-bg] text-[--color-text-base] font-semibold py-2 px-3 rounded-md transition-colors text-sm"
              >
                <PlusIcon className="w-4 h-4" />
                {t('noteEditor.generateAI')}
              </button>
              <button
                onClick={handleSummarize}
                disabled={isSummarizing || !content.trim()}
                className="flex items-center gap-2 bg-[--color-primary]/20 hover:bg-[--color-primary]/30 text-[--color-primary] font-semibold py-2 px-3 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MagicIcon className="w-4 h-4" />
                {isSummarizing ? t('noteEditor.generating') : t('noteEditor.summarizeAI')}
              </button>
            </div>
        </div>

        {viewMode !== 'preview' && <MarkdownToolbar textareaRef={textareaRef} content={content} onContentChange={handleContentChange} t={t} />}

        <div className="flex-grow flex overflow-hidden">
            {/* Editor Pane: Shown in 'edit' and 'split' modes. On mobile, 'split' takes full width. */}
            {(viewMode === 'edit' || viewMode === 'split') && (
                <div className={`relative h-full ${viewMode === 'edit' ? 'w-full' : 'w-full md:w-1/2'}`}>
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => handleContentChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full h-full p-4 bg-transparent text-[--color-text-base] resize-none focus:outline-none"
                        placeholder={t('noteEditor.contentPlaceholder')}
                    />
                </div>
            )}

            {/* Divider: Shown only in 'split' mode on desktop */}
            {viewMode === 'split' && <div className="w-px bg-[--color-border] h-full hidden md:block"></div>}

            {/* Preview Pane: Shown in 'preview' and 'split' modes. On mobile, 'split' is hidden. */}
            {(viewMode === 'preview' || viewMode === 'split') && (
                <div className={`h-full overflow-y-auto p-4 ${viewMode === 'preview' ? 'w-full' : 'hidden md:block md:w-1/2'}`}>
                    <MarkdownPreview 
                        markdown={content} 
                        onContentChange={handleContentChange}
                        onInternalLinkClick={onInternalLinkClick}
                    />
                </div>
            )}
        </div>

        <Modal isOpen={isAISummaryOpen} onClose={() => setAISummaryOpen(false)} title={t('noteEditor.summarizeAI')}>
            {isSummarizing && <div className="text-center">{t('modals.summaryGenerating')}</div>}
            {aiError && <div className="text-red-500 bg-red-100 p-3 rounded-md">{aiError}</div>}
            {aiSummary && <AISummaryView summary={aiSummary} onAddFlashcard={(front, back) => onAddFlashcard(front, back, note.id)} t={t} addToast={addToast} />}
        </Modal>

        <AINoteGeneratorModal 
            isOpen={isAIGeneratorOpen}
            onClose={() => setAIGeneratorOpen(false)}
            noteTitle={title}
            onGenerate={handleAIGenerate}
            t={t}
        />
    </div>
  );
};