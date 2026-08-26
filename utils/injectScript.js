export const generateCoreScript = (fakeLat, fakeLng, buttonSelector, defaultLat, defaultLng) => {
	return `(function(){
		if(typeof window.__f__ !== 'function') window.__f__ = function(){};
		if(window.__CYBER_HOOK_ACTIVE__) return;
		window.__CYBER_HOOK_ACTIVE__ = true;

		var F_LAT = ${fakeLat};
		var F_LNG = ${fakeLng};

		var PI = 3.1415926535897932384626;
		var a = 6378245.0;
		var ee = 0.00669342162296594323;

		var transformLat = function(x, y) {
			var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
			ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
			ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
			ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
			return ret;
		};

		var transformLng = function(x, y) {
			var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
			ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
			ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
			ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
			return ret;
		};

		var gcj02towgs84 = function(lng, lat) {
			var dlat = transformLat(lng - 105.0, lat - 35.0);
			var dlng = transformLng(lng - 105.0, lat - 35.0);
			var radlat = lat / 180.0 * PI;
			var magic = Math.sin(radlat);
			magic = 1 - ee * magic * magic;
			var sqrtmagic = Math.sqrt(magic);
			dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
			dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
			return [lng * 2 - (lng + dlng), lat * 2 - (lat + dlat)];
		};

		var getFakeData = function() {
			var jitter = function() { return (Math.random() - 0.5) * 0.00004; };
			return { lat: Number((F_LAT + jitter()).toFixed(6)), lng: Number((F_LNG + jitter()).toFixed(6)), accuracy: Number((10 + Math.random() * 5).toFixed(1)) };
		};

		var origToString = Function.prototype.toString;
		Object.defineProperty(Function.prototype, 'toString', {
			value: new Proxy(origToString, {
				apply: function(target, thisArg, args) {
					if (thisArg && thisArg.__cyber_name) return 'function ' + thisArg.__cyber_name + '() { [native code] }';
					return Reflect.apply(target, thisArg, args);
				}
			}), configurable: true, writable: true
		});

		try {
			var origIframeSrcDesc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
			if (origIframeSrcDesc) {
				var newSet = new Proxy(origIframeSrcDesc.set, {
					apply: function(target, thisArg, args) {
						if (args[0] && typeof args[0] === 'string' && args[0].includes('geolocation')) args[0] = 'about:blank';
						return Reflect.apply(target, thisArg, args);
					}
				});
				newSet.__cyber_name = 'set src';
				Object.defineProperty(HTMLIFrameElement.prototype, 'src', { set: newSet, get: origIframeSrcDesc.get, configurable: origIframeSrcDesc.configurable, enumerable: origIframeSrcDesc.enumerable });
			}
		} catch(e) {}

		var hookW3C = function(origMethod, name) {
			if (typeof origMethod !== 'function') return origMethod;
			var proxy = new Proxy(origMethod, {
				apply: function(target, thisArg, args) {
					var suc = args[0];
					if (typeof suc === 'function') {
						var fd = getFakeData();
						var wgs = gcj02towgs84(fd.lng, fd.lat);
						setTimeout(function() { suc({coords:{latitude: Number(wgs[1].toFixed(6)), longitude: Number(wgs[0].toFixed(6)), accuracy: fd.accuracy}, timestamp:Date.now()}); }, 50);
					}
					return name === 'watchPosition' ? Math.floor(Math.random() * 10000) : undefined;
				}
			});
			proxy.__cyber_name = name;
			return proxy;
		};

		if (window.Geolocation && Geolocation.prototype) {
			try {
				Object.defineProperty(Geolocation.prototype, 'getCurrentPosition', {
					value: hookW3C(Geolocation.prototype.getCurrentPosition, 'getCurrentPosition'),
					configurable: false, writable: false
				});
				Object.defineProperty(Geolocation.prototype, 'watchPosition', {
					value: hookW3C(Geolocation.prototype.watchPosition, 'watchPosition'),
					configurable: false, writable: false
				});
			} catch(e) {}
		}

		if (navigator.geolocation) {
			try {
				var geoProxy = new Proxy(navigator.geolocation, {
					get: function(target, prop) {
						if (prop === 'getCurrentPosition') return hookW3C(target[prop], 'getCurrentPosition');
						if (prop === 'watchPosition') return hookW3C(target[prop], 'watchPosition');
						return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
					}
				});
				Object.defineProperty(navigator, 'geolocation', {
					value: geoProxy,
					configurable: false,
					writable: false,
					enumerable: true
				});
			} catch(e) {}
		}

		var proxyCache = new WeakSet();
		var hookTencentGeo = function(OrigGeo) {
			if (proxyCache.has(OrigGeo)) return OrigGeo;
			var HookedGeo = new Proxy(OrigGeo, {
				construct: function(target, args) {
					var instance = Reflect.construct(target, args);
					if (proxyCache.has(instance)) return instance;
					var InstanceProxy = new Proxy(instance, {
						get: function(target2, prop) {
							if (prop === 'getLocation' || prop === 'getIpLocation') {
								var fakeMethod = function(suc) {
									if (suc) {
										var fd = getFakeData();
										setTimeout(function() { suc({ module: 'geolocation', type: 'h5', lat: fd.lat, lng: fd.lng, accuracy: fd.accuracy }); }, 50);
									}
								};
								fakeMethod.__cyber_name = prop;
								return fakeMethod;
							}
							var val = Reflect.get(target2, prop);
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

		var _qq = window.qq;
		Object.defineProperty(window, 'qq', {
			get: function() {
				if (_qq && !proxyCache.has(_qq)) {
					_qq = new Proxy(_qq, {
						get: function(target, prop) {
							if (prop === 'maps') {
								var maps = Reflect.get(target, prop);
								if (maps && !proxyCache.has(maps)) {
									var mapsProxy = new Proxy(maps, {
										get: function(target2, prop2) {
											return prop2 === 'Geolocation' ? hookTencentGeo(Reflect.get(target2, prop2)) : Reflect.get(target2, prop2);
										}
									});
									proxyCache.add(mapsProxy);
									return mapsProxy;
								}
							}
							return Reflect.get(target, prop);
						}
					});
					proxyCache.add(_qq);
				}
				return _qq;
			},
			set: function(v) { _qq = v; },
			configurable: true
		});

		var sendToUniApp = function(action, data) {
			var payload = JSON.stringify({ action: action, data: data, ts: Date.now() });
			try {
				if (window.plus && plus.storage) {
					var existing = plus.storage.getItem('__cyber_bridge_msgs');
					var queue = [];
					try {
						var parsedQueue = existing ? JSON.parse(existing) : [];
						queue = Array.isArray(parsedQueue) ? parsedQueue : [parsedQueue];
					} catch(e2) {}
					queue.push(payload);
					if (queue.length > 20) queue = queue.slice(queue.length - 20);
					plus.storage.setItem('__cyber_bridge_msgs', JSON.stringify(queue));
					plus.storage.setItem('__cyber_bridge_msg_' + Date.now() + '_' + Math.random().toString(36).slice(2), payload);
				}
			} catch(e) {}
			try {
				if (window.plus) {
					var wv = plus.webview.currentWebview();
					var parent = wv.parent() || wv.opener();
					var encoded = btoa(unescape(encodeURIComponent(payload)));
					if (parent) {
						parent.evalJS("if(window.__handleBridgeMsg) window.__handleBridgeMsg('" + encoded + "')");
					} else {
						var all = plus.webview.all();
						for (var i = 0; i < all.length; i++) {
							try {
								var w = all[i];
								if (w && w.id !== wv.id) {
									w.evalJS("if(window.__handleBridgeMsg) window.__handleBridgeMsg('" + encoded + "')");
								}
							} catch(e2) {}
						}
					}
				}
			} catch (e) {}
		};

		var CHECKIN_PENDING_KEY = '__cyber_checkin_pending_until';
		var CHECKIN_PENDING_MS = 90000;
		var getCheckinPendingUntil = function() {
			var until = Number(window.__CHECKIN_PENDING_UNTIL || 0);
			try {
				if (window.plus && plus.storage) {
					var stored = Number(plus.storage.getItem(CHECKIN_PENDING_KEY) || 0);
					if (stored > until) until = stored;
				}
			} catch(e) {}
			return until;
		};
		var isCheckinPending = function() {
			return !!window.__AUTO_CLICKED__ || Date.now() < getCheckinPendingUntil();
		};
		var setCheckinPending = function() {
			var until = Date.now() + CHECKIN_PENDING_MS;
			window.__AUTO_CLICKED__ = true;
			window.__CHECKIN_PENDING_UNTIL = until;
			try {
				if (window.plus && plus.storage) plus.storage.setItem(CHECKIN_PENDING_KEY, String(until));
			} catch(e) {}
		};
		var clearCheckinPending = function() {
			window.__AUTO_CLICKED__ = false;
			window.__CHECKIN_PENDING_UNTIL = 0;
			_clickPending = false;
			try {
				if (window.plus && plus.storage) plus.storage.removeItem(CHECKIN_PENDING_KEY);
			} catch(e) {}
		};

		var parseResponseBody = function(body) {
			var data = {};
			var text = '';
			if (body == null) return { data: data, text: text };
			if (typeof body === 'string') {
				text = body;
				try { data = JSON.parse(body); } catch(e) {}
			} else {
				data = body;
				try { text = JSON.stringify(body); } catch(e) {}
			}
			return { data: data && typeof data === 'object' ? data : {}, text: text || '' };
		};

		var pickResponseMessage = function(data, text) {
			var msg = '';
			if (data && typeof data === 'object') {
				msg = data.message || data.msg || data.error || data.errMsg || data.errmsg || '';
				if (!msg && data.data && typeof data.data === 'object') {
					msg = data.data.message || data.data.msg || data.data.error || data.data.errMsg || data.data.errmsg || '';
				}
			}
			if (msg == null) msg = '';
			if (typeof msg !== 'string') msg = String(msg);
			if (!msg && text && /(成功|失败|不在|未到|不允许|异常|无法|太远)/.test(text)) {
				msg = text.replace(/\\s+/g, ' ').slice(0, 120);
			}
			return msg;
		};

		var buildCheckinResult = function(body, statusOk) {
			var parsed = parseResponseBody(body);
			var data = parsed.data;
			var msg = pickResponseMessage(data, parsed.text);
			var signalText = msg || parsed.text || '';
			var isSuccess = false;
			if (signalText.indexOf('成功') !== -1) {
				isSuccess = true;
			} else if (/(失败|不在|未到|不允许|异常|无法|太远)/.test(signalText)) {
				isSuccess = false;
			} else if (data && (data.code !== undefined || data.success !== undefined)) {
				isSuccess = (data.code === 200 || data.code === 0 || data.success === true || data.success === 'true');
			} else {
				isSuccess = !!statusOk;
			}
			if (!msg) msg = isSuccess ? '已完成' : '状态非预期';
			return { isSuccess: isSuccess, msg: msg };
		};

		var origOpen = XMLHttpRequest.prototype.open;
		XMLHttpRequest.prototype.open = function(method, url) { this._method = method; this._url = url; return origOpen.apply(this, arguments); };
		var origSend = XMLHttpRequest.prototype.send;
		XMLHttpRequest.prototype.send = function() {
			this.addEventListener('load', function() {
				if (isCheckinPending()) {
					try {
						var body = '';
						try { body = this.responseText; } catch(e1) { body = this.response; }
						if (!body && this.response) body = this.response;
						var result = buildCheckinResult(body, this.status >= 200 && this.status < 300);
						console.log('[CYBER] XHR checkin_result: isSuccess=' + result.isSuccess + ' msg=' + result.msg);
						sendToUniApp('checkin_result', result);
						clearCheckinPending();
					} catch (e) {
						console.log('[CYBER] XHR parse error: ' + e.message);
						clearCheckinPending();
					}
				}
			});
			return origSend.apply(this, arguments);
		};

		var origFetch = window.fetch;
		window.fetch = function() {
			var promise = origFetch.apply(this, arguments);
			if (isCheckinPending()) {
				promise.then(function(resp) {
					if (resp.clone) {
						resp.clone().text().then(function(text) {
							var result = buildCheckinResult(text, resp.ok);
							console.log('[CYBER] Fetch checkin_result: isSuccess=' + result.isSuccess + ' msg=' + result.msg);
							sendToUniApp('checkin_result', result);
							clearCheckinPending();
						}).catch(function(){
							var result = buildCheckinResult('', resp.ok);
							console.log('[CYBER] Fetch checkin_result: isSuccess=' + result.isSuccess + ' msg=' + result.msg);
							sendToUniApp('checkin_result', result);
							clearCheckinPending();
						});
					}
				}).catch(function(){});
			}
			return promise;
		};

		(function(){
			var hud = document.createElement('div');
			hud.id = 'cyber_hud';
			hud.style.cssText = 'position:fixed;top:48px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#00E676;padding:4px 10px;border-radius:8px;font-size:11px;font-family:monospace;z-index:2147483647;pointer-events:none;white-space:nowrap;';
			hud.textContent = 'GEO-PROXY ACTIVE';
			document.addEventListener('DOMContentLoaded', function() {
				document.body.appendChild(hud);
			});
			if (document.body) document.body.appendChild(hud);
		})();

		(function(){
			var verifyHud = document.getElementById('cyber_hud');
			try {
				navigator.geolocation.getCurrentPosition(function(pos) {
					var lat = pos.coords.latitude;
					var lng = pos.coords.longitude;
					var wgs = gcj02towgs84(F_LNG, F_LAT);
					var isHooked = (Math.abs(lat - wgs[1]) < 0.01 && Math.abs(lng - wgs[0]) < 0.01);
					if (verifyHud) {
						verifyHud.textContent = isHooked ? 'HOOK OK ' + lat.toFixed(4) + ',' + lng.toFixed(4) : 'HOOK FAIL';
						verifyHud.style.color = isHooked ? '#00E676' : '#FF5252';
					}
					sendToUniApp('hook_verify', { isHooked: isHooked, lat: lat, lng: lng, fakeLat: F_LAT, fakeLng: F_LNG });
				}, function(err) {
					if (verifyHud) {
						verifyHud.textContent = 'GEO ERR: ' + err.message;
						verifyHud.style.color = '#FF5252';
					}
				}, { timeout: 5000 });
			} catch(e) {
				if (verifyHud) {
					verifyHud.textContent = 'HOOK EXCEPTION';
					verifyHud.style.color = '#FF5252';
				}
			}
		})();

		try {
			if (window.plus) {
				var wv = plus.webview.currentWebview();
				var parent = wv.parent() || wv.opener();
				if (parent) {
					parent.evalJS("if(window.__updateGlobalCoords) window.__updateGlobalCoords(" + F_LAT + "," + F_LNG + ")");
				}
			}
		} catch(e) {}

		function isButtonDisabled(btn) {
			if (!btn) return true;
			if (btn.disabled || btn.getAttribute('disabled') !== null) return true;
			if (btn.className && btn.className.includes('disabled')) return true;
			if (btn.getAttribute('aria-disabled') === 'true') return true;
			return false;
		}

		var confirmBoxShown = false;
		var _targetBtn = null;
		var _cancelUntil = 0;
		var _clickPending = isCheckinPending();
		var _domResultSent = false;

		var tryResolveCheckinFromDom = function() {
			if (_domResultSent || !isCheckinPending() || !document.body) return;
			var text = document.body.innerText || '';
			var successMatch = text.match(/(签到成功|打卡成功|提交成功|操作成功|成功打卡|已完成签到|已完成打卡)/);
			var failMatch = text.match(/(签到失败|打卡失败|提交失败|不在|未到|不允许|异常|无法|太远|距离太远)/);
			if (!successMatch && !failMatch) return;
			var isSuccess = !!successMatch;
			var msg = (successMatch || failMatch)[0];
			console.log('[CYBER] DOM checkin_result: isSuccess=' + isSuccess + ' msg=' + msg);
			_domResultSent = true;
			sendToUniApp('checkin_result', { isSuccess: isSuccess, msg: msg });
			clearCheckinPending();
		};

		var checkCheckInButton = function() {
			if (confirmBoxShown) return;
			tryResolveCheckinFromDom();
			if (_clickPending) return;
			if (Date.now() < _cancelUntil) return;
			if (!document.body) return;
			var targetBtn = null;
			var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
			var node;
			while ((node = walker.nextNode())) {
				var text = node.nodeValue.trim();
				if (['签到', '打卡', '立即签到', '立即打卡'].includes(text)) {
					targetBtn = node.parentElement.closest('button, [role="button"], .adm-button, .van-button, .weui-btn') || node.parentElement;
					break;
				}
			}

			if (targetBtn && targetBtn.offsetWidth > 0) {
				var isBtnDisabled = isButtonDisabled(targetBtn);
				var pageText = document.body.innerText || "";
				var inSafeZone = pageText.includes('可以进行签到') || pageText.includes('已在指定区域内');

				if (!isBtnDisabled || inSafeZone) {
					confirmBoxShown = true;
					_targetBtn = targetBtn;

					var executeAction = function() {
						var tip = document.createElement('div');
						tip.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:#28a745;padding:16px 32px;border-radius:16px;z-index:2147483647;font-size:16px;font-weight:bold;pointer-events:none;';
						tip.textContent = '执行中...';
						document.body.appendChild(tip);
						setTimeout(function() {
							if (tip.parentNode) tip.parentNode.removeChild(tip);
							_clickPending = true;
							setCheckinPending();
							if (_targetBtn && document.body && document.body.contains(_targetBtn)) {
								_targetBtn.click();
							} else {
								clearCheckinPending();
							}
							confirmBoxShown = false;
						}, 100);
						setTimeout(function() {
							if (_clickPending) {
								clearCheckinPending();
							}
						}, CHECKIN_PENDING_MS);
					};

					var cancelAction = function() {
						confirmBoxShown = false;
						_cancelUntil = Date.now() + 60000;
					};

					var ok = confirm('已锁定至目标区域，是否执行签到操作？');
					if (ok) {
						executeAction();
					} else {
						cancelAction();
					}
				}
			}
		};

		var domObserver = new MutationObserver(function() { checkCheckInButton(); tryResolveCheckinFromDom(); });
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', function() {
				checkCheckInButton();
				tryResolveCheckinFromDom();
				domObserver.observe(document.body, { childList: true, subtree: true });
			});
		} else {
			checkCheckInButton();
			tryResolveCheckinFromDom();
			if (document.body) domObserver.observe(document.body, { childList: true, subtree: true });
		}
		setInterval(function() { checkCheckInButton(); tryResolveCheckinFromDom(); }, 2000);

		window.showToast = function(msg) {
			var t = document.createElement('div');
			t.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:#fff;padding:12px 24px;border-radius:12px;z-index:2147483647;font-size:14px;pointer-events:none;';
			t.textContent = msg;
			document.body.appendChild(t);
			setTimeout(function() { t.remove(); }, 2000);
		};

		window.__handleCheckinResult = function(isSuccess, msg) {
			sendToUniApp('checkin_result', { isSuccess: isSuccess, msg: msg });
		};
	})();`;
};
