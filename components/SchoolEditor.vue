<template>
	<view class="editor-overlay" v-if="visible" @click="$emit('close')">
		<view class="editor-card" @click.stop>
			<view class="editor-header">
				<view class="editor-title-row">
					<text class="material-symbols-outlined editor-icon">{{ isEdit ? 'edit' : 'add_circle' }}</text>
					<text class="editor-title">{{ isEdit ? '编辑学校' : '添加学校' }}</text>
				</view>
				<view class="editor-close" @click="$emit('close')">
					<text class="material-symbols-outlined">close</text>
				</view>
			</view>
			
			<scroll-view scroll-y="true" class="editor-body">
				<!-- 学校名称 -->
				<view class="editor-section">
					<text class="editor-label">学校名称</text>
					<input 
						class="editor-input" 
						v-model="formData.name" 
						placeholder="请输入学校名称"
						maxlength="30"
					/>
				</view>
				
				<!-- 主题色选择 -->
				<view class="editor-section">
					<text class="editor-label">主题色</text>
					<view class="theme-dropdown" @click="showThemeDropdown = !showThemeDropdown">
						<view class="theme-dropdown-selected">
							<view class="theme-dropdown-dot" :style="{ background: themeColors[formData.themeIndex].primary }"></view>
							<text class="theme-dropdown-text">{{ themeColors[formData.themeIndex].name }}</text>
							<text class="material-symbols-outlined theme-dropdown-arrow" :class="{ 'dropdown-open': showThemeDropdown }">expand_more</text>
						</view>
						<view class="theme-dropdown-list" v-if="showThemeDropdown">
							<view 
								v-for="(theme, index) in themeColors" 
								:key="index"
								class="theme-dropdown-item"
								:class="{ 'theme-dropdown-active': formData.themeIndex === index }"
								@click.stop="selectTheme(index)"
							>
								<view class="theme-dropdown-dot" :style="{ background: theme.primary }"></view>
								<text class="theme-dropdown-item-text">{{ theme.name }}</text>
								<text class="material-symbols-outlined theme-dropdown-check" v-if="formData.themeIndex === index">check_circle</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 链接特征配置 -->
				<view class="editor-section">
					<text class="editor-label">链接特征（可选）</text>
					<input 
						class="editor-input" 
						v-model="formData.linkPattern" 
						placeholder="如：appKey,code（逗号分隔）"
					/>
					<text class="editor-hint-text">用于校验链接格式，留空则不校验</text>
				</view>
				
				<!-- 校区管理 -->
				<view class="editor-section">
					<view class="editor-label-row">
						<text class="editor-label">校区管理</text>
						<text class="editor-hint">最多3个校区</text>
					</view>
					
					<view class="campus-list">
						<view 
							v-for="(campus, cIndex) in formData.campuses" 
							:key="cIndex"
							class="campus-item"
						>
							<view class="campus-header">
								<input 
									class="campus-name-input" 
									v-model="campus.name" 
									placeholder="校区名称"
								/>
								<view class="campus-color-picker">
									<view 
										v-for="(color, colorIdx) in campusColors" 
										:key="colorIdx"
										class="campus-color-dot"
										:class="{ 'campus-color-active': campus.colorIndex === colorIdx }"
										:style="{ background: color.primary }"
										@click="campus.colorIndex = colorIdx"
									></view>
								</view>
								<view class="campus-delete" @click="deleteCampus(cIndex)" v-if="formData.campuses.length > 1">
									<text class="material-symbols-outlined">delete</text>
								</view>
							</view>
							
							<!-- 预设点列表 -->
							<view class="preset-list">
								<view 
									v-for="(preset, pIndex) in campus.presets" 
									:key="pIndex"
									class="preset-item"
								>
									<input 
										class="preset-name-input" 
										v-model="preset.name" 
										placeholder="名称"
									/>
									<input 
										class="preset-coord-input" 
										v-model="preset.lat" 
										placeholder="纬度"
										type="number"
									/>
									<input 
										class="preset-coord-input" 
										v-model="preset.lng" 
										placeholder="经度"
										type="number"
									/>
									<view class="preset-delete" @click="deletePreset(cIndex, pIndex)" v-if="campus.presets.length > 1">
										<text class="material-symbols-outlined">close</text>
									</view>
								</view>
								
								<view class="preset-add" @click="addPreset(cIndex)">
									<text class="material-symbols-outlined">add</text>
									<text>添加预设点</text>
								</view>
							</view>
						</view>
						
						<view class="campus-add" @click="addCampus" v-if="formData.campuses.length < 3">
							<text class="material-symbols-outlined">add</text>
							<text>添加校区</text>
						</view>
					</view>
				</view>
				
				<!-- 坐标拾取器提示 -->
				<view class="editor-section coord-picker-section">
					<view class="coord-picker-hint">
						<text class="material-symbols-outlined">info</text>
						<text class="coord-picker-text">获取坐标：</text>
						<text class="coord-picker-link" @click="openCoordPicker">坐标拾取器</text>
					</view>
				</view>
				
				<!-- 保存按钮 -->
				<view class="editor-actions">
					<view class="btn-save" @click="save">
						<text>保存</text>
					</view>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
import { THEME_COLORS, CAMPUS_COLORS, COORD_PICKER_URL, generateId } from '@/utils/constants.js';

export default {
	props: {
		visible: { type: Boolean, default: false },
		schoolData: { type: Object, default: null }
	},
	data() {
		return {
			themeColors: THEME_COLORS,
			campusColors: CAMPUS_COLORS,
			showThemeDropdown: false,
			formData: {
				id: '',
				name: '',
				themeIndex: 0,
				linkPattern: '',
				campuses: [
					{
						name: '主校区',
						colorIndex: 0,
						presets: [
							{ name: '预设点1', lat: '', lng: '' }
						]
					}
				]
			}
		}
	},
	computed: {
		isEdit() {
			return this.schoolData && this.schoolData.id;
		}
	},
	watch: {
		schoolData: {
			handler(val) {
				if (val && val.id) {
					this.formData = JSON.parse(JSON.stringify(val));
				} else {
					this.resetForm();
				}
			},
			immediate: true,
			deep: true
		}
	},
	methods: {
		resetForm() {
			this.formData = {
				id: '',
				name: '',
				themeIndex: 0,
				linkPattern: '',
				campuses: [
					{
						name: '主校区',
						colorIndex: 0,
						presets: [
							{ name: '预设点1', lat: '', lng: '' }
						]
					}
				]
			};
		},
		selectTheme(index) {
			this.formData.themeIndex = index;
			this.showThemeDropdown = false;
		},
		addCampus() {
			if (this.formData.campuses.length >= 3) {
				uni.showToast({ title: '最多支持3个校区', icon: 'none' });
				return;
			}
			this.formData.campuses.push({
				name: `校区${this.formData.campuses.length + 1}`,
				colorIndex: this.formData.campuses.length,
				presets: [
					{ name: '预设点1', lat: '', lng: '' }
				]
			});
		},
		deleteCampus(index) {
			if (this.formData.campuses.length <= 1) {
				uni.showToast({ title: '至少保留一个校区', icon: 'none' });
				return;
			}
			this.formData.campuses.splice(index, 1);
		},
		addPreset(campusIndex) {
			const campus = this.formData.campuses[campusIndex];
			campus.presets.push({
				name: `预设点${campus.presets.length + 1}`,
				lat: '',
				lng: ''
			});
		},
		deletePreset(campusIndex, presetIndex) {
			const campus = this.formData.campuses[campusIndex];
			if (campus.presets.length <= 1) {
				uni.showToast({ title: '至少保留一个预设点', icon: 'none' });
				return;
			}
			campus.presets.splice(presetIndex, 1);
		},
		openCoordPicker() {
			// #ifdef APP-PLUS
			plus.runtime.openURL(COORD_PICKER_URL);
			// #endif
			// #ifndef APP-PLUS
			window.open(COORD_PICKER_URL);
			// #endif
		},
		save() {
			// 验证
			if (!this.formData.name.trim()) {
				uni.showToast({ title: '请输入学校名称', icon: 'none' });
				return;
			}
			
			// 验证并转换预设点数据
			let hasValidPreset = false;
			for (const campus of this.formData.campuses) {
				if (!campus.name.trim()) {
					uni.showToast({ title: '请输入校区名称', icon: 'none' });
					return;
				}
				
				for (const preset of campus.presets) {
					if (preset.lat && preset.lng) {
						hasValidPreset = true;
						preset.lat = parseFloat(preset.lat);
						preset.lng = parseFloat(preset.lng);
					}
				}
			}
			
			if (!hasValidPreset) {
				uni.showToast({ title: '请至少添加一个有效的预设点', icon: 'none' });
				return;
			}
			
			// 生成ID
			if (!this.formData.id) {
				this.formData.id = generateId();
			}
			
			this.$emit('save', JSON.parse(JSON.stringify(this.formData)));
		}
	}
}
</script>

<style scoped>
.editor-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
}

.editor-card {
	width: 92%;
	max-width: 420px;
	max-height: 85vh;
	background: rgba(15, 30, 60, 0.95);
	backdrop-filter: blur(32px);
	-webkit-backdrop-filter: blur(32px);
	border: 1px solid rgba(60, 100, 160, 0.25);
	border-radius: 24px;
	padding: 24px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	display: flex;
	flex-direction: column;
}

.editor-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.editor-title-row {
	display: flex;
	align-items: center;
	gap: 10px;
}

.editor-icon {
	font-size: 24px;
	color: var(--color-primary);
}

.editor-title {
	font-size: 20px;
	font-weight: 700;
	color: #fff;
}

.editor-close {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.06);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s;
}

.editor-close:active {
	background: rgba(255, 255, 255, 0.12);
}

.editor-close .material-symbols-outlined {
	font-size: 20px;
	color: rgba(255, 255, 255, 0.6);
}

.editor-body {
	flex: 1;
	overflow-y: auto;
	padding-bottom: env(safe-area-inset-bottom);
}

.editor-section {
	margin-bottom: 24px;
}

.editor-label {
	font-size: 13px;
	color: rgba(255, 255, 255, 0.5);
	margin-bottom: 10px;
	display: block;
	font-weight: 500;
}

.editor-label-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 10px;
}

.editor-hint {
	font-size: 11px;
	color: rgba(255, 255, 255, 0.3);
}

.editor-input {
	width: 100%;
	height: 48px;
	background: rgba(0, 0, 0, 0.3);
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 12px;
	padding: 0 16px;
	font-size: 15px;
	color: #fff;
	box-sizing: border-box;
}

.editor-input:focus {
	border-color: var(--color-primary);
}

.editor-hint-text {
	font-size: 11px;
	color: rgba(255, 255, 255, 0.3);
	margin-top: 6px;
	display: block;
}

/* 主题色选择 - 下拉框 */
.theme-dropdown {
	position: relative;
}

.theme-dropdown-selected {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 14px 16px;
	background: rgba(0, 0, 0, 0.3);
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 12px;
	cursor: pointer;
	transition: all 0.3s;
}

.theme-dropdown-selected:active {
	background: rgba(0, 0, 0, 0.5);
}

.theme-dropdown-dot {
	width: 14px;
	height: 14px;
	border-radius: 50%;
	flex-shrink: 0;
}

.theme-dropdown-text {
	flex: 1;
	font-size: 15px;
	color: rgba(255, 255, 255, 0.85);
}

.theme-dropdown-arrow {
	font-size: 20px;
	color: rgba(255, 255, 255, 0.4);
	transition: transform 0.3s;
}

.dropdown-open {
	transform: rotate(180deg);
}

.theme-dropdown-list {
	position: absolute;
	top: calc(100% + 8px);
	left: 0;
	right: 0;
	background: rgba(20, 20, 25, 0.98);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 12px;
	max-height: 300px;
	overflow-y: auto;
	z-index: 100;
	box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
}

.theme-dropdown-item {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 14px 16px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	transition: background 0.2s;
}

.theme-dropdown-item:last-child {
	border-bottom: none;
}

.theme-dropdown-item:active {
	background: rgba(255, 255, 255, 0.06);
}

.theme-dropdown-active {
	background: rgba(255, 255, 255, 0.04);
}

.theme-dropdown-item-text {
	flex: 1;
	font-size: 15px;
	color: rgba(255, 255, 255, 0.85);
}

.theme-dropdown-check {
	font-size: 20px;
	color: #4ade80;
}

/* 校区管理 */
.campus-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.campus-item {
	background: rgba(255, 255, 255, 0.03);
	border: 1px solid rgba(255, 255, 255, 0.06);
	border-radius: 14px;
	padding: 14px;
}

.campus-header {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 12px;
}

.campus-name-input {
	flex: 1;
	height: 40px;
	background: rgba(0, 0, 0, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.06);
	border-radius: 10px;
	padding: 0 12px;
	font-size: 14px;
	color: #fff;
}

.campus-color-picker {
	display: flex;
	gap: 8px;
	align-items: center;
}

.campus-color-dot {
	width: 20px;
	height: 20px;
	border-radius: 50%;
	cursor: pointer;
	transition: all 0.2s;
	border: 2px solid transparent;
}

.campus-color-dot:active {
	transform: scale(0.9);
}

.campus-color-active {
	border-color: #fff;
	box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

.campus-delete {
	width: 36px;
	height: 36px;
	border-radius: 8px;
	background: rgba(220, 38, 38, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s;
}

.campus-delete:active {
	background: rgba(220, 38, 38, 0.2);
}

.campus-delete .material-symbols-outlined {
	font-size: 18px;
	color: #f87171;
}

/* 预设点 */
.preset-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.preset-item {
	display: flex;
	gap: 8px;
	align-items: center;
}

.preset-name-input {
	width: 80px;
	height: 36px;
	background: rgba(0, 0, 0, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.06);
	border-radius: 8px;
	padding: 0 10px;
	font-size: 12px;
	color: #fff;
	flex-shrink: 0;
}

.preset-coord-input {
	flex: 1;
	height: 36px;
	background: rgba(0, 0, 0, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.06);
	border-radius: 8px;
	padding: 0 10px;
	font-size: 12px;
	color: #fff;
	font-family: 'JetBrains Mono', monospace;
}

.preset-delete {
	width: 32px;
	height: 32px;
	border-radius: 6px;
	background: rgba(255, 255, 255, 0.05);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.preset-delete .material-symbols-outlined {
	font-size: 16px;
	color: rgba(255, 255, 255, 0.4);
}

.preset-add {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 10px;
	background: rgba(var(--color-primary-rgb, 0, 95, 156), 0.05);
	border: 1px dashed rgba(var(--color-primary-rgb, 0, 95, 156), 0.2);
	border-radius: 10px;
	color: var(--color-primary);
	font-size: 13px;
	transition: all 0.3s;
}

.preset-add:active {
	background: rgba(var(--color-primary-rgb, 0, 95, 156), 0.1);
}

.preset-add .material-symbols-outlined {
	font-size: 16px;
}

.campus-add {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 14px;
	background: rgba(var(--color-primary-rgb, 0, 95, 156), 0.05);
	border: 1px dashed rgba(var(--color-primary-rgb, 0, 95, 156), 0.2);
	border-radius: 14px;
	color: var(--color-primary);
	font-size: 14px;
	font-weight: 500;
	transition: all 0.3s;
}

.campus-add:active {
	background: rgba(var(--color-primary-rgb, 0, 95, 156), 0.1);
}

.campus-add .material-symbols-outlined {
	font-size: 18px;
}

/* 坐标拾取器 */
.coord-picker-section {
	margin-bottom: 16px;
}

.coord-picker-hint {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 14px;
	background: rgba(56, 189, 248, 0.05);
	border: 1px solid rgba(56, 189, 248, 0.15);
	border-radius: 10px;
}

.coord-picker-hint .material-symbols-outlined {
	font-size: 16px;
	color: #38bdf8;
}

.coord-picker-text {
	font-size: 13px;
	color: rgba(255, 255, 255, 0.5);
}

.coord-picker-link {
	font-size: 13px;
	color: #38bdf8;
	text-decoration: underline;
}

/* 保存按钮 */
.editor-actions {
	padding-top: 10px;
}

.btn-save {
	width: 100%;
	height: 52px;
	background: linear-gradient(180deg, var(--color-primary-soft) 0%, rgba(0, 60, 120, 0.6) 100%);
	border: 1px solid var(--color-border);
	border-radius: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	font-weight: 600;
	color: #fff;
	transition: all 0.3s;
}

.btn-save:active {
	transform: scale(0.98);
}
</style>
