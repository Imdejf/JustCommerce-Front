export type DescriptionRowLayoutType =
  | 'text-only'
  | 'image-left-text-right'
  | 'text-left-image-right'
  | 'image-only'

export interface DescriptionTemplateSlot {
  layout: DescriptionRowLayoutType
  label: string
  purpose: string
  headingHint?: string
}

export interface DescriptionTemplate {
  id: string
  name: string
  description: string
  slots: DescriptionTemplateSlot[]
}

export const ALLEGRO_DESCRIPTION_TEMPLATE_ID = 'allegro-params-then-sales-5'

export const DESCRIPTION_TEMPLATES: DescriptionTemplate[] = [
  {
    id: ALLEGRO_DESCRIPTION_TEMPLATE_ID,
    name: 'Allegro: PARAMETRY PRODUKTU + 5 sekcji sprzedażowych',
    description:
      'Sekcja 1: lista parametrów z ✅. Następnie 5 sekcji opisowych jak od specjalisty sprzedaży B2B.',
    slots: [
      {
        layout: 'text-only',
        label: 'PARAMETRY PRODUKTU',
        purpose: `Wygeneruj sekcję z nagłówkiem <h2><strong>PARAMETRY PRODUKTU</strong></h2>.
Każdy parametr w osobnym akapicie <p>✅ Nazwa parametru: wartość</p>.
Wyciągnij parametry ze specyfikacji, strony produktu i danych wejściowych.
Minimum 8–12 parametrów jeśli dane pozwalają. Używaj polskich nazw parametrów.`,
        headingHint: 'PARAMETRY PRODUKTU'
      },
      {
        layout: 'text-only',
        label: 'Wprowadzenie sprzedażowe',
        purpose:
          '2–3 akapity wprowadzające produkt. Pisz jak doświadczony handlowiec B2B – konkretnie, profesjonalnie, pod klienta indywidualnego i firmowego. Bez lania wody.',
        headingHint: 'Dlaczego ten produkt?'
      },
      {
        layout: 'text-only',
        label: 'Zastosowanie i korzyści',
        purpose:
          'Opisz praktyczne zastosowania, scenariusze użycia i korzyści dla kupującego. Ton ekspercki, sprzedażowy, bez kopiowania 1:1 ze strony sklepu.',
        headingHint: 'Zastosowanie w praktyce'
      },
      {
        layout: 'text-only',
        label: 'Konstrukcja i jakość',
        purpose:
          'Opisz materiały, wykonanie, trwałość i elementy konstrukcyjne. Podkreśl solidność i jakość widoczną w specyfikacji.',
        headingHint: 'Konstrukcja i jakość wykonania'
      },
      {
        layout: 'text-only',
        label: 'Wygoda i ergonomia',
        purpose:
          'Opisz ergonomię, komfort użytkowania, mobilność i praktyczne detale codziennego użytkowania.',
        headingHint: 'Wygoda użytkowania'
      },
      {
        layout: 'text-only',
        label: 'Zachęta do zakupu',
        purpose:
          'Krótka sekcja zamykająca – podsumuj najważniejsze atuty i zachęć do zakupu. Bez słowa „podsumowanie”. Naturalny, profesjonalny ton.',
        headingHint: 'Wybierz sprawdzoną jakość'
      }
    ]
  },
  {
    id: 'intro-alternating-spec-5',
    name: 'Wstęp + zdjęcia na przemian + specyfikacja ✅',
    description:
      'Sekcja 1: sam tekst wprowadzający. Sekcje 2–4: zdjęcie i tekst na przemian. Ostatnia sekcja: specyfikacja z ✅.',
    slots: [
      {
        layout: 'text-only',
        label: 'Wstęp',
        purpose:
          'Napisz wprowadzenie do produktu – 2–3 akapity, przyciągające uwagę, ogólny opis bez listy parametrów. Zachęć do dalszej lektury.',
        headingHint: 'Poznaj produkt'
      },
      {
        layout: 'image-left-text-right',
        label: 'Zdjęcie lewo / tekst prawo',
        purpose:
          'Opisz zalety i główne zastosowanie produktu. Oprzyj treść na zdjęciu – co widać, do czego służy, dla kogo.',
        headingHint: 'Zalety i zastosowanie'
      },
      {
        layout: 'text-left-image-right',
        label: 'Tekst lewo / zdjęcie prawo',
        purpose:
          'Opisz konstrukcję, materiały i jakość wykonania. Podkreśl trwałość i solidność widoczną na zdjęciu.',
        headingHint: 'Konstrukcja i jakość'
      },
      {
        layout: 'image-left-text-right',
        label: 'Zdjęcie lewo / tekst prawo',
        purpose:
          'Opisz ergonomię, komfort użytkowania i praktyczne korzyści w codziennej pracy.',
        headingHint: 'Wygoda użytkowania'
      },
      {
        layout: 'text-only',
        label: 'Specyfikacja techniczna',
        purpose: `Wygeneruj sekcję „Specyfikacja techniczna” w formacie listy z ikoną ✅ przed każdym parametrem.
Użyj HTML: <h2><strong>Specyfikacja techniczna</strong></h2> a potem osobne <p>✅ Nazwa parametru: wartość</p> dla każdej linii.
Przykład formatu:
<p>✅ Typ wózka: schodowy / transportowy</p>
<p>✅ Maksymalna ładowność: 250 kg</p>
Wyciągnij parametry ze specyfikacji, zdjęć i danych wejściowych. Minimum 8–12 parametrów jeśli dane pozwalają.`,
        headingHint: 'Specyfikacja techniczna'
      }
    ]
  },
  {
    id: 'intro-image-blocks-4',
    name: 'Wstęp + 2 bloki ze zdjęciem + specyfikacja',
    description: 'Krótszy szablon: wstęp, dwa bloki zdjęcie+tekst, specyfikacja ✅.',
    slots: [
      {
        layout: 'text-only',
        label: 'Wstęp',
        purpose: 'Krótkie wprowadzenie do produktu – 1–2 akapity, sprzedażowe i naturalne.',
        headingHint: 'Opis produktu'
      },
      {
        layout: 'image-left-text-right',
        label: 'Zdjęcie lewo / tekst prawo',
        purpose: 'Główne zalety i zastosowanie produktu na podstawie zdjęcia.',
        headingHint: 'Dlaczego warto?'
      },
      {
        layout: 'image-left-text-right',
        label: 'Zdjęcie lewo / tekst prawo',
        purpose: 'Szczegóły techniczne widoczne na zdjęciu – konstrukcja, elementy, wykończenie.',
        headingHint: 'Szczegóły wykonania'
      },
      {
        layout: 'text-only',
        label: 'Specyfikacja techniczna',
        purpose:
          'Lista parametrów w formacie <p>✅ Parametr: wartość</p> pod nagłówkiem <h2><strong>Specyfikacja techniczna</strong></h2>.',
        headingHint: 'Specyfikacja techniczna'
      }
    ]
  },
  {
    id: 'alternating-only-5',
    name: '5 sekcji na przemian (bez osobnej specyfikacji)',
    description: 'Wstęp tekstowy, potem 4 sekcje zdjęcie+tekst na przemian.',
    slots: [
      {
        layout: 'text-only',
        label: 'Wstęp',
        purpose: 'Wprowadzenie do produktu – ogólny opis i kontekst zastosowania.',
        headingHint: 'Wprowadzenie'
      },
      {
        layout: 'image-left-text-right',
        label: 'Zdjęcie lewo / tekst prawo',
        purpose: 'Zastosowanie i korzyści.',
        headingHint: 'Zastosowanie'
      },
      {
        layout: 'text-left-image-right',
        label: 'Tekst lewo / zdjęcie prawo',
        purpose: 'Parametry i cechy techniczne.',
        headingHint: 'Parametry'
      },
      {
        layout: 'image-left-text-right',
        label: 'Zdjęcie lewo / tekst prawo',
        purpose: 'Jakość wykonania i trwałość.',
        headingHint: 'Jakość'
      },
      {
        layout: 'text-left-image-right',
        label: 'Tekst lewo / zdjęcie prawo',
        purpose: 'Podsumowanie korzyści i zachęta do zakupu (bez słowa „podsumowanie”).',
        headingHint: 'Wybierz jakość'
      }
    ]
  },
  {
    id: 'manual',
    name: 'Ręczny układ (bez szablonu)',
    description: 'Sam wybierasz liczbę sekcji i wzorzec naprzemienny.',
    slots: []
  }
]

export const MANUAL_TEMPLATE_ID = 'manual'

export function getDescriptionTemplate(id: string): DescriptionTemplate {
  return DESCRIPTION_TEMPLATES.find((t) => t.id === id) ?? DESCRIPTION_TEMPLATES[0]
}

export function layoutLabel(layout: DescriptionRowLayoutType): string {
  switch (layout) {
    case 'text-only':
      return 'Tylko tekst'
    case 'image-left-text-right':
      return 'Zdjęcie lewo / tekst prawo'
    case 'text-left-image-right':
      return 'Tekst lewo / zdjęcie prawo'
    case 'image-only':
      return 'Tylko zdjęcie'
    default:
      return layout
  }
}
