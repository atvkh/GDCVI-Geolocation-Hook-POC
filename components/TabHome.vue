<template>
	<view class="tab-wrapper page-transition" :class="{ 'page-active': isActive }" v-show="isActive">
		<view class="bottom-glow"></view>

		<view class="glass-card card-home">
			<view class="field-label-row">
				<text class="field-label">目标成员</text>
				<text class="field-hint" v-if="!selectedName && !targetUrl">粘贴签到链接，或从矩阵库选择</text>
			</view>

			<view class="link-input" :class="{ 'is-focused': inputFocused }">
				<input
					class="link-input-field"
					:value="displayInput"
					@input="onManualInput"
					@focus="inputFocused = true"
					@blur="inputFocused = false"
					placeholder="粘贴签到链接..."
					maxlength="-1"
				/>
				<text v-if="selectedName" class="material-symbols-outlined input-action" @click="clearSelection">close</text>
				<view class="input-divider"></view>
				<text class="material-symbols-outlined input-action trigger" :class="{ 'trigger-open': showDropdown }" @click="toggleDropdown">expand_more</text>

				<scroll-view class="dropdown-list" v-if="showDropdown" scroll-y="true">
					<view class="dropdown-item" v-for="(user, index) in userList" :key="index" @click="selectFromDropdown(user)">
						<text class="dropdown-item-name">{{ user.name }}</text>
						<text class="material-symbols-outlined dropdown-item-check" v-if="selectedName === user.name">check_circle</text>
					</view>
					<view class="dropdown-item empty" v-if="userList.length === 0">矩阵库为空，可在下方录入成员</view>
				</scroll-view>
			</view>

			<view class="coord-status" v-if="coordStatus">
				<view class="coord-dot"></view>
				<text class="coord-text">{{ coordStatus }}</text>
			</view>

			<button class="cta-btn" :class="{ 'is-busy': isGenerating }" @click="startCheckIn">
				<view class="cta-loading" v-if="isGenerating">
					<text class="material-symbols-outlined spinning">radar</text>
					<text class="cta-loading-text">{{ loadingText }}</text>
				</view>
				<view class="cta-idle" v-else>
					<text class="cta-text">极速打卡</text>
					<text class="material-symbols-outlined cta-arrow">arrow_forward</text>
				</view>
			</button>

			<view class="quiet-actions">
				<view class="quiet-action" @click="readClipboard">
					<text class="material-symbols-outlined">content_paste</text>
					<text>提取链接</text>
				</view>
				<view class="quiet-sep"></view>
				<view class="quiet-action" @click="showMatrix = true">
					<text class="material-symbols-outlined">groups</text>
					<text>矩阵库</text>
				</view>
				<view class="quiet-sep"></view>
				<view class="quiet-action" @click="$emit('open-tutorial')">
					<text class="material-symbols-outlined">tips_and_updates</text>
					<text>使用教程</text>
				</view>
			</view>
		</view>
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
		linkPattern: { type: String, default: '' },
		coordStatus: { type: String, default: '' },
		isActive: { type: Boolean, default: false }
	},
	data() {
		return {
			targetUrl: '',
			selectedName: '',
			inputFocused: false,
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
	padding: 0 0 120px;
	margin: 0;
	box-sizing: border-box;
}

.card-home {
	padding-top: 24px;
	padding-bottom: 28px;
}

/* 目标输入区 */
.field-label-row {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	margin-bottom: 10px;
}
.field-label {
	font-size: 13px;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.55);
	letter-spacing: 0.5px;
}
.field-hint {
	font-size: 11px;
	color: rgba(255, 255, 255, 0.25);
}

.link-input {
	position: relative;
	display: flex;
	align-items: center;
	height: 52px;
	padding: 0 14px;
	border-radius: 14px;
	background: var(--glass-secondary);
	border: 1px solid var(--color-border-light);
	transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.link-input.is-focused {
	border-color: var(--color-primary);
	background: rgba(255, 255, 255, 0.07);
	box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.link-input-field {
	flex: 1;
	min-width: 0;
	height: 100%;
	font-size: 14px;
	color: var(--color-text-main);
	background: transparent;
	border: none;
	outline: none;
}
.input-action {
	font-size: 20px;
	color: rgba(255, 255, 255, 0.4);
	padding-left: 10px;
	flex-shrink: 0;
}
.input-action.trigger {
	transition: transform 0.25s, color 0.25s;
}
.input-action.trigger-open {
	transform: rotate(180deg);
	color: var(--color-primary);
}
.input-divider {
	width: 1px;
	height: 18px;
	background: rgba(255, 255, 255, 0.12);
	margin-left: 10px;
	flex-shrink: 0;
}

.dropdown-list {
	position: absolute;
	top: calc(100% + 6px);
	left: 0;
	width: 100%;
	max-height: 180px;
	background: rgba(12, 24, 44, 0.97);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	border: 1px solid var(--color-border);
	border-radius: 14px;
	z-index: 100;
	box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
	overflow-y: auto;
	animation: dropdown-open 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	transform-origin: top;
}
@keyframes dropdown-open {
	from { opacity: 0; transform: scaleY(0.92); }
	to { opacity: 1; transform: scaleY(1); }
}
.dropdown-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 13px 16px;
	font-size: 14px;
	color: var(--color-text-main);
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	transition: background 0.2s;
}
.dropdown-item:last-child {
	border-bottom: none;
}
.dropdown-item:active {
	background: var(--color-primary-soft);
}
.dropdown-item.empty {
	color: rgba(255, 255, 255, 0.3);
	text-align: center;
	display: block;
	font-size: 12px;
	cursor: default;
}
.dropdown-item-check {
	font-size: 18px;
	color: #4ade80;
}

/* 坐标状态行 */
.coord-status {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 12px;
}
.coord-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--color-success);
	box-shadow: 0 0 8px rgba(125, 211, 168, 0.5);
	flex-shrink: 0;
}
.coord-text {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.42);
	font-family: 'JetBrains Mono', monospace;
	letter-spacing: 0.3px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* 主按钮 */
.cta-btn {
	margin: 20px 0 0;
	width: 100%;
	height: 56px;
	border-radius: 18px;
	border: none;
	background: var(--color-primary);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8px 24px var(--color-primary-soft), inset 0 1px 0 rgba(255, 255, 255, 0.2);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.cta-btn::after {
	border: none;
}
.cta-btn:active {
	transform: scale(0.96) translateY(1px);
	filter: brightness(1.1);
}
.cta-btn.is-busy {
	opacity: 0.75;
	pointer-events: none;
}
.cta-idle {
	display: flex;
	align-items: center;
	gap: 8px;
}
.cta-text {
	font-size: 17px;
	font-weight: 700;
	color: #fff;
	letter-spacing: 1px;
}
.cta-arrow {
	font-size: 20px;
	color: rgba(255, 255, 255, 0.9);
}
.cta-loading {
	display: flex;
	align-items: center;
	gap: 8px;
	color: rgba(255, 255, 255, 0.85);
}
.cta-loading-text {
	font-size: 14px;
	letter-spacing: 1px;
	white-space: nowrap;
}
.spinning {
	animation: spin 2s linear infinite;
}
@keyframes spin {
	100% { transform: rotate(360deg); }
}

/* 次级操作行 */
.quiet-actions {
	margin-top: 14px;
	display: flex;
	align-items: center;
	justify-content: space-around;
}
.quiet-action {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 10px 14px;
	border-radius: 10px;
	font-size: 13px;
	color: rgba(255, 255, 255, 0.55);
	transition: all 0.2s;
}
.quiet-action .material-symbols-outlined {
	font-size: 18px;
	color: var(--color-primary);
	opacity: 0.85;
}
.quiet-action:active {
	background: rgba(255, 255, 255, 0.06);
	transform: scale(0.95);
}
.quiet-sep {
	width: 1px;
	height: 14px;
	background: rgba(255, 255, 255, 0.08);
}

/* 底部氛围光（页面唯一光效） */
.bottom-glow {
	position: fixed;
	bottom: -60px;
	left: 50%;
	transform: translateX(-50%);
	width: 140%;
	height: 200px;
	background: radial-gradient(50% 50% at 50% 100%, var(--color-primary) 0%, transparent 70%);
	filter: blur(60px);
	opacity: 0.35;
	pointer-events: none;
	z-index: 0;
	animation: ambient-pulse 8s ease-in-out infinite alternate;
}
@keyframes ambient-pulse {
	0% { opacity: 0.25; }
	100% { opacity: 0.45; }
}

/* ——— 矩阵库抽屉 ——— */
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
	background: #131f38;
	border-radius: 24px 24px 0 0;
	padding: 16px 20px calc(34px + env(safe-area-inset-bottom));
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
	max-height: calc(75vh - 120px);
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
	color: var(--color-primary);
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
	background: var(--color-primary-soft);
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
	background: var(--color-primary);
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	font-weight: 600;
	color: #fff;
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
	background: var(--color-primary);
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
</style>
