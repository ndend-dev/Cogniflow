

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Note, Block } from '../types';
import { GraphView } from './GraphView';
import { TrashIcon, NoteIcon, GraphIcon, ColumnsIcon, PlusIcon } from './icons';
import { parseTasks } from '../utils/parser';

interface NoteCardProps {
    note: Note;
    onSelect: (noteId: string) => void;
    onDelete: (noteId: string) => void;
    t: (key: string) => string;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onSelect, onDelete, t }) => {
    const handleSelect = () => onSelect(note.id);
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(note.id);
    }
    const formattedDate = new Date(note.updatedAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });
    
    const { completed, total } = parseTasks(note.content);

    return (
        <div 
            onClick={handleSelect}
            className="bg-[--color-panel-bg] rounded-lg shadow-md border border-[--color-border] p-4 flex items-center justify-between cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-[--color-primary]"
        >
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-[--color-text-base] truncate">{note.title}</h3>
                {total > 0 && (
                    <div className="mt-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[--color-text-muted] tabular-nums tracking-tighter">{completed}/{total}</span>
                            <div className="w-full bg-[--color-panel-hover-bg] rounded-full h-1.5">
                                <div 
                                    className="bg-[--color-primary] h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                <span className="text-sm text-[--color-text-muted] whitespace-nowrap">{formattedDate}</span>
                <button 
                    onClick={handleDelete}
                    title={t('blockOverview.deleteNote')}
                    className="text-[--color-text-muted] hover:text-red-500 p-1 rounded-full transition-colors"
                >
                    <TrashIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
    );
};

interface BlockOverviewProps {
  notes: Note[];
  block: Block;
  onSelectNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onNodeClick: (noteId: string) => void;
  onAddNote: () => void;
  t: (key: string) => string;
}

const MIN_PANEL_WIDTH = 250; // Minimum width in pixels for each panel
const STORAGE_KEY = 'cogniflow-block-overview-panel-width';

export const BlockOverview: React.FC<BlockOverviewProps> = ({ notes, block, onSelectNote, onDeleteNote, onNodeClick, onAddNote, t }) => {
    const [panelState, setPanelState] = useState<'both' | 'notes' | 'graph'>('both');
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    const [notesPanelWidth, setNotesPanelWidth] = useState<number>(() => {
        try {
            const savedWidth = localStorage.getItem(STORAGE_KEY);
            return savedWidth ? parseInt(savedWidth, 10) : 400;
        } catch {
            return 400;
        }
    });

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        let newWidth = e.clientX - containerRect.left;

        const maxWidth = containerRect.width - MIN_PANEL_WIDTH;
        if (newWidth < MIN_PANEL_WIDTH) newWidth = MIN_PANEL_WIDTH;
        if (newWidth > maxWidth) newWidth = maxWidth;

        setNotesPanelWidth(newWidth);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove, handleMouseUp]);
    
    useEffect(() => {
        if (!isDragging) {
            localStorage.setItem(STORAGE_KEY, String(notesPanelWidth));
        }
    }, [notesPanelWidth, isDragging]);

    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);


    if (notes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-[--color-text-muted] text-center p-8">
                <NoteIcon className="w-16 h-16 text-[--color-border] mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-[--color-text-base]">{t('blockOverview.noNotes')}</h2>
                <p className="mb-6 max-w-sm">{t('blockOverview.noNotesHint')}</p>
                <button
                    onClick={onAddNote}
                    className="flex items-center gap-2 bg-[--color-primary] hover:bg-[--color-primary-hover] text-[--color-primary-text] font-semibold py-3 px-5 rounded-lg transition-colors text-base shadow-md hover:shadow-lg"
                >
                    <PlusIcon className="w-5 h-5" />
                    {t('blockOverview.addFirstNote')}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between p-2 border-b border-[--color-border] bg-[--color-panel-bg] flex-shrink-0">
                <button
                    onClick={onAddNote}
                    className="flex items-center gap-2 bg-[--color-primary]/20 hover:bg-[--color-primary]/30 text-[--color-primary] font-semibold py-2 px-3 rounded-md transition-colors ml-2 text-sm"
                >
                    <PlusIcon className="w-4 h-4" />
                    {t('blockOverview.addNewNote')}
                </button>
                <div className="flex items-center space-x-1 p-1 bg-[--color-bg] rounded-lg">
                    <button onClick={() => setPanelState('notes')} title={t('blockOverview.showNotesOnly')} className={`p-2 rounded-md transition-colors ${panelState === 'notes' ? 'bg-[--color-primary] text-[--color-primary-text]' : 'hover:bg-[--color-panel-hover-bg]'}`}><NoteIcon className="w-5 h-5" /></button>
                    <button onClick={() => setPanelState('both')} title={t('blockOverview.showBoth')} className={`p-2 rounded-md transition-colors ${panelState === 'both' ? 'bg-[--color-primary] text-[--color-primary-text]' : 'hover:bg-[--color-panel-hover-bg]'}`}><ColumnsIcon className="w-5 h-5" /></button>
                    <button onClick={() => setPanelState('graph')} title={t('blockOverview.showGraphOnly')} className={`p-2 rounded-md transition-colors ${panelState === 'graph' ? 'bg-[--color-primary] text-[--color-primary-text]' : 'hover:bg-[--color-panel-hover-bg]'}`}><GraphIcon className="w-5 h-5" /></button>
                </div>
            </div>
            <div ref={containerRef} className="flex flex-col md:flex-row flex-1 h-full w-full overflow-hidden">
                {panelState !== 'graph' && (
                    <div 
                        className="h-full overflow-y-auto p-4 flex-shrink-0"
                        style={{ 
                            width: (panelState === 'notes' || window.innerWidth < 768) ? '100%' : `${notesPanelWidth}px`
                        }}
                    >
                         <div className="space-y-3">
                            {notes.map(note => (
                                <NoteCard 
                                    key={note.id} 
                                    note={note} 
                                    onSelect={onSelectNote}
                                    onDelete={onDeleteNote}
                                    t={t}
                                />
                            ))}
                        </div>
                    </div>
                )}
                
                {panelState === 'both' && (
                    <div 
                        onMouseDown={handleMouseDown}
                        className="w-full md:w-1.5 h-1.5 md:h-full cursor-row-resize md:cursor-col-resize group flex-shrink-0"
                        title="Resize panels"
                    >
                        <div className="w-full h-full bg-[--color-border] group-hover:bg-[--color-primary] transition-colors duration-200"></div>
                    </div>
                )}
                
                {panelState !== 'notes' && (
                    <div className="h-full flex-1 min-w-0">
                        <GraphView notes={notes} block={block} onNodeClick={onNodeClick} />
                    </div>
                )}
            </div>
        </div>
    );
};