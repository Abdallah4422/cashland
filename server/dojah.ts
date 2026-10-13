// Cashland Phase 2 — Real BVN/NIN verification via Dojah
// Set env vars to enable live verification:
//   DOJAH_API_KEY=your_key
//   DOJAH_APP_ID=your_app_id
//   DOJAH_SANDBOX=true   (use Dojah sandbox environment)
//
// Without these vars, falls back to the mock simulation in kyc.ts.
// Dojah sandbox returns realistic responses without hitting NIBSS live.

const DOJAH_BASE_LIVE = 'https://api.dojah.io';
const DOJAH_BASE_SANDBOX = 'https://sandbox.dojah.io';

function dojahBase(): string {
  return process.env.DOJAH_SANDBOX === 'true' ? DOJAH_BASE_SANDBOX : DOJAH_BASE_LIVE;
}

interface DojahBvnResponse {
  entity?: {
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    date_of_birth?: string;
    phone_number1?: string;
    enrollment_bank?: string;
    enrollment_branch?: string;
    image?: string;
  };
  message?: string;
}

interface DojahNinResponse {
  entity?: {
    firstname?: string;
    surname?: string;
    middlename?: string;
    birthdate?: string;
    mobile?: string;
    photo?: string;
  };
  message?: string;
}

export interface DojahBvnResult {
  verified: boolean;
  nameMatch: boolean;
  firstName?: string;
  lastName?: string;
  dob?: string;
  provider: 'dojah' | 'mock';
  error?: string;
}

export interface DojahNinResult {
  verified: boolean;
  nameMatch: boolean;
  firstName?: string;
  lastName?: string;
  dob?: string;
  provider: 'dojah' | 'mock';
  error?: string;
}

function nameMatch(a: string, b: string): boolean {
  return a.toLowerCase().trim() === b.toLowerCase().trim();
}

export async function dojahVerifyBvn(params: {
  bvn: string;
  firstName: string;
  lastName: string;
}): Promise<DojahBvnResult | null> {
  const apiKey = process.env.DOJAH_API_KEY;
  const appId = process.env.DOJAH_APP_ID;
  if (!apiKey || !appId) return null; // Signal caller to use mock

  try {
    const res = await fetch(
      `${dojahBase()}/api/v1/kyc/bvn?bvn=${encodeURIComponent(params.bvn)}`,
      {
        headers: {
          'AppId': appId,
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('[dojah:bvn] HTTP error:', res.status, text);
      return { verified: false, nameMatch: false, provider: 'dojah', error: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as DojahBvnResponse;
    const entity = data.entity;
    if (!entity) {
      return { verified: false, nameMatch: false, provider: 'dojah', error: data.message ?? 'No entity returned' };
    }

    const firstMatch = nameMatch(entity.first_name ?? '', params.firstName);
    const lastMatch = nameMatch(entity.last_name ?? '', params.lastName);

    return {
      verified: true,
      nameMatch: firstMatch && lastMatch,
      firstName: entity.first_name,
      lastName: entity.last_name,
      dob: entity.date_of_birth,
      provider: 'dojah',
    };
  } catch (e) {
    console.error('[dojah:bvn] Error:', e);
    return { verified: false, nameMatch: false, provider: 'dojah', error: String(e) };
  }
}

export async function dojahVerifyNin(params: {
  nin: string;
  firstName: string;
  lastName: string;
}): Promise<DojahNinResult | null> {
  const apiKey = process.env.DOJAH_API_KEY;
  const appId = process.env.DOJAH_APP_ID;
  if (!apiKey || !appId) return null; // Signal caller to use mock

  try {
    const res = await fetch(
      `${dojahBase()}/api/v1/kyc/nin?nin=${encodeURIComponent(params.nin)}`,
      {
        headers: {
          'AppId': appId,
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('[dojah:nin] HTTP error:', res.status, text);
      return { verified: false, nameMatch: false, provider: 'dojah', error: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as DojahNinResponse;
    const entity = data.entity;
    if (!entity) {
      return { verified: false, nameMatch: false, provider: 'dojah', error: data.message ?? 'No entity returned' };
    }

    const firstMatch = nameMatch(entity.firstname ?? '', params.firstName);
    const lastMatch = nameMatch(entity.surname ?? '', params.lastName);

    return {
      verified: true,
      nameMatch: firstMatch && lastMatch,
      firstName: entity.firstname,
      lastName: entity.surname,
      dob: entity.birthdate,
      provider: 'dojah',
    };
  } catch (e) {
    console.error('[dojah:nin] Error:', e);
    return { verified: false, nameMatch: false, provider: 'dojah', error: String(e) };
  }
}
