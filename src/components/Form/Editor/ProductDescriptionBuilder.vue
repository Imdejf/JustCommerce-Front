<template>
  <div class="description-builder">
    <div
      v-for="(row, index) in localRows"
      :key="row.id"
      class="builder-row"
    >
      <div class="builder-row__top">
        <div class="builder-row__types">
          <button
            type="button"
            :class="{ active: row.type === 'image-left-text-right' }"
            @click="row.type = 'image-left-text-right'"
          >
            Zdjęcie lewo / tekst prawo
          </button>

          <button
            type="button"
            :class="{ active: row.type === 'text-left-image-right' }"
            @click="row.type = 'text-left-image-right'"
          >
            Tekst lewo / zdjęcie prawo
          </button>

          <button
            type="button"
            :class="{ active: row.type === 'text-only' }"
            @click="row.type = 'text-only'"
          >
            Tylko tekst
          </button>

          <button
            type="button"
            :class="{ active: row.type === 'image-only' }"
            @click="row.type = 'image-only'"
          >
            Tylko zdjęcie
          </button>
        </div>

        <div class="builder-row__actions">
          <button type="button" @click="$emit('improve-ai', index)">
            Popraw AI
          </button>
          <button type="button" @click="$emit('add-ai-below', index)">
            Dodaj sekcję AI poniżej
          </button>
          <button type="button" @click="moveUp(index)" :disabled="index === 0">↑</button>
          <button type="button" @click="moveDown(index)" :disabled="index === localRows.length - 1">↓</button>
          <button type="button" @click="duplicateRow(index)">Kopiuj</button>
          <button type="button" @click="removeRow(index)">Usuń</button>
        </div>
      </div>

      <div
        class="builder-row__content"
        :class="{
          'layout-image-left': row.type === 'image-left-text-right',
          'layout-image-right': row.type === 'text-left-image-right',
          'layout-text-only': row.type === 'text-only',
          'layout-image-only': row.type === 'image-only'
        }"
      >
        <div
          v-if="row.type === 'image-left-text-right' || row.type === 'text-left-image-right' || row.type === 'image-only'"
          class="image-panel"
        >
          <label class="field-label">Wybierz zdjęcie produktu</label>

          <select
            v-model="row.imageUrl"
            class="field-input"
            @change="onImageChange(row)"
          >
            <option :value="null">-- wybierz zdjęcie --</option>
            <option
              v-for="image in normalizedImages"
              :key="image.value"
              :value="image.value"
            >
              {{ image.label }}
            </option>
          </select>

          <div v-if="row.imageUrl" class="image-preview">
            <img :src="row.imageUrl" alt="" />
          </div>

          <div class="field-group">
            <label class="field-label">ALT</label>
            <input v-model="row.imageAlt" type="text" class="field-input" />
          </div>

          <div class="field-group">
            <label class="field-label">TITLE</label>
            <input v-model="row.imageTitle" type="text" class="field-input" />
          </div>
        </div>

        <div
          v-if="row.type === 'image-left-text-right' || row.type === 'text-left-image-right' || row.type === 'text-only'"
          class="text-panel"
        >
          <label class="field-label">Treść</label>
          <HtmlEditor v-model="row.text" />
        </div>
      </div>
    </div>

    <div class="builder-footer">
      <button type="button" class="add-row-btn" @click="addRow">
        DODAJ KOLEJNY WIERSZ
      </button>

      <button
        type="button"
        class="add-row-btn add-row-btn--secondary"
        @click="$emit('add-ai-below')"
      >
        DODAJ SEKCJĘ AI
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import HtmlEditor from './HtmlEditor.vue'

type ProductDescriptionRowType =
  | 'image-left-text-right'
  | 'text-left-image-right'
  | 'text-only'
  | 'image-only'

interface ProductDescriptionRow {
  id: string
  type: ProductDescriptionRowType
  imageUrl: string | null
  imageAlt: string
  imageTitle: string
  text: string
}

interface NormalizedImage {
  label: string
  value: string
  alt: string
  title: string
}

export default defineComponent({
  name: 'ProductDescriptionBuilder',
  components: {
    HtmlEditor
  },
  props: {
    modelValue: {
      type: [Array, String],
      default: () => []
    },
    productImages: {
      type: Array as () => any[],
      default: () => []
    }
  },
  emits: ['update:modelValue', 'improve-ai', 'add-ai-below'],
  data() {
    return {
      localRows: [] as ProductDescriptionRow[]
    }
  },
  computed: {
    normalizedImages(): NormalizedImage[] {
      return (this.productImages || [])
        .filter((x: any) => x?.filePath)
        .map((x: any, index: number) => ({
          label: x.seoFileName || x.altAttribute || `Zdjęcie ${index + 1}`,
          value: x.filePath,
          alt: x.altAttribute || '',
          title: x.titleAttribute || ''
        }))
    }
  },
  watch: {
    modelValue: {
      immediate: true,
      deep: true,
      handler(value: unknown) {
        this.localRows = this.normalizeModelValue(value)
      }
    },
    localRows: {
      deep: true,
      handler(value: ProductDescriptionRow[]) {
        this.$emit('update:modelValue', JSON.parse(JSON.stringify(value)))
      }
    }
  },
  methods: {
    normalizeModelValue(value: unknown): ProductDescriptionRow[] {
      if (typeof value === 'string') {
        const html = value.trim()

        if (!html) return []

        return [
          {
            id: crypto.randomUUID(),
            type: 'text-only',
            imageUrl: null,
            imageAlt: '',
            imageTitle: '',
            text: html
          }
        ]
      }

      if (Array.isArray(value)) {
        const rows = JSON.parse(JSON.stringify(value))
        return rows.map((row: any) => this.normalizeRow(row))
      }

      return []
    },

    normalizeRow(row: any): ProductDescriptionRow {
      return {
        id: row?.id || crypto.randomUUID(),
        type: row?.type || 'text-only',
        imageUrl: row?.imageUrl ?? null,
        imageAlt: row?.imageAlt || '',
        imageTitle: row?.imageTitle || '',
        text: row?.text || row?.description || ''
      }
    },

    createEmptyRow(): ProductDescriptionRow {
      return {
        id: crypto.randomUUID(),
        type: 'image-left-text-right',
        imageUrl: null,
        imageAlt: '',
        imageTitle: '',
        text: ''
      }
    },

    addRow() {
      this.localRows.push(this.createEmptyRow())
    },

    removeRow(index: number) {
      this.localRows.splice(index, 1)
    },

    duplicateRow(index: number) {
      const row = this.localRows[index]
      if (!row) return

      this.localRows.splice(index + 1, 0, {
        ...JSON.parse(JSON.stringify(row)),
        id: crypto.randomUUID()
      })
    },

    moveUp(index: number) {
      if (index === 0) return
      const item = this.localRows[index]
      this.localRows.splice(index, 1)
      this.localRows.splice(index - 1, 0, item)
    },

    moveDown(index: number) {
      if (index >= this.localRows.length - 1) return
      const item = this.localRows[index]
      this.localRows.splice(index, 1)
      this.localRows.splice(index + 1, 0, item)
    },

    onImageChange(row: ProductDescriptionRow) {
      if (!row.imageUrl) return

      const selected = this.normalizedImages.find((x) => x.value === row.imageUrl)
      if (!selected) return

      if (!row.imageAlt) {
        row.imageAlt = selected.alt
      }

      if (!row.imageTitle) {
        row.imageTitle = selected.title
      }
    }
  },
  mounted() {
    if (!this.localRows.length) {
      this.addRow()
    }
  }
})
</script>

<style scoped>
.description-builder {
  border: 1px solid #d9d9d9;
  background: #fff;
}

.builder-row {
  border-bottom: 1px solid #e5e7eb;
  padding: 16px;
}

.builder-row__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.builder-row__types,
.builder-row__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.builder-row__types button,
.builder-row__actions button,
.add-row-btn {
  border: 1px solid #d1d5db;
  background: white;
  padding: 8px 12px;
  cursor: pointer;
}

.builder-row__types button.active {
  background: #ea580c;
  color: white;
  border-color: #ea580c;
}

.builder-row__content {
  display: grid;
  gap: 16px;
  align-items: start;
}

.layout-image-left,
.layout-image-right {
  grid-template-columns: 1fr 1fr;
}

.layout-text-only {
  grid-template-columns: 1fr;
}

.layout-image-only {
  grid-template-columns: 1fr;
}

.layout-image-right .image-panel {
  order: 2;
}

.layout-image-right .text-panel {
  order: 1;
}

.image-panel,
.text-panel {
  background: #fafafa;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.field-group {
  margin-top: 12px;
}

.field-label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
}

.field-input {
  width: 100%;
  border: 1px solid #d1d5db;
  padding: 10px;
}

.image-preview {
  margin-top: 12px;
}

.image-preview img {
  max-width: 100%;
  height: auto;
  display: block;
  border: 1px solid #ddd;
}

.builder-footer {
  padding: 20px;
  text-align: center;
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.add-row-btn {
  font-weight: 700;
  letter-spacing: 2px;
}

.add-row-btn--secondary {
  letter-spacing: 1px;
}
</style>