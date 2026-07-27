/**
 * TesterAccountControl — tester account management UI.
 * Only rendered for the Platform Owner.
 *
 * Extracted verbatim from the inline "testerAccounts" tab block that used to
 * live directly inside src/App.tsx's SettingsPanel, plus its own local
 * formatTesterAccountDate() helper which was only ever used here (StaffiQ
 * build book Part 4 Medium priority #4, 27 Jul 2026). Pure code-organisation
 * move — same markup, same class names, same handlers, same gating.
 *
 * Several shared types and helpers (User, TesterAccountKey,
 * TesterAccountOperationResult, testerAccountDefinitions,
 * testerAccountDefinitionFor, normalizeTesterAccount, isUserDisabled,
 * roleDisplayName, copyToClipboard) are used pervasively throughout App.tsx
 * itself, not just here, so they were left in place there (now exported)
 * rather than relocated, to avoid a much larger, riskier refactor touching
 * many unrelated parts of a 22,000 line file overnight. This does create a
 * circular import between App.tsx and this file, which is safe here because
 * every imported binding is only read inside this component's function body
 * at render time, never at this module's own top level.
 */

import { useState, type FormEvent } from 'react'
import { Copy, CheckCircle2, KeyRound, RefreshCw, RotateCcw, EyeOff } from 'lucide-react'
import {
  type User,
  type TesterAccountKey,
  type TesterAccountOperationResult,
  testerAccountDefinitions,
  testerAccountDefinitionFor,
  normalizeTesterAccount,
  isUserDisabled,
  roleDisplayName,
  copyToClipboard,
} from '../../App'

function formatTesterAccountDate(value?: string): string {
  if (!value) return 'Not recorded'
  const time = Date.parse(value)
  return Number.isFinite(time) ? new Date(time).toLocaleString() : 'Not recorded'
}

export interface TesterAccountControlProps {
  users: User[]
  onEnableTesterAccount: (accountKey: TesterAccountKey, generateFreshPassword: boolean) => TesterAccountOperationResult | undefined
  onDisableTesterAccount: (accountKey: TesterAccountKey) => TesterAccountOperationResult | undefined
  onGenerateTesterAccountPassword: (accountKey: TesterAccountKey) => TesterAccountOperationResult | undefined
  onResetTesterAccountDefaultPassword: (accountKey: TesterAccountKey) => TesterAccountOperationResult | undefined
  onSetTesterAccountPassword: (accountKey: TesterAccountKey, password: string) => TesterAccountOperationResult | undefined
  onVerifyTesterAccountPassword: (accountKey: TesterAccountKey, password: string) => TesterAccountOperationResult | undefined
  onToast: (message: string) => void
}

export function TesterAccountControl({
  users,
  onEnableTesterAccount,
  onDisableTesterAccount,
  onGenerateTesterAccountPassword,
  onResetTesterAccountDefaultPassword,
  onSetTesterAccountPassword,
  onVerifyTesterAccountPassword,
  onToast,
}: TesterAccountControlProps) {
  const [chosenPasswords, setChosenPasswords] = useState<Record<TesterAccountKey, string>>({ testadmin: '', testuser: '' })
  const [verifyInputs, setVerifyInputs] = useState<Record<TesterAccountKey, string>>({ testadmin: '', testuser: '' })
  const [issuedCredential, setIssuedCredential] = useState<TesterAccountOperationResult>()
  const [verificationResults, setVerificationResults] = useState<Partial<Record<TesterAccountKey, TesterAccountOperationResult>>>({})
  const accounts = testerAccountDefinitions.map((definition) => {
    const existing = users.find((user) => user.testAccountKey === definition.key || user.id === definition.id || user.userId === definition.userId)
    return normalizeTesterAccount(definition, existing)
  })

  function captureResult(result: TesterAccountOperationResult | undefined) {
    if (!result) return
    if (result.password) setIssuedCredential(result)
    if (typeof result.verificationPassed === 'boolean') {
      setVerificationResults((existing) => ({ ...existing, [result.accountKey]: result }))
    }
  }

  function submitChosenPassword(accountKey: TesterAccountKey, event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const password = chosenPasswords[accountKey]
    const result = onSetTesterAccountPassword(accountKey, password)
    captureResult(result)
    if (result?.password) setChosenPasswords((existing) => ({ ...existing, [accountKey]: '' }))
  }

  function submitVerification(accountKey: TesterAccountKey, event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    captureResult(onVerifyTesterAccountPassword(accountKey, verifyInputs[accountKey]))
  }

  async function copyIssuedPassword() {
    if (!issuedCredential?.password) return
    await copyToClipboard(issuedCredential.password)
    onToast('Tester password copied. Share it securely now.')
  }

  return (
    <section className="tester-account-control">
      <section className="panel tester-account-intro">
        <div className="panel-heading-row">
          <div>
            <h2>Tester Account Control</h2>
            <p>Use these controlled accounts when someone needs temporary access to test the app. Switch access on only when needed, set or generate a password, verify it, then switch access off after review.</p>
          </div>
          <span className="tester-owner-pill">Platform Owner only</span>
        </div>
        <p className="hint">Do not share the real Platform Owner login. These accounts give controlled testing access while preserving account history.</p>
      </section>

      {issuedCredential?.password && (
        <section className="panel issued-credential-panel" aria-live="polite">
          <div>
            <span>Issued credential</span>
            <h2>{issuedCredential.accountName}</h2>
            <p>{issuedCredential.message}</p>
          </div>
          <div className="issued-password-box">
            <span>Password</span>
            <strong>{issuedCredential.password}</strong>
            <small>{issuedCredential.verificationPassed ? 'Verification passed' : 'Verification pending'}</small>
          </div>
          <div className="tester-card-actions">
            <button className="primary-button compact" type="button" onClick={() => void copyIssuedPassword()}>
              <Copy size={16} /> Copy password
            </button>
                <button className="secondary-button compact" type="button" onClick={() => setIssuedCredential(undefined)}>
                  <CheckCircle2 size={16} /> Done
                </button>
          </div>
        </section>
      )}

      <div className="tester-account-grid">
        {accounts.map((account) => {
          const definition = testerAccountDefinitionFor(account.testAccountKey)
          const accountKey = account.testAccountKey
          if (!definition || !accountKey) return null
          const active = !isUserDisabled(account)
          const verificationResult = verificationResults[accountKey]
          return (
            <article className={`tester-account-card ${active ? 'is-active' : 'is-inactive'}`} key={accountKey}>
              <div className="tester-card-heading">
                <div>
                  <span className="tester-role-badge">{definition.badge}</span>
                  <h2>{account.fullName}</h2>
                  <p>{definition.description}</p>
                </div>
                <span className={`tester-status-pill ${active ? 'active' : 'inactive'}`}>{active ? 'Active' : 'Inactive'}</span>
              </div>

              <div className="tester-detail-grid">
                <span>User ID<strong>{account.userId}</strong></span>
                <span>Role<strong>{roleDisplayName(account.role)}</strong></span>
                <span>Department<strong>{account.department}</strong></span>
                <span>Last login<strong>{formatTesterAccountDate(account.lastLoginAt)}</strong></span>
                <span>Password reset<strong>{formatTesterAccountDate(account.passwordLastResetAt)}</strong></span>
                <span>Reset by<strong>{account.passwordLastResetBy ?? 'Not recorded'}</strong></span>
                <span>Default password<strong>{definition.defaultPassword}</strong></span>
                <span>Controlled account<strong>Yes</strong></span>
              </div>

              <div className="tester-card-actions">
                <button className="primary-button compact" type="button" onClick={() => captureResult(onEnableTesterAccount(accountKey, true))}>
                  <KeyRound size={16} /> Enable and generate
                </button>
                <button className="secondary-button compact" type="button" onClick={() => captureResult(onEnableTesterAccount(accountKey, false))}>
                  <CheckCircle2 size={16} /> Enable only
                </button>
                <button className="secondary-button compact" type="button" onClick={() => captureResult(onGenerateTesterAccountPassword(accountKey))}>
                  <RefreshCw size={16} /> Generate password
                </button>
                <button className="secondary-button compact" type="button" onClick={() => captureResult(onResetTesterAccountDefaultPassword(accountKey))}>
                  <RotateCcw size={16} /> Reset default
                </button>
                <button className="danger-button compact" type="button" disabled={!active} onClick={() => captureResult(onDisableTesterAccount(accountKey))}>
                  <EyeOff size={16} /> Switch off
                </button>
              </div>

              <form className="tester-password-form" onSubmit={(event) => submitChosenPassword(accountKey, event)}>
                <label>
                  <span>Set chosen password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={chosenPasswords[accountKey]}
                    onChange={(event) => setChosenPasswords((existing) => ({ ...existing, [accountKey]: event.target.value }))}
                  />
                </label>
                <button className="primary-button compact" type="submit">
                  <KeyRound size={16} /> Save password and switch on
                </button>
              </form>

              <form className="tester-password-form" onSubmit={(event) => submitVerification(accountKey, event)}>
                <label>
                  <span>Verify password before sharing</span>
                  <input
                    type="password"
                    autoComplete="off"
                    value={verifyInputs[accountKey]}
                    onChange={(event) => setVerifyInputs((existing) => ({ ...existing, [accountKey]: event.target.value }))}
                  />
                </label>
                <button className="secondary-button compact" type="submit">
                  <CheckCircle2 size={16} /> Verify
                </button>
              </form>
              {verificationResult && (
                <p className={`tester-verification-result ${verificationResult.verificationPassed ? 'passed' : 'failed'}`} role="status">
                  {verificationResult.message}
                </p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
