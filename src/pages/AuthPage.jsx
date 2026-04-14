import React, { useState } from 'react';
import '../styles/AuthPage.css';
import { signupUser, loginUser } from '../api';

export default function AuthPage({ onAuthenticate }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleModeToggle = () => {
    setMode((current) => (current === 'login' ? 'signup' : 'login'));
    setError('');
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password.trim()) {
      setError('Please enter all required fields.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!dob) {
        setError('Please enter your date of birth.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      try {
        const newUser = await signupUser({
          name: name.trim(),
          email: trimmedEmail,
          password: password.trim(),
          date_of_birth: dob,
        });
        onAuthenticate(newUser);
        setMessage('Account created successfully!');
      } catch (err) {
        setError(err?.response?.data?.error || err.message || 'Failed to create account.');
      }
      return;
    }

    try {
      const existingUser = await loginUser({
        email: trimmedEmail,
        password: password.trim(),
      });
      onAuthenticate(existingUser);
      setMessage('Logged in successfully!');
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{mode === 'login' ? 'Welcome Back' : 'Create Your Account'}</h1>
          <p>
            {mode === 'login'
              ? 'Log in to access your TAURUS dashboard and saved stock insights.'
              : 'Sign up to save your profile and view personalized stock analytics.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label className="auth-label">
              <span>Full name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                type="text"
                autoComplete="name"
              />
            </label>
          )}

          <label className="auth-label">
            <span>Email address</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@example.com"
              type="email"
              autoComplete="email"
            />
          </label>

          <label className="auth-label">
            <span>Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {mode === 'signup' && (
            <>
              <label className="auth-label">
                <span>Date of birth</span>
                <input
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  type="date"
                  autoComplete="bday"
                />
              </label>
              <label className="auth-label">
                <span>Confirm password</span>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  type="password"
                  autoComplete="new-password"
                />
              </label>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}

          <button type="submit" className="auth-submit">
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>

          <div className="auth-switch">
            {mode === 'login' ? (
              <p>
                New here?{' '}
                <button type="button" className="auth-link" onClick={handleModeToggle}>
                  Create an account
                </button>
              </p>
            ) : (
              <p>
                Already registered?{' '}
                <button type="button" className="auth-link" onClick={handleModeToggle}>
                  Log in instead
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
