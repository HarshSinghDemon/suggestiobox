
'use client';

// --- Helper Functions ---

/**
 * Converts a string to an ArrayBuffer.
 * @param str The string to convert.
 * @returns The resulting ArrayBuffer.
 */
function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

/**
 * Converts an ArrayBuffer to a string.
 * @param buf The ArrayBuffer to convert.
 * @returns The resulting string.
 */
function ab2str(buf: ArrayBuffer): string {
  return String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)));
}

/**
 * Converts an ArrayBuffer to a Base64 encoded string.
 * @param buffer The ArrayBuffer to convert.
 * @returns The Base64 encoded string.
 */
function ab_to_b64(buffer: ArrayBuffer): string {
  return btoa(ab2str(buffer));
}

/**
 * Converts a Base64 encoded string to an ArrayBuffer.
 * @param b64 The Base64 encoded string.
 * @returns The resulting ArrayBuffer.
 */
function b64_to_ab(b64: string): ArrayBuffer {
  return str2ab(atob(b64));
}


// --- Core Cryptography Functions ---

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
 * @returns The CryptoKey object for the private key, or null if not found.
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
    // If key is invalid, remove it. A new one will be generated on next login.
    localStorage.removeItem('e2ee_private_key');
    return null;
  }
}

/**
 * Derives a shared secret AES key for encryption/decryption between two users.
 * @param myPrivateKey The current user's private CryptoKey.
 * @param otherUserPublicKeyB64 The other user's public key as a Base64 string.
 * @returns A CryptoKey for AES-GCM.
 */
export async function deriveSharedKey(myPrivateKey: CryptoKey, otherUserPublicKeyB64: string): Promise<CryptoKey> {
  const otherUserPublicKeyAB = b64_to_ab(otherUserPublicKeyB64);
  const otherUserPublicKey = await window.crypto.subtle.importKey(
    'raw',
    otherUserPublicKeyAB,
    { name: 'ECDH', namedCurve: 'X25519' },
    false,
    []
  );

  const sharedSecret = await window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: otherUserPublicKey },
    myPrivateKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  return sharedSecret;
}

/**
 * Encrypts a message using AES-256-GCM.
 * @param sharedKey The shared AES CryptoKey.
 * @param plaintext The message to encrypt.
 * @returns The Base64 encoded ciphertext and Initialization Vector (IV).
 */
export async function encryptMessage(sharedKey: CryptoKey, plaintext: string): Promise<{ cipherText: string, iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV is recommended for GCM
  const encodedPlaintext = new TextEncoder().encode(plaintext);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    encodedPlaintext
  );

  return {
    cipherText: ab_to_b64(ciphertext),
    iv: ab_to_b64(iv),
  };
}

/**
 * Decrypts a message using AES-256-GCM.
 * @param sharedKey The shared AES CryptoKey.
 * @param ciphertextB64 The Base64 encoded ciphertext.
 * @param ivB64 The Base64 encoded Initialization Vector.
 * @returns The decrypted plaintext.
 */
export async function decryptMessage(sharedKey: CryptoKey, ciphertextB64: string, ivB64: string): Promise<string> {
  const ciphertext = b64_to_ab(ciphertextB64);
  const iv = b64_to_ab(ivB64);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
