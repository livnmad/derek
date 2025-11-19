import React, { useState } from 'react';
import './App.css';
import medallion from '../public/medallion.png';

const FEATURE_FLAGS = {
  showMenu: false, // Menu disabled
};

interface ContactFormData {
  name: string;
  email: string;
  message: string;
  website: string; // honeypot field
}

const App: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
    website: '', // honeypot
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Honeypot check
    if (formData.website) {
      // Bot detected - fail silently
      setFormStatus('success');
      setFormData({ name: '', email: '', message: '', website: '' });
      return;
    }

    setFormStatus('sending');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setFormStatus('success');
      setFormData({ name: '', email: '', message: '', website: '' });
      setTimeout(() => setFormStatus('idle'), 3000);
    } catch (error) {
      setFormStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  return (
    <div className="app">
      <div className="content-wrapper">
        {/* Hero Section with Signature Logo */}
        <section className="hero-section">
        <div className="signature-section">
          <div  className="signature-svg">
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
              Derek Bateman
            </text>
          </div>
          <div className="subtitle">
            Technology Leader | Innovator | Architect
          </div>
          <img src={medallion} alt="Medallion" className="medallion" />
        </div>
        {FEATURE_FLAGS.showMenu && (
          <nav className="hero-nav">
            <button className="nav-link">
              <span className="arrow">←</span> Experience <span className="arrow">→</span>
            </button>
            <button className="nav-link">
              Skills <span className="arrow">→</span>
            </button>
            <button className="nav-link">
              Projects <span className="arrow">→</span>
            </button>
          </nav>
        )}

        <div className="contact-section">
          <h2>Get in Touch</h2>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={formStatus === 'sending'}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={formStatus === 'sending'}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                disabled={formStatus === 'sending'}
              />
            </div>

            {/* Honeypot field - hidden from users */}
            <div className="honeypot">
              <label htmlFor="website">Website</label>
              <input
                type="text"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={formStatus === 'sending'}
            >
              {formStatus === 'sending' ? 'Sending...' : 'Send Message'}
            </button>

            {formStatus === 'success' && (
              <div className="form-message success">Message Sent!</div>
            )}
            {formStatus === 'error' && (
              <div className="form-message error">{errorMessage}</div>
            )}
          </form>
        </div>
      </section>
      </div>
    </div>
  );
};

export default App;
