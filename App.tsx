import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopToolbar } from './components/TopToolbar';
import { NoteEditor } from './components/NoteEditor';
import { GraphView } from './components/GraphView';
import { FlashcardView } from './components/FlashcardView';
import { BlockOverview } from './components/BlockOverview';
import { SettingsPanel } from './components/SettingsPanel';
import { ContextMenu } from './components/ContextMenu';
import { NewBlockModal } from './components/NewBlockModal';
import { PromptModal } from './components/Modal';
import { MatrixBackground } from './components/MatrixBackground';
import { DirectoryPicker } from './components/DirectoryPicker';

import { useDataManager } from './hooks/useDataManager';
import { useSettings } from './hooks/useSettings';
import { useTranslation } from './hooks/useTranslation';
import { ToastProvider } from './hooks/useToast';

import { ViewMode, TreeItem, Note, Block, ContextMenuProps } from './types';
import { generateNoteContent } from './services/geminiService';

const App: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation(settings.language);

  const {
    blocks,
    notes,
    flashcards,
    addBlock,
    deleteBlock,
    addNote,
    updateNote,
    deleteNote,
    addFlashcard,
    moveItem,
    storageMode,
    initializeFileSystemStorage,
    isLoading
  } = useDataManager();

  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.EDITOR);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isNewBlockModalOpen, setNewBlockModalOpen] = useState(false);
  const [promptModalState, setPromptModalState] = useState<{ isOpen: boolean, title: string, message: string, defaultValue?: string, onSubmit: (value: string) => void }>({ isOpen: false, title: '', message: '', onSubmit: () => {} });
  const [contextMenu, setContextMenu] = useState<Omit<ContextMenuProps, 'onClose'> | null>(null);
  const [isInitialSelectionDone, setIsInitialSelectionDone] = useState(false);

  useEffect(() => {
    if (isLoading || isInitialSelectionDone) return;

    if (!activeNoteId && !activeBlockId) {
      const welcomeNote = notes.find(n => n.id === 'note-welcome');
      const welcomeBlock = blocks.find(b => b.id === 'block-welcome');
      
      if (welcomeNote) {
        setActiveNoteId(welcomeNote.id);
        setActiveBlockId(welcomeNote.blockId);
        setActiveView(ViewMode.EDITOR);
        setIsInitialSelectionDone(true);
      } else if (notes.length > 0) {
        const firstNote = notes[0];
        setActiveNoteId(firstNote.id);
        setActiveBlockId(firstNote.blockId);
        setActiveView(ViewMode.EDITOR);
        setIsInitialSelectionDone(true);
      } else if (welcomeBlock) {
        setActiveBlockId(welcomeBlock.id);
        setActiveView(ViewMode.BLOCK_OVERVIEW);
        setIsInitialSelectionDone(true);
      } else if (blocks.length > 0) {
        const firstBlock = blocks[0];
        setActiveBlockId(firstBlock.id);
        setActiveView(ViewMode.BLOCK_OVERVIEW);
        setIsInitialSelectionDone(true);
      }
    }
  }, [notes, blocks, activeNoteId, activeBlockId, isInitialSelectionDone, isLoading]);


  const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId), [notes, activeNoteId]);

  const handleSelectItem = useCallback((item: TreeItem) => {
    if ('parentId' in item) { // It's a Note
      setActiveNoteId(item.id);
      setActiveBlockId(item.blockId);
      setActiveView(ViewMode.EDITOR);
    } else { // It's a Block
      setActiveBlockId(item.id);
      setActiveView(ViewMode.BLOCK_OVERVIEW);
      setActiveNoteId(null);
    }
    setSidebarOpen(false); // Close sidebar on mobile after selection
  }, []);

  const handleCreateBlock = useCallback((title: string) => {
    const newBlock = addBlock(title);
    handleSelectItem(newBlock);
  }, [addBlock, handleSelectItem]);

  const handleAddNote = useCallback((parentId: string | null = null, blockId?: string) => {
    const currentBlockId = blockId || (activeNote ? activeNote.blockId : activeBlockId);
    if (!currentBlockId) {
        if (blocks.length > 0) {
            const newNote = addNote(t('sidebar.newNote'), '', blocks[0].id, parentId);
            handleSelectItem(newNote);
        } else {
            const newBlock = addBlock(t('sidebar.newBlock'));
            const newNote = addNote(t('sidebar.newNote'), '', newBlock.id, parentId);
            handleSelectItem(newNote);
        }
        return;
    };
    const newNote = addNote(t('sidebar.newNote'), '', currentBlockId, parentId);
    handleSelectItem(newNote);
  }, [activeNote, activeBlockId, addNote, addBlock, blocks, handleSelectItem, t]);

  const handleNodeClick = useCallback((noteId: string) => {
      const note = notes.find(n => n.id === noteId);
      if (note) handleSelectItem(note);
  }, [notes, handleSelectItem]);

  const handleInternalLinkClick = useCallback((noteTitle: string) => {
    const note = notes.find(n => n.title.trim().toLowerCase() === noteTitle.trim().toLowerCase());
    if (note) {
      handleSelectItem(note);
    } else {
      alert(t('app.noteNotFound', { noteTitle }));
    }
  }, [notes, handleSelectItem, t]);

  const handleGenerateAIContent = useCallback(async (title: string, userPrompt: string): Promise<{title: string; content: string}> => {
    try {
        return await generateNoteContent(title, userPrompt);
    } catch (error) {
        alert(error instanceof Error ? error.message : String(error));
        throw error;
    }
  }, []);

  const handleOpenContextMenu = (e: React.MouseEvent, item: TreeItem | null) => {
      e.preventDefault();
      e.stopPropagation();

      let menuItems: ContextMenuProps['items'] = [];

      if (item) {
          if ('parentId' in item) { // Note
              menuItems = [
                  { label: t('contextMenu.addSubnote'), action: () => handleAddNote(item.id, item.blockId) },
                  { label: t('contextMenu.deleteNote'), action: () => deleteNote(item.id) },
              ];
          } else { // Block
              menuItems = [
                  { label: t('contextMenu.addNoteToBlock'), action: () => handleAddNote(null, item.id) },
                  { label: t('contextMenu.deleteBlock'), action: () => deleteBlock(item.id) },
              ];
          }
      } else { // Right-click on empty sidebar space
          menuItems = [{ label: t('contextMenu.addBlock'), action: () => setNewBlockModalOpen(true) }];
      }

      setContextMenu({ x: e.clientX, y: e.clientY, items: menuItems });
  };
  
  const handleCloseContextMenu = () => setContextMenu(null);

  useEffect(() => {
      document.addEventListener('click', handleCloseContextMenu);
      return () => document.removeEventListener('click', handleCloseContextMenu);
  }, []);

  if (storageMode === 'fileSystem' && !isLoading) {
    return <DirectoryPicker onDirectorySelect={initializeFileSystemStorage} t={t} />;
  }
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-[--color-bg] text-[--color-text-muted]">
            Loading...
        </div>
    );
  }

  const renderMainView = () => {
    const currentBlockId = activeNote?.blockId || activeBlockId;
    if (!currentBlockId && blocks.length > 0) {
         return (
            <div className="flex items-center justify-center h-full text-center text-[--color-text-muted]">
              <div>
                <h2 className="text-2xl font-semibold">{t('app.noBlockSelected')}</h2>
                <p className="mt-2">{t('app.noBlockSelectedHint')}</p>
                <button onClick={() => setNewBlockModalOpen(true)} className="mt-4 bg-[--color-primary] hover:bg-[--color-primary-hover] text-[--color-primary-text] font-bold py-2 px-4 rounded-md transition-colors">{t('sidebar.newBlock')}</button>
              </div>
            </div>
          );
    }

    switch (activeView) {
      case ViewMode.GRAPH:
        const notesInBlockForGraph = notes.filter(n => n.blockId === currentBlockId);
        const blockForGraph = blocks.find(b => b.id === currentBlockId);
        if (!blockForGraph) return null;
        return <GraphView notes={notesInBlockForGraph} block={blockForGraph} onNodeClick={handleNodeClick} />;
      case ViewMode.FLASHCARDS:
        return <FlashcardView flashcards={flashcards} t={t} />;
      case ViewMode.BLOCK_OVERVIEW:
        if (!currentBlockId) return null; // Should be handled by parent check, but for safety
        const notesInBlockForOverview = notes.filter(n => n.blockId === currentBlockId);
        const blockForOverview = blocks.find(b => b.id === currentBlockId);
        if (!blockForOverview) return null;
        return <BlockOverview 
          notes={notesInBlockForOverview}
          block={blockForOverview}
          onSelectNote={noteId => {
            const note = notes.find(n => n.id === noteId);
            if (note) handleSelectItem(note);
          }}
          onDeleteNote={deleteNote}
          onNodeClick={handleNodeClick}
          onAddNote={() => handleAddNote(null, currentBlockId)}
          t={t}
        />;
      case ViewMode.EDITOR:
      default:
        if (!activeNote) {
          return (
            <div className="flex items-center justify-center h-full text-center text-[--color-text-muted]">
              <div>
                <h2 className="text-2xl font-semibold">{t('app.noNoteSelected')}</h2>
                <p className="mt-2">{t('app.noNoteSelectedHint')}</p>
              </div>
            </div>
          );
        }
        return <NoteEditor 
          note={activeNote} 
          onUpdateNote={updateNote}
          onGenerateAIContent={handleGenerateAIContent}
          onAddFlashcard={(front, back, sourceNoteId) => addFlashcard(front, back, sourceNoteId)}
          onInternalLinkClick={handleInternalLinkClick}
          t={t}
        />;
    }
  };

  return (
    <ToastProvider>
      <div className="flex h-screen w-screen text-[--color-text-base] bg-[--color-bg] antialiased overflow-hidden">
        {settings.theme === 'matrix' && <MatrixBackground />}
        
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className={`
          absolute md:relative inset-y-0 left-0
          w-80 md:w-72 lg:w-80 h-full
          transform transition-transform duration-300 ease-in-out
          flex-shrink-0 z-30
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}>
          <Sidebar 
            blocks={blocks} 
            notes={notes} 
            activeNoteId={activeNoteId} 
            activeBlockId={activeBlockId}
            activeView={activeView}
            onSelectItem={handleSelectItem} 
            onAddBlock={() => setNewBlockModalOpen(true)}
            onContextMenu={handleOpenContextMenu}
            onMoveItem={moveItem}
            t={t}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        <main className="flex-1 flex flex-col h-full min-w-0 themed-main">
          <TopToolbar 
            activeView={activeView} 
            onViewChange={setActiveView} 
            onOpenSettings={() => setSettingsOpen(true)}
            onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          />
          <div className="flex-grow h-full overflow-auto relative">
            {renderMainView()}
          </div>
        </main>

        {isSettingsOpen && <SettingsPanel isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onUpdateSettings={updateSettings} />}
        {isNewBlockModalOpen && <NewBlockModal isOpen={isNewBlockModalOpen} onClose={() => setNewBlockModalOpen(false)} onCreate={handleCreateBlock} t={t} />}
        {promptModalState.isOpen && <PromptModal {...promptModalState} onClose={() => setPromptModalState(prev => ({...prev, isOpen: false}))} t={t} />}
        {contextMenu && <ContextMenu {...contextMenu} onClose={handleCloseContextMenu} />}
      </div>
    </ToastProvider>
  );
};

export default App;