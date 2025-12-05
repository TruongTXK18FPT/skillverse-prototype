import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Globe, MapPin, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import userService from '../../services/userService';
import { UserProfileResponse } from '../../data/userDTOs';
import CorporateHeader from '../../components/profile-hud/business/CorporateHeader';
import CorpDataGrid from '../../components/profile-hud/business/CorpDataGrid';
import '../../components/profile-hud/business/corp-styles.css';

interface RecruiterProfileData extends UserProfileResponse {
  companyName?: string;
  companyWebsite?: string;
  companyAddress?: string;
  taxCodeOrBusinessRegistrationNumber?: string;
  companyDocumentsUrl?: string;
  applicationStatus?: string;
  applicationDate?: string;
  approvalDate?: string;
  rejectionReason?: string;
}

const RecruiterProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<RecruiterProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editData, setEditData] = useState({
    companyName: '',
    companyWebsite: '',
    companyAddress: '',
    taxCodeOrBusinessRegistrationNumber: '',
    companyDocumentsUrl: ''
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const profileData = await userService.getMyProfile() as RecruiterProfileData;
      setProfile(profileData);
      
      setEditData({
        companyName: profileData.companyName || '',
        companyWebsite: profileData.companyWebsite || '',
        companyAddress: profileData.companyAddress || '',
        taxCodeOrBusinessRegistrationNumber: profileData.taxCodeOrBusinessRegistrationNumber || '',
        companyDocumentsUrl: profileData.companyDocumentsUrl || ''
      });
    } catch (error) {
      console.error('Error loading recruiter profile:', error);
      setError('Unable to access corporate registry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.id) {
      loadProfile();
    }
  }, [isAuthenticated, user, navigate, loadProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      if (!user?.id) return;

      await userService.updateUserProfile(user.id, editData);
      setSuccess('Corporate registry updated.');
      setEditing(false);
      await loadProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Registry update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'APPROVED': return '#10b981';
      case 'REJECTED': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle size={20} color="#10b981" />;
      case 'REJECTED': return <AlertTriangle size={20} color="#ef4444" />;
      default: return <Clock size={20} color="#f59e0b" />;
    }
  };

  if (loading) return <div className="corp-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>INITIALIZING CORP LINK...</div>;
  if (!profile) return <div className="corp-container">REGISTRY ACCESS DENIED</div>;

  return (
    <div className="corp-container">
      <CorporateHeader 
        profile={profile} 
        onEdit={() => setEditing(true)} 
      />

      {success && <div style={{ border: '1px solid #10b981', color: '#10b981', padding: '1rem', margin: '1rem 0', background: 'rgba(16, 185, 129, 0.1)' }}>{success}</div>}
      {error && <div style={{ border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', margin: '1rem 0', background: 'rgba(239, 68, 68, 0.1)' }}>{error}</div>}

      {editing ? (
        <CorpDataGrid 
          data={editData}
          onChange={handleInputChange}
          onSave={handleSave}
          loading={saving}
        />
      ) : (
        <div className="corp-grid">
          {/* Status Panel */}
          <div className="corp-panel" style={{ borderColor: getStatusColor(profile.applicationStatus) }}>
            <div className="corp-panel-header" style={{ color: getStatusColor(profile.applicationStatus) }}>
              REGISTRY STATUS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
              {getStatusIcon(profile.applicationStatus)}
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: getStatusColor(profile.applicationStatus) }}>
                {profile.applicationStatus || 'PENDING'}
              </span>
            </div>
            {profile.applicationStatus === 'REJECTED' && profile.rejectionReason && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444' }}>
                <div className="corp-label" style={{ color: '#ef4444' }}>REJECTION REASON</div>
                <p>{profile.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Entity Details */}
          <div className="corp-panel">
            <div className="corp-panel-header">ENTITY DETAILS</div>
            <div className="corp-field">
              <div className="corp-label">CORPORATE NAME</div>
              <div style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{profile.companyName || 'N/A'}</div>
            </div>
            <div className="corp-field">
              <div className="corp-label">TAX ID / REG NO.</div>
              <div style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{profile.taxCodeOrBusinessRegistrationNumber || 'N/A'}</div>
            </div>
            <div className="corp-field">
              <div className="corp-label">WEBSITE</div>
              {profile.companyWebsite ? (
                <a href={profile.companyWebsite} target="_blank" rel="noreferrer" style={{ color: '#fbbf24', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe size={14} /> {profile.companyWebsite}
                </a>
              ) : (
                <span style={{ color: '#64748b' }}>N/A</span>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="corp-panel">
            <div className="corp-panel-header">OPERATIONAL BASE</div>
            <div className="corp-field">
              <div className="corp-label">ADDRESS</div>
              <div style={{ display: 'flex', gap: '0.5rem', color: '#cbd5e1' }}>
                <MapPin size={16} style={{ marginTop: '3px', flexShrink: 0 }} />
                {profile.companyAddress || 'N/A'}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="corp-panel">
            <div className="corp-panel-header">LEGAL DOCUMENTS</div>
            <div className="corp-field">
              <div className="corp-label">DOCUMENT LINK</div>
              {profile.companyDocumentsUrl ? (
                <a href={profile.companyDocumentsUrl} target="_blank" rel="noreferrer" style={{ color: '#fbbf24', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={14} /> VIEW DOCUMENTS
                </a>
              ) : (
                <span style={{ color: '#64748b' }}>NO DOCUMENTS UPLOADED</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterProfilePage;
