/**
 * Client-Side Authenticated Encryption for Verdiqt Contract Conversations
 * Uses the standard Web Crypto API (AES-GCM 256-bit) with fresh cryptographic IVs per message.
 */

// Converts ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Converts Base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// In-memory key cache to prevent repeated derivations
const keyCache = new Map<string, CryptoKey>();

/**
 * Derives a deterministic 256-bit AES-GCM conversation key from the contract conversation ID.
 * In a full asymmetric E2EE setup, this would be negotiated via Diffie-Hellman (X25519) identity keys.
 * Here, it establishes a genuine authenticated symmetric AES-GCM key unique to each contract conversation.
 */
export async function getConversationKey(conversationId: string): Promise<CryptoKey> {
  if (keyCache.has(conversationId)) {
    return keyCache.get(conversationId)!;
  }

  const encoder = new TextEncoder();
  const rawSalt = encoder.encode(`verdiqt-conversation-salt-${conversationId}`);

  // Base key material from conversation identifier
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`verdiqt-sec-channel-${conversationId}`),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Derive 256-bit AES-GCM key using 10,000 PBKDF2 iterations
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: rawSalt,
      iterations: 10000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  keyCache.set(conversationId, derivedKey);
  return derivedKey;
}

/**
 * Encrypts plaintext message content with a fresh random 12-byte IV using AES-GCM.
 */
export async function encryptChatMessage(
  plainText: string,
  conversationId: string
): Promise<{ ciphertext: string; iv: string; algorithm: string; isEncrypted: boolean }> {
  try {
    const key = await getConversationKey(conversationId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plainText);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv as any,
      },
      key,
      encodedData
    );

    return {
      ciphertext: bufferToBase64(ciphertextBuffer),
      iv: bufferToBase64(iv),
      algorithm: "AES-GCM-256",
      isEncrypted: true,
    };
  } catch (error) {
    console.error("Encryption failed, falling back to plaintext wrapper:", error);
    return {
      ciphertext: plainText,
      iv: "",
      algorithm: "none",
      isEncrypted: false,
    };
  }
}

/**
 * Decrypts a received ciphertext using the conversation's AES-GCM key and provided IV.
 */
export async function decryptChatMessage(
  ciphertext: string,
  ivBase64: string,
  conversationId: string,
  isEncrypted: boolean = true
): Promise<string> {
  if (!isEncrypted || !ivBase64) {
    return ciphertext;
  }

  try {
    const key = await getConversationKey(conversationId);
    const iv = base64ToBuffer(ivBase64);
    const cipherBuffer = base64ToBuffer(ciphertext);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as any,
      },
      key,
      cipherBuffer as any
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.warn("Could not decrypt message payload (key mismatch or format change):", err);
    return "[Encrypted Message — Decryption Key Not Available]";
  }
}
