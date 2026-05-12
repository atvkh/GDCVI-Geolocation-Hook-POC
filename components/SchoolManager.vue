<template>
	<view class="school-manager-overlay" v-if="visible" @click="$emit('close')">
		<view class="school-manager-card" @click.stop>
			<view class="school-manager-header">
				<view class="school-manager-title-row">
					<text class="material-symbols-outlined school-manager-icon">school</text>
					<text class="school-manager-title">学校管理</text>
				</view>
				<view class="school-manager-close" @click="$emit('close')">
					<text class="material-symbols-outlined">close</text>
				</view>
			</view>
			
			<scroll-view scroll-y="true" class="school-manager-body">
				<view class="school-list">
					<view 
						v-for="(school, index) in schoolList" 
						:key="school.id"
						class="school-item"
						:class="{ 'school-item-active': school.id === currentSchoolId }"
						@click="selectSchool(school)"
					>
						<view class="school-item-left">
							<view class="school-theme-dot" :style="{ background: getThemeColor(school.themeIndex) }"></view>
							<view class="school-item-info">
								<text class="school-item-name">{{ school.name }}</text>
								<text class="school-item-campus">{{ school.campuses.length }}个校区</text>
							</view>
						</view>
						<view class="school-item-right">
							<text class="material-symbols-outlined school-check" v-if="school.id === currentSchoolId">check_circle</text>
							<view class="school-item-actions">
								<view class="school-action-btn" @click.stop="$emit('edit', school)">
									<text class="material-symbols-outlined">edit</text>
								</view>
								<view class="school-action-btn school-action-delete" v-if="school.id !== 'gdjy'" @click.stop="deleteSchool(school, index)">
									<text class="material-symbols-outlined">delete</text>
								</view>
							</view>
						</view>
					</view>
				</view>
				
				<view class="school-add-btn" @click="$emit('add')">
					<text class="material-symbols-outlined">add</text>
					<text>添加学校</text>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
import { THEME_COLORS } from '@/utils/constants.js';

export default {
	props: {
		visible: { type: Boolean, default: false },
		schoolList: { type: Array, default: () => [] },
		currentSchoolId: { type: String, default: '' }
	},
	methods: {
		getThemeColor(index) {
			return THEME_COLORS[index || 0].primary;
		},
		selectSchool(school) {
			this.$emit('select', school);
		},
		deleteSchool(school, index) {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除"${school.name}"吗？`,
				success: (res) => {
					if (res.confirm) {
						this.$emit('delete', school, index);
					}
				}
			});
		}
	}
}
</script>

<style scoped>
.school-manager-overlay {
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

.school-manager-card {
	width: 90%;
	max-width: 400px;
	background: rgba(15, 30, 60, 0.95);
	backdrop-filter: blur(32px);
	-webkit-backdrop-filter: blur(32px);
	border: 1px solid rgba(60, 100, 160, 0.25);
	border-radius: 24px;
	padding: 24px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.school-manager-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.school-manager-title-row {
	display: flex;
	align-items: center;
	gap: 10px;
}

.school-manager-icon {
	font-size: 24px;
	color: var(--color-primary);
}

.school-manager-title {
	font-size: 20px;
	font-weight: 700;
	color: #fff;
}

.school-manager-close {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.06);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s;
}

.school-manager-close:active {
	background: rgba(255, 255, 255, 0.12);
}

.school-manager-close .material-symbols-outlined {
	font-size: 20px;
	color: rgba(255, 255, 255, 0.6);
}

.school-manager-body {
	max-height: 60vh;
}

.school-list {
	margin-bottom: 16px;
}

.school-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	background: rgba(255, 255, 255, 0.03);
	border: 1px solid rgba(255, 255, 255, 0.06);
	border-radius: 14px;
	margin-bottom: 10px;
	transition: all 0.3s;
	cursor: pointer;
}

.school-item:active {
	background: rgba(255, 255, 255, 0.06);
}

.school-item-active {
	border-color: var(--color-primary);
	background: rgba(var(--color-primary-rgb, 0, 95, 156), 0.1);
}

.school-item-left {
	display: flex;
	align-items: center;
	gap: 12px;
	flex: 1;
}

.school-theme-dot {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	flex-shrink: 0;
}

.school-item-info {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.school-item-name {
	font-size: 15px;
	font-weight: 600;
	color: #fff;
}

.school-item-campus {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.4);
}

.school-item-right {
	display: flex;
	align-items: center;
	gap: 12px;
}

.school-check {
	font-size: 22px;
	color: #4ade80;
}

.school-item-actions {
	display: flex;
	gap: 8px;
}

.school-action-btn {
	width: 32px;
	height: 32px;
	border-radius: 8px;
	background: rgba(255, 255, 255, 0.06);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s;
}

.school-action-btn:active {
	background: rgba(255, 255, 255, 0.12);
	transform: scale(0.9);
}

.school-action-btn .material-symbols-outlined {
	font-size: 18px;
	color: rgba(255, 255, 255, 0.6);
}

.school-action-delete:active {
	background: rgba(220, 38, 38, 0.2);
}

.school-action-delete .material-symbols-outlined {
	color: #f87171;
}

.school-add-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 16px;
	background: rgba(var(--color-primary-rgb, 0, 95, 156), 0.1);
	border: 1px dashed rgba(var(--color-primary-rgb, 0, 95, 156), 0.3);
	border-radius: 14px;
	color: var(--color-primary);
	font-size: 15px;
	font-weight: 600;
	transition: all 0.3s;
}

.school-add-btn:active {
	background: rgba(var(--color-primary-rgb, 0, 95, 156), 0.2);
}

.school-add-btn .material-symbols-outlined {
	font-size: 20px;
}
</style>
