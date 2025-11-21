
'use client';

// --- Helper Functions ---
function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function ab2str(buf: ArrayBuffer): string {
  return String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)));
}

function ab_to_b64(buffer: ArrayBuffer): string {
  return btoa(ab2str(buffer));
}

function b64_to_ab(b64: string): ArrayBuffer {
  return str2ab(atob(b64));
}

/**
 * Generates an X25519 key pair for ECDH.
 * Stores the private key in localStorage and returns the public key.
 */
export async function generateAndStoreKeyPair(): Promise<{ publicKeyBase64: string, privateKey: CryptoKey }> {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'X25519' },
    true,
    ['deriveKey']
  );

  const publicKey = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
  const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKeyBase64 = ab_to_b64(publicKey);
  const privateKeyBase64 = ab_to_b64(privateKey);

  localStorage.setItem('e2ee_private_key', privateKeyBase64);

  return { publicKeyBase64, privateKey: keyPair.privateKey };
}

/**
 * Retrieves the user's private key from localStorage.
 */
export async function getMyPrivateKey(): Promise<CryptoKey | null> {
  const privateKeyB64 = localStorage.getItem('e2ee_private_key');
  if (!privateKeyB64) {
    return null;
  }
  try {
    const privateKeyAB = b64_to_ab(privateKeyB64);
    return await window.crypto.subtle.importKey(
      'pkcs8',
      privateKeyAB,
      { name: 'ECDH', namedCurve: 'X25519' },
      true,
      ['deriveKey']
    );
  } catch (error) {
    console.error("Failed to import private key:", error);
    localStorage.removeItem('e2ee_private_key');
    return null;
  }
}

/**
 * Encrypts a message with a public key (RSA-OAEP for key wrapping).
 * Used to securely transmit a session key.
 */
export async function encryptMessage(publicKeyB64: string, plaintext: string): Promise<{ key: string, iv: string }> {
    const publicKey = await window.crypto.subtle.importKey(
        'raw',
        b64_to_ab(publicKeyB64),
        { name: 'ECDH', namedCurve: 'X25519' },
        false,
        []
    );
    const tempKeyPair = await window.crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'X25519' },
        true,
        ['deriveKey']
    );
    const sharedSecret = await window.crypto.subtle.deriveKey(
        { name: 'ECDH', public: publicKey },
        tempKeyPair.privateKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
    const ephemeralPublicKey = await window.crypto.subtle.exportKey('raw', tempKeyPair.publicKey);
    
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedPlaintext = new TextEncoder().encode(plaintext);

    const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        sharedSecret,
        encodedPlaintext
    );
    
    const combined = new Uint8Array(ephemeralPublicKey.byteLength + ciphertext.byteLength);
    combined.set(new Uint8Array(ephemeralPublicKey), 0);
    combined.set(new Uint8Array(ciphertext), ephemeralPublicKey.byteLength);
    
    return {
        key: ab_to_b64(combined),
        iv: ab_to_b64(iv),
    };
}


/**
 * Decrypts a message with a private key (RSA-OAEP for key unwrapping).
 * Used to securely receive a session key.
 */
export async function decryptMessage(privateKey: CryptoKey, combinedB64: string, ivB64: string, isSessionKey: boolean = false): Promise<string> {
    const combined = b64_to_ab(combinedB64);
    const iv = b64_to_ab(ivB64);
    
    const ephemeralPublicKey = await window.crypto.subtle.importKey(
        'raw',
        combined.slice(0, 32),
        { name: 'ECDH', namedCurve: 'X25519' },
        false,
        []
    );

    const ciphertext = combined.slice(32);

    const sharedSecret = await window.crypto.subtle.deriveKey(
        { name: 'ECDH', public: ephemeralPublicKey },
        privateKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        sharedSecret,
        ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
}
