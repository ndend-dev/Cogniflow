import React from 'react';
import { ViewMode } from '../types';
import { NoteIcon, GraphIcon, FlashcardIcon, SettingsIcon, MenuIcon } from './icons';

interface TopToolbarProps {
    activeView: ViewMode;
    onViewChange: (view: ViewMode) => void;
    onOpenSettings: () => void;
    onToggleSidebar: () => void;
}

const ViewSwitcher: React.FC<Omit<TopToolbarProps, 'onOpenSettings' | 'onToggleSidebar'>> = ({ activeView, onViewChange }) => (
    <div className="flex items-center space-x-1 p-1 bg-[--color-panel-bg] rounded-lg">
      <button onClick={() => onViewChange(ViewMode.EDITOR)} className={`p-2 rounded-md transition-colors ${activeView === ViewMode.EDITOR ? 'bg-[--color-primary] text-[--color-primary-text]' : 'hover:bg-[--color-panel-hover-bg]'}`}><NoteIcon className="w-5 h-5" /></button>
      <button onClick={() => onViewChange(ViewMode.GRAPH)} className={`p-2 rounded-md transition-colors ${activeView === ViewMode.GRAPH ? 'bg-[--color-primary] text-[--color-primary-text]' : 'hover:bg-[--color-panel-hover-bg]'}`}><GraphIcon className="w-5 h-5" /></button>
      <button onClick={() => onViewChange(ViewMode.FLASHCARDS)} className={`p-2 rounded-md transition-colors ${activeView === ViewMode.FLASHCARDS ? 'bg-[--color-primary] text-[--color-primary-text]' : 'hover:bg-[--color-panel-hover-bg]'}`}><FlashcardIcon className="w-5 h-5" /></button>
    </div>
);


export const TopToolbar: React.FC<TopToolbarProps> = ({ activeView, onViewChange, onOpenSettings, onToggleSidebar }) => {
    return (
        <header className="p-4 border-b border-[--color-border] flex justify-between items-center flex-shrink-0 h-20">
            <div>
                 <button onClick={onToggleSidebar} className="p-2 -ml-2 rounded-md transition-colors text-[--color-text-muted] hover:bg-[--color-panel-hover-bg] md:hidden">
                    <MenuIcon />
                </button>
            </div>
            
            <div className="flex items-center gap-4">
                <ViewSwitcher activeView={activeView} onViewChange={onViewChange} />
                <button onClick={onOpenSettings} className="p-2 rounded-md transition-colors text-[--color-text-muted] hover:bg-[--color-panel-hover-bg]">
                    <SettingsIcon />
                </button>
            </div>
        </header>
    );
}
