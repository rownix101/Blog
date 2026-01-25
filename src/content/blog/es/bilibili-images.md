---
title: Consigue un host de imagenes gratis en Bilibili en 1 minuto
date: 2026-01-18
description: Gasta $0 y consigue entrega rapida de imagenes a nivel global
tags:
  - diario
  - alojamiento-de-imagenes
  - cdn
commentId: /blog/bilibili-image
---

**⚠️ Aviso: Este articulo es solo para aprendizaje e investigacion tecnica. No lo uses para fines ilegales ni para abuso. Debes cumplir las leyes/regulaciones aplicables y los terminos de servicio de la plataforma. Cualquier consecuencia por uso indebido es exclusivamente tu responsabilidad.**

---

## Principio tecnico

En esencia, esta es una tecnica que aprovecha ciertas caracteristicas de la interfaz de subida de imagenes de Bilibili. Al llamar a la API publica de subida, puedes almacenar recursos de imagen en los servidores de Bilibili y aprovechar su CDN para distribuir el contenido globalmente, obteniendo URLs de imagen con enlace directo (hotlink) rapidas y estables.

## Como llamar a la API

### Endpoint de la API

```
POST https://api.bilibili.com/x/upload/web/image
```

### Ejemplo de peticion

```bash
curl -X POST "https://api.bilibili.com/x/upload/web/image" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -b "SESSDATA=tu_SESSDATA;bili_jct=tu_BILI_JCT" \
  -F "bucket=live" \
  -F "csrf=tu_BILI_JCT" \
  -F "file=@imagen.png;filename=imagen.png"
```

### Como obtener SESSDATA y BILI_JCT

1. Abre la pagina principal de Bilibili y asegurate de haber iniciado sesion.
2. Pulsa `F12` para abrir las DevTools del navegador.
3. Cambia a la pestaña **Application**.
4. En la barra lateral izquierda, ve a **Storage → Cookies** y selecciona el dominio `*.bilibili.com`.
5. Busca `SESSDATA` y `BILI_JCT` en la lista de cookies. El campo `Value` es lo que necesitas.

### Notas de parametros

| Parametro | Tipo     | Descripcion                                |
| --------- | -------- | ------------------------------------------ |
| SESSDATA  | Cookie   | Identificador de sesion del usuario        |
| bili_jct  | Cookie   | Token CSRF de Bilibili                     |
| bucket    | FormData | Bucket de almacenamiento; suele ser `live` |
| csrf      | FormData | Comprobacion CSRF; igual que bili_jct      |
| file      | FormData | Archivo de imagen                          |

### Formato de respuesta

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

### Campos de respuesta

| Campo        | Tipo    | Descripcion              |
| ------------ | ------- | ------------------------ |
| code         | Integer | Codigo de estado; 0 = OK |
| message      | String  | Mensaje de respuesta     |
| image_url    | String  | URL de la imagen         |
| image_width  | Integer | Ancho de la imagen (px)  |
| image_height | Integer | Alto de la imagen (px)   |

---

## Parametros de estilo de imagen (URL)

El host de imagenes de Bilibili soporta procesamiento en tiempo real mediante parametros en la URL: redimensionar, recortar, convertir formato y comprimir calidad.

### Ejemplos comunes

| Tipo de estilo              | Formato de URL                             | Notas                                |
| --------------------------- | ------------------------------------------ | ------------------------------------ |
| Original                    | `baseURL/example.jpg`                      | Mantiene tamano y calidad originales |
| Comprimir calidad (misma)   | `baseURL/example.jpg@1e_1c.jpg`            | Misma resolucion, menor calidad      |
| Ancho fijo, alto automatico | `baseURL/example.jpg@104w_1e_1c.jpg`       | Ancho fijo, escala proporcional      |
| Alto fijo, ancho automatico | `baseURL/example.jpg@104h_1e_1c.jpg`       | Alto fijo, escala proporcional       |
| Ancho/alto fijos + compr.   | `baseURL/example.jpg@104w_104h_1e_1c.jpg`  | Dimensiones fijas + compresion       |
| WebP (mas pequeno)          | `baseURL/example.jpg@1e_1c.webp`           | WebP a resolucion original           |
| WebP con tamano             | `baseURL/example.jpg@104w_104h_1e_1c.webp` | WebP a dimensiones fijas             |

### Gramatica de parametros

**Patron:**

```
(image_original_url)@(\d+[whsepqoc]_?)*(\.(webp|gif|png|jpg|jpeg))?$
```

### Referencia de parametros

| Parametro | Rango                    | Descripcion                                                                                                                                                                            |
| --------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **w**     | [1, 9223372036854775807] | Ancho en pixeles                                                                                                                                                                       |
| **h**     | [1, 9223372036854775807] | Alto en pixeles                                                                                                                                                                        |
| **s**     | [1, 9223372036854775807] | Parametro desconocido (requiere mas investigacion)                                                                                                                                     |
| **e**     | [0, 2]                   | Modo de redimensionado (resize)<br>• 0: mantiene proporcion, elige el valor menor<br>• 1: mantiene proporcion, elige el valor mayor<br>• 2: no mantiene proporcion (no se usa con `c`) |
| **p**     | [1, 1000]                | Factor de escala; por defecto 100 (no se usa con `c`)                                                                                                                                  |
| **q**     | [1, 100]                 | Calidad de imagen; por defecto 75                                                                                                                                                      |
| **o**     | [0, 1]                   | Parametro desconocido (requiere mas investigacion)                                                                                                                                     |
| **c**     | [0, 1]                   | Modo de recorte (clip)<br>• 0: por defecto<br>• 1: modo recorte                                                                                                                        |

### Sufijo de formato

Formatos soportados:

- `webp` - recomendado; menor tamano
- `png` - sin perdida
- `jpeg` / `jpg` - con perdida
- `gif` - animado
- Si se omite, se conserva el formato original

### Notas

1. **Los parametros no distinguen mayusculas/minusculas**
2. **Si el mismo parametro aparece varias veces, gana el ultimo**
3. **El ancho×alto calculado no debe superar el tamano original**, si no, los parametros de ancho/alto no surtiran efecto
4. **Se recomienda WebP** para mejor ratio de compresion

---

## Herramientas/proyectos relacionados

### bilibili-img-uploader

Es una extension de navegador madura que ha funcionado de forma estable durante **6 anos**, ofreciendo una forma facil de subir imagenes a Bilibili y obtener enlaces compartibles.

#### Informacion del proyecto

- **Repo**: [https://github.com/xlzy520/bilibili-img-uploader](https://github.com/xlzy520/bilibili-img-uploader)
- **Licencia**: MIT License
- **Estado (en el momento de escribir)**: ⭐ 406+ Stars | 39+ Forks
- **Stack**: Vue 3 + TypeScript + Vite

#### Plataformas soportadas

| Navegador | Instalacion                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Chrome    | [Chrome Web Store](https://chrome.google.com/webstore/detail/b%E7%AB%99%E5%9B%BE%E5%BA%8A/domljbndjbjgpkhdbmfgmiclggdfojnd?hl=zh-CN) |
| Edge      | [Chrome Web Store](https://chrome.google.com/webstore/detail/b%E7%AB%99%E5%9B%BE%E5%BA%8A/domljbndjbjgpkhdbmfgmiclggdfojnd?hl=zh-CN) |
| Firefox   | [Firefox Add-ons](https://addons.mozilla.org/addon/%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9%E5%9B%BE%E5%BA%8A/)                          |

#### Funciones clave

**Lectura automatica de cookies** - no hace falta configurar SESSDATA y bili_jct manualmente  
**Varios formatos de salida** - soporta WebP, JPEG, PNG, etc.  
**Vista previa** - previsualiza antes de subir  
**Subida por lotes** - sube varias imagenes a la vez  
**Copia rapida** - copia enlaces con un clic  
**Generacion de enlaces cortos** - convierte a enlaces cortos de Bilibili

#### Version web

Si no quieres instalar una extension, tambien hay una version web:

- **URL**: [https://www.xiaojuzi.fun/bili-short-url/upload.html](https://www.xiaojuzi.fun/bili-short-url/upload.html)
- **Nota**: debes introducir SESSDATA y bili_jct manualmente

#### Desarrollo local

```bash
# Instalar dependencias
pnpm install

# Modo desarrollo (HMR)
pnpm run dev

# Build de produccion
pnpm run build
```

Tras compilar, activa el Developer Mode en `chrome://extensions/` y carga la carpeta `extension`.

---

## ⚠️ Notas importantes

### Aviso sobre estabilidad de la API

Segun el historial de issues del proyecto, Bilibili ajusto la interfaz de subida de imagenes en **diciembre de 2023**, lo que redujo el periodo de validez de los enlaces devueltos a **45 minutos**. Aunque el proyecto se actualizo para usar la nueva interfaz, conviene tener en cuenta:

1. **No hay garantia de disponibilidad** - Bilibili puede cambiar o cerrar la interfaz en cualquier momento
2. **No hay garantia de permanencia** - guarda copias locales de imagenes importantes
3. **No lo abuses** - subir en grandes volumenes puede causar restricciones de cuenta

### Seguridad de cookies

- SESSDATA y bili_jct son datos sensibles; guardalos con cuidado
- No los introduzcas en equipos publicos o webs no confiables
- Cambia tu contrasena de Bilibili regularmente para proteger tu cuenta

---

## Soluciones para la proteccion anti-hotlink

El host de imagenes de Bilibili tiene proteccion anti-hotlink. Si incrustas imagenes directamente en otros sitios, puede que no carguen. Aqui tienes dos enfoques:

### Opcion 1: Desactivar el referrer en todo el sitio

Agrega esto en el `<head>` de tu HTML:

```html
<meta name="referrer" content="no-referrer" />
```

Asi, todas las peticiones desde tu sitio no enviaran el header `referrer`.

### Opcion 2: Manejar por enlace

Para un enlace puntual, puedes usar `rel="noreferrer"`:

```html
<a href="IMAGE_URL" rel="noreferrer" target="_blank">
  <img src="IMAGE_URL" alt="Descripcion" />
</a>
```

**Nota**: `window.open` incluye `referrer` por defecto, asi que necesitas un manejo especial.

---

## Referencias

La mayor parte de la informacion tecnica de este post proviene de:

- [xlzy520/bilibili-img-uploader](https://github.com/xlzy520/bilibili-img-uploader) - extension de navegador open-source
- [SocialSisterYi/bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect) - recopilacion de documentacion de APIs de Bilibili

---

## Agradecimientos

Gracias a [@xlzy520](https://github.com/xlzy520) y a todos los contribuidores por mantener y actualizar este proyecto durante anos. Si te resulta util, considera darle una ⭐.

---

**Un ultimo recordatorio**: Este documento es solo para investigacion y aprendizaje tecnico. Sigue las reglas de la plataforma y usa estas tecnicas de forma legal y responsable. Cualquier consecuencia por abuso es exclusivamente tu responsabilidad.
