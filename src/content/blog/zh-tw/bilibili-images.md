---
title: 1 分鐘教你免費用 B 站圖床
date: 2026-01-18
description: 不花 1 分錢，全球快速分發你的圖片
tags:
  - 日更
  - 圖床
  - 分發
commentId: /blog/bilibili-image
---

**⚠️ 免責聲明：本文內容僅供技術學習與研究使用，請勿用於任何非法用途或濫用行為。使用者應遵守相關法律法規與平台服務條款；因使用不當引發的任何後果，由使用者自行承擔。**

---

## 技術原理

本質上，這是一個利用 B 站圖片上傳介面特性的技術方案。透過呼叫 B 站的公開上傳 API，將圖片資源儲存在 B 站伺服器，並借助其強大的 CDN 網路實現全球內容分發，從而獲得高速、穩定的圖片外鏈服務。

## 介面呼叫方法

### API 端點

```
POST https://api.bilibili.com/x/upload/web/image
```

### 請求示例

```bash
curl -X POST "https://api.bilibili.com/x/upload/web/image" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -b "SESSDATA=你的SESSDATA;bili_jct=你的BILI_JCT" \
  -F "bucket=live" \
  -F "csrf=你的BILI_JCT" \
  -F "file=@image.png;filename=image.png"
```

### 如何取得 SESSDATA 和 BILI_JCT

1. 打開哔哩哔哩首頁並確保已登入。
2. 按 `F12` 打開瀏覽器開發者工具。
3. 切換到 **Application（應用）** 分頁。
4. 在左側 **Storage → Cookies** 中選擇 `*.bilibili.com` 網域。
5. 在 Cookie 清單中找到 `SESSDATA` 和 `BILI_JCT`，其 `Value` 即為所需值。

### 參數說明

| 參數     | 類型     | 說明                     |
| -------- | -------- | ------------------------ |
| SESSDATA | Cookie   | B 站使用者會話標識       |
| bili_jct | Cookie   | B 站 CSRF 令牌           |
| bucket   | FormData | 儲存桶，通常填 `live`    |
| csrf     | FormData | CSRF 驗證，值同 bili_jct |
| file     | FormData | 圖片檔案                 |

### 回應格式

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

### 回應欄位說明

| 欄位         | 類型    | 說明               |
| ------------ | ------- | ------------------ |
| code         | Integer | 狀態碼，0 表示成功 |
| message      | String  | 回應訊息           |
| image_url    | String  | 圖片存取 URL       |
| image_width  | Integer | 圖片寬度（像素）   |
| image_height | Integer | 圖片高度（像素）   |

---

## 圖片樣式參數詳解

B 站的圖床支援透過 URL 參數對圖片進行即時處理，包括縮放、裁切、格式轉換、品質壓縮等操作。

### 常用樣式示例

| 樣式類型              | URL 格式                                   | 說明                   |
| --------------------- | ------------------------------------------ | ---------------------- |
| 原圖                  | `baseURL/example.jpg`                      | 保持原始尺寸與品質     |
| 原解析度品質壓縮      | `baseURL/example.jpg@1e_1c.jpg`            | 保持解析度，降低品質   |
| 指定寬度自適應        | `baseURL/example.jpg@104w_1e_1c.jpg`       | 固定寬度，高度等比縮放 |
| 指定高度自適應        | `baseURL/example.jpg@104h_1e_1c.jpg`       | 固定高度，寬度等比縮放 |
| 指定寬高壓縮          | `baseURL/example.jpg@104w_104h_1e_1c.jpg`  | 固定寬高，品質壓縮     |
| WebP 格式（最小體積） | `baseURL/example.jpg@1e_1c.webp`           | 原解析度 WebP 格式     |
| 指定尺寸 WebP         | `baseURL/example.jpg@104w_104h_1e_1c.webp` | 固定尺寸 WebP 格式     |

### 參數語法規則

**格式模式：**

```
(圖像原連結)@(\d+[whsepqoc]_?)*(\.(webp|gif|png|jpg|jpeg))?$
```

### 參數詳細說明

| 參數  | 取值範圍                 | 說明                                                                                                         |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **w** | [1, 9223372036854775807] | 寬度（width），單位：像素                                                                                    |
| **h** | [1, 9223372036854775807] | 高度（height），單位：像素                                                                                   |
| **s** | [1, 9223372036854775807] | 未知參數（待研究）                                                                                           |
| **e** | [0, 2]                   | 縮放模式（resize）<br>• 0：保留比例取較小值<br>• 1：保留比例取較大值<br>• 2：不保留原比例（不可與 `c` 混用） |
| **p** | [1, 1000]                | 放大倍數，預設 100（不可與 `c` 混用）                                                                        |
| **q** | [1, 100]                 | 圖像品質（quality），預設 75                                                                                 |
| **o** | [0, 1]                   | 未知參數（待研究）                                                                                           |
| **c** | [0, 1]                   | 裁切模式（clip）<br>• 0：預設模式<br>• 1：裁切模式                                                           |

### 格式後綴

支援以下圖片格式：

- `webp` - 推薦使用，體積最小
- `png` - 無損格式
- `jpeg` / `jpg` - 有損壓縮
- `gif` - 動圖格式
- 不指定則保留原格式

### 使用注意事項

1. **參數不區分大小寫**
2. **相同參數後者覆蓋前者**
3. **計算後的實際寬×高不能超過原圖尺寸**，否則寬高參數將失效
4. **推薦使用 WebP 格式**以獲得最佳壓縮比

---

## 相關工具專案

### bilibili-img-uploader

這是一個功能完善的瀏覽器擴充套件，已穩定運行 **6 年**，為使用者提供方便的 B 站圖床上傳服務。

#### 專案資訊

- **專案地址**：<https://github.com/xlzy520/bilibili-img-uploader>
- **開源協議**：MIT License
- 截至文章發布前的 **專案狀態**：⭐ 406+ Stars | 39+ Forks
- **技術棧**：Vue 3 + TypeScript + Vite

#### 外掛支援平台

| 瀏覽器  | 安裝方式                                                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Chrome  | [Chrome Web Store](https://chrome.google.com/webstore/detail/b%E7%AB%99%E5%9B%BE%E5%BA%8A/domljbndjbjgpkhdbmfgmiclggdfojnd?hl=zh-CN) |
| Edge    | [Chrome Web Store](https://chrome.google.com/webstore/detail/b%E7%AB%99%E5%9B%BE%E5%BA%8A/domljbndjbjgpkhdbmfgmiclggdfojnd?hl=zh-CN) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/addon/%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9%E5%9B%BE%E5%BA%8A/)                          |

#### 核心功能特色

**自動讀取 Cookie** - 無需手動配置 SESSDATA 和 bili_jct  
**多種輸出格式** - 支援 WebP、JPEG、PNG 等多種格式  
**即時預覽** - 上傳前可預覽圖片效果  
**批次上傳** - 支援多圖片同時上傳  
**快速複製** - 一鍵複製圖片連結  
**短連結生成** - 支援 B 站短連結轉換

#### Web 線上版

如果不想安裝瀏覽器擴充套件，也可以使用 Web 版本：

- **地址**：<https://www.xiaojuzi.fun/bili-short-url/upload.html>
- **注意**：需要手動填寫 SESSDATA 和 bili_jct

#### 本地開發指南

```bash
# 安裝相依套件
pnpm install

# 開發模式（支援熱更新）
pnpm run dev

# 生產建置
pnpm run build
```

建置完成後，在 `chrome://extensions/` 頁面開啟 Developer Mode，載入 `extension` 資料夾即可。

---

## ⚠️ 重要注意事項

### 介面穩定性警告

根據專案 issue 記錄，B 站曾在 **2023 年 12 月** 調整過圖片上傳介面，導致原有介面返回的圖片連結有效期縮短至 **45 分鐘**。雖然專案已更新為使用新介面，但仍需注意：

1. **介面可用性存在不確定性** - B 站可能隨時調整或關閉該介面
2. **圖片永久性無法保證** - 建議重要圖片做好本地備份
3. **請勿濫用** - 大量上傳可能導致帳號受限

### Cookie 安全提示

- SESSDATA 和 bili_jct 是敏感資訊，請妥善保管
- 不要在公共場合或不信任的網站填寫 Cookie
- 定期更換 B 站密碼以保障帳號安全

---

## 防盜鏈解決方案

B 站圖床有防盜鏈機制，直接在其他網站引用可能無法顯示。以下是兩種解決方案：

### 方案一：全站禁用 Referrer

在 HTML 的 `<head>` 標籤中加入：

```html
<meta name="referrer" content="no-referrer" />
```

這樣全站所有資源請求都不會攜帶 referrer 資訊。

### 方案二：單連結處理

對單個連結可使用 `rel="noreferrer"`：

```html
<a href="圖片地址" rel="noreferrer" target="_blank">
  <img src="圖片地址" alt="描述" />
</a>
```

**注意**：使用 `window.open` 開啟連結時預設會攜帶 referrer，需要特別處理。

---

## 📚 技術參考

本文整理的技術資訊主要參考自：

- [xlzy520/bilibili-img-uploader](https://github.com/xlzy520/bilibili-img-uploader) - 開源瀏覽器擴充套件專案
- [SocialSisterYi/bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect) - B 站 API 文件收集專案

---

## 🤝 致謝

感謝 [@xlzy520](https://github.com/xlzy520) 及所有貢獻者多年來對該專案的維護與更新。若你覺得有幫助，歡迎點個 ⭐ 支持。

---

**最後再次提醒**：本文內容僅用於技術研究與學習交流，請遵守平台規則，合理合法使用相關技術。任何濫用行為造成的後果由使用者自行承擔。
