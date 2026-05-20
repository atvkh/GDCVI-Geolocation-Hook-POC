<template>
	<view class="page-card history-card page-transition" :class="{ 'page-active': isActive }">
		<view class="page-card-header">
			<view class="header-left">
				<text class="material-symbols-outlined page-card-icon">history</text>
				<text class="page-card-title">打卡历史</text>
			</view>
			<view class="header-actions">
				<view class="btn-export" @click="exportHistory">
					<text class="material-symbols-outlined">upload</text>
				</view>
			</view>
		</view>
		
		<view class="history-stats" v-if="historyList.length > 0">
			<view class="stat-item">
				<text class="stat-value stat-success">{{ successCount }}</text>
				<text class="stat-label">成功</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-value stat-fail">{{ failCount }}</text>
				<text class="stat-label">失败</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-value">{{ weekCount }}</text>
				<text class="stat-label">本周</text>
			</view>
		</view>
		
		<scroll-view scroll-y="true" class="page-card-scroll">
			<view v-for="(item, index) in historyList" :key="index" class="history-item" @click="toggleHistoryDetail(index)">
				<view class="history-item-main">
					<view class="history-item-left">
						<text class="history-item-date">{{ item.date }}</text>
						<text class="history-item-time">{{ item.time }}</text>
						<text class="history-item-coord">坐标: {{ item.lat }}, {{ item.lng }}</text>
					</view>
					<view class="history-item-right">
						<view class="history-item-tag" :class="item.status === '失败' ? 'tag-fail' : 'tag-success'">
							{{ item.status || '未知' }}
						</view>
						<text class="material-symbols-outlined expand-icon" :class="{ 'expanded': expandedIndex === index }">expand_more</text>
					</view>
				</view>
				<view class="history-item-detail" v-if="expandedIndex === index">
					<view class="detail-row">
						<text class="detail-label">打卡时间</text>
						<text class="detail-value">{{ item.time }}</text>
					</view>
					<view class="detail-row">
						<text class="detail-label">纬度</text>
						<text class="detail-value">{{ item.lat }}</text>
					</view>
					<view class="detail-row">
						<text class="detail-label">经度</text>
						<text class="detail-value">{{ item.lng }}</text>
					</view>
					<view class="detail-row" v-if="item.status === '失败' && item.reason">
						<text class="detail-label">失败原因</text>
						<text class="detail-value detail-reason">{{ item.reason }}</text>
					</view>
				</view>
			</view>
			<view v-if="historyList.length === 0" class="history-empty">
				<view class="satellite-container">
					<view class="signal-ring signal-ring-1"></view>
					<view class="signal-ring signal-ring-2"></view>
					<view class="signal-ring signal-ring-3"></view>
					<text class="material-symbols-outlined history-empty-icon">satellite_alt</text>
				</view>
				<text class="history-empty-text">暂无打卡记录</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	props: {
		isActive: { type: Boolean, default: false },
		historyList: { type: Array, default: () => [] }
	},
	data() {
		return {
			expandedIndex: -1
		}
	},
	computed: {
		successCount() {
			return this.historyList.filter(item => item.status === '成功').length;
		},
		failCount() {
			return this.historyList.filter(item => item.status === '失败').length;
		},
		weekCount() {
			const now = new Date();
			const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			return this.historyList.filter(item => {
				if (!item.date) return false;
				const itemDate = new Date(item.date);
				if (isNaN(itemDate.getTime())) return false;
				return itemDate >= weekAgo;
			}).length;
		}
	},
	methods: {
		toggleHistoryDetail(index) {
			this.expandedIndex = this.expandedIndex === index ? -1 : index;
		},
		exportHistory() {
			if (this.historyList.length === 0) {
				uni.showToast({ title: '暂无记录可导出', icon: 'none' });
				return;
			}
			let text = '打卡历史记录\n';
			text += '================\n\n';
			this.historyList.forEach((item, index) => {
				text += `${index + 1}. 日期: ${item.date || '未知'}\n`;
				text += `   时间: ${item.time}\n`;
				text += `   坐标: ${item.lat}, ${item.lng}\n`;
				text += `   状态: ${item.status || '未知'}\n`;
				if (item.reason) text += `   原因: ${item.reason}\n`;
				text += '\n';
			});
			uni.setClipboardData({
				data: text,
				success: () => {
					uni.showToast({ title: '已复制到剪贴板', icon: 'none' });
				}
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
.page-card-header {
	display: flex; align-items: center; justify-content: space-between;
	margin-bottom: 16px; padding-bottom: 12px;
	border-bottom: 1px solid rgba(255,255,255,0.06);
}
.header-left { display: flex; align-items: center; gap: 10px; }
.header-actions { display: flex; gap: 8px; }
.page-card-icon {
	font-size: 24px;
	color: rgb(0, 95, 156);
}
.page-card-title {
	font-size: 20px;
	font-weight: 700;
	color: #fff;
}
.btn-export {
	width: 36px; height: 36px; border-radius: 12px;
	background: rgba(255,255,255,0.06);
	border: 1px solid rgba(255,255,255,0.1);
	display: flex; align-items: center; justify-content: center;
	transition: all 0.3s;
}
.btn-export:active { background: rgba(255,255,255,0.1); transform: scale(0.95); }
.btn-export .material-symbols-outlined { font-size: 18px; color: rgba(255,255,255,0.6); }
.history-card {
	background: rgba(12, 25, 50, 0.5);
}
.history-stats {
	display: flex; align-items: center; justify-content: space-around;
	padding: 14px; margin-bottom: 16px;
	background: rgba(255,255,255,0.03);
	border-radius: 14px;
	border: 1px solid rgba(255,255,255,0.06);
}
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-value { font-size: 22px; font-weight: 700; color: #fff; }
.stat-success { color: #4ade80; }
.stat-fail { color: #f87171; }
.stat-label { font-size: 11px; color: rgba(255,255,255,0.45); }
.stat-divider { width: 1px; height: 30px; background: rgba(255,255,255,0.08); }
.page-card-scroll {
	max-height: 60vh;
}
.history-item {
	padding: 0;
	border-bottom: 1px solid rgba(255,255,255,0.05);
	cursor: pointer;
}
.history-item:last-child { border-bottom: none; }
.history-item-main {
	display: flex; justify-content: space-between; align-items: center;
	padding: 14px 0;
}
.history-item-left { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.history-item-date { font-size: 11px; color: rgba(255,255,255,0.35); margin-bottom: 2px; }
.history-item-time { font-size: 15px; font-weight: 600; color: #fff; }
.history-item-coord { font-size: 12px; color: rgba(255,255,255,0.4); font-family: 'JetBrains Mono', monospace; }
.history-item-right { display: flex; align-items: center; gap: 10px; }
.history-item-tag {
	font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 16px;
}
.tag-success {
	background: rgba(74,222,128,0.12); color: #4ade80;
	border: 1px solid rgba(74,222,128,0.2);
}
.tag-fail {
	background: rgba(239,68,68,0.12); color: #f87171;
	border: 1px solid rgba(239,68,68,0.2);
}
.expand-icon {
	font-size: 20px; color: rgba(255,255,255,0.3);
	transition: transform 0.3s;
}
.expand-icon.expanded { transform: rotate(180deg); }
.history-item-detail {
	padding: 12px 0 14px 0;
	animation: detail-expand 0.3s ease;
}
.detail-row {
	display: flex; justify-content: space-between; align-items: center;
	padding: 6px 0;
}
.detail-label { font-size: 12px; color: rgba(255,255,255,0.4); }
.detail-value { font-size: 13px; color: rgba(255,255,255,0.8); font-family: 'JetBrains Mono', monospace; }
.detail-reason { color: #f87171; max-width: 60%; text-align: right; }
@keyframes detail-expand {
	from { opacity: 0; max-height: 0; }
	to { opacity: 1; max-height: 200px; }
}
.history-empty { 
	display: flex; flex-direction: column; align-items: center; justify-content: center; 
	height: 200px; position: relative; 
}
.satellite-container {
	position: relative;
	width: 100px;
	height: 100px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 16px;
}
.signal-ring {
	position: absolute;
	border-radius: 50%;
	border: 2px solid rgba(125, 211, 168, 0.2);
	animation: signal-pulse 2s ease-out infinite;
}
.signal-ring-1 {
	width: 70px; height: 70px;
	top: 50%; left: 50%;
	transform: translate(-50%, -50%);
	animation-delay: 0s;
}
.signal-ring-2 {
	width: 90px; height: 90px;
	top: 50%; left: 50%;
	transform: translate(-50%, -50%);
	animation-delay: 0.4s;
	border-color: rgba(125, 211, 168, 0.12);
}
.signal-ring-3 {
	width: 110px; height: 110px;
	top: 50%; left: 50%;
	transform: translate(-50%, -50%);
	animation-delay: 0.8s;
	border-color: rgba(125, 211, 168, 0.06);
}
.history-empty-icon { 
	font-size: 48px; color: #7dd3a8; 
	position: relative; z-index: 2;
	filter: drop-shadow(0 0 10px rgba(125, 211, 168, 0.6));
	animation: satellite-glow 2s ease-in-out infinite alternate;
}
.history-empty-text { font-size: 14px; color: rgba(255, 255, 255, 0.45); }
@keyframes signal-pulse {
	0% { transform: translate(-50%, -50%) scale(0.6); opacity: 1; }
	100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
}
@keyframes satellite-glow {
	0% { filter: drop-shadow(0 0 8px rgba(125, 211, 168, 0.4)); }
	100% { filter: drop-shadow(0 0 16px rgba(125, 211, 168, 0.8)); }
}
</style>
