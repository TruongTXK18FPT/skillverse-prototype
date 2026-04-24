import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bold, Italic, Code, Link, List, Heading, Eye, Edit2 } from 'lucide-react';
import './MarkdownEditorField.css';

interface MarkdownEditorFieldProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const MarkdownEditorField: React.FC<MarkdownEditorFieldProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Nhập nội dung Markdown...',
  rows = 5,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const insertText = (before: string, after: string = '') => {
    // This is a simple insertion at the end for now. 
    // A robust version would need a ref to the textarea to insert at cursor.
    const newText = value ? `${value}\n${before}${after}` : `${before}${after}`;
    onChange(newText);
  };

  return (
    <div className={`md-editor-container ${className}`}>
      {label && <label className="md-editor-label">{label}</label>}
      
      <div className="md-editor-wrapper">
        <div className="md-editor-header">
          <div className="md-editor-tabs">
            <button
              type="button"
              className={`md-editor-tab ${activeTab === 'write' ? 'active' : ''}`}
              onClick={() => setActiveTab('write')}
            >
              <Edit2 size={14} /> Viết
            </button>
            <button
              type="button"
              className={`md-editor-tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <Eye size={14} /> Xem trước
            </button>
          </div>

          {activeTab === 'write' && (
            <div className="md-editor-toolbar">
              <button type="button" onClick={() => insertText('**', '**')} title="Bold"><Bold size={14} /></button>
              <button type="button" onClick={() => insertText('*', '*')} title="Italic"><Italic size={14} /></button>
              <button type="button" onClick={() => insertText('`', '`')} title="Code"><Code size={14} /></button>
              <button type="button" onClick={() => insertText('[', '](url)')} title="Link"><Link size={14} /></button>
              <button type="button" onClick={() => insertText('- ')} title="List"><List size={14} /></button>
              <button type="button" onClick={() => insertText('### ')} title="Heading"><Heading size={14} /></button>
            </div>
          )}
        </div>

        <div className="md-editor-body">
          {activeTab === 'write' ? (
            <textarea
              className="md-editor-textarea"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={rows}
            />
          ) : (
            <div className="md-editor-preview">
              {value ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
              ) : (
                <span className="md-editor-empty">Chưa có nội dung để xem trước</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditorField;
