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
		} catch(e) {}

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
				style.innerHTML = ':root { --cyber-primary: #cc97ff; --cyber-success: #4ade80; --cyber-info: #38bdf8; --cyber-danger: #ff6e84; --cyber-bg-modal: rgba(15, 15, 20, 0.95); } @keyframes cyber-pop { 0% { transform: translate(-50%, -40%); opacity: 0; } 100% { transform: translate(-50%, -50%); opacity: 1; } } @keyframes cyber-slide-down { 0% { top: -20px; opacity: 0; } 100% { top: 60px; opacity: 1; } } @keyframes cyber-slide-left { 0% { right: -50px; opacity: 0; } 100% { right: 15px; opacity: 1; } }';
				const root = document.head || document.documentElement || document.body;
				if (root) root.appendChild(style);
			}
		};

		const ensureHUD = () => {
			if (document.getElementById('cyber_hud')) return;
			const monitor = document.createElement('div');
			monitor.id = 'cyber_hud';
			monitor.style.cssText = 'position:fixed;top:40px;left:50%;transform:translateX(-50%);background:rgba(10,10,10,0.85);border:1px solid var(--cyber-success);color:var(--cyber-success);padding:8px 16px;border-radius:20px;font-size:12px;font-weight:900;z-index:2147483647;backdrop-filter:blur(10px);box-shadow:0 0 20px rgba(74,222,128,0.2);display:flex;align-items:center;gap:8px;font-family:sans-serif;pointer-events:none;';
			monitor.innerHTML = '<div style="width:8px;height:8px;border-radius:50%;background:var(--cyber-success);box-shadow:0 0 8px var(--cyber-success);"></div><span>PROXY HOOKED</span>';
			const root = document.body || document.documentElement;
			if (root) root.appendChild(monitor);
		};

		const ensureEditor = () => {
			if (document.getElementById('cyber_coord_editor')) return;
			const editor = document.createElement('div');
			editor.id = 'cyber_coord_editor';
			
			editor.style.cssText = 'position:fixed;top:90px;right:15px;background:var(--cyber-bg-modal);border:1px solid var(--cyber-info);padding:12px;border-radius:12px;z-index:2147483647;backdrop-filter:blur(10px);box-shadow:0 0 15px rgba(56,189,248,0.2);display:flex;flex-direction:column;font-family:sans-serif;width:150px;animation:cyber-slide-left 0.4s ease;user-select:none;touch-action:none;';
			
			editor.innerHTML = 
				'<div id="cyber_drag_handle" style="font-size:11px;color:var(--cyber-info);font-weight:bold;text-align:center;letter-spacing:1px;margin-bottom:8px;padding:6px;background:rgba(56,189,248,0.1);border-radius:6px;cursor:move;pointer-events:none;">✥ 控制台</div>' +
				'<input id="cyber_lat_input" type="number" value="' + F_LAT + '" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;border-radius:6px;padding:6px 4px;font-size:12px;text-align:center;box-sizing:border-box;margin-bottom:6px;" placeholder="Lat">' +
				'<input id="cyber_lng_input" type="number" value="' + F_LNG + '" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;border-radius:6px;padding:6px 4px;font-size:12px;text-align:center;box-sizing:border-box;margin-bottom:8px;" placeholder="Lng">' +
				'<div style="display:flex;gap:6px;">' +
					'<button id="cyber_coord_reset" style="flex:1;background:rgba(255,255,255,0.1);color:#fff;border:none;border-radius:6px;padding:8px 0;font-size:11px;cursor:pointer;">回退</button>' +
					'<button id="cyber_coord_update" style="flex:2;background:var(--cyber-info);color:#000;border:none;border-radius:6px;padding:8px 0;font-weight:bold;font-size:11px;cursor:pointer;transition:all 0.2s;">应用</button>' +
				'</div>';
			
			const root = document.body || document.documentElement;
			if (root) root.appendChild(editor);

			let isDragging = false;
			let startX, startY, initialX, initialY;
			let longPressTimer = null;
			let wasDragging = false;

			const dragStart = (e) => {
				const targetTag = e.target.tagName.toLowerCase();
				if (targetTag === 'input') return;

				if(e.type === 'touchstart') {
					startX = e.touches[0].clientX;
					startY = e.touches[0].clientY;
				} else {
					startX = e.clientX;
					startY = e.clientY;
				}
				
				const rect = editor.getBoundingClientRect();
				initialX = rect.left;
				initialY = rect.top;
				
				clearTimeout(longPressTimer);
				longPressTimer = setTimeout(() => {
					isDragging = true;
					editor.style.right = 'auto'; 
					editor.style.left = initialX + 'px';
					editor.style.top = initialY + 'px';
					editor.style.animation = 'none'; 
					editor.style.transform = 'scale(1.02)';
					editor.style.transition = 'transform 0.2s';
					try { if(navigator.vibrate) navigator.vibrate(40); } catch(err){}
				}, 350);
			};

			const dragMove = (e) => {
				let currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
				let currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

				if(!isDragging) {
					if (Math.abs(currentX - startX) > 10 || Math.abs(currentY - startY) > 10) {
						clearTimeout(longPressTimer);
					}
					return;
				}

				e.preventDefault(); 
				
				let newX = initialX + currentX - startX;
				let newY = initialY + currentY - startY;

				const maxX = window.innerWidth - editor.offsetWidth;
				const maxY = window.innerHeight - editor.offsetHeight;

				newX = Math.max(0, Math.min(newX, maxX));
				newY = Math.max(0, Math.min(newY, maxY));

				editor.style.transition = 'none';
				editor.style.left = newX + 'px';
				editor.style.top = newY + 'px';
			};

			const dragEnd = () => { 
				clearTimeout(longPressTimer);
				if (isDragging) {
					isDragging = false;
					wasDragging = true;
					editor.style.transform = 'scale(1)';
					editor.style.transition = 'transform 0.2s';
					setTimeout(() => { wasDragging = false; }, 100);
				}
			};

			editor.addEventListener('touchstart', dragStart, {passive: false});
			document.addEventListener('touchmove', dragMove, {passive: false});
			document.addEventListener('touchend', dragEnd);
			editor.addEventListener('mousedown', dragStart);
			document.addEventListener('mousemove', dragMove);
			document.addEventListener('mouseup', dragEnd);
			
			editor.addEventListener('click', (e) => {
				if (wasDragging) {
					e.preventDefault();
					e.stopPropagation();
				}
			}, { capture: true });

			const syncToApp = () => {
				try {
					if(window.plus) {
						const wv = plus.webview.currentWebview();
						const parent = wv.parent() || wv.opener();
						if(parent) parent.evalJS("if(window.__updateGlobalCoords) window.__updateGlobalCoords("+F_LAT+", "+F_LNG+")");
					}
				} catch(e){}
			};

			const updateBtn = document.getElementById('cyber_coord_update');
			if (updateBtn) {
				updateBtn.onclick = () => {
					const newLat = parseFloat(document.getElementById('cyber_lat_input').value);
					const newLng = parseFloat(document.getElementById('cyber_lng_input').value);
					if(!isNaN(newLat) && !isNaN(newLng)) {
						F_LAT = newLat;
						F_LNG = newLng;
						window.__CYBER_BOX_SHOWN = false; 
						
						updateBtn.innerText = '生效';
						updateBtn.style.background = 'var(--cyber-success)';
						setTimeout(() => {
							updateBtn.innerText = '应用';
							updateBtn.style.background = 'var(--cyber-info)';
						}, 2000);
						syncToApp();
					}
				};
			}

			const resetBtn = document.getElementById('cyber_coord_reset');
			if (resetBtn) {
				resetBtn.onclick = () => {
					document.getElementById('cyber_lat_input').value = D_LAT;
					document.getElementById('cyber_lng_input').value = D_LNG;
					F_LAT = D_LAT;
					F_LNG = D_LNG;
					window.__CYBER_BOX_SHOWN = false; 
					
					resetBtn.innerText = '已回退';
					resetBtn.style.background = 'rgba(74,222,128,0.2)';
					resetBtn.style.color = 'var(--cyber-success)';
					setTimeout(() => {
						resetBtn.innerText = '回退';
						resetBtn.style.background = 'rgba(255,255,255,0.1)';
						resetBtn.style.color = '#fff';
					}, 2000);
					syncToApp();
				};
			}
		};

		const uiWatchdog = () => {
			try {
				ensureStyles();
				ensureHUD();
				ensureEditor();
			} catch (e) {}
		};
		uiWatchdog();
		setInterval(uiWatchdog, 1500);

		window.showConfirmBox = function() {
			if (document.getElementById('cyber_confirm')) return;
			const box = document.createElement('div');
			box.id = 'cyber_confirm';
			box.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%, -50%);background:var(--cyber-bg-modal);border:1px solid var(--cyber-primary);color:#fff;padding:24px;border-radius:24px;z-index:2147483647;backdrop-filter:blur(20px);box-shadow:0 0 40px rgba(204,151,255,0.3);text-align:center;width:80%;max-width:320px;font-family:sans-serif;animation: cyber-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);';
			box.innerHTML = '<div style="font-size:18px;font-weight:900;margin-bottom:12px;color:var(--cyber-primary);text-shadow:0 0 10px rgba(204,151,255,0.8);">操作确认</div><div style="font-size:13px;color:#a1a1aa;margin-bottom:24px;line-height:1.6;">已锁定至目标区域，是否执行业务请求？</div><div style="display:flex;gap:12px;"><button id="btn_cancel_ck" style="flex:1;padding:12px;border:none;border-radius:12px;background:rgba(255,255,255,0.05);color:#a1a1aa;font-weight:bold;">取消</button><button id="btn_confirm_ck" style="flex:1;padding:12px;border:none;border-radius:12px;background:var(--cyber-primary);color:#050505;font-weight:900;box-shadow:0 0 15px rgba(204,151,255,0.4);">确认执行</button></div>';
			
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
					} catch(e) {}
					
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
			} catch(e) {}
		}, 500);

		const showToast = (isSuccess, msg) => {
			const color = isSuccess ? 'var(--cyber-success)' : 'var(--cyber-danger)';
			const title = isSuccess ? '请求成功' : '请求失败';
			const toast = document.createElement('div');
			toast.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);background:var(--cyber-bg-modal);border:1px solid '+color+';color:'+color+';padding:14px 24px;border-radius:30px;font-size:15px;font-weight:900;z-index:2147483647;backdrop-filter:blur(20px);box-shadow:0 0 30px '+color+'50;display:flex;align-items:center;gap:10px;animation: cyber-slide-down 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);white-space:nowrap;';
			toast.innerHTML = title + '<span style="font-size:12px;opacity:0.8;font-weight:normal;max-width:180px;overflow:hidden;text-overflow:ellipsis;">' + msg + '</span>';
			
			const root = document.body || document.documentElement;
			if (root) root.appendChild(toast);

			try {
				if(window.plus) {
					const wv = plus.webview.currentWebview();
					const parent = wv.parent() || wv.opener();
					const safeMsg = (msg || '').toString().replace(/['"\\\\\\n\\r]/g, '');
					if(parent) parent.evalJS("if(window.__handleCheckinResult) window.__handleCheckinResult("+isSuccess+", '"+safeMsg+"')");
				}
			} catch(e){}
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
						const res = JSON.parse(this.responseText);
						let msg = res.message || res.msg || res.error || '';
						
						if (!msg && (this._method || '').toUpperCase() === 'GET') return; 

						let isSuccess = false;
						if (msg.includes('成功')) {
							isSuccess = true;
						} else if (msg.includes('失败') || msg.includes('不在') || msg.includes('未到') || msg.includes('不允许') || msg.includes('异常') || msg.includes('无法') || msg.includes('距离太远')) {
							isSuccess = false;
						} else {
							isSuccess = (res.code === 200 || res.code === 0 || res.success === true);
						}

						if (!msg) msg = isSuccess ? '已完成' : '状态非预期';

						const hud = document.getElementById('cyber_hud');
						if(hud) hud.style.display = 'none';

						showToast(isSuccess, msg);
						window.__AUTO_CLICKED__ = false;
					} catch(e) {}
				}
			});
			return origSend.apply(this, arguments);
		};
	})();`;
};