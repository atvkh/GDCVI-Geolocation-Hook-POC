<template>
	<view class="page-card settings-card page-transition" :class="{ 'page-active': isActive }">
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
				<view class="btn-add-preset" @click="$emit('show-add-preset')">
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
						@longpress="$emit('edit-preset', index)">
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
</template>

<script>
export default {
	props: {
		isActive: { type: Boolean, default: false },
		fakeLat: { type: Number, required: true },
		fakeLng: { type: Number, required: true },
		useRandomPreset: { type: Boolean, default: true },
		presetLocations: { type: Array, default: () => [] },
		selectedPresetIndex: { type: Number, default: -1 },
		selectedPresetName: { type: String, default: '' }
	},
	data() {
		return {
			localLat: String(this.fakeLat),
			localLng: String(this.fakeLng),
			showPresetDropdown: false
		}
	},
	watch: {
		fakeLat(val) { this.localLat = String(val); },
		fakeLng(val) { this.localLng = String(val); }
	},
	methods: {
		togglePresetDropdown() {
			this.showPresetDropdown = !this.showPresetDropdown;
		},
		selectPreset(loc, index) {
			this.localLat = String(loc.lat);
			this.localLng = String(loc.lng);
			this.showPresetDropdown = false;
			this.$emit('select-preset', loc, index);
		},
		backToSchool() {
			this.$emit('back-to-school');
		},
		saveCoordSettings() {
			this.$emit('save-coord', Number(this.localLat), Number(this.localLng));
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
		}
	}
}
</script>

<style scoped>
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
	color: var(--color-primary);
}
.page-card-title {
	font-size: 20px;
	font-weight: 700;
	color: #fff;
}
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
	background: rgba(15, 30, 60, 0.6);
	backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
	border: 1px solid rgba(60, 100, 160, 0.2);
	border-radius: 14px;
	padding: 14px 16px;
	transition: all 0.3s;
	box-shadow: inset 0 1px 0 rgba(80, 140, 220, 0.05);
	flex: 1;
}
.settings-input-wrapper:focus-within {
	border-color: var(--color-primary);
	background: rgba(20, 40, 75, 0.7);
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
</style>
