import { DisplayType, ProductOptionDTO, ProductOptionValueDTO } from '/@/types/product/ProductOption'
import type { ProductOptionCombinationDTO } from '/@/types/product/ProductVariation'

const normalize = (value: string | null | undefined) => (value ?? '').trim()

export const syncOptionValueLangsFromDefault = (value: ProductOptionValueDTO, forceDisplay = false) => {
  if (!value.productOptionValueLangs?.length) {
    return
  }

  for (const lang of value.productOptionValueLangs) {
    if (!normalize(lang.key)) {
      lang.key = value.key
    }

    if (forceDisplay || !normalize(lang.display)) {
      lang.display = value.display
    }
  }
}

export const syncAllOptionValuesFromDefault = (option: ProductOptionDTO) => {
  const isColor = Number(option.displayType) === DisplayType.Color

  for (const value of option.values) {
    syncOptionValueLangsFromDefault(value, isColor)
  }
}

export const buildOptionCombinationLangs = (
  productOptionValue: ProductOptionValueDTO
): ProductOptionCombinationDTO['productOptionCombinationLangs'] => {
  syncOptionValueLangsFromDefault(productOptionValue, true)

  return productOptionValue.productOptionValueLangs.map((lang) => ({
    productOptionCombinationId: null,
    languageId: lang.languageId,
    value: normalize(lang.key) || productOptionValue.key
  }))
}

export const buildOptionCombination = (
  option: ProductOptionDTO,
  key: string,
  sortIndex: number
): ProductOptionCombinationDTO | null => {
  const productOptionValue = option.values.find((value) => value.key === key)
  if (!productOptionValue) {
    return null
  }

  return {
    optionId: option.optionId,
    optionName: option.name,
    sortIndex,
    value: key,
    productOptionCombinationLangs: buildOptionCombinationLangs(productOptionValue)
  }
}
