---
title: Get a Free Bilibili Image Host in 1 Minute
date: 2026-01-18
description: Spend $0 and get fast global image delivery
tags:
  - daily
  - image-hosting
  - cdn
---

**⚠️ Disclaimer: This article is for technical learning and research only. Do not use it for any illegal purpose or abusive behavior. You must comply with applicable laws/regulations and the platform’s terms of service. Any consequences caused by improper use are solely your responsibility.**

---

## Technical principle

At its core, this is a technique that leverages characteristics of Bilibili’s image upload interface. By calling Bilibili’s public upload API, you can store image assets on Bilibili’s servers and take advantage of its CDN to distribute content globally, resulting in fast and stable hotlinkable image URLs.

## How to call the API

### API endpoint

```
POST https://api.bilibili.com/x/upload/web/image
```

### Request example

```bash
curl -X POST "https://api.bilibili.com/x/upload/web/image" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -b "SESSDATA=your_SESSDATA;bili_jct=your_BILI_JCT" \
  -F "bucket=live" \
  -F "csrf=your_BILI_JCT" \
  -F "file=@image.png;filename=image.png"
```

### Parameter notes

| Parameter | Type     | Description                               |
| --------- | -------- | ----------------------------------------- |
| SESSDATA  | Cookie   | Bilibili user session identifier          |
| bili_jct  | Cookie   | Bilibili CSRF token                       |
| bucket    | FormData | Storage bucket; typically set to `live`   |
| csrf      | FormData | CSRF check; value is the same as bili_jct |
| file      | FormData | Image file                                |

### Response format

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

### Response fields

| Field        | Type    | Description             |
| ------------ | ------- | ----------------------- |
| code         | Integer | Status code; 0 means OK |
| message      | String  | Response message        |
| image_url    | String  | Image URL               |
| image_width  | Integer | Image width (pixels)    |
| image_height | Integer | Image height (pixels)   |

---

## Image style parameters explained

Bilibili’s image host supports real-time processing via URL parameters, including resizing, cropping, format conversion, and quality compression.

### Common style examples

| Style type                  | URL format                                 | Notes                                  |
| --------------------------- | ------------------------------------------ | -------------------------------------- |
| Original                    | `baseURL/example.jpg`                      | Keep original size and quality         |
| Compress quality (same res) | `baseURL/example.jpg@1e_1c.jpg`            | Same resolution, lower quality         |
| Fixed width, auto height    | `baseURL/example.jpg@104w_1e_1c.jpg`       | Fixed width, proportional scaling      |
| Fixed height, auto width    | `baseURL/example.jpg@104h_1e_1c.jpg`       | Fixed height, proportional scaling     |
| Fixed w/h + compress        | `baseURL/example.jpg@104w_104h_1e_1c.jpg`  | Fixed dimensions + quality compression |
| WebP (smallest)             | `baseURL/example.jpg@1e_1c.webp`           | WebP at original resolution            |
| WebP with size              | `baseURL/example.jpg@104w_104h_1e_1c.webp` | WebP at fixed dimensions               |

### Parameter grammar

**Pattern:**

```
(image_original_url)@(\d+[whsepqoc]_?)*(\.(webp|gif|png|jpg|jpeg))?$
```

### Parameter reference

| Parameter | Range                    | Description                                                                                                                                                                            |
| --------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **w**     | [1, 9223372036854775807] | Width in pixels                                                                                                                                                                        |
| **h**     | [1, 9223372036854775807] | Height in pixels                                                                                                                                                                       |
| **s**     | [1, 9223372036854775807] | Unknown parameter (needs further research)                                                                                                                                             |
| **e**     | [0, 2]                   | Resize mode (resize)<br>• 0: keep aspect ratio, choose the smaller value<br>• 1: keep aspect ratio, choose the larger value<br>• 2: do not keep aspect ratio (cannot be used with `c`) |
| **p**     | [1, 1000]                | Scale factor; default 100 (cannot be used with `c`)                                                                                                                                    |
| **q**     | [1, 100]                 | Image quality; default 75                                                                                                                                                              |
| **o**     | [0, 1]                   | Unknown parameter (needs further research)                                                                                                                                             |
| **c**     | [0, 1]                   | Crop mode (clip)<br>• 0: default<br>• 1: crop mode                                                                                                                                     |

### Format suffix

Supported formats:

- `webp` - recommended; smallest size
- `png` - lossless
- `jpeg` / `jpg` - lossy compression
- `gif` - animated format
- If omitted, the original format is preserved

### Notes

1. **Parameters are case-insensitive**
2. **If the same parameter appears multiple times, the last one wins**
3. **The computed width×height must not exceed the original image size**, otherwise the width/height parameters will not take effect
4. **WebP is recommended** for the best compression ratio

---

## Related tools/projects

### bilibili-img-uploader

This is a mature browser extension that has been running stably for **6 years**, providing an easy way to upload images to Bilibili and get shareable links.

#### Project info

- **Repo**: [https://github.com/xlzy520/bilibili-img-uploader](https://github.com/xlzy520/bilibili-img-uploader)
- **License**: MIT License
- **Project status (at the time of writing)**: ⭐ 406+ Stars | 39+ Forks
- **Tech stack**: Vue 3 + TypeScript + Vite

#### Supported platforms

| Browser | Install                                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Chrome  | [Chrome Web Store](https://chrome.google.com/webstore/detail/b%E7%AB%99%E5%9B%BE%E5%BA%8A/domljbndjbjgpkhdbmfgmiclggdfojnd?hl=zh-CN) |
| Edge    | [Chrome Web Store](https://chrome.google.com/webstore/detail/b%E7%AB%99%E5%9B%BE%E5%BA%8A/domljbndjbjgpkhdbmfgmiclggdfojnd?hl=zh-CN) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/addon/%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9%E5%9B%BE%E5%BA%8A/)                          |

#### Key features

**Automatic cookie reading** - no need to manually configure SESSDATA and bili_jct  
**Multiple output formats** - supports WebP, JPEG, PNG, etc.  
**Live preview** - preview before uploading  
**Batch upload** - upload multiple images at once  
**Quick copy** - one-click copy for image links  
**Short link generation** - converts to Bilibili short links

#### Web version

If you do not want to install a browser extension, there is also a web version:

- **URL**: [https://www.xiaojuzi.fun/bili-short-url/upload.html](https://www.xiaojuzi.fun/bili-short-url/upload.html)
- **Note**: you must manually provide SESSDATA and bili_jct

#### Local development

```bash
# Install deps
pnpm install

# Dev mode (HMR)
pnpm run dev

# Production build
pnpm run build
```

After building, enable Developer Mode on `chrome://extensions/` and load the `extension` folder.

---

## ⚠️ Important notes

### API stability warning

According to the project’s issue history, Bilibili adjusted the image upload interface in **December 2023**, which shortened the validity period of the returned image links to **45 minutes**. Although the project has since updated to use the new interface, you should still keep in mind:

1. **Availability is not guaranteed** - Bilibili may change or close the interface at any time
2. **Permanence is not guaranteed** - keep local backups for important images
3. **Do not abuse it** - large-volume uploads can lead to account restrictions

### Cookie security

- SESSDATA and bili_jct are sensitive; keep them safe
- Do not paste cookies on public computers or untrusted websites
- Regularly change your Bilibili password to protect your account

---

## Hotlink protection workarounds

Bilibili’s image host has hotlink protection. If you embed images directly on other sites, they may fail to load. Here are two approaches:

### Option 1: Disable referrer site-wide

Add this in your HTML `<head>`:

```html
<meta name="referrer" content="no-referrer" />
```

Then all requests from your site will not carry the `referrer` header.

### Option 2: Handle per-link

For a single link, you can use `rel="noreferrer"`:

```html
<a href="IMAGE_URL" rel="noreferrer" target="_blank">
  <img src="IMAGE_URL" alt="Description" />
</a>
```

**Note**: `window.open` will include `referrer` by default, so you need special handling.

---

## References

Most of the technical info in this post comes from:

- [xlzy520/bilibili-img-uploader](https://github.com/xlzy520/bilibili-img-uploader) - open-source browser extension
- [SocialSisterYi/bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect) - Bilibili API documentation collection

---

## Acknowledgements

Thanks to [@xlzy520](https://github.com/xlzy520) and all contributors for maintaining and updating this project over the years. If you find it useful, consider giving it a ⭐.

---

**One more reminder**: This document is only for technical research and learning. Please follow platform rules and use these techniques legally and responsibly. Any consequences caused by abuse are solely your responsibility.
