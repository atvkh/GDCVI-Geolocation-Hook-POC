// 测试环境初始化 - Mock UniApp API

// Mock uni 对象
global.uni = {
  storage: {},
  
  getStorageSync(key) {
    return this.storage[key] || '';
  },
  
  setStorageSync(key, value) {
    this.storage[key] = value;
  },
  
  removeStorageSync(key) {
    delete this.storage[key];
  },
  
  showToast(options) {
    // 静默处理
  },
  
  getClipboardData(options) {
    if (options && options.success) {
      options.success({ data: '' });
    }
  },
  
  setClipboardData(options) {
    if (options && options.success) {
      options.success();
    }
  },
  
  request(options) {
    // 静默处理
  }
};

// Mock plus 对象 (APP-PLUS 环境)
global.plus = {
  webview: {
    currentWebview() {
      return {
        parent() { return null; },
        opener() { return null; },
        children() { return []; }
      };
    }
  },
  runtime: {
    openURL(url) {}
  }
};

// 每个测试前清理 storage
beforeEach(() => {
  global.uni.storage = {};
});
