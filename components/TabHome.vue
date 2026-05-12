<template>
	<view class="tab-wrapper">
		<view class="glass-card card-home">
			<view class="card-glow-bg glow-home"></view>
			<view class="card-inner">

				<view class="input-section">
					<view class="section-header">
						<text class="section-label">网络反馈</text>
						<view class="matrix-toggle" @click="showMatrix = true">
							<text class="material-symbols-outlined icon-small">view_list</text>
							<text>矩阵库</text>
						</view>
					</view>
					
					<view class="input-wrapper neon-input">
						<view class="dropdown-trigger" @click="toggleDropdown">
							<text class="material-symbols-outlined">expand_more</text>
						</view>
						
						<input class="custom-input" :value="displayInput" @input="onManualInput" placeholder="等待数据注入..." maxlength="-1" />
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
					<button class="btn-cyber" @click="startCheckIn" :class="{'is-generating': isGenerating}">
						<span class="btn-cyber-text" v-if="!isGenerating">极速打卡 -></span>
						<span class="btn-cyber-loading" v-else>
							<text class="material-symbols-outlined spinning">radar</text>
							<text class="loading-text">{{ loadingText }}</text>
						</span>
					</button>
					
					<view class="btn-extract" @click="readClipboard">
						<text>提取链接</text>
						<text class="material-symbols-outlined">north_east</text>
					</view>

					<view class="tut-banner" @click="$emit('open-tutorial')">
						<view class="tut-banner-icon">
							<text class="material-symbols-outlined">tips_and_updates</text>
						</view>
						<view class="tut-banner-text">
							<text class="tut-title-sm">提取纯净链接教程</text>
							<text class="tut-sub-sm">跳查寝打卡必看流程</text>
						</view>
						<text class="material-symbols-outlined tut-arrow">chevron_right</text>
					</view>
				</view>

			</view>
		</view>

		<!-- 矩阵库抽屉 - 移到最外层 -->
	</view>
	
	<view class="matrix-drawer-overlay" v-if="showMatrix" @tap="closeMatrix">
		<view class="matrix-drawer" @tap.stop @touchstart="onDrawerTouchStart" @touchend="onDrawerTouchEnd">
			<view class="matrix-drawer-header">
				<view class="matrix-drawer-title">
					<text class="material-symbols-outlined">groups</text>
					<text>矩阵库维护</text>
				</view>
				<view class="matrix-drawer-close" @click="closeMatrix">
					<text class="material-symbols-outlined">close</text>
				</view>
			</view>
			<view class="matrix-drawer-line"></view>

			<scroll-view class="matrix-drawer-body" scroll-y>
				<view class="matrix-drawer-section">
					<text class="matrix-drawer-label">参数更新与删除</text>
					<view class="matrix-select" @click="showManageDropdown = !showManageDropdown">
						<text class="matrix-select-text">{{ manageSelectedUser ? manageSelectedUser.name : '点击选择预设人员...' }}</text>
						<text class="material-symbols-outlined">arrow_drop_down</text>
						<view class="matrix-dropdown" v-if="showManageDropdown">
							<view class="matrix-dropdown-item" v-for="(user, index) in userList" :key="index" @click.stop="selectManageUser(user, index)">
								{{ user.name }}
							</view>
							<view class="matrix-dropdown-empty" v-if="userList.length === 0">暂无数据</view>
						</view>
					</view>
				</view>

				<view class="matrix-drawer-section">
					<text class="matrix-drawer-label">新增人员录入</text>
					<input class="matrix-input" v-model="newUserName" placeholder="人员名称 (如: 张三)" />
					<input class="matrix-input" v-model="newUserUrl" placeholder="粘贴对应链接" maxlength="-1" />
					<view class="matrix-btn-submit" @click="saveNewUser"><text>提交录入</text></view>
				</view>
			</scroll-view>
			
			<!-- 管理区域 - 固定在底部 -->
			<view v-if="manageSelectedUser" class="matrix-manage-area">
				<view class="matrix-manage-header">
					<text class="matrix-manage-title">管理: {{ manageSelectedUser.name }}</text>
					<view class="matrix-manage-close" @click="manageSelectedUser = null">
						<text class="material-symbols-outlined">close</text>
					</view>
				</view>
				<input class="matrix-input" v-model="manageNewUrl" placeholder="在此粘贴该人员的最新链接" maxlength="-1" />
				<view class="matrix-manage-btns">
					<view class="matrix-btn-update" @click="updateSelectedUser"><text>更新链接</text></view>
					<view class="matrix-btn-delete" @click="deleteSelectedUser"><text class="material-symbols-outlined">delete</text></view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { secureGet, secureSet } from '@/utils/crypto.js';

export default {
	emits: ['start-checkin', 'open-tutorial'],
	props: {
		isGenerating: { type: Boolean, default: false },
		loadingText: { type: String, default: '正在接管定位...' },
		mouseX: { type: Number, default: 0 },
		mouseY: { type: Number, default: 0 },
		linkPattern: { type: String, default: '' }
	},
	data() { 
		return { 
			targetUrl: '', 
			selectedName: '',
			showMatrix: false,
			showDropdown: false,
			userList: secureGet('cyberUserMatrix') || [],
			newUserName: '',
			newUserUrl: '',
			showManageDropdown: false,
			manageSelectedUser: null,
			manageSelectedIndex: -1,
			manageNewUrl: '',
			drawerTouchStartY: 0
		} 
	},
	computed: {
		displayInput() {
			return this.selectedName ? `[成员] ${this.selectedName}` : this.targetUrl;
		}
	},
	methods: {
		validateUrl(url) {
			// 基础校验：必须是 http/https 链接
			if (!/^https?:\/\//i.test(url)) {
				return { valid: false, msg: '请输入有效的 http/https 链接' };
			}
			
			// 特征校验：如果有配置，检查链接是否包含特征关键词
			if (this.linkPattern) {
				const keywords = this.linkPattern.split(',').map(k => k.trim()).filter(k => k);
				if (keywords.length > 0) {
					const missing = keywords.filter(kw => !url.includes(kw));
					if (missing.length > 0) {
						return { valid: false, msg: `链接缺少必要参数` };
					}
				}
			}
			
			return { valid: true, msg: '' };
		},
		closeMatrix() {
			this.showMatrix = false;
			this.showManageDropdown = false;
		},
		onDrawerTouchStart(e) {
			this.drawerTouchStartY = e.touches[0].clientY;
		},
		onDrawerTouchEnd(e) {
			const endY = e.changedTouches[0].clientY;
			const diffY = endY - this.drawerTouchStartY;
			if (diffY > 80) {
				this.closeMatrix();
			}
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
			
			const result = this.validateUrl(url);
			if (!result.valid) return uni.showToast({ title: result.msg, icon: 'none' });

			this.userList[this.manageSelectedIndex].url = url;
			secureSet('cyberUserMatrix', this.userList);
			uni.showToast({ title: '参数更新成功', icon: 'none' });
			this.manageNewUrl = '';
			
			if (this.selectedName === this.manageSelectedUser.name) {
				this.targetUrl = this.userList[this.manageSelectedIndex].url;
			}
		},
		deleteSelectedUser() {
			const name = this.manageSelectedUser.name;
			this.userList.splice(this.manageSelectedIndex, 1);
			secureSet('cyberUserMatrix', this.userList);
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
			
			const result = this.validateUrl(url);
			if (!result.valid) return uni.showToast({ title: result.msg, icon: 'none' });

			const existIndex = this.userList.findIndex(u => u.name === name);
			if (existIndex !== -1) {
				return uni.showToast({ title: '该名称已存在，请在上方更新', icon: 'none' });
			}
			
			this.userList.unshift({ name, url });
			secureSet('cyberUserMatrix', this.userList);
			this.newUserName = ''; 
			this.newUserUrl = '';
			uni.showToast({ title: '录入成功', icon: 'none' });
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
		onManualInput(e) {
			this.targetUrl = e.detail.value;
			this.selectedName = '';
		},
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
			const result = this.validateUrl(url);
			if (!result.valid) return uni.showToast({ title: result.msg, icon: 'none', duration: 3000 });
			this.$emit('start-checkin', url);
		}
	}
}
</script>

<style scoped>
.tab-wrapper {
	width: 100%;
	padding: 0;
	margin: 0;
	box-sizing: border-box;
}
.btn-primary[disabled], .btn-primary:disabled { opacity: 0.6; pointer-events: none; }
.btn-primary.is-generating { opacity: 0.8; pointer-events: none; }
.btn-extract.is-generating { opacity: 0.4; pointer-events: none; }

@keyframes dropdown-open {
	from { opacity: 0; transform: scaleY(0.9); transform-origin: top; }
	to { opacity: 1; transform: scaleY(1); transform-origin: top; }
}
@keyframes sheet-up {
	from { transform: translateY(20px); opacity: 0; }
	to { transform: translateY(0); opacity: 1; }
}


.card-home { 
	border-top: 3px solid var(--color-primary); 
}
.glow-home { top: -60px; left: -60px; background: radial-gradient(circle, rgba(0,95,156,0.25) 0%, transparent 70%); }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; color: var(--color-text-main); }
.matrix-toggle { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--color-info); padding: 4px 8px; border-radius: 8px; background: rgba(0,95,156,0.1); border: 1px solid rgba(0,95,156,0.3); transition: all 0.2s; }
.matrix-toggle:active { opacity: 0.7; transform: scale(0.95); }
.icon-small { font-size: 14px; }

.neon-input { position: relative; margin-bottom: 32px; background: rgba(0,20,35,0.4); border-radius: 12px; padding: 4px 16px; box-shadow: inset 0 1px 1px rgba(255,255,255,0.08), 0 0 0 1px rgba(0,95,156,0.2); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); transition: all 0.3s; display: flex; align-items: center; z-index: 20; }
.neon-input:focus-within { box-shadow: 0 0 20px rgba(0,95,156,0.25), inset 0 0 0 1px var(--color-primary); }
.custom-input { flex: 1; height: 48px; font-size: 14px; color: var(--color-text-main); background: transparent; border: none; outline: none; }
.clear-icon { font-size: 18px; color: var(--color-text-muted); padding: 4px; margin-left: 8px; }

.dropdown-trigger { display: flex; align-items: center; justify-content: center; padding-right: 8px; border-right: 1px solid rgba(255,255,255,0.08); margin-right: 8px; color: var(--color-text-muted); transition: color 0.2s; }
.dropdown-trigger:active { color: var(--color-primary); }
.dropdown-list { position: absolute; top: calc(100% + 4px); left: 0; width: 100%; max-height: 160px; background: rgba(0,20,35,0.9); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(0,95,156,0.3); border-radius: 12px; z-index: 100; box-shadow: inset 0 1px 1px rgba(255,255,255,0.08), 0 12px 40px rgba(0,0,0,0.6); overflow-y: auto; animation: dropdown-open 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: top; }
.dropdown-item { padding: 14px 16px; font-size: 14px; color: var(--color-text-main); border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s; cursor: pointer; }
.dropdown-item:last-child { border-bottom: none; }
.dropdown-item:active { background: rgba(0,95,156,0.15); }
.dropdown-item.empty { color: var(--color-text-muted); text-align: center; cursor: default; }

.btn-primary-sm { 
	height: 44px; border-radius: 12px; margin: 0; font-size: 14px; font-weight: 600;
	box-shadow: none; backdrop-filter: none; -webkit-backdrop-filter: none; 
	background: var(--color-primary); color: #fff;
	display: flex; align-items: center; justify-content: center;
}

.loading-text { font-size: 14px; letter-spacing: 1px; white-space: nowrap; animation: text-fade 0.5s ease; }

/* 极速打卡按钮 - 厚实果冻玻璃 */
.btn-cyber {
  position: relative; width: 100%; padding: 18px 0; border-radius: 18px;
  background: linear-gradient(180deg, var(--color-primary-soft) 0%, rgba(0, 60, 120, 0.6) 100%);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--color-border);
  box-shadow: var(--glass-shadow);
  cursor: pointer; margin-bottom: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-cyber::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 50%;
  background: linear-gradient(180deg, rgba(100, 170, 255, 0.1) 0%, transparent 100%);
  border-radius: 20px 20px 0 0; pointer-events: none;
}
.btn-cyber-text {
  position: relative; z-index: 2; font-weight: 600; font-size: 17px;
  color: #ffffff;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
.btn-cyber-loading {
  position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; gap: 8px;
  color: rgba(255, 255, 255, 0.8);
}
.btn-cyber:active { 
  transform: scale(0.98); 
  box-shadow: 
    0 1px 4px rgba(0, 0, 0, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.btn-cyber.is-generating { opacity: 0.7; pointer-events: none; }

/* 提取链接按钮 - 轻薄玻璃 */
.btn-extract {
  background: rgba(15, 30, 60, 0.5);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(60, 100, 160, 0.25);
  border-radius: 18px; height: 56px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  color: rgba(180, 210, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(80, 140, 220, 0.1);
  margin-bottom: 16px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-extract:active { 
  transform: scale(0.98); 
  background: rgba(20, 40, 75, 0.6);
}

.tut-banner { 
	background: rgba(15, 30, 60, 0.4);
	backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
	border: 1px solid rgba(60, 100, 160, 0.2);
	border-radius: 18px; padding: 18px;
	display: flex; align-items: center; gap: 14px; cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.tut-banner:active { transform: scale(0.98); }
.tut-banner-icon { 
	width: 40px; height: 40px; border-radius: 12px; 
	background: rgba(0, 80, 150, 0.3); 
	color: rgba(120, 180, 255, 0.9); 
	display: flex; align-items: center; justify-content: center; 
}
.tut-banner-text { flex: 1; display: flex; flex-direction: column; }
.tut-title-sm { font-size: 15px; font-weight: 600; color: rgba(255, 255, 255, 0.9); }
.tut-sub-sm { font-size: 12px; color: rgba(255, 255, 255, 0.45); margin-top: 4px; }
.tut-arrow { color: rgba(255, 255, 255, 0.3); font-size: 20px; }

.matrix-drawer-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	z-index: 9999;
}

.matrix-drawer {
	position: fixed;
	bottom: 0;
	left: 0;
	width: 100%;
	max-height: 75vh;
	background: #1a2540;
	border-radius: 24px 24px 0 0;
	padding: 16px 20px 34px;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	z-index: 10000;
}

.matrix-drawer-header {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
	padding: 0 4px;
}

.matrix-drawer-line {
	width: 36px;
	height: 4px;
	background: rgba(255, 255, 255, 0.2);
	border-radius: 2px;
	margin: 0 auto 16px;
	flex-shrink: 0;
}

.matrix-drawer-body {
	flex: 1;
	overflow-y: auto;
	overflow-x: hidden;
	-webkit-overflow-scrolling: touch;
	min-height: 0;
	max-height: calc(75vh - 100px);
}

.matrix-drawer-title {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 17px;
	font-weight: 700;
	color: #fff;
}
.matrix-drawer-title {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 17px;
	font-weight: 700;
	color: #fff;
}
.matrix-drawer-title text:first-child {
	color: var(--color-info);
	font-size: 22px;
}
.matrix-drawer-close {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
}
.matrix-drawer-close text {
	font-size: 18px;
	color: rgba(255, 255, 255, 0.6);
}
.matrix-drawer-close:active {
	background: rgba(255, 255, 255, 0.2);
}

.matrix-drawer-section {
	background: rgba(255, 255, 255, 0.04);
	border: 1px solid rgba(255, 255, 255, 0.06);
	border-radius: 14px;
	padding: 16px;
	margin-bottom: 14px;
	flex-shrink: 0;
}
.matrix-drawer-section:last-child {
	margin-bottom: 0;
}

.matrix-drawer-label {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.4);
	font-weight: 600;
	margin-bottom: 12px;
	display: block;
}

.matrix-select {
	background: rgba(0, 0, 0, 0.3);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 10px;
	padding: 0 14px;
	height: 44px;
	display: flex;
	align-items: center;
	position: relative;
}
.matrix-select-text {
	flex: 1;
	font-size: 14px;
	color: rgba(255, 255, 255, 0.6);
}
.matrix-select text:last-child {
	color: rgba(255, 255, 255, 0.4);
}

.matrix-dropdown {
	position: absolute;
	top: calc(100% + 8px);
	left: 0;
	width: 100%;
	background: rgba(10, 18, 35, 0.95);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 12px;
	max-height: 180px;
	overflow-y: auto;
	z-index: 100;
	box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}
.matrix-dropdown-item {
	padding: 14px 16px;
	font-size: 14px;
	color: rgba(255, 255, 255, 0.85);
	border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.matrix-dropdown-item:last-child {
	border-bottom: none;
}
.matrix-dropdown-item:active {
	background: rgba(0, 95, 156, 0.2);
}
.matrix-dropdown-empty {
	padding: 16px;
	text-align: center;
	font-size: 13px;
	color: rgba(255, 255, 255, 0.3);
}

.matrix-manage-area {
	flex-shrink: 0;
	background: rgba(255, 255, 255, 0.04);
	border: 1px solid rgba(255, 255, 255, 0.06);
	border-radius: 14px;
	padding: 16px;
	margin-top: 16px;
}

.matrix-manage-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
}

.matrix-manage-title {
	font-size: 14px;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.8);
}

.matrix-manage-close {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
}

.matrix-manage-close text {
	font-size: 16px;
	color: rgba(255, 255, 255, 0.6);
}

.matrix-input {
	width: 100%;
	height: 44px;
	background: rgba(0, 0, 0, 0.3);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 10px;
	padding: 0 14px;
	font-size: 14px;
	color: #fff;
	box-sizing: border-box;
	margin-bottom: 10px;
}
.matrix-input:last-of-type {
	margin-bottom: 0;
}

.matrix-manage-btns {
	display: flex;
	gap: 10px;
}
.matrix-btn-update {
	flex: 1;
	height: 44px;
	background: var(--color-info);
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	font-weight: 600;
	color: #000;
}
.matrix-btn-update:active {
	transform: scale(0.96);
}
.matrix-btn-delete {
	width: 44px;
	height: 44px;
	background: rgba(220, 38, 38, 0.15);
	border: 1px solid rgba(220, 38, 38, 0.3);
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #f87171;
}
.matrix-btn-delete:active {
	background: #dc2626;
	color: #fff;
}

.matrix-btn-submit {
	width: 100%;
	height: 46px;
	background: var(--color-info);
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 15px;
	font-weight: 600;
	color: #fff;
	margin-top: 4px;
}
.matrix-btn-submit:active {
	transform: scale(0.97);
	opacity: 0.9;
}

.spinning { animation: spin 2s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
@keyframes pulse-dot { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
</style>
