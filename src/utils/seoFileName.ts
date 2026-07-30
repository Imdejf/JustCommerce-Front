const POLISH_CHAR_MAP: Record<string, string> = {
  ą: 'a',
  ć: 'c',
  ę: 'e',
  ł: 'l',
  ń: 'n',
  ó: 'o',
  ś: 's',
  ź: 'z',
  ż: 'z',
  Ą: 'a',
  Ć: 'c',
  Ę: 'e',
  Ł: 'l',
  Ń: 'n',
  Ó: 'o',
  Ś: 's',
  Ź: 'z',
  Ż: 'z'
}

/** Dozwolone znaki w nazwie SEO pliku: a-z, 0-9, myślnik, podkreślenie. */
export const SEO_FILE_NAME_PATTERN = /^[a-z0-9_-]+$/

export const sanitizeSeoFileName = (value: string | null | undefined): string =>
  (value ?? '')
    .toString()
    .trim()
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (char) => POLISH_CHAR_MAP[char] ?? '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

export const isValidSeoFileName = (value: string | null | undefined): boolean => {
  const normalized = sanitizeSeoFileName(value)
  return Boolean(normalized) && normalized === (value ?? '').trim()
}
