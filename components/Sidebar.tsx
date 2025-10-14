import React, { useState, useMemo, useCallback } from 'react';
import { Block, Note, TreeItem, ViewMode } from '../types';
import { PlusIcon, NoteIcon, BlockIcon, SearchIcon, XIcon } from './icons';
import { parseTasks } from '../utils/parser';

interface SidebarItemProps {
  item: TreeItem;
  level: number;
  isActive: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  onSelect: (item: TreeItem) => void;
  onToggleExpand: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, item: TreeItem) => void;
  // Drag and Drop props
  draggedId: string | null;
  onDragStart: (e: React.DragEvent, item: TreeItem) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, item: TreeItem) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, item: TreeItem) => void;
  dropTarget: { id: string, position: 'before' | 'after' | 'inside' } | null;
  taskProgress?: { completed: number; total: number };
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
    item, level, isActive, isExpanded, hasChildren, onSelect, onToggleExpand, onContextMenu,
    draggedId, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, dropTarget, taskProgress
}) => {
  const isBlock = 'order' in item && !('parentId' in item);
  const isDragged = draggedId === item.id;
  const isDropTarget = dropTarget?.id === item.id;
  const iconClass = `w-4 h-4 ${isActive ? 'text-current' : 'text-[--color-text-muted]'}`;

  return (
    <div 
        className={`relative rounded-md my-0.5 ${isDragged ? 'opacity-30' : ''}`}
        draggable
        onDragStart={(e) => onDragStart(e, item)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOver(e, item)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, item)}
    >
      {isDropTarget && dropTarget.position === 'before' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[--color-primary] z-10"></div>}
      
      <div
        onClick={() => onSelect(item)}
        onContextMenu={(e) => onContextMenu(e, item)}
        style={{ paddingLeft: `${level * 1.25 + 0.75}rem` }}
        className={`group flex items-center pr-2 rounded-md cursor-pointer transition-colors ${
          isActive ? 'bg-[--color-primary] text-[--color-primary-text]' : 'hover:bg-[--color-panel-hover-bg]'
        } ${isDropTarget && dropTarget.position === 'inside' ? 'bg-[--color-primary]/40' : ''}`}
      >
        <div onClick={(e) => {e.stopPropagation(); onToggleExpand(item.id)}} className="w-6 h-8 flex items-center justify-center -ml-2 text-[--color-text-muted]">
            {hasChildren && (
                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''} ${isActive ? 'text-white/70' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            )}
        </div>
        
        <div className="mr-2 flex-shrink-0">
            {isBlock ? 
                <BlockIcon className={iconClass} /> : 
                <NoteIcon className={iconClass} />
            }
        </div>
        
        <span className={`truncate flex-1 py-2 ${isBlock ? 'font-bold' : ''}`}>{item.title || (isBlock ? 'Untitled Block' : 'Untitled Note')}</span>
        
        {taskProgress && taskProgress.total > 0 && (
            <span 
                className={`ml-2 text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${
                    isActive 
                    ? 'bg-white/20 text-[--color-primary-text]' 
                    : 'bg-[--color-panel-hover-bg] text-[--color-text-muted]'
                }`}
            >
                {taskProgress.completed}/{taskProgress.total}
            </span>
        )}
      </div>

      {isDropTarget && dropTarget.position === 'after' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[--color-primary] z-10"></div>}
    </div>
  );
};

interface SidebarProps {
  blocks: Block[];
  notes: Note[];
  activeNoteId: string | null;
  activeBlockId: string | null;
  activeView: ViewMode;
  onSelectItem: (item: TreeItem) => void;
  onAddBlock: () => void;
  onContextMenu: (e: React.MouseEvent, item: TreeItem | null) => void;
  onMoveItem: (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => void;
  t: (key: string) => string;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ blocks, notes, activeNoteId, activeBlockId, activeView, onSelectItem, onAddBlock, onContextMenu, onMoveItem, t, onClose }) => {
  const [userExpandedIds, setUserExpandedIds] = useState<Set<string>>(() => new Set(blocks.map(b => b.id)));
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{id: string, position: 'before' | 'after' | 'inside'} | null>(null);

  const { visibleBlocks, visibleNotes, forcedExpandedIds } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return { visibleBlocks: blocks, visibleNotes: notes, forcedExpandedIds: new Set<string>() };
    }

    const noteMap = new Map<string, Note>(notes.map(n => [n.id, n]));
    const visibleNoteIds = new Set<string>();
    const visibleBlockIds = new Set<string>();

    blocks.forEach(block => {
      if (block.title.toLowerCase().includes(query)) {
        visibleBlockIds.add(block.id);
        notes.forEach(note => {
          if (note.blockId === block.id) {
            visibleNoteIds.add(note.id);
          }
        });
      }
    });

    notes.forEach(note => {
      if (note.title.toLowerCase().includes(query)) {
        let current: Note | null = note;
        while (current) {
          visibleNoteIds.add(current.id);
          visibleBlockIds.add(current.blockId);
          current = current.parentId ? (noteMap.get(current.parentId) ?? null) : null;
        }
      }
    });
    
    const expanded = new Set<string>(visibleBlockIds);
    notes.forEach(note => {
      if (note.title.toLowerCase().includes(query) && note.parentId) {
        let current: Note | null = noteMap.get(note.parentId) ?? null;
        while (current) {
          expanded.add(current.id);
          current = current.parentId ? (noteMap.get(current.parentId) ?? null) : null;
        }
      }
    });
    
    return {
      visibleBlocks: blocks.filter(b => visibleBlockIds.has(b.id)),
      visibleNotes: notes.filter(n => visibleNoteIds.has(n.id)),
      forcedExpandedIds: expanded
    };
  }, [searchQuery, blocks, notes]);
  
  const effectiveExpandedIds = searchQuery.trim() ? forcedExpandedIds : userExpandedIds;

  const notesByParentId = useMemo(() => {
    const map = new Map<string | null, Note[]>();
    visibleNotes.forEach(note => {
      if (!map.has(note.parentId)) {
        map.set(note.parentId, []);
      }
      map.get(note.parentId)!.push(note);
    });
    map.forEach(noteList => noteList.sort((a, b) => a.order - b.order));
    return map;
  }, [visibleNotes]);

  const onToggleExpand = (id: string) => {
    setUserExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDragStart = (e: React.DragEvent, item: TreeItem) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.id);
      setDraggedId(item.id);
  };
  
  const handleDragEnd = () => {
      setDraggedId(null);
      setDropTarget(null);
  };
  
  const handleDragOver = useCallback((e: React.DragEvent, item: TreeItem) => {
    e.preventDefault();
    if (!draggedId || draggedId === item.id) {
        setDropTarget(null);
        return;
    }

    const isDraggedItemBlock = draggedId.startsWith('block-');
    const isTargetItemNote = 'parentId' in item;
    const isTargetItemBlock = !isTargetItemNote;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    const topThreshold = height * 0.25;
    const bottomThreshold = height * 0.75;
    
    // --- VALIDATION LOGIC ---
    // 1. A block can only be dropped before/after another block.
    if (isDraggedItemBlock) {
        if(isTargetItemNote) { // Can't drop block on a note
            setDropTarget(null);
            return;
        }
        // If target is a block, only allow before/after
        if (y < height / 2) {
            setDropTarget({ id: item.id, position: 'before' });
        } else {
            setDropTarget({ id: item.id, position: 'after' });
        }
        return;
    }

    // --- From here, we are only dealing with dragging a NOTE ---
    
    // 2. A note cannot be a sibling of a block.
    if (isTargetItemBlock && (y < topThreshold || y > bottomThreshold)) {
        setDropTarget(null);
        return;
    }

    // 3. Prevent circular dependencies (dropping a note inside its own descendant).
    if (isTargetItemNote) {
        let currentParentInChain = notes.find(n => n.id === item.id);
        while (currentParentInChain) {
            if (currentParentInChain.id === draggedId) {
                setDropTarget(null); // Target is a descendant of dragged item.
                return;
            }
            currentParentInChain = currentParentInChain.parentId ? notes.find(n => n.id === currentParentInChain.parentId) : undefined;
        }
    }

    // --- SET DROP TARGET POSITION ---
    if (y < topThreshold) {
        setDropTarget({ id: item.id, position: 'before' });
    } else if (y > bottomThreshold) {
        setDropTarget({ id: item.id, position: 'after' });
    } else {
        setDropTarget({ id: item.id, position: 'inside' });
    }
  }, [draggedId, notes]);
  
  const handleDragLeave = () => {
    // Intentionally left blank to prevent flickering. `onDragOver` on the new element will set the target.
  };
  
  const handleDrop = (e: React.DragEvent, item: TreeItem) => {
      e.preventDefault();
      const droppedId = e.dataTransfer.getData('text/plain');
      if (droppedId && dropTarget) {
          onMoveItem(droppedId, dropTarget.id, dropTarget.position);
      }
      handleDragEnd();
  };

  const renderNotes = (parentId: string | null, blockId: string, level: number): React.ReactNode[] => {
    const childNotes = parentId === null 
      ? visibleNotes.filter(n => n.blockId === blockId && n.parentId === null).sort((a,b)=>a.order-b.order)
      : (notesByParentId.get(parentId) || []);
      
    return childNotes.map(note => {
      const children = notesByParentId.get(note.id) || [];
      const hasChildren = children.length > 0;
      const isExpanded = effectiveExpandedIds.has(note.id);
      const taskProgress = parseTasks(note.content);
      return (
        <React.Fragment key={note.id}>
          <SidebarItem 
            item={note} 
            level={level} 
            isActive={activeNoteId === note.id} 
            isExpanded={isExpanded}
            hasChildren={hasChildren}
            onSelect={onSelectItem}
            onToggleExpand={onToggleExpand}
            onContextMenu={onContextMenu}
            draggedId={draggedId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            dropTarget={dropTarget}
            taskProgress={taskProgress}
          />
          {isExpanded && hasChildren && renderNotes(note.id, blockId, level + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="bg-[--color-panel-bg] border-r border-[--color-border] flex flex-col h-full" onContextMenu={(e) => onContextMenu(e, null)}>
      <div className="p-4 border-b border-[--color-border] flex-shrink-0">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-[--color-primary]">{t('app.title')}</h1>
                <p className="text-sm text-[--color-text-muted]">{t('app.subtitle')}</p>
            </div>
            <button onClick={onClose} className="p-1 -mr-2 -mt-1 rounded-full text-[--color-text-muted] hover:bg-[--color-panel-hover-bg] md:hidden">
                <XIcon className="w-5 h-5" />
            </button>
        </div>
        <div className="relative mt-4">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="w-5 h-5 text-[--color-text-muted]" />
            </span>
            <input
                type="text"
                placeholder={t('sidebar.filterPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-[--color-border] rounded-md text-sm focus:ring-1 focus:ring-[--color-primary] focus:border-[--color-primary] transition-colors"
            />
        </div>
      </div>
      <div className="p-2">
        <button onClick={onAddBlock} className="w-full flex items-center justify-center gap-2 bg-[--color-primary] hover:bg-[--color-primary-hover] text-[--color-primary-text] font-semibold py-2 px-4 rounded-md transition-colors">
          <PlusIcon className="w-5 h-5"/> {t('sidebar.newBlock')}
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-2">
        {visibleBlocks.sort((a,b)=> a.order-b.order).map(block => {
          const childNotes = notesByParentId.get(null)?.filter(n => n.blockId === block.id) || [];
          const isExpanded = effectiveExpandedIds.has(block.id);
          const hasChildren = childNotes.length > 0;
          return (
            <div key={block.id}>
              <SidebarItem 
                item={block}
                level={0}
                isActive={activeBlockId === block.id && activeView === ViewMode.BLOCK_OVERVIEW}
                isExpanded={isExpanded}
                hasChildren={hasChildren}
                onSelect={onSelectItem}
                onToggleExpand={onToggleExpand}
                onContextMenu={onContextMenu}
                draggedId={draggedId}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                dropTarget={dropTarget}
              />
              {isExpanded && renderNotes(null, block.id, 1)}
            </div>
          );
        })}
      </div>
    </div>
  );
};