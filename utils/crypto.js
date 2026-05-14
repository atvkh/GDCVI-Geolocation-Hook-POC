// utils/crypto.js
// 简单的加密工具，用于本地敏感数据脱敏

const ENCRYPTION_KEY = 'phantom_sign_2024';

/**
 * 修复问题2：解决 btoa/atob 在处理中文字符时的异常，以及在 App 逻辑层可能缺失的问题
 */

// 自定义 Base64 实现，确保在任何 JS 环境下可用
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const btoa_poly = (input) => {
  let str = String(input);
  let output = '';
  for (let block, charCode, idx = 0, map = chars; str.charAt(idx | 0) || (map = '=', idx % 1); output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
    charCode = str.charCodeAt(idx += 3 / 4);
    if (charCode > 0xFF) throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
    block = block << 8 | charCode;
  }
  return output;
};

const atob_poly = (input) => {
  let str = String(input).replace(/[=]+$/, '');
  let output = '';
  if (str.length % 4 == 1) throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  for (let bc = 0, bs, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
};

const _btoa = typeof btoa === 'function' ? btoa : btoa_poly;
const _atob = typeof atob === 'function' ? atob : atob_poly;

// 简单的 XOR 加密
export function encrypt(data) {
  if (!data) return '';
  // 先进行 URI 编码，确保中文字符转为 ASCII 序列
  const str = encodeURIComponent(typeof data === 'string' ? data : JSON.stringify(data));
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(
      str.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    );
  }
  return _btoa(result);
}

// 解密
export function decrypt(encoded) {
  if (!encoded) return '';
  try {
    const str = _atob(encoded);
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(
        str.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    // 解码 URI 序列回中文字符
    return decodeURIComponent(result);
  } catch (e) {
    return encoded;
  }
}

// 安全存储
export function secureSet(key, value) {
  try {
    const encrypted = encrypt(JSON.stringify(value));
    uni.setStorageSync(key, encrypted);
  } catch (e) {
    console.warn('[Crypto] Failed to encrypt:', key, e);
    uni.setStorageSync(key, JSON.stringify(value));
  }
}

// 安全读取
export function secureGet(key) {
  try {
    const data = uni.getStorageSync(key);
    if (!data) return null;
    
    // 尝试解密
    const decrypted = decrypt(data);
    try {
      return JSON.parse(decrypted);
    } catch (e) {
      // 如果解密失败，尝试直接解析（兼容旧数据）
      try {
        return JSON.parse(data);
      } catch (e2) {
        return data;
      }
    }
  } catch (e) {
    return null;
  }
}

// 清除所有敏感数据
export function clearAllSensitiveData() {
  const keys = [
    'cyberUserMatrix',
    'historyList',
    'fakeLat',
    'fakeLng',
    'useRandomPreset',
    'schoolList',
    'currentSchoolId',
    'currentCampusIndex'
  ];
  
  keys.forEach(key => {
    try {
      uni.removeStorageSync(key);
    } catch (e) {
      console.warn('[Crypto] Failed to remove:', key);
    }
  });
}
