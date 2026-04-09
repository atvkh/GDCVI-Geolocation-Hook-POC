<template>
	<view class="tab-wrapper">
		<view class="glass-card card-setting">
			<view class="card-glow-bg glow-setting"></view>
			<view class="card-inner">
				<text class="label-text setting-label">核心坐标配置</text>
				<view class="setting-item">
					<text class="field-label setting-field-label">目标纬度 (Lat)</text>
					<input type="number" v-model="localLat" class="field-input setting-field-input" />
				</view>
				<view class="setting-item">
					<text class="field-label setting-field-label">目标经度 (Lng)</text>
					<input type="number" v-model="localLng" class="field-input setting-field-input" />
				</view>
				
				<view class="setting-action-group">
					<button class="btn-return-school" @click="backToSchool">一键回校 (默认安全区)</button>
					<button class="btn-save-action setting-save" @click="saveSettings">更新位置协议</button>
				</view>

				<view class="matrix-divider"></view>
				<view class="setting-item" style="margin-bottom: 0;">
					<text class="field-label" style="text-align: center; margin-bottom: 12px;">开源与支持</text>
					<view class="github-btn" @click="openGithub">
						<text class="material-symbols-outlined" style="font-size: 20px; color: var(--color-text-main);">code</text>
						<text class="github-text">GitHub: GDCVI-Geolocation-Hook-POC</text>
					</view>
				</view>

			</view>
		</view>
	</view>
</template>

<script>
import { DEFAULT_LAT, DEFAULT_LNG } from '@/utils/constants.js';
export default {
	props: { fakeLat: { type: Number, required: true }, fakeLng: { type: Number, required: true } },
	data() { return { localLat: this.fakeLat, localLng: this.fakeLng } },
	watch: {
		fakeLat(val) { this.localLat = val; },
		fakeLng(val) { this.localLng = val; }
	},
	methods: {
		backToSchool() {
			this.localLat = DEFAULT_LAT; this.localLng = DEFAULT_LNG;
			uni.showToast({ title: '已填充默认坐标', icon: 'none' });
		},
		saveSettings() {
			this.$emit('save', Number(this.localLat), Number(this.localLng));
		},
		// 🚀 响应点击，系统底层打开浏览器跳转仓库
		openGithub() {
			const url = 'https://github.com/atvkh/GDCVI-Geolocation-Hook-POC';
			// #ifdef APP-PLUS
			plus.runtime.openURL(url);
			// #endif
			// #ifndef APP-PLUS
			window.open(url);
			// #endif
		}
	}
}
</script>

<style scoped>
.card-setting { border-top: 3px solid var(--color-info); }
.glow-setting { top: 50%; left: 50%; transform: translate(-50%, -50%); background: radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%); }
.setting-label { color: var(--color-text-main); text-shadow: 0 0 10px rgba(56,189,248,0.8); }

.setting-item { margin-bottom: 20px; }
.field-label { font-size: 12px; margin-bottom: 8px; display: block; color: var(--color-text-muted); }
.setting-field-label { text-shadow: 0 0 10px rgba(56,189,248,0.5); color: var(--color-info); }

.field-input { background: var(--color-surface); padding: 12px 16px; color: var(--color-text-main); width: 100%; font-size: 16px; border-radius: 12px; border: 1px solid var(--color-border); transition: all 0.3s; }
.setting-field-input:focus { border-color: var(--color-info); box-shadow: 0 0 15px rgba(56,189,248,0.3); }

.setting-action-group { display: flex; flex-direction: column; gap: 15px; margin-top: 30px; }

.btn-return-school { background: rgba(56,189,248,0.05); color: var(--color-info); border: 1px solid rgba(56,189,248,0.3); font-weight: 700; border-radius: 12px; height: 50px; display: flex; align-items: center; justify-content: center; font-size: 15px; transition: all 0.3s; width: 100%; }
.btn-return-school:active { background: rgba(56,189,248,0.15); transform: scale(0.96); }

.btn-save-action { font-weight: 800; border-radius: 12px; height: 50px; border: none; transition: all 0.3s; width: 100%; }
.setting-save { background: var(--color-info); color: #050505; box-shadow: 0 5px 15px rgba(56,189,248,0.3); }
.setting-save:active { background: #0ea5e9; transform: scale(0.96); }

/* 🚀 Github 入口专属样式 */
.matrix-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 25px 0; }
.github-btn { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: all 0.2s; }
.github-btn:active { background: rgba(255,255,255,0.08); transform: scale(0.98); border-color: rgba(255,255,255,0.15); }
.github-text { color: var(--color-text-muted); font-size: 12px; font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>