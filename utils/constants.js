// utils/constants.js

export const APP_VERSION = '11.1.0';
export const APP_VERSION_CODE = 112;

export const UPDATE_JSON_URL = 'https://raw.githubusercontent.com/atvkh/GDCVI-Geolocation-Hook-POC/main/update.json'; 

export const INJECT_MAX_ATTEMPTS = 150; 
export const INJECT_INTERVAL_MS = 20;   
export const MAX_HISTORY_RECORDS = 15;

// 坐标拾取器链接
export const COORD_PICKER_URL = 'https://lbs.qq.com/getPoint/';

// 预设主题色 - 高端应用风格
export const THEME_COLORS = [
	{ 
		name: '极光蓝', 
		primary: 'rgb(50, 140, 220)', 
		primarySoft: 'rgba(50, 140, 220, 0.2)', 
		bgDark: '#060d18', 
		bgBase: '#0a1420', 
		bgGradient: 'linear-gradient(165deg, #060d18 0%, #0c1a2d 50%, #0a1420 100%)', 
		border: 'rgba(40, 80, 140, 0.25)', 
		borderLight: 'rgba(50, 100, 160, 0.12)', 
		glassBg: 'rgba(14, 28, 50, 0.6)', 
		glassBgThick: 'rgba(20, 38, 65, 0.7)', 
		glassShadow: '0 8px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(50, 140, 220, 0.08), inset 0 1px 0 rgba(80, 150, 240, 0.06)' 
	},
	{ 
		name: '薄荷绿', 
		primary: 'rgb(80, 200, 160)', 
		primarySoft: 'rgba(80, 200, 160, 0.15)', 
		bgDark: '#061210', 
		bgBase: '#0a1a16', 
		bgGradient: 'linear-gradient(165deg, #061210 0%, #0c2218 50%, #0a1a16 100%)', 
		border: 'rgba(60, 150, 120, 0.25)', 
		borderLight: 'rgba(70, 170, 140, 0.12)', 
		glassBg: 'rgba(14, 35, 28, 0.6)', 
		glassBgThick: 'rgba(20, 48, 38, 0.7)', 
		glassShadow: '0 8px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(80, 200, 160, 0.08), inset 0 1px 0 rgba(80, 200, 160, 0.06)' 
	},
	{ 
		name: '暮光橙', 
		primary: 'rgb(240, 140, 50)', 
		primarySoft: 'rgba(240, 140, 50, 0.15)', 
		bgDark: '#120a04', 
		bgBase: '#1a1008', 
		bgGradient: 'linear-gradient(165deg, #120a04 0%, #20140c 50%, #1a1008 100%)', 
		border: 'rgba(180, 110, 40, 0.25)', 
		borderLight: 'rgba(200, 120, 50, 0.12)', 
		glassBg: 'rgba(35, 22, 10, 0.6)', 
		glassBgThick: 'rgba(48, 30, 16, 0.7)', 
		glassShadow: '0 8px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(240, 140, 50, 0.08), inset 0 1px 0 rgba(240, 160, 80, 0.06)' 
	},
	{ 
		name: '霓虹紫', 
		primary: 'rgb(160, 80, 220)', 
		primarySoft: 'rgba(160, 80, 220, 0.15)', 
		bgDark: '#0a0614', 
		bgBase: '#0e0a1c', 
		bgGradient: 'linear-gradient(165deg, #0a0614 0%, #140e24 50%, #0e0a1c 100%)', 
		border: 'rgba(120, 60, 180, 0.25)', 
		borderLight: 'rgba(140, 70, 200, 0.12)', 
		glassBg: 'rgba(24, 14, 42, 0.6)', 
		glassBgThick: 'rgba(34, 20, 56, 0.7)', 
		glassShadow: '0 8px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(160, 80, 220, 0.08), inset 0 1px 0 rgba(180, 120, 240, 0.06)' 
	},
	{ 
		name: '珊瑚粉', 
		primary: 'rgb(230, 100, 120)', 
		primarySoft: 'rgba(230, 100, 120, 0.15)', 
		bgDark: '#12060a', 
		bgBase: '#1a0a10', 
		bgGradient: 'linear-gradient(165deg, #12060a 0%, #200e14 50%, #1a0a10 100%)', 
		border: 'rgba(180, 70, 90, 0.25)', 
		borderLight: 'rgba(200, 80, 100, 0.12)', 
		glassBg: 'rgba(35, 14, 22, 0.6)', 
		glassBgThick: 'rgba(48, 20, 30, 0.7)', 
		glassShadow: '0 8px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(230, 100, 120, 0.08), inset 0 1px 0 rgba(230, 140, 160, 0.06)' 
	},
	{ 
		name: '星空金', 
		primary: 'rgb(220, 180, 80)', 
		primarySoft: 'rgba(220, 180, 80, 0.15)', 
		bgDark: '#100e06', 
		bgBase: '#16140a', 
		bgGradient: 'linear-gradient(165deg, #100e06 0%, #1c180e 50%, #16140a 100%)', 
		border: 'rgba(170, 140, 60, 0.25)', 
		borderLight: 'rgba(190, 160, 70, 0.12)', 
		glassBg: 'rgba(30, 26, 12, 0.6)', 
		glassBgThick: 'rgba(42, 36, 18, 0.7)', 
		glassShadow: '0 8px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(220, 180, 80, 0.08), inset 0 1px 0 rgba(220, 200, 120, 0.06)' 
	},
	{ 
		name: '冰晶白', 
		primary: 'rgb(200, 210, 220)', 
		primarySoft: 'rgba(200, 210, 220, 0.12)', 
		bgDark: '#0a0b0c', 
		bgBase: '#101112', 
		bgGradient: 'linear-gradient(165deg, #0a0b0c 0%, #141618 50%, #101112 100%)', 
		border: 'rgba(150, 160, 170, 0.25)', 
		borderLight: 'rgba(160, 170, 180, 0.12)', 
		glassBg: 'rgba(22, 24, 26, 0.6)', 
		glassBgThick: 'rgba(32, 34, 36, 0.7)', 
		glassShadow: '0 8px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(200, 210, 220, 0.08), inset 0 1px 0 rgba(220, 230, 240, 0.06)' 
	},
	{ 
		name: '纯黑', 
		primary: 'rgb(255, 255, 255)', 
		primarySoft: 'rgba(255, 255, 255, 0.1)', 
		bgDark: '#080808', 
		bgBase: '#0e0e0e', 
		bgGradient: 'linear-gradient(165deg, #080808 0%, #121212 50%, #0e0e0e 100%)', 
		border: 'rgba(255, 255, 255, 0.1)', 
		borderLight: 'rgba(255, 255, 255, 0.05)', 
		glassBg: 'rgba(20, 20, 20, 0.6)', 
		glassBgThick: 'rgba(30, 30, 30, 0.7)', 
		glassShadow: '0 8px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.06)' 
	}
];

// 校区颜色配置
export const CAMPUS_COLORS = [
	{ name: '蓝', primary: 'rgb(50, 140, 220)', soft: 'rgba(50, 140, 220, 0.2)' },
	{ name: '紫', primary: 'rgb(160, 80, 220)', soft: 'rgba(160, 80, 220, 0.2)' },
	{ name: '绿', primary: 'rgb(80, 200, 160)', soft: 'rgba(80, 200, 160, 0.2)' }
];

// 默认学校数据
export const DEFAULT_SCHOOLS = [
	{
		id: 'gdjy',
		name: '广东建设职业技术学院',
		themeIndex: 0,
		linkPattern: 'appKey,code',
		campuses: [
			{
				name: '清远校区',
				colorIndex: 0,
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
				colorIndex: 1,
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
	const index = uni.getStorageSync('currentCampusIndex');
	return index ? parseInt(index) : 0;
};

// 保存当前校区索引
export const saveCurrentCampusIndex = (index) => {
	uni.setStorageSync('currentCampusIndex', index);
};

// 生成唯一ID
export const generateId = () => {
	return 'school_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};
