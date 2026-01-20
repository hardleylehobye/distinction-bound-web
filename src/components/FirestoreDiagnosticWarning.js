import React, { useState } from 'react';
import { diagnoseFirestore, forceFirestoreReconnect } from '../firestoreDiagnostics';

const FirestoreDiagnosticWarning = () => {
  const [diagnosing, setDiagnosing] = useState(false);

  const handleDiagnose = async () => {
    setDiagnosing(true);
    await diagnoseFirestore();
    setDiagnosing(false);
  };

  const handleForceReconnect = async () => {
    setDiagnosing(true);
    await forceFirestoreReconnect();
    // Page will reload automatically
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#fff3cd',
      border: '2px solid #ffc107',
      borderRadius: '8px',
      padding: '15px',
      maxWidth: '350px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 9999
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>
        ⚠️ Firestore Connection Issue
      </h4>
      <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#856404' }}>
        Firestore is offline. This may be due to cached data. Click "Force Reconnect" to fix.
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleDiagnose}
          disabled={diagnosing}
          style={{
            padding: '8px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: diagnosing ? 'wait' : 'pointer',
            fontSize: '14px'
          }}
        >
          {diagnosing ? '⏳ Running...' : '🔍 Diagnose Issue'}
        </button>
        <button
          onClick={handleForceReconnect}
          disabled={diagnosing}
          style={{
            padding: '8px 15px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: diagnosing ? 'wait' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {diagnosing ? '⏳ Please wait...' : '🔄 Force Reconnect'}
        </button>
      </div>
    </div>
  );
};

export default FirestoreDiagnosticWarning;
