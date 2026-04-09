# GDCVI-Geolocation-Hook-POC

本项目是一个针对广东建设职业技术学院晚查寝系统（H5 容器环境）的定位风控绕过与逆向防御研究概念验证（Proof of Concept）。

通过深度拦截底层 API，探讨移动端 WebView Sandbox 在安全鉴权与环境特征收集方面的脆弱性。

## 技术特性 (Features)

* **API Proxy 代理层拦截**：弃用全局变量覆盖模式，采用 JS `Proxy` 技术实现对 `navigator.geolocation` 及三方地图 SDK（腾讯地图）的深度方法级 Hook，有效应对严格的对象同源性校验。
* **高斯分布随机坐标生成**：内置模拟算法，针对固定的设定坐标产生微小的经纬度漂移及精度变化，高度拟合真实物理设备 GPS 硬件产生的波动，规避大数据维度的“绝对静止”异常风控。
* **指纹脱敏防御**：拦截并重写 `Function.prototype.toString`，使得所有注入代理的函数在被静态代码检测机制扫描时，均返回标准的原生方法标识（`[native code]`）。
* **DOM TreeWalker 状态监听**：针对业务层的逻辑变动，放弃基于 `setTimeout` 的生硬定时交互。采用原生 `TreeWalker` 高频轮询 DOM 节点特征与文本上下文，实现请求触发的精确时机控制。
* **XHR (XMLHttpRequest) 底层劫持**：在发起 `send` 方法前植入监听器，精准截获并解析打卡业务请求的返回值，实现对上层宿主容器的真实结果反馈，取代不可靠的 HTTP Status 200 判定。
=======
## 🚀 核心技术特性

本项目采用 **Uni-App (Vue3)** 构建，核心注入脚本通过 `evalJS` 动态注入目标 H5 容器，实现对地理位置系统的**深度、隐蔽、高鲁棒性**绕过。核心亮点如下：

### 🔧 高级 Hook 引擎
- **多层 Proxy 深度劫持**：同时 Hook `navigator.geolocation`、`Geolocation.prototype.getCurrentPosition/watchPosition` 以及腾讯地图 `qq.maps.Geolocation` 实例（`construct` + `get` 拦截）
- **Function.prototype.toString 指纹脱敏**：使用 Proxy 伪装被 Hook 的方法，返回标准 `[native code]`，对抗静态代码扫描和特征检测
- **真实 GPS 硬件模拟**：高斯随机抖动（Jitter）+ 精度（accuracy）动态波动，模拟真实设备定位噪声，防止“绝对静止”风控

### 🛡️ 环境与协议对抗
- **腾讯地图 SDK 完整代理**：动态 Proxy `window.qq.maps.Geolocation`，同时兼容 `getLocation` / `getIpLocation`
- **Iframe 隔离**：劫持 `HTMLIFrameElement.src` 及 `MutationObserver`，阻断系统可能降级的地理定位 iframe
- **事件与消息伪装**：劫持 `addEventListener('message')` 并定时 `postMessage` 模拟真实定位数据
- **业务层智能反馈**：完整劫持 `XMLHttpRequest.open/send`，解析返回的 `message/code/success` 字段，结合负面关键词黑名单实现**签到结果自动识别**并展示

### 🎮 用户交互与调试体验
- **实时可拖拽坐标控制台**：支持手动输入或拖拽修改经纬度，修改即时生效（支持 Uni-App 原生 Webview 通信）
- **智能签到按钮检测**：结合 `TreeWalker` + `MutationObserver` 自动定位“签到/打卡”按钮，支持禁用状态判断与安全区文本识别
- **协议完成确认弹窗 + HUD 状态监控**：注入成功后显示“PROXY HOOKED”指示器，并弹出二次确认弹窗防止误操作
- **自动点击与结果通知**：支持一键授权签到，并通过 `plus.webview.evalJS` 将打卡结果实时回传到原生 App

### 🛠️ 工程化与稳定性
- **激进注入策略**：多轮 `evalJS` 重试机制（`INJECT_MAX_ATTEMPTS` + 间隔），确保在 WebView 异步加载完成后成功注入
- **历史记录与持久化**：完整记录每次签到时间、坐标、状态及服务器返回原因
- **指纹与反检测意识**：全链路考虑大数据维度异常、静态扫描、环境特征收集等常见风控手段

> **声明**：本项目为**技术研究与概念验证（POC）**，仅供学习浏览器地理位置 API 与前端 Hook 技术使用。请严格遵守所在学校/单位的规章制度，任何后果由使用者自行承担。

## 运行机制简述

本 POC 建立在对目标应用（如企业微信）H5 容器在处理 OAuth `code` 鉴权时存在的时效性与消耗机制漏洞之上。

1.  **令牌截断获取**：利用物理断网手段截获带有一次性鉴权参数的纯净 URL。
2.  **环境注入伪装**：在本地容器中加载该 URL 前，高频并发执行 `evalJS` 注入脚本，强行接管底层 API 执行权限。
3.  **响应欺骗与下发**：拦截目标地图 SDK 实例化的 `Geolocation` 请求，回传处理后的伪造数据对象（包含伪造的位置属性及 `__cyber_fake__` 验证签名），诱导上层业务完成签到逻辑。

## 声明

* 本代码仅供前端安全技术交流与合法授权的安全测试使用。
* 请勿将本项目用于规避组织纪律管理或任何生产环境中的数据篡改行为。
* 开发者对因不当使用本代码造成的任何系统异常或管理纠纷不承担任何责任。
=======
* 开发者对因不当使用本代码造成的任何系统异常或管理纠纷不承担任何责任。

## 鸣谢 (Acknowledgments)

本项目在从初步的概念验证（POC）到最终工程化的演进过程中，其架构重构、底层 Hook 逻辑梳理、逆向攻防分析以及 Bug 调试，均得到了以下 AI 助手的深度参与和技术支持：

* **Gemini**
* **Claude**
* **Grok**
