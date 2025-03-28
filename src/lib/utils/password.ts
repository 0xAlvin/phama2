// Using Web Crypto API instead of Node.js crypto module

/**
 * Converts a string to an ArrayBuffer for use with Web Crypto API
 */
function stringToBuffer(str: string): ArrayBuffer {
  const uint8Array = new TextEncoder().encode(str);
  return uint8Array.buffer as ArrayBuffer;
}

/**
 * Converts an ArrayBuffer to a hex string
 */
function bufferToHexString(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash password using SHA-256 with salt
 */
export async function saltAndHashPassword(password: string): Promise<string> {
  const salt = process.env.PASSWORD_SALT || 'default-salt-for-development';
  const data = stringToBuffer(password + salt);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHexString(hashBuffer);
}

/**
 * Verify password by comparing hashes
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const passwordHash = await saltAndHashPassword(password);
  return passwordHash === hashedPassword;
}
