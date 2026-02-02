import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./MarkdownRenderer.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Enhanced Markdown Renderer for Learning Reports
 * Supports: Tables, Code blocks with styling, Nested lists,
 * Custom styling for various elements
 *
 * Note: For advanced syntax highlighting, install:
 * npm install react-syntax-highlighter @types/react-syntax-highlighter
 *
 * For math equations, install:
 * npm install remark-math rehype-katex
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  return (
    <div className={`lr-markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="lr-markdown__h1">
              <span className="lr-markdown__h1-icon">▸</span>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="lr-markdown__h2">
              <span className="lr-markdown__h2-marker" />
              {children}
            </h2>
          ),
          h3: ({ children }) => <h3 className="lr-markdown__h3">{children}</h3>,
          h4: ({ children }) => <h4 className="lr-markdown__h4">{children}</h4>,

          // Paragraphs and text
          p: ({ children }) => <p className="lr-markdown__p">{children}</p>,
          strong: ({ children }) => (
            <strong className="lr-markdown__strong">{children}</strong>
          ),
          em: ({ children }) => <em className="lr-markdown__em">{children}</em>,
          del: ({ children }) => (
            <del className="lr-markdown__del">{children}</del>
          ),

          // Lists
          ul: ({ children }) => <ul className="lr-markdown__ul">{children}</ul>,
          ol: ({ children }) => <ol className="lr-markdown__ol">{children}</ol>,
          li: ({ children }) => (
            <li className="lr-markdown__li">
              <span className="lr-markdown__li-marker">◆</span>
              <div className="lr-markdown__li-content">{children}</div>
            </li>
          ),

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="lr-markdown__blockquote">
              <div className="lr-markdown__blockquote-icon">💡</div>
              <div className="lr-markdown__blockquote-content">{children}</div>
            </blockquote>
          ),

          // Code blocks with enhanced styling
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !className;

            if (isInline) {
              return (
                <code className="lr-markdown__code-inline" {...props}>
                  {children}
                </code>
              );
            }

            return (
              <div className="lr-markdown__code-wrapper">
                <div className="lr-markdown__code-header">
                  <span className="lr-markdown__code-lang">
                    {match ? match[1].toUpperCase() : "CODE"}
                  </span>
                  <button
                    className="lr-markdown__code-copy"
                    onClick={() => {
                      navigator.clipboard.writeText(String(children));
                    }}
                  >
                    Copy
                  </button>
                </div>
                <pre className="lr-markdown__code-block">
                  <code className={className} {...props}>
                    {String(children).replace(/\n$/, "")}
                  </code>
                </pre>
              </div>
            );
          },

          // Tables
          table: ({ children }) => (
            <div className="lr-markdown__table-wrapper">
              <table className="lr-markdown__table">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="lr-markdown__thead">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="lr-markdown__tbody">{children}</tbody>
          ),
          tr: ({ children }) => <tr className="lr-markdown__tr">{children}</tr>,
          th: ({ children }) => <th className="lr-markdown__th">{children}</th>,
          td: ({ children }) => <td className="lr-markdown__td">{children}</td>,

          // Horizontal rule
          hr: () => <hr className="lr-markdown__hr" />,

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              className="lr-markdown__link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
              <span className="lr-markdown__link-icon">↗</span>
            </a>
          ),

          // Images
          img: ({ src, alt }) => (
            <figure className="lr-markdown__figure">
              <img src={src} alt={alt} className="lr-markdown__img" />
              {alt && (
                <figcaption className="lr-markdown__figcaption">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),

          // Task list items
          input: ({ type, checked }) => {
            if (type === "checkbox") {
              return (
                <span
                  className={`lr-markdown__checkbox ${checked ? "lr-markdown__checkbox--checked" : ""}`}
                >
                  {checked ? "✓" : "○"}
                </span>
              );
            }
            return null;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
