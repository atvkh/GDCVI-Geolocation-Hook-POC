<template>
	<view class="body-container" :class="{ 'theme-guangzhou': currentCampus === 'guangzhou' }" @mousemove="trackMouse" @touchmove="trackMouse">
		
		<view class="precision-header" v-if="!showWeb">
			<view class="campus-switch" :class="{ 'campus-guangzhou': currentCampus === 'guangzhou' }" @click="toggleCampus">
				<text class="material-symbols-outlined campus-icon">swap_horiz</text>
				<text class="campus-text">{{ currentCampus === 'qingyuan' ? '清远校区' : '广州校区' }}</text>
			</view>
			<view class="system-indicators">
				<view class="btn-reset-pill" @click="handleResetApp">
					<text class="material-symbols-outlined">power_settings_new</text>
					<text class="reset-pill-text">重置</text>
				</view>
			</view>
		</view>

		<view class="main-content" v-if="!showWeb">
			<!-- 首页 -->
			<view v-show="activeTab === 0" class="page-card home-card page-transition" :class="{ 'page-active': activeTab === 0 }">
				<TabHome ref="tabHome"
					:isGenerating="isGenerating" :loadingText="loadingText"
					:mouseX="mouseX" :mouseY="mouseY" 
					@start-checkin="handleStartCheckIn"
					@open-tutorial="showTutorialSheet = true" />
			</view>
			
			<!-- 历史记录卡片 -->
			<view v-show="activeTab === 1" class="page-card history-card page-transition" :class="{ 'page-active': activeTab === 1 }">
				<view class="page-card-header">
					<view class="header-left">
						<text class="material-symbols-outlined page-card-icon">history</text>
						<text class="page-card-title">打卡历史</text>
					</view>
					<view class="header-actions">
						<view class="btn-export" @click="exportHistory">
							<text class="material-symbols-outlined">upload</text>
						</view>
					</view>
				</view>
				
				<!-- 统计信息 -->
				<view class="history-stats" v-if="historyList.length > 0">
					<view class="stat-item">
						<text class="stat-value stat-success">{{ successCount }}</text>
						<text class="stat-label">成功</text>
					</view>
					<view class="stat-divider"></view>
					<view class="stat-item">
						<text class="stat-value stat-fail">{{ failCount }}</text>
						<text class="stat-label">失败</text>
					</view>
					<view class="stat-divider"></view>
					<view class="stat-item">
						<text class="stat-value">{{ weekCount }}</text>
						<text class="stat-label">本周</text>
					</view>
				</view>
				
				<scroll-view scroll-y="true" class="page-card-scroll">
					<view v-for="(item, index) in historyList" :key="index" class="history-item" @click="toggleHistoryDetail(index)">
						<view class="history-item-main">
							<view class="history-item-left">
								<text class="history-item-time">{{ item.time }}</text>
								<text class="history-item-coord">坐标: {{ item.lat }}, {{ item.lng }}</text>
							</view>
							<view class="history-item-right">
								<view class="history-item-tag" :class="item.status === '失败' ? 'tag-fail' : 'tag-success'">
									{{ item.status || '成功' }}
								</view>
								<text class="material-symbols-outlined expand-icon" :class="{ 'expanded': expandedIndex === index }">expand_more</text>
							</view>
						</view>
						<view class="history-item-detail" v-if="expandedIndex === index">
							<view class="detail-row">
								<text class="detail-label">打卡时间</text>
								<text class="detail-value">{{ item.time }}</text>
							</view>
							<view class="detail-row">
								<text class="detail-label">纬度</text>
								<text class="detail-value">{{ item.lat }}</text>
							</view>
							<view class="detail-row">
								<text class="detail-label">经度</text>
								<text class="detail-value">{{ item.lng }}</text>
							</view>
							<view class="detail-row" v-if="item.status === '失败' && item.reason">
								<text class="detail-label">失败原因</text>
								<text class="detail-value detail-reason">{{ item.reason }}</text>
							</view>
						</view>
					</view>
					<view v-if="historyList.length === 0" class="history-empty">
						<view class="satellite-container">
							<view class="signal-ring signal-ring-1"></view>
							<view class="signal-ring signal-ring-2"></view>
							<view class="signal-ring signal-ring-3"></view>
							<text class="material-symbols-outlined history-empty-icon">satellite_alt</text>
						</view>
						<text class="history-empty-text">暂无打卡记录</text>
					</view>
				</scroll-view>
			</view>
			
			<!-- 设置卡片 -->
			<view v-show="activeTab === 2" class="page-card settings-card page-transition" :class="{ 'page-active': activeTab === 2 }">
				<view class="page-card-header">
					<text class="material-symbols-outlined page-card-icon">settings</text>
					<text class="page-card-title">坐标配置</text>
				</view>
				<view class="settings-scroll-area">
					<view class="settings-field">
						<text class="settings-label">目标纬度 (Lat)</text>
						<view class="settings-input-wrapper">
							<input 
								type="text" 
								v-model="localLat"
								class="settings-input" 
								placeholder="请输入纬度"
							/>
						</view>
					</view>
					<view class="settings-field">
						<text class="settings-label">目标经度 (Lng)</text>
						<view class="settings-input-wrapper">
							<input 
								type="text" 
								v-model="localLng"
								class="settings-input" 
								placeholder="请输入经度"
							/>
						</view>
					</view>

					<view class="section-header-row">
						<text class="settings-section-title">快捷预设点</text>
						<view class="btn-add-preset" @click="showAddPresetModal = true">
							<text class="material-symbols-outlined">add</text>
						</view>
					</view>
					<view class="settings-dropdown">
						<view class="dropdown-selected" @click="togglePresetDropdown">
							<text class="dropdown-text">{{ selectedPresetName || '选择预设点...' }}</text>
							<text class="material-symbols-outlined dropdown-arrow" :class="{'dropdown-open': showPresetDropdown}">expand_more</text>
						</view>
						<view class="dropdown-list" v-if="showPresetDropdown">
							<view class="dropdown-item" v-for="(loc, index) in presetLocations" :key="index"
								:class="{'dropdown-active': selectedPresetIndex === index}"
								@click="selectPreset(loc, index)"
								@longpress="editPreset(index)">
								<view class="dropdown-item-info">
									<text class="dropdown-item-name">{{ loc.name }}</text>
									<text class="dropdown-item-coord">{{ loc.lat }}, {{ loc.lng }}</text>
								</view>
								<text class="material-symbols-outlined dropdown-check" v-if="selectedPresetIndex === index">check_circle</text>
							</view>
						</view>
					</view>

					<view class="settings-mode">
						<view class="mode-dot" :class="{'mode-random': useRandomPreset, 'mode-locked': !useRandomPreset}"></view>
						<text class="mode-text" v-if="useRandomPreset">当前模式：随机预设点</text>
						<text class="mode-text" v-else>当前模式：锁定坐标</text>
					</view>

					<view class="settings-actions">
						<view class="btn-settings-secondary" @click="backToSchool" v-if="!useRandomPreset"><text>恢复随机模式</text></view>
						<view class="btn-settings-primary" @click="saveCoordSettings"><text>更新位置协议</text></view>
					</view>

					<view class="settings-divider"></view>
					<view class="settings-footer">
						<view class="settings-footer-btn" @click="openGithub">
							<text class="material-symbols-outlined" style="font-size: 18px;">code</text>
							<text class="settings-footer-text">GitHub</text>
						</view>
						<view class="settings-footer-btn" @click="copyEmail">
							<text class="material-symbols-outlined" style="font-size: 18px;">mail</text>
							<text class="settings-footer-text">联系作者</text>
						</view>
					</view>
				</view>
			</view>
		</view>

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
import { generateCoreScript } from '@/utils/injectScript.js';
import { 
	APP_VERSION, APP_VERSION_CODE, UPDATE_JSON_URL,
	DEFAULT_LAT, DEFAULT_LNG, INJECT_MAX_ATTEMPTS, 
	INJECT_INTERVAL_MS, MAX_HISTORY_RECORDS, PRESET_LOCATIONS,
	QINGYUAN_PRESETS, GUANGZHOU_PRESETS
} from '@/utils/constants.js';

export default {
	components: { TabHome },
	data() {
		return {
			appVersion: APP_VERSION,
			showWeb: false, currentUrl: '', hookStatus: 'inactive',
			isGenerating: false, loadingText: '', mouseX: 0, mouseY: 0,
			useRandomPreset: uni.getStorageSync('useRandomPreset') !== false,
			fakeLat: uni.getStorageSync('fakeLat') ? parseFloat(uni.getStorageSync('fakeLat')) : DEFAULT_LAT,
			fakeLng: uni.getStorageSync('fakeLng') ? parseFloat(uni.getStorageSync('fakeLng')) : DEFAULT_LNG,
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
			localLat: uni.getStorageSync('fakeLat') ? String(uni.getStorageSync('fakeLat')) : String(DEFAULT_LAT),
			localLng: uni.getStorageSync('fakeLng') ? String(uni.getStorageSync('fakeLng')) : String(DEFAULT_LNG),
			currentCampus: uni.getStorageSync('currentCampus') || 'qingyuan',
			presetLocations: uni.getStorageSync('currentCampus') === 'guangzhou' ? GUANGZHOU_PRESETS : QINGYUAN_PRESETS,
			selectedPresetIndex: -1,
			selectedPresetName: '',
			showPresetDropdown: false,
			expandedIndex: -1,
			showAddPresetModal: false,
			showEditPresetModal: false,
			editingPresetIndex: -1,
			editingPreset: { name: '', lat: '', lng: '' }
		}
	},
	computed: {
		successCount() {
			return this.historyList.filter(item => item.status !== '失败').length;
		},
		failCount() {
			return this.historyList.filter(item => item.status === '失败').length;
		},
		weekCount() {
			const now = new Date();
			const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			return this.historyList.filter(item => {
				// 简化处理，实际需要解析时间
				return true;
			}).length;
		}
	},
	onBackPress() {
		if (this.showWeb) { this.handleResetApp(); return true; }
		if (this.activeTab !== 0) { this.activeTab = 0; return true; }
		if (this.showTutorialSheet) { this.showTutorialSheet = false; return true; }
		if (this.$refs.tabHome && this.$refs.tabHome.showMatrix) { this.$refs.tabHome.closeMatrix(); return true; }
		if (this.showUpdateModal && !this.updateInfo.forceUpdate) { this.showUpdateModal = false; return true; }
		return false; 
	},
	created() {
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
				
				this.historyList.unshift({ 
					time: timeStr, lat: this.fakeLat, lng: this.fakeLng, 
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
		noop() {},
		switchTab(index) {
			this.activeTab = index;
			this.showTutorialSheet = false;
		},
		toggleHistoryDetail(index) {
			this.expandedIndex = this.expandedIndex === index ? -1 : index;
		},
		exportHistory() {
			if (this.historyList.length === 0) {
				uni.showToast({ title: '暂无记录可导出', icon: 'none' });
				return;
			}
			let text = '打卡历史记录\n';
			text += '================\n\n';
			this.historyList.forEach((item, index) => {
				text += `${index + 1}. 时间: ${item.time}\n`;
				text += `   坐标: ${item.lat}, ${item.lng}\n`;
				text += `   状态: ${item.status || '成功'}\n`;
				if (item.reason) text += `   原因: ${item.reason}\n`;
				text += '\n';
			});
			uni.setClipboardData({
				data: text,
				success: () => {
					uni.showToast({ title: '已复制到剪贴板', icon: 'none' });
				}
			});
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
			
			if (this.showEditPresetModal) {
				// 编辑现有预设点
				this.presetLocations[this.editingPresetIndex] = { name, lat, lng };
			} else {
				// 添加新预设点
				this.presetLocations.push({ name, lat, lng });
			}
			
			// 保存到本地存储
			const storageKey = this.currentCampus === 'guangzhou' ? 'guangzhou_presets' : 'qingyuan_presets';
			uni.setStorageSync(storageKey, this.presetLocations);
			
			this.closePresetModal();
			uni.showToast({ title: '保存成功', icon: 'none' });
		},
		deletePreset() {
			if (this.presetLocations.length <= 1) {
				uni.showToast({ title: '至少保留一个预设点', icon: 'none' });
				return;
			}
			
			this.presetLocations.splice(this.editingPresetIndex, 1);
			
			// 保存到本地存储
			const storageKey = this.currentCampus === 'guangzhou' ? 'guangzhou_presets' : 'qingyuan_presets';
			uni.setStorageSync(storageKey, this.presetLocations);
			
			// 如果删除的是当前选中的预设点，重置选择
			if (this.selectedPresetIndex === this.editingPresetIndex) {
				this.selectedPresetIndex = -1;
				this.selectedPresetName = '';
			}
			
			this.closePresetModal();
			uni.showToast({ title: '已删除', icon: 'none' });
		},
		toggleCampus() {
			// 切换校区
			this.currentCampus = this.currentCampus === 'qingyuan' ? 'guangzhou' : 'qingyuan';
			uni.setStorageSync('currentCampus', this.currentCampus);
			
			// 更新预设点列表
			this.presetLocations = this.currentCampus === 'guangzhou' ? GUANGZHOU_PRESETS : QINGYUAN_PRESETS;
			
			// 随机选择一个预设点
			this.randomizePreset();
			
			uni.showToast({ 
				title: `已切换至${this.currentCampus === 'qingyuan' ? '清远' : '广州'}校区`, 
				icon: 'none' 
			});
		},
		togglePresetDropdown() {
			this.showPresetDropdown = !this.showPresetDropdown;
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
			this.showPresetDropdown = false;
		},
		backToSchool() {
			this.randomizePreset();
			this.showCoordSheet = false;
			uni.showToast({ title: '已切换至随机模式', icon: 'none' });
		},
		saveCoordSettings() {
			this.fakeLat = Number(this.localLat);
			this.fakeLng = Number(this.localLng);
			this.useRandomPreset = false;
			uni.setStorageSync('fakeLat', this.fakeLat);
			uni.setStorageSync('fakeLng', this.fakeLng);
			uni.setStorageSync('useRandomPreset', false);
			this.showCoordSheet = false;
			uni.showToast({ title: '配置已更新', icon: 'none' });
		},
		copyEmail() {
			uni.setClipboardData({
				data: 'Atvkh@outlook.com',
				success: () => uni.showToast({ title: '邮箱已复制', icon: 'none' })
			});
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
			const coreScript = generateCoreScript(this.fakeLat, this.fakeLng, this.buttonSelector, DEFAULT_LAT, DEFAULT_LNG);
			
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
@font-face {
	font-family: 'Material Symbols Outlined';
	font-style: normal;
	font-weight: 100 700;
	font-display: swap;
	src: url('/static/fonts/MaterialSymbolsOutlined.woff2') format('woff2');
}

.material-symbols-outlined {
	font-family: 'Material Symbols Outlined', sans-serif;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	max-width: 1em;
	max-height: 1em;
	overflow: hidden;
	white-space: nowrap;
	word-wrap: normal;
	direction: ltr;
	font-feature-settings: 'liga';
	-webkit-font-smoothing: antialiased;
}

page {
	--color-primary: rgb(0, 95, 156);
	--color-primary-soft: rgba(0, 95, 156, 0.3);
	--color-success: #7dd3a8;
	--color-info: rgb(0, 95, 156);
	--color-danger: #e57373;
	--color-bg-dark: #081020;
	--color-bg-base: #0a1628;
	--color-bg-gradient: linear-gradient(145deg, #081020 0%, #0d1e35 50%, #0a1628 100%);
	--color-surface: rgba(15, 30, 60, 0.5);
	--color-text-main: #ffffff;
	--color-text-muted: rgba(180, 200, 230, 0.8);
	--color-text-tertiary: rgba(150, 170, 200, 0.5);
	--color-border: rgba(50, 80, 130, 0.3);
	--color-border-light: rgba(60, 100, 160, 0.2);
	--glass-bg: rgba(15, 30, 60, 0.6);
	--glass-bg-thick: rgba(20, 40, 75, 0.7);
	--glass-blur: blur(20px);
	--glass-blur-thick: blur(32px);
	--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(100, 150, 220, 0.1);
	--glass-shadow-soft: 0 4px 16px rgba(0, 0, 0, 0.3);
}

page { background: var(--color-bg-dark); }

.body-container {
	height: 100vh; color: var(--color-text-main); display: flex; flex-direction: column; align-items: center;
	background: var(--color-bg-gradient);
	padding-bottom: 80px;
	position: relative; overflow-y: auto; overflow-x: hidden; z-index: 1;
	-webkit-overflow-scrolling: touch;
}
.body-container::before {
	content: ''; position: fixed; top: -30%; left: -30%; right: -30%; bottom: -30%; width: 160%; height: 160%;
	background: 
		radial-gradient(ellipse at 25% 20%, rgba(0, 80, 160, 0.15) 0%, transparent 50%),
		radial-gradient(ellipse at 75% 80%, rgba(0, 60, 140, 0.1) 0%, transparent 45%),
		radial-gradient(ellipse at 50% 50%, rgba(0, 50, 120, 0.08) 0%, transparent 60%);
	filter: blur(80px); z-index: -1; animation: ambient-drift 25s ease-in-out infinite alternate; pointer-events: none;
	will-change: transform; transform: translateZ(0);
}
@keyframes ambient-drift { 
	0% { transform: translate(0, 0) scale(1) rotate(0deg); } 
	33% { transform: translate(2%, -3%) scale(1.02) rotate(1deg); }
	66% { transform: translate(-2%, 2%) scale(0.98) rotate(-1deg); }
	100% { transform: translate(3%, 5%) scale(1.05) rotate(0.5deg); } 
}

/* 广州校区主题 - 紫色调 */
.theme-guangzhou {
	--color-primary: rgb(140, 80, 200);
	--color-primary-soft: rgba(140, 80, 200, 0.3);
	--color-bg-dark: #100818;
	--color-bg-base: #140a20;
	--color-bg-gradient: linear-gradient(145deg, #100818 0%, #1a1030 50%, #140a20 100%);
	--color-border: rgba(120, 80, 180, 0.3);
	--color-border-light: rgba(140, 100, 200, 0.2);
	--glass-bg: rgba(30, 15, 50, 0.6);
	--glass-bg-thick: rgba(40, 20, 65, 0.7);
	--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(180, 140, 240, 0.1);
	transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.theme-guangzhou::before {
	background: 
		radial-gradient(ellipse at 25% 20%, rgba(120, 60, 180, 0.15) 0%, transparent 50%),
		radial-gradient(ellipse at 75% 80%, rgba(100, 40, 160, 0.1) 0%, transparent 45%),
		radial-gradient(ellipse at 50% 50%, rgba(80, 30, 140, 0.08) 0%, transparent 60%);
	transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content { margin-top: 0; width: 100%; display: flex; flex-direction: column; align-items: center; position: relative; padding: 0; box-sizing: border-box; }



.precision-header { margin-top: 6vh; width: 88%; display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; padding: 0 10px; }
.system-time { display: flex; align-items: baseline; font-family: 'JetBrains Mono', 'Roboto Mono', monospace; }
.time-main { font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -1px; }
.time-ms { font-size: 14px; color: rgba(255,255,255,0.3); font-weight: 500; margin-left: 2px; width: 32px; }
.system-indicators { display: flex; gap: 12px; }
.indicator-item { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.2); transition: all 0.4s; }
.indicator-item.active { color: #00E676; background: rgba(0,230,118,0.05); border-color: rgba(0,230,118,0.2); filter: drop-shadow(0 0 5px rgba(0,230,118,0.3)); }
.indicator-item .material-symbols-outlined { font-size: 18px; }
.btn-reset-pill { 
	height: 34px; border-radius: 100px; 
	background: rgba(220, 38, 38, 0.12); 
	border: 1px solid rgba(220, 38, 38, 0.35); 
	display: flex; align-items: center; justify-content: center; gap: 5px; 
	padding: 0 14px 0 10px; 
	color: rgba(240, 100, 100, 0.9); 
	cursor: pointer; transition: all 0.3s; 
}
.btn-reset-pill .material-symbols-outlined { font-size: 16px; transition: all 0.3s; }
.reset-pill-text { font-size: 11px; font-weight: 700; letter-spacing: 1px; }
.btn-reset-pill:active { background: rgba(220,38,38,0.25); color: #ef5350; border-color: rgba(220,38,38,0.6); filter: drop-shadow(0 0 10px rgba(220,38,38,0.5)); transform: scale(0.92); }

/* 校区切换按钮 - 清远校区（蓝色） */
.campus-switch {
	display: flex; align-items: center; gap: 6px;
	padding: 8px 16px;
	border-radius: 20px;
	background: linear-gradient(135deg, rgba(0, 80, 150, 0.3) 0%, rgba(0, 60, 120, 0.4) 100%);
	backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
	border: 1px solid rgba(80, 140, 220, 0.3);
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: 0 2px 8px rgba(0, 40, 80, 0.3), inset 0 1px 0 rgba(120, 180, 255, 0.15);
}
.campus-switch:active { 
	transform: scale(0.95); 
	background: linear-gradient(135deg, rgba(0, 80, 150, 0.4) 0%, rgba(0, 60, 120, 0.5) 100%);
}
.campus-icon {
	font-size: 18px;
	color: rgba(140, 200, 255, 0.9);
}
.campus-text {
	font-size: 12px;
	font-weight: 600;
	color: rgba(200, 225, 255, 0.95);
	letter-spacing: 0.5px;
}

/* 校区切换按钮 - 广州校区（紫色） */
.campus-switch.campus-guangzhou {
	background: linear-gradient(135deg, rgba(120, 60, 180, 0.3) 0%, rgba(100, 40, 160, 0.4) 100%);
	border: 1px solid rgba(160, 100, 220, 0.3);
	box-shadow: 0 2px 8px rgba(60, 20, 100, 0.3), inset 0 1px 0 rgba(200, 160, 255, 0.15);
}
.campus-switch.campus-guangzhou:active { 
	background: linear-gradient(135deg, rgba(120, 60, 180, 0.4) 0%, rgba(100, 40, 160, 0.5) 100%);
}
.campus-switch.campus-guangzhou .campus-icon {
	color: rgba(200, 160, 255, 0.9);
}
.campus-switch.campus-guangzhou .campus-text {
	color: rgba(220, 200, 255, 0.95);
}



/* 教程卡片苹果风格 */
.tutorial-overlay {
	position: fixed; top: 0; right: 0; bottom: 0; left: 0;
	background: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(10px);
	z-index: 9999;
	display: flex; align-items: center; justify-content: center;
}
.tutorial-card {
	width: 90%;
	max-width: 400px;
	background: rgba(15, 30, 60, 0.85);
	backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
	border: 1px solid rgba(60, 100, 160, 0.25);
	border-radius: 24px;
	padding: 28px 24px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(80, 140, 220, 0.1);
}
.tutorial-header {
	text-align: center;
	margin-bottom: 24px;
	padding-bottom: 20px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.tutorial-icon {
	font-size: 48px;
	color: rgba(100, 170, 255, 0.9);
	margin-bottom: 12px;
	display: block;
	text-shadow: 0 0 20px rgba(0, 80, 160, 0.4);
}
.tutorial-title {
	font-size: 24px;
	font-weight: 800;
	color: #fff;
	display: block;
	margin-bottom: 8px;
}
.tutorial-subtitle {
	font-size: 14px;
	color: rgba(120, 160, 210, 0.7);
	display: block;
}
.tutorial-scroll {
	max-height: 400px;
	margin-bottom: 20px;
}
.tutorial-step {
	display: flex; gap: 16px;
	margin-bottom: 16px;
	padding: 16px;
	background: rgba(15, 30, 60, 0.4);
	border-radius: 16px;
	border: 1px solid rgba(60, 100, 160, 0.15);
}
.tutorial-step.step-critical {
	background: rgba(220, 60, 60, 0.1);
	border-color: rgba(220, 60, 60, 0.25);
}
.step-number {
	width: 32px; height: 32px;
	border-radius: 50%;
	background: rgba(0, 80, 150, 0.3);
	color: rgba(100, 170, 255, 0.9);
	display: flex; align-items: center; justify-content: center;
	font-size: 16px; font-weight: 700;
	flex-shrink: 0;
}
.step-number-critical {
	background: rgba(239, 68, 68, 0.3);
	color: #f87171;
}
.step-content {
	flex: 1;
}
.step-title {
	font-size: 16px;
	font-weight: 700;
	color: #fff;
	display: block;
	margin-bottom: 6px;
}
.step-title-critical {
	color: #f87171;
}
.step-desc {
	font-size: 13px;
	color: #8B9CB6;
	line-height: 1.6;
	display: block;
}
.tutorial-footer {
	padding-top: 8px;
}
.btn-tutorial-close {
	width: 100%;
	height: 52px;
	border-radius: 20px;
	background: linear-gradient(180deg, rgba(0, 80, 150, 0.5) 0%, rgba(0, 60, 120, 0.6) 100%);
	backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
	border: 1px solid rgba(80, 140, 220, 0.3);
	color: #fff;
	font-size: 16px;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 16px rgba(0, 40, 80, 0.3), inset 0 1px 0 rgba(120, 180, 255, 0.15);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-tutorial-close:active {
	transform: scale(0.96);
	opacity: 0.9;
}

/* ——— 风险警告弹窗 ——— */
.warning-overlay {
	position: fixed; top: 0; right: 0; bottom: 0; left: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center;
}
.warning-card {
	background: #111A2B;
	border: 1px solid #1C273A;
	border-radius: 20px; padding: 20px; width: 85%;
	display: flex; flex-direction: column; align-items: center;
}
.warning-icon {
	font-size: 56px; color: #dc2626;
	filter: drop-shadow(0 0 20px rgba(220,38,38,0.6));
	margin-bottom: 16px;
}
.warning-title {
	font-size: 22px; font-weight: 800; color: #dc2626; text-align: center;
	margin-bottom: 16px;
}
.warning-guide {
	font-size: 14px; color: rgba(255,255,255,0.6); text-align: center;
	line-height: 1.6; margin-bottom: 20px;
}
.highlight-risk-panel {
	background: rgba(220,38,38,0.1); border-radius: 16px;
	padding: 18px; width: 100%; box-sizing: border-box;
	border: 1px solid rgba(220,38,38,0.2);
	margin-bottom: 16px;
}
.highlight-risk-text {
	color: #f87171; font-weight: 800; font-size: 15px; line-height: 1.7;
	text-align: center; display: block;
}
.warning-explain {
	font-size: 12px; color: rgba(255,255,255,0.3); text-align: center;
	line-height: 1.6; margin-bottom: 32px;
}
.warning-actions { width: 100%; display: flex; flex-direction: column; gap: 20px; }
.checkbox-label {
	display: flex; align-items: center; justify-content: center; gap: 10px;
	cursor: pointer;
}
.custom-checkbox {
	width: 20px; height: 20px; border-radius: 6px;
	border: 1px solid rgba(255,255,255,0.3); display: flex;
	align-items: center; justify-content: center; transition: all 0.2s;
	background: rgba(255,255,255,0.05);
}
.custom-checkbox.is-checked { background: #dc2626; border-color: #dc2626; }
.checkbox-text { font-size: 13px; color: rgba(255,255,255,0.5); }
.btn-warning-confirm {
	background: rgba(220,38,38,0.15); color: #f87171;
	border: 1px solid rgba(220,38,38,0.5); font-weight: 800; font-size: 16px;
	border-radius: 100px; height: 60px; width: 100%;
	display: flex; align-items: center; justify-content: center;
	transition: all 0.3s;
	box-shadow: 0 0 20px rgba(220,38,38,0.2), inset 0 0 10px rgba(220,38,38,0.1);
}
.btn-warning-confirm:active { transform: scale(0.96); background: rgba(220,38,38,0.3); }

/* ——— 更新弹窗 ——— */
.tutorial-overlay { position: fixed; top: 0; right: 0; bottom: 0; left: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; }
.update-card { background: #111A2B; border: 1px solid #1C273A; border-radius: 20px; padding: 20px; width: 85%; }
.update-header { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; margin-bottom: 24px; }
.update-icon { font-size: 48px; color: var(--color-info); text-shadow: 0 0 20px rgba(56,189,248,0.6); }
.tutorial-title { font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 30px; text-align: center; display: block; }
.update-scroll { max-height: 250px; background: rgba(255,255,255,0.02); border-radius: 12px; padding: 16px; border: 1px solid var(--color-border); margin-bottom: 24px; }
.update-log-text { font-size: 13px; color: var(--color-text-muted); line-height: 1.8; white-space: pre-wrap; font-family: monospace; }
.update-actions { display: flex; gap: 12px; }
.btn-cancel-update { flex: 1; background: rgba(255,255,255,0.05); color: var(--color-text-muted); border: none; border-radius: 14px; font-size: 14px; font-weight: bold; height: 50px; display: flex; align-items: center; justify-content: center; }
.btn-confirm-update { flex: 2; background: var(--color-info); color: #000; border: none; border-radius: 14px; font-size: 14px; font-weight: 900; height: 50px; display: flex; align-items: center; justify-content: center; }

.glass-card {
	width: 100%;
	background: var(--glass-bg);
	backdrop-filter: var(--glass-blur-thick); -webkit-backdrop-filter: var(--glass-blur-thick);
	border: 1px solid var(--color-border-light);
	border-radius: 24px;
	padding: 24px;
	position: relative; overflow: hidden;
	box-sizing: border-box;
	box-shadow: var(--glass-shadow);
}
.glass-card::before {
	content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
}
@keyframes card-float-in { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
.card-glow-bg { position: absolute; width: 250px; height: 250px; filter: blur(90px); pointer-events: none; border-radius: 50%; opacity: 0.15; animation: glow-drift 8s ease-in-out infinite alternate; mix-blend-mode: screen; will-change: transform; }
@keyframes glow-drift { 0% { transform: translate(0, 0); } 100% { transform: translate(30px, -20px); } }
.card-inner { position: relative; z-index: 10; }
.label-text { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; font-weight: bold; display: block; }

@keyframes modal-in { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.spinning { animation: spin 2s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* 底部导航栏 - 液态磁吸胶囊 */
.island-container {
	position: fixed; left: 0; right: 0; bottom: 20px;
	display: flex; justify-content: center;
	z-index: 100;
	padding-bottom: env(safe-area-inset-bottom);
}
.island-pill {
	display: flex; align-items: center;
	background: rgba(12, 20, 40, 0.75);
	backdrop-filter: blur(40px) saturate(1.8); -webkit-backdrop-filter: blur(40px) saturate(1.8);
	border: 1px solid rgba(80, 130, 200, 0.15);
	border-radius: 50px;
	padding: 6px;
	position: relative;
	box-shadow: 
		0 8px 40px rgba(0, 0, 0, 0.5),
		0 2px 8px rgba(0, 0, 0, 0.3),
		inset 0 1px 0 rgba(120, 180, 255, 0.08),
		inset 0 -1px 0 rgba(0, 0, 0, 0.2);
}
.island-pill::before {
	content: ''; position: absolute; top: 0; left: 0; right: 0; height: 50%;
	background: linear-gradient(180deg, rgba(100, 160, 240, 0.06) 0%, transparent 100%);
	border-radius: 50px 50px 0 0; pointer-events: none;
}
.island-indicator {
	position: absolute;
	width: 64px;
	height: calc(100% - 12px);
	background: linear-gradient(180deg, rgba(0, 100, 180, 0.4) 0%, rgba(0, 70, 140, 0.5) 100%);
	border-radius: 44px;
	left: 6px;
	top: 6px;
	transition: transform 0.35s cubic-bezier(0.2, 1.2, 0.3, 1);
	box-shadow: 
		0 0 20px rgba(0, 100, 200, 0.25),
		inset 0 1px 0 rgba(150, 210, 255, 0.2),
		inset 0 -1px 0 rgba(0, 0, 0, 0.15);
	will-change: transform;
}
.island-tab {
	display: flex; align-items: center; justify-content: center;
	width: 64px; height: 52px;
	border-radius: 44px;
	color: rgba(100, 140, 190, 0.5);
	transition: all 0.35s cubic-bezier(0.2, 1.2, 0.3, 1);
	position: relative; z-index: 2;
}
.island-tab.active {
	color: rgba(180, 220, 255, 0.95);
	filter: drop-shadow(0 0 12px rgba(0, 120, 220, 0.4));
	transform: translateY(-2px) scale(1.08);
}
.island-tab:not(.active) {
	transform: translateY(1px) scale(0.92);
}
.island-tab:active { transform: scale(0.88); }
.island-icon { 
	font-size: 22px; 
	transition: all 0.35s cubic-bezier(0.2, 1.2, 0.3, 1);
}

/* ——— 页面卡片通用样式 - Liquid Glass ——— */
.page-card {
	width: 100%;
	background: linear-gradient(180deg, rgba(20, 35, 65, 0.65) 0%, rgba(15, 28, 55, 0.75) 100%);
	backdrop-filter: blur(32px) saturate(1.5); -webkit-backdrop-filter: blur(32px) saturate(1.5);
	border: 1px solid rgba(80, 130, 200, 0.12);
	border-radius: 24px;
	padding: 20px;
	box-sizing: border-box;
	margin-top: 0;
	box-shadow: 
		0 12px 48px rgba(0, 0, 0, 0.4),
		0 4px 16px rgba(0, 0, 0, 0.3),
		inset 0 1px 0 rgba(120, 180, 255, 0.08),
		inset 0 -1px 0 rgba(0, 0, 0, 0.15);
	position: relative;
	overflow: hidden;
	animation: card-enter 0.6s cubic-bezier(0.2, 1, 0.3, 1);
	transition: background 0.8s cubic-bezier(0.4, 0, 0.2, 1), 
				border-color 0.8s cubic-bezier(0.4, 0, 0.2, 1),
				box-shadow 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-card::before {
	content: ''; position: absolute; top: 0; left: 0; right: 0; height: 50%;
	background: linear-gradient(180deg, rgba(80, 140, 220, 0.06) 0%, transparent 100%);
	border-radius: 24px 24px 0 0; pointer-events: none;
}
.page-card::after {
	content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
	background: linear-gradient(90deg, transparent 10%, rgba(140, 200, 255, 0.12) 50%, transparent 90%);
}
@keyframes card-enter {
	from { opacity: 0; transform: scale(0.96) translateY(8px); }
	to { opacity: 1; transform: scale(1) translateY(0); }
}

/* 页面切换动画 */
.page-transition {
	opacity: 0;
	position: absolute;
	width: 100%;
	pointer-events: none;
	visibility: hidden;
	will-change: opacity;
}
.page-transition.page-active {
	opacity: 1;
	pointer-events: auto;
	visibility: visible;
}
.page-card-header {
	display: flex; align-items: center; gap: 12px;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid rgba(255,255,255,0.05);
}
.page-card-icon {
	font-size: 24px;
	color: rgb(0, 95, 156);
}
.page-card-title {
	font-size: 20px;
	font-weight: 700;
	color: #fff;
}
.page-card-scroll {
	max-height: 60vh;
}

/* ——— 首页卡片 ——— */
.home-card {
	padding: 0;
	border: none;
	background: transparent;
}

/* ——— 历史记录卡片 ——— */
.history-card {
	background: rgba(12, 25, 50, 0.5);
}
.page-card-header {
	display: flex; align-items: center; justify-content: space-between;
	margin-bottom: 16px; padding-bottom: 12px;
	border-bottom: 1px solid rgba(255,255,255,0.06);
}
.header-left { display: flex; align-items: center; gap: 10px; }
.header-actions { display: flex; gap: 8px; }
.btn-export {
	width: 36px; height: 36px; border-radius: 12px;
	background: rgba(255,255,255,0.06);
	border: 1px solid rgba(255,255,255,0.1);
	display: flex; align-items: center; justify-content: center;
	transition: all 0.3s;
}
.btn-export:active { background: rgba(255,255,255,0.1); transform: scale(0.95); }
.btn-export .material-symbols-outlined { font-size: 18px; color: rgba(255,255,255,0.6); }

/* 统计信息 */
.history-stats {
	display: flex; align-items: center; justify-content: space-around;
	padding: 14px; margin-bottom: 16px;
	background: rgba(255,255,255,0.03);
	border-radius: 14px;
	border: 1px solid rgba(255,255,255,0.06);
}
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-value { font-size: 22px; font-weight: 700; color: #fff; }
.stat-success { color: #4ade80; }
.stat-fail { color: #f87171; }
.stat-label { font-size: 11px; color: rgba(255,255,255,0.45); }
.stat-divider { width: 1px; height: 30px; background: rgba(255,255,255,0.08); }

/* 历史记录项 */
.history-item {
	padding: 0;
	border-bottom: 1px solid rgba(255,255,255,0.05);
	cursor: pointer;
}
.history-item:last-child { border-bottom: none; }
.history-item-main {
	display: flex; justify-content: space-between; align-items: center;
	padding: 14px 0;
}
.history-item-left { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.history-item-time { font-size: 15px; font-weight: 600; color: #fff; }
.history-item-coord { font-size: 12px; color: rgba(255,255,255,0.4); font-family: 'JetBrains Mono', monospace; }
.history-item-right { display: flex; align-items: center; gap: 10px; }
.history-item-tag {
	font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 16px;
}
.tag-success {
	background: rgba(74,222,128,0.12); color: #4ade80;
	border: 1px solid rgba(74,222,128,0.2);
}
.tag-fail {
	background: rgba(239,68,68,0.12); color: #f87171;
	border: 1px solid rgba(239,68,68,0.2);
}
.expand-icon {
	font-size: 20px; color: rgba(255,255,255,0.3);
	transition: transform 0.3s;
}
.expand-icon.expanded { transform: rotate(180deg); }

/* 历史记录详情 */
.history-item-detail {
	padding: 12px 0 14px 0;
	animation: detail-expand 0.3s ease;
}
.detail-row {
	display: flex; justify-content: space-between; align-items: center;
	padding: 6px 0;
}
.detail-label { font-size: 12px; color: rgba(255,255,255,0.4); }
.detail-value { font-size: 13px; color: rgba(255,255,255,0.8); font-family: 'JetBrains Mono', monospace; }
.detail-reason { color: #f87171; max-width: 60%; text-align: right; }
@keyframes detail-expand {
	from { opacity: 0; max-height: 0; }
	to { opacity: 1; max-height: 200px; }
}
.history-empty { 
	display: flex; flex-direction: column; align-items: center; justify-content: center; 
	height: 200px; position: relative; 
}
.satellite-container {
	position: relative;
	width: 100px;
	height: 100px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 16px;
}
.signal-ring {
	position: absolute;
	border-radius: 50%;
	border: 2px solid rgba(125, 211, 168, 0.2);
	animation: signal-pulse 2s ease-out infinite;
}
.signal-ring-1 {
	width: 70px; height: 70px;
	top: 50%; left: 50%;
	transform: translate(-50%, -50%);
	animation-delay: 0s;
}
.signal-ring-2 {
	width: 90px; height: 90px;
	top: 50%; left: 50%;
	transform: translate(-50%, -50%);
	animation-delay: 0.4s;
	border-color: rgba(125, 211, 168, 0.12);
}
.signal-ring-3 {
	width: 110px; height: 110px;
	top: 50%; left: 50%;
	transform: translate(-50%, -50%);
	animation-delay: 0.8s;
	border-color: rgba(125, 211, 168, 0.06);
}
.history-empty-icon { 
	font-size: 48px; color: #7dd3a8; 
	position: relative; z-index: 2;
	filter: drop-shadow(0 0 10px rgba(125, 211, 168, 0.6));
	animation: satellite-glow 2s ease-in-out infinite alternate;
}
.history-empty-text { font-size: 14px; color: rgba(255, 255, 255, 0.45); }
@keyframes signal-pulse {
	0% { transform: translate(-50%, -50%) scale(0.6); opacity: 1; }
	100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
}
@keyframes satellite-glow {
	0% { filter: drop-shadow(0 0 8px rgba(125, 211, 168, 0.4)); }
	100% { filter: drop-shadow(0 0 16px rgba(125, 211, 168, 0.8)); }
}

/* ——— 设置卡片 ——— */
.settings-card {
	background: rgba(10, 22, 48, 0.5);
}
.settings-scroll-area {
	max-height: 60vh;
	overflow-y: auto;
	overflow-x: hidden;
	-webkit-overflow-scrolling: touch;
}
.settings-field { margin-bottom: 16px; }
.settings-label { 
	font-size: 13px; 
	color: rgba(255, 255, 255, 0.45); 
	margin-bottom: 8px; 
	display: block; 
	font-weight: 500;
	letter-spacing: 0.3px;
}
.settings-input-wrapper {
	background: var(--glass-bg);
	backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
	border: 1px solid var(--color-border-light);
	border-radius: 14px;
	padding: 14px 16px;
	transition: all 0.3s;
	box-shadow: inset 0 1px 0 rgba(80, 140, 220, 0.05);
	flex: 1;
}
.settings-input-wrapper:focus-within {
	border-color: var(--color-primary);
	background: var(--glass-bg-thick);
	box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.settings-input {
	background: transparent;
	border: none;
	outline: none;
	color: rgba(255, 255, 255, 0.92);
	font-size: 16px;
	width: 100%;
	box-sizing: border-box;
	font-family: 'JetBrains Mono', monospace;
}
.settings-input::placeholder { color: rgba(255, 255, 255, 0.25); }
.settings-section-title { 
	font-size: 13px; 
	color: rgba(255, 255, 255, 0.45); 
	margin-bottom: 12px; 
	display: block; 
	font-weight: 500;
	letter-spacing: 0.3px;
}
.settings-dropdown { margin-bottom: 16px; position: relative; }
.dropdown-selected {
	display: flex; align-items: center; justify-content: space-between;
	background: rgba(255, 255, 255, 0.05);
	backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 14px;
	padding: 14px 16px;
	transition: all 0.3s;
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
.dropdown-text { color: rgba(255, 255, 255, 0.85); font-size: 15px; }
.dropdown-arrow { color: rgba(255, 255, 255, 0.4); font-size: 20px; transition: transform 0.3s; }
.dropdown-list {
	position: absolute; top: calc(100% + 8px); left: 0; right: 0;
	background: rgba(12, 25, 50, 0.98);
	backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
	border: 1px solid rgba(60, 100, 160, 0.25);
	border-radius: 14px;
	max-height: 250px; 
	overflow-y: scroll;
	-webkit-overflow-scrolling: touch;
	z-index: 100;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}
/* 预设点管理 */
.section-header-row {
	display: flex; align-items: center; justify-content: space-between;
	margin-bottom: 12px;
}
.btn-add-preset {
	width: 28px; height: 28px; border-radius: 8px;
	background: rgba(255, 255, 255, 0.06);
	border: 1px solid rgba(255, 255, 255, 0.1);
	display: flex; align-items: center; justify-content: center;
	transition: all 0.3s;
}
.btn-add-preset:active { background: rgba(255, 255, 255, 0.12); transform: scale(0.92); }
.btn-add-preset .material-symbols-outlined { font-size: 18px; color: rgba(255, 255, 255, 0.6); }

/* 下拉框预设点样式 */
.dropdown-open { transform: rotate(180deg); }
.dropdown-item {
	display: flex; align-items: center; justify-content: space-between;
	padding: 14px 16px;
	border-bottom: 1px solid rgba(255,255,255,0.05);
	transition: background 0.2s;
}
.dropdown-item:last-child { border-bottom: none; }
.dropdown-item:active { background: rgba(255, 255, 255, 0.08); }
.dropdown-item.dropdown-active { background: rgba(255, 255, 255, 0.06); }
.dropdown-item-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.dropdown-item-name { color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500; }
.dropdown-item-coord { color: rgba(255, 255, 255, 0.4); font-size: 11px; font-family: 'JetBrains Mono', monospace; }
.dropdown-check { font-size: 20px; color: #4ade80; }
.preset-form { padding: 16px 0; }
.preset-modal-actions {
	display: flex; align-items: center; gap: 12px;
	padding-top: 16px;
}
.btn-preset-delete {
	width: 44px; height: 44px; border-radius: 12px;
	background: rgba(239, 68, 68, 0.12);
	border: 1px solid rgba(239, 68, 68, 0.2);
	display: flex; align-items: center; justify-content: center;
	transition: all 0.3s;
}
.btn-preset-delete:active { background: rgba(239, 68, 68, 0.2); transform: scale(0.92); }
.btn-preset-delete .material-symbols-outlined { font-size: 20px; color: #f87171; }
.btn-preset-cancel {
	flex: 1; height: 44px; border-radius: 12px;
	background: rgba(255, 255, 255, 0.06);
	border: 1px solid rgba(255, 255, 255, 0.1);
	display: flex; align-items: center; justify-content: center;
	font-size: 14px; color: rgba(255, 255, 255, 0.7);
	transition: all 0.3s;
}
.btn-preset-cancel:active { background: rgba(255, 255, 255, 0.1); }
.btn-preset-save {
	flex: 2; height: 44px; border-radius: 12px;
	background: linear-gradient(180deg, var(--color-primary-soft) 0%, rgba(0, 60, 120, 0.6) 100%);
	border: 1px solid var(--color-border);
	display: flex; align-items: center; justify-content: center;
	font-size: 14px; font-weight: 600; color: #fff;
	transition: all 0.3s;
}
.btn-preset-save:active { transform: scale(0.98); }

.settings-mode { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 16px; }
.mode-dot { width: 8px; height: 8px; border-radius: 50%; }
.mode-dot.mode-random { background: #7dd3a8; box-shadow: 0 0 8px rgba(125, 211, 168, 0.3); }
.mode-dot.mode-locked { background: #f0c674; box-shadow: 0 0 8px rgba(240, 198, 116, 0.3); }
.mode-text { font-size: 12px; color: rgba(255, 255, 255, 0.45); }
.settings-actions { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.btn-settings-primary {
	width: 100%;
	height: 52px;
	border-radius: 16px;
	font-size: 15px;
	font-weight: 600;
	background: linear-gradient(180deg, var(--color-primary-soft) 0%, rgba(0, 60, 120, 0.6) 100%);
	backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
	border: 1px solid var(--color-border);
	color: #ffffff;
	display: flex; align-items: center; justify-content: center;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: var(--glass-shadow);
	box-sizing: border-box;
}
.btn-settings-primary:active { transform: scale(0.98); }
.btn-settings-secondary {
	width: 100%;
	height: 52px;
	border-radius: 16px;
	font-size: 15px;
	font-weight: 600;
	background: rgba(15, 30, 60, 0.4);
	backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
	border: 1px solid rgba(60, 100, 160, 0.2);
	color: rgba(180, 210, 255, 0.8);
	display: flex; align-items: center; justify-content: center;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-sizing: border-box;
}
.btn-settings-secondary:active { transform: scale(0.98); background: rgba(20, 40, 75, 0.5); }
.settings-divider { height: 1px; background: rgba(255, 255, 255, 0.06); margin: 16px 0; }
.settings-footer { display: flex; gap: 12px; }
.settings-footer-btn {
	flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
	padding: 14px; border-radius: 14px; 
	background: rgba(255, 255, 255, 0.04);
	backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
	border: 1px solid rgba(255, 255, 255, 0.06); 
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.settings-footer-btn:active { background: rgba(255, 255, 255, 0.08); transform: scale(0.98); }
.settings-footer-text { font-size: 12px; color: rgba(255, 255, 255, 0.45); }

/* ——— 底部抽屉通用样式（教程） ——— */
.tut-sheet-backdrop {
	position: fixed; top: 0; right: 0; bottom: 0; left: 0; 
	background: rgba(0, 10, 20, 0.7); 
	backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
	z-index: 999;
	opacity: 0;
	transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
	pointer-events: none;
}
</style>
