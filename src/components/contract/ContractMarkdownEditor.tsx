/**
 * ContractMarkdownEditor
 * Word-like toolbar + textarea for entering contract markdown content.
 * Toolbar supports: bold, italic, underline, strikethrough, heading,
 * bullet list, numbered list, checkbox, divider, table.
 */

import React, { useRef, useCallback } from 'react';
import './ContractMarkdownEditor.css';

interface ContractMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  minRows?: number;
  maxRows?: number;
}

type ToolbarAction = {
  id: string;
  label: string;
  title: string;
  icon: string;
  action: (text: string, selStart: number, selEnd: number) => {
    text: string;
    cursorStart: number;
    cursorEnd: number;
  };
};

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    id: 'bold',
    label: 'B',
    title: 'In đậm (Ctrl+B)',
    icon: 'B',
    action: (text, start, end) => {
      const sel = text.slice(start, end);
      const wrap = sel || 'văn bản in đậm';
      const result = `${text.slice(0, start)}**${wrap}**${text.slice(end)}`;
      return { text: result, cursorStart: start + 2, cursorEnd: start + 2 + wrap.length };
    },
  },
  {
    id: 'italic',
    label: 'I',
    title: 'In nghiêng (Ctrl+I)',
    icon: 'I',
    action: (text, start, end) => {
      const sel = text.slice(start, end);
      const wrap = sel || 'văn bản in nghiêng';
      const result = `${text.slice(0, start)}*${wrap}*${text.slice(end)}`;
      return { text: result, cursorStart: start + 1, cursorEnd: start + 1 + wrap.length };
    },
  },
  {
    id: 'underline',
    label: 'U',
    title: 'Gạch chân',
    icon: 'U',
    action: (text, start, end) => {
      const sel = text.slice(start, end);
      const wrap = sel || 'văn bản gạch chân';
      const result = `${text.slice(0, start)}++${wrap}++${text.slice(end)}`;
      return { text: result, cursorStart: start + 2, cursorEnd: start + 2 + wrap.length };
    },
  },
  {
    id: 'strikethrough',
    label: 'S',
    title: 'Gạch ngang',
    icon: 'S̶',
    action: (text, start, end) => {
      const sel = text.slice(start, end);
      const wrap = sel || 'văn bản gạch ngang';
      const result = `${text.slice(0, start)}~~${wrap}~~${text.slice(end)}`;
      return { text: result, cursorStart: start + 2, cursorEnd: start + 2 + wrap.length };
    },
  },
  {
    id: 'sep1',
    label: '|',
    title: '',
    icon: '',
    action: () => ({ text: '', cursorStart: 0, cursorEnd: 0 }),
  },
  {
    id: 'h2',
    label: 'H2',
    title: 'Tiêu đề cấp 2',
    icon: 'H2',
    action: (text, start, end) => {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const prefix = '## ';
      const result = `${text.slice(0, lineStart)}${prefix}${text.slice(lineStart)}`;
      return { text: result, cursorStart: start + prefix.length, cursorEnd: end + prefix.length };
    },
  },
  {
    id: 'h3',
    label: 'H3',
    title: 'Tiêu đề cấp 3',
    icon: 'H3',
    action: (text, start, end) => {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const prefix = '### ';
      const result = `${text.slice(0, lineStart)}${prefix}${text.slice(lineStart)}`;
      return { text: result, cursorStart: start + prefix.length, cursorEnd: end + prefix.length };
    },
  },
  {
    id: 'sep2',
    label: '|',
    title: '',
    icon: '',
    action: () => ({ text: '', cursorStart: 0, cursorEnd: 0 }),
  },
  {
    id: 'bullet',
    label: '•',
    title: 'Danh sách gạch đầu dòng',
    icon: '•',
    action: (text, start, end) => {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const prefix = '- ';
      const result = `${text.slice(0, lineStart)}${prefix}${text.slice(lineStart)}`;
      return { text: result, cursorStart: start + prefix.length, cursorEnd: end + prefix.length };
    },
  },
  {
    id: 'numbered',
    label: '1.',
    title: 'Danh sách đánh số',
    icon: '1.',
    action: (text, start, end) => {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const prefix = '1. ';
      const result = `${text.slice(0, lineStart)}${prefix}${text.slice(lineStart)}`;
      return { text: result, cursorStart: start + prefix.length, cursorEnd: end + prefix.length };
    },
  },
  {
    id: 'checkbox',
    label: '☐',
    title: 'Hộp kiểm',
    icon: '☐',
    action: (text, start, end) => {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const prefix = '- [ ] ';
      const result = `${text.slice(0, lineStart)}${prefix}${text.slice(lineStart)}`;
      return { text: result, cursorStart: start + prefix.length, cursorEnd: end + prefix.length };
    },
  },
  {
    id: 'sep3',
    label: '|',
    title: '',
    icon: '',
    action: () => ({ text: '', cursorStart: 0, cursorEnd: 0 }),
  },
  {
    id: 'divider',
    label: '—',
    title: 'Đường kẻ ngang',
    icon: '—',
    action: (text, start, end) => {
      const insert = '\n---\n';
      const result = `${text.slice(0, start)}${insert}${text.slice(end)}`;
      return { text: result, cursorStart: start + insert.length, cursorEnd: start + insert.length };
    },
  },
  {
    id: 'table',
    label: '⊞',
    title: 'Chèn bảng',
    icon: '⊞',
    action: (text, start, end) => {
      const insert = '\n| Cột 1 | Cột 2 | Cột 3 |\n|---|---|---|\n|  |  |  |\n';
      const result = `${text.slice(0, start)}${insert}${text.slice(end)}`;
      return { text: result, cursorStart: start + insert.length, cursorEnd: start + insert.length };
    },
  },
  {
    id: 'quote',
    label: '"',
    title: 'Trích dẫn',
    icon: '"',
    action: (text, start, end) => {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const prefix = '> ';
      const result = `${text.slice(0, lineStart)}${prefix}${text.slice(lineStart)}`;
      return { text: result, cursorStart: start + prefix.length, cursorEnd: end + prefix.length };
    },
  },
  {
    id: 'sep4',
    label: '|',
    title: '',
    icon: '',
    action: () => ({ text: '', cursorStart: 0, cursorEnd: 0 }),
  },
  {
    id: 'article',
    label: '§',
    title: 'Điều khoản',
    icon: '§',
    action: (text, start, end) => {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const prefix = '**Điều . **';
      const result = `${text.slice(0, lineStart)}${prefix}${text.slice(lineStart)}`;
      return { text: result, cursorStart: start + prefix.length, cursorEnd: start + prefix.length };
    },
  },
  {
    id: 'clause',
    label: '¶',
    title: 'Mục điều khoản',
    icon: '¶',
    action: (text, start, end) => {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const prefix = '- **';
      const suffix = '**: ';
      const sel = text.slice(start, end) || 'tên mục';
      const result = `${text.slice(0, lineStart)}${prefix}${sel}${suffix}${text.slice(end)}`;
      return { text: result, cursorStart: start + prefix.length, cursorEnd: start + prefix.length + sel.length };
    },
  },
];

const ContractMarkdownEditor: React.FC<ContractMarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung hoặc sử dụng thanh công cụ bên dưới...',
  rows = 4,
  minRows = 3,
  maxRows = 20,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyAction = useCallback(
    (action: ToolbarAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart: start, selectionEnd: end } = textarea;
      const result = action.action(value, start, end);

      onChange(result.text);

      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(result.cursorStart, result.cursorEnd);
      });
    },
    [value, onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart: start, selectionEnd: end } = textarea;

    // Tab → insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const newValue = `${value.slice(0, start)}  ${value.slice(end)}`;
      onChange(newValue);
      requestAnimationFrame(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      });
      return;
    }

    // Ctrl+B → bold
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      const action = TOOLBAR_ACTIONS.find((a) => a.id === 'bold');
      if (action) applyAction(action);
      return;
    }

    // Ctrl+I → italic
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      const action = TOOLBAR_ACTIONS.find((a) => a.id === 'italic');
      if (action) applyAction(action);
      return;
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = 'auto';
    const newHeight = Math.min(Math.max(el.scrollHeight, minRows * 24), maxRows * 24);
    el.style.height = `${newHeight}px`;
  };

  return (
    <div className="cme-editor">
      <div className="cme-toolbar" role="toolbar" aria-label="Định dạng văn bản">
        {TOOLBAR_ACTIONS.map((action, idx) => {
          if (action.id.startsWith('sep')) {
            return <div key={action.id} className="cme-toolbar-sep" role="separator" />;
          }
          return (
            <button
              key={action.id}
              type="button"
              className={`cme-toolbar-btn cme-toolbar-btn--${action.id}`}
              title={action.title}
              onClick={() => applyAction(action)}
              tabIndex={-1}
            >
              {action.id === 'underline' ? (
                <span style={{ textDecoration: 'underline' }}>{action.icon}</span>
              ) : action.id === 'strikethrough' ? (
                <span style={{ textDecoration: 'line-through' }}>{action.label}</span>
              ) : (
                action.icon
              )}
            </button>
          );
        })}
      </div>
      <textarea
        ref={textareaRef}
        className="cme-textarea"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          autoResize(e);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
      />
      <div className="cme-hint">
        Dùng <kbd>Ctrl+B</kbd> in đậm, <kbd>Ctrl+I</kbd> in nghiêng, <kbd>Tab</kbd> thụt lề
      </div>
    </div>
  );
};

export default ContractMarkdownEditor;
