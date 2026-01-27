import React, { useState, useEffect } from 'react';

interface BulkAddFormProps {
  questionId: number;
  questionText: string;
  onClose: () => void;
  onSubmit: (options: string[]) => void;
}

const BulkAddForm: React.FC<BulkAddFormProps> = ({ questionId, questionText, onClose, onSubmit }) => {
  const [text, setText] = useState('');
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    // Parse options whenever text changes
    const parsed = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    setOptions(parsed);
  }, [text]);

  return (
    <div className="mentor-form">
      <div className="mentor-form-group">
        <label className="mentor-form-label">Câu hỏi</label>
        <input 
          className="mentor-form-input" 
          value={questionText} 
          disabled 
          style={{ opacity: 0.7, background: '#1e293b' }}
        />
      </div>
      
      <div className="mentor-form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className="mentor-form-label" style={{ marginBottom: 0 }}>
            Danh sách lựa chọn
          </label>
          <span style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 500 }}>
            {options.length} lựa chọn được phát hiện
          </span>
        </div>
        <textarea 
          className="mentor-form-textarea" 
          rows={6} 
          placeholder="Nhập mỗi lựa chọn trên một dòng..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          style={{ 
            fontFamily: 'monospace', // Use monospace for better alignment visibility
            lineHeight: '1.5',
            padding: '12px'
          }}
        />
        <p className="mentor-form-hint" style={{ marginTop: '8px', color: '#94a3b8' }}>
          💡 Mẹo: Nhấn <b>Enter</b> để tách dòng. Nội dung dài tự động xuống dòng vẫn được tính là <b>1 lựa chọn</b>.
        </p>
      </div>

      {/* Live Preview Section */}
      {options.length > 0 && (
        <div className="mentor-form-group" style={{ 
          background: '#0f172a', 
          padding: '12px', 
          borderRadius: '8px',
          border: '1px solid #1e293b',
          maxHeight: '150px',
          overflowY: 'auto'
        }}>
          <label className="mentor-form-label" style={{ marginBottom: '8px', fontSize: '0.85rem' }}>Xem trước:</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {options.map((opt, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                gap: '8px', 
                fontSize: '0.9rem',
                padding: '4px 8px',
                background: '#1e293b',
                borderRadius: '4px',
                alignItems: 'center'
              }}>
                <span style={{ color: '#94a3b8', minWidth: '20px' }}>{idx + 1}.</span>
                <span style={{ color: '#e2e8f0', wordBreak: 'break-word' }}>{opt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mentor-modal-actions">
        <button type="button" className="mentor-btn-secondary" onClick={onClose}>
          Hủy
        </button>
        <button 
          type="button" 
          className="mentor-btn-primary" 
          onClick={() => {
            if (options.length === 0) {
              alert('Vui lòng nhập ít nhất một lựa chọn');
              return;
            }
            onSubmit(options);
          }}
          disabled={options.length === 0}
        >
          Thêm {options.length > 0 ? `${options.length} Lựa Chọn` : 'Tất Cả'}
        </button>
      </div>
    </div>
  );
};

export default BulkAddForm;
