import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, secureGet, secureSet } from '@/utils/crypto.js';

describe('crypto.js - 加解密纯函数', () => {
  
  describe('encrypt / decrypt', () => {
    it('能正确加密和解密字符串', () => {
      const original = 'Hello World';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      
      expect(encrypted).not.toBe(original);
      expect(decrypted).toBe(original);
    });

    it('能正确加密和解密 JSON 对象', () => {
      // 注意：btoa 不支持非 ASCII 字符，JSON 中的中文需要特殊处理
      const original = { name: 'test', lat: 23.73513 };
      const encrypted = encrypt(JSON.stringify(original));
      const decrypted = JSON.parse(decrypt(encrypted));
      
      expect(decrypted).toEqual(original);
    });

    it('能正确加密和解密中文（通过 encodeURIComponent）', () => {
      // 注意：btoa 不支持非 ASCII 字符，实际使用时中文需要先编码
      const original = '打卡成功';
      const encoded = encodeURIComponent(original);
      const encrypted = encrypt(encoded);
      const decrypted = decrypt(encrypted);
      
      expect(decodeURIComponent(decrypted)).toBe(original);
    });

    it('能正确加密和解密 URL 编码的字符串', () => {
      const original = encodeURIComponent('测试数据!@#$%');
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('能正确加密和解密空字符串', () => {
      const original = '';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('加密结果是 base64 格式', () => {
      const encrypted = encrypt('test');
      // base64 正则
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });

    it('相同输入产生相同输出（确定性加密）', () => {
      const input = 'test';
      expect(encrypt(input)).toBe(encrypt(input));
    });
  });
});

describe('crypto.js - 安全存取', () => {
  
  describe('secureSet / secureGet', () => {
    it('能正确存取数组', () => {
      const data = [
        { time: '12:00:00', date: '2024-01-01', status: '成功' },
        { time: '13:00:00', date: '2024-01-02', status: '失败' }
      ];
      
      secureSet('testList', data);
      const result = secureGet('testList');
      
      expect(result).toEqual(data);
    });

    it('能正确存取对象', () => {
      const data = { lat: 23.73513, lng: 113.088972 };
      
      secureSet('testObj', data);
      const result = secureGet('testObj');
      
      expect(result).toEqual(data);
    });

    it('能正确存取布尔值', () => {
      secureSet('testBool', true);
      expect(secureGet('testBool')).toBe(true);
      
      secureSet('testBool2', false);
      expect(secureGet('testBool2')).toBe(false);
    });

    it('能正确存取数字', () => {
      secureSet('testNum', 42);
      expect(secureGet('testNum')).toBe(42);
    });

    it('读取不存在的 key 返回 null', () => {
      expect(secureGet('nonexistent')).toBeNull();
    });

    it('存取历史记录格式数据', () => {
      const historyList = [];
      for (let i = 0; i < 15; i++) {
        historyList.push({
          time: `12:${i.toString().padStart(2, '0')}:00`,
          date: '2024-01-01',
          lat: 23.73513 + Math.random() * 0.001,
          lng: 113.088972 + Math.random() * 0.001,
          status: i % 3 === 0 ? '失败' : '成功',
          reason: i % 3 === 0 ? '距离太远' : ''
        });
      }
      
      secureSet('historyList', historyList);
      const result = secureGet('historyList');
      
      expect(result).toHaveLength(15);
      expect(result[0].time).toBe('12:00:00');
      expect(result[0].status).toBe('失败');
    });

    it('能正确处理包含引号的消息', () => {
      const data = { msg: "打卡'成功'" };
      
      secureSet('testQuote', data);
      const result = secureGet('testQuote');
      
      expect(result).toEqual(data);
    });
  });
});
