// utils/crypto.js
// 简单的加密工具，用于本地敏感数据脱敏

const ENCRYPTION_KEY = 'phantom_sign_2024';

// 简单的 XOR 加密
export function encrypt(data) {
  if (!data) return '';
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(
      str.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    );
  }
  return btoa(result);
}

// 解密
export function decrypt(encoded) {
  if (!encoded) return '';
  try {
    const str = atob(encoded);
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(
        str.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    return result;
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
    console.warn('[Crypto] Failed to encrypt:', key);
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
