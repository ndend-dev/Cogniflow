import React, { useMemo, useRef, useEffect } from 'react';
import { parseMarkdownToHTML } from '../utils/markdownParser';

interface MarkdownPreviewProps {
  markdown: string;
  onContentChange: (newContent: string) => void;
  onInternalLinkClick: (noteTitle: string) => void;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ markdown, onContentChange, onInternalLinkClick }) => {
  const processedHtml = useMemo(() => parseMarkdownToHTML(markdown), [markdown]);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;

    const handleClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        const internalLink = target.closest('a[data-internal-link]');
        if (internalLink) {
            event.preventDefault();
            const noteTitle = internalLink.getAttribute('data-internal-link');
            if (noteTitle) {
                onInternalLinkClick(noteTitle);
            }
            return;
        }

        if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
            const listItem = target.closest('.task-list-item');
            if (listItem) {
                const lineIndexStr = listItem.getAttribute('data-line-index');
                if (lineIndexStr) {
                    const lineIndex = parseInt(lineIndexStr, 10);
                    const lines = markdown.split('\n');
                    const line = lines[lineIndex];

                    if (line.includes('[ ]')) {
                        lines[lineIndex] = line.replace('[ ]', '[x]');
                    } else if (line.includes('[x]') || line.includes('[X]')) {
                        lines[lineIndex] = line.replace(/\[(x|X)\]/, '[ ]');
                    }
                    onContentChange(lines.join('\n'));
                }
            }
        }
    };

    container.addEventListener('click', handleClick);
    return () => {
        if (container) {
            container.removeEventListener('click', handleClick);
        }
    };
  }, [markdown, onContentChange, onInternalLinkClick]);

  return (
    <div
      ref={previewRef}
      className="markdown-preview"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
};