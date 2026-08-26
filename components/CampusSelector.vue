<template>
	<view class="cs-overlay" v-if="visible" @click="$emit('close')">
		<view class="cs-sheet" @click.stop @touchstart="onSheetTouchStart" @touchend="onSheetTouchEnd">
			<view class="cs-handle"></view>
			<view class="cs-header">
				<text class="cs-title">学校与校区</text>
				<text class="material-symbols-outlined cs-close" @click="$emit('close')">close</text>
			</view>

			<scroll-view scroll-y="true" class="cs-body">
				<view class="cs-school" v-for="school in schoolList" :key="school.id">
					<view class="cs-school-row" @click="toggleExpand(school.id)">
						<view class="cs-theme-dot" :style="{ background: themeColor(school) }"></view>
						<text class="cs-school-name">{{ school.name }}</text>
						<text class="cs-current-tag" v-if="school.id === currentSchoolId">当前</text>
						<text class="material-symbols-outlined cs-chevron" :class="{ 'is-open': expandedSchoolId === school.id }">expand_more</text>
					</view>
					<view class="cs-campus-list" v-if="expandedSchoolId === school.id">
						<view
							class="cs-campus-row"
							:class="{ 'is-active': school.id === currentSchoolId && index === currentCampusIndex }"
							v-for="(campus, index) in school.campuses"
							:key="index"
							@click="pick(school, index)"
						>
							<view class="cs-campus-dot" :style="{ background: campusColor(campus) }"></view>
							<text class="cs-campus-name">{{ campus.name }}</text>
							<text class="cs-campus-count">{{ (campus.presets || []).length }} 个预设点</text>
							<text class="material-symbols-outlined cs-check" v-if="school.id === currentSchoolId && index === currentCampusIndex">check_circle</text>
						</view>
					</view>
				</view>
			</scroll-view>

			<view class="cs-footer">
				<view class="cs-manage-btn" @click="$emit('manage')">
					<text class="material-symbols-outlined">tune</text>
					<text>管理学校</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { THEME_COLORS, CAMPUS_COLORS } from '@/utils/constants.js';

export default {
	props: {
		visible: { type: Boolean, default: false },
		schoolList: { type: Array, default: () => [] },
		currentSchoolId: { type: String, default: '' },
		currentCampusIndex: { type: Number, default: 0 }
	},
	data() {
		return {
			expandedSchoolId: '',
			touchStartY: 0
		}
	},
	watch: {
		visible(val) {
			if (val) this.expandedSchoolId = this.currentSchoolId;
		}
	},
	methods: {
		themeColor(school) {
			return (THEME_COLORS[school.themeIndex || 0] || THEME_COLORS[0]).primary;
		},
		campusColor(campus) {
			const idx = campus.colorIndex !== undefined ? campus.colorIndex : 0;
			return (CAMPUS_COLORS[idx % CAMPUS_COLORS.length] || CAMPUS_COLORS[0]).primary;
		},
		toggleExpand(id) {
			this.expandedSchoolId = this.expandedSchoolId === id ? '' : id;
		},
		pick(school, campusIndex) {
			this.$emit('select', { schoolId: school.id, campusIndex });
		},
		onSheetTouchStart(e) {
			this.touchStartY = e.touches[0].clientY;
		},
		onSheetTouchEnd(e) {
			const diffY = e.changedTouches[0].clientY - this.touchStartY;
			if (diffY > 80) this.$emit('close');
		}
	}
}
</script>

<style scoped>
.cs-overlay {
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	background: rgba(0, 0, 0, 0.55);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	z-index: 9998;
	display: flex;
	align-items: flex-end;
	justify-content: center;
}

.cs-sheet {
	width: 100%;
	max-height: 72vh;
	background: rgba(13, 24, 44, 0.97);
	backdrop-filter: blur(32px);
	-webkit-backdrop-filter: blur(32px);
	border-top: 1px solid rgba(80, 130, 200, 0.25);
	border-radius: 28px 28px 0 0;
	padding: 12px 20px calc(20px + env(safe-area-inset-bottom));
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	animation: cs-slide-up 0.35s cubic-bezier(0.2, 1, 0.3, 1);
	box-shadow: 0 -16px 60px rgba(0, 0, 0, 0.6);
}
@keyframes cs-slide-up {
	from { transform: translateY(60px); opacity: 0; }
	to { transform: translateY(0); opacity: 1; }
}

.cs-handle {
	width: 36px;
	height: 4px;
	border-radius: 2px;
	background: rgba(255, 255, 255, 0.18);
	margin: 0 auto 14px;
	flex-shrink: 0;
}

.cs-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
	flex-shrink: 0;
}
.cs-title {
	font-size: 17px;
	font-weight: 700;
	color: #fff;
}
.cs-close {
	font-size: 22px;
	color: rgba(255, 255, 255, 0.45);
	padding: 4px;
}

.cs-body {
	flex: 1;
	min-height: 0;
	max-height: 52vh;
}

.cs-school {
	margin-bottom: 8px;
}
.cs-school-row {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 14px 12px;
	border-radius: 14px;
	background: rgba(255, 255, 255, 0.03);
	transition: background 0.2s;
}
.cs-school-row:active {
	background: rgba(255, 255, 255, 0.07);
}
.cs-theme-dot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	flex-shrink: 0;
}
.cs-school-name {
	flex: 1;
	font-size: 15px;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.92);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.cs-current-tag {
	font-size: 10px;
	font-weight: 700;
	padding: 2px 8px;
	border-radius: 8px;
	background: var(--color-primary-soft);
	color: var(--color-primary);
	flex-shrink: 0;
}
.cs-chevron {
	font-size: 20px;
	color: rgba(255, 255, 255, 0.35);
	transition: transform 0.25s;
}
.cs-chevron.is-open {
	transform: rotate(180deg);
}

.cs-campus-list {
	margin: 4px 0 8px;
}
.cs-campus-row {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 13px 14px;
	margin-left: 14px;
	border-radius: 12px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	transition: background 0.2s;
}
.cs-campus-row:last-child {
	border-bottom: none;
}
.cs-campus-row:active {
	background: rgba(255, 255, 255, 0.06);
}
.cs-campus-row.is-active {
	background: var(--color-primary-soft);
}
.cs-campus-dot {
	width: 7px;
	height: 7px;
	border-radius: 50%;
	flex-shrink: 0;
}
.cs-campus-name {
	flex: 1;
	font-size: 14px;
	color: rgba(255, 255, 255, 0.85);
}
.cs-campus-count {
	font-size: 11px;
	color: rgba(255, 255, 255, 0.32);
	font-family: 'JetBrains Mono', monospace;
}
.cs-check {
	font-size: 19px;
	color: #4ade80;
}

.cs-footer {
	flex-shrink: 0;
	padding-top: 12px;
	border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.cs-manage-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	height: 46px;
	border-radius: 14px;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.09);
	font-size: 14px;
	font-weight: 600;
	color: rgba(220, 232, 250, 0.8);
	transition: all 0.25s;
}
.cs-manage-btn:active {
	transform: scale(0.97);
	background: rgba(255, 255, 255, 0.1);
}
.cs-manage-btn .material-symbols-outlined {
	font-size: 18px;
	color: var(--color-primary);
}
</style>
