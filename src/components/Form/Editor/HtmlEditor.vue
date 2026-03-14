<template>
  <div id="text-editor" class="w-full">
    <div v-if="editor" class="toolbar">
      <div class="align-dropdown">
        <button type="button" class="dropbtn">Blok ▼</button>
        <div class="dropdown-content">
          <a
            :class="{ active: editor.isActive('paragraph') }"
            @click="setParagraph"
            role="button"
          >
            Akapit
          </a>
          <a
            v-for="level in [2, 3, 4, 5, 6]"
            :key="level"
            :class="{ active: editor.isActive('heading', { level }) }"
            @click="onHeadingClick(level)"
            role="button"
          >
            H{{ level }}
          </a>
        </div>
      </div>

      <div class="align-dropdown">
        <button type="button" class="dropbtn">Kolor ▼</button>
        <div class="dropdown-content w-[160px]">
          <a
            v-for="color in colors"
            :key="color.value"
            :class="{ active: editor.isActive('textStyle', { color: color.value }) }"
            @click="onColorClick(color.value)"
          >
            {{ color.name }}
          </a>
          <a @click="editor.chain().focus().unsetColor().run()">Domyślny</a>
        </div>
      </div>

      <button
        v-for="({ slug, option, active, icon, title }, index) in textActions"
        :key="index"
        type="button"
        :class="{ active: isButtonActive(active) }"
        :title="title"
        class="toolbar-btn"
        @click="onActionClick(slug, option)"
      >
        <font-awesome-icon :icon="icon" />
      </button>

      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('link') }"
        title="Dodaj / edytuj link"
        @click="setLink"
      >
        <font-awesome-icon icon="fa-link" />
      </button>

      <button
        type="button"
        class="toolbar-btn"
        title="Usuń link"
        @click="unsetLink"
      >
        <font-awesome-icon icon="fa-link-slash" />
      </button>

      <button
        type="button"
        class="toolbar-btn"
        title="Dodaj obraz"
        @click="openFileInput"
      >
        <font-awesome-icon icon="fa-image" />
      </button>

      <button
        type="button"
        class="toolbar-btn"
        title="Edytuj ALT/TITLE obrazka"
        @click="editSelectedImageMeta"
      >
        <font-awesome-icon icon="fa-pen-to-square" />
      </button>

      <button type="button" class="html-toggle" @click="toggleView">
        {{ isSourceMode ? 'Treść' : 'HTML' }}
      </button>

      <input
        ref="fileInput"
        type="file"
        style="display: none"
        accept=".jpeg, .jpg, .png, .webp"
        @change="handleFileSelect"
      />
    </div>

    <div v-if="!isSourceMode">
      <editor-content :editor="editor" />
    </div>

    <div v-else class="source-mode">
      <textarea
        v-model="sourceHtml"
        class="source-textarea"
        @input="onSourceInput"
      />
    </div>

    <div v-if="editor" class="footer">
      <span class="characters-count" :class="maxLimit ? limitWarning : ''">
        {{ charactersCount }} {{ maxLimit ? `/ ${maxLimit} characters` : 'characters' }}
      </span>
      |
      <span class="words-count">{{ wordsCount }} words</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Text from '@tiptap/extension-text'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import CharacterCount from '@tiptap/extension-character-count'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Cookies from 'universal-cookie'

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: {
        default: null
      },
      title: {
        default: null
      },
      loading: {
        default: 'lazy'
      }
    }
  }
})

function isExternalUrl(url: string) {
  return /^(https?:)?\/\//i.test(url)
}

function normalizeUrl(url: string) {
  if (!url) return ''
  const trimmed = url.trim()

  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return trimmed
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

export default {
  name: 'SeoTextEditor',
  components: {
    EditorContent
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    maxLimit: {
      type: Number,
      default: null
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      editor: null as Editor | null,
      isSourceMode: false,
      sourceHtml: '',
      imageBase64: null as string | null,
      textActions: [
        { slug: 'bold', icon: 'fa-bold', active: 'bold', title: 'Pogrubienie' },
        { slug: 'italic', icon: 'fa-italic', active: 'italic', title: 'Kursywa' },
        { slug: 'underline', icon: 'fa-underline', active: 'underline', title: 'Podkreślenie' },
        { slug: 'strike', icon: 'fa-strikethrough', active: 'strike', title: 'Przekreślenie' },
        { slug: 'blockquote', icon: 'fa-quote-left', active: 'blockquote', title: 'Cytat' },
        { slug: 'bulletList', icon: 'fa-list', active: 'bulletList', title: 'Lista punktowana' },
        { slug: 'orderedList', icon: 'fa-list-numeric', active: 'orderedList', title: 'Lista numerowana' },
        { slug: 'horizontalRule', icon: 'fa-minus', active: 'horizontalRule', title: 'Separator' },
        { slug: 'align', option: 'left', icon: 'fa-align-left', active: { textAlign: 'left' }, title: 'Do lewej' },
        { slug: 'align', option: 'center', icon: 'fa-align-center', active: { textAlign: 'center' }, title: 'Wyśrodkuj' },
        { slug: 'align', option: 'right', icon: 'fa-align-right', active: { textAlign: 'right' }, title: 'Do prawej' },
        { slug: 'align', option: 'justify', icon: 'fa-align-justify', active: { textAlign: 'justify' }, title: 'Wyjustuj' },
        { slug: 'subscript', icon: 'fa-subscript', active: 'subscript', title: 'Indeks dolny' },
        { slug: 'superscript', icon: 'fa-superscript', active: 'superscript', title: 'Indeks górny' },
        { slug: 'undo', icon: 'fa-arrow-rotate-left', active: 'undo', title: 'Cofnij' },
        { slug: 'redo', icon: 'fa-arrow-rotate-right', active: 'redo', title: 'Ponów' },
        { slug: 'clear', icon: 'fa-text-slash', active: 'clear', title: 'Wyczyść formatowanie' }
      ],
      colors: [
        { name: 'Czerwony', value: '#dc2626' },
        { name: 'Zielony', value: '#16a34a' },
        { name: 'Niebieski', value: '#2563eb' },
        { name: 'Szary', value: '#4b5563' }
      ]
    }
  },
  computed: {
    charactersCount() {
      return this.editor?.storage?.characterCount?.characters?.() ?? 0
    },
    wordsCount() {
      return this.editor?.storage?.characterCount?.words?.() ?? 0
    },
    limitWarning() {
      if (!this.maxLimit) return ''
      const isCloseToMax = this.charactersCount >= this.maxLimit - 20
      const isMax = this.charactersCount >= this.maxLimit

      if (isCloseToMax && !isMax) return 'warning'
      if (isMax) return 'danger'
      return ''
    }
  },
  watch: {
    modelValue(value: string) {
      if (!this.editor) return
      if (this.isSourceMode) {
        if (this.sourceHtml !== value) {
          this.sourceHtml = value
        }
        return
      }

      if (this.editor.getHTML() === value) return
      this.editor.commands.setContent(value || '', false)
    }
  },
  methods: {
    isButtonActive(active: any) {
      if (!this.editor) return false

      if (typeof active === 'string') {
        return this.editor.isActive(active)
      }

      if (typeof active === 'object') {
        const [key, value] = Object.entries(active)[0]
        return this.editor.isActive({ [key]: value })
      }

      return false
    },

    toggleView() {
      if (!this.editor) return

      if (this.isSourceMode) {
        this.editor.commands.setContent(this.sourceHtml || '', false)
        this.$emit('update:modelValue', this.editor.getHTML())
      } else {
        this.sourceHtml = this.editor.getHTML()
      }

      this.isSourceMode = !this.isSourceMode
    },

    onSourceInput() {
      this.$emit('update:modelValue', this.sourceHtml)
    },

    setParagraph() {
      this.editor?.chain().focus().setParagraph().run()
    },

    onHeadingClick(level: number) {
      this.editor?.chain().focus().toggleHeading({ level }).run()
    },

    onColorClick(color: string) {
      this.editor?.chain().focus().setColor(color).run()
    },

    onActionClick(slug: string, option: string | null = null) {
      if (!this.editor) return

      const vm = this.editor.chain().focus()

      const actionTriggers: Record<string, () => void> = {
        bold: () => vm.toggleBold().run(),
        italic: () => vm.toggleItalic().run(),
        underline: () => vm.toggleUnderline().run(),
        strike: () => vm.toggleStrike().run(),
        blockquote: () => vm.toggleBlockquote().run(),
        bulletList: () => vm.toggleBulletList().run(),
        orderedList: () => vm.toggleOrderedList().run(),
        horizontalRule: () => vm.setHorizontalRule().run(),
        align: () => vm.setTextAlign(option || 'left').run(),
        subscript: () => vm.toggleSubscript().run(),
        superscript: () => vm.toggleSuperscript().run(),
        undo: () => vm.undo().run(),
        redo: () => vm.redo().run(),
        clear: () => vm.clearNodes().unsetAllMarks().run()
      }

      actionTriggers[slug]?.()
    },

    setLink() {
      if (!this.editor) return

      const previousUrl = this.editor.getAttributes('link').href || ''
      const rawUrl = window.prompt('Podaj URL linku (np. /kategoria lub https://example.com)', previousUrl)

      if (rawUrl === null) return

      const url = normalizeUrl(rawUrl)

      if (!url) {
        this.editor.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }

      const isExternal = isExternalUrl(url)

      this.editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({
          href: url,
          target: isExternal ? '_blank' : null,
          rel: isExternal ? 'noopener noreferrer' : null
        })
        .run()
    },

    unsetLink() {
      this.editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    },

    openFileInput() {
      ;(this.$refs.fileInput as HTMLInputElement)?.click()
    },

    handleFileSelect(event: Event) {
      const input = event.target as HTMLInputElement
      const selectedFile = input.files?.[0]
      if (selectedFile) {
        this.convertToBase64(selectedFile)
      }
      input.value = ''
    },

    convertToBase64(file: File) {
      const reader = new FileReader()
      reader.onload = async () => {
        const result = reader.result as string
        this.imageBase64 = result.split(',')[1]
        await this.saveContent(file.name)
      }
      reader.readAsDataURL(file)
    },

    async saveContent(fileName?: string) {
      const defaultString = import.meta.env.VITE_API_URL
      const cookies = new Cookies()

      const fileToSave = {
        storeId: cookies.get('dsStore'),
        base64File: {
          base64String: this.imageBase64
        }
      }

      const response = await fetch(`${defaultString}administration/file/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileToSave)
      })

      const data = await response.json()
      this.addImage(data?.data, fileName)
    },

    addImage(url: string, fileName?: string) {
      if (!this.editor || !url) return

      this.isSourceMode = false

      const alt = window.prompt('ALT obrazka (ważne dla SEO i dostępności)', fileName || '') || ''
      const title = window.prompt('TITLE obrazka (opcjonalnie)', alt || fileName || '') || ''

      this.editor
        .chain()
        .focus()
        .setImage({
          src: url,
          alt: alt || null,
          title: title || null,
          loading: 'lazy'
        })
        .run()
    },

    editSelectedImageMeta() {
      if (!this.editor) return

      const attrs = this.editor.getAttributes('image')
      if (!attrs?.src) {
        window.alert('Najpierw zaznacz obrazek.')
        return
      }

      const alt = window.prompt('ALT obrazka', attrs.alt || '') ?? attrs.alt ?? ''
      const title = window.prompt('TITLE obrazka', attrs.title || '') ?? attrs.title ?? ''

      this.editor
        .chain()
        .focus()
        .updateAttributes('image', {
          alt: alt || null,
          title: title || null,
          loading: 'lazy'
        })
        .run()
    }
  },
  mounted() {
    this.editor = new Editor({
      content: this.modelValue || '',
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [2, 3, 4, 5, 6]
          }
        }),
        Underline,
        TextStyle,
        Color,
        Text,
        Subscript,
        Superscript,
        CustomImage,
        Placeholder.configure({
          placeholder:
            'Wpisz treść opisu SEO, artykułu lub kategorii. Używaj nagłówków H2-H3, linków wewnętrznych, list i obrazów z ALT.'
        }),
        Link.configure({
          autolink: true,
          openOnClick: false,
          linkOnPaste: true,
          protocols: ['http', 'https', 'mailto', 'tel'],
          HTMLAttributes: {
            class: 'editor-link'
          }
        }),
        CharacterCount.configure({
          limit: this.maxLimit || undefined
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph']
        })
      ],
      editorProps: {
        attributes: {
          class: 'editor-content'
        }
      },
      onUpdate: ({ editor }) => {
        if (!this.isSourceMode) {
          this.$emit('update:modelValue', editor.getHTML())
        }
      }
    })

    this.sourceHtml = this.modelValue || ''
  },
  beforeUnmount() {
    this.editor?.destroy()
  }
}
</script>

<style lang="less">
#text-editor {
  border: 1px solid #808080;
  background-color: #fff;
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  border-bottom: 1px solid #808080;
}

.toolbar-btn,
.dropbtn,
.html-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  font-size: 14px;
  background: #fff;
  color: #333;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
}

.toolbar-btn.active,
.toolbar-btn:hover,
.dropbtn:hover,
.html-toggle:hover {
  background: #333;
  color: #fff;
}

.align-dropdown {
  position: relative;
  display: inline-block;
}

.align-dropdown .dropdown-content {
  display: none;
  position: absolute;
  left: 0;
  min-width: 140px;
  border: 1px solid #333;
  background: #fff;
  z-index: 20;
}

.align-dropdown:hover .dropdown-content {
  display: block;
}

.align-dropdown .dropdown-content a {
  display: block;
  padding: 8px 12px;
  cursor: pointer;
  text-align: left;
}

.align-dropdown .dropdown-content a:hover,
.align-dropdown .dropdown-content a.active {
  background: #333;
  color: #fff;
}

.ProseMirror {
  min-height: 350px;
  max-height: 600px;
  overflow: auto;
  padding: 16px;
  outline: none;
  line-height: 1.7;
  font-size: 16px;
}

.ProseMirror p {
  margin: 0 0 1em;
}

.ProseMirror h2,
.ProseMirror h3,
.ProseMirror h4,
.ProseMirror h5,
.ProseMirror h6 {
  margin: 1.2em 0 0.6em;
  line-height: 1.3;
  font-weight: 700;
}

.ProseMirror h2 {
  font-size: 30px;
}

.ProseMirror h3 {
  font-size: 24px;
}

.ProseMirror h4 {
  font-size: 20px;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5rem;
  margin: 0 0 1rem;
}

.ProseMirror blockquote {
  border-left: 4px solid #d1d5db;
  margin: 1rem 0;
  padding-left: 1rem;
  color: #4b5563;
}

.ProseMirror hr {
  margin: 1.5rem 0;
  border: 0;
  border-top: 1px solid #d1d5db;
}

.ProseMirror a {
  color: #2563eb;
  text-decoration: underline;
}

.ProseMirror img {
  display: block;
  margin: 1rem auto;
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.ProseMirror img.ProseMirror-selectednode {
  outline: 3px solid #68cef8;
}

.source-mode {
  padding: 0;
}

.source-textarea {
  width: 100%;
  min-height: 350px;
  border: none;
  outline: none;
  resize: vertical;
  font-family: monospace;
  font-size: 14px;
  padding: 16px;
  box-sizing: border-box;
}

.footer {
  color: #808080;
  font-size: 14px;
  text-align: right;
  padding: 8px 12px;
  border-top: 1px solid #e5e7eb;
}

.characters-count.warning {
  color: orange;
}

.characters-count.danger {
  color: red;
}
</style>