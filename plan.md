# MFA Implementation Plan

## Overview

This plan adds multi-factor authentication (MFA) to Project Beacon using **TOTP (Time-Based One-Time Password)** with authenticator apps such as Microsoft Authenticator, Google Authenticator, or 1Password. This approach fits the current architecture well because Beacon already uses username/password authentication and role-based access, and TOTP works cleanly with ASP.NET Identity and a React frontend.

For INTEX, MFA should be treated as an **additional security feature**, not a blocker for grading. That means the team should implement MFA for at least one testable account while still keeping:

- **1 admin account without MFA** enabled
- **1 donor/non-admin account without MFA** enabled
- **1 account with MFA enabled** for demonstration/testing

---

## Why TOTP is the right choice

TOTP is the best implementation target for this project because it:

- does not require SMS infrastructure or paid third-party messaging services
- does not depend on push notifications or hardware keys
- is supported by ASP.NET Identity’s built-in two-factor flows
- is practical to wire into a React + .NET application
- is strong enough to count as a meaningful additional security feature for IS 414

---

## Goals

### Primary goal
Enable a secure, working MFA flow for Beacon users through authenticator apps.

### Secondary goals
- Preserve usability for graders and demo accounts
- Keep the implementation small enough to finish within project scope
- Document the feature clearly in the security video
- Avoid breaking existing login, RBAC, or donor/admin workflows

---

## Scope

### In scope
- TOTP-based MFA setup and login verification
- QR-code setup flow for authenticator apps
- Recovery code generation and display
- Enable / disable MFA from an authenticated settings page
- Frontend login support for MFA code entry
- Backend endpoint wiring using ASP.NET Identity
- Testing for MFA-enabled and non-MFA users
- Demo/documentation checklist for grading

### Out of scope
- SMS MFA
- email OTP MFA
- passkeys / WebAuthn
- mandatory MFA for every account
- “remember this machine” optimization unless time remains
- full account recovery workflow beyond recovery codes

---

## Recommended user experience

### Account setup flow
1. User logs in normally with username/password.
2. User opens **Security Settings** or **Manage MFA**.
3. App requests MFA setup data from the backend.
4. Backend returns:
   - shared secret key
   - whether MFA is enabled
   - recovery code count
   - recovery codes when newly generated
5. Frontend renders:
   - QR code
   - manual secret key fallback
   - input for first authenticator code
6. User scans QR code with authenticator app.
7. User enters 6-digit code.
8. Backend verifies code and enables MFA.
9. User is shown recovery codes and instructed to save them.

### Login flow
Recommended implementation:
1. User submits email/username + password.
2. If MFA is not required, complete login.
3. If MFA is required, show a **second step** screen asking for:
   - authenticator code
   - or recovery code
4. Complete login only after valid MFA verification.

This two-step UI is better than permanently showing MFA fields on the login page.

---

## Technical architecture

### Backend (.NET / ASP.NET Identity)

#### Core responsibilities
- store MFA state per user
- generate TOTP shared key
- verify authenticator code
- enable/disable MFA
- generate/reset recovery codes
- enforce MFA challenge during login when enabled

#### Backend tasks
1. Confirm ASP.NET Identity is configured and working.
2. Verify two-factor endpoints or service methods already available.
3. Add or expose methods for:
   - `GetTwoFactorStatus()`
   - `EnableTwoFactor(code)`
   - `DisableTwoFactor()`
   - `ResetRecoveryCodes()`
4. Update login logic to optionally accept:
   - `twoFactorCode`
   - `recoveryCode`
5. Make sure auth cookies/session behavior still works after MFA challenge.
6. Ensure only authenticated users can access MFA management endpoints.
7. Log security-relevant events where reasonable:
   - MFA enabled
   - MFA disabled
   - recovery codes reset
   - failed MFA attempts

#### Security notes
- Do not store raw passwords or hard-coded secrets.
- Keep all auth endpoints under HTTPS.
- Maintain role restrictions already required by the app.
- Do not force MFA for grader accounts that must remain accessible without it.

---

### Frontend (React + TypeScript)

#### Pages / components to add
- `ManageMfaPage.tsx`
- `TwoFactorStatus` type/interface
- optional `MfaChallengeForm` component for step-two login

#### Frontend tasks
1. Add a type for MFA status payload:
   - `sharedKey: string`
   - `recoveryCodesLeft: number`
   - `recoveryCodes: string[]`
   - `isTwoFactorEnabled: boolean`
   - `isMachineRemembered: boolean` (optional if supported)
2. Add API helpers in auth client layer for:
   - get status
   - enable MFA
   - disable MFA
   - reset recovery codes
3. Add QR code rendering package.
4. Build **Manage MFA** page with:
   - current status
   - QR code
   - manual shared key
   - code input to confirm setup
   - disable button
   - reset recovery codes button
5. Update routing and navigation to include **MFA** under authenticated user settings.
6. Update login flow to support MFA challenge.
7. Show clear error states:
   - invalid code
   - expired code
   - incorrect recovery code
   - setup fetch failure
8. Show success messages for:
   - MFA enabled
   - MFA disabled
   - recovery codes reset

---

## Data and API contract

### Suggested MFA status payload
```ts
interface TwoFactorStatus {
  sharedKey: string;
  recoveryCodesLeft: number;
  recoveryCodes: string[];
  isTwoFactorEnabled: boolean;
  isMachineRemembered: boolean;
}