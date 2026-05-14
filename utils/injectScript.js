// utils/injectScript.js

export const generateCoreScript = (fakeLat, fakeLng, buttonSelector, defaultLat, defaultLng) => {
	return `(function(){
		if(window.__CYBER_HOOK_ACTIVE__) return;
		window.__CYBER_HOOK_ACTIVE__ = true;
		
		let F_LAT = parseFloat(${fakeLat});
		let F_LNG = parseFloat(${fakeLng});
		const D_LAT = parseFloat(${defaultLat});
		const D_LNG = parseFloat(${defaultLng});
		
		const getJitter = () => (Math.random() - 0.5) * 0.00004; 
		const getFakeData = () => ({
			lat: F_LAT + getJitter(),
			lng: F_LNG + getJitter(),
			accuracy: 10 + Math.random() * 5
		});

		// 影子劫持：对抗 toString 检查
		const origToString = Function.prototype.toString;
		const proxyToString = new Proxy(origToString, {
			apply(target, thisArg, args) {
				if (thisArg && thisArg.__cyber_name) {
					return 'function ' + thisArg.__cyber_name + '() { [native code] }';
				}
				return Reflect.apply(target, thisArg, args);
			}
		});
		Object.defineProperty(Function.prototype, 'toString', {
			value: proxyToString,
			configurable: true, writable: true
		});

		// 核心通讯桥接 (修复 Bug 2)
		const sendToUniApp = (action, data) => {
			try {
				if(window.plus) {
					const wv = plus.webview.currentWebview();
					const parent = wv.parent() || wv.opener();
					if(parent) {
						const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ action, data }))));
						parent.evalJS("if(window.__handleBridgeMsg) window.__handleBridgeMsg('" + payload + "')");
					}
				}
			} catch(e) { console.error('[CyberHook] Bridge Error:', e); }
		};

		// 高级 UI 反馈
		const showToast = (isSuccess, msg) => {
			const color = isSuccess ? '#00E676' : '#ff453a';
			const toast = document.createElement('div');
			toast.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);border:1px solid '+color+';color:'+color+';padding:12px 24px;border-radius:30px;font-size:14px;font-weight:bold;z-index:2147483647;backdrop-filter:blur(10px);box-shadow:0 8px 24px rgba(0,0,0,0.5);display:flex;align-items:center;gap:10px;animation:cyber-slide-down 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);white-space:nowrap;font-family:monospace;';
			toast.innerHTML = (isSuccess ? 'SUCCESS' : 'ERROR') + '<span style="font-size:11px;opacity:0.7;font-weight:normal;max-width:160px;overflow:hidden;text-overflow:ellipsis;">' + msg + '</span>';
			const root = document.body || document.documentElement;
			if (root) root.appendChild(toast);
			
			sendToUniApp('checkin_result', { isSuccess, msg });
			setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
		};

		// 地理位置核心拦截
		if (navigator.geolocation) {
			const origGet = navigator.geolocation.getCurrentPosition;
			navigator.geolocation.getCurrentPosition = new Proxy(origGet, {
				apply(target, thisArg, args) {
					const suc = args[0];
					if(typeof suc === 'function') {
						const fd = getFakeData();
						setTimeout(() => suc({coords:{latitude:fd.lat, longitude:fd.lng, accuracy:fd.accuracy}, timestamp:Date.now()}), 50);
					}
				}
			});
			navigator.geolocation.getCurrentPosition.__cyber_name = 'getCurrentPosition';
		}

		// Ajax/Fetch 深度捕获 (修复 Bug 14, 15)
		const origSend = XMLHttpRequest.prototype.send;
		XMLHttpRequest.prototype.send = function() {
			this.addEventListener('load', function() {
				if (window.__AUTO_CLICKED__) {
					try {
						const res = JSON.parse(this.responseText);
						const msg = res.message || res.msg || res.error || '';
						let isSuccess = (res.code === 200 || res.code === 0 || res.success === true || msg.includes('成功'));
						if (msg.includes('失败') || msg.includes('距离太远')) isSuccess = false;
						
						const hud = document.getElementById('cyber_hud');
						if(hud) hud.style.display = 'none';
						
						showToast(isSuccess, msg || (isSuccess ? '操作成功' : '请求异常'));
						window.__AUTO_CLICKED__ = false;
					} catch(e) {}
				}
			});
			return origSend.apply(this, arguments);
		};

		const origFetch = window.fetch;
		if (origFetch) {
			window.fetch = function() {
				return origFetch.apply(this, arguments).then(response => {
					if (window.__AUTO_CLICKED__) {
						try {
							const cloned = response.clone();
							cloned.json().then(res => {
								const msg = res.message || res.msg || res.error || '';
								let isSuccess = (res.code === 200 || res.code === 0 || res.success === true || msg.includes('成功'));
								
								const hud = document.getElementById('cyber_hud');
								if(hud) hud.style.display = 'none';
								
								showToast(isSuccess, msg || (isSuccess ? '操作成功' : '请求异常'));
								window.__AUTO_CLICKED__ = false;
							}).catch(() => {});
						} catch (e) {}
					}
					return response;
				});
			};
		}

		// 自动确认逻辑
		window.showConfirmBox = function() {
			if (document.getElementById('cyber_confirm')) return;
			const box = document.createElement('div');
			box.id = 'cyber_confirm';
			box.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%, -50%);background:rgba(10,10,12,0.95);border:1px solid #00E676;color:#fff;padding:24px;border-radius:24px;z-index:2147483647;backdrop-filter:blur(20px);box-shadow:0 0 40px rgba(0,230,118,0.3);text-align:center;width:80%;max-width:320px;font-family:monospace;';
			box.innerHTML = '<div style="font-size:18px;font-weight:900;margin-bottom:12px;color:#00E676;">操作确认</div><div style="font-size:13px;color:#a1a1aa;margin-bottom:24px;">已锁定至目标区域，是否执行打卡？</div><div style="display:flex;gap:12px;"><button id="btn_cancel_ck" style="flex:1;padding:12px;border:none;border-radius:12px;background:rgba(255,255,255,0.05);color:#a1a1aa;">取消</button><button id="btn_confirm_ck" style="flex:1;padding:12px;border:none;border-radius:12px;background:#00E676;color:#000;font-weight:bold;">确认</button></div>';
			document.body.appendChild(box);

			document.getElementById('btn_cancel_ck').onclick = () => box.remove();
			document.getElementById('btn_confirm_ck').onclick = () => {
				box.innerHTML = '<div style="color:#00E676;padding:10px 0;">正在注入...</div>';
				setTimeout(() => {
					box.remove();
					let targetBtn = null;
					const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
					let node;
					while (node = walker.nextNode()) {
						const text = node.nodeValue.trim();
						if (text === '签到' || text === '打卡' || text === '立即签到') {
							targetBtn = node.parentElement.closest('button, [role="button"], .adm-button, .van-button, .weui-btn') || node.parentElement;
							break;
						}
					}
					if (targetBtn) {
						window.__AUTO_CLICKED__ = true;
						targetBtn.click();
					} else { alert("未找到打卡按钮，请手动点击。"); }
				}, 300);
			};
		};

		// 监听器：发现打卡按钮时自动提示
		setInterval(() => {
			if (window.__AUTO_CLICKED__ || document.getElementById('cyber_confirm')) return;
			const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
			let node;
			while (node = walker.nextNode()) {
				const text = node.nodeValue.trim();
				if (text === '签到' || text === '打卡' || text === '立即签到') {
					window.showConfirmBox();
					break;
				}
			}
		}, 1000);

	})();`;
};