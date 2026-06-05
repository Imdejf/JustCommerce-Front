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

export const createDefaultDescriptionRows = (): AllegroDescriptionRow[] => [
  {
    id: createId(),
    text: '',
    active: true,
    layout: 'TEXT_ONLY',
    imageUrl: null,
    imageFile: null,
  },
]

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
    return createDefaultDescriptionRows()
  }

  return rows.map((row: any) => ({
    id: createId(),
    text: row.text || '',
    active: row.active !== false,
    layout: row.layout || 'TEXT_ONLY',
    imageUrl: row.imageUrl || null,
    imageFile: null,
  }))
}

export const filterDescriptionRowsForSave = (rows: AllegroDescriptionRow[]) =>
  rows.filter(row =>
    row.active &&
    (
      String(row.text || '').trim() ||
      isValidAllegroImageUrl(row.imageUrl)
    )
  )

export const mapDescriptionRowsForSave = (rows: AllegroDescriptionRow[]) =>
  filterDescriptionRowsForSave(rows).map(row => ({
    text: row.text,
    active: true,
    layout: row.layout,
    imageUrl: isValidAllegroImageUrl(row.imageUrl) ? row.imageUrl : null,
  }))

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
