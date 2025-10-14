export const parseMarkdownToHTML = (markdown: string): string => {
    if (!markdown) return '';

    const processInline = (text: string): string => {
        let processedText = text;
        // Images: ![alt](src)
        processedText = processedText.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, p1, p2) => `<img src="${p2}" alt="${p1.replace(/"/g, '&quot;')}" class="max-w-full h-auto rounded-md my-4" />`);
        // Internal Links: [[text]]
        processedText = processedText.replace(/\[\[([^\]]+)\]\]/g, (_match, p1) => `<a href="#" data-internal-link="${p1.replace(/"/g, '&quot;')}">${p1}</a>`);
        // Links: [text](url)
        processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        // Bold
        processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        processedText = processedText.replace(/__(.*?)__/g, '<strong>$1</strong>');
        // Italic
        processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        processedText = processedText.replace(/_(.*?)_/g, '<em>$1</em>');
        // Strikethrough
        processedText = processedText.replace(/~~(.*?)~~/g, '<del>$1</del>');
        // Inline code
        processedText = processedText.replace(/`([^`]+)`/g, '<code>$1</code>');
        return processedText;
    };

    const lines = markdown.split('\n');
    const result: string[] = [];
    let inList: 'ul' | 'ol' | null = null;
    let inCodeBlock = false;
    let currentListType = ''; // To differentiate between 'ul', 'ol', 'task'

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Code blocks
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                result.push('</code></pre>');
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
                const lang = line.substring(3).trim();
                result.push(`<pre><code class="language-${lang}">`);
            }
            continue;
        }

        if (inCodeBlock) {
            result.push(line.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
            continue;
        }
        
        const closeListIfNeeded = () => {
            if (inList) {
                result.push(inList === 'ul' ? '</ul>' : '</ol>');
            }
            inList = null;
            currentListType = '';
        };

        // Table parsing
        const isTableLine = (l: string) => l.includes('|');
        const isTableSeparator = (l: string) => /^\s*\|?(\s*:?-+:?\s*\|)+(\s*:?-+:?\s*)?$/.test(l);
        
        if (isTableLine(lines[i]) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
            closeListIfNeeded();
            
            result.push('<table>');
            
            // Header
            const headerLine = lines[i];
            const headers = headerLine.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(h => h.trim());
            result.push('<thead><tr>');
            headers.forEach(header => result.push(`<th>${processInline(header)}</th>`));
            result.push('</tr></thead>');
            
            result.push('<tbody>');
            
            // Skip separator line
            i += 2;
            
            // Body rows
            while (i < lines.length && isTableLine(lines[i])) {
                const rowLine = lines[i];
                const cells = rowLine.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim());
                result.push('<tr>');
                for (let j = 0; j < headers.length; j++) {
                    result.push(`<td>${processInline(cells[j] || '')}</td>`);
                }
                result.push('</tr>');
                i++;
            }
            
            result.push('</tbody></table>');
            i--; // Decrement because the outer loop will increment it
            continue;
        }


        // List Parsing
        const checklistMatch = line.match(/^\s*[\-\*] \[( |x|X)\] (.*)/);
        const ulMatch = !checklistMatch && line.match(/^\s*[\-\*] (.*)/);
        const olMatch = line.match(/^\s*\d+\. (.*)/);

        if (checklistMatch) {
            if (currentListType !== 'task') {
                closeListIfNeeded();
                result.push('<ul class="task-list">');
                inList = 'ul';
                currentListType = 'task';
            }
            const isChecked = checklistMatch[1].toLowerCase() === 'x';
            result.push(`<li class="task-list-item" data-line-index="${i}"><input type="checkbox" ${isChecked ? 'checked' : ''} /><span>${processInline(checklistMatch[2])}</span></li>`);
            continue;
        }
        if (ulMatch) {
            if (currentListType !== 'ul') {
                closeListIfNeeded();
                result.push('<ul>');
                inList = 'ul';
                currentListType = 'ul';
            }
            result.push(`<li>${processInline(ulMatch[1])}</li>`);
            continue;
        }
        if (olMatch) {
            if (currentListType !== 'ol') {
                closeListIfNeeded();
                result.push('<ol>');
                inList = 'ol';
                currentListType = 'ol';
            }
            result.push(`<li>${processInline(olMatch[1])}</li>`);
            continue;
        }

        // If we are here, it's not a list item. Close any open list.
        closeListIfNeeded();

        // Other Block-level elements
        if (line.startsWith('# ')) { result.push(`<h1>${processInline(line.substring(2))}</h1>`); continue; }
        if (line.startsWith('## ')) { result.push(`<h2>${processInline(line.substring(3))}</h2>`); continue; }
        if (line.startsWith('### ')) { result.push(`<h3>${processInline(line.substring(4))}</h3>`); continue; }
        if (line.startsWith('#### ')) { result.push(`<h4>${processInline(line.substring(5))}</h4>`); continue; }
        if (line.startsWith('##### ')) { result.push(`<h5>${processInline(line.substring(6))}</h5>`); continue; }
        if (line.startsWith('###### ')) { result.push(`<h6>${processInline(line.substring(7))}</h6>`); continue; }

        if (/^(\s*?)(---|___|\*\*\*)\1\s*$/.test(line)) { result.push('<hr>'); continue; }

        if (line.startsWith('> ')) { result.push(`<blockquote>${processInline(line.substring(2))}</blockquote>`); continue; }

        if (line.trim() !== '') {
            result.push(`<p>${processInline(line)}</p>`);
        }
    }

    if (inList) {
        result.push(inList === 'ul' ? '</ul>' : '</ol>');
    }

    return result.join('\n');
}