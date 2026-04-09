<template>
	<view class="body-container" @mousemove="trackMouse" @touchmove="trackMouse">
		
		<view class="header-section" v-if="!showWeb">
			<view class="title-wrapper">
				<text class="text-gradient-white">V{{ appVersion }}</text>
				<view class="status-dot" :class="{'is-hooked': hookStatus === 'active'}"></view>
			</view>
			<text class="protocol-text">系统协议已激活</text>
		</view>

		<view class="main-content" v-if="!showWeb">
			<TabHome v-show="tabIndex === 0" ref="tabHome"
				:isGenerating="isGenerating" :loadingText="loadingText"
				:mouseX="mouseX" :mouseY="mouseY" 
				@start-checkin="handleStartCheckIn" @reset-app="handleResetApp" />
				
			<TabHistory v-show="tabIndex === 1" :historyList="historyList" />
			<TabSettings v-show="tabIndex === 2" :fakeLat="fakeLat" :fakeLng="fakeLng" @save="handleSaveSettings" />
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
					<text class="tutorial-title" style="margin-bottom: 0;">发现新协议 V{{ updateInfo.version }}</text>
				</view>
				
				<scroll-view scroll-y="true" class="update-scroll">
					<text class="update-log-text">{{ updateInfo.log }}</text>
				</scroll-view>
				
				<view class="update-actions">
					<button v-if="!updateInfo.forceUpdate" class="btn-cancel-update" @click="showUpdateModal = false">暂不升级</button>
					<button class="btn-confirm-update" @click="goToDownload">获取最新协议</button>
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
			updateInfo: { version: '', log: '', url: '', forceUpdate: false }
		}
	},
	onBackPress() {
		if (this.showWeb) { this.handleResetApp(); return true; }
		if (this.$refs.tabHome && this.$refs.tabHome.displayTutorial) { this.$refs.tabHome.displayTutorial = false; return true; }
		if (this.showUpdateModal && !this.updateInfo.forceUpdate) { this.showUpdateModal = false; return true; }
		return false; 
	},
	created() {
		// #ifdef APP-PLUS
		// 🚀 核心升级：接收后端透传过来的真实消息，记录精确到秒
		window.__handleCheckinResult = (isSuccess, msg) => {
			const now = new Date();
			const hh = now.getHours().toString().padStart(2, '0');
			const mm = now.getMinutes().toString().padStart(2, '0');
			const ss = now.getSeconds().toString().padStart(2, '0');
			const timeStr = `${hh}:${mm}:${ss}`;
			
			this.historyList.unshift({ 
				time: timeStr, 
				lat: this.fakeLat, 
				lng: this.fakeLng, 
				status: isSuccess ? '成功' : '失败',
				reason: msg || (isSuccess ? '' : '未知失败原因') // 记录真实原因
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
								version: remoteData.version || '最新版',
								log: remoteData.log || '修复了已知问题，提升了稳定性。',
								url: remoteData.url || '',
								forceUpdate: remoteData.forceUpdate || false
							};
							this.showUpdateModal = true;
						}
					}
				},
				fail: () => {
					console.log('检查更新失败');
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
			// #ifndef APP-PLUS
			window.open(this.updateInfo.url);
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
			uni.showToast({ title: '坐标协议已更新', icon: 'success' }); this.tabIndex = 0;
		},
		handleResetApp() {
			this.isGenerating = false; this.hookStatus = 'inactive'; this.showWeb = false; 
			this.fakeLat = DEFAULT_LAT; this.fakeLng = DEFAULT_LNG;
			uni.setStorageSync('fakeLat', this.fakeLat); uni.setStorageSync('fakeLng', this.fakeLng);
			uni.showToast({ title: '环境与坐标已重置', icon: 'none' }); 
		},
		handleStartCheckIn(url) {
			this.isGenerating = true;
			this.loadingText = '正在接管地理围栏...';
			setTimeout(() => {
				this.currentUrl = url; this.showWeb = true; 
				this.$nextTick(() => { this.startAggressiveInjection(); });
			}, 500);
		},
		startAggressiveInjection() {
			// #ifdef APP-PLUS
			const coreScript = generateCoreScript(this.fakeLat, this.fakeLng, this.buttonSelector, DEFAULT_LAT, DEFAULT_LNG);
			let injectAttempts = 0;
			const tryInject = () => {
				if (!this.showWeb) return;
				const webviews = this.$scope.$getAppWebview().children();
				if (webviews && webviews.length > 0) webviews[0].evalJS(coreScript);
				if (injectAttempts++ < INJECT_MAX_ATTEMPTS) setTimeout(tryInject, INJECT_INTERVAL_MS);
			};
			this.$nextTick(() => { tryInject(); });

			setTimeout(() => { this.loadingText = '注入高斯随机抖动...'; }, 800);
			setTimeout(() => { this.loadingText = '伪造底层环境特征...'; }, 1600);
			setTimeout(() => { 
				this.loadingText = '协议就绪，持续侦测签到系统...'; 
				this.hookStatus = 'active'; 
			}, 2400);

			// #endif
		}
	}
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

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

.main-content { width: 100%; display: flex; flex-direction: column; align-items: center; }
.tab-wrapper { width: 100%; display: flex; flex-direction: column; align-items: center; animation: fade-in 0.3s ease; }
@keyframes fade-in { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }

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
.update-card { border-top: 3px solid var(--color-info); box-shadow: 0 0 60px rgba(56,189,248,0.15); animation: update-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.update-header { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; margin-bottom: 24px; }
.update-icon { font-size: 48px; color: var(--color-info); text-shadow: 0 0 20px rgba(56,189,248,0.6); }
.update-scroll { max-height: 250px; background: rgba(255,255,255,0.02); border-radius: 12px; padding: 16px; border: 1px solid var(--color-border); margin-bottom: 24px; }
.update-log-text { font-size: 13px; color: var(--color-text-muted); line-height: 1.8; white-space: pre-wrap; font-family: monospace; }
.update-actions { display: flex; gap: 12px; }
.btn-cancel-update { flex: 1; background: rgba(255,255,255,0.05); color: var(--color-text-muted); border: none; border-radius: 14px; font-size: 14px; font-weight: bold; height: 50px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.btn-cancel-update:active { transform: scale(0.95); background: rgba(255,255,255,0.1); }
.btn-confirm-update { flex: 2; background: var(--color-info); color: #000; border: none; border-radius: 14px; font-size: 14px; font-weight: 900; height: 50px; display: flex; align-items: center; justify-content: center; box-shadow: 0 5px 15px rgba(56,189,248,0.3); transition: all 0.2s; }
.btn-confirm-update:active { transform: scale(0.95); box-shadow: 0 2px 8px rgba(56,189,248,0.2); }

@keyframes update-pop { 0% { opacity: 0; transform: scale(0.8) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
.spinning { animation: spin 2s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
</style>