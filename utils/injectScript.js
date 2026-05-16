export const generateCoreScript = (fakeLat, fakeLng, buttonSelector, defaultLat, defaultLng) => {
	return `(function(){
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
			return { lat: F_LAT + jitter(), lng: F_LNG + jitter(), accuracy: 10 + Math.random() * 5 };
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
						setTimeout(function() { suc({coords:{latitude: wgs[1], longitude: wgs[0], accuracy: fd.accuracy}, timestamp:Date.now()}); }, 50);
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
										setTimeout(function() { suc({ module: 'geolocation', type: 'h5', lat: fd.lat, lng: fd.lng, accuracy: fd.accuracy, nation: '中国', province: '广东省', city: '清远市', adcode: '441802', __cyber_fake__: true }); }, 50);
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
			var payload = JSON.stringify({ action: action, data: data });
			try {
				if (window.plus && plus.storage) {
					plus.storage.setItem('__cyber_bridge_msg', payload);
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

		var origOpen = XMLHttpRequest.prototype.open;
		XMLHttpRequest.prototype.open = function(method, url) { this._method = method; this._url = url; return origOpen.apply(this, arguments); };
		var origSend = XMLHttpRequest.prototype.send;
		XMLHttpRequest.prototype.send = function() {
			this.addEventListener('load', function() {
				if (window.__AUTO_CLICKED__) {
					try {
						var res = JSON.parse(this.responseText);
						var msg = res.message || res.msg || res.error || '';
						var isSuccess = false;
						if (msg.includes('成功')) { isSuccess = true; }
						else if (msg.match(/(失败|不在|未到|不允许|异常|无法|太远)/)) { isSuccess = false; }
						else { isSuccess = (res.code === 200 || res.code === 0 || res.success === true); }
						if (!msg) msg = isSuccess ? '已完成' : '状态非预期';
						sendToUniApp('checkin_result', { isSuccess: isSuccess, msg: msg });
						window.__AUTO_CLICKED__ = false;
					} catch (e) {}
				}
			});
			return origSend.apply(this, arguments);
		};

		var origFetch = window.fetch;
		window.fetch = function() {
			var promise = origFetch.apply(this, arguments);
			if (window.__AUTO_CLICKED__) {
				promise.then(function(resp) {
					if (resp.clone) {
						resp.clone().json().then(function(data) {
							var msg = data.message || data.msg || data.error || '';
							var isSuccess = (data.code === 200 || data.code === 0 || data.success === true || msg.indexOf('成功') !== -1);
							sendToUniApp('checkin_result', { isSuccess: isSuccess, msg: msg });
							window.__AUTO_CLICKED__ = false;
						}).catch(function(){});
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

		var _cyberStyle = document.createElement('style');
		_cyberStyle.textContent = '#cyber_confirm,#cyber_confirm *{pointer-events:auto!important;-webkit-tap-highlight-color:transparent!important;touch-action:manipulation!important;} #cyber_cancel_btn,#cyber_confirm_btn{cursor:pointer!important;}';
		function _appendCyberStyle() {
			var target = document.head || document.documentElement;
			if (target && !_cyberStyle.parentNode) target.appendChild(_cyberStyle);
		}
		if (document.head || document.documentElement) _appendCyberStyle();
		else document.addEventListener('DOMContentLoaded', _appendCyberStyle);

		var confirmBoxShown = false;
		var _targetBtn = null;
		var _overlay = null;
		var _lastDialogAction = 0;

		window.__cyberCancel = function() {
			if (_overlay && _overlay.parentNode) _overlay.parentNode.removeChild(_overlay);
			_overlay = null;
			confirmBoxShown = false;
		};

		window.__cyberConfirm = function() {
			var btnRow = document.getElementById('cyber_btn_row');
			var descEl = document.getElementById('cyber_desc');
			if (btnRow) btnRow.style.display = 'none';
			if (descEl) { descEl.textContent = '执行中...'; descEl.style.color = '#28a745'; descEl.style.fontWeight = 'bold'; }
			setTimeout(function() {
				window.__cyberCancel();
				window.__AUTO_CLICKED__ = true;
				if (_targetBtn) _targetBtn.click();
			}, 300);
		};

		var _findDialogTarget = function(el) {
			while (el && el !== document) {
				if (el.id === 'cyber_cancel_btn') return 'cancel';
				if (el.id === 'cyber_confirm_btn') return 'confirm';
				if (el.id === 'cyber_box') return 'box';
				el = el.parentElement;
			}
			return 'outside';
		};

		document.addEventListener('touchend', function(e) {
			if (!confirmBoxShown || !_overlay) return;
			var touch = e.changedTouches[0];
			if (!touch) return;
			var el = document.elementFromPoint(touch.clientX, touch.clientY);
			if (!el) return;
			var target = _findDialogTarget(el);
			var now = Date.now();
			if (now - _lastDialogAction < 500) return;
			if (target === 'cancel') { _lastDialogAction = now; e.preventDefault(); window.__cyberCancel(); }
			else if (target === 'confirm') { _lastDialogAction = now; e.preventDefault(); window.__cyberConfirm(); }
			else if (target === 'outside') { _lastDialogAction = now; e.preventDefault(); window.__cyberCancel(); }
		}, false);

		document.addEventListener('click', function(e) {
			if (!confirmBoxShown || !_overlay) return;
			var target = _findDialogTarget(e.target);
			var now = Date.now();
			if (now - _lastDialogAction < 500) return;
			if (target === 'cancel') { _lastDialogAction = now; e.preventDefault(); e.stopPropagation(); window.__cyberCancel(); }
			else if (target === 'confirm') { _lastDialogAction = now; e.preventDefault(); e.stopPropagation(); window.__cyberConfirm(); }
			else if (target === 'outside') { _lastDialogAction = now; window.__cyberCancel(); }
		}, true);

		var checkCheckInButton = function() {
			if (confirmBoxShown) return;
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

					var overlay = document.createElement('div');
					overlay.id = 'cyber_confirm';
					overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.35);z-index:2147483647;display:flex;align-items:center;justify-content:center;will-change:transform;';
					_overlay = overlay;

					var box = document.createElement('div');
					box.id = 'cyber_box';
					box.style.cssText = 'background:rgba(255,255,255,0.97);border-radius:24px;padding:28px 24px 24px;width:82%;max-width:300px;box-shadow:0 20px 60px rgba(0,0,0,0.25);text-align:center;will-change:transform;';

					var titleEl = document.createElement('div');
					titleEl.style.cssText = 'font-size:18px;font-weight:700;color:#1d1d1f;margin-bottom:12px;';
					titleEl.textContent = '操作确认';

					var descEl = document.createElement('div');
					descEl.id = 'cyber_desc';
					descEl.style.cssText = 'font-size:14px;color:#86868b;margin-bottom:24px;line-height:1.5;';
					descEl.textContent = '已锁定至目标区域，是否执行签到操作？';

					var btnRow = document.createElement('div');
					btnRow.id = 'cyber_btn_row';
					btnRow.style.cssText = 'display:flex;gap:12px;';

					var cancelBtn = document.createElement('a');
					cancelBtn.id = 'cyber_cancel_btn';
					cancelBtn.href = 'javascript:void(0)';
					cancelBtn.textContent = '取消';
					cancelBtn.style.cssText = 'flex:1;padding:14px;border-radius:14px;background:#e5e5ea;color:#8e8e93;font-weight:600;font-size:15px;text-align:center;text-decoration:none;display:block;line-height:normal;';

					var confirmBtn = document.createElement('a');
					confirmBtn.id = 'cyber_confirm_btn';
					confirmBtn.href = 'javascript:void(0)';
					confirmBtn.textContent = '确认执行';
					confirmBtn.style.cssText = 'flex:1;padding:14px;border-radius:14px;background:linear-gradient(135deg,#32d74b,#28a745);color:#fff;font-weight:600;font-size:15px;text-align:center;text-decoration:none;display:block;line-height:normal;';

					btnRow.appendChild(cancelBtn);
					btnRow.appendChild(confirmBtn);
					box.appendChild(titleEl);
					box.appendChild(descEl);
					box.appendChild(btnRow);
					overlay.appendChild(box);
					document.body.appendChild(overlay);
				}
			}
		};

		var domObserver = new MutationObserver(function() { checkCheckInButton(); });
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', function() {
				checkCheckInButton();
				domObserver.observe(document.body, { childList: true, subtree: true });
			});
		} else {
			checkCheckInButton();
			if (document.body) domObserver.observe(document.body, { childList: true, subtree: true });
		}
		setInterval(checkCheckInButton, 2000);

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
