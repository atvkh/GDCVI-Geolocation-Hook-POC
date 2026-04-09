// utils/constants.js

// ==========================================
// 🚀 APP 版本与更新配置
// ==========================================
export const APP_VERSION = '10.7';
export const APP_VERSION_CODE = 107; // 每次发新版，把这个数字+1

// 👇 请将这里替换为你实际存放 update.json 的网络直链地址
export const UPDATE_JSON_URL = 'https://gitee.com/你的用户名/你的仓库/raw/master/update.json'; 

// ==========================================
// 🎯 核心定位与注入配置
// ==========================================
// 默认安全坐标 (广建清远校区)
export const DEFAULT_LAT = 23.738999;
export const DEFAULT_LNG = 113.0890105;

// Hook 注入配置
export const INJECT_MAX_ATTEMPTS = 150; // 最大重试注入次数
export const INJECT_INTERVAL_MS = 20;   // 每次重试的间隔毫秒数

// 弹窗与历史记录配置
export const HOOK_CONFIRM_DELAY = 2800; // 地图渲染等待时间
export const MAX_HISTORY_RECORDS = 15;  // 历史记录最大保存条数