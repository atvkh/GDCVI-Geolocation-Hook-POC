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
			<view v-show="activeTab === 0" class="page-card home-card page-transition" :class="{ 'page-active': activeTab === 0 }">
				<TabHome ref="tabHome"
					:isGenerating="isGenerating" :loadingText="loadingText"
					:mouseX="mouseX" :mouseY="mouseY"
					:linkPattern="currentSchoolLinkPattern"
					@start-checkin="handleStartCheckIn"
					@open-tutorial="showTutorialSheet = true" />
			</view>
			
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
			:visible="showSchoolEditor"
			:schoolData="editingSchool"
			@close="showSchoolEditor = false"
			@save="handleSaveSchool"
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

		<web-view v-if="showWeb" :src="currentUrl" />
		
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
	</view>
</template>

<script>
import TabHome from '@/components/TabHome.vue';
import TabHistory from '@/components/TabHistory.vue';
import TabSettings from '@/components/TabSettings.vue';
import SchoolManager from '@/components/SchoolManager.vue';
import SchoolEditor from '@/components/SchoolEditor.vue';
import { generateCoreScript } from '@/utils/injectScript.js';
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
			historyList: uni.getStorageSync('historyList') || [],
			buttonSelector: '.adm-button-primary',
			showUpdateModal: false,
			updateInfo: { version: '', log: '', url: '', forceUpdate: false },
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
			editingSchool: null
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
		if (this.showSchoolManager) { this.showSchoolManager = false; return true; }
		if (this.showSchoolEditor) { this.showSchoolEditor = false; return true; }
		if (this.activeTab !== 0) { this.activeTab = 0; return true; }
		if (this.showTutorialSheet) { this.showTutorialSheet = false; return true; }
		if (this.$refs.tabHome && this.$refs.tabHome.showMatrix) { this.$refs.tabHome.closeMatrix(); return true; }
		if (this.showUpdateModal && !this.updateInfo.forceUpdate) { this.showUpdateModal = false; return true; }
		return false; 
	},
	created() {
		this.initSchoolData();
		this.checkAppUpdate();
		if (this.useRandomPreset) this.randomizePreset();
		this.checkWarningModal();
		this.startClock();
		
		// #ifdef APP-PLUS
		if (typeof window !== 'undefined') {
			window.__handleCheckinResult = (isSuccess, msg) => {
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
				uni.setStorageSync('historyList', this.historyList.slice(0, MAX_HISTORY_RECORDS));
			};

			window.__updateGlobalCoords = (lat, lng) => {
				this.fakeLat = lat;
				this.fakeLng = lng;
				this.localLat = String(lat);
				this.localLng = String(lng);
				uni.setStorageSync('fakeLat', lat);
				uni.setStorageSync('fakeLng', lng);
			};
		}
		// #endif
	},
	onUnload() {
		if (this.timerRef) clearInterval(this.timerRef);
	},
	methods: {
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
				success: (res) => {
					if (res.statusCode === 200 && res.data) {
						const remoteData = res.data;
						if (remoteData.versionCode && remoteData.versionCode > APP_VERSION_CODE) {
							this.updateInfo = {
								version: remoteData.version || '',
								log: remoteData.log || '',
								url: remoteData.url || '',
								forceUpdate: remoteData.forceUpdate || false
							};
							this.showUpdateModal = true;
						}
					}
				}
			});
		},
		goToDownload() {
			if (!this.updateInfo.url) {
				return uni.showToast({ title: '下载链接无效', icon: 'none' });
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
			this.isGenerating = false; this.hookStatus = 'inactive'; this.showWeb = false; 
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
			setTimeout(() => {
				this.currentUrl = url; this.showWeb = true; 
				this.$nextTick(() => { this.startAggressiveInjection(); });
			}, 500);
		},
		startAggressiveInjection() {
			// #ifdef APP-PLUS
			const coreScript = generateCoreScript(this.fakeLat, this.fakeLng, this.buttonSelector, this.defaultCoords.lat, this.defaultCoords.lng);
			
			if (this.persistentInjectTimer) {
				clearInterval(this.persistentInjectTimer);
			}

			let injectAttempts = 0;
			const tryInjectBurst = () => {
				if (!this.showWeb) return;
				const webviews = this.$scope.$getAppWebview().children();
				if (webviews && webviews.length > 0) webviews[0].evalJS(coreScript);
				if (injectAttempts++ < INJECT_MAX_ATTEMPTS) setTimeout(tryInjectBurst, INJECT_INTERVAL_MS);
			};
			this.$nextTick(() => { tryInjectBurst(); });

			this.persistentInjectTimer = setInterval(() => {
				if (!this.showWeb) {
					clearInterval(this.persistentInjectTimer);
					return;
				}
				const webviews = this.$scope.$getAppWebview().children();
				if (webviews && webviews.length > 0) webviews[0].evalJS(coreScript);
			}, 1000);

			setTimeout(() => { this.loadingText = '注入干扰算法...'; }, 800);
			setTimeout(() => { this.loadingText = '代理核心接口...'; }, 1600);
			setTimeout(() => { 
				this.loadingText = '监听系统状态...'; 
				this.hookStatus = 'active'; 
			}, 2400);
			// #endif
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
</style>
