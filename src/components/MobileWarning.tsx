import React, { useState, useEffect } from 'react';

const MobileWarning: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Check screen width (tablets and phones typically under 1024px)
      const isSmallScreen = window.innerWidth < 1024;

      // Show warning for small screens - this catches mobile, tablet, and small browser windows
      setShowWarning(isSmallScreen);
    };

    checkDevice();

    // Re-check on resize (in case of orientation change or window resize)
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  if (!showWarning || dismissed) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '90%',
          width: '400px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '1rem',
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1976D2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: 'block', margin: '0 auto' }}
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>

        <h2
          style={{
            margin: '0 0 0.75rem 0',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#1a1a1a',
          }}
        >
          Desktop Recommended
        </h2>

        <p
          style={{
            margin: '0 0 1.5rem 0',
            fontSize: '1rem',
            color: '#666',
            lineHeight: 1.5,
          }}
        >
          Pragma Graph Tool is designed for desktop use. For the best experience
          with diagram creation and editing, please use a computer with a larger screen.
        </p>

        <button
          onClick={() => setDismissed(true)}
          style={{
            width: '100%',
            padding: '0.875rem 1.5rem',
            background: '#1976D2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 500,
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#1565C0')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#1976D2')}
        >
          Continue anyway
        </button>
      </div>
    </div>
  );
};

export default MobileWarning;
