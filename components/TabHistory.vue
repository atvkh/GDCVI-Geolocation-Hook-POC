<template>
	<view class="tab-wrapper">
		<view class="glass-card card-history">
			<view class="card-glow-bg glow-history"></view>
			<view class="card-inner">
				<text class="label-text history-label">打卡历史记录</text>
				<scroll-view scroll-y="true" class="history-scroll">
					<view v-for="(item, index) in historyList" :key="index" class="history-row">
						<view class="h-info">
							<text class="h-time">{{item.time}}</text>
							<text class="h-pos">坐标: {{item.lat}}, {{item.lng}}</text>
							<text v-if="item.status === '失败' && item.reason" class="h-reason">反馈: {{ item.reason }}</text>
						</view>
						<text class="h-tag" :class="item.status === '失败' ? 'status-fail' : 'status-success'">
							{{item.status || '成功'}}
						</text>
					</view>
					
					<view v-if="historyList.length === 0" class="empty-state">
						<view class="empty-icon-wrapper">
							<text class="material-symbols-outlined empty-icon">satellite_alt</text>
							<view class="radar-scan"></view>
						</view>
						<text class="empty-title">协议静默中</text>
						<text class="empty-desc">底层拦截网已部署，等待首次信标发射</text>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	props: { historyList: { type: Array, default: () => [] } }
}
</script>

<style scoped>
.card-history { border-top: 3px solid var(--color-success); }
.glow-history { bottom: -60px; right: -60px; background: radial-gradient(circle, rgba(74,222,128,0.15) 0%, transparent 70%); }
.history-label { color: var(--color-text-main); text-shadow: 0 0 10px rgba(74,222,128,0.8); }

.history-scroll { height: 350px; }
.history-row { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--color-border); transition: background 0.3s; }
.history-row:active { background: rgba(255,255,255,0.02); }
.h-time { color: var(--color-text-main); font-size: 14px; font-weight: 700; display: block; }
.h-pos { color: var(--color-text-muted); font-size: 11px; margin-top: 4px; display: block; }
.h-reason { font-size: 11px; color: var(--color-danger); margin-top: 4px; display: block; opacity: 0.9; font-weight: bold; }

.h-tag { font-size: 12px; font-weight: 900; }
.status-success { color: var(--color-success); text-shadow: 0 0 10px rgba(74,222,128,0.5); }
.status-fail { color: var(--color-danger); text-shadow: 0 0 10px rgba(255,110,132,0.5); }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 250px; opacity: 0.7; }
.empty-icon-wrapper { position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.empty-icon { font-size: 40px; color: var(--color-success); opacity: 0.5; }
.radar-scan { position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 1px dashed var(--color-success); opacity: 0.3; animation: radar 4s linear infinite; }
.empty-title { font-size: 16px; font-weight: bold; color: var(--color-text-main); margin-bottom: 8px; letter-spacing: 2px; }
.empty-desc { font-size: 12px; color: var(--color-text-muted); text-align: center; max-width: 80%; line-height: 1.5; }

@keyframes radar { 0% { transform: rotate(0deg) scale(0.8); opacity: 0.5; } 50% { transform: rotate(180deg) scale(1.2); opacity: 0.1; } 100% { transform: rotate(360deg) scale(0.8); opacity: 0.5; } }
</style>