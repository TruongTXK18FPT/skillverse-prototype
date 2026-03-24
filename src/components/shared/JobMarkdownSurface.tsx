import React from "react";
import type { CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { resolveRecruitmentAssetUrl } from "../../utils/recruitmentUi";
import "./JobMarkdownSurface.css";

type JobMarkdownDensity = "editor" | "preview" | "card" | "detail";
type JobMarkdownTheme =
  | "teal"
  | "gold"
  | "cyan"
  | "emerald"
  | "amber"
  | "crimson";

interface JobMarkdownSurfaceProps {
  content?: string | null;
  placeholder?: string;
  className?: string;
  density?: JobMarkdownDensity;
  theme?: JobMarkdownTheme;
  maxHeight?: number;
}

const ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

const getAttribute = (tag: string, name: string) => {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match?.[1]?.trim() ?? "";
};

const escapeAltText = (value: string) => value.replace(/\]/g, "\\]");

const resolveContentUrl = (raw?: string | null) => {
  if (!raw) {
    return undefined;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^(blob:|data:|mailto:|tel:|#)/i.test(trimmed)) {
    return trimmed;
  }

  return resolveRecruitmentAssetUrl(trimmed) ?? trimmed;
};

const normalizeJobMarkdown = (value: string) => {
  if (!value.trim()) {
    return "";
  }

  return value
    .replace(/\r\n?/g, "\n")
    .replace(/<img\b[^>]*>/gi, (tag) => {
      const src = getAttribute(tag, "src");
      if (!src) {
        return "";
      }

      const alt = escapeAltText(getAttribute(tag, "alt"));
      return `\n![${alt}](${src})\n`;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(
      /<a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>(.*?)<\/a>/gis,
      (_, href, text) => {
        const label = String(text)
          .replace(/<[^>]+>/g, "")
          .trim();
        return label ? `[${label}](${href})` : href;
      },
    )
    .replace(
      /<h([1-6])[^>]*>/gi,
      (_, level) => `\n${"#".repeat(Number(level))} `,
    )
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/(p|div|section|article|figure|figcaption|blockquote)>/gi, "\n")
    .replace(
      /<(p|div|section|article|figure|figcaption|blockquote)[^>]*>/gi,
      "",
    )
    .replace(/<(strong|b)[^>]*>/gi, "**")
    .replace(/<\/(strong|b)>/gi, "**")
    .replace(/<(em|i)[^>]*>/gi, "*")
    .replace(/<\/(em|i)>/gi, "*")
    .replace(/<code[^>]*>/gi, "`")
    .replace(/<\/code>/gi, "`")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/(ul|ol)>/gi, "\n")
    .replace(/<(ul|ol)[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(
      /&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/gi,
      (entity) => ENTITY_MAP[entity.toLowerCase()] ?? entity,
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

export const JobMarkdownSurface: React.FC<JobMarkdownSurfaceProps> = ({
  content,
  placeholder = "Chua co noi dung mo ta.",
  className,
  density = "preview",
  theme = "teal",
  maxHeight,
}) => {
  const normalizedContent = normalizeJobMarkdown(content ?? "");
  const style = maxHeight
    ? ({
        ["--job-markdown-max-height" as const]: `${maxHeight}px`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={classNames(
        "job-markdown",
        `job-markdown--${density}`,
        `job-markdown--${theme}`,
        maxHeight && normalizedContent ? "job-markdown--clamped" : "",
        className,
      )}
      style={style}
    >
      {normalizedContent ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            h1: ({ children }) => (
              <h1 className="job-markdown__h1">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="job-markdown__h2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="job-markdown__h3">{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="job-markdown__h4">{children}</h4>
            ),
            h5: ({ children }) => (
              <h5 className="job-markdown__h5">{children}</h5>
            ),
            h6: ({ children }) => (
              <h6 className="job-markdown__h6">{children}</h6>
            ),
            p: ({ children }) => <p className="job-markdown__p">{children}</p>,
            strong: ({ children }) => (
              <strong className="job-markdown__strong">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="job-markdown__em">{children}</em>
            ),
            del: ({ children }) => (
              <del className="job-markdown__del">{children}</del>
            ),
            ul: ({ children }) => (
              <ul className="job-markdown__ul">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="job-markdown__ol">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="job-markdown__li">{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="job-markdown__blockquote">
                {children}
              </blockquote>
            ),
            code: ({ className: codeClassName, children, ...props }) => {
              const codeText = String(children).replace(/\n$/, "");
              const isBlock = Boolean(codeClassName) || codeText.includes("\n");

              if (!isBlock) {
                return (
                  <code className="job-markdown__code-inline" {...props}>
                    {children}
                  </code>
                );
              }

              return (
                <pre className="job-markdown__pre">
                  <code className="job-markdown__code-block" {...props}>
                    {codeText}
                  </code>
                </pre>
              );
            },
            table: ({ children }) => (
              <div className="job-markdown__table-wrap">
                <table className="job-markdown__table">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="job-markdown__th">{children}</th>
            ),
            td: ({ children }) => (
              <td className="job-markdown__td">{children}</td>
            ),
            hr: () => <hr className="job-markdown__hr" />,
            a: ({ href, children }) => (
              <a
                href={resolveContentUrl(href) ?? href}
                className="job-markdown__link"
                target="_blank"
                rel="noreferrer"
              >
                {children}
              </a>
            ),
            img: ({ src, alt }) => (
              <figure className="job-markdown__figure">
                <img
                  src={resolveContentUrl(src) ?? ""}
                  alt={alt ?? "Job image"}
                  className="job-markdown__img"
                  loading="lazy"
                />
                {alt ? (
                  <figcaption className="job-markdown__caption">
                    {alt}
                  </figcaption>
                ) : null}
              </figure>
            ),
            input: ({ type, checked }) => {
              if (type !== "checkbox") {
                return null;
              }

              return (
                <span
                  className={classNames(
                    "job-markdown__checkbox",
                    checked ? "job-markdown__checkbox--checked" : "",
                  )}
                >
                  {checked ? "[x]" : "[ ]"}
                </span>
              );
            },
          }}
        >
          {normalizedContent}
        </ReactMarkdown>
      ) : (
        <p className="job-markdown__empty">{placeholder}</p>
      )}
    </div>
  );
};

export default JobMarkdownSurface;
