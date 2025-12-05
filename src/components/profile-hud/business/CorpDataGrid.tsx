import React from 'react';
import { Globe, MapPin, FileText, ExternalLink } from 'lucide-react';
import './corp-styles.css';

interface CorpDataGridProps {
  data: {
    companyName: string;
    companyWebsite: string;
    companyAddress: string;
    taxCodeOrBusinessRegistrationNumber: string;
    companyDocumentsUrl: string;
  };
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  loading?: boolean;
}

const CorpDataGrid: React.FC<CorpDataGridProps> = ({ data, onChange, onSave, loading }) => {
  return (
    <div className="corp-grid">
      {/* Panel 1: General Info */}
      <div className="corp-panel">
        <div className="corp-panel-header">ENTITY DETAILS</div>
        
        <div className="corp-field">
          <label className="corp-label">CORPORATE DESIGNATION (NAME)</label>
          <input 
            type="text" 
            className="corp-input" 
            value={data.companyName}
            onChange={(e) => onChange('companyName', e.target.value)}
          />
        </div>

        <div className="corp-field">
          <label className="corp-label">TAX IDENTIFICATION</label>
          <input 
            type="text" 
            className="corp-input" 
            value={data.taxCodeOrBusinessRegistrationNumber}
            onChange={(e) => onChange('taxCodeOrBusinessRegistrationNumber', e.target.value)}
          />
        </div>

        <div className="corp-field">
          <label className="corp-label">DIGITAL PRESENCE</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              className="corp-input" 
              value={data.companyWebsite}
              onChange={(e) => onChange('companyWebsite', e.target.value)}
              placeholder="https://"
            />
            {data.companyWebsite && (
              <a 
                href={data.companyWebsite} 
                target="_blank" 
                rel="noreferrer"
                className="corp-link-btn"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Panel 2: Location */}
      <div className="corp-panel">
        <div className="corp-panel-header">OPERATIONAL BASE</div>
        
        <div className="corp-field">
          <label className="corp-label">HEADQUARTERS ADDRESS</label>
          <textarea 
            className="corp-input" 
            style={{ minHeight: '100px', resize: 'vertical' }}
            value={data.companyAddress}
            onChange={(e) => onChange('companyAddress', e.target.value)}
          />
        </div>

        {/* Mock Map Visual */}
        <div style={{ 
          height: '150px', 
          background: '#0f172a', 
          border: '1px dashed #475569',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#475569',
          fontFamily: 'monospace'
        }}>
          <MapPin size={24} style={{ marginRight: '0.5rem' }} />
          SECTOR MAP UNAVAILABLE
        </div>
      </div>

      {/* Panel 3: Documents & Actions */}
      <div className="corp-panel">
        <div className="corp-panel-header">DATA PACKETS</div>
        
        <div className="corp-field">
          <label className="corp-label">REGISTRATION DOCUMENTS URL</label>
          <input 
            type="text" 
            className="corp-input" 
            value={data.companyDocumentsUrl}
            onChange={(e) => onChange('companyDocumentsUrl', e.target.value)}
          />
        </div>

        <div className="corp-doc-item">
          <FileText size={24} className="corp-doc-icon" />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#f8fafc', fontSize: '0.9rem' }}>Business_License.pdf</div>
            <div style={{ color: '#64748b', fontSize: '0.7rem' }}>ENCRYPTED // 2.4 MB</div>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <button className="corp-btn" onClick={onSave} disabled={loading}>
            {loading ? 'TRANSMITTING...' : 'UPDATE REGISTRY'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorpDataGrid;
