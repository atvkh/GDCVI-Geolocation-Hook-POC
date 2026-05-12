// utils/constants.js

export const APP_VERSION = '11.0.0';
export const APP_VERSION_CODE = 111;

export const UPDATE_JSON_URL = 'https://raw.githubusercontent.com/atvkh/GDCVI-Geolocation-Hook-POC/main/update.json'; 

export const INJECT_MAX_ATTEMPTS = 150; 
export const INJECT_INTERVAL_MS = 20;   
export const MAX_HISTORY_RECORDS = 15;

// 坐标拾取器链接
export const COORD_PICKER_URL = 'https://lbs.qq.com/getPoint/';

// 预设主题色
export const THEME_COLORS = [
	{ name: '深海蓝', primary: 'rgb(0, 95, 156)', primarySoft: 'rgba(0, 95, 156, 0.3)', bgDark: '#081020', bgBase: '#0a1628', bgGradient: 'linear-gradient(145deg, #081020 0%, #0d1e35 50%, #0a1628 100%)', border: 'rgba(50, 80, 130, 0.3)', borderLight: 'rgba(60, 100, 160, 0.2)', glassBg: 'rgba(15, 30, 60, 0.6)', glassBgThick: 'rgba(20, 40, 75, 0.7)', glassShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(100, 150, 220, 0.1)' },
	{ name: '星云紫', primary: 'rgb(140, 80, 200)', primarySoft: 'rgba(140, 80, 200, 0.3)', bgDark: '#100818', bgBase: '#140a20', bgGradient: 'linear-gradient(145deg, #100818 0%, #1a1030 50%, #140a20 100%)', border: 'rgba(120, 80, 180, 0.3)', borderLight: 'rgba(140, 100, 200, 0.2)', glassBg: 'rgba(30, 15, 50, 0.6)', glassBgThick: 'rgba(40, 20, 65, 0.7)', glassShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(180, 140, 240, 0.1)' },
	{ name: '翡翠绿', primary: 'rgb(0, 150, 100)', primarySoft: 'rgba(0, 150, 100, 0.3)', bgDark: '#081510', bgBase: '#0a1a14', bgGradient: 'linear-gradient(145deg, #081510 0%, #0d2518 50%, #0a1a14 100%)', border: 'rgba(50, 130, 80, 0.3)', borderLight: 'rgba(60, 160, 100, 0.2)', glassBg: 'rgba(15, 40, 30, 0.6)', glassBgThick: 'rgba(20, 50, 40, 0.7)', glassShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(100, 200, 150, 0.1)' },
	{ name: '烈焰红', primary: 'rgb(200, 60, 50)', primarySoft: 'rgba(200, 60, 50, 0.3)', bgDark: '#180808', bgBase: '#1e0a0a', bgGradient: 'linear-gradient(145deg, #180808 0%, #2a0d0d 50%, #1e0a0a 100%)', border: 'rgba(180, 50, 50, 0.3)', borderLight: 'rgba(200, 60, 60, 0.2)', glassBg: 'rgba(50, 15, 15, 0.6)', glassBgThick: 'rgba(65, 20, 20, 0.7)', glassShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(220, 100, 100, 0.1)' },
	{ name: '琥珀金', primary: 'rgb(180, 120, 40)', primarySoft: 'rgba(180, 120, 40, 0.3)', bgDark: '#151008', bgBase: '#1a140a', bgGradient: 'linear-gradient(145deg, #151008 0%, #251a0d 50%, #1a140a 100%)', border: 'rgba(160, 100, 40, 0.3)', borderLight: 'rgba(180, 120, 50, 0.2)', glassBg: 'rgba(40, 30, 15, 0.6)', glassBgThick: 'rgba(50, 40, 20, 0.7)', glassShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(200, 160, 80, 0.1)' },
	{ name: '冰川蓝', primary: 'rgb(60, 140, 200)', primarySoft: 'rgba(60, 140, 200, 0.3)', bgDark: '#081018', bgBase: '#0a1420', bgGradient: 'linear-gradient(145deg, #081018 0%, #0d1a28 50%, #0a1420 100%)', border: 'rgba(50, 100, 160, 0.3)', borderLight: 'rgba(60, 120, 180, 0.2)', glassBg: 'rgba(15, 25, 45, 0.6)', glassBgThick: 'rgba(20, 35, 55, 0.7)', glassShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(100, 160, 220, 0.1)' },
	{ name: '樱花粉', primary: 'rgb(200, 100, 140)', primarySoft: 'rgba(200, 100, 140, 0.3)', bgDark: '#180810', bgBase: '#1e0a14', bgGradient: 'linear-gradient(145deg, #180810 0%, #280d1a 50%, #1e0a14 100%)', border: 'rgba(180, 80, 120, 0.3)', borderLight: 'rgba(200, 100, 140, 0.2)', glassBg: 'rgba(45, 15, 30, 0.6)', glassBgThick: 'rgba(55, 20, 40, 0.7)', glassShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(220, 140, 180, 0.1)' },
	{ name: '暗夜黑', primary: 'rgb(120, 120, 130)', primarySoft: 'rgba(120, 120, 130, 0.3)', bgDark: '#0a0a0c', bgBase: '#0e0e10', bgGradient: 'linear-gradient(145deg, #0a0a0c 0%, #141418 50%, #0e0e10 100%)', border: 'rgba(80, 80, 90, 0.3)', borderLight: 'rgba(100, 100, 110, 0.2)', glassBg: 'rgba(20, 20, 25, 0.6)', glassBgThick: 'rgba(30, 30, 35, 0.7)', glassShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(150, 150, 160, 0.1)' }
];

// 默认学校数据
export const DEFAULT_SCHOOLS = [
	{
		id: 'gdjy',
		name: '广东建设职业技术学院',
		themeIndex: 0,
		campuses: [
			{
				name: '清远校区',
				presets: [
					{ name: '预设点1', lat: 23.73513, lng: 113.088972 },
					{ name: '预设点2', lat: 23.734781, lng: 113.090269 },
					{ name: '预设点3', lat: 23.734615, lng: 113.092023 },
					{ name: '预设点4', lat: 23.736584, lng: 113.091161 },
					{ name: '预设点5', lat: 23.739303, lng: 113.091289 }
				]
			},
			{
				name: '广州校区',
				presets: [
					{ name: '预设点1', lat: 23.268482, lng: 113.247895 },
					{ name: '预设点2', lat: 23.268913, lng: 113.247954 },
					{ name: '预设点3', lat: 23.268517, lng: 113.249177 },
					{ name: '预设点4', lat: 23.268242, lng: 113.24636 },
					{ name: '预设点5', lat: 23.267892, lng: 113.246978 }
				]
			}
		]
	}
];

// 获取学校列表
export const getSchoolList = () => {
	const stored = uni.getStorageSync('schoolList');
	if (stored && stored.length > 0) {
		return stored;
	}
	return DEFAULT_SCHOOLS;
};

// 保存学校列表
export const saveSchoolList = (list) => {
	uni.setStorageSync('schoolList', list);
};

// 获取当前学校ID
export const getCurrentSchoolId = () => {
	return uni.getStorageSync('currentSchoolId') || 'gdjy';
};

// 保存当前学校ID
export const saveCurrentSchoolId = (id) => {
	uni.setStorageSync('currentSchoolId', id);
};

// 获取当前校区索引
export const getCurrentCampusIndex = () => {
	return uni.getStorageSync('currentCampusIndex') || 0;
};

// 保存当前校区索引
export const saveCurrentCampusIndex = (index) => {
	uni.setStorageSync('currentCampusIndex', index);
};

// 生成唯一ID
export const generateId = () => {
	return 'school_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};
