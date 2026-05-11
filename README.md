<div align="center">

# 幻签

**GDCVI Geolocation Hook POC**

广东建设职业技术学院晚查寝系统 · 定位风控绕过概念验证

[![Version](https://img.shields.io/badge/version-11.0-blue.svg)](https://github.com/atvkh/GDCVI-Geolocation-Hook-POC)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883.svg)](https://vuejs.org/)
[![Uni-App](https://img.shields.io/badge/Uni--App-Vue3-2B9939.svg)](https://uniapp.dcloud.io/)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

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

幻签是一款基于 JS Proxy 深度拦截移动端 WebView 地理定位 API 的概念验证项目，旨在研究移动端 H5 应用定位风控机制的安全性。通过高斯随机抖动模拟真实 GPS 硬件噪声，结合函数指纹脱敏对抗静态代码检测，实现对晚查寝签到系统定位风控的绕过。

## 核心特性

| 特性 | 描述 |
| :--- | :--- |
| 🛰️ **定位 Hook** | 拦截 `navigator.geolocation` 及腾讯地图 `qq.maps.Geolocation`，回传伪造坐标 |
| 📡 **GPS 噪声模拟** | 高斯分布随机漂移经纬度与精度，规避"绝对静止"风控检测 |
| 🔐 **指纹脱敏** | Proxy 伪装被 Hook 方法，`toString()` 返回 `[native code]` 对抗静态扫描 |
| 🔄 **XHR 劫持** | 截获签到请求返回值，自动识别签到结果并回传展示 |
| 🏫 **校区切换** | 支持清远 / 广州校区一键切换，各校区独立预设点管理 |
| 📍 **预设坐标** | 每校区 5 个预设点，支持自定义增删改，支持随机 / 锁定两种模式 |
| 📋 **历史记录** | 持久化存储签到时间、坐标、状态及服务端返回信息，支持导出 |
| 👥 **矩阵库** | 多人员链接管理，支持快速录入、更新、删除预设人员信息 |

## 技术架构

| 层级 | 技术方案 |
| :--- | :--- |
| **前端框架** | Uni-App (Vue 3) |
| **Hook 引擎** | 原生 JS Proxy / `evalJS` 动态注入 |
| **存储方案** | `uni.setStorageSync` 本地持久化 |
| **UI 风格** | 赛博朋克暗色主题 (Material Symbols 图标) |
| **构建目标** | Android / iOS 原生 App |

## 项目结构

```
智能打卡/
├── pages/
│   └── index/
│       └── index.vue          # 主页面 (Tab 导航 + WebView)
├── components/
│   ├── TabHome.vue            # 首页 - 打卡操作 & 矩阵库
│   ├── TabHistory.vue         # 历史记录 - 签到状态追踪
│   └── TabSettings.vue        # 设置 - 坐标配置 & 预设点管理
├── utils/
│   ├── constants.js           # 常量定义 (版本/预设点/配置)
│   └── injectScript.js        # 核心 Hook 脚本生成器
├── static/
│   ├── logo.png               # 应用图标
│   └── fonts/
│       └── MaterialSymbolsOutlined.woff2
├── App.vue                    # 应用入口
├── main.js                    # 主入口 (Vue 3 SSR 模式)
├── manifest.json              # Uni-App 应用配置
├── pages.json                 # 页面路由与导航栏配置
└── uni.scss                   # 全局样式变量
```

## 运行机制

```
┌─────────────────────────────────────────────────────────┐
│                    幻签 运行流程                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ① 令牌截获                                             │
│  │  物理断网 → 截获带 OAuth code 鉴权参数的纯净 URL      │
│  ▼                                                      │
│  ② 环境注入                                             │
│  │  evalJS 多轮重试 → 注入脚本 → 接管底层定位 API        │
│  ▼                                                      │
│  ③ 数据伪造                                             │
│  │  拦截定位请求 → 回传含高斯噪声的伪造坐标               │
│  ▼                                                      │
│  ④ 结果回传                                             │
│     劫持 XHR → 解析签到结果 → 回传至原生 App 展示        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Hook 覆盖范围：**

- `Geolocation.prototype.getCurrentPosition` / `watchPosition`
- `navigator.geolocation.getCurrentPosition`
- `qq.maps.Geolocation` (腾讯地图 H5 定位)
- `HTMLIFrameElement.prototype.src` (拦截定位 iframe)
- `window.addEventListener('message', ...)` (过滤定位消息)
- `Function.prototype.toString` (指纹脱敏全局伪装)

## 快速开始

### 环境要求

- [HBuilderX](https://www.dcloud.io/hbuilderx.html) (推荐最新版)
- Android / iOS 设备或模拟器

### 构建与运行

1. **克隆项目**

   ```bash
   git clone https://github.com/atvkh/GDCVI-Geolocation-Hook-POC.git
   ```

2. **使用 HBuilderX 打开项目目录**

3. **运行到设备**

   - 点击 `运行` → `运行到手机或模拟器` → 选择目标设备

4. **自定义打包**

   - 点击 `发行` → `原生App-云打包` → 配置签名信息 → 打包

### 配置说明

- **预设坐标**：编辑 [utils/constants.js](utils/constants.js) 中的 `QINGYUAN_PRESETS` 和 `GUANGZHOU_PRESETS` 数组
- **注入参数**：调整 `INJECT_MAX_ATTEMPTS` (最大重试次数) 和 `INJECT_INTERVAL_MS` (重试间隔) 以适配不同网络环境
- **历史记录上限**：修改 `MAX_HISTORY_RECORDS` 控制本地存储条数

## 功能详解

### 🏠 首页 (TabHome)

- 输入或从剪贴板提取带鉴权参数的签到链接
- 矩阵库管理：批量录入多人链接，支持快速选择、更新、删除
- 环境安全探针：实时显示设备指纹掩码与坐标扰动状态

### 📊 历史记录 (TabHistory)

- 展示签到历史列表，包含时间、坐标、成功/失败状态
- 失败记录展示服务端返回原因
- 统计面板：成功/失败计数及本周打卡汇总
- 支持历史数据导出

### ⚙️ 坐标配置 (TabSettings)

- 手动输入目标经纬度
- 快捷预设点选择 (下拉列表 + 长按编辑)
- 随机预设点 / 锁定坐标双模式切换
- 新增自定义预设点 (名称 + 经纬度)
- 一键恢复默校区默认坐标

### 🔄 校区切换

- 清远校区：5 个预设定位点
- 广州校区：5 个预设定位点
- 主题色随校区自动切换

## 版本记录

### v11.0.0

- 修复历史记录不显示问题
- 全局 UI 重构 (赛博朋克暗色主题)
- 新增校区切换功能 (清远 / 广州)
- 新增预设点管理 (增删改)
- 新增矩阵库 (多人员链接管理)
- 优化注入脚本稳定性


## 免责声明

⚠️ **本项目仅供前端安全技术研究与合法授权的安全测试使用。**

- 请勿将本项目用于任何违反法律法规或学校规章制度的用途
- 使用者应确保在合法授权范围内进行安全测试
- 因不当使用造成的任何后果，由使用者自行承担全部责任
- 本项目不提供任何明示或暗示的担保

---

<div align="center">

**[GitHub](https://github.com/atvkh/GDCVI-Geolocation-Hook-POC)** · Made with ☕ & 🛡️

</div>
