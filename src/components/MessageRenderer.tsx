import React from 'react';
import '../styles/MessageRenderer.css';

interface MessageRendererProps {
  content: string;
  isExpertMode?: boolean;
}

/**
 * Advanced Markdown Renderer for Chat Messages
 * Supports: headings, bold, tables, lists, code blocks, links
 */
const MessageRenderer: React.FC<MessageRendererProps> = ({ content, isExpertMode = false }) => {
  const renderContent = () => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let currentTable: string[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let codeLanguage = '';

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul className={`msg-list ${isExpertMode ? 'expert' : ''}`} key={`list-${elements.length}`}>
            {currentList.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    const flushTable = () => {
      if (currentTable.length >= 2) {
        const [headerLine, separatorLine, ...bodyLines] = currentTable;
        const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
        const rows = bodyLines
          .filter(r => r.includes('|'))
          .map(r => r.split('|').map(c => c.trim()).filter(Boolean));
        
        elements.push(
          <div className={`msg-table-wrapper ${isExpertMode ? 'expert' : ''}`} key={`tbl-${elements.length}`}>
            <table className="msg-table">
              <thead>
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} dangerouslySetInnerHTML={{ __html: renderInline(h) }} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((cols, rIdx) => (
                  <tr key={rIdx}>
                    {cols.map((c, cIdx) => (
                      <td key={cIdx} dangerouslySetInnerHTML={{ __html: renderInline(c) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      currentTable = [];
    };

    const flushCode = () => {
      if (codeBuffer.length > 0) {
        elements.push(
          <pre className={`msg-code ${isExpertMode ? 'expert' : ''}`} key={`code-${elements.length}`}>
            <div className="code-header">
              <span className="code-lang">{codeLanguage || 'code'}</span>
              <button className="code-copy" onClick={() => copyToClipboard(codeBuffer.join('\n'))}>
                Copy
              </button>
            </div>
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        codeLanguage = '';
      }
    };

    const renderInline = (text: string): string => {
      // Bold **text**
      let result = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic *text*
      result = result.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>');
      // Inline code `code`
      result = result.replace(/`([^`]+)`/g, '<code class="msg-inline-code">$1</code>');
      // Links [text](url)
      result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="msg-link">$1</a>');
      // Emojis stay as is
      return result;
    };

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].replace(/\r$/, '');
      const trimmed = line.trim();

      // Code block
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          flushCode();
        } else {
          flushList();
          flushTable();
          inCodeBlock = true;
          codeLanguage = trimmed.replace('```', '').trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Headings
      const h3Match = /^###\s+(.+)/.exec(trimmed);
      const h2Match = /^##\s+(.+)/.exec(trimmed);
      const h1Match = /^#\s+(.+)/.exec(trimmed);

      if (h3Match || h2Match || h1Match) {
        flushList();
        flushTable();
        const text = (h3Match || h2Match || h1Match)![1];
        const level = h3Match ? 'h3' : h2Match ? 'h2' : 'h1';
        elements.push(
          <div className={`msg-heading ${level} ${isExpertMode ? 'expert' : ''}`} key={`h-${elements.length}`}>
            {level === 'h3' && <span className="heading-icon">▸</span>}
            <span dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
          </div>
        );
        continue;
      }

      // Horizontal rule
      if (trimmed === '---' || trimmed === '***') {
        flushList();
        flushTable();
        elements.push(<hr className={`msg-divider ${isExpertMode ? 'expert' : ''}`} key={`hr-${elements.length}`} />);
        continue;
      }

      // List item
      const listMatch = /^[-•]\s+(.+)/.exec(trimmed);
      if (listMatch) {
        flushTable();
        currentList.push(listMatch[1]);
        continue;
      }

      // Table row
      if (trimmed.includes('|') && trimmed.split('|').filter(Boolean).length > 1) {
        flushList();
        currentTable.push(trimmed);
        continue;
      }

      // Regular paragraph
      if (trimmed) {
        flushList();
        flushTable();
        elements.push(
          <p className={`msg-paragraph ${isExpertMode ? 'expert' : ''}`} key={`p-${elements.length}`}>
            <span dangerouslySetInnerHTML={{ __html: renderInline(trimmed) }} />
          </p>
        );
      } else {
        flushList();
        flushTable();
        elements.push(<div className="msg-spacer" key={`sp-${elements.length}`} />);
      }
    }

    // Flush remaining
    flushList();
    flushTable();
    flushCode();

    return elements;
  };

  return <div className={`message-renderer ${isExpertMode ? 'expert-mode' : 'general-mode'}`}>{renderContent()}</div>;
};

export default MessageRenderer;
