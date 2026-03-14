import { useState } from 'react';
import { axiosInstance } from '../../services/axiosInstance';
import { getAccessToken, getRefreshToken, getStoredUserRaw } from '../../utils/authStorage';

const PortfolioDebug = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint: string, method: 'GET' | 'POST' = 'GET') => {
    setLoading(true);
    try {
      const token = getAccessToken();
      console.log('Token:', token ? '...' : 'MISSING');
      
      
      const response = await axiosInstance({
        method,
        url: `/portfolio${endpoint}`,
      });
      
      
      
      setResult({
        success: true,
        status: response.status,
        data: response.data
      });
    } catch (error: any) {
      console.error('Error:', error);
      setResult({
        success: false,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      {(() => {
        const userRaw = getStoredUserRaw();
        const user = userRaw ? JSON.parse(userRaw) : null;
        return (
          <div style={{ marginBottom: '2rem' }}>
            <h3>Authentication</h3>
            <p>Access Token: {getAccessToken() ? '✅ Present' : '❌ Missing'}</p>
            <p>Refresh Token: {getRefreshToken() ? '✅ Present' : '❌ Missing'}</p>
            <p>User: {user?.email || 'N/A'}</p>
          </div>
        );
      })()}
      <h1>Portfolio API Debug</h1>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <button onClick={() => testEndpoint('/profile/check')} disabled={loading}>
          Test /profile/check
        </button>
        <button onClick={() => testEndpoint('/profile')} disabled={loading}>
          Test /profile (GET)
        </button>
        <button onClick={() => testEndpoint('/projects')} disabled={loading}>
          Test /projects
        </button>
        <button onClick={() => testEndpoint('/certificates')} disabled={loading}>
          Test /certificates
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {result && (
        <div style={{ 
          background: result.success ? '#d4edda' : '#f8d7da', 
          border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <h3>{result.success ? '✅ Success' : '❌ Error'}</h3>
          <p><strong>Status:</strong> {result.status} {result.statusText}</p>
          <pre style={{ 
            background: '#fff', 
            padding: '1rem', 
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PortfolioDebug;
