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
			configurable: true,
			writable: true
		});

		try {
			const origIframeSrcDesc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
			if (origIframeSrcDesc) {
				const newSet = new Proxy(origIframeSrcDesc.set, {
					apply(target, thisArg, args) {
						let val = args[0];
						if (val && typeof val === 'string' && val.includes('geolocation')) {
							val = 'about:blank';
						}
						return Reflect.apply(target, thisArg, [val]);
					}
				});
				newSet.__cyber_name = 'set src';
				Object.defineProperty(HTMLIFrameElement.prototype, 'src', {
					set: newSet,
					get: origIframeSrcDesc.get,
					configurable: origIframeSrcDesc.configurable,
					enumerable: origIframeSrcDesc.enumerable
				});
			}
		} catch(e) { console.warn('[CyberHook] iframe src proxy error:', e); }

		const observer = new MutationObserver(mutations => {
			mutations.forEach(m => {
				m.addedNodes.forEach(node => {
					if (node.tagName === 'IFRAME' && node.src && node.src.includes('geolocation')) {
						node.src = 'about:blank';
					}
				});
			});
		});
		if(document.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true });

		if (window.Geolocation && Geolocation.prototype) {
			const origGet = Geolocation.prototype.getCurrentPosition;
			const origWatch = Geolocation.prototype.watchPosition;

			if (origGet) {
				Geolocation.prototype.getCurrentPosition = new Proxy(origGet, {
					apply(target, thisArg, args) {
						const suc = args[0];
						if (typeof suc === 'function') {
							const fd = getFakeData();
							setTimeout(() => suc({coords:{latitude:fd.lat, longitude:fd.lng, accuracy:fd.accuracy}, timestamp:Date.now()}), 50);
						}
					}
				});
				Geolocation.prototype.getCurrentPosition.__cyber_name = 'getCurrentPosition';
			}

			if (origWatch) {
				Geolocation.prototype.watchPosition = new Proxy(origWatch, {
					apply(target, thisArg, args) {
						const suc = args[0];
						if (typeof suc === 'function') {
							const fd = getFakeData();
							setTimeout(() => suc({coords:{latitude:fd.lat, longitude:fd.lng, accuracy:fd.accuracy}, timestamp:Date.now()}), 50);
						}
						return Math.floor(Math.random() * 10000);
					}
				});
				Geolocation.prototype.watchPosition.__cyber_name = 'watchPosition';
			}
		} else if (navigator.geolocation) {
			const origGet = navigator.geolocation.getCurrentPosition;
			if(origGet) {
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
		}

		const proxyCache = new WeakSet();
		const hookTencentGeo = (OrigGeo) => {
			if (proxyCache.has(OrigGeo)) return OrigGeo;
			const HookedGeo = new Proxy(OrigGeo, {
				construct(target, args) {
					const instance = Reflect.construct(target, args);
					if (proxyCache.has(instance)) return instance;

					const InstanceProxy = new Proxy(instance, {
						get(target2, prop) {
							if (prop === 'getLocation' || prop === 'getIpLocation') {
								const fakeMethod = function(suc, err, opt) {
									if (suc) {
										const fd = getFakeData();
										setTimeout(() => suc({
											module: 'geolocation', type: 'h5',
											lat: fd.lat, lng: fd.lng, accuracy: fd.accuracy,
											nation: '中国', province: '广东省', city: '清远市', adcode: '441802',
											__cyber_fake__: true
										}), 50);
									}
								};
								fakeMethod.__cyber_name = prop;
								return fakeMethod;
							}
							const val = Reflect.get(target2, prop);
							return typeof val === 'function' ? val.bind(target2) : val;
						}
					});
					proxyCache.add(InstanceProxy);
					return InstanceProxy;
				}
			});
			proxyCache.add(HookedGeo);
			return HookedGeo;
		};

		let _qq = window.qq;
		Object.defineProperty(window, 'qq', {
			get() {
				if (_qq && !proxyCache.has(_qq)) {
					_qq = new Proxy(_qq, {
						get(target, prop) {
							if (prop === 'maps') {
								const maps = Reflect.get(target, prop);
								if (maps && !proxyCache.has(maps)) {
									const mapsProxy = new Proxy(maps, {
										get(target2, prop2) {
											if (prop2 === 'Geolocation') return hookTencentGeo(Reflect.get(target2, prop2));
											return Reflect.get(target2, prop2);
										}
									});
									proxyCache.add(mapsProxy);
									return mapsProxy;
								}
								return maps;
							}
							return Reflect.get(target, prop);
						}
					});
					proxyCache.add(_qq);
				}
				return _qq;
			},
			set(v) { _qq = v; },
			configurable: true
		});

		const origAddEvent = window.addEventListener;
		const proxyAddEvent = new Proxy(origAddEvent, {
			apply(target, thisArg, args) {
				const type = args[0];
				const handler = args[1];
				if (type === 'message' && typeof handler === 'function') {
					const secureHandler = function(e) {
						if (e.data && e.data.module === 'geolocation') {
							if (!e.data.__cyber_fake__) return; 
						}
						return handler.apply(this, arguments);
					};
					args[1] = secureHandler;
				}
				return Reflect.apply(target, thisArg, args);
			}
		});
		proxyAddEvent.__cyber_name = 'addEventListener';
		window.addEventListener = proxyAddEvent;

		setInterval(() => {
			const fd = getFakeData();
			window.postMessage({
				module: 'geolocation', type: 'geolocation',
				lat: fd.lat, lng: fd.lng, accuracy: fd.accuracy,
				nation: '中国', province: '广东省', city: '清远市', adcode: '441802',
				__cyber_fake__: true
			}, '*');
		}, 50);

		const ensureStyles = () => {
			if(!document.getElementById('cyber_anim_styles')) {
				const style = document.createElement('style');
				style.id = 'cyber_anim_styles';
				style.innerHTML = ':root { --cyber-primary: #00E676; --cyber-success: #00E676; --cyber-info: #38bdf8; --cyber-danger: #ff453a; --cyber-bg: rgba(10, 10, 12, 0.9); } @keyframes cyber-pop { 0% { transform: translate(-50%, -40%); opacity: 0; } 100% { transform: translate(-50%, -50%); opacity: 1; } } @keyframes cyber-slide-down { 0% { top: -20px; opacity: 0; } 100% { top: 60px; opacity: 1; } }';
				const root = document.head || document.documentElement || document.body;
				if (root) root.appendChild(style);
			}
		};

		const ensureHUD = () => {
			if (document.getElementById('cyber_hud')) return;
			const monitor = document.createElement('div');
			monitor.id = 'cyber_hud';
			monitor.style.cssText = 'position:fixed;top:40px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);border:1px solid rgba(0,230,118,0.4);color:#00E676;padding:6px 14px;border-radius:100px;font-size:10px;font-weight:900;z-index:2147483647;backdrop-filter:blur(10px);box-shadow:0 8px 24px rgba(0,0,0,0.5);display:flex;align-items:center;gap:8px;font-family:monospace;pointer-events:none;letter-spacing:1px;';
			monitor.innerHTML = '<div style="width:6px;height:6px;border-radius:50%;background:#00E676;box-shadow:0 0 8px #00E676;animation:pulse 2s infinite;"></div><span>GEO-PROXY ACTIVE</span>';
			const root = document.body || document.documentElement;
			if (root) root.appendChild(monitor);
		};

		const syncToApp = () => {
			try {
				if(window.plus) {
					const wv = plus.webview.currentWebview();
					const parent = wv.parent() || wv.opener();
					if(parent) parent.evalJS("if(window.__updateGlobalCoords) window.__updateGlobalCoords("+F_LAT+", "+F_LNG+")");
				}
			} catch(e){ console.warn('[CyberHook] syncToApp error:', e); }
		};

		const uiWatchdog = () => {
			try {
				ensureStyles();
				ensureHUD();
			} catch (e) { console.warn('[CyberHook] uiWatchdog error:', e); }
		};
		uiWatchdog();
		setInterval(uiWatchdog, 1500);

		window.showConfirmBox = function() {
			if (document.getElementById('cyber_confirm')) return;
			const box = document.createElement('div');
			box.id = 'cyber_confirm';
			box.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%, -50%);background:var(--cyber-bg);border:1px solid var(--cyber-primary);color:#fff;padding:24px;border-radius:24px;z-index:2147483647;backdrop-filter:blur(20px);box-shadow:0 0 40px rgba(0,230,118,0.3);text-align:center;width:80%;max-width:320px;font-family:monospace;animation: cyber-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);';
			box.innerHTML = '<div style="font-size:18px;font-weight:900;margin-bottom:12px;color:var(--cyber-primary);text-shadow:0 0 10px rgba(0,230,118,0.8);">操作确认</div><div style="font-size:13px;color:#a1a1aa;margin-bottom:24px;line-height:1.6;">已锁定至目标区域，是否执行业务请求？</div><div style="display:flex;gap:12px;"><button id="btn_cancel_ck" style="flex:1;padding:12px;border:none;border-radius:12px;background:rgba(255,255,255,0.05);color:#a1a1aa;font-weight:bold;">取消</button><button id="btn_confirm_ck" style="flex:1;padding:12px;border:none;border-radius:12px;background:var(--cyber-primary);color:#050505;font-weight:900;box-shadow:0 0 15px rgba(0,230,118,0.4);">确认执行</button></div>';
			
			const root = document.body || document.documentElement;
			if (root) root.appendChild(box);

			const cancelBtn = document.getElementById('btn_cancel_ck');
			if (cancelBtn) cancelBtn.onclick = () => { box.remove(); };
			
			const confirmBtn = document.getElementById('btn_confirm_ck');
			if (confirmBtn) confirmBtn.onclick = () => {
				box.innerHTML = '<div style="font-size:15px;color:var(--cyber-primary);font-weight:bold;padding:10px 0;">执行中...</div>';
				setTimeout(() => {
					box.remove();
					if (!document.body) return;
					let targetBtn = null;
					try {
						const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
						let node;
						while (node = walker.nextNode()) {
							const text = node.nodeValue.trim();
							if (text === '签到' || text === '打卡' || text === '立即签到') {
								targetBtn = node.parentElement.closest('button, [role="button"], .adm-button, .van-button, .weui-btn') || node.parentElement;
								break;
							}
						}
					} catch(e) { console.warn('[CyberHook] TreeWalker error:', e); }
					
					if (targetBtn) {
						window.__AUTO_CLICKED__ = true;
						targetBtn.click();
					} else {
						alert("未能检索到触发节点，请手动操作页面。");
					}
				}, 300);
			};
		};

		window.__CYBER_BOX_SHOWN = false;
		setInterval(() => {
			try {
				if (window.__CYBER_BOX_SHOWN || window.__AUTO_CLICKED__) return;
				if (!document.body) return;

				let btnFound = null;
				const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
				let node;
				while (node = walker.nextNode()) {
					const text = node.nodeValue.trim();
					if (text === '签到' || text === '打卡' || text === '立即签到' || text === '立即打卡') {
						btnFound = node.parentElement;
						break;
					}
				}

				if (btnFound) {
					const btnWrapper = btnFound.closest('button, [role="button"], .adm-button, .van-button, .weui-btn') || btnFound;
					const isBtnDisabled = btnWrapper.disabled || 
										  btnWrapper.classList.contains('adm-button-disabled') || 
										  btnWrapper.classList.contains('van-button--disabled') ||
										  btnWrapper.className.includes('disabled') ||
										  btnWrapper.getAttribute('aria-disabled') === 'true';
					
					const pageText = document.body.innerText || "";
					const inSafeZone = pageText.includes('可以进行签到') || pageText.includes('已在指定区域内');
					const isVisible = btnWrapper.offsetWidth > 0 && btnWrapper.offsetHeight > 0;

					if (isVisible && (!isBtnDisabled || inSafeZone)) {
						window.__CYBER_BOX_SHOWN = true;
						if(typeof window.showConfirmBox === 'function') {
							window.showConfirmBox();
						}
					}
				}
			} catch(e) { console.warn('[CyberHook] button detection error:', e); }
		}, 500);

		const showToast = (isSuccess, msg) => {
			const color = isSuccess ? 'var(--cyber-success)' : 'var(--cyber-danger)';
			const title = isSuccess ? '请求成功' : '请求失败';
			const toast = document.createElement('div');
			toast.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);background:var(--cyber-bg);border:1px solid '+color+';color:'+color+';padding:14px 24px;border-radius:30px;font-size:15px;font-weight:900;z-index:2147483647;backdrop-filter:blur(20px);box-shadow:0 0 30px '+color+'50;display:flex;align-items:center;gap:10px;animation: cyber-slide-down 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);white-space:nowrap;font-family:monospace;';
			toast.innerHTML = title + '<span style="font-size:12px;opacity:0.8;font-weight:normal;max-width:180px;overflow:hidden;text-overflow:ellipsis;">' + msg + '</span>';
			
			const root = document.body || document.documentElement;
			if (root) root.appendChild(toast);

			try {
				if(window.plus) {
					const wv = plus.webview.currentWebview();
					const parent = wv.parent() || wv.opener();
					if(parent) {
						const encodedMsg = encodeURIComponent(msg || '');
						parent.evalJS("(function(){try{if(window.__handleCheckinResult) window.__handleCheckinResult(" + (isSuccess ? 'true' : 'false') + ", decodeURIComponent('" + encodedMsg + "'))}catch(e){console.warn('__handleCheckinResult error:',e)}})()");
					}
				}
			} catch(e){ console.warn('[CyberHook] showToast evalJS error:', e); }
			setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
		};

		const origOpen = XMLHttpRequest.prototype.open;
		XMLHttpRequest.prototype.open = function(method, url) {
			this._method = method;
			this._url = url;
			return origOpen.apply(this, arguments);
		};

		const origSend = XMLHttpRequest.prototype.send;
		XMLHttpRequest.prototype.send = function() {
			this.addEventListener('load', function() {
				if (window.__AUTO_CLICKED__) {
					try {
						let res = {};
						try { res = JSON.parse(this.responseText); } catch(e) { res = {}; }
						let msg = res.message || res.msg || res.error || '';
						
						if (!msg && (this._method || '').toUpperCase() === 'GET') return; 

						let isSuccess = false;
						if (msg.includes('成功')) {
							isSuccess = true;
						} else if (msg.includes('失败') || msg.includes('不在') || msg.includes('未到') || msg.includes('不允许') || msg.includes('异常') || msg.includes('无法') || msg.includes('距离太远')) {
							isSuccess = false;
						} else if (res.code !== undefined || res.success !== undefined) {
							isSuccess = (res.code === 200 || res.code === 0 || res.success === true);
						} else {
							isSuccess = (this.status >= 200 && this.status < 300);
						}

						if (!msg) msg = isSuccess ? '已完成' : '状态非预期';

						const hud = document.getElementById('cyber_hud');
						if(hud) hud.style.display = 'none';

						showToast(isSuccess, msg);
						window.__AUTO_CLICKED__ = false;
					} catch(e) { console.warn('[CyberHook] XHR response parse error:', e); }
				}
			});
			return origSend.apply(this, arguments);
		};

		const origFetch = window.fetch;
		if (origFetch) {
			window.fetch = function() {
				return origFetch.apply(this, arguments).then(response => {
					if (window.__AUTO_CLICKED__) {
						const clonedResponse = response.clone();
						clonedResponse.text().then(text => {
							try {
								let res = {};
								try { res = JSON.parse(text); } catch(e) { res = {}; }
								let msg = res.message || res.msg || res.error || '';
								
								let isSuccess = false;
								if (msg.includes('成功')) {
									isSuccess = true;
								} else if (msg.includes('失败') || msg.includes('不在') || msg.includes('未到') || msg.includes('不允许') || msg.includes('异常') || msg.includes('无法') || msg.includes('距离太远')) {
									isSuccess = false;
								} else if (res.code !== undefined || res.success !== undefined) {
									isSuccess = (res.code === 200 || res.code === 0 || res.success === true);
								} else {
									isSuccess = response.ok;
								}

								if (!msg) msg = isSuccess ? '已完成' : '状态非预期';

								const hud = document.getElementById('cyber_hud');
								if(hud) hud.style.display = 'none';

								showToast(isSuccess, msg);
								window.__AUTO_CLICKED__ = false;
							} catch(e) { console.warn('[CyberHook] fetch response parse error:', e); }
						});
					}
					return response;
				});
			};
		}
	})();`;
};