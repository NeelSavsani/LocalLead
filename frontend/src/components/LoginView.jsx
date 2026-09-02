import React, { useState } from 'react';
import { Sparkles, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://127.0.0.1:8000/api/v1';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      const resp = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      if (resp.ok) {
        const data = await resp.json();
        localStorage.setItem('locallead_auth', 'true');
        localStorage.setItem('locallead_user', JSON.stringify(data.user || { username: 'admin' }));
        onLoginSuccess();
      } else {
        const errData = await resp.json().catch(() => ({}));
        setError(errData.detail || 'Access Denied: Invalid admin credentials.');
      }
    } catch (err) {
      // Fallback local verification if backend server is unreachable
      if ((username === 'admin' || username === 'admin@locallead.app') && (password === 'admin' || password === 'admin123')) {
        localStorage.setItem('locallead_auth', 'true');
        localStorage.setItem('locallead_user', JSON.stringify({ username: 'admin' }));
        onLoginSuccess();
      } else {
        setError('Invalid admin credentials. Please check your username and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin');
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0b0f17 70%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient lighting glows */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      <div
        className="glass-panel"
        style={{
          width: 'min(440px, 94vw)',
          padding: '36px 32px',
          borderRadius: '20px',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(99, 102, 241, 0.2)',
          position: 'relative',
          zIndex: 2
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlignment: 'center', textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.55)'
          }}>
            <Sparkles size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff 30%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
            LocalLead Admin
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '4px' }}>
            Authorized Administrator Access Portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(244, 63, 94, 0.14)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            color: '#fca5a5',
            fontSize: '0.82rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} color="#fb7185" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Username Input */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              ADMIN USERNAME / EMAIL
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
              <User size={18} color="#818cf8" style={{ position: 'absolute', left: '14px', top: '13px' }} />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 40px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
              <Lock size={18} color="#818cf8" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 700,
              justifyContent: 'center',
              marginTop: '6px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.45)'
            }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <ShieldCheck size={20} />
                Access Admin Dashboard
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Footer */}
        <div style={{
          marginTop: '24px',
          paddingTop: '18px',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            Authorized Credentials: <strong>admin</strong> / <strong>admin</strong>
          </span>
          <button
            type="button"
            onClick={handleQuickFill}
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '6px',
              color: '#818cf8',
              fontSize: '0.74rem',
              fontWeight: 600,
              padding: '4px 10px',
              cursor: 'pointer'
            }}
          >
            ⚡ Auto-Fill Admin Credentials
          </button>
        </div>

      </div>
    </div>
  );
}
