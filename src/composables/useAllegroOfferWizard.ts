import { computed, ref } from 'vue'

export const ALLEGRO_PRICE_MULTIPLIER = 1.2

export const ALLEGRO_WIZARD_STEPS = [
  { id: 'catalog', title: 'Katalog', description: 'Połączenie produktu z EAN' },
  { id: 'category', title: 'Kategoria', description: 'Kategoria Allegro' },
  { id: 'parameters', title: 'Parametry', description: 'Parametry oferty i producent' },
  { id: 'delivery', title: 'Dostawa', description: 'Dostawa i polityki sprzedaży' },
  { id: 'photos', title: 'Zdjęcia', description: 'Zdjęcia i opis oferty' },
  { id: 'price', title: 'Cena', description: 'Cena, stan i warunki' },
  { id: 'validation', title: 'Walidacja', description: 'Sprawdzenie przed publikacją' },
  { id: 'publish', title: 'Publikacja', description: 'Podgląd i wystawienie' },
] as const

export type AllegroWizardStepId = (typeof ALLEGRO_WIZARD_STEPS)[number]['id']

export type AllegroValidationResult = {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export const calculateAllegroPrice = (
  basePrice: number | string | null | undefined,
): number | null => {
  const base = Number(typeof basePrice === 'string' ? basePrice.replace(',', '.') : basePrice)

  if (!Number.isFinite(base) || base <= 0) {
    return null
  }

  return Math.round(base * ALLEGRO_PRICE_MULTIPLIER * 100) / 100
}

export const normalizeValidationResult = (result: unknown): AllegroValidationResult => {
  const payload = (result as any)?.data ?? result ?? {}

  return {
    isValid: Boolean(payload.isValid ?? payload.IsValid),
    errors: Array.isArray(payload.errors)
      ? payload.errors
      : Array.isArray(payload.Errors)
        ? payload.Errors
        : [],
    warnings: Array.isArray(payload.warnings)
      ? payload.warnings
      : Array.isArray(payload.Warnings)
        ? payload.Warnings
        : [],
  }
}

export const findGtinParameter = (parameters: any[]) =>
  parameters.find((param) => {
    const name = String(param?.name || '').toLowerCase()
    return name.includes('gtin') || name.includes('ean')
  })

export const findProducerCodeParameter = (parameters: any[]) =>
  parameters.find((param) => {
    const name = String(param?.name || '').toLowerCase()
    return (
      name.includes('kod producenta') ||
      name.includes('mpn') ||
      name.includes('manufacturer')
    )
  })

export const applyGtinToParameters = (
  parameters: any[],
  gtin: string | null | undefined,
  parameterValues: Record<string, unknown>,
) => {
  const normalizedGtin = String(gtin || '').trim()
  if (!normalizedGtin) return

  const gtinParameter = findGtinParameter(parameters)
  if (gtinParameter?.id) {
    parameterValues[String(gtinParameter.id)] = normalizedGtin
  }
}

export const applyProducerCodeToParameters = (
  parameters: any[],
  identificationCode: string | null | undefined,
  parameterValues: Record<string, unknown>,
) => {
  const code = String(identificationCode || '').trim()
  if (!code) return

  const producerCodeParameter = findProducerCodeParameter(parameters)
  if (producerCodeParameter?.id) {
    parameterValues[String(producerCodeParameter.id)] = code
  }
}

export type AllegroWizardFormSnapshot = {
  title: string
  categoryId: string | null
  allegroCatalogProductId: string | null
  deliveryPriceListId: string | null
  returnPolicyId: string | null
  impliedWarrantyId: string | null
  price: number | null
  photosCount: number
  descriptionRowsCount: number
  parameterValues: Record<string, unknown>
}

export const validateWizardStep = (
  stepIndex: number,
  form: AllegroWizardFormSnapshot,
  parameters: any[],
): string[] => {
  const errors: string[] = []
  const step = ALLEGRO_WIZARD_STEPS[stepIndex]

  if (!step) return errors

  switch (step.id) {
    case 'catalog':
      if (!form.title.trim()) {
        errors.push('Uzupełnij tytuł oferty.')
      }
      if (!form.allegroCatalogProductId) {
        errors.push('Połącz produkt z katalogiem Allegro po EAN.')
      }
      break

    case 'category':
      if (!form.categoryId) {
        errors.push('Wybierz kategorię Allegro.')
      }
      break

    case 'parameters': {
      const requiredParameters = parameters.filter(
        (param) => param.required || param.requiredForProduct === true,
      )

      requiredParameters.forEach((param) => {
        const value = form.parameterValues[String(param.id)]
        if (value === null || value === undefined || value === '') {
          errors.push(`Uzupełnij wymagany parametr: ${param.name}.`)
        }
      })
      break
    }

    case 'delivery':
      if (!form.deliveryPriceListId) {
        errors.push('Wybierz cennik dostawy.')
      }
      if (!form.returnPolicyId) {
        errors.push('Wybierz politykę zwrotów.')
      }
      if (!form.impliedWarrantyId) {
        errors.push('Wybierz gwarancję domniemaną.')
      }
      break

    case 'photos':
      if (form.photosCount <= 0) {
        errors.push('Dodaj co najmniej jedno zdjęcie.')
      }
      if (form.descriptionRowsCount <= 0) {
        errors.push('Dodaj opis oferty.')
      }
      break

    case 'price':
      if (!form.price || Number(form.price) <= 0) {
        errors.push('Podaj cenę większą od zera.')
      }
      break

    default:
      break
  }

  return errors
}

export const useAllegroOfferWizard = () => {
  const currentStep = ref(0)
  const validationResult = ref<AllegroValidationResult | null>(null)
  const offerPreview = ref<unknown>(null)
  const accountConnected = ref<boolean | null>(null)

  const isFirstStep = computed(() => currentStep.value === 0)
  const isLastStep = computed(() => currentStep.value === ALLEGRO_WIZARD_STEPS.length - 1)
  const currentStepMeta = computed(() => ALLEGRO_WIZARD_STEPS[currentStep.value])

  const goToStep = (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= ALLEGRO_WIZARD_STEPS.length) return
    currentStep.value = stepIndex
  }

  const nextStep = () => {
    if (!isLastStep.value) {
      currentStep.value += 1
    }
  }

  const prevStep = () => {
    if (!isFirstStep.value) {
      currentStep.value -= 1
    }
  }

  const resetValidation = () => {
    validationResult.value = null
  }

  return {
    ALLEGRO_WIZARD_STEPS,
    currentStep,
    currentStepMeta,
    isFirstStep,
    isLastStep,
    validationResult,
    offerPreview,
    accountConnected,
    goToStep,
    nextStep,
    prevStep,
    resetValidation,
  }
}
