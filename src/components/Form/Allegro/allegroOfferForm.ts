export type AllegroDescriptionRow = {
  id: string
  text: string
  active: boolean
  layout: 'TEXT_ONLY' | 'TEXT_IMAGE_RIGHT' | 'IMAGE_TEXT_RIGHT' | 'IMAGE_ONLY'
  imageUrl?: string | null
  imageFile?: File | null
}

export type AllegroPhoto = {
  id: string
  file?: File
  url: string
  allegroUrl?: string
}

const createId = () => crypto.randomUUID()

export const isValidAllegroImageUrl = (url?: string | null): url is string =>
  !!url &&
  url.startsWith('https://') &&
  url.includes('allegroimg.com')

export const extractAllegroUrlFromUpload = (uploaded: any): string | null =>
  uploaded?.data?.allegroUrl ||
  uploaded?.data?.AllegroUrl ||
  uploaded?.allegroUrl ||
  uploaded?.AllegroUrl ||
  null

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export const hasDescriptionText = (text?: string | null): boolean => {
  if (!text?.trim()) return false

  const plain = String(text)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return plain.length > 0
}

export const normalizeDescriptionHtmlFromAllegro = (html?: string | null): string => {
  if (!html?.trim()) return ''

  let text = String(html).trim()

  text = text.replace(/<img\b[^>]*>/gi, '')
  text = text.replace(/<br\s*\/?>/gi, '</p><p>')
  text = text.replace(
    /<\/?(div|span|section|article|figure|figcaption|a|button|table|tbody|thead|tr|td|th|iframe|video|source|picture)[^>]*>/gi,
    ''
  )
  text = text.replace(/<p[^>]*>/gi, '<p>')
  text = text.replace(/<h1[^>]*>/gi, '<h1>')
  text = text.replace(/<h2[^>]*>/gi, '<h2>')
  text = text.replace(/<h3[^>]*>/gi, '<h3>')
  text = text.replace(/<ul[^>]*>/gi, '<ul>')
  text = text.replace(/<ol[^>]*>/gi, '<ol>')
  text = text.replace(/<li[^>]*>/gi, '<li>')
  text = text.replace(/<strong[^>]*>/gi, '<strong>')
  text = text.replace(/<\/strong>/gi, '</strong>')
  text = text.replace(/<p>\s*<\/p>/gi, '')

  return text.trim()
}

export const isHtmlDescription = (text?: string | null): boolean =>
  /<\/?[a-z][\s\S]*>/i.test(String(text ?? ''))

export const prepareDescriptionTextForAllegro = (text?: string | null): string => {
  if (!hasDescriptionText(text)) return ''

  if (isHtmlDescription(text)) {
    return normalizeDescriptionHtmlFromAllegro(text)
  }

  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '<br />')

  return `<p>${escaped}</p>`
}

export const mapDescriptionSectionsFromAllegroApi = (description: any): AllegroDescriptionRow[] => {
  const sections = description?.sections || []

  if (!Array.isArray(sections) || !sections.length) {
    return []
  }

  return sections
    .map((section: any) => {
      const items = section.items || []

      const textItem = items.find((x: any) => x.type === 'TEXT')
      const imageItem = items.find((x: any) => x.type === 'IMAGE')

      const firstType = items[0]?.type
      const layout =
        textItem && imageItem && firstType === 'IMAGE'
          ? 'IMAGE_TEXT_RIGHT'
          : textItem && imageItem
            ? 'TEXT_IMAGE_RIGHT'
            : imageItem
              ? 'IMAGE_ONLY'
              : 'TEXT_ONLY'

      return {
        id: createId(),
        text: normalizeDescriptionHtmlFromAllegro(textItem?.content || ''),
        active: true,
        layout,
        imageUrl: imageItem?.url || null,
        imageFile: null,
      } as AllegroDescriptionRow
    })
    .filter((row) => hasDescriptionText(row.text) || !!row.imageUrl)
}

export const createDefaultDescriptionRows = (): AllegroDescriptionRow[] => []

export const normalizeAllegroImages = (images: unknown): AllegroPhoto[] => {
  if (!Array.isArray(images)) return []

  return images
    .map((item: unknown) => {
      const url = typeof item === 'string'
        ? item
        : (item as any)?.url || (item as any)?.allegroUrl || (item as any)?.filePath

      if (!url) return null

      const allegroUrl = isValidAllegroImageUrl(url) ? url : undefined

      return {
        id: createId(),
        url,
        allegroUrl,
      }
    })
    .filter(Boolean) as AllegroPhoto[]
}

export const mapDescriptionRowsFromApi = (rows: any[]): AllegroDescriptionRow[] => {
  if (!Array.isArray(rows) || !rows.length) {
    return []
  }

  return rows
    .map((row: any) => ({
      id: createId(),
      text: normalizeDescriptionHtmlFromAllegro(row.text || ''),
      active: row.active !== false,
      layout: row.layout || 'TEXT_ONLY',
      imageUrl: row.imageUrl || null,
      imageFile: null,
    }))
    .filter((row) => hasDescriptionText(row.text) || !!row.imageUrl)
}

export const filterDescriptionRowsForSave = (rows: AllegroDescriptionRow[]) =>
  rows.filter(
    (row) =>
      row.active && (hasDescriptionText(row.text) || isValidAllegroImageUrl(row.imageUrl))
  )

export const mapDescriptionRowsForSave = (rows: AllegroDescriptionRow[]) =>
  filterDescriptionRowsForSave(rows).map((row) => ({
    text: prepareDescriptionTextForAllegro(row.text),
    active: true,
    layout: row.layout,
    imageUrl: isValidAllegroImageUrl(row.imageUrl) ? row.imageUrl : null,
  }))

export const mapAllegroLayoutToProductLayout = (
  layout: AllegroDescriptionRow['layout'],
): string => {
  switch (layout) {
    case 'TEXT_IMAGE_RIGHT':
      return 'text-left-image-right'
    case 'IMAGE_TEXT_RIGHT':
      return 'image-left-text-right'
    case 'IMAGE_ONLY':
      return 'image-only'
    default:
      return 'text-only'
  }
}

export const mapAllegroRowsToRewriteSource = (rows: AllegroDescriptionRow[]) =>
  rows.map((row) => ({
    layout: mapAllegroLayoutToProductLayout(row.layout),
    text: row.text || '',
  }))

export const buildAllegroRowsFromRewriteSections = (
  sections: any[],
  sourceRows: AllegroDescriptionRow[],
): AllegroDescriptionRow[] =>
  sections
    .map((section: any, index: number) => {
      const html = section?.description ?? section?.Description ?? ''

      if (!hasDescriptionText(html)) return null

      const source = sourceRows[index]

      return {
        id: createId(),
        text: html,
        active: true,
        layout: source?.layout || 'TEXT_ONLY',
        imageUrl: source?.imageUrl || null,
        imageFile: source?.imageFile || null,
      } as AllegroDescriptionRow
    })
    .filter(Boolean) as AllegroDescriptionRow[]

type UploadFn = (base64: string) => Promise<any>

export const prepareDescriptionRowsForAllegro = async (
  rows: AllegroDescriptionRow[],
  photos: AllegroPhoto[],
  uploadFn: UploadFn,
) => {
  const prepared = rows.map(row => ({ ...row }))

  for (const row of prepared) {
    if (!row.imageUrl && !row.imageFile) {
      continue
    }

    if (isValidAllegroImageUrl(row.imageUrl)) {
      continue
    }

    const matchingPhoto = photos.find(photo =>
      photo.url === row.imageUrl ||
      photo.allegroUrl === row.imageUrl
    )

    if (matchingPhoto?.allegroUrl && isValidAllegroImageUrl(matchingPhoto.allegroUrl)) {
      row.imageUrl = matchingPhoto.allegroUrl
      continue
    }

    const fileToUpload = row.imageFile || matchingPhoto?.file

    if (fileToUpload) {
      const base64File = await fileToBase64(fileToUpload)
      const uploaded = await uploadFn(base64File)
      const allegroUrl = extractAllegroUrlFromUpload(uploaded)

      if (allegroUrl && isValidAllegroImageUrl(allegroUrl)) {
        if (matchingPhoto) {
          matchingPhoto.allegroUrl = allegroUrl
          matchingPhoto.url = allegroUrl
        }

        row.imageUrl = allegroUrl
        continue
      }
    }

    row.imageUrl = null
  }

  return mapDescriptionRowsForSave(prepared)
}

export const getParamValues = (param: any) =>
  param.values || param.dictionaryValues || param.dictionary || param.options || []

export const isNumberParameter = (param: any) => {
  const type = String(param.type || param.valueType || '').toLowerCase()

  return (
    type.includes('int') ||
    type.includes('float') ||
    type.includes('number') ||
    type.includes('decimal')
  )
}

export const isBooleanParameter = (param: any) => {
  const type = String(param.type || param.valueType || '').toLowerCase()
  return type.includes('bool')
}

export const applyParameterValuesFromApi = (
  parameterValues: Record<string, any>,
  apiParams: any[],
) => {
  if (!Array.isArray(apiParams)) return

  apiParams.forEach((x: any) => {
    const parameterId = String(x.parameterId || x.id || '')
    if (!parameterId) return

    const valueId = x.valueIds?.[0] || x.valuesIds?.[0] || x.valueId
    const value = x.values?.[0] || x.value

    parameterValues[parameterId] = valueId || value || null
  })
}

export const buildParameterValuesForApi = (
  parameterValues: Record<string, any>,
  parameters: any[],
) =>
  Object.entries(parameterValues)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([parameterId, value]) => {
      const param = parameters.find((x: any) => String(x.id) === parameterId)
      const dictionaryValues = getParamValues(param || {})

      const selectedDictionary = dictionaryValues.find((x: any) =>
        x.id === value || x.value === value || x.name === value
      )

      return {
        parameterId,
        valueId: selectedDictionary?.id ?? null,
        value: selectedDictionary?.id ? null : String(value),
        describesProduct: param?.describesProduct === true,
      }
    })

export const buildFeePreviewBody = (form: {
  title: string
  categoryId: string
  price: number | string | null
  stockQuantity: number | null
  stockUnit?: string
  deliveryPriceListId?: string | null
  isAuction?: boolean
}) => {
  const body: Record<string, any> = {
    offer: {
      name: form.title,
      category: {
        id: form.categoryId,
      },
      sellingMode: {
        format: form.isAuction ? 'AUCTION' : 'BUY_NOW',
        price: {
          amount: Number(form.price || 0).toFixed(2),
          currency: 'PLN',
        },
      },
      stock: {
        available: Number(form.stockQuantity || 1),
        unit: form.stockUnit || 'UNIT',
      },
    },
  }

  if (form.deliveryPriceListId) {
    body.offer.delivery = {
      shippingRates: {
        id: form.deliveryPriceListId,
      },
    }
  }

  return body
}

const findDictionaryValue = (param: any, matcher: (label: string) => boolean) => {
  const dictionaryValues = getParamValues(param)

  return dictionaryValues.find((item: any) => {
    const label = String(item.name || item.value || item.label || '').toLowerCase()
    return matcher(label)
  })
}

export const applyAllegroParameterDefaults = (
  parameters: any[],
  parameterValues: Record<string, any>,
) => {
  parameters.forEach((param: any) => {
    const parameterId = String(param.id || '')
    if (!parameterId) return

    const currentValue = parameterValues[parameterId]
    if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
      return
    }

    const name = String(param.name || '').toLowerCase()

    if (name.includes('opakowan')) {
      const originalPackaging = findDictionaryValue(
        param,
        label => label.includes('oryginaln') || label.includes('original'),
      )

      if (originalPackaging) {
        parameterValues[parameterId] = originalPackaging.id || originalPackaging.value
      }

      return
    }

    if (
      (name === 'stan' || name.includes('stan produktu') || name.includes('condition')) &&
      !name.includes('opakowan')
    ) {
      const newCondition = findDictionaryValue(
        param,
        label => label.includes('nowy') || label === 'new',
      )

      if (newCondition) {
        parameterValues[parameterId] = newCondition.id || newCondition.value
      }
    }
  })
}

export const mapAllegroImagesFromSyncDto = (images: any[]): AllegroPhoto[] => {
  if (!Array.isArray(images)) return []

  return images
    .map((item: any) => {
      const allegroUrl = item.allegroUrl || item.AllegroUrl
      const sourceUrl = item.sourceUrl || item.SourceUrl
      const url = allegroUrl || sourceUrl

      if (!url) return null

      return {
        id: createId(),
        url,
        allegroUrl: isValidAllegroImageUrl(allegroUrl) ? allegroUrl : undefined,
      } as AllegroPhoto
    })
    .filter(Boolean) as AllegroPhoto[]
}

const getOriginalProductMediaPath = (filePath: string): string => {
  if (filePath.includes('/original/')) {
    return filePath
  }

  return filePath.replace('/Product/', '/Product/original/')
}

export const mapProductMediasToAllegroPhotos = (medias: any[]): AllegroPhoto[] => {
  if (!Array.isArray(medias)) return []

  return medias
    .map((media: any) => {
      const filePath = media.filePath || media.FilePath
      if (!filePath) return null

      const originalFilePath = getOriginalProductMediaPath(String(filePath))

      const url = originalFilePath.startsWith('http')
        ? originalFilePath
        : `https://images.olmag.pl/${originalFilePath.replace(/^\/+/, '')}`

      return {
        id: createId(),
        url,
      } as AllegroPhoto
    })
    .filter(Boolean) as AllegroPhoto[]
}

const mapProductLayoutToAllegroLayout = (
  layout?: string | null,
): AllegroDescriptionRow['layout'] => {
  switch (layout) {
    case 'image-left-text-right':
      return 'IMAGE_TEXT_RIGHT'
    case 'text-left-image-right':
      return 'TEXT_IMAGE_RIGHT'
    case 'image-only':
      return 'IMAGE_ONLY'
    default:
      return 'TEXT_ONLY'
  }
}

export const buildAllegroRowsFromVisionSections = (
  sections: any[],
  templateSlots: Array<{ layout?: string }> | null,
  photos: AllegroPhoto[],
): AllegroDescriptionRow[] =>
  sections
    .map((section: any, index: number) => {
      const html = section?.description ?? section?.Description ?? ''

      if (!hasDescriptionText(html)) return null

      const slotLayout = templateSlots?.[index]?.layout
      const layout = mapProductLayoutToAllegroLayout(slotLayout)
      const row: AllegroDescriptionRow = {
        id: createId(),
        text: html,
        active: true,
        layout,
        imageUrl: null,
        imageFile: null,
      }

      if (layout !== 'TEXT_ONLY' && photos.length) {
        const suggested =
          section?.suggestedImageIndex ??
          section?.SuggestedImageIndex ??
          index

        const photoIndex = Number.isInteger(suggested)
          ? Math.min(Math.max(Number(suggested), 0), photos.length - 1)
          : Math.min(index, photos.length - 1)

        const photo = photos[photoIndex]
        row.imageUrl = photo?.allegroUrl || photo?.url || null
        row.imageFile = photo?.file || null
      }

      return row
    })
    .filter(Boolean) as AllegroDescriptionRow[]

export const extractParametersFromLiveOffer = (data: any) => {
  const productSetItem = data?.productSet?.[0]
  const offerParams = Array.isArray(data?.parameters) ? data.parameters : []
  const productParams = Array.isArray(productSetItem?.product?.parameters)
    ? productSetItem.product.parameters
    : []

  return [...offerParams, ...productParams]
    .map((x: any) => ({
      parameterId: x.id || x.parameterId,
      valueIds: x.valuesIds || x.valueIds || (x.valueId ? [x.valueId] : []),
      values: x.values || (x.value ? [x.value] : []),
    }))
    .filter((x: any) => x.parameterId)
}
