export type DescriptionLayoutPattern =
  | 'alternating-text-first'
  | 'alternating-image-first'
  | 'text-only'

export interface ProductImageRef {
  url: string
  alt: string
  title: string
}

export function resolveRowLayout(
  index: number,
  pattern: DescriptionLayoutPattern,
  hasImages: boolean
): string {
  if (!hasImages || pattern === 'text-only') {
    return 'text-only'
  }

  if (pattern === 'alternating-image-first') {
    return index % 2 === 0 ? 'image-left-text-right' : 'text-left-image-right'
  }

  return index % 2 === 0 ? 'text-left-image-right' : 'image-left-text-right'
}

export function collectProductImages(
  thumbnail: { filePath?: string; altAttribute?: string; titleAttribute?: string } | null | undefined,
  gallery: Array<{ filePath?: string; altAttribute?: string; titleAttribute?: string; seoFileName?: string }>,
  thumbnailBase64?: string | null
): { urls: string[]; refs: ProductImageRef[]; base64Items: Array<{ base64String: string; mimeType: string }> } {
  const refs: ProductImageRef[] = []
  const urls: string[] = []
  const base64Items: Array<{ base64String: string; mimeType: string }> = []

  if (thumbnail?.filePath) {
    refs.push({
      url: thumbnail.filePath,
      alt: thumbnail.altAttribute || '',
      title: thumbnail.titleAttribute || ''
    })
    urls.push(thumbnail.filePath)
  } else if (thumbnailBase64) {
    base64Items.push({
      base64String: thumbnailBase64,
      mimeType: 'image/png'
    })
  }

  for (const file of gallery || []) {
    if (!file?.filePath) continue
    if (urls.includes(file.filePath)) continue

    refs.push({
      url: file.filePath,
      alt: file.altAttribute || file.seoFileName || '',
      title: file.titleAttribute || ''
    })
    urls.push(file.filePath)
  }

  return { urls, refs, base64Items }
}

export function pickImageForSection(
  images: ProductImageRef[],
  sectionIndex: number,
  suggestedImageIndex?: number | null
): ProductImageRef | null {
  if (!images.length) return null

  if (
    typeof suggestedImageIndex === 'number' &&
    suggestedImageIndex >= 0 &&
    suggestedImageIndex < images.length
  ) {
    return images[suggestedImageIndex]
  }

  return images[sectionIndex % images.length]
}

export function resolveRowLayoutFromSlot(
  slotLayout: string | undefined,
  index: number,
  layoutPattern: DescriptionLayoutPattern,
  hasImages: boolean
): string {
  if (slotLayout) {
    if (slotLayout === 'text-only' || slotLayout === 'image-only') {
      return slotLayout
    }

    if (hasImages) {
      return slotLayout
    }

    return 'text-only'
  }

  return resolveRowLayout(index, layoutPattern, hasImages)
}

export const DEFAULT_DESCRIPTION_AI_CONFIG = {
  templateId: 'intro-alternating-spec-5',
  sectionsCount: 5,
  layoutPattern: 'alternating-text-first' as DescriptionLayoutPattern,
  customPrompt: '',
  competitorUrl: '',
  exampleDescription: '',
  specification: ''
}

export const DESCRIPTION_AI_CONFIG_STORAGE_KEY = 'productDescriptionAiConfig'
