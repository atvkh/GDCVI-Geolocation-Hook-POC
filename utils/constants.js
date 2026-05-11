// utils/constants.js

export const APP_VERSION = '11.0';
export const APP_VERSION_CODE = 110;

export const UPDATE_JSON_URL = 'https://raw.githubusercontent.com/atvkh/GDCVI-Geolocation-Hook-POC/main/update.json'; 

export const INJECT_MAX_ATTEMPTS = 150; 
export const INJECT_INTERVAL_MS = 20;   
export const MAX_HISTORY_RECORDS = 15;

// 清远校区预设点
export const QINGYUAN_PRESETS = [
	{ name: '预设点1', lat: 23.73513, lng: 113.088972 },
	{ name: '预设点2', lat: 23.734781, lng: 113.090269 },
	{ name: '预设点3', lat: 23.734615, lng: 113.092023 },
	{ name: '预设点4', lat: 23.736584, lng: 113.091161 },
	{ name: '预设点5', lat: 23.739303, lng: 113.091289 }
];

// 广州校区预设点
export const GUANGZHOU_PRESETS = [
	{ name: '预设点1', lat: 23.268482, lng: 113.247895 },
	{ name: '预设点2', lat: 23.268913, lng: 113.247954 },
	{ name: '预设点3', lat: 23.268517, lng: 113.249177 },
	{ name: '预设点4', lat: 23.268242, lng: 113.24636 },
	{ name: '预设点5', lat: 23.267892, lng: 113.246978 }
];

// 默认使用清远校区第一个预设点
export const DEFAULT_LAT = QINGYUAN_PRESETS[0].lat;
export const DEFAULT_LNG = QINGYUAN_PRESETS[0].lng;

// 保持兼容性
export const PRESET_LOCATIONS = QINGYUAN_PRESETS;