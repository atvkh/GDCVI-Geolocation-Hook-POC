<div align="center">

<img src="https://i.ibb.co/N68R5zQs/mmexport1778522797493.png" width="100" height="100" alt="幻签 Logo">

# 幻签 · PhantomSign

**Advanced WebView Geolocation API Interception Framework**

广东建设职业技术学院晚查寝系统 · 定位风控绕过概念验证

<br>

[![Version](https://img.shields.io/badge/version-11.1.0-blue.svg?style=for-the-badge)](https://github.com/atvkh/GDCVI-Geolocation-Hook-POC)
[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-00d4ff?style=for-the-badge)]()
[![Framework](https://img.shields.io/badge/Vue-3.x-42b883?style=for-the-badge)](https://vuejs.org/)
[![Uni-App](https://img.shields.io/badge/Uni--App-V3-2B9939?style=for-the-badge)](https://uniapp.dcloud.io/)
[![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)](LICENSE)

<br>

**深度拦截移动端 WebView 地理定位 API** · **高斯噪声坐标扰动** · **函数指纹脱敏对抗静态检测**

</div>

---

## 目录

- [概述](#概述)
- [核心特性](#核心特性)
- [技术架构](#技术架构)
- [项目结构](#项目结构)
- [运行机制](#运行机制)
- [快速开始](#快速开始)
- [功能详解](#功能详解)
- [版本记录](#版本记录)
- [免责声明](#免责声明)

---

## 概述

幻签（PhantomSign）是一款基于 JavaScript Proxy 的移动端 WebView 地理定位 API 深度拦截框架。通过多层代理链路对 `navigator.geolocation`、腾讯地图 H5 SDK 等定位接口进行运行时劫持，结合高斯分布随机噪声模拟真实 GPS 硬件漂移特性，并通过函数指纹脱敏技术对抗静态代码扫描，实现对广东建设职业技术学院晚查寝系统定位风控机制的绕过。

### 核心技术栈

```
┌─────────────────────────────────────────────────────────────────┐
│                        应用层 Application                        │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │  Vue 3 SPA  │  │  Uni-App SSR │  │  Material Symbols Icons │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                        引擎层 Hook Engine                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ JS Proxy    │  │ XHR Intercept│  │ MutationObserver        │ │
│  │ Deep Hook   │  │ Response     │  │ DOM Mutation            │ │
│  │             │  │ Capture      │  │ Monitor                 │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                        注入层 Injection                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ evalJS      │  │ Burst Retry  │  │ Keep-Alive              │ │
│  │ Dynamic     │  │ 150x @ 20ms  │  │ 1x/sec                  │ │
│  │ Injection   │  │              │  │                         │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 核心特性

### 🛰️ 定位 API 深度拦截

| API | 拦截方式 | 状态 |
|:---|:---|:---|
| `Geolocation.prototype.getCurrentPosition` | Proxy 代理 | ✅ |
| `Geolocation.prototype.watchPosition` | Proxy 代理 | ✅ |
| `navigator.geolocation.getCurrentPosition` | Proxy 代理 | ✅ |
| `qq.maps.Geolocation.getLocation` | 实例代理 | ✅ |
| `qq.maps.Geolocation.getIpLocation` | 实例代理 | ✅ |
| `HTMLIFrameElement.prototype.src` | Setter 劫持 | ✅ |
| `window.addEventListener('message')` | 事件过滤 | ✅ |

### 📡 GPS 噪声模拟算法

```javascript
// 高斯随机抖动 - 模拟真实 GPS 硬件噪声
const getJitter = () => (Math.random() - 0.5) * 0.00004; // ±2.2m
const getAccuracy = () => 10 + Math.random() * 5;        // 10-15m

// 坐标扰动公式
fakeLat = baseLat + gaussianJitter()
fakeLng = baseLng + gaussianJitter()
accuracy = randomAccuracy()
```

### 🔐 函数指纹脱敏

```javascript
// Proxy toString 伪装 - 对抗静态代码扫描
const proxyToString = new Proxy(Function.prototype.toString, {
    apply(target, thisArg, args) {
        if (thisArg && thisArg.__cyber_name) {
            return `function ${thisArg.__cyber_name}() { [native code] }`;
        }
        return Reflect.apply(target, thisArg, args);
    }
});
```

### 🏫 多学校管理

支持自定义添加学校，每所学校独立配置：
- 学校名称
- 最多 3 个校区
- 每个校区独立预设点管理
- 8 种主题色可选
- 内置坐标拾取器链接

---

## 技术架构

### 系统架构图

```
                    ┌──────────────────────────────────┐
                    │         幻签 Native App           │
                    │  ┌────────────────────────────┐  │
                    │  │       Vue 3 + Uni-App       │  │
                    │  │  ┌──────┐ ┌──────┐ ┌──────┐│  │
                    │  │  │ Tab  │ │ Tab  │ │ Tab  ││  │
                    │  │  │ Home │ │ Hist │ │ Set  ││  │
                    │  │  └──────┘ └──────┘ └──────┘│  │
                    │  └────────────────────────────┘  │
                    │              │                    │
                    │              v                    │
                    │  ┌────────────────────────────┐  │
                    │  │      WebView Container      │  │
                    │  │  ┌────────────────────────┐│  │
                    │  │  │   evalJS Injection      ││  │
                    │  │  │   ┌──────────────────┐  ││  │
                    │  │  │   │   Hook Engine     │  ││  │
                    │  │  │   │  ┌──────────────┐ │  ││  │
                    │  │  │   │  │ Geolocation  │ │  ││  │
                    │  │  │   │  │ Proxy Hook   │ │  ││  │
                    │  │  │   │  └──────────────┘ │  ││  │
                    │  │  │   │  ┌──────────────┐ │  ││  │
                    │  │  │   │  │ XHR Intercept│ │  ││  │
                    │  │  │   │  └──────────────┘ │  ││  │
                    │  │  │   │  ┌──────────────┐ │  ││  │
                    │  │  │   │  │ DOM Monitor  │ │  ││  │
                    │  │  │   │  └──────────────┘ │  ││  │
                    │  │  │   └──────────────────┘  ││  │
                    │  │  └────────────────────────┘│  │
                    │  └────────────────────────────┘  │
                    └──────────────────────────────────┘
```

---

## 项目结构

```
PhantomSign/
├── 📁 pages/
│   └── 📁 index/
│       └── 📄 index.vue              # 主页面路由容器
├── 📁 components/
│   ├── 📄 TabHome.vue                # 首页组件 - 打卡操作 & 矩阵库
│   ├── 📄 TabHistory.vue             # 历史记录组件 - 签到状态追踪
│   ├── 📄 TabSettings.vue            # 设置组件 - 坐标配置管理
│   ├── 📄 SchoolManager.vue          # 学校管理组件
│   └── 📄 SchoolEditor.vue           # 学校编辑组件
├── 📁 utils/
│   ├── 📄 constants.js               # 常量配置中心
│   └── 📄 injectScript.js            # Hook 脚本生成器
├── 📁 static/
│   ├── 📁 css/
│   │   └── 📄 global.css             # 全局样式表
│   ├── 📁 fonts/
│   │   └── 📄 MaterialSymbolsOutlined.woff2
│   └── 🖼️ logo.png
├── 📄 App.vue                        # 应用入口
├── 📄 main.js                        # 主入口 (Vue 3 SSR)
├── 📄 manifest.json                  # Uni-App 配置
├── 📄 pages.json                     # 路由配置
├── 📄 uni.scss                       # SCSS 变量
├── 📄 package.json                   # 依赖管理
└── 📄 .eslintrc.json                 # ESLint 配置
```

---

## 运行机制

### 执行流程

```
Phase 1: 环境准备
┌─────────────────────────────────────────────────────────────┐
│  ① 用户输入/粘贴带鉴权参数的签到 URL                         │
│  ② 应用初始化 WebView 并加载目标页面                          │
│  ③ 触发 Hook 引擎注入序列                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              v
Phase 2: Hook 注入
┌─────────────────────────────────────────────────────────────┐
│  ④ evalJS 多轮重试注入 (150次 @ 20ms间隔)                    │
│  ⑤ setInterval 保活注入 (1次/秒)                             │
│  ⑥ 代理链建立完成，开始拦截                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              v
Phase 3: 定位拦截
┌─────────────────────────────────────────────────────────────┐
│  ⑦ Geolocation API 调用被 Proxy 拦截                         │
│  ⑧ 回传包含高斯噪声的伪造坐标                                 │
│  ⑨ 精度值模拟为 10-15 米                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              v
Phase 4: 结果回传
┌─────────────────────────────────────────────────────────────┐
│  ⑩ XHR 劫持捕获签到响应                                     │
│  ⑪ 解析签到结果 (成功/失败 + 原因)                           │
│  ⑫ 通过 evalJS 回传至原生 App 展示                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 快速开始

### 环境要求

| 工具 | 版本 | 用途 |
|:---|:---|:---|
| [HBuilderX](https://www.dcloud.io/hbuilderx.html) | 最新版 | IDE & 构建工具 |
| Android 设备 | 5.0+ | 运行环境 |
| iOS 设备 | 12.0+ | 运行环境 |

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/atvkh/GDCVI-Geolocation-Hook-POC.git

# 2. 使用 HBuilderX 打开项目

# 3. 运行到设备
#    运行 → 运行到手机或模拟器 → 选择目标设备

# 4. 自定义打包
#    发行 → 原生App-云打包 → 配置签名 → 打包
```

---

## 功能详解

### 🏠 首页 · TabHome

| 功能 | 描述 |
|:---|:---|
| 链接输入 | 支持手动输入或剪贴板提取 |
| 矩阵库 | 多人员链接管理，支持 CRUD 操作 |
| 安全探针 | 实时显示设备指纹掩码与坐标扰动状态 |
| 极速打卡 | 一键触发注入与签到流程 |

### 📊 历史记录 · TabHistory

| 功能 | 描述 |
|:---|:---|
| 签到列表 | 展示时间、坐标、状态 |
| 失败原因 | 显示服务端返回的错误信息 |
| 统计面板 | 成功/失败/本周计数 |
| 数据导出 | 复制到剪贴板 |

### ⚙️ 设置 · TabSettings

| 功能 | 描述 |
|:---|:---|
| 坐标输入 | 手动输入经纬度 |
| 预设点管理 | 下拉选择 + 长按编辑 |
| 双模式 | 随机预设点 / 锁定坐标 |
| 自定义预设 | 新增/编辑/删除预设点 |
| 校区切换 | 一键切换校区 |
| 学校管理 | 添加/编辑/删除学校 |

### 🏫 学校管理

| 功能 | 描述 |
|:---|:---|
| 添加学校 | 自定义学校名称、校区、预设点 |
| 编辑学校 | 修改学校信息和预设点 |
| 删除学校 | 删除自定义学校（预置学校不可删） |
| 主题色 | 8 种主题色可选 |
| 坐标拾取 | 内置腾讯地图坐标拾取器链接 |

---

## 版本记录

### v11.1.0 (当前版本)

```
✦ 新增多学校管理功能
✦ 支持自定义添加/编辑/删除学校
✦ 每所学校支持最多 3 个校区
✦ 8 种主题色可选，动态切换
✦ 内置腾讯地图坐标拾取器链接
✦ 优化校区切换交互
```

### v11.0.0

```
✦ 修复 weekCount 计算逻辑 bug
✦ 修复 showCoordSheet 未定义问题
✦ 统一版本号管理
✦ 优化错误处理 (添加日志记录)
✦ 组件化重构 (TabHistory / TabSettings)
✦ CSS 提取到独立文件
✦ 添加 package.json 和 ESLint 配置
✦ 重写 README.md
```

### v10.9.0

```
✦ 初始版本发布
✦ 基础定位 Hook 功能
✦ XHR 劫持与结果回传
```

---

## 技术指标

| 指标 | 数值 |
|:---|:---|
| 代码文件数 | 15 |
| 总代码行数 | ~3,500 |
| npm 依赖数 | 0 |
| 包体积 | ~17.7 MB |
| 注入成功率 | 99.2%* |
| 平均注入延迟 | <500ms* |

*基于测试环境数据

---

## 免责声明

> ⚠️ **本项目仅供前端安全技术研究与合法授权的安全测试使用。**

- 请勿将本项目用于任何违反法律法规或学校规章制度的用途
- 使用者应确保在合法授权范围内进行安全测试
- 因不当使用造成的任何后果，由使用者自行承担全部责任
- 本项目不提供任何明示或暗示的担保

---

<div align="center">

**[GitHub](https://github.com/atvkh/GDCVI-Geolocation-Hook-POC)** · **[Issues](https://github.com/atvkh/GDCVI-Geolocation-Hook-POC/issues)** · **[Releases](https://github.com/atvkh/GDCVI-Geolocation-Hook-POC/releases)**

<br>

Made with ☕ & 🛡️

<br>

![Visitors](https://api.visitorbadge.io/api/visitors?path=atvkh%2FGDCVI-Geolocation-Hook-POC&countColor=%2300d4ff&style=for-the-badge)

</div>
