'use client';

// --- Utilities ---
const b64 = (arr: ArrayBuffer): string => btoa(String.fromCharCode(...new Uint8Array(arr)));
const ub64 = (str: string): Uint8Array => Uint8Array.from(atob(str), c => c.charCodeAt(0));

// --- Key Management ---

/**
 * Generates an X25519 key pair for ECDH.
 * @returns {Promise<CryptoKeyPair>} The generated key pair.
 */
async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'X25519' },
    true,
    ['deriveKey']
  );
}

/**
 * Exports a CryptoKey to a Base64 encoded string.
 * @param format - The format to export ('pkcs8' for private, 'raw' for public).
 * @param key - The CryptoKey to export.
 * @returns {Promise<string>} The Base64 encoded key.
 */
export async function exportKey(format: 'pkcs8' | 'raw', key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey(format, key);
    return b64(exported);
}


/**
 * Imports a private key from a Base64 string into a CryptoKey.
 * @param privateKeyB64 - The Base64 encoded private key.
 * @returns {Promise<CryptoKey>} The imported private CryptoKey.
 */
export async function importPrivateKey(privateKeyB64: string): Promise<CryptoKey> {
    const privateKeyAB = ub64(privateKeyB64).buffer;
    return await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyAB,
        { name: 'ECDH', namedCurve: 'X25519' },
        true,
        ['deriveKey']
    );
}

/**
 * Imports a public key from a Base64 string into a CryptoKey.
 * @param publicKeyB64 - The Base64 encoded public key.
 * @returns {Promise<CryptoKey>} The imported public CryptoKey.
 */
export async function importPublicKey(publicKeyB64: string): Promise<CryptoKey> {
    const publicKeyAB = ub64(publicKeyB64).buffer;
    return await window.crypto.subtle.importKey(
        'raw',
        publicKeyAB,
        { name: 'ECDH', namedCurve: 'X25519' },
        false,
        []
    );
}


/**
 * Generates a new key pair and returns the private key object and the public key as Base64.
 */
export async function generateAndExportKeyPair(): Promise<{ privateKey: CryptoKey, publicKeyBase64: string }> {
    const keyPair = await generateKeyPair();
    const publicKeyBase64 = await exportKey('raw', keyPair.publicKey);
    return { privateKey: keyPair.privateKey, publicKeyBase64 };
}


// --- Shared Secret and Encryption ---

/**
 * Derives a shared AES-GCM key from a private key and a public key.
 * @param myPrivateKey - The current user's private CryptoKey.
 * @param otherUserPublicKey - The other user's public CryptoKey.
 * @returns {Promise<CryptoKey>} The derived shared secret key for AES-GCM.
 */
export async function deriveSharedKey(myPrivateKey: CryptoKey, otherUserPublicKey: CryptoKey): Promise<CryptoKey> {
  return await window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: otherUserPublicKey },
    myPrivateKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext message using AES-GCM.
 * @param sharedKey - The shared AES CryptoKey.
 * @param plaintext - The string to encrypt.
 * @returns {Promise<{ cipherText: string, iv: string }>} Base64 encoded ciphertext and IV.
 */
export async function encryptMessage(sharedKey: CryptoKey, plaintext: string): Promise<{ cipherText: string, iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedPlaintext = new TextEncoder().encode(plaintext);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    encodedPlaintext
  );

  return {
    cipherText: b64(ciphertext),
    iv: b64(iv.buffer),
  };
}


/**
 * Decrypts a ciphertext using AES-GCM.
 * @param sharedKey - The shared AES CryptoKey.
 * @param ciphertextB64 - The Base64 encoded ciphertext.
 * @param ivB64 - The Base64 encoded IV.
 * @returns {Promise<string>} The decrypted plaintext.
 */
export async function decryptMessage(sharedKey: CryptoKey, ciphertextB64: string, ivB64: string): Promise<string> {
    const ciphertext = ub64(ciphertextB64).buffer;
    const iv = ub64(ivB64).buffer;
  
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      ciphertext
    );
  
    return new TextDecoder().decode(decrypted);
}
