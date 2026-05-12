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
      expect(script).toContain('XMLHttpRequest.prototype.open');
      expect(script).toContain('XMLHttpRequest.prototype.send');
    });

    it('应包含 fetch 拦截', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      expect(script).toContain('window.fetch');
    });

    it('应包含 showToast 函数', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      expect(script).toContain('showToast');
    });

    it('应包含 __handleCheckinResult 调用', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      expect(script).toContain('__handleCheckinResult');
    });

    it('应包含坐标同步函数', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      expect(script).toContain('__updateGlobalCoords');
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
      expect(script).toContain('console.warn');
      expect(script).toContain('try');
      expect(script).toContain('catch');
    });

    it('生成的脚本语法应有效', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      // 不抛出异常即为有效
      expect(() => new Function(script)).not.toThrow();
    });
  });
});

describe('injectScript.js - 脚本内容验证', () => {
  
  it('应包含 jitter 随机偏移函数', () => {
    const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
    expect(script).toContain('getJitter');
  });

  it('应包含 fakeData 生成函数', () => {
    const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
    expect(script).toContain('getFakeData');
  });

  it('应包含 Proxy 拦截', () => {
    const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
    expect(script).toContain('new Proxy');
  });

    it('应包含腾讯地图 SDK 拦截', () => {
      const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
      // 脚本通过 Proxy 拦截 qq 对象，包含 maps 属性检查
      expect(script).toContain('maps');
      expect(script).toContain('hookTencentGeo');
    });

  it('应包含 HUD 显示功能', () => {
    const script = generateCoreScript(23.73513, 113.088972, '.btn', 23.735, 113.088);
    expect(script).toContain('cyber_hud');
    expect(script).toContain('GEO-PROXY ACTIVE');
  });
});
