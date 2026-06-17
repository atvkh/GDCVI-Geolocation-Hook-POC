<template>
	<view class="body-container" :style="themeStyle" @mousemove="trackMouse" @touchmove="trackMouse">
		
		<view class="precision-header" v-if="!showWeb">
			<view class="school-switcher" @click="showSchoolManager = true">
				<view class="school-switcher-dot" :style="{ background: currentTheme.primary }"></view>
				<text class="school-switcher-text">{{ currentSchoolName }}</text>
				<text class="material-symbols-outlined school-switcher-arrow">expand_more</text>
			</view>
			<view class="system-indicators">
				<view class="btn-reset-pill" @click="handleResetApp">
					<text class="material-symbols-outlined">power_settings_new</text>
					<text class="reset-pill-text">重置</text>
				</view>
			</view>
		</view>

		<!-- 校区切换 -->
		<view class="campus-switcher" v-if="!showWeb && currentSchool && currentSchool.campuses.length > 1" @click="handleCampusSwitch">
			<view class="campus-switcher-inner" :style="campusSwitcherStyle">
				<text class="material-symbols-outlined campus-switcher-icon" :style="{ color: currentCampusColor.primary }">location_on</text>
				<text class="campus-switcher-text">{{ currentCampusName }}</text>
				<text class="material-symbols-outlined campus-switcher-arrow" :style="{ color: currentCampusColor.primary }" v-if="currentSchool.campuses.length === 2">swap_horiz</text>
				<text class="material-symbols-outlined campus-switcher-arrow" :style="{ color: currentCampusColor.primary }" v-else>expand_more</text>
			</view>
		</view>
		
		<!-- 校区下拉菜单（3个校区时） -->
		<view class="campus-dropdown-overlay" v-if="showCampusDropdown" @click="showCampusDropdown = false">
			<view class="campus-dropdown" @click.stop>
				<view 
					v-for="(campus, index) in currentSchool.campuses" 
					:key="index"
					class="campus-dropdown-item"
					:class="{ 'campus-dropdown-active': index === currentCampusIndex }"
					@click="selectCampus(index)"
				>
					<text class="campus-dropdown-name">{{ campus.name }}</text>
					<text class="material-symbols-outlined campus-dropdown-check" v-if="index === currentCampusIndex">check_circle</text>
				</view>
			</view>
		</view>

		<view class="main-content" v-if="!showWeb">
			<!-- 首页 -->
			<TabHome ref="tabHome"
				:isActive="activeTab === 0"
				:isGenerating="isGenerating" :loadingText="loadingText"
				:mouseX="mouseX" :mouseY="mouseY"
				:linkPattern="currentSchoolLinkPattern"
				@start-checkin="handleStartCheckIn"
				@open-tutorial="showTutorialSheet = true" />
			
			<!-- 历史记录卡片 -->
			<TabHistory 
				:isActive="activeTab === 1"
				:historyList="historyList"
			/>
			
			<!-- 设置卡片 -->
			<TabSettings 
				:isActive="activeTab === 2"
				:fakeLat="fakeLat"
				:fakeLng="fakeLng"
				:useRandomPreset="useRandomPreset"
				:presetLocations="presetLocations"
				:selectedPresetIndex="selectedPresetIndex"
				:selectedPresetName="selectedPresetName"
				@show-add-preset="showAddPresetModal = true"
				@edit-preset="editPreset"
				@select-preset="selectPreset"
				@back-to-school="backToSchool"
				@save-coord="handleSaveCoord"
				@open-school-manager="showSchoolManager = true"
				@open-map-picker="handleNativeMapPicker"
				@clear-cache="handleClearCache"
			/>
		</view>

		<!-- 学校管理弹窗 -->
		<SchoolManager 
			:visible="showSchoolManager"
			:schoolList="schoolList"
			:currentSchoolId="currentSchoolId"
			@close="showSchoolManager = false"
			@select="handleSelectSchool"
			@add="handleAddSchool"
			@edit="handleEditSchool"
			@delete="handleDeleteSchool"
		/>
		
		<!-- 学校编辑弹窗 -->
		<SchoolEditor 
			ref="schoolEditor"
			:visible="showSchoolEditor"
			:schoolData="editingSchool"
			@close="showSchoolEditor = false"
			@save="handleSaveSchool"
			@open-map-picker="handleSchoolMapPicker"
		/>

		<!-- 预设点编辑弹窗 -->
		<view class="tutorial-overlay" v-if="showAddPresetModal || showEditPresetModal" @click="closePresetModal">
			<view class="tutorial-card" @click.stop="noop">
				<view class="tutorial-header">
					<text class="material-symbols-outlined tutorial-icon">edit_location_alt</text>
					<text class="tutorial-title">{{ showEditPresetModal ? '编辑预设点' : '添加预设点' }}</text>
				</view>
				<view class="preset-form">
					<view class="settings-field">
						<text class="settings-label">名称</text>
						<view class="settings-input-wrapper">
							<input type="text" v-model="editingPreset.name" class="settings-input" placeholder="如：图书馆" />
						</view>
					</view>
					<view class="settings-field">
						<text class="settings-label">纬度</text>
						<view class="settings-input-wrapper">
							<input type="text" v-model="editingPreset.lat" class="settings-input" placeholder="如：23.73513" />
						</view>
					</view>
					<view class="settings-field">
						<text class="settings-label">经度</text>
						<view class="settings-input-wrapper">
							<input type="text" v-model="editingPreset.lng" class="settings-input" placeholder="如：113.088972" />
						</view>
					</view>
				</view>
				<view class="preset-modal-actions">
					<view class="btn-preset-delete" v-if="showEditPresetModal" @click="deletePreset">
						<text class="material-symbols-outlined">delete</text>
					</view>
					<view class="btn-preset-cancel" @click="closePresetModal">
						<text>取消</text>
					</view>
					<view class="btn-preset-save" @click="savePreset">
						<text>保存</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 教程弹窗 -->
		<view class="tutorial-overlay" v-if="showTutorialSheet" @click="showTutorialSheet = false">
			<view class="tutorial-card" @click.stop="noop">
				<view class="tutorial-header">
					<text class="material-symbols-outlined tutorial-icon">tips_and_updates</text>
					<text class="tutorial-title">纯净链接提取教程</text>
					<text class="tutorial-subtitle">跳查寝打卡必看流程</text>
				</view>
				
				<scroll-view scroll-y="true" class="tutorial-scroll">
					<view class="tutorial-step">
						<view class="step-number">1</view>
						<view class="step-content">
							<text class="step-title">等待晚寝推送</text>
							<text class="step-desc">22:10 左右企业微信学工系统会推送晚查寝签到提醒，点击通知进入页面</text>
						</view>
					</view>
					
					<view class="tutorial-step step-critical">
						<view class="step-number step-number-critical">2</view>
						<view class="step-content">
							<text class="step-title step-title-critical">【核心】页面未加载完时断网</text>
							<text class="step-desc">页面还在加载时，迅速下拉状态栏关闭 Wi-Fi 和移动数据，截断定位上传并保活 code</text>
						</view>
					</view>
					
					<view class="tutorial-step">
						<view class="step-number">3</view>
						<view class="step-content">
							<text class="step-title">复制链接</text>
							<text class="step-desc">断网状态下，点击右上角 ··· 菜单，选择「复制链接」，复制成功后恢复网络</text>
						</view>
					</view>
					
					<view class="tutorial-step">
						<view class="step-number">4</view>
						<view class="step-content">
							<text class="step-title">提取并打卡</text>
							<text class="step-desc">回到本 App 点击「提取链接」，配置目标坐标后点击「极速打卡」完成</text>
						</view>
					</view>
				</scroll-view>
				
				<view class="tutorial-footer">
					<view class="btn-tutorial-close" @click="showTutorialSheet = false">
						<text>我已了解</text>
					</view>
				</view>
			</view>
		</view>

		<view class="tutorial-overlay" v-if="showUpdateModal">
			<view class="tutorial-card update-card" @click.stop="noop">
				<view class="update-header">
					<text class="material-symbols-outlined update-icon">system_update_alt</text>
					<text class="tutorial-title" style="margin-bottom: 0;">版本更新提示 V{{ updateInfo.version }}</text>
				</view>
				<scroll-view scroll-y="true" class="update-scroll">
					<text class="update-log-text">{{ updateInfo.log }}</text>
				</scroll-view>
				<view class="update-actions">
					<view v-if="!updateInfo.forceUpdate" class="btn-cancel-update" @click="showUpdateModal = false"><text>稍后更新</text></view>
					<view class="btn-confirm-update" @click="goToDownload"><text>立即下载</text></view>
				</view>
			</view>
		</view>

		<view class="warning-overlay" v-if="showWarningModal">
			<view class="warning-card" @click.stop="noop">
				<text class="material-symbols-outlined warning-icon">report_problem</text>
				<text class="warning-title">轨迹冲突风险预警</text>
				<text class="warning-guide">检测到当前处于查寝管控时段。请务必遵守以下操作规范：</text>
				<view class="highlight-risk-panel">
					<text class="highlight-risk-text">即便已通过本软件完成打卡，也【严禁】在 23:00 至 次日 1:00 期间通过校门刷脸入校！</text>
				</view>
				<text class="warning-explain">此行为会使系统产生"已在寝室却又从校外进入"的逻辑冲突，必然触发人工后台复核。</text>
				<view class="warning-actions">
					<view class="checkbox-label" @click="toggleHideWarning">
						<view class="custom-checkbox" :class="{'is-checked': hideWarningForever}">
							<text class="material-symbols-outlined" v-if="hideWarningForever" style="font-size: 14px; color: #000; font-weight: 800;">check</text>
						</view>
						<text class="checkbox-text">我已知晓风险，不再提醒</text>
					</view>
					<view class="btn-warning-confirm" @click="closeWarningModal">
						<text>明白，我承诺遵守</text>
					</view>
				</view>
			</view>
		</view>

		<web-view v-if="showMapPicker" :src="pickerUrl" />
		
		<view class="island-container">
			<view class="island-pill">
				<view class="island-indicator" :style="{ transform: `translateX(${activeTab * 100}%)` }"></view>
				<view class="island-tab" :class="{ active: activeTab === 0 }" @click="switchTab(0)">
					<text class="material-symbols-outlined island-icon">home</text>
				</view>
				<view class="island-tab" :class="{ active: activeTab === 1 }" @click="switchTab(1)">
					<text class="material-symbols-outlined island-icon">history</text>
				</view>
				<view class="island-tab" :class="{ active: activeTab === 2 }" @click="switchTab(2)">
					<text class="material-symbols-outlined island-icon">settings</text>
				</view>
			</view>
		</view>

		<!-- App 开屏动画叠加层 -->
		<view class="app-splash-overlay" v-if="showVueSplash" :class="{ 'fade-out': fadeOutSplash }">
			<view class="splash-logo-container" :style="splashLogoStyle">
				<image src="/static/splash_logo.png" class="splash-logo" />
				<view class="splash-logo-glow" />
			</view>
			<view class="splash-branding" :style="splashBrandingStyle">
				<text class="splash-title" :style="splashTitleStyle">幻签</text>
				<text class="splash-subtitle" :style="splashSubtitleStyle">HUANQIAN</text>
			</view>
		</view>
		<!-- 自定义美化 Toast -->
		<view class="custom-toast-overlay" v-if="customToast.visible" :class="{ 'toast-fade-out': customToast.fadeOut }">
			<view class="custom-toast-card">
				<text class="material-symbols-outlined custom-toast-icon" :style="{ color: customToast.color }">{{ customToast.icon }}</text>
				<text class="custom-toast-text">{{ customToast.message }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import TabHome from '@/components/TabHome.vue';
import TabHistory from '@/components/TabHistory.vue';
import TabSettings from '@/components/TabSettings.vue';
import SchoolManager from '@/components/SchoolManager.vue';
import SchoolEditor from '@/components/SchoolEditor.vue';
import { generateCoreScript } from '@/utils/injectScript.js';
import { secureGet, secureSet } from '@/utils/crypto.js';
import { 
	APP_VERSION, APP_VERSION_CODE, UPDATE_JSON_URL,
	INJECT_MAX_ATTEMPTS, INJECT_INTERVAL_MS, MAX_HISTORY_RECORDS,
	THEME_COLORS, CAMPUS_COLORS, getSchoolList, saveSchoolList, 
	getCurrentSchoolId, saveCurrentSchoolId,
	getCurrentCampusIndex, saveCurrentCampusIndex
} from '@/utils/constants.js';

export default {
	components: { TabHome, TabHistory, TabSettings, SchoolManager, SchoolEditor },
	data() {
		return {
			appVersion: APP_VERSION,
			showWeb: false, currentUrl: '', hookStatus: 'inactive',
			isGenerating: false, loadingText: '', mouseX: 0, mouseY: 0,
			useRandomPreset: uni.getStorageSync('useRandomPreset') !== false,
			fakeLat: 0, fakeLng: 0,
			historyList: (() => {
				const stored = secureGet('historyList');
				return Array.isArray(stored) ? stored : [];
			})(),
			buttonSelector: '.adm-button-primary',
			showUpdateModal: false,
			updateInfo: { version: '', log: '', url: '', password: '', forceUpdate: false },
			persistentInjectTimer: null,
			showWarningModal: false,
			hideWarningForever: false,
			currentTime: { h: '00', m: '00', s: '00', ms: '000' },
			timerRef: null,
			showTutorialSheet: false,
			activeTab: 0,
			localLat: '0', localLng: '0',
			selectedPresetIndex: -1,
			selectedPresetName: '',
			showAddPresetModal: false,
			showEditPresetModal: false,
			editingPresetIndex: -1,
			editingPreset: { name: '', lat: '', lng: '' },
			// 学校管理相关
			showSchoolManager: false,
			showSchoolEditor: false,
			showCampusDropdown: false,
			schoolList: [],
			currentSchoolId: '',
			currentCampusIndex: 0,
			editingSchool: null,
			showMapPicker: false,
			pickerUrl: '/hybrid/html/map.html',
			pickerTimer: null,
			mapPickerTarget: null,
			checkinWebview: null,
			// 开屏动画控制状态
			showVueSplash: true,
			fadeOutSplash: false,
			splashLogoStyle: '',
			splashBrandingStyle: '',
			splashTitleStyle: '',
			splashSubtitleStyle: '',
			customToast: {
				visible: false,
				message: '',
				icon: 'check_circle',
				color: 'rgb(80, 200, 160)',
				fadeOut: false,
				timer: null
			}
		}
	},
	watch: {
		showMapPicker(val) {
			if (val) {
				try {
					// #ifdef APP-PLUS
					if (typeof plus !== 'undefined' && plus.storage) plus.storage.removeItem('__map_picker_result');
					// #endif
					uni.removeStorageSync('__map_picker_result');
				} catch(e) {}
				this.startPickerBridge();
			} else {
				if (this.pickerTimer) clearInterval(this.pickerTimer);
				this.mapPickerTarget = null;
				try {
					// #ifdef APP-PLUS
					if (typeof plus !== 'undefined' && plus.storage) plus.storage.removeItem('__map_picker_result');
					// #endif
					uni.removeStorageSync('__map_picker_result');
				} catch(e) {}
			}
		}
	},
	computed: {
		currentSchool() {
			return this.schoolList.find(s => s.id === this.currentSchoolId) || this.schoolList[0];
		},
		currentSchoolName() {
			return this.currentSchool ? this.currentSchool.name : '未选择学校';
		},
		currentCampus() {
			if (!this.currentSchool || !this.currentSchool.campuses) return null;
			return this.currentSchool.campuses[this.currentCampusIndex] || this.currentSchool.campuses[0];
		},
		currentCampusName() {
			return this.currentCampus ? this.currentCampus.name : '';
		},
		currentCampusColor() {
			if (!this.currentCampus) return CAMPUS_COLORS[0];
			// 如果没有 colorIndex，根据校区索引自动分配
			const colorIndex = this.currentCampus.colorIndex !== undefined ? this.currentCampus.colorIndex : this.currentCampusIndex;
			return CAMPUS_COLORS[colorIndex % CAMPUS_COLORS.length] || CAMPUS_COLORS[0];
		},
		campusSwitcherStyle() {
			const color = this.currentCampusColor;
			return {
				background: `linear-gradient(135deg, ${color.soft} 0%, ${color.soft} 100%)`,
				border: `1px solid ${color.primary}`
			};
		},
		currentTheme() {
			const themeIndex = this.currentSchool ? (this.currentSchool.themeIndex || 0) : 0;
			return THEME_COLORS[themeIndex] || THEME_COLORS[0];
		},
		currentSchoolLinkPattern() {
			return this.currentSchool ? (this.currentSchool.linkPattern || '') : '';
		},
		themeStyle() {
			const theme = this.currentTheme;
			return {
				'--color-primary': theme.primary,
				'--color-primary-soft': theme.primarySoft,
				'--color-bg-dark': theme.bgDark,
				'--color-bg-base': theme.bgBase,
				'--color-bg-gradient': theme.bgGradient,
				'--color-border': theme.border,
				'--color-border-light': theme.borderLight,
				'--glass-bg': theme.glassBg,
				'--glass-bg-thick': theme.glassBgThick,
				'--glass-shadow': theme.glassShadow
			};
		},
		presetLocations() {
			return this.currentCampus ? this.currentCampus.presets : [];
		},
		defaultCoords() {
			if (this.presetLocations.length > 0) {
				return { lat: this.presetLocations[0].lat, lng: this.presetLocations[0].lng };
			}
			return { lat: 23.73513, lng: 113.088972 };
		}
	},
	onBackPress() {
		if (this.showWeb) { this.handleResetApp(); return true; }
		if (this.showMapPicker) { this.showMapPicker = false; return true; }
		if (this.showSchoolManager) { this.showSchoolManager = false; return true; }
		if (this.showSchoolEditor) { this.showSchoolEditor = false; return true; }
		if (this.activeTab !== 0) { this.activeTab = 0; return true; }
		if (this.showTutorialSheet) { this.showTutorialSheet = false; return true; }
		if (this.$refs.tabHome && this.$refs.tabHome.showMatrix) { this.$refs.tabHome.closeMatrix(); return true; }
		if (this.showUpdateModal && !this.updateInfo.forceUpdate) { this.showUpdateModal = false; return true; }
		return false; 
	},
	created() {
		// 计算开屏精确坐标以对齐原生点九图启动页
		this.calculateSplashLayout();

		// 开屏动画定时控制
		setTimeout(() => {
			this.fadeOutSplash = true;
			setTimeout(() => {
				this.showVueSplash = false;
			}, 500); // 渐隐持续时间 0.5s
		}, 1800); // 展示持续时间 1.8s

		this.initSchoolData();
		this.checkAppUpdate();
		if (this.useRandomPreset) this.randomizePreset();
		this.checkWarningModal();
		this.startClock();
		
		// #ifdef APP-PLUS
		if (typeof window !== 'undefined') {
			window.__handleCheckinResult = (isSuccess, msg) => {
				if (this._checkinResultProcessing) return;
				this._checkinResultProcessing = true;
				
				// #ifdef APP-PLUS
				try {
					if (this.checkinWebview) {
						this.checkinWebview.close();
						this.checkinWebview = null;
					}
				} catch(e) {}
				// #endif
				
				const now = new Date();
				const hh = now.getHours().toString().padStart(2, '0');
				const mm = now.getMinutes().toString().padStart(2, '0');
				const ss = now.getSeconds().toString().padStart(2, '0');
				const timeStr = `${hh}:${mm}:${ss}`;
				const dateStr = now.toISOString().split('T')[0];
				
				this.historyList.unshift({ 
					time: timeStr, date: dateStr, lat: this.fakeLat, lng: this.fakeLng, 
					status: isSuccess ? '成功' : '失败', reason: msg || '' 
				});
				secureSet('historyList', this.historyList.slice(0, MAX_HISTORY_RECORDS));
				
				this.isGenerating = false;
				this.loadingText = '';
				this.showWeb = false;
				
				if (isSuccess) {
					this.showCustomToast('打卡成功', 'check_circle', 'rgb(80, 200, 160)');
				} else {
					this.showCustomToast('打卡失败：' + (msg || ''), 'cancel', 'rgb(240, 100, 120)', 3000);
				}
				
				setTimeout(() => { this._checkinResultProcessing = false; }, 3000);
			};

			window.__updateGlobalCoords = (lat, lng) => {
				this.fakeLat = lat;
				this.fakeLng = lng;
				this.localLat = String(lat);
				this.localLng = String(lng);
				uni.setStorageSync('fakeLat', lat);
				uni.setStorageSync('fakeLng', lng);
			};

			window.__handleBridgeMsg = (payload) => {
				try {
					var decoded = JSON.parse(decodeURIComponent(escape(atob(payload))));
					if (decoded.action === 'hook_verify') {
						const d = decoded.data;
						console.log('[HOOK VERIFY] isHooked=' + d.isHooked + ' lat=' + d.lat + ' lng=' + d.lng + ' fakeLat=' + d.fakeLat + ' fakeLng=' + d.fakeLng);
						if (d.isHooked) {
							this.hookStatus = 'active';
						} else {
							this.hookStatus = 'fail';
							console.error('[HOOK VERIFY] 定位注入失败！返回坐标与预设不匹配');
						}
					} else if (decoded.action === 'checkin_result') {
						const d = decoded.data;
						window.__handleCheckinResult(d.isSuccess, d.msg);
					}
				} catch(e) {
					console.error('[BRIDGE] 解码失败', e);
				}
			};

			window.__onMapPickerResult = (loc) => {
				if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
					this.onMapPickerResult({
						lat: loc.lat,
						lng: loc.lng,
						name: loc.name || '地图选点'
					});
				}
			};
			
			this._bridgePollTimer = setInterval(() => {
				try {
					var raw = plus.storage.getItem('__cyber_bridge_msg');
					if (raw) {
						plus.storage.removeItem('__cyber_bridge_msg');
						var msg = JSON.parse(raw);
						if (msg.action === 'checkin_result' && msg.data) {
							window.__handleCheckinResult(msg.data.isSuccess, msg.data.msg);
						} else if (msg.action === 'hook_verify' && msg.data) {
							if (msg.data.isHooked) {
								this.hookStatus = 'active';
							} else {
								this.hookStatus = 'fail';
							}
						}
					}
				} catch(e) {}
			}, 500);
		}
		// #endif
	},
	onUnload() {
			// 清理所有定时器
			if (this.timerRef) {
				clearInterval(this.timerRef);
				this.timerRef = null;
			}
			if (this.persistentInjectTimer) {
				clearInterval(this.persistentInjectTimer);
				this.persistentInjectTimer = null;
			}
			if (this._bridgePollTimer) {
				clearInterval(this._bridgePollTimer);
				this._bridgePollTimer = null;
			}
			
			// #ifdef APP-PLUS
			// 关闭原生 webview
			try {
				if (this.checkinWebview) {
					this.checkinWebview.close();
					this.checkinWebview = null;
				}
			} catch(e) {}
			// #endif
		},
	methods: {
		calculateSplashLayout() {
			try {
				const sys = uni.getSystemInfoSync();
				const W = sys.screenWidth;
				const H = sys.screenHeight;
				
				// 对应 create_splash.js 中定义的 xxhdpi 原生启动页设计稿参数
				const designW = 1080;
				
				// 宽度缩放比例 (即 Android 系统缩放点九图的物理密度基准)
				const scaleW = W / designW;
				
				// 原生点九图的拉伸与非拉伸区段高度定义 (单位: 像素)
				const S1_design = 767; // 顶部至 Logo 非拉伸区开始 (拉伸区1)
				const N2_design = 226; // Logo 占用高度 (非拉伸区2, 包含上下各5px边距)
				const S3_design = 611; // Logo 底部至文字开始 (拉伸区3)
				const N4_design = 105; // 品牌文字占用高度 (非拉伸区4, 包含上下边距)
				const S5_design = 173; // 文字底部至图片底端 (拉伸区5)
				
				const sumS = S1_design + S3_design + S5_design; // 1551
				const sumN = N2_design + N4_design;             // 331
				
				// 计算分配给拉伸区间的剩余屏幕物理高度
				const remainingH = H - sumN * scaleW;
				
				// 按设计稿比例分配拉伸后各拉伸区间的物理高度
				const S1_scaled = remainingH * (S1_design / sumS);
				const S3_scaled = remainingH * (S3_design / sumS);
				
				// Logo 顶部在当前全面屏上的精确像素坐标 (S1_scaled 加上 5px 边距乘以缩放)
				const logoTopPx = S1_scaled + 5 * scaleW;
				const logoSizePx = 216 * scaleW;
				
				// 品牌文字在当前全面屏上的精确像素坐标 (S1_scaled + N2 + S3_scaled)
				// 减去 38px 缩放高度以修正 CSS 与 SVG baseline 的绘制原点偏移
				const brandTopPx = S1_scaled + N2_design * scaleW + S3_scaled + (15 - 38) * scaleW;
				
				this.splashLogoStyle = `top: ${logoTopPx}px; width: ${logoSizePx}px; height: ${logoSizePx}px;`;
				this.splashBrandingStyle = `top: ${brandTopPx}px;`;
				
				// 精确缩放字体与字间距，确保文字大小和横向拉伸比例与原生完美一致
				const titleFontSize = 40 * scaleW;
				const titleLetterSpacing = 4 * scaleW;
				const subtitleFontSize = 13 * scaleW;
				const subtitleLetterSpacing = 8 * scaleW;
				
				this.splashTitleStyle = `font-size: ${titleFontSize}px; letter-spacing: ${titleLetterSpacing}px; margin-bottom: ${8 * scaleW}px;`;
				this.splashSubtitleStyle = `font-size: ${subtitleFontSize}px; letter-spacing: ${subtitleLetterSpacing}px; text-indent: ${subtitleLetterSpacing}px;`;
				
				console.log('[SPLASH LAYOUT] Computed pixel-perfect layout:', W, 'x', H, 'logoTop:', logoTopPx, 'brandTop:', brandTopPx);
			} catch (e) {
				console.error('[SPLASH LAYOUT] Error computing layout', e);
				// 备用百分比方案
				this.splashLogoStyle = 'top: 41%; width: 20vw; height: 20vw;';
				this.splashBrandingStyle = 'bottom: 11%;';
				this.splashTitleStyle = 'font-size: 3.7vw; letter-spacing: 0.37vw; margin-bottom: 0.8vw;';
				this.splashSubtitleStyle = 'font-size: 1.2vw; letter-spacing: 0.74vw; text-indent: 0.74vw;';
			}
		},
		initSchoolData() {
			this.schoolList = getSchoolList();
			this.currentSchoolId = getCurrentSchoolId();
			this.currentCampusIndex = getCurrentCampusIndex();
			
			// 如果没有当前学校，使用第一个
			if (!this.currentSchool) {
				this.currentSchoolId = this.schoolList[0].id;
				saveCurrentSchoolId(this.currentSchoolId);
			}
			
			// 初始化坐标
			const storedLat = uni.getStorageSync('fakeLat');
			const storedLng = uni.getStorageSync('fakeLng');
			if (storedLat && storedLng) {
				this.fakeLat = parseFloat(storedLat);
				this.fakeLng = parseFloat(storedLng);
				this.localLat = String(storedLat);
				this.localLng = String(storedLng);
			} else {
				this.randomizePreset();
			}
		},
		handleSelectSchool(school) {
			this.currentSchoolId = school.id;
			this.currentCampusIndex = 0;
			saveCurrentSchoolId(school.id);
			saveCurrentCampusIndex(0);
			this.showSchoolManager = false;
			this.randomizePreset();
			uni.showToast({ title: `已切换至${school.name}`, icon: 'none' });
		},
		handleAddSchool() {
			this.editingSchool = null;
			this.showSchoolManager = false;
			this.showSchoolEditor = true;
		},
		handleEditSchool(school) {
			this.editingSchool = school;
			this.showSchoolManager = false;
			this.showSchoolEditor = true;
		},
		handleDeleteSchool(school, index) {
			this.schoolList.splice(index, 1);
			saveSchoolList(this.schoolList);
			
			// 如果删除的是当前学校，切换到第一个
			if (school.id === this.currentSchoolId) {
				this.currentSchoolId = this.schoolList[0].id;
				saveCurrentSchoolId(this.currentSchoolId);
				this.randomizePreset();
			}
			
			uni.showToast({ title: '已删除', icon: 'none' });
		},
		handleSaveSchool(schoolData) {
			const existIndex = this.schoolList.findIndex(s => s.id === schoolData.id);
			if (existIndex !== -1) {
				this.schoolList[existIndex] = schoolData;
			} else {
				this.schoolList.push(schoolData);
			}
			saveSchoolList(this.schoolList);
			this.showSchoolEditor = false;
			uni.showToast({ title: '保存成功', icon: 'none' });
		},
		handleCampusSwitch() {
			if (!this.currentSchool || !this.currentSchool.campuses) return;
			const campusCount = this.currentSchool.campuses.length;
			if (campusCount <= 1) return;
			
			// 2个校区直接切换，3个校区显示下拉
			if (campusCount === 2) {
				this.currentCampusIndex = (this.currentCampusIndex + 1) % 2;
				saveCurrentCampusIndex(this.currentCampusIndex);
				this.randomizePreset();
				uni.showToast({ 
					title: `已切换至${this.currentCampusName}`, 
					icon: 'none' 
				});
			} else {
				this.showCampusDropdown = true;
			}
		},
		selectCampus(index) {
			this.currentCampusIndex = index;
			saveCurrentCampusIndex(index);
			this.showCampusDropdown = false;
			this.randomizePreset();
			uni.showToast({ 
				title: `已切换至${this.currentCampusName}`, 
				icon: 'none' 
			});
		},
		noop() {},
		switchTab(index) {
			this.activeTab = index;
			this.showTutorialSheet = false;
		},
		startClock() {
			this.timerRef = setInterval(() => {
				const now = new Date();
				this.currentTime = {
					h: now.getHours().toString().padStart(2, '0'),
					m: now.getMinutes().toString().padStart(2, '0'),
					s: now.getSeconds().toString().padStart(2, '0'),
					ms: now.getMilliseconds().toString().padStart(3, '0')
				};
			}, 100);
		},
		checkWarningModal() {
			const hideWarning = uni.getStorageSync('hide_dorm_warning');
			if (!hideWarning) {
				this.showWarningModal = true;
			}
		},
		closeWarningModal() {
			if (this.hideWarningForever) {
				uni.setStorageSync('hide_dorm_warning', true);
			}
			this.showWarningModal = false;
		},
		toggleHideWarning() {
			this.hideWarningForever = !this.hideWarningForever;
		},
		selectPreset(loc, index) {
			this.localLat = String(loc.lat);
			this.localLng = String(loc.lng);
			this.selectedPresetIndex = index;
			this.selectedPresetName = loc.name;
			this.fakeLat = loc.lat;
			this.fakeLng = loc.lng;
			this.useRandomPreset = false;
			uni.setStorageSync('fakeLat', loc.lat);
			uni.setStorageSync('fakeLng', loc.lng);
			uni.setStorageSync('useRandomPreset', false);
		},
		backToSchool() {
			this.randomizePreset();
			uni.showToast({ title: '已切换至随机模式', icon: 'none' });
		},
		handleSaveCoord(lat, lng) {
			this.fakeLat = lat;
			this.fakeLng = lng;
			this.localLat = String(lat);
			this.localLng = String(lng);
			this.useRandomPreset = false;
			uni.setStorageSync('fakeLat', this.fakeLat);
			uni.setStorageSync('fakeLng', this.fakeLng);
			uni.setStorageSync('useRandomPreset', false);
			uni.showToast({ title: '配置已更新', icon: 'none' });
		},
		editPreset(index) {
			this.editingPresetIndex = index;
			this.editingPreset = { ...this.presetLocations[index] };
			this.showEditPresetModal = true;
		},
		closePresetModal() {
			this.showAddPresetModal = false;
			this.showEditPresetModal = false;
			this.editingPresetIndex = -1;
			this.editingPreset = { name: '', lat: '', lng: '' };
		},
		savePreset() {
			const name = this.editingPreset.name.trim();
			const lat = parseFloat(this.editingPreset.lat);
			const lng = parseFloat(this.editingPreset.lng);
			
			if (!name || isNaN(lat) || isNaN(lng)) {
				uni.showToast({ title: '请填写完整信息', icon: 'none' });
				return;
			}
			
			// 保存到当前校区
			if (this.showEditPresetModal) {
				this.currentCampus.presets[this.editingPresetIndex] = { name, lat, lng };
			} else {
				this.currentCampus.presets.push({ name, lat, lng });
			}
			
			saveSchoolList(this.schoolList);
			this.closePresetModal();
			uni.showToast({ title: '保存成功', icon: 'none' });
		},
		deletePreset() {
			if (this.currentCampus.presets.length <= 1) {
				uni.showToast({ title: '至少保留一个预设点', icon: 'none' });
				return;
			}
			
			this.currentCampus.presets.splice(this.editingPresetIndex, 1);
			saveSchoolList(this.schoolList);
			
			if (this.selectedPresetIndex === this.editingPresetIndex) {
				this.selectedPresetIndex = -1;
				this.selectedPresetName = '';
			}
			
			this.closePresetModal();
			uni.showToast({ title: '已删除', icon: 'none' });
		},
		openGithub() {
			const url = 'https://github.com/atvkh/GDCVI-Geolocation-Hook-POC';
			// #ifdef APP-PLUS
			plus.runtime.openURL(url);
			// #endif
			// #ifndef APP-PLUS
			window.open(url);
			// #endif
		},
		copyEmail() {
			uni.setClipboardData({
				data: 'Atvkh@outlook.com',
				success: () => uni.showToast({ title: '邮箱已复制', icon: 'none' })
			});
		},
		checkAppUpdate() {
			if (!UPDATE_JSON_URL) return;
			uni.request({
				url: UPDATE_JSON_URL + '?t=' + new Date().getTime(),
				method: 'GET',
				timeout: 10000, // 10秒超时
				success: (res) => {
					if (res.statusCode === 200 && res.data) {
						const remoteData = res.data;
						if (remoteData.versionCode && remoteData.versionCode > APP_VERSION_CODE && remoteData.version !== APP_VERSION) {
							this.updateInfo = {
								version: remoteData.version || '',
								log: remoteData.log || '',
								url: remoteData.url || '',
								password: remoteData.password || '',
								forceUpdate: remoteData.forceUpdate || false
							};
							this.showUpdateModal = true;
						}
					}
				},
				fail: (err) => {
					console.warn('[Update] 检查更新失败:', err);
					// 静默失败，不打扰用户
				}
			});
		},
		goToDownload() {
			if (!this.updateInfo.url) {
				return uni.showToast({ title: '下载链接无效', icon: 'none' });
			}
			// 自动复制提取码
			if (this.updateInfo.password) {
				uni.setClipboardData({
					data: this.updateInfo.password,
					success: () => {
						uni.showToast({ title: '提取码已复制', icon: 'none', duration: 1500 });
					}
				});
			}
			// #ifdef APP-PLUS
			plus.runtime.openURL(this.updateInfo.url);
			// #endif
			if (!this.updateInfo.forceUpdate) {
				this.showUpdateModal = false;
			}
		},
		trackMouse(e) {
			const x = e.touches ? e.touches[0].clientX : e.clientX;
			const y = e.touches ? e.touches[0].clientY : e.clientY;
			this.mouseX = x; this.mouseY = y;
		},
		handleResetApp() {
			this.isGenerating = false; 
			this.hookStatus = 'inactive'; 
			this.showWeb = false; 
			
			// #ifdef APP-PLUS
			// 关闭之前创建的原生 webview
			try {
				if (this.checkinWebview) {
					this.checkinWebview.close();
					this.checkinWebview = null;
				}
			} catch(e) {}
			// #endif
			
			this.randomizePreset();
			
			if (this.persistentInjectTimer) {
				clearInterval(this.persistentInjectTimer);
				this.persistentInjectTimer = null;
			}

			uni.showToast({ title: '环境重置，坐标已随机切换', icon: 'none' }); 
		},
		randomizePreset() {
			if (this.presetLocations.length === 0) return;
			
			const randomIndex = Math.floor(Math.random() * this.presetLocations.length);
			const randomLoc = this.presetLocations[randomIndex];
			this.fakeLat = randomLoc.lat;
			this.fakeLng = randomLoc.lng;
			this.localLat = String(randomLoc.lat);
			this.localLng = String(randomLoc.lng);
			this.useRandomPreset = true;
			uni.setStorageSync('fakeLat', this.fakeLat);
			uni.setStorageSync('fakeLng', this.fakeLng);
			uni.setStorageSync('useRandomPreset', true);
		},
		handleStartCheckIn(url) {
			this.isGenerating = true;
			this.loadingText = '正在构建分析容器...';
			this.currentUrl = url;

			// #ifdef APP-PLUS
			// 清理上次打卡残留的 Cookie，避免多账号/多次打卡时的 session 污染导致“请勿重复打卡”
			try {
				plus.navigator.removeAllCookie();
				plus.navigator.removeSessionCookie();
				console.log('[Cookie] Webview cookies cleared successfully');
			} catch(e) {
				console.error('[Cookie] 清理失败:', e);
			}
			// #endif

			// #ifdef APP-PLUS
			const self = this;
			const coreScript = generateCoreScript(
				self.fakeLat, self.fakeLng,
				self.buttonSelector,
				self.defaultCoords.lat, self.defaultCoords.lng
			);

			// 先写脚本文件，再创建 webview（appendJsFile 在页面脚本执行前注入）
			self._writeHookFileAndLaunch(url, coreScript);
			// #endif
		},
		_writeHookFileAndLaunch(url, coreScript) {
			const self = this;
			const filePath = '_doc/cyber_hook.js';
			plus.io.resolveLocalFileSystemURL('_doc/', function(dirEntry) {
				dirEntry.getFile('cyber_hook.js', { create: true }, function(fileEntry) {
					fileEntry.createWriter(function(writer) {
						writer.onwriteend = function() {
							self._createWebview(url, coreScript, filePath);
						};
						writer.onerror = function() {
							self._createWebview(url, coreScript, null);
						};
						writer.write(coreScript);
					}, function() {
						self._createWebview(url, coreScript, null);
					});
				}, function() {
					self._createWebview(url, coreScript, null);
				});
			}, function() {
				self._createWebview(url, coreScript, null);
			});
		},
		_createWebview(url, coreScript, hookFilePath) {
			const self = this;
			const wvOptions = {
				top: '0px',
				bottom: '0px',
				visible: false,
				scrollable: false,
				progressIndicator: true,
				androidScrollBarStyle: 'overlay'
			};
			if (hookFilePath) {
				wvOptions.appendJsFile = hookFilePath;
			}

			const wv = plus.webview.create(url, 'cyber_checkin_' + Date.now(), wvOptions);
			self.checkinWebview = wv;

			wv.addEventListener('progressChanged', () => {
				try { wv.evalJS(coreScript); } catch(e) {}
			}, false);

			wv.addEventListener('loaded', () => {
				try { wv.evalJS(coreScript); } catch(e) {}
			}, false);

			let injectAttempts = 0;
			const injectBurst = () => {
				if (!wv || !self.isGenerating) return;
				try { wv.evalJS(coreScript); } catch(e) {}
				if (injectAttempts++ < 150) {
					setTimeout(injectBurst, 20);
				}
			};
			injectBurst();

			if (self.persistentInjectTimer) {
				clearInterval(self.persistentInjectTimer);
			}
			self.persistentInjectTimer = setInterval(() => {
				if (!self.isGenerating || !wv) {
					clearInterval(self.persistentInjectTimer);
					return;
				}
				try { wv.evalJS(coreScript); } catch(e) {}
			}, 1000);

			setTimeout(() => {
				wv.show();
				self.showWeb = true;
				self.loadingText = '定位已注入，等待页面加载...';
				
				setTimeout(() => { self.loadingText = '注入干扰算法...'; }, 800);
				setTimeout(() => { self.loadingText = '代理核心接口...'; }, 1600);
				setTimeout(() => { 
					self.loadingText = '监听系统状态...'; 
					self.hookStatus = 'active'; 
				}, 2400);
			}, 800);
		},
		onMapPickerResult(data) {
			const { lat, lng, name } = data;

			// 如果是从学校编辑器打开的地图选点，更新对应预设点
			if (this.mapPickerTarget && this.$refs.schoolEditor) {
				this.$refs.schoolEditor.updatePresetCoord(
					this.mapPickerTarget.campusIndex,
					this.mapPickerTarget.presetIndex,
					lat, lng
				);
				this.fakeLat = lat;
				this.fakeLng = lng;
				this.useRandomPreset = false;
				uni.setStorageSync('fakeLat', lat);
				uni.setStorageSync('fakeLng', lng);
				uni.setStorageSync('useRandomPreset', false);
				this.showMapPicker = false;
				uni.showToast({ title: `坐标已填入: ${name || '所选地点'}`, icon: 'none' });
				return;
			}

			// 设置页地图选点
			this.fakeLat = lat;
			this.fakeLng = lng;
			this.localLat = String(lat);
			this.localLng = String(lng);
			this.useRandomPreset = false;
			uni.setStorageSync('fakeLat', lat);
			uni.setStorageSync('fakeLng', lng);
			uni.setStorageSync('useRandomPreset', false);
			this.showMapPicker = false;
			uni.showToast({ title: `位置已锁定: ${name || '所选地点'}`, icon: 'none' });
		},
		onMapSelected(data) {
			this.onMapPickerResult({
				lat: data.lat,
				lng: data.lng,
				name: data.name || '地图精准定位'
			});
		},
		handleNativeMapPicker() {
			this.mapPickerTarget = null;
			this.showMapPicker = true;
		},
		handleSchoolMapPicker({ campusIndex, presetIndex }) {
			this.mapPickerTarget = { campusIndex, presetIndex };
			this.showMapPicker = true;
		},
		startPickerBridge() {
			if (this.pickerTimer) clearInterval(this.pickerTimer);
			// 通过 storage 轮询（跨 webview 最可靠的方式，不依赖 evalJS 回调）
			this.pickerTimer = setInterval(() => {
				try {
					// 优先用 plus.storage（与 map.html 的 plus.storage.setItem 同一后端）
					let raw = null;
					// #ifdef APP-PLUS
					if (typeof plus !== 'undefined' && plus.storage) {
						raw = plus.storage.getItem('__map_picker_result');
					}
					// #endif
					if (!raw) raw = uni.getStorageSync('__map_picker_result');
					if (raw) {
						const loc = typeof raw === 'string' ? JSON.parse(raw) : raw;
						if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
							// #ifdef APP-PLUS
							if (typeof plus !== 'undefined' && plus.storage) {
								plus.storage.removeItem('__map_picker_result');
							}
							// #endif
							uni.removeStorageSync('__map_picker_result');
							this.onMapPickerResult({ lat: loc.lat, lng: loc.lng, name: loc.name || '地图选点' });
						}
					}
				} catch (e) {}
			}, 500);
		},
		handleClearCache() {
			// #ifdef APP-PLUS
			try {
				plus.navigator.removeAllCookie();
				plus.navigator.removeSessionCookie();
				plus.cache.clear(() => {
					this.showCustomToast('会话Cookie与缓存清理成功', 'check_circle', 'rgb(80, 200, 160)');
				});
			} catch(e) {
				this.showCustomToast('清理失败: ' + e.message, 'cancel', 'rgb(240, 100, 120)');
			}
			// #endif
			// #ifndef APP-PLUS
			try {
				localStorage.clear();
				sessionStorage.clear();
				this.showCustomToast('本地存储已清理', 'check_circle', 'rgb(80, 200, 160)');
			} catch(e) {
				this.showCustomToast('清理失败', 'cancel', 'rgb(240, 100, 120)');
			}
			// #endif
		},
		showCustomToast(message, icon = 'check_circle', color = 'rgb(80, 200, 160)', duration = 2500) {
			if (this.customToast.timer) {
				clearTimeout(this.customToast.timer);
			}
			this.customToast.visible = true;
			this.customToast.fadeOut = false;
			this.customToast.message = message;
			this.customToast.icon = icon;
			this.customToast.color = color;
			
			this.customToast.timer = setTimeout(() => {
				this.customToast.fadeOut = true;
				this.customToast.timer = setTimeout(() => {
					this.customToast.visible = false;
					this.customToast.fadeOut = false;
					this.customToast.timer = null;
				}, 300);
			}, duration);
		}
	}
}
</script>

<style>
@import '@/static/css/global.css';

/* 学校选择器样式 */
.school-switcher {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	border-radius: 20px;
	background: linear-gradient(135deg, rgba(0, 80, 150, 0.3) 0%, rgba(0, 60, 120, 0.4) 100%);
	backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
	border: 1px solid rgba(80, 140, 220, 0.3);
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: 0 2px 8px rgba(0, 40, 80, 0.3), inset 0 1px 0 rgba(120, 180, 255, 0.15);
}

.school-switcher:active { 
	transform: scale(0.95); 
}

.school-switcher-dot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	flex-shrink: 0;
}

.school-switcher-text {
	font-size: 13px;
	font-weight: 600;
	color: rgba(200, 225, 255, 0.95);
	letter-spacing: 0.5px;
	max-width: 150px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.school-switcher-arrow {
	font-size: 18px;
	color: rgba(140, 200, 255, 0.7);
}

/* 校区切换样式 */
.campus-switcher {
	width: 88%;
	margin: 0 auto 16px;
}

.campus-switcher-inner {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding: 14px 24px;
	border-radius: 18px;
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: 
		0 4px 20px rgba(0, 0, 0, 0.3),
		inset 0 1px 0 rgba(255, 255, 255, 0.08);
	position: relative;
	overflow: hidden;
}

.campus-switcher-inner::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 50%;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%);
	border-radius: 18px 18px 0 0;
	pointer-events: none;
}

.campus-switcher-inner:active {
	transform: scale(0.97);
	opacity: 0.9;
}

.campus-switcher-icon {
	font-size: 20px;
}

.campus-switcher-text {
	font-size: 15px;
	font-weight: 700;
	color: rgba(255, 255, 255, 0.95);
	letter-spacing: 0.5px;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.campus-switcher-arrow {
	font-size: 22px;
	transition: transform 0.3s;
}

/* 校区下拉菜单 */
.campus-dropdown-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.4);
	backdrop-filter: blur(4px);
	-webkit-backdrop-filter: blur(4px);
	z-index: 998;
}

.campus-dropdown {
	position: absolute;
	top: 140px;
	left: 50%;
	transform: translateX(-50%);
	width: 88%;
	background: rgba(12, 25, 50, 0.98);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	border: 1px solid rgba(60, 100, 160, 0.25);
	border-radius: 14px;
	overflow: hidden;
	box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

.campus-dropdown-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	transition: background 0.2s;
}

.campus-dropdown-item:last-child {
	border-bottom: none;
}

.campus-dropdown-item:active {
	background: rgba(255, 255, 255, 0.08);
}

.campus-dropdown-active {
	background: rgba(var(--color-primary-rgb, 0, 95, 156), 0.1);
}

.campus-dropdown-name {
	font-size: 15px;
	color: rgba(255, 255, 255, 0.9);
}

.campus-dropdown-check {
	font-size: 20px;
	color: #4ade80;
}

/* 预设点编辑弹窗样式 */
.preset-form {
	margin-bottom: 24px;
}

.preset-form .settings-field {
	margin-bottom: 16px;
}

.preset-form .settings-label {
	font-size: 13px;
	color: rgba(255, 255, 255, 0.45);
	margin-bottom: 8px;
	display: block;
	font-weight: 500;
	letter-spacing: 0.3px;
}

.preset-form .settings-input-wrapper {
	background: rgba(15, 30, 60, 0.6);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border: 1px solid rgba(60, 100, 160, 0.2);
	border-radius: 14px;
	padding: 14px 16px;
	transition: all 0.3s;
	box-shadow: inset 0 1px 0 rgba(80, 140, 220, 0.05);
}

.preset-form .settings-input-wrapper:focus-within {
	border-color: var(--color-primary);
	background: rgba(20, 40, 75, 0.7);
	box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.preset-form .settings-input {
	background: transparent;
	border: none;
	outline: none;
	color: rgba(255, 255, 255, 0.92);
	font-size: 16px;
	width: 100%;
	box-sizing: border-box;
	font-family: 'JetBrains Mono', monospace;
}

.preset-form .settings-input::placeholder {
	color: rgba(255, 255, 255, 0.25);
}

.preset-modal-actions {
	display: flex;
	align-items: center;
	gap: 12px;
	padding-top: 8px;
}

.btn-preset-delete {
	width: 48px;
	height: 48px;
	border-radius: 14px;
	background: rgba(220, 38, 38, 0.12);
	border: 1px solid rgba(220, 38, 38, 0.3);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-preset-delete:active {
	transform: scale(0.92);
	background: rgba(220, 38, 38, 0.25);
}

.btn-preset-delete .material-symbols-outlined {
	font-size: 20px;
	color: #f87171;
}

.btn-preset-cancel {
	flex: 1;
	height: 48px;
	border-radius: 14px;
	background: rgba(255, 255, 255, 0.06);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border: 1px solid rgba(255, 255, 255, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 15px;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.7);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-preset-cancel:active {
	transform: scale(0.96);
	background: rgba(255, 255, 255, 0.12);
}

.btn-preset-save {
	flex: 2;
	height: 48px;
	border-radius: 14px;
	background: linear-gradient(180deg, var(--color-primary-soft) 0%, rgba(0, 60, 120, 0.6) 100%);
	backdrop-filter: blur(16px);
	-webkit-backdrop-filter: blur(16px);
	border: 1px solid var(--color-border);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 15px;
	font-weight: 600;
	color: #ffffff;
	box-shadow: 0 4px 16px rgba(0, 40, 80, 0.3), inset 0 1px 0 rgba(120, 180, 255, 0.15);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-preset-save:active {
	transform: scale(0.96);
	opacity: 0.9;
}

/* App 开屏动画叠加层样式 */
.app-splash-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #08080c;
	z-index: 99999;
	transition: opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1);
	pointer-events: none;
}

.app-splash-overlay.fade-out {
	opacity: 0;
}

.splash-logo-container {
	position: absolute;
	top: 41%;
	left: 50%;
	transform: translateX(-50%);
	width: 20vw;
	height: 20vw;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}

.app-splash-overlay.fade-out .splash-logo-container {
	transform: translateX(-50%) scale(1.08);
}

.splash-logo {
	width: 100%;
	height: 100%;
}

/* 徽标背后的微弱呼吸光环 - 从0渐显，营造流光感 */
.splash-logo-glow {
	position: absolute;
	width: 28vw;
	height: 28vw;
	background: radial-gradient(circle, rgba(50, 140, 220, 0.16) 0%, rgba(50, 140, 220, 0) 70%);
	border-radius: 50%;
	z-index: -1;
	opacity: 0;
	transform: scale(0.7);
	animation: glow-fade-in 1.4s ease-out 0.2s forwards, pulse-glow 2.2s infinite alternate ease-in-out 1.6s;
}

.splash-branding {
	position: absolute;
	bottom: 11%;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease-out;
}

.app-splash-overlay.fade-out .splash-branding {
	transform: translateX(-50%) translateY(8px);
	opacity: 0;
}

.splash-title {
	font-family: -apple-system, SF Pro Display, Helvetica Neue, Arial, sans-serif;
	font-weight: 600;
	font-size: 3.7vw;
	color: #ffffff;
	letter-spacing: 0.37vw;
	margin-bottom: 0.8vw;
}

.splash-subtitle {
	font-family: -apple-system, SF Pro Text, Helvetica Neue, Arial, sans-serif;
	font-weight: 500;
	font-size: 1.2vw;
	color: rgba(255, 255, 255, 0.35);
	letter-spacing: 0.74vw;
	text-indent: 0.74vw;
}

@keyframes glow-fade-in {
	0% {
		opacity: 0;
		transform: scale(0.7);
	}
	100% {
		opacity: 1;
		transform: scale(1);
	}
}

@keyframes pulse-glow {
	0% {
		transform: scale(1);
		opacity: 0.7;
	}
	100% {
		transform: scale(1.15);
		opacity: 1;
	}
}

/* 自定义 Toast 样式 */
.custom-toast-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100000;
	pointer-events: none;
	animation: toast-enter 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.custom-toast-overlay.toast-fade-out {
	opacity: 0;
	transform: scale(0.9) translateY(-10px);
	transition: all 0.3s ease-in-out;
}
@keyframes toast-enter {
	from { opacity: 0; transform: scale(0.85) translateY(15px); }
	to { opacity: 1; transform: scale(1) translateY(0); }
}
.custom-toast-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 24px 32px;
	border-radius: 20px;
	background: rgba(10, 20, 45, 0.95);
	backdrop-filter: blur(24px) saturate(1.5);
	-webkit-backdrop-filter: blur(24px) saturate(1.5);
	border: 1px solid rgba(80, 140, 220, 0.25);
	box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
	max-width: 80%;
	box-sizing: border-box;
}
.custom-toast-icon {
	font-size: 40px;
}
.custom-toast-text {
	font-size: 15px;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.95);
	text-align: center;
	line-height: 1.5;
	letter-spacing: 0.5px;
	word-break: break-all;
}
</style>
