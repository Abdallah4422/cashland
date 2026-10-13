// Cashland Phase 1 — KYC verification (mock bureau)
// In production: replace mock with Dojah or Smile Identity API calls.
// The interface is identical — swap the implementation, not the callers.

import { query, queryOne } from './db.js';
import { sha256 } from './crypto.js';

export interface KycResult {
  success: boolean;
  tier: 1 | 2 | 3;
  nameMatch: boolean;
  dobMatch: boolean;
  status: 'verified' | 'failed' | 'pending';
  providerRef: string;
  maskedName?: string;
  maskedDob?: string;
  reason?: string;
}

// Mock BVN/NIN database — realistic Nigerian data
const MOCK_BVN_DB: Record<string, { name: string; dob: string; phone: string }> = {
  '22345678901': { name: 'Musa Ibrahim', dob: '1995-03-15', phone: '08031234567' },
  '22456789012': { name: 'Aisha Bello', dob: '1998-07-22', phone: '08031234568' },
  '22567890123': { name: 'David Okafor', dob: '1992-11-08', phone: '08031234569' },
  '22678901234': { name: 'Chioma Obi', dob: '1996-05-30', phone: '08031234570' },
  '22789012345': { name: 'Abdul Hassan', dob: '1994-09-12', phone: '08031234571' },
};

// Any 11-digit number not in the mock DB gets a simulated "new user" verification
function simulateBureauCall(idNumber: string, providedName: string): KycResult {
  const known = MOCK_BVN_DB[idNumber];
  const providerRef = 'MOCK-' + Date.now().toString(36).toUpperCase();

  if (known) {
    // Name match: compare first word of provided name to first word of DB name
    const dbFirst = known.name.split(' ')[0].toLowerCase();
    const inputFirst = providedName.split(' ')[0].toLowerCase();
    const nameMatch = dbFirst === inputFirst || inputFirst.includes(dbFirst) || dbFirst.includes(inputFirst);

    return {
      success: true,
      tier: 2,
      nameMatch,
      dobMatch: true,
      status: 'verified',
      providerRef,
      maskedName: known.name.replace(/(?<=\w)\w/g, '*'),
      maskedDob: known.dob.replace(/(\d{4})-\d{2}-(\d{2})/, '$1-**-$2'),
    };
  }

  // Unknown BVN/NIN — simulate successful verification for any 11-digit number
  if (/^\d{11}$/.test(idNumber)) {
    return {
      success: true,
      tier: 2,
      nameMatch: true,
      dobMatch: true,
      status: 'verified',
      providerRef,
      maskedName: providedName.replace(/(?<=\w{2})\w/g, '*'),
    };
  }

  return {
    success: false,
    tier: 1,
    nameMatch: false,
    dobMatch: false,
    status: 'failed',
    providerRef,
    reason: 'Invalid ID number format',
  };
}

export async function verifyBvn(params: {
  userId: bigint;
  bvn: string;
  firstName: string;
  lastName: string;
}): Promise<KycResult> {
  const { userId, bvn, firstName, lastName } = params;
  const idHash = sha256(`bvn:${bvn}`);

  // Check for duplicate verification
  const existing = await queryOne(
    `SELECT id FROM kyc_verifications WHERE user_id = $1 AND method = 'bvn' AND tier_granted = 2`,
    [String(userId)]
  );
  if (existing) return { success: true, tier: 2, nameMatch: true, dobMatch: true, status: 'verified', providerRef: 'CACHED' };

  const result = simulateBureauCall(bvn, `${firstName} ${lastName}`);

  await query(
    `INSERT INTO kyc_verifications (user_id, method, id_hash, provider, provider_ref, result, tier_granted)
     VALUES ($1, 'bvn', $2, 'mock', $3, $4, $5)`,
    [String(userId), idHash, result.providerRef, JSON.stringify(result), result.success ? 2 : null]
  );

  if (result.success) {
    await query(
      `UPDATE users SET kyc_tier = 2, kyc_method = 'bvn', kyc_ref = $1 WHERE id = $2 AND kyc_tier < 2`,
      [result.providerRef, String(userId)]
    );
  }

  return result;
}

export async function verifyNin(params: {
  userId: bigint;
  nin: string;
  firstName: string;
  lastName: string;
}): Promise<KycResult> {
  const { userId, nin, firstName, lastName } = params;
  const idHash = sha256(`nin:${nin}`);

  const existing = await queryOne(
    `SELECT id FROM kyc_verifications WHERE user_id = $1 AND method = 'nin' AND tier_granted = 2`,
    [String(userId)]
  );
  if (existing) return { success: true, tier: 2, nameMatch: true, dobMatch: true, status: 'verified', providerRef: 'CACHED' };

  const result = simulateBureauCall(nin, `${firstName} ${lastName}`);

  await query(
    `INSERT INTO kyc_verifications (user_id, method, id_hash, provider, provider_ref, result, tier_granted)
     VALUES ($1, 'nin', $2, 'mock', $3, $4, $5)`,
    [String(userId), idHash, result.providerRef, JSON.stringify(result), result.success ? 2 : null]
  );

  if (result.success) {
    await query(
      `UPDATE users SET kyc_tier = 2, kyc_method = 'nin', kyc_ref = $1 WHERE id = $2 AND kyc_tier < 2`,
      [result.providerRef, String(userId)]
    );
  }

  return result;
}
