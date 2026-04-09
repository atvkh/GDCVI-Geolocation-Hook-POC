<template>
	<view class="tab-wrapper">
		<view class="glass-card card-home">
			<view class="card-glow-bg glow-home"></view>
			<view class="card-inner">
				<view class="input-section">
					<view class="section-header">
						<text class="label-text home-label">网络反馈</text>
						<view class="matrix-toggle" @click="showMatrix = true">
							<text class="material-symbols-outlined icon-small">view_list</text>
							<text>矩阵库</text>
						</view>
					</view>
					
					<view class="input-wrapper neon-input">
						<view class="dropdown-trigger" @click="toggleDropdown">
							<text class="material-symbols-outlined">expand_more</text>
						</view>
						
						<input class="custom-input" :value="displayInput" @input="onManualInput" placeholder="等待数据注入..." disabled maxlength="-1" />
						<text v-if="selectedName" class="material-symbols-outlined clear-icon" @click="clearSelection">close</text>

						<scroll-view class="dropdown-list" v-if="showDropdown" scroll-y="true">
							<view class="dropdown-item" v-for="(user, index) in userList" :key="index" @click="selectFromDropdown(user)">
								{{ user.name }}
							</view>
							<view class="dropdown-item empty" v-if="userList.length === 0">无预设数据</view>
						</scroll-view>
					</view>
				</view>
				
				<view class="button-group">
					<button class="btn-primary" @click="startCheckIn" :disabled="isGenerating" :class="{'is-generating': isGenerating}">
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
					
					<button class="btn-extract home-extract" @click="readClipboard" :disabled="isGenerating">
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

		<view class="tutorial-overlay matrix-overlay" v-if="showMatrix" @click="closeMatrix">
			<view class="tutorial-card matrix-card" @click.stop="">
				<view class="matrix-header">
					<text class="material-symbols-outlined matrix-icon">groups</text>
					<text class="matrix-title">矩阵库维护</text>
				</view>

				<view class="matrix-section">
					<text class="matrix-section-title">参数更新与删除</text>
					
					<view class="input-wrapper neon-input" style="margin-bottom: 10px;" @click="showManageDropdown = !showManageDropdown">
						<input class="custom-input" :value="manageSelectedUser ? manageSelectedUser.name : ''" placeholder="点击选择预设人员..." disabled maxlength="-1" />
						<view class="dropdown-trigger" style="border: none; padding-right: 0;">
							<text class="material-symbols-outlined">arrow_drop_down</text>
						</view>
						
						<view class="dropdown-menu" v-if="showManageDropdown">
							<view class="dropdown-item" v-for="(user, index) in userList" :key="index" @click.stop="selectManageUser(user, index)">
								{{ user.name }}
							</view>
							<view class="dropdown-item empty" v-if="userList.length === 0">暂无数据</view>
						</view>
					</view>

					<view v-if="manageSelectedUser" class="manage-action-area">
						<input class="custom-input matrix-input" v-model="manageNewUrl" placeholder="在此粘贴该人员的最新链接" maxlength="-1" />
						<view class="action-row">
							<button class="btn-matrix-update" @click="updateSelectedUser">更新链接</button>
							<button class="btn-matrix-delete" @click="deleteSelectedUser"><text class="material-symbols-outlined">delete</text></button>
						</view>
					</view>
				</view>

				<view class="matrix-divider"></view>

				<view class="matrix-section">
					<text class="matrix-section-title">新增人员录入</text>
					<input class="custom-input matrix-input" v-model="newUserName" placeholder="人员名称 (如: 张三)" style="margin-bottom: 10px;" />
					<input class="custom-input matrix-input" v-model="newUserUrl" placeholder="粘贴对应链接" style="margin-bottom: 10px;" maxlength="-1" />
					<button class="btn-primary" style="height: 44px; border-radius: 8px; margin: 0; font-size: 14px;" @click="saveNewUser">提交录入</button>
				</view>
			</view>
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
	data() { 
		return { 
			targetUrl: '', 
			selectedName: '',
			displayTutorial: false,
			
			showMatrix: false,
			showDropdown: false,
			userList: uni.getStorageSync('cyberUserMatrix') || [],
			newUserName: '',
			newUserUrl: '',
			
			showManageDropdown: false,
			manageSelectedUser: null,
			manageSelectedIndex: -1,
			manageNewUrl: ''
		} 
	},
	computed: {
		displayInput() {
			return this.selectedName ? `[成员] ${this.selectedName}` : this.targetUrl;
		}
	},
	methods: {
		closeMatrix() {
			this.showMatrix = false;
			this.showManageDropdown = false;
		},
		selectManageUser(user, index) {
			this.manageSelectedUser = user;
			this.manageSelectedIndex = index;
			this.manageNewUrl = ''; 
			this.showManageDropdown = false;
		},
		updateSelectedUser() {
			const url = this.manageNewUrl.trim();
			if (!url) return uni.showToast({ title: '新链接不能为空', icon: 'none' });
			
			const isValid = /^https?:\/\//i.test(url) && /[?&]appKey=/.test(url) && /[?&]code=/.test(url);
			if (!isValid) return uni.showToast({ title: '无效链接：缺失核心参数', icon: 'none' });

			this.userList[this.manageSelectedIndex].url = url;
			uni.setStorageSync('cyberUserMatrix', this.userList);
			uni.showToast({ title: '参数更新成功', icon: 'success' });
			this.manageNewUrl = '';
			
			if (this.selectedName === this.manageSelectedUser.name) {
				this.targetUrl = this.userList[this.manageSelectedIndex].url;
			}
		},
		deleteSelectedUser() {
			const name = this.manageSelectedUser.name;
			this.userList.splice(this.manageSelectedIndex, 1);
			uni.setStorageSync('cyberUserMatrix', this.userList);
			this.manageSelectedUser = null;
			this.manageSelectedIndex = -1;
			uni.showToast({ title: '已移除', icon: 'none' });
			
			if (this.selectedName === name) {
				this.clearSelection();
			}
		},
		saveNewUser() {
			const name = this.newUserName.trim();
			const url = this.newUserUrl.trim();
			if(!name || !url) return uni.showToast({ title: '信息不完整', icon: 'none' });
			
			const isValid = /^https?:\/\//i.test(url) && /[?&]appKey=/.test(url) && /[?&]code=/.test(url);
			if (!isValid) return uni.showToast({ title: '无效链接：缺失核心参数', icon: 'none' });

			const existIndex = this.userList.findIndex(u => u.name === name);
			if (existIndex !== -1) {
				return uni.showToast({ title: '该名称已存在，请在上方更新', icon: 'none' });
			}
			
			this.userList.unshift({ name, url });
			uni.setStorageSync('cyberUserMatrix', this.userList);
			this.newUserName = ''; 
			this.newUserUrl = '';
			uni.showToast({ title: '录入成功', icon: 'success' });
		},
		toggleDropdown() {
			this.showDropdown = !this.showDropdown;
		},
		selectFromDropdown(user) {
			this.selectedName = user.name;
			this.targetUrl = user.url;
			this.showDropdown = false;
			this.showMatrix = false;
			uni.showToast({ title: `已锁定目标: ${user.name}`, icon: 'none' });
		},
		clearSelection() {
			this.selectedName = '';
			this.targetUrl = '';
		},
		onManualInput(e) {},
		readClipboard() {
			uni.getClipboardData({ 
				success: (res) => { 
					if(res.data) {
						this.clearSelection();
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
			if (!isValid) return uni.showToast({ title: '无效链接：缺失参数', icon: 'none', duration: 3000 });
			this.$emit('start-checkin', url);
		},
		resetApp() { this.$emit('reset-app'); }
	}
}
</script>

<style scoped>
.btn-primary[disabled], .btn-primary:disabled { opacity: 0.6; pointer-events: none; }
.btn-extract[disabled], .btn-extract:disabled { opacity: 0.4; pointer-events: none; background: transparent; border-color: rgba(255,255,255,0.1); color: var(--color-text-muted); }

@keyframes dropdown-open {
	from { opacity: 0; transform: scaleY(0.9); transform-origin: top; }
	to { opacity: 1; transform: scaleY(1); transform-origin: top; }
}
@keyframes sheet-up {
	from { transform: translateY(20px); opacity: 0; }
	to { transform: translateY(0); opacity: 1; }
}

.card-home { border-top: 3px solid var(--color-primary); }
.glow-home { top: -60px; left: -60px; background: radial-gradient(circle, rgba(204,151,255,0.2) 0%, transparent 70%); }
.home-label { color: var(--color-text-main); text-shadow: 0 0 10px rgba(204,151,255,0.8); }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.matrix-toggle { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--color-info); padding: 4px 8px; border-radius: 8px; background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.3); transition: all 0.2s; }
.matrix-toggle:active { opacity: 0.7; transform: scale(0.95); }
.icon-small { font-size: 14px; }

.neon-input { position: relative; margin-bottom: 32px; background: var(--color-surface); border-radius: 12px; padding: 4px 16px; box-shadow: inset 0 0 0 1px var(--color-border); transition: all 0.3s; display: flex; align-items: center; z-index: 20; }
.neon-input:focus-within { box-shadow: 0 0 20px rgba(204,151,255,0.2), inset 0 0 0 1px var(--color-primary); }
.custom-input { flex: 1; height: 48px; font-size: 14px; color: var(--color-text-main); background: transparent; border: none; outline: none; }
.clear-icon { font-size: 18px; color: var(--color-text-muted); padding: 4px; margin-left: 8px; }

.dropdown-trigger { display: flex; align-items: center; justify-content: center; padding-right: 8px; border-right: 1px solid var(--color-border); margin-right: 8px; color: var(--color-text-muted); transition: color 0.2s; }
.dropdown-trigger:active { color: var(--color-primary); }
.dropdown-list { position: absolute; top: calc(100% + 4px); left: 0; width: 100%; max-height: 160px; background: #1a1a24; border: 1px solid var(--color-border); border-radius: 12px; z-index: 100; box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow-y: auto; animation: dropdown-open 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: top; }
.dropdown-item { padding: 14px 16px; font-size: 14px; color: var(--color-text-main); border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s; cursor: pointer; }
.dropdown-item:last-child { border-bottom: none; }
.dropdown-item:active { background: rgba(255,255,255,0.1); }
.dropdown-item.empty { color: var(--color-text-muted); text-align: center; cursor: default; }

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
.tutorial-card { width: 85%; background: var(--color-bg-dark); border: 1px solid var(--color-border); border-radius: 32px; padding: 32px; box-shadow: 0 0 60px rgba(204,151,255,0.15); animation: sheet-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
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

.matrix-card { border-top: 3px solid var(--color-info); animation: sheet-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.matrix-header { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px; }
.matrix-icon { color: var(--color-info); font-size: 28px; }
.matrix-title { font-size: 18px; font-weight: 900; color: #fff; margin: 0; }
.matrix-section { background: rgba(255,255,255,0.02); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
.matrix-section-title { font-size: 12px; color: var(--color-text-muted); margin-bottom: 12px; display: block; font-weight: bold; }
.matrix-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 20px 0; }
.matrix-input { background: rgba(0,0,0,0.4); border: 1px solid var(--color-border); border-radius: 8px; padding: 0 12px; height: 40px; color: #fff; width: 100%; box-sizing: border-box; }
.manage-action-area { display: flex; flex-direction: column; gap: 10px; }
.action-row { display: flex; gap: 8px; }
.btn-matrix-update { flex: 1; background: var(--color-info); color: #000; font-weight: bold; font-size: 14px; border-radius: 8px; height: 40px; display: flex; align-items: center; justify-content: center; border: none; }
.btn-matrix-update:active { transform: scale(0.96); }
.btn-matrix-delete { width: 50px; background: rgba(255,110,132,0.1); color: var(--color-danger); border: 1px solid rgba(255,110,132,0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; height: 40px; }
.btn-matrix-delete:active { background: var(--color-danger); color: #fff; }

.dropdown-menu { position: absolute; top: calc(100% + 4px); left: 0; width: 100%; background: var(--color-bg-dark); border: 1px solid var(--color-border); border-radius: 12px; max-height: 160px; overflow-y: auto; z-index: 100; box-shadow: 0 10px 30px rgba(0,0,0,0.5); animation: dropdown-open 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: top; }
</style>