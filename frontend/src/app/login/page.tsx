'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flame, KeyRound, Building2, ArrowRight, ArrowLeft, Monitor, CheckCircle2, Info, Users, LoaderCircle } from 'lucide-react';
import { useAuth, PRESET_PERSONAS, UserProfile } from '@/context/AuthContext';
import Link from 'next/link';
import styles from './login.module.css';

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/map';

  const [activeTab, setActiveTab] = useState<'persona' | 'credentials'>('persona');
  const [badgeInput, setBadgeInput] = useState('OIL-DE-104');
  const [passwordInput, setPasswordInput] = useState('srishti@2026');
  const [selectedField, setSelectedField] = useState('Moran Asset (Upper Assam)');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  const handlePersonaLogin = (persona: UserProfile, target?: string) => {
    setIsLoggingIn(true);
    const destination = target || redirectTarget;
    setLoginSuccess('Opening ' + (destination === '/doghouse' ? 'Rig Floor' : 'Headquarters') + ' as ' + persona.name + '…');
    setTimeout(() => login(persona, destination), 450);
  };

  const handleCredentialsSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const matched = PRESET_PERSONAS.find(persona =>
      persona.badge.toLowerCase() === badgeInput.trim().toLowerCase() ||
      persona.email.toLowerCase() === badgeInput.trim().toLowerCase()
    ) || PRESET_PERSONAS[0];
    setIsLoggingIn(true);
    setLoginSuccess('Opening demo profile for ' + matched.name + '…');
    setTimeout(() => login(matched, redirectTarget), 450);
  };

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand} aria-label="SRISHTI AI overview">
          <span className={styles.brandIcon}><Flame size={20} aria-hidden="true" /></span>
          <span>
            <strong className={styles.brandName}>SRISHTI <span>· AI</span></strong>
            <span className={styles.brandSubtitle}>Oil India Limited · eRTMAC NWIS</span>
          </span>
        </Link>
        <Link href="/" className={styles.backLink} aria-label="Back to overview">
          <ArrowLeft size={15} aria-hidden="true" />
          <span>Back to overview</span>
        </Link>
      </header>

      <main className={styles.main}>
        <section className={styles.panel} aria-labelledby="login-title">
          <div className={styles.intro}>
            <span className={styles.eyebrow}>NEARBY WELLS INTELLIGENCE SYSTEM</span>
            <h1 id="login-title">Welcome to SRISHTI·AI</h1>
            <p>Historical well knowledge. Better-informed drilling decisions.</p>
          </div>

          <div className={styles.panelBody} aria-busy={isLoggingIn}>
            <div className={styles.modeSwitch} role="group" aria-label="Access mode">
              <button type="button" aria-pressed={activeTab === 'persona'} disabled={isLoggingIn}
                onClick={() => setActiveTab('persona')}
                className={activeTab === 'persona' ? styles.selectedMode : undefined}>
                <Users size={16} aria-hidden="true" />
                Demo workspaces
              </button>
              <button type="button" aria-pressed={activeTab === 'credentials'} disabled={isLoggingIn}
                onClick={() => setActiveTab('credentials')}
                className={activeTab === 'credentials' ? styles.selectedMode : undefined}>
                <KeyRound size={16} aria-hidden="true" />
                Employee login
              </button>
            </div>

            {loginSuccess && (
              <div className={styles.success} role="status">
                <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                <span>{loginSuccess}</span>
              </div>
            )}

            {activeTab === 'persona' ? (
              <section aria-labelledby="workspace-heading" className={styles.workspaceSection}>
                <div className={styles.sectionHeading}>
                  <h2 id="workspace-heading">Choose your workspace</h2>
                  <span>No credentials required</span>
                </div>

                <div className={styles.workspaceGrid}>
                  <button type="button" disabled={isLoggingIn} aria-label="Headquarters View"
                    onClick={() => handlePersonaLogin(PRESET_PERSONAS[0], '/map')}
                    className={styles.workspaceCard}>
                    <span className={styles.cardTop}>
                      <span className={styles.workspaceIcon}><Building2 size={23} aria-hidden="true" /></span>
                      <span className={styles.roleBadge}>OFFICE / HQ</span>
                    </span>
                    <span className={styles.cardCopy}>
                      <strong>Headquarters</strong>
                      <span>Explore nearby wells, compare formations, and review historical drilling evidence.</span>
                    </span>
                    <span className={styles.cardAction}>
                      <span>Enter Headquarters</span>
                      <ArrowRight size={17} aria-hidden="true" />
                    </span>
                  </button>

                  <button type="button" disabled={isLoggingIn} aria-label="Rig Floor View"
                    onClick={() => handlePersonaLogin(PRESET_PERSONAS[2], '/doghouse')}
                    className={styles.workspaceCard + ' ' + styles.rigCard}>
                    <span className={styles.cardTop}>
                      <span className={styles.workspaceIcon}><Monitor size={23} aria-hidden="true" /></span>
                      <span className={styles.roleBadge}>WELLSITE</span>
                    </span>
                    <span className={styles.cardCopy}>
                      <strong>Rig Floor</strong>
                      <span>Focus on active-well telemetry, upcoming hazards, and drilling advisories.</span>
                    </span>
                    <span className={styles.cardAction}>
                      <span>Open Rig Terminal</span>
                      <ArrowRight size={17} aria-hidden="true" />
                    </span>
                  </button>
                </div>

                <p className={styles.workspaceHint}>
                  <CheckCircle2 size={15} aria-hidden="true" />
                  Switch demo workspaces using your profile inside the dashboard.
                </p>
              </section>
            ) : (
              <form onSubmit={handleCredentialsSubmit} className={styles.form} aria-label="Demo employee login">
                <div className={styles.demoNotice} role="note">
                  <Info size={17} aria-hidden="true" />
                  <p>Demo sign-in only. Employee identity verification is not connected; do not enter a real password.</p>
                </div>
                <div className={styles.field}>
                  <label htmlFor="employee-id">Employee ID or email</label>
                  <input id="employee-id" autoComplete="off" type="text" required
                    value={badgeInput} onChange={event => setBadgeInput(event.target.value)}
                    placeholder="Demo employee ID or email" disabled={isLoggingIn} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="employee-password">Demo password</label>
                  <input id="employee-password" autoComplete="off" type="password" required
                    value={passwordInput} onChange={event => setPasswordInput(event.target.value)}
                    placeholder="Demo password" disabled={isLoggingIn} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="operational-base">Field / operational base</label>
                  <select id="operational-base" value={selectedField}
                    onChange={event => setSelectedField(event.target.value)} disabled={isLoggingIn}>
                    <option value="Moran Asset (Upper Assam)">Moran Field (Upper Assam)</option>
                    <option value="Naharkatiya Deep Asset">Naharkatiya Field</option>
                    <option value="Duliajan Field Headquarters">Duliajan Headquarters</option>
                    <option value="Baghjan Workover Command">Baghjan Field</option>
                    <option value="Digboi Historic Field">Digboi Field</option>
                  </select>
                </div>
                <button type="submit" disabled={isLoggingIn} className={styles.submitButton}>
                  {isLoggingIn ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
                  <span>{isLoggingIn ? 'Opening workspace…' : 'Continue with demo profile'}</span>
                </button>
              </form>
            )}

            <div className={styles.accessNote}>
              <Info size={16} aria-hidden="true" />
              <p>SIH prototype · Demo profiles are stored in this browser. This is not employee authentication.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>SRISHTI·AI · Decision support for drilling engineers</span>
        <span>SIH prototype · PS 26121</span>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.loading} role="status">Loading workspace access…</div>}>
      <LoginForm />
    </Suspense>
  );
}
