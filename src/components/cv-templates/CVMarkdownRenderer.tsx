// CV Markdown Renderer - Clean, print-friendly markdown rendering for CV templates
// Designed to fit white-background CV layouts without dark sci-fi styling
import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
interface CVMarkdownRendererProps {
  content: string;
  className?: string;
}

/** Strip JSON-encoded quotes and normalize markdown for CV display */
const sanitizeCVMarkdown = (raw: string): string => {
  if (!raw) return "";
  const text = raw
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    // Remove leading/trailing quotes from JSON-stringified strings
    .replace(/^"([\s\S]*)"$/, "$1")
    // Unescape escaped quotes
    .replace(/\\"/g, '"')
    // Remove orphaned trailing ** markers
    .replace(/\*{2,}\s*$/gm, (match, offset, str) => {
      const before = str.substring(0, offset);
      const openCount = (before.match(/\*\*/g) || []).length;
      return openCount % 2 === 0 ? "" : match;
    })
    // Collapse 3+ blank lines into 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text;
};

const CVMarkdownRenderer: React.FC<CVMarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  const normalized = useMemo(() => sanitizeCVMarkdown(content), [content]);

  return (
    <div className={`cv-md ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => <h1 className="cv-md__h1">{children}</h1>,
          h2: ({ children }) => <h2 className="cv-md__h2">{children}</h2>,
          h3: ({ children }) => <h3 className="cv-md__h3">{children}</h3>,
          h4: ({ children }) => <h4 className="cv-md__h4">{children}</h4>,
          p: ({ children }) => <p className="cv-md__p">{children}</p>,
          strong: ({ children }) => (
            <strong className="cv-md__strong">{children}</strong>
          ),
          em: ({ children }) => <em className="cv-md__em">{children}</em>,
          ul: ({ children }) => <ul className="cv-md__ul">{children}</ul>,
          ol: ({ children }) => <ol className="cv-md__ol">{children}</ol>,
          li: ({ children }) => <li className="cv-md__li">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="cv-md__link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="cv-md__blockquote">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="cv-md__table-wrapper">
              <table className="cv-md__table">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="cv-md__thead">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="cv-md__tbody">{children}</tbody>
          ),
          tr: ({ children }) => <tr className="cv-md__tr">{children}</tr>,
          th: ({ children }) => <th className="cv-md__th">{children}</th>,
          td: ({ children }) => <td className="cv-md__td">{children}</td>,
          hr: () => <hr className="cv-md__hr" />,
          code: ({ className: cls, children, ...props }) => {
            const isBlock = cls?.startsWith("language-");
            if (isBlock) {
              return (
                <pre className="cv-md__pre">
                  <code className={cls} {...props}>
                    {String(children).replace(/\n$/, "")}
                  </code>
                </pre>
              );
            }
            return (
              <code className="cv-md__code-inline" {...props}>
                {children}
              </code>
            );
          },
          input: ({ type, checked }) => {
            if (type === "checkbox") {
              return (
                <span
                  className={`cv-md__checkbox${checked ? " cv-md__checkbox--checked" : ""}`}
                >
                  {checked ? "✓" : "○"}
                </span>
              );
            }
            return null;
          },
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
};

export default CVMarkdownRenderer;
