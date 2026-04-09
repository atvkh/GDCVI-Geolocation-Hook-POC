<template>
	<view class="tab-wrapper">
		<view class="glass-card card-home">
			<view class="card-glow-bg glow-home"></view>
			<view class="card-inner">
				<view class="input-section">
					<text class="label-text home-label">网络反馈</text>
					<view class="input-wrapper neon-input">
						<input class="custom-input" v-model="targetUrl" placeholder="等待数据注入..." disabled />
					</view>
				</view>
				
				<view class="button-group">
					<button class="btn-primary" @click="startCheckIn" :class="{'is-generating': isGenerating}">
						<view class="cursor-glow" :style="{left: mouseX + 'px', top: mouseY + 'px'}"></view>
						<view class="btn-content" v-if="!isGenerating">
							<text>极速打卡</text>
							<text class="material-symbols-outlined icon-move">arrow_forward</text>
						</view>
						<view class="btn-content" v-else>
							<text class="material-symbols-outlined spinning">radar</text>
							<text class="loading-text">{{ loadingText }}</text>
						</view>
					</button>
					
					<button class="btn-extract home-extract" @click="readClipboard">
						<text>提取链接</text>
						<text class="material-symbols-outlined">north_east</text>
						<view class="underline-grow"></view>
					</button>

					<view class="home-tut-trigger home-tut" @click="displayTutorial = true">
						<text class="material-symbols-outlined">help_center</text>
						<text>如何利用“断网”获取纯净 URL？</text>
					</view>
				</view>
			</view>
		</view>

		<view class="emergency-container">
			<button class="btn-emergency" @click="resetApp">
				<text class="reset-text">紧急重置环境</text>
				<view class="reset-top-line"></view>
			</button>
		</view>

		<view class="tutorial-overlay" v-if="displayTutorial" @click="displayTutorial = false">
			<view class="tutorial-card" @click.stop="">
				<text class="tutorial-title">纯净 URL 提取指南</text>
				<scroll-view scroll-y="true" class="tutorial-scroll">
					<view class="tut-section highlighting">
						<view class="tut-step-header">
							<text class="tut-step-num">STEP 01</text>
							<text class="tut-step-title">断网拦截 (核心操作)</text>
						</view>
						<text class="tut-step-desc">进入页面后，<text class="highlight-text">迅速下拉手机状态栏，关闭 Wi-Fi 和 数据流量</text>。这一步是为了在没有网络的情况下，截断真实的定位上传并保活当前页面的 code。</text>
					</view>
					<view class="tut-section">
						<view class="tut-step-header">
							<text class="tut-step-num">STEP 02</text>
							<text class="tut-step-title">提取防伪造链接</text>
						</view>
						<text class="tut-step-desc">在断网状态下，点击微信右上角菜单，选择<text class="highlight-text">“复制链接”</text>。复制成功后，务必<text class="highlight-text">恢复手机网络</text>。</text>
					</view>
					<view class="tut-section">
						<view class="tut-step-header">
							<text class="tut-step-num">STEP 03</text>
							<text class="tut-step-title">环境注入与打卡</text>
						</view>
						<text class="tut-step-desc">回到本 App 首页点击“提取链接”，配置好目标坐标后，点击“极速打卡”，系统会弹出确认框，确认后即可完成打卡。</text>
					</view>
				</scroll-view>
				<button class="btn-close-tut" @click="displayTutorial = false">准备开始</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		isGenerating: { type: Boolean, default: false },
		loadingText: { type: String, default: '正在接管定位...' },
		mouseX: { type: Number, default: 0 },
		mouseY: { type: Number, default: 0 }
	},
	data() { return { targetUrl: '', displayTutorial: false } },
	methods: {
		readClipboard() {
			uni.getClipboardData({ 
				success: (res) => { 
					if(res.data) {
						this.targetUrl = res.data.trim();
						uni.showToast({ title: '已捕获 URL', icon: 'none' });
					} else { uni.showToast({ title: '剪贴板为空', icon: 'none' }); }
				},
				fail: () => uni.showToast({ title: '无法读取剪贴板', icon: 'none' })
			});
		},
		startCheckIn() {
			const url = this.targetUrl.trim();
			if(!url) return uni.showToast({ title: '链接为空', icon: 'none' });
			const isValid = /^https?:\/\//i.test(url) && /[?&]appKey=/.test(url) && /[?&]code=/.test(url);
			if (!isValid) return uni.showToast({ title: '无效链接：格式错误或缺失核心参数', icon: 'none', duration: 3000 });
			this.$emit('start-checkin', url);
		},
		resetApp() { this.$emit('reset-app'); }
	}
}
</script>

<style scoped>
.card-home { border-top: 3px solid var(--color-primary); }
.glow-home { top: -60px; left: -60px; background: radial-gradient(circle, rgba(204,151,255,0.2) 0%, transparent 70%); }
.home-label { color: var(--color-text-main); text-shadow: 0 0 10px rgba(204,151,255,0.8); }

.neon-input { position: relative; margin-bottom: 32px; background: var(--color-surface); border-radius: 12px; padding: 4px 16px; box-shadow: inset 0 0 0 1px var(--color-border); transition: all 0.3s; }
.neon-input:focus-within { box-shadow: 0 0 20px rgba(204,151,255,0.2), inset 0 0 0 1px var(--color-primary); }
.custom-input { height: 48px; font-size: 14px; color: var(--color-text-main); width: 100%; }

.btn-primary { background: var(--color-primary); color: #360061; border-radius: 14px; height: 64px; font-weight: 800; border: none; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; margin-bottom: 16px; }
.btn-primary:active { transform: scale(0.96); }
.cursor-glow { position: absolute; width: 120px; height: 120px; background: radial-gradient(circle at center, rgba(255, 255, 255, 0.35) 0%, transparent 70%); transform: translate(-50%, -50%); pointer-events: none; }
.btn-content { display: flex; align-items: center; gap: 10px; font-size: 16px; }
.icon-move { transition: transform 0.3s; }
.btn-primary:active .icon-move { transform: translateX(6px); }
.loading-text { font-size: 14px; letter-spacing: 1px; white-space: nowrap; animation: text-fade 0.5s ease; }

.btn-extract { background: transparent; border-radius: 14px; height: 56px; display: flex; align-items: center; justify-content: center; gap: 8px; position: relative; transition: all 0.3s; color: var(--color-text-main); border: 1px solid rgba(204,151,255,0.3); }
.btn-extract:active { background: rgba(204,151,255,0.1); }
.underline-grow { position: absolute; bottom: 12px; width: 0; height: 1px; background: rgba(204, 151, 255, 0.6); transition: width 0.5s; }
.btn-extract:active .underline-grow { width: 60px; }

.home-tut-trigger { margin-top: 24px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; font-weight: bold; transition: color 0.3s; color: var(--color-text-muted); }
.home-tut-trigger:active { color: var(--color-primary); }

.emergency-container { width: 100%; display: flex; justify-content: center; margin-top: 60px; }
.btn-emergency { width: 240px; background: transparent; border: none; padding: 16px; position: relative; overflow: hidden; display: flex; justify-content: center; }
.reset-text { font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: var(--color-text-muted); font-weight: bold; position: relative; z-index: 5; transition: color 0.3s; }
.btn-emergency:active .reset-text { color: var(--color-danger); }
.reset-top-line { position: absolute; top: 0; left: 0; width: 100%; height: 1px; background: transparent; transform: scaleX(0); transition: all 0.7s; }
.btn-emergency:active .reset-top-line { background: var(--color-primary); box-shadow: 0 0 10px var(--color-primary); transform: scaleX(0.6); }

.tutorial-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(25px); z-index: 9999; display: flex; align-items: center; justify-content: center; }
.tutorial-card { width: 85%; background: var(--color-bg-dark); border: 1px solid var(--color-border); border-radius: 32px; padding: 32px; box-shadow: 0 0 60px rgba(204,151,255,0.15); }
.tutorial-title { font-size: 22px; font-weight: 800; color: var(--color-text-main); margin-bottom: 30px; text-align: center; display: block; }
.tutorial-scroll { height: 45vh; }
.tut-section { margin-bottom: 25px; }
.tut-step-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.tut-step-num { font-size: 12px; font-weight: 900; color: var(--color-primary); background: rgba(204,151,255,0.1); padding: 4px 8px; border-radius: 6px; }
.tut-step-title { font-size: 15px; font-weight: 800; color: #e4e4e7; }
.tut-step-desc { font-size: 13px; color: var(--color-text-muted); line-height: 1.6; display: block; }
.highlighting { background: rgba(204,151,255,0.04); border-radius: 16px; padding: 14px; border-left: 3px solid var(--color-primary); }
.highlight-text { color: var(--color-primary); font-weight: bold; }
.btn-close-tut { background: var(--color-primary); color: #360061; font-weight: 800; height: 52px; border-radius: 16px; margin-top: 20px; }

@keyframes text-fade { 0% { opacity: 0; transform: translateY(5px); } 100% { opacity: 1; transform: translateY(0); } }
</style>