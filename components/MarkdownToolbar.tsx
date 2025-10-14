import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as icons from './icons';

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string;
  onContentChange: (newContent: string) => void;
  // FIX: Update type of t to allow for options object
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const ToolbarButton: React.FC<{ title: string; onClick?: () => void; children: React.ReactNode }> = ({ title, onClick, children }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        className="p-2 rounded hover:bg-[--color-panel-hover-bg] text-[--color-text-muted] hover:text-[--color-text-base] transition-colors"
    >
        {children}
    </button>
);

const TableGridSelector: React.FC<{ onSelect: (rows: number, cols: number) => void, t: (key: string, options?: { [key: string]: string | number }) => string }> = ({ onSelect, t }) => {
    const [rows, setRows] = useState(1);
    const [cols, setCols] = useState(1);
    const MAX_GRID_SIZE = 10;

    return (
        <div className="p-2 w-max bg-[--color-panel-bg] border border-[--color-border] rounded-md shadow-lg">
            <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: MAX_GRID_SIZE * MAX_GRID_SIZE }).map((_, i) => {
                    const r = Math.floor(i / MAX_GRID_SIZE) + 1;
                    const c = (i % MAX_GRID_SIZE) + 1;
                    const isActive = r <= rows && c <= cols;
                    return (
                        <div
                            key={i}
                            onMouseEnter={() => { setRows(r); setCols(c); }}
                            onClick={() => onSelect(rows, cols)}
                            className={`w-5 h-5 border border-[--color-border] transition-colors ${isActive ? 'bg-[--color-primary]' : 'bg-[--color-bg]'}`}
                        />
                    );
                })}
            </div>
            <div className="text-center text-sm text-[--color-text-muted] mt-2">
                {/* FIX: Use new `t` function with options for cleaner interpolation */}
                {t('noteEditor.toolbar.insertTable', { rows, cols })}
            </div>
        </div>
    );
};

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ textareaRef, onContentChange, t }) => {
    const [isTableGridVisible, setTableGridVisible] = useState(false);
    const tableButtonRef = useRef<HTMLDivElement>(null);
    
    const applyFormat = useCallback((prefix: string, suffix: string = prefix, placeholder: string = 'text') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        const newText = selectedText || placeholder;
        const formattedText = `${prefix}${newText}${suffix}`;
        
        const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
        onContentChange(newValue);

        textarea.focus();
        setTimeout(() => {
            if (selectedText) {
                textarea.setSelectionRange(start + prefix.length, end + prefix.length);
            } else {
                textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
            }
        }, 0);
    }, [textareaRef, onContentChange]);

     const applyLinePrefix = useCallback((prefix: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        const text = textarea.value;
        let lineStart = start;
        while(lineStart > 0 && text[lineStart - 1] !== '\n') {
            lineStart--;
        }

        const textBefore = text.substring(0, lineStart);
        const selectedLines = text.substring(lineStart, end);
        const textAfter = text.substring(end);

        const newSelectedLines = selectedLines.split('\n').map(line => {
            if(line.trim().startsWith(prefix.trim())) {
                return line.replace(prefix, '');
            }
            return prefix + line;
        }).join('\n');
        
        onContentChange(textBefore + newSelectedLines + textAfter);

        textarea.focus();
        setTimeout(() => {
            textarea.setSelectionRange(start, start + newSelectedLines.length);
        }, 0);
    }, [textareaRef, onContentChange]);

    const insertTable = useCallback((rows: number, cols: number) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        let table = '';
        table += `| ${Array.from({ length: cols }).map((_, i) => `Header ${i + 1}`).join(' | ')} |\n`;
        table += `| ${Array.from({ length: cols }).map(() => '---').join(' | ')} |\n`;
        for (let r = 0; r < rows; r++) {
            table += `| ${Array.from({ length: cols }).map(() => 'Cell').join(' | ')} |\n`;
        }
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = `${textarea.value.substring(0, start)}\n${table}\n${textarea.value.substring(end)}`;
        onContentChange(newValue);
        setTableGridVisible(false);
        textarea.focus();
    }, [textareaRef, onContentChange]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tableButtonRef.current && !tableButtonRef.current.contains(event.target as Node)) {
                setTableGridVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex items-center p-1 border-b border-[--color-border] flex-wrap">
            <ToolbarButton title={t('noteEditor.toolbar.bold')} onClick={() => applyFormat('**')}><icons.BoldIcon /></ToolbarButton>
            <ToolbarButton title={t('noteEditor.toolbar.italic')} onClick={() => applyFormat('*')}><icons.ItalicIcon /></ToolbarButton>
            <ToolbarButton title={t('noteEditor.toolbar.strikethrough')} onClick={() => applyFormat('~~')}><icons.StrikethroughIcon /></ToolbarButton>
            <div className="w-px h-5 bg-[--color-border] mx-2"></div>
            <ToolbarButton title={t('noteEditor.toolbar.heading')} onClick={() => applyLinePrefix('### ')}><icons.Heading3Icon /></ToolbarButton>
            <ToolbarButton title={t('noteEditor.toolbar.unorderedList')} onClick={() => applyLinePrefix('- ')}><icons.ListUnorderedIcon /></ToolbarButton>
            <ToolbarButton title={t('noteEditor.toolbar.orderedList')} onClick={() => applyLinePrefix('1. ')}><icons.ListOrderedIcon /></ToolbarButton>
            <ToolbarButton title={t('noteEditor.toolbar.checklist')} onClick={() => applyLinePrefix('- [ ] ')}><icons.ChecklistIcon className="w-5 h-5"/></ToolbarButton>
            <ToolbarButton title={t('noteEditor.toolbar.quote')} onClick={() => applyLinePrefix('> ')}><icons.QuoteIcon /></ToolbarButton>
            <div className="w-px h-5 bg-[--color-border] mx-2"></div>
            <ToolbarButton title={t('noteEditor.toolbar.code')} onClick={() => applyFormat('`')}><icons.CodeIcon /></ToolbarButton>
            <ToolbarButton title={t('noteEditor.toolbar.link')} onClick={() => applyFormat('[', '](url)', 'link')}><icons.LinkIcon /></ToolbarButton>
            <ToolbarButton title={t('noteEditor.toolbar.image')} onClick={() => applyFormat('![', '](url)', 'alt')}><icons.ImageIcon /></ToolbarButton>
            <div ref={tableButtonRef} className="relative">
                <ToolbarButton title={t('noteEditor.toolbar.tableButton')} onClick={() => setTableGridVisible(v => !v)}><icons.TableIcon /></ToolbarButton>
                {isTableGridVisible && (
                    <div className="absolute top-full left-0 mt-2 z-10">
                        <TableGridSelector onSelect={insertTable} t={t} />
                    </div>
                )}
            </div>
            <ToolbarButton title={t('noteEditor.toolbar.horizontalRule')} onClick={() => applyFormat('\n---\n', '', '')}><icons.HorizontalRuleIcon /></ToolbarButton>
        </div>
    );
};
