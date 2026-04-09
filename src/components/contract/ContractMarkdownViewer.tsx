/**
 * ContractMarkdownViewer
 * Renders contract text fields (jobDescription, clauses, etc.) as formatted
 * markdown with the JobMarkdownSurface component. Uses a bright white theme
 * appropriate for contract/legal document review.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import './ContractMarkdownViewer.css';

interface ContractMarkdownViewerProps {
  /** Raw markdown/text content to render */
  content?: string | null;
  /** Placeholder text when content is empty */
  placeholder?: string;
  /** Additional CSS class */
  className?: string;
  /** Max height for clamped view (px) */
  maxHeight?: number;
  /** Whether to show clamp gradient fade */
  clamped?: boolean;
}

/** Normalize contract HTML fragments back to markdown */
function normalizeContractMarkdown(value: string): string {
  if (!value.trim()) return '';

  return value
    .replace(/\r\n?/g, '\n')
    .replace(/<img\b[^>]*>/gi, (tag) => {
      const srcMatch = tag.match(/src\s*=\s*["']([^"']*)["']/i);
      const altMatch = tag.match(/alt\s*=\s*["']([^"']*)["']/i);
      const src = srcMatch?.[1] ?? '';
      const alt = (altMatch?.[1] ?? 'Image').replace(/\]/g, '\\]');
      return `\n![${alt}](${src})\n`;
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>(.*?)<\/a>/gis, (_, href, text) => {
      const label = String(text).replace(/<[^>]+>/g, '').trim();
      return label ? `[${label}](${href})` : href;
    })
    .replace(/<h([1-6])[^>]*>/gi, (_, level) => `\n${'#'.repeat(Number(level))} `)
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/(p|div|section|article|figure|figcaption|blockquote)>/gi, '\n')
    .replace(/<(p|div|section|article|figure|figcaption|blockquote)[^>]*>/gi, '')
    .replace(/<(strong|b)[^>]*>/gi, '**')
    .replace(/<\/(strong|b)>/gi, '**')
    .replace(/<(em|i)[^>]*>/gi, '*')
    .replace(/<\/(em|i)>/gi, '*')
    .replace(/<code[^>]*>/gi, '`')
    .replace(/<\/code>/gi, '`')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/(ul|ol)>/gi, '\n')
    .replace(/<(ul|ol)[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const ContractMarkdownViewer: React.FC<ContractMarkdownViewerProps> = ({
  content,
  placeholder = 'Không có nội dung.',
  className,
  maxHeight,
  clamped = false,
}) => {
  const normalizedContent = normalizeContractMarkdown(content ?? '');

  return (
    <div
      className={`cmv-wrapper${className ? ` ${className}` : ''}`}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {normalizedContent ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            h1: ({ children }) => <h1 className="cmv-h1">{children}</h1>,
            h2: ({ children }) => <h2 className="cmv-h2">{children}</h2>,
            h3: ({ children }) => <h3 className="cmv-h3">{children}</h3>,
            h4: ({ children }) => <h4 className="cmv-h4">{children}</h4>,
            h5: ({ children }) => <h5 className="cmv-h5">{children}</h5>,
            h6: ({ children }) => <h6 className="cmv-h6">{children}</h6>,
            p: ({ children }) => <p className="cmv-p">{children}</p>,
            strong: ({ children }) => <strong className="cmv-strong">{children}</strong>,
            em: ({ children }) => <em className="cmv-em">{children}</em>,
            del: ({ children }) => <del className="cmv-del">{children}</del>,
            ul: ({ children }) => <ul className="cmv-ul">{children}</ul>,
            ol: ({ children }) => <ol className="cmv-ol">{children}</ol>,
            li: ({ children }) => <li className="cmv-li">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="cmv-blockquote">{children}</blockquote>
            ),
            code: ({ className: codeClassName, children }) => {
              const codeText = String(children).replace(/\n$/, '');
              const isBlock = Boolean(codeClassName) || codeText.includes('\n');
              return isBlock ? (
                <pre className="cmv-pre"><code>{codeText}</code></pre>
              ) : (
                <code className="cmv-code-inline">{children}</code>
              );
            },
            table: ({ children }) => (
              <div className="cmv-table-wrap"><table className="cmv-table">{children}</table></div>
            ),
            th: ({ children }) => <th className="cmv-th">{children}</th>,
            td: ({ children }) => <td className="cmv-td">{children}</td>,
            hr: () => <hr className="cmv-hr" />,
            a: ({ href, children }) => (
              <a href={href} className="cmv-link" target="_blank" rel="noreferrer">
                {children}
              </a>
            ),
            img: ({ src, alt }) => (
              <figure className="cmv-figure">
                <img src={src ?? ''} alt={alt ?? ''} className="cmv-img" loading="lazy" />
                {alt && <figcaption className="cmv-caption">{alt}</figcaption>}
              </figure>
            ),
            input: ({ type, checked }) => {
              if (type !== 'checkbox') return null;
              return (
                <span className={`cmv-checkbox${checked ? ' cmv-checkbox--checked' : ''}`}>
                  {checked ? '☑' : '☐'}
                </span>
              );
            },
          }}
        >
          {normalizedContent}
        </ReactMarkdown>
      ) : (
        <p className="cmv-empty">{placeholder}</p>
      )}
      {clamped && normalizedContent && maxHeight && (
        <div className="cmv-clamp-overlay" />
      )}
    </div>
  );
};

export default ContractMarkdownViewer;