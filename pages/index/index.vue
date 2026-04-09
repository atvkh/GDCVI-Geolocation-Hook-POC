<template>
	<view class="body-container" @mousemove="trackMouse" @touchmove="trackMouse">
		
		<view class="header-section" v-if="!showWeb">
			<view class="title-wrapper">
				<text class="text-gradient-white">V{{ appVersion }}</text>
				<view class="status-dot" :class="{'is-hooked': hookStatus === 'active'}"></view>
			</view>
			<text class="protocol-text">系统环境已加载</text>
		</view>

		<view class="main-content" v-if="!showWeb">
			<transition name="fade-up">
				<view v-show="tabIndex === 0" style="width: 100%;">
					<TabHome ref="tabHome"
						:isGenerating="isGenerating" :loadingText="loadingText"
						:mouseX="mouseX" :mouseY="mouseY" 
						@start-checkin="handleStartCheckIn" @reset-app="handleResetApp" />
				</view>
			</transition>
				
			<transition name="fade-up">
				<view v-show="tabIndex === 1" style="width: 100%;">
					<TabHistory :historyList="historyList" />
				</view>
			</transition>

			<transition name="fade-up">
				<view v-show="tabIndex === 2" style="width: 100%;">
					<TabSettings :fakeLat="fakeLat" :fakeLng="fakeLng" @save="handleSaveSettings" />
				</view>
			</transition>
		</view>

		<view class="bottom-navbar" v-if="!showWeb">
			<view class="nav-indicator" :style="{ transform: `translateX(${tabIndex * 100}%)` }">
				<view class="indicator-circle"><view class="indicator-dot"></view></view>
			</view>
			<view class="nav-btn" :class="{active: tabIndex === 0}" @click="tabIndex = 0">
				<text class="material-symbols-outlined">home</text>
			</view>
			<view class="nav-btn" :class="{active: tabIndex === 1}" @click="tabIndex = 1">
				<text class="material-symbols-outlined">history</text>
			</view>
			<view class="nav-btn" :class="{active: tabIndex === 2}" @click="tabIndex = 2">
				<text class="material-symbols-outlined">settings</text>
			</view>
		</view>

		<view class="tutorial-overlay" v-if="showUpdateModal">
			<view class="tutorial-card update-card" @click.stop="">
				<view class="update-header">
					<text class="material-symbols-outlined update-icon">system_update_alt</text>
					<text class="tutorial-title" style="margin-bottom: 0;">版本更新提示 V{{ updateInfo.version }}</text>
				</view>
				<scroll-view scroll-y="true" class="update-scroll">
					<text class="update-log-text">{{ updateInfo.log }}</text>
				</scroll-view>
				<view class="update-actions">
					<button v-if="!updateInfo.forceUpdate" class="btn-cancel-update" @click="showUpdateModal = false">稍后更新</button>
					<button class="btn-confirm-update" @click="goToDownload">立即下载</button>
				</view>
			</view>
		</view>

		<web-view v-if="showWeb" :src="currentUrl"></web-view>
	</view>
</template>

<script>
import TabHome from '@/components/TabHome.vue';
import TabHistory from '@/components/TabHistory.vue';
import TabSettings from '@/components/TabSettings.vue';
import { generateCoreScript } from '@/utils/injectScript.js';
import { 
	APP_VERSION, APP_VERSION_CODE, UPDATE_JSON_URL,
	DEFAULT_LAT, DEFAULT_LNG, INJECT_MAX_ATTEMPTS, 
	INJECT_INTERVAL_MS, MAX_HISTORY_RECORDS 
} from '@/utils/constants.js';

export default {
	components: { TabHome, TabHistory, TabSettings },
	data() {
		return {
			appVersion: APP_VERSION,
			tabIndex: 0, showWeb: false, currentUrl: '', hookStatus: 'inactive',
			isGenerating: false, loadingText: '', mouseX: 0, mouseY: 0,
			fakeLat: uni.getStorageSync('fakeLat') || DEFAULT_LAT,
			fakeLng: uni.getStorageSync('fakeLng') || DEFAULT_LNG,
			historyList: uni.getStorageSync('historyList') || [],
			buttonSelector: '.adm-button-primary',
			showUpdateModal: false,
			updateInfo: { version: '', log: '', url: '', forceUpdate: false },
			persistentInjectTimer: null
		}
	},
	onBackPress() {
		if (this.showWeb) { this.handleResetApp(); return true; }
		if (this.$refs.tabHome && this.$refs.tabHome.displayTutorial) { this.$refs.tabHome.displayTutorial = false; return true; }
		if (this.$refs.tabHome && this.$refs.tabHome.showMatrix) { this.$refs.tabHome.closeMatrix(); return true; }
		if (this.showUpdateModal && !this.updateInfo.forceUpdate) { this.showUpdateModal = false; return true; }
		return false; 
	},
	created() {
		// #ifdef APP-PLUS
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
			uni.setStorageSync('fakeLat', lat);
			uni.setStorageSync('fakeLng', lng);
		};
		// #endif
		
		this.checkAppUpdate();
	},
	methods: {
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
		handleSaveSettings(lat, lng) {
			this.fakeLat = lat; this.fakeLng = lng;
			uni.setStorageSync('fakeLat', this.fakeLat); uni.setStorageSync('fakeLng', this.fakeLng);
			uni.showToast({ title: '配置已更新', icon: 'success' }); this.tabIndex = 0;
		},
		handleResetApp() {
			this.isGenerating = false; this.hookStatus = 'inactive'; this.showWeb = false; 
			this.fakeLat = DEFAULT_LAT; this.fakeLng = DEFAULT_LNG;
			
			if (this.persistentInjectTimer) {
				clearInterval(this.persistentInjectTimer);
				this.persistentInjectTimer = null;
			}

			uni.setStorageSync('fakeLat', this.fakeLat); uni.setStorageSync('fakeLng', this.fakeLng);
			uni.showToast({ title: '环境与坐标已重置', icon: 'none' }); 
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
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

/* 解决 Material Symbols 字体网络加载导致 FOUT 的布局错乱问题 */
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
	--color-primary: #cc97ff;
	--color-success: #4ade80;
	--color-info: #38bdf8;
	--color-danger: #ff6e84;
	--color-bg-dark: #08080c;
	--color-card-bg: rgba(10, 10, 15, 0.95);
	--color-surface: rgba(255, 255, 255, 0.05);
	--color-text-main: #ffffff;
	--color-text-muted: #a1a1aa;
	--color-border: rgba(255, 255, 255, 0.08);
}

.body-container { 
	height: 100vh; color: var(--color-text-main); display: flex; flex-direction: column; align-items: center; 
	background-color: var(--color-bg-dark);
	background-image: radial-gradient(circle at 50% 0%, #17152b 0%, #050505 85%), linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px);
	background-size: 100% 100%, 25px 25px, 25px 25px; background-position: center;
}

.header-section { margin-top: 10vh; text-align: center; margin-bottom: 50px; display: flex; flex-direction: column; align-items: center; }
.title-wrapper { display: flex; align-items: center; justify-content: center; gap: 12px; }
.text-gradient-white { font-size: 64px; font-weight: 800; background: linear-gradient(180deg, #FFFFFF 0%, #777575 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -4px; line-height: 1; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-danger); box-shadow: 0 0 12px var(--color-danger); transition: all 0.5s; }
.status-dot.is-hooked { background: var(--color-success); box-shadow: 0 0 15px var(--color-success); }
.protocol-text { font-size: 10px; text-transform: uppercase; letter-spacing: 4px; color: #777575; font-weight: bold; margin-top: 4px; display: block; text-align: center; }

.main-content {
	width: 100%; display: flex; flex-direction: column; align-items: center;
	position: relative;
}

.fade-up-enter-active { transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1); }
.fade-up-leave-active { display: none; }
.fade-up-enter-from, .fade-up-enter { opacity: 0; transform: translateY(15px); }

.tab-wrapper { width: 100%; display: flex; flex-direction: column; align-items: center; }

.glass-card { width: 85%; backdrop-filter: blur(28px); border: 1px solid var(--color-border); border-radius: 32px; padding: 32px; position: relative; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05); }
.card-glow-bg { position: absolute; width: 180px; height: 180px; filter: blur(80px); pointer-events: none; border-radius: 50%; }
.card-inner { position: relative; z-index: 10; }
.label-text { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; font-weight: bold; display: block; }

.bottom-navbar { position: fixed; bottom: 30px; width: 85%; height: 72px; background: rgba(15, 15, 15, 0.7); backdrop-filter: blur(40px); border-radius: 100px; border: 1px solid var(--color-border); display: flex; align-items: center; box-shadow: 0 10px 40px rgba(0,0,0,0.5); padding: 0; }
.nav-indicator { position: absolute; top: 0; left: 0; width: 33.333%; height: 100%; display: flex; justify-content: center; transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); z-index: 1; pointer-events: none; }
.indicator-circle { position: absolute; top: -10px; width: 60px; height: 60px; background: #050505; border-radius: 50%; display: flex; justify-content: center; align-items: center; }
.indicator-circle::before, .indicator-circle::after { content: ''; position: absolute; top: 10px; width: 20px; height: 20px; background: transparent; }
.indicator-circle::before { left: -18px; border-top-right-radius: 20px; box-shadow: 5px -5px 0 0 #050505; }
.indicator-circle::after { right: -18px; border-top-left-radius: 20px; box-shadow: -5px -5px 0 0 #050505; }

.nav-btn:nth-child(2).active ~ .nav-indicator .indicator-dot { background: var(--color-primary); box-shadow: 0 0 15px rgba(204, 151, 255, 0.4); }
.nav-btn:nth-child(3).active ~ .nav-indicator .indicator-dot { background: var(--color-success); box-shadow: 0 0 15px rgba(74, 222, 128, 0.4); }
.nav-btn:nth-child(4).active ~ .nav-indicator .indicator-dot { background: var(--color-info); box-shadow: 0 0 15px rgba(56, 189, 248, 0.4); }

.indicator-dot { width: 46px; height: 46px; background: var(--color-primary); border-radius: 50%; transition: background 0.5s, box-shadow 0.5s; box-shadow: 0 0 15px rgba(204, 151, 255, 0.4); }
.nav-btn { flex: 1; display: flex; justify-content: center; align-items: center; height: 100%; color: #52525b; position: relative; z-index: 2; cursor: pointer; transition: transform 0.2s; }
.nav-btn:active { transform: scale(0.85); }
.nav-btn .material-symbols-outlined { font-size: 26px; transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
.nav-btn.active .material-symbols-outlined { color: #050505; transform: translateY(-16px); }

.tutorial-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(25px); z-index: 9999; display: flex; align-items: center; justify-content: center; }
.update-card { border-top: 3px solid var(--color-info); box-shadow: 0 0 60px rgba(56,189,248,0.15); animation: sheet-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); background: var(--color-bg-dark); border-radius: 32px; padding: 32px; width: 85%; }
.update-header { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; margin-bottom: 24px; }
.update-icon { font-size: 48px; color: var(--color-info); text-shadow: 0 0 20px rgba(56,189,248,0.6); }
.tutorial-title { font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 30px; text-align: center; display: block; }
.update-scroll { max-height: 250px; background: rgba(255,255,255,0.02); border-radius: 12px; padding: 16px; border: 1px solid var(--color-border); margin-bottom: 24px; }
.update-log-text { font-size: 13px; color: var(--color-text-muted); line-height: 1.8; white-space: pre-wrap; font-family: monospace; }
.update-actions { display: flex; gap: 12px; }
.btn-cancel-update { flex: 1; background: rgba(255,255,255,0.05); color: var(--color-text-muted); border: none; border-radius: 14px; font-size: 14px; font-weight: bold; height: 50px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.btn-cancel-update:active { transform: scale(0.95); background: rgba(255,255,255,0.1); }
.btn-confirm-update { flex: 2; background: var(--color-info); color: #000; border: none; border-radius: 14px; font-size: 14px; font-weight: 900; height: 50px; display: flex; align-items: center; justify-content: center; box-shadow: 0 5px 15px rgba(56,189,248,0.3); transition: all 0.2s; }
.btn-confirm-update:active { transform: scale(0.95); box-shadow: 0 2px 8px rgba(56,189,248,0.2); }

@keyframes sheet-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.spinning { animation: spin 2s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
</style>