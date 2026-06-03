import { strict as assert } from 'node:assert';
import { createAuthInputs, generateAndVerifyProof } from '../src/proof.js';
import circuit from '../src/circuit-artifact.js';

describe('Noir USB auth proof', () => {
  it('normalizes hex-looking USB serials before witness generation', async () => {
    const authInputs = await createAuthInputs({
      deviceSecret: '11',
      userId: 'demo-user',
      usbSerial: '00E04C3622F4',
      challenge: '19',
    });

    assert.equal(authInputs.privateInputs.usb_serial, BigInt('0x00E04C3622F4').toString());
    assert.equal(authInputs.publicInputs.usb_serial, authInputs.privateInputs.usb_serial);
  });

  it('generates and verifies a proof for a valid encrypted-device secret flow', async () => {
    const authInputs = await createAuthInputs({
      deviceSecret: '11',
      userId: 'demo-user',
      challenge: '19',
    });

    const result = await generateAndVerifyProof(circuit, authInputs);

    assert.equal(result.verified, true);
    assert.equal(result.nullifier, authInputs.publicInputs.expected_nullifier);
  });
});
