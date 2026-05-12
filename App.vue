<script>
	import { injectGlassFilters } from '@/utils/glassFilters.js';
	
	export default {
		onLaunch: function() {
			console.log('App Launch')
			// 注入液态玻璃 SVG 滤镜
			// #ifdef H5
			injectGlassFilters();
			// #endif
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
