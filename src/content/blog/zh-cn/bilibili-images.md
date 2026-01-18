---
title: 1分钟教你白嫖B站图床
date: 2026-01-18
description: 不花1分钱，全球快速分发你的图片
tags:
  - 日更
  - 图床
  - 分发
---
**⚠️ 免责声明：本文内容仅供技术学习和研究使用,请勿用于任何非法用途或滥用行为。使用者应当遵守相关法律法规和平台服务条款,由使用不当引发的任何后果由使用者自行承担。**

---

##  技术原理

本质上,这就是一个利用B站图片上传接口特性的技术方案。通过调用B站的公开上传API,将图片资源存储到B站服务器,并借助其强大的CDN网络实现全球内容分发,从而获得高速、稳定的图片外链服务。

## 接口调用方法

### API端点

```
POST https://api.bilibili.com/x/upload/web/image
```

### 请求示例

```bash
curl -X POST "https://api.bilibili.com/x/upload/web/image" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -b "SESSDATA=你的SESSDATA;bili_jct=你的BILI_JCT" \
  -F "bucket=live" \
  -F "csrf=你的BILI_JCT" \
  -F "file=@image.png;filename=image.png"
```

### 如何获取 SESSDATA 和 BILI_JCT

1. 打开哔哩哔哩首页并确保已登录。
2. 按 `F12` 打开浏览器开发者工具。
3. 切换到 **Application（应用）** 标签页。
4. 在左侧 **Storage → Cookies** 中选择 `*.bilibili.com` 域名。
5. 在 Cookie 列表中找到 `SESSDATA` 和 `BILI_JCT`，其 `Value` 即所需值。

### 参数说明

| 参数       | 类型       | 说明                |
| -------- | -------- | ----------------- |
| SESSDATA | Cookie   | B站用户会话标识          |
| bili_jct | Cookie   | B站CSRF令牌          |
| bucket   | FormData | 存储桶,通常填写`live`    |
| csrf     | FormData | CSRF验证,值同bili_jct |
| file     | FormData | 图片文件              |

### 响应格式

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "image_url": "http://i0.hdslb.com/bfs/album/104c4f1ae6b66d78a5952a191281ec7883dc5c5c.jpg",
        "image_width": 818,
        "image_height": 1000
    }
}
```

### 响应字段说明

|字段|类型|说明|
|---|---|---|
|code|Integer|状态码,0表示成功|
|message|String|响应消息|
|image_url|String|图片访问URL|
|image_width|Integer|图片宽度(像素)|
|image_height|Integer|图片高度(像素)|

---

## 图片样式参数详解

B站的图床支持通过URL参数对图片进行实时处理,包括缩放、裁剪、格式转换、质量压缩等操作。

### 常用样式示例

|样式类型|URL格式|说明|
|---|---|---|
|原图|`baseURL/example.jpg`|保持原始尺寸和质量|
|原分辨率质量压缩|`baseURL/example.jpg@1e_1c.jpg`|保持分辨率,降低质量|
|指定宽度自适应|`baseURL/example.jpg@104w_1e_1c.jpg`|固定宽度,高度等比缩放|
|指定高度自适应|`baseURL/example.jpg@104h_1e_1c.jpg`|固定高度,宽度等比缩放|
|指定宽高压缩|`baseURL/example.jpg@104w_104h_1e_1c.jpg`|固定宽高,质量压缩|
|WebP格式(最小体积)|`baseURL/example.jpg@1e_1c.webp`|原分辨率WebP格式|
|指定尺寸WebP|`baseURL/example.jpg@104w_104h_1e_1c.webp`|固定尺寸WebP格式|

### 参数语法规则

**格式模式：**

```
(图像原链接)@(\d+[whsepqoc]_?)*(\.(webp|gif|png|jpg|jpeg))?$
```

### 参数详细说明

| 参数    | 取值范围                     | 说明                                                                    |
| ----- | ------------------------ | --------------------------------------------------------------------- |
| **w** | [1, 9223372036854775807] | 宽度(width),单位:像素                                                       |
| **h** | [1, 9223372036854775807] | 高度(height),单位:像素                                                      |
| **s** | [1, 9223372036854775807] | 未知参数(待研究)                                                             |
| **e** | [0, 2]                   | 缩放模式(resize)<br>• 0: 保留比例取较小值<br>• 1: 保留比例取较大值<br>• 2: 不保留原比例(不可与c混用) |
| **p** | [1, 1000]                | 放大倍数,默认100(不可与c混用)                                                    |
| **q** | [1, 100]                 | 图像质量(quality),默认75                                                    |
| **o** | [0, 1]                   | 未知参数(待研究)                                                             |
| **c** | [0, 1]                   | 裁剪模式(clip)<br>• 0: 默认模式<br>• 1: 裁剪模式                                  |

### 格式后缀

支持以下图片格式:

- `webp` - 推荐使用,体积最小
- `png` - 无损格式
- `jpeg` / `jpg` - 有损压缩
- `gif` - 动图格式
- 不指定则保留原格式

### 使用注意事项

1. **参数不区分大小写**
2. **相同参数后者覆盖前者**
3. **计算后的实际宽×高不能超过原图尺寸**,否则宽高参数将失效
4. **推荐使用WebP格式**以获得最佳压缩比

---

## 相关工具项目

### bilibili-img-uploader

这是一个功能完善的浏览器扩展工具,已稳定运行**6年**,为用户提供便捷的B站图床上传服务。

#### 项目信息

- **项目地址**: [https://github.com/xlzy520/bilibili-img-uploader](https://github.com/xlzy520/bilibili-img-uploader)
- **开源协议**: MIT License
- 截至文章发布前的**项目状态**: ⭐ 406+ Stars |  39+ Forks
- **技术栈**: Vue 3 + TypeScript + Vite

#### 插件支持平台

|浏览器|安装方式|
|---|---|
|Chrome|[Chrome Web Store](https://chrome.google.com/webstore/detail/b%E7%AB%99%E5%9B%BE%E5%BA%8A/domljbndjbjgpkhdbmfgmiclggdfojnd?hl=zh-CN)|
|Edge|[Chrome Web Store](https://chrome.google.com/webstore/detail/b%E7%AB%99%E5%9B%BE%E5%BA%8A/domljbndjbjgpkhdbmfgmiclggdfojnd?hl=zh-CN)|
|Firefox|[Firefox Add-ons](https://addons.mozilla.org/addon/%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9%E5%9B%BE%E5%BA%8A/)|

#### 核心功能特性

**自动Cookie读取** - 无需手动配置SESSDATA和bili_jct  
 **多种压缩格式** - 支持WebP、JPEG、PNG等多种输出格式  
 **实时预览** - 上传前可预览图片效果  
 **批量上传** - 支持多图片同时上传  
 **快速复制** - 一键复制图片链接  
 **短链生成** - 支持B站短链接转换

#### Web在线版

如果不想安装浏览器扩展,也可以使用Web版本:

- **地址**: [https://www.xiaojuzi.fun/bili-short-url/upload.html](https://www.xiaojuzi.fun/bili-short-url/upload.html)
- **注意**: 需要手动填写SESSDATA和bili_jct

#### 本地开发指南

```bash
# 安装依赖
pnpm install

# 开发模式(支持热更新)
pnpm run dev

# 生产构建
pnpm run build
```

构建完成后,在`chrome://extensions/`页面开启开发者模式,加载`extension`文件夹即可。

---

## ⚠️ 重要注意事项

### 接口稳定性警告

根据项目issue记录,B站曾在**2023年12月**调整过图片上传接口,导致原有接口返回的图片链接有效期缩短至**45分钟**。虽然项目已更新为使用新接口,但仍需注意:

1. **接口可用性存在不确定性** - B站可能随时调整或关闭该接口
2. **图片永久性无法保证** - 建议重要图片做好本地备份
3. **请勿滥用** - 大量上传可能导致账号受限

### Cookie安全提示

- SESSDATA和bili_jct是敏感信息,请妥善保管
- 不要在公共场合或不信任的网站填写Cookie信息
- 定期更换B站密码以保证账号安全

---

##  防盗链解决方案

B站图床有防盗链机制,直接在其他网站引用可能无法显示。以下是两种解决方案:

### 方案一: 全站禁用Referrer

在HTML的`<head>`标签中添加:

```html
<meta name="referrer" content="no-referrer">
```

这样全站所有资源请求都不会携带referrer信息。

### 方案二: 单链接处理

对于单个链接,可以使用`rel="noreferrer"`属性:

```html
<a href="图片地址" rel="noreferrer" target="_blank">
  <img src="图片地址" alt="描述">
</a>
```

**注意**: 使用`window.open`打开链接时默认会携带referrer,需要特别处理。

---

## 📚 技术参考

本文档整理的技术信息主要参考自:

- [xlzy520/bilibili-img-uploader](https://github.com/xlzy520/bilibili-img-uploader) - 开源浏览器扩展项目
- [SocialSisterYi/bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect) - B站API文档收集项目

---

## 🤝 致谢

感谢 [@xlzy520](https://github.com/xlzy520) 及所有贡献者多年来对该项目的维护和更新。如果您觉得该项目有价值,欢迎为其点亮Star⭐以示支持!

---

**最后再次提醒**: 本文档内容仅用于技术研究和学习交流,请遵守平台规则,合理合法使用相关技术。任何滥用行为造成的后果由使用者自行承担。