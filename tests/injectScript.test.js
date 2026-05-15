import { describe, it, expect } from 'vitest';
import { generateCoreScript } from '@/utils/injectScript.js';

describe('injectScript.js - 脚本生成', () => {
  
  describe('generateCoreScript', () => {
    it('应返回字符串', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      expect(typeof script).toBe('string');
    });

    it('应包含 IIFE 包装', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      expect(script).toContain('(function(){');
      expect(script).toContain('})();');
    });

    it('应包含坐标值', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      expect(script).toContain('23.73513');
      expect(script).toContain('113.088972');
    });

    it('应包含防重复激活检查', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      expect(script).toContain('__CYBER_HOOK_ACTIVE__');
    });

    it('应包含 Geolocation 拦截', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      expect(script).toContain('getCurrentPosition');
      expect(script).toContain('watchPosition');
    });

    it('应包含 XMLHttpRequest 拦截', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      expect(script).toContain('XMLHttpRequest.prototype.send');
    });

    it('应包含确认框功能', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      expect(script).toContain('showConfirmBox');
    });

    it('应包含按钮检测逻辑', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      expect(script).toContain('签到');
      expect(script).toContain('打卡');
    });

    it('应包含错误处理', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      expect(script).toContain('try');
      expect(script).toContain('catch');
    });

    it('生成的脚本语法应有效', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      expect(() => new Function(script)).not.toThrow();
    });
  });
});

describe('injectScript.js - 深度拦截验证', () => {
  
  it('应包含 Object.defineProperty 拦截 navigator.geolocation', () => {
    const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
    expect(script).toContain('Object.defineProperty');
    expect(script).toContain('navigator');
    expect(script).toContain('geolocation');
  });

  it('应包含腾讯地图 SDK 拦截', () => {
    const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
    expect(script).toContain('qq.maps');
    expect(script).toContain('Geolocation');
    expect(script).toContain('getLocation');
  });

  it('应包含按钮禁用检测', () => {
    const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
    expect(script).toContain('isButtonDisabled');
    expect(script).toContain('van-button--disabled');
    expect(script).toContain('pointerEvents');
  });
});
