import { Noir } from '@noir-lang/noir_js';
import { computeCommitment, computeNullifier, fieldToString, randomField, userIdToField } from './fields.js';

const BB_JS_BROWSER_ENTRY = '/vendor/bb.js/index.js';
const BB_JS_NODE_ENTRY = '@aztec/bb.js';

async function loadBbJs() {
  const entry = typeof window === 'undefined' ? BB_JS_NODE_ENTRY : BB_JS_BROWSER_ENTRY;
  return import(/* @vite-ignore */ entry);
}

export async function createAuthInputs({ deviceSecret, userId, usbSerial = 0, challenge = randomField() }) {
  const userIdHash = await userIdToField(userId);
  return {
    privateInputs: {
      device_secret: deviceSecret,
      usb_serial: usbSerial,
      commitment: computeCommitment(deviceSecret, userIdHash),
      challenge,
      user_id_hash: userIdHash,
    },
    publicInputs: {
      usb_serial: usbSerial,
      commitment: computeCommitment(deviceSecret, userIdHash),
      challenge,
      user_id_hash: userIdHash,
      expected_nullifier: computeNullifier(deviceSecret, challenge, userIdHash, usbSerial),
    },
  };
}

export async function generateAndVerifyProof(circuit, authInputs) {
  const { Barretenberg, UltraHonkBackend } = await loadBbJs();
  const barretenberg = await Barretenberg.new();
  try {
    const noir = new Noir(circuit);
    const backend = new UltraHonkBackend(circuit.bytecode, barretenberg);
    const { witness, returnValue } = await noir.execute(authInputs.privateInputs);
    const proof = await backend.generateProof(witness);
    const verified = await backend.verifyProof(proof);
    return {
      proof,
      verified,
      nullifier: fieldToString(returnValue ?? authInputs.publicInputs.expected_nullifier),
      publicInputs: authInputs.publicInputs,
    };
  } finally {
    await barretenberg.destroy();
  }
}

export function proofToJson(result) {
  return {
    verified: result.verified,
    nullifier: result.nullifier,
    publicInputs: result.publicInputs,
    proof: Array.from(result.proof.proof),
    proofPublicInputs: result.proof.publicInputs?.map(String) ?? [],
  };
}
