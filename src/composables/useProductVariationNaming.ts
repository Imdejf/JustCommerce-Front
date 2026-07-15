import type { ProductDTO } from '/@/types/product/Product'
import type {
  MediaDTO,
  ProductOptionCombinationDTO,
  ProductVariationLang
} from '/@/types/product/ProductVariation'

const normalize = (value: string | null | undefined) => (value ?? '').trim()

export const syncMediaLangsFromDefault = (media: MediaDTO) => {
  const defaultAlt = normalize(media.altAttribute)
  const defaultTitle = normalize(media.titleAttribute)
  const defaultSeo =
    normalize(media.seoFileName) || defaultAlt.toLowerCase().replace(/\s+/g, '-')

  if (!media.mediaLangs?.length) {
    return
  }

  for (const lang of media.mediaLangs) {
    if (!normalize(lang.altAttribute)) {
      lang.altAttribute = defaultAlt
    }
    if (!normalize(lang.titleAttribute)) {
      lang.titleAttribute = defaultTitle
    }
    if (!normalize(lang.seoFileName)) {
      lang.seoFileName = defaultSeo
    }
  }
}

export const buildVariantOptionSuffix = (
  combinations: ProductOptionCombinationDTO[] | null | undefined
) => {
  if (!combinations?.length) {
    return ''
  }

  return combinations
    .slice()
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .map((combination) => normalize(combination.value))
    .filter(Boolean)
    .join(' ')
}

export const buildVariantName = (
  parentName: string,
  combinations: ProductOptionCombinationDTO[] | null | undefined
) => {
  const baseName = normalize(parentName)
  const suffix = buildVariantOptionSuffix(combinations)

  if (!suffix) {
    return baseName
  }

  return baseName ? `${baseName} ${suffix}` : suffix
}

export const buildVariantLangNames = (
  parentProduct: ProductDTO,
  combinations: ProductOptionCombinationDTO[] | null | undefined,
  languages: Array<{ id: string }>
): ProductVariationLang[] => {
  const defaultSuffix = buildVariantOptionSuffix(combinations)

  return languages.map((language) => {
    const parentLangName =
      parentProduct.productLangs?.find((lang) => lang.languageId === language.id)?.name ??
      parentProduct.name

    const baseName = normalize(parentLangName)

    return {
      languageId: language.id,
      name: defaultSuffix ? (baseName ? `${baseName} ${defaultSuffix}` : defaultSuffix) : baseName
    }
  })
}

export const buildVariantThumbnailSeo = (
  parentProduct: ProductDTO,
  variantName: string,
  parentThumbnail?: MediaDTO | null,
  existing?: MediaDTO | null,
  optionSuffix?: string
): MediaDTO => {
  const parentAlt = normalize(parentThumbnail?.altAttribute || parentProduct.name)
  const parentTitle = normalize(parentThumbnail?.titleAttribute || parentProduct.name)
  const suffix =
    optionSuffix ??
    (variantName.startsWith(parentProduct.name)
      ? normalize(variantName.slice(parentProduct.name.length))
      : '')

  const altAttribute = suffix ? `${parentAlt} ${suffix}`.trim() : parentAlt
  const titleAttribute = suffix ? `${parentTitle} ${suffix}`.trim() : parentTitle

  return {
    productId: existing?.productId ?? null,
    mediaId: existing?.mediaId ?? null,
    seoFileName: existing?.seoFileName || altAttribute.toLowerCase().replace(/\s+/g, '-'),
    altAttribute: existing?.altAttribute || altAttribute,
    titleAttribute: existing?.titleAttribute || titleAttribute,
    filePath: existing?.filePath ?? '',
    displayOrder: existing?.displayOrder ?? 0,
    mediaLangs:
      existing?.mediaLangs?.map((lang) => {
        const parentLang = parentThumbnail?.mediaLangs?.find(
          (parentMediaLang) => parentMediaLang.languageId === lang.languageId
        )
        const parentLangAlt = normalize(parentLang?.altAttribute || parentAlt)
        const parentLangTitle = normalize(parentLang?.titleAttribute || parentTitle)

        return {
          ...lang,
          altAttribute: lang.altAttribute || (suffix ? `${parentLangAlt} ${suffix}`.trim() : parentLangAlt),
          titleAttribute:
            lang.titleAttribute || (suffix ? `${parentLangTitle} ${suffix}`.trim() : parentLangTitle),
          seoFileName:
            lang.seoFileName ||
            (lang.altAttribute || parentLangAlt).toLowerCase().replace(/\s+/g, '-')
        }
      }) ?? []
  }
}

export const applyVariantNaming = (
  parentProduct: ProductDTO,
  variation: {
    name: string
    optionCombinations: ProductOptionCombinationDTO[] | null | undefined
    productVariationLangs: ProductVariationLang[]
    thumbnailImage: MediaDTO | null
  },
  languages: Array<{ id: string }>
) => {
  const variantName = buildVariantName(parentProduct.name, variation.optionCombinations)
  variation.name = variantName
  variation.productVariationLangs = buildVariantLangNames(
    parentProduct,
    variation.optionCombinations,
    languages
  )

  if (!variation.thumbnailImage?.filePath) {
    return
  }

  const seoDefaults = buildVariantThumbnailSeo(
    parentProduct,
    variantName,
    parentProduct.thumbnailImage,
    variation.thumbnailImage,
    buildVariantOptionSuffix(variation.optionCombinations)
  )

  variation.thumbnailImage.altAttribute =
    variation.thumbnailImage.altAttribute || seoDefaults.altAttribute
  variation.thumbnailImage.titleAttribute =
    variation.thumbnailImage.titleAttribute || seoDefaults.titleAttribute
  variation.thumbnailImage.seoFileName =
    variation.thumbnailImage.seoFileName || seoDefaults.seoFileName

  variation.thumbnailImage.mediaLangs = variation.thumbnailImage.mediaLangs.map((lang) => {
    const defaultLang = seoDefaults.mediaLangs.find(
      (defaultMediaLang) => defaultMediaLang.languageId === lang.languageId
    )

    return {
      ...lang,
      altAttribute: lang.altAttribute || defaultLang?.altAttribute || seoDefaults.altAttribute,
      titleAttribute:
        lang.titleAttribute || defaultLang?.titleAttribute || seoDefaults.titleAttribute,
      seoFileName: lang.seoFileName || defaultLang?.seoFileName || seoDefaults.seoFileName
    }
  })

  syncMediaLangsFromDefault(variation.thumbnailImage)
}
