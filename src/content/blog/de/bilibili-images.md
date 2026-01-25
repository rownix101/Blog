---
title: In 1 Minute kostenloses Bilibili Bildhosting bekommen
date: 2026-01-18
description: $0 ausgeben und weltweit schnelle Bildauslieferung erhalten
tags:
  - taeglich
  - bildhosting
  - cdn
commentId: /blog/bilibili-image-hosting-is-dead
---

**⚠️ Hinweis: Dieser Artikel dient nur dem technischen Lernen und der Forschung. Nicht fuer illegale Zwecke oder missbraeuchliches Verhalten verwenden. Du musst geltende Gesetze/Vorschriften und die Nutzungsbedingungen der Plattform einhalten. Folgen aus unsachgemaesser Nutzung liegen ausschliesslich in deiner Verantwortung.**

---

## Technisches Prinzip

Im Kern ist das eine Technik, die Eigenschaften von Bilibilis Bild-Upload-Schnittstelle ausnutzt. Durch Aufruf der oeffentlichen Upload-API kannst du Bilddateien auf Bilibilis Servern speichern und deren CDN nutzen, um Inhalte global zu verteilen. Ergebnis: schnelle und stabile, hotlink-faehige Bild-URLs.

## So rufst du die API auf

### API-Endpoint

```
POST https://api.bilibili.com/x/upload/web/image
```

### Request-Beispiel

```bash
curl -X POST "https://api.bilibili.com/x/upload/web/image" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -b "SESSDATA=deine_SESSDATA;bili_jct=dein_BILI_JCT" \
  -F "bucket=live" \
  -F "csrf=dein_BILI_JCT" \
  -F "file=@bild.png;filename=bild.png"
```

### So bekommst du SESSDATA und BILI_JCT

1. Oeffne die Bilibili-Startseite und stelle sicher, dass du eingeloggt bist.
2. Druecke `F12`, um die DevTools zu oeffnen.
3. Wechsle in den Tab **Application**.
4. In der linken Sidebar: **Storage → Cookies** und die Domain `*.bilibili.com` auswaehlen.
5. In der Cookie-Liste `SESSDATA` und `BILI_JCT` finden. Das Feld `Value` ist der Wert, den du brauchst.

### Parameter-Hinweise

| Parameter | Typ      | Beschreibung                         |
| --------- | -------- | ------------------------------------ |
| SESSDATA  | Cookie   | Bilibili-Sessionkennung des Nutzers  |
| bili_jct  | Cookie   | Bilibili-CSRF-Token                  |
| bucket    | FormData | Storage-Bucket; meist `live`         |
| csrf      | FormData | CSRF-Pruefung; Wert ist wie bili_jct |
| file      | FormData | Bilddatei                            |

### Response-Format

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

### Response-Felder

| Feld         | Typ     | Beschreibung              |
| ------------ | ------- | ------------------------- |
| code         | Integer | Statuscode; 0 bedeutet OK |
| message      | String  | Response-Message          |
| image_url    | String  | Bild-URL                  |
| image_width  | Integer | Bildbreite (Pixel)        |
| image_height | Integer | Bildhoehe (Pixel)         |

---

## Bild-Style-Parameter erklaert

Bilibilis Bildhosting unterstuetzt Echtzeit-Processing ueber URL-Parameter: Resize, Crop, Formatwechsel und Qualitaetskompression.

### Hauefige Beispiele

| Style-Typ                | URL-Format                                 | Hinweise                                 |
| ------------------------ | ------------------------------------------ | ---------------------------------------- |
| Original                 | `baseURL/example.jpg`                      | Originalgroesse und -qualitaet           |
| Qualitaet komprimieren   | `baseURL/example.jpg@1e_1c.jpg`            | Gleiche Aufloesung, niedrigere Qualitaet |
| Feste Breite, Auto-Hoehe | `baseURL/example.jpg@104w_1e_1c.jpg`       | Feste Breite, proportional skaliert      |
| Feste Hoehe, Auto-Breite | `baseURL/example.jpg@104h_1e_1c.jpg`       | Feste Hoehe, proportional skaliert       |
| Feste B/H + Kompression  | `baseURL/example.jpg@104w_104h_1e_1c.jpg`  | Feste Dimensionen + Kompression          |
| WebP (kleinst)           | `baseURL/example.jpg@1e_1c.webp`           | WebP bei Originalaufloesung              |
| WebP mit Groesse         | `baseURL/example.jpg@104w_104h_1e_1c.webp` | WebP bei festen Dimensionen              |

### Parameter-Grammatik

**Pattern:**

```
(image_original_url)@(\d+[whsepqoc]_?)*(\.(webp|gif|png|jpg|jpeg))?$
```

### Parameter-Referenz

| Parameter | Range                    | Beschreibung                                                                                                                                                                                        |
| --------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **w**     | [1, 9223372036854775807] | Breite in Pixeln                                                                                                                                                                                    |
| **h**     | [1, 9223372036854775807] | Hoehe in Pixeln                                                                                                                                                                                     |
| **s**     | [1, 9223372036854775807] | Unbekannter Parameter (mehr Research noetig)                                                                                                                                                        |
| **e**     | [0, 2]                   | Resize-Modus (resize)<br>• 0: Seitenverhaeltnis behalten, kleineren Wert nehmen<br>• 1: Seitenverhaeltnis behalten, groesseren Wert nehmen<br>• 2: Seitenverhaeltnis nicht behalten (nicht mit `c`) |
| **p**     | [1, 1000]                | Skalierungsfaktor; Default 100 (nicht mit `c`)                                                                                                                                                      |
| **q**     | [1, 100]                 | Bildqualitaet; Default 75                                                                                                                                                                           |
| **o**     | [0, 1]                   | Unbekannter Parameter (mehr Research noetig)                                                                                                                                                        |
| **c**     | [0, 1]                   | Crop-Modus (clip)<br>• 0: Default<br>• 1: Crop-Modus                                                                                                                                                |

### Format-Suffix

Unterstuetzte Formate:

- `webp` - empfohlen; kleinste Groesse
- `png` - verlustfrei
- `jpeg` / `jpg` - verlustbehaftet
- `gif` - animiert
- Wenn weggelassen, bleibt das Originalformat

### Hinweise

1. **Parameter sind case-insensitive**
2. **Wenn ein Parameter mehrfach vorkommt, gilt der letzte**
3. **Breite×Hoehe darf die Originalgroesse nicht ueberschreiten**, sonst greifen die Breite/Hoehe-Parameter nicht
4. **WebP ist empfehlenswert** fuer bestes Kompressionsverhaeltnis

---

## Verwandte Tools/Projekte

### bilibili-img-uploader

Eine ausgereifte Browser-Extension, die seit **6 Jahren** stabil laeuft und das Hochladen zu Bilibili sowie das Kopieren von Links vereinfacht.

#### Projektinfos

- **Repo**: [https://github.com/xlzy520/bilibili-img-uploader](https://github.com/xlzy520/bilibili-img-uploader)
- **Lizenz**: MIT License
- **Projektstatus (zum Zeitpunkt des Schreibens)**: ⭐ 406+ Stars | 39+ Forks
- **Tech-Stack**: Vue 3 + TypeScript + Vite

#### Unterstuetzte Plattformen

| Browser | Installation                                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Chrome  | [Chrome Web Store](https://chrome.google.com/webstore/detail/b%E7%AB%99%E5%9B%BE%E5%BA%8A/domljbndjbjgpkhdbmfgmiclggdfojnd?hl=zh-CN) |
| Edge    | [Chrome Web Store](https://chrome.google.com/webstore/detail/b%E7%AB%99%E5%9B%BE%E5%BA%8A/domljbndjbjgpkhdbmfgmiclggdfojnd?hl=zh-CN) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/addon/%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9%E5%9B%BE%E5%BA%8A/)                          |

#### Kernfeatures

**Automatisches Auslesen von Cookies** - SESSDATA und bili_jct nicht manuell setzen  
**Mehrere Output-Formate** - WebP, JPEG, PNG, usw.  
**Live-Preview** - vor dem Upload previewen  
**Batch-Upload** - mehrere Bilder auf einmal  
**Schnelles Kopieren** - ein Klick fuer Bild-Links  
**Kurzlink-Generierung** - konvertiert zu Bilibili-Kurzlinks

#### Web-Version

Wenn du keine Extension installieren willst, gibt es auch eine Web-Version:

- **URL**: [https://www.xiaojuzi.fun/bili-short-url/upload.html](https://www.xiaojuzi.fun/bili-short-url/upload.html)
- **Hinweis**: SESSDATA und bili_jct muessen manuell angegeben werden

#### Lokale Entwicklung

```bash
# Abhaengigkeiten installieren
pnpm install

# Dev-Modus (HMR)
pnpm run dev

# Produktions-Build
pnpm run build
```

Nach dem Build in `chrome://extensions/` den Developer Mode aktivieren und den Ordner `extension` laden.

---

## ⚠️ Wichtige Hinweise

### Warnung zur API-Stabilitaet

Laut Issue-Historie hat Bilibili die Upload-Schnittstelle im **Dezember 2023** angepasst, wodurch die Gueltigkeit der zurueckgegebenen Bildlinks auf **45 Minuten** verkuerzt wurde. Auch wenn das Projekt inzwischen auf die neue Schnittstelle umgestellt hat, gilt:

1. **Verfuegbarkeit ist nicht garantiert** - Bilibili kann die Schnittstelle jederzeit aendern oder schliessen
2. **Dauerhaftigkeit ist nicht garantiert** - wichtige Bilder lokal sichern
3. **Nicht missbrauchen** - grosse Upload-Mengen koennen zu Account-Restriktionen fuehren

### Cookie-Sicherheit

- SESSDATA und bili_jct sind sensibel; sicher aufbewahren
- Keine Cookies auf oeffentlichen Rechnern oder unserioesen Webseiten eingeben
- Bilibili-Passwort regelmaessig aendern

---

## Umgehen von Hotlink-Schutz

Bilibilis Bildhosting hat Hotlink-Schutz. Wenn du Bilder direkt auf anderen Seiten einbindest, koennen sie nicht laden. Zwei Ansaetze:

### Option 1: Referrer site-weit deaktivieren

Fuege das in den `<head>` deiner HTML ein:

```html
<meta name="referrer" content="no-referrer" />
```

Dann enthalten Requests von deiner Seite keinen `referrer`-Header.

### Option 2: Pro Link behandeln

Fuer einen einzelnen Link kannst du `rel="noreferrer"` verwenden:

```html
<a href="IMAGE_URL" rel="noreferrer" target="_blank">
  <img src="IMAGE_URL" alt="Beschreibung" />
</a>
```

**Hinweis**: `window.open` enthaelt standardmaessig `referrer`, daher brauchst du ggf. Sonderbehandlung.

---

## Referenzen

Die meisten technischen Infos in diesem Post stammen aus:

- [xlzy520/bilibili-img-uploader](https://github.com/xlzy520/bilibili-img-uploader) - Open-Source Browser-Extension
- [SocialSisterYi/bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect) - Sammlung von Bilibili-API-Dokumentation

---

## Danksagung

Danke an [@xlzy520](https://github.com/xlzy520) und alle Contributor fuer die jahrelange Pflege und Updates. Wenn es dir hilft, gib dem Projekt gern eine ⭐.

---

**Noch einmal zur Erinnerung**: Dieses Dokument ist nur fuer technische Forschung und Lernen. Bitte halte dich an Plattformregeln und nutze die Technik legal und verantwortungsvoll. Folgen aus Missbrauch liegen ausschliesslich bei dir.
