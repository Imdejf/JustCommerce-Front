import { Api } from '/@/services/api'

export const PRODUCT_PHOTO_AI_VARIANT_COUNT = 3

export type ProductPhotoAiImage = {
  base64Image: string
  mimeType: string
}

export type ProductPhotoAiRequest = {
  productName?: string
  base64Image: string
  mimeType?: string
  base64LogoImage?: string
  logoMimeType?: string
  userInstruction?: string
  quality?: string
  size?: string
  outputFormat?: string
}

export type LoadedImageFile = {
  base64: string
  mimeType: string
  fileName: string
  previewUrl: string
}

export const parseProductPhotoImages = (data: any): ProductPhotoAiImage[] => {
  const images = data?.images ?? data?.Images ?? []

  return (Array.isArray(images) ? images : [])
    .map((item: any) => ({
      base64Image: item?.base64Image ?? item?.Base64Image ?? '',
      mimeType: item?.mimeType ?? item?.MimeType ?? 'image/png'
    }))
    .filter((item: ProductPhotoAiImage) => Boolean(item.base64Image))
}

export const toImageDataUrl = (base64: string, mimeType = 'image/png') => {
  if (!base64) return ''
  if (base64.startsWith('data:')) return base64
  return `data:${mimeType};base64,${base64}`
}

const isSvgFile = (file: File) =>
  file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')

export const readImageFile = (file: File): Promise<LoadedImageFile> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') && !/\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)) {
      reject(new Error('Wybrany plik nie jest obrazem.'))
      return
    }

    if (isSvgFile(file)) {
      reject(new Error('SVG nie jest obsługiwane. Zapisz logo jako PNG z przezroczystym tłem.'))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width
        const height = img.naturalHeight || img.height

        if (!width || !height) {
          reject(new Error('Nie udało się odczytać wymiarów obrazu.'))
          return
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Przeglądarka nie mogła przetworzyć obrazu.'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        const previewUrl = canvas.toDataURL('image/png')
        const commaIndex = previewUrl.indexOf(',')
        const base64 = commaIndex >= 0 ? previewUrl.slice(commaIndex + 1) : previewUrl

        resolve({
          base64,
          mimeType: 'image/png',
          fileName: file.name.replace(/\.[^.]+$/, '') + '.png',
          previewUrl
        })
      } catch {
        reject(new Error('Nie udało się przekonwertować obrazu do PNG.'))
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(
        'Nie można wczytać tego pliku. Użyj PNG, JPEG lub WebP. Unikaj SVG i uszkodzonych plików.'
      ))
    }

    img.src = objectUrl
  })

export const downloadBase64Image = (
  base64: string,
  mimeType: string,
  fileName: string
) => {
  const link = document.createElement('a')
  link.href = toImageDataUrl(base64, mimeType)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const fetchProductPhotoVariants = async (
  request: ProductPhotoAiRequest
): Promise<ProductPhotoAiImage[]> => {
  const body = {
    productPhotoBriefDTO: {
      productName: request.productName || '',
      base64Image: request.base64Image,
      mimeType: request.mimeType || 'image/png',
      base64LogoImage: request.base64LogoImage || null,
      logoMimeType: request.logoMimeType || null,
      userInstruction: request.userInstruction || '',
      quality: request.quality || 'high',
      size: request.size || '1024x1024',
      outputFormat: request.outputFormat || 'png',
      count: PRODUCT_PHOTO_AI_VARIANT_COUNT
    }
  }

  const res = await Api.chatGpt.generateProductPhoto({
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || 'Błąd odpowiedzi serwera')
  }

  const json = await res.json()
  const data = json?.data ?? json
  const images = parseProductPhotoImages(data)

  if (images.length === 0) {
    throw new Error('AI nie zwróciło żadnego obrazu.')
  }

  return images
}
