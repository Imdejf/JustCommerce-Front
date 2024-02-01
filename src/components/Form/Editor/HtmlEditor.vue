<template>
  <div id="text-editor" class="w-full">
    <div class="toolbar" v-if="editor">
      <div class="align-dropdown">
        <a class="dropbtn">Heading ▼</a>
        <div class="dropdown-content">
          <a
            v-for="index in 6"
            :key="index"
            :class="{ active: editor.isActive('heading', { level: index }) }"
            :style="{ fontSize: 20 - index + 'px' }"
            @click="onHeadingClick(index)"
            role="button"
          >
            {{ index }}
          </a>
        </div>
      </div>
      <div class="align-dropdown">
        <a class="dropbtn">Kolor ▼</a>
        <div class="dropdown-content w-[125px]">
          <a
            v-for="color in colors"
            :key="index"
            :class="{ 'is-active': editor.isActive('textStyle', { color: color.value }) }"
            @click="onColorClick(color.value)"
          >
            {{ color.name }}
          </a>
          <a @click="editor.chain().focus().unsetColor().run()">Domyślny</a>
        </div>
      </div>
      <a
        v-for="({ slug, option, active, icon }, index) in textActions"
        :key="index"
        :class="{ active: editor.isActive(active) }"
        class="mr-2"
        @click="onActionClick(slug, option)"
      >
        <font-awesome-icon :icon="icon"></font-awesome-icon>
      </a>
      <a @click="toggleView" class="mx-2 font-bold">{{ isSourceMode ? 'Treść' : 'HTML' }}</a>
      <a
        href="#"
        class="dropzone-button-file"
        @click="openFileInput"
        @dragover.prevent="handleDragOver"
        @dragenter.prevent="handleDragEnter"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        Wybierz plik
      </a>

      <input
        ref="fileInput"
        type="file"
        style="display: none"
        accept=".jpeg, .jpg, .png, .webp"
        @change="handleFileSelect"
        @dragover.prevent="handleDragOver"
        @dragenter.prevent="handleDragEnter"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      />
    </div>

    <editor-content :editor="editor" />
    <div v-if="editor" class="footer">
      <span class="characters-count" :class="maxLimit ? limitWarning : ''">
        {{ charactersCount }} {{ maxLimit ? `/ ${maxLimit} characters` : 'characters' }}
      </span>
      |
      <span class="words-count"> {{ wordsCount }} words </span>
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
import Image from '@tiptap/extension-image'
import TextStyle from '@tiptap/extension-text-style'
import Cookies from 'universal-cookie'
import Link from '@tiptap/extension-link'

export default {
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
  data() {
    return {
      isSourceMode: false,
      storedHTML: '',
      imageBase64: null,
      isDragging: false,
      editor: null,
      textActions: [
        { slug: 'bold', icon: 'fa-bold', active: 'bold' },
        { slug: 'italic', icon: 'fa-italic', active: 'italic' },
        { slug: 'underline', icon: 'fa-underline', active: 'underline' },
        { slug: 'strike', icon: 'fa-strikethrough', active: 'strike' },
        { slug: 'align', option: 'left', icon: 'fa-align-left', active: { textAlign: 'left' } },
        {
          slug: 'align',
          option: 'center',
          icon: 'fa-align-center',
          active: { textAlign: 'center' }
        },
        { slug: 'align', option: 'right', icon: 'fa-align-right', active: { textAlign: 'right' } },
        {
          slug: 'align',
          option: 'justify',
          icon: 'fa-align-justify',
          active: { textAlign: 'justify' }
        },
        { slug: 'bulletList', icon: 'fa-list', active: 'bulletList' },
        { slug: 'orderedList', icon: 'fa-list-numeric', active: 'orderedList' },
        { slug: 'subscript', icon: 'fa-subscript', active: 'subscript' },
        { slug: 'superscript', icon: 'fa-superscript', active: 'superscript' },
        { slug: 'undo', icon: 'fa-arrow-rotate-left', active: 'undo' },
        { slug: 'redo', icon: 'fa-arrow-rotate-right', active: 'redo' },
        { slug: 'clear', icon: 'fa-text-slash', active: 'clear' }
      ],
      colors: [{ name: 'Czerwony', value: '#dc2626' }],
      isMenuVisible: false
    }
  },
  computed: {
    charactersCount() {
      return this.editor.storage.characterCount.characters()
    },
    wordsCount() {
      return this.editor.storage.characterCount.words()
    },
    limitWarning() {
      const isCloseToMax = this.charactersCount >= this.maxLimit - 20
      const isMax = this.charactersCount === this.maxLimit

      if (isCloseToMax && !isMax) return 'warning'
      if (isMax) return 'danger'

      return ''
    }
  },
  watch: {
    modelValue(value) {
      if (this.editor.getHTML() === value) return
      this.editor.commands.setContent(this.modelValue, false)
    }
  },
  methods: {
    decodeHtml(html) {
      var txt = document.createElement('textarea')
      txt.innerHTML = html
      return txt.textContent
    },
    removeEncodedTags(encodedHtml) {
      let decodedHtml = this.decodeHtml(encodedHtml)
      let textOnly = decodedHtml.replace(/<[^>]*>/g, '') // usuwa wszystkie tagi HTML
      return textOnly
    },
    toggleView() {
      if (this.isSourceMode) {
        this.storedHTML = this.editor.getText()
        console.log(this.removeEncodedTags(this.editor.getHTML()))
        this.editor.commands.setContent(this.storedHTML, false)
      } else {
        this.storedHTML = this.editor.getHTML()
        const escapedHTML = this.escapeHTML(this.storedHTML)
        this.editor.commands.setContent(escapedHTML, false)
      }
      this.isSourceMode = !this.isSourceMode
    },
    escapeHTML(html) {
      return html.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    },
    openFileInput() {
      this.$refs.fileInput.click()
    },
    handleFileSelect(event) {
      const selectedFile = event.target.files[0]
      if (selectedFile) {
        this.convertToBase64(selectedFile)
      }
    },
    handleDragOver(event) {
      event.preventDefault()
    },
    handleDragEnter() {
      this.isDragging = true
    },
    handleDragLeave() {
      this.isDragging = false
    },
    handleDrop(event) {
      event.preventDefault()
      this.isDragging = false
      const file = event.dataTransfer.files[0]
      this.convertToBase64(file)
    },
    convertToBase64(file) {
      const reader = new FileReader()
      reader.onload = async () => {
        this.imageBase64 = reader.result.split(',')[1]
        const path = await this.saveContent()
        console.log(path)
      }
      reader.readAsDataURL(file)
    },
    async saveContent() {
      const defaultString = import.meta.env.VITE_API_URL
      const cookies = new Cookies()
      const fileToSave = {
        storeId: cookies.get('dsStore'),
        base64File: {
          base64String: this.imageBase64
        }
      }
      const json = JSON.stringify(fileToSave)

      const response = await fetch(defaultString + 'administration/file/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json
      })
      const data = await response.json()
      this.addImage(data.data)
    },
    addImage(url) {
      this.isSourceMode = false

      if (url) {
        this.editor.chain().focus().setImage({ src: url }).run()
      }
    },

    // <p style="text-align: center">dsa</p><img src="https://olmag.blob.core.windows.net/olmag/Content/fac900ad-fbcc-4d52-b570-07e9b96e5a3d.webp">
    onActionClick(slug, option = null) {
      const vm = this.editor.chain().focus()
      const actionTriggers = {
        bold: () => vm.toggleBold().run(),
        italic: () => vm.toggleItalic().run(),
        underline: () => vm.toggleUnderline().run(),
        strike: () => vm.toggleStrike().run(),
        bulletList: () => vm.toggleBulletList().run(),
        orderedList: () => vm.toggleOrderedList().run(),
        align: () => vm.setTextAlign(option).run(),
        subscript: () => vm.toggleSubscript().run(),
        superscript: () => vm.toggleSuperscript().run(),
        undo: () => vm.undo().run(),
        redo: () => vm.redo().run(),
        clear: () => {
          vm.clearNodes().run()
          vm.unsetAllMarks().run()
        }
      }

      actionTriggers[slug]()
    },
    onHeadingClick(index) {
      const vm = this.editor.chain().focus()
      vm.toggleHeading({ level: index }).run()
    },
    setFontSize() {
      const vm = this.editor.chain().focus()
    },
    onColorClick(color: string) {
      const vm = this.editor.chain().focus()
      vm.setColor(color).run()
    },
    toggleMenu() {
      this.isMenuVisible = !this.isMenuVisible
    }
  },
  mounted() {
    this.editor = new Editor({
      content: this.modelValue,
      extensions: [
        StarterKit,
        Underline,
        TextStyle,
        Color,
        Text,
        Subscript,
        Superscript,
        Image,
        Link.configure({
          autolink: false,
          openOnClick: false,
          linkOnPaste: false,
          HTMLAttributes: {
            rel: null,
            target: null
          }
        }),
        CharacterCount.configure({
          limit: this.maxLimit
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph']
        })
      ],
      onUpdate: () => {
        this.$emit('update:modelValue', this.editor.getHTML())
      }
    })
  },
  beforeUnmount() {
    this.editor.destroy()
  }
}
</script>

<style lang="less">
.dropzone-button-file {
  border: 2px dashed #ccc;
  padding: 20px;
  text-align: center;
  cursor: pointer;
}
.ProseMirror {
  height: 300px !important;
  overflow: auto !important;
  padding-left: 0.5em;
  padding-right: 0.5em;
  outline: none;

  > p:first-child {
    margin-top: 0.5em;
  }

  > h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    &:first-child {
      margin-top: 0.5em;
    }
  }
}
#text-editor {
  border: 1px solid #808080;
  background-color: white;

  .toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    border-bottom: 1px solid #808080;

    > button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      font-size: 20px;
      background: #fff;
      color: #333;
      border: none;
      border-radius: 2px;
      margin: 0.5em 4px;
      -webkit-appearance: none;
      cursor: pointer;

      &.active {
        background: #333;
        color: #fff;
      }
    }
  }

  .align-dropdown {
    position: relative;
    display: inline-block;
    margin: 0.5em 8px;

    > button {
      height: 32px;
      background: #fff;
      color: #333;
      border: none;
      border-radius: 2px;
      -webkit-appearance: none;
      cursor: pointer;
    }

    > .dropdown-content {
      display: none;
      position: absolute;
      left: 0;
      right: 0;
      border: 1px solid #333;
      outline: 1px solid #fff;
      border-radius: 2px;
      background-color: #fff;
      z-index: 1;

      a {
        display: block;
        padding: 6px 12px;
        text-align: center;
        cursor: pointer;

        &:hover,
        &.active {
          background: #333;
          color: #fff;
        }
      }
    }

    &:hover .dropdown-content {
      display: block;
    }
  }

  .divider {
    width: 1px;
    height: 24px;
    background: #333;
    margin-right: 6px;
  }

  .footer {
    color: #808080;
    font-size: 14px;
    text-align: right;
    padding: 6px;

    .characters-count {
      &.warning {
        color: orange;
      }

      &.danger {
        color: red;
      }
    }
  }
}

.ProseMirror {
  img {
    margin: auto;
    max-width: 70%;
    max-height: 300px;

    &.ProseMirror-selectednode {
      outline: 3px solid #68cef8;
    }
  }
}
</style>
