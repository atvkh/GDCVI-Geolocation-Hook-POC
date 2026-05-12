import { describe, it, expect, beforeEach } from 'vitest';
import { secureGet, secureSet } from '@/utils/crypto.js';
import { MAX_HISTORY_RECORDS } from '@/utils/constants.js';

// 模拟 __handleCheckinResult 的核心逻辑
function createCheckinResult(historyList, isSuccess, msg, fakeLat, fakeLng) {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const ss = now.getSeconds().toString().padStart(2, '0');
  const timeStr = `${hh}:${mm}:${ss}`;
  const dateStr = now.toISOString().split('T')[0];
  
  historyList.unshift({ 
    time: timeStr, 
    date: dateStr, 
    lat: fakeLat, 
    lng: fakeLng, 
    status: isSuccess ? '成功' : '失败', 
    reason: msg || '' 
  });
  
  const trimmed = historyList.slice(0, MAX_HISTORY_RECORDS);
  secureSet('historyList', trimmed);
  
  return trimmed;
}

describe('历史记录逻辑', () => {
  let historyList;
  
  beforeEach(() => {
    historyList = [];
  });

  describe('createCheckinResult', () => {
    it('成功打卡应添加成功记录', () => {
      const result = createCheckinResult(historyList, true, '', 23.735, 113.088);
      
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('成功');
      expect(result[0].reason).toBe('');
    });

    it('失败打卡应添加失败记录和原因', () => {
      const result = createCheckinResult(historyList, false, '距离太远', 23.735, 113.088);
      
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('失败');
      expect(result[0].reason).toBe('距离太远');
    });

    it('记录应包含正确的时间格式', () => {
      const result = createCheckinResult(historyList, true, '', 23.735, 113.088);
      
      expect(result[0].time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('记录应包含正确的日期格式', () => {
      const result = createCheckinResult(historyList, true, '', 23.735, 113.088);
      
      expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('记录应包含坐标信息', () => {
      const result = createCheckinResult(historyList, true, '', 23.73513, 113.088972);
      
      expect(result[0].lat).toBe(23.73513);
      expect(result[0].lng).toBe(113.088972);
    });

    it('新记录应插入到列表开头', () => {
      // 添加第一条记录
      createCheckinResult(historyList, true, '', 23.735, 113.088);
      
      // 添加第二条记录
      const result = createCheckinResult(historyList, false, '失败', 23.736, 113.089);
      
      expect(result[0].status).toBe('失败');
      expect(result[1].status).toBe('成功');
    });
  });

  describe('历史记录数量限制', () => {
    it(`保存的记录数不应超过 ${MAX_HISTORY_RECORDS} 条`, () => {
      // 添加超过限制的记录
      for (let i = 0; i < MAX_HISTORY_RECORDS + 5; i++) {
        createCheckinResult(historyList, true, '', 23.735, 113.088);
      }
      
      // 从 storage 读取验证
      const stored = secureGet('historyList');
      expect(stored).toHaveLength(MAX_HISTORY_RECORDS);
    });

    it('超出限制时应保留最新的记录', () => {
      // 添加 20 条记录
      for (let i = 0; i < 20; i++) {
        createCheckinResult(historyList, i % 2 === 0, `msg${i}`, 23.735, 113.088);
      }
      
      // 从 storage 读取，第一条应该是最后添加的（索引 19，即 i=19，偶数，成功）
      const stored = secureGet('historyList');
      expect(stored[0].reason).toBe('msg19');
    });
  });

  describe('持久化存储', () => {
    it('记录应被保存到 uni storage', () => {
      createCheckinResult(historyList, true, '', 23.735, 113.088);
      
      const stored = secureGet('historyList');
      expect(stored).not.toBeNull();
      expect(stored).toHaveLength(1);
    });

    it('从 storage 读取的记录应与内存一致', () => {
      createCheckinResult(historyList, true, 'test', 23.735, 113.088);
      
      const stored = secureGet('historyList');
      expect(stored).toEqual(historyList);
    });
  });
});

describe('TabHistory computed 逻辑', () => {
  // 模拟 TabHistory 的 computed
  function getSuccessCount(list) {
    return list.filter(item => item.status !== '失败').length;
  }
  
  function getFailCount(list) {
    return list.filter(item => item.status === '失败').length;
  }
  
  function getWeekCount(list) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return list.filter(item => {
      if (!item.date) return true;
      const itemDate = new Date(item.date);
      return itemDate >= weekAgo;
    }).length;
  }

  it('成功计数正确', () => {
    const list = [
      { status: '成功' },
      { status: '成功' },
      { status: '失败' },
      { status: '成功' }
    ];
    
    expect(getSuccessCount(list)).toBe(3);
  });

  it('失败计数正确', () => {
    const list = [
      { status: '成功' },
      { status: '失败' },
      { status: '失败' }
    ];
    
    expect(getFailCount(list)).toBe(2);
  });

  it('空列表计数为 0', () => {
    expect(getSuccessCount([])).toBe(0);
    expect(getFailCount([])).toBe(0);
  });

  it('无 status 字段默认为成功', () => {
    const list = [
      { time: '12:00:00' },
      { status: '成功' }
    ];
    
    expect(getSuccessCount(list)).toBe(2);
    expect(getFailCount(list)).toBe(0);
  });
});
