
'use client';

// --- Utilities ---
const b64 = (arr: ArrayBuffer): string => btoa(String.fromCharCode(...new Uint8Array(arr)));
const ub64 = (str: string): Uint8Array => Uint8Array.from(atob(str), c => c.charCodeAt(0));

// --- AES-GCM Key Management ---

/**
 * Generates a new AES-256-GCM key.
 * @returns {Promise<CryptoKey>} The generated key.
 */
async function generateAesKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Exports a CryptoKey to a Base64 encoded string.
 * @param key - The CryptoKey to export.
 * @returns {Promise<string>} The Base64 encoded key.
 */
export async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return b64(exported);
}

/**
 * Imports an AES-GCM key from a Base64 string.
 * @param keyB64 - The Base64 encoded key.
 * @returns {Promise<CryptoKey>} The imported CryptoKey.
 */
export async function importKey(keyB64: string): Promise<CryptoKey> {
    const keyBuffer = ub64(keyB64).buffer;
    return await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

/**
 * Generates a new AES key and exports it as a Base64 string.
 */
export async function generateAndExportKey(): Promise<string> {
    const key = await generateAesKey();
    return exportKey(key);
}

// --- Encryption and Decryption ---

/**
 * Encrypts a plaintext message using AES-GCM.
 * @param key - The shared AES CryptoKey.
 * @param plaintext - The string to encrypt.
 * @returns {Promise<{ cipherText: string, iv: string }>} Base64 encoded ciphertext and IV.
 */
export async function encryptMessage(key: CryptoKey, plaintext: string): Promise<{ cipherText: string, iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedPlaintext = new TextEncoder().encode(plaintext);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedPlaintext
  );

  return {
    cipherText: b64(ciphertext),
    iv: b64(iv.buffer),
  };
}


/**
 * Decrypts a ciphertext using AES-GCM.
 * @param key - The shared AES CryptoKey.
 * @param ciphertextB64 - The Base64 encoded ciphertext.
 * @param ivB64 - The Base64 encoded IV.
 * @returns {Promise<string>} The decrypted plaintext.
 */
export async function decryptMessage(key: CryptoKey, ciphertextB64: string, ivB64: string): Promise<string> {
    const ciphertext = ub64(ciphertextB64).buffer;
    const iv = ub64(ivB64).buffer;
  
    try {
        const decrypted = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          ciphertext
        );
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error("Decryption failed:", e);
        return "Failed to decrypt message.";
    }
}
