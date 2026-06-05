<template>
  <div class="allegro-desc-editor">
    <EditorContent
      v-if="editor"
      :editor="editor"
      class="allegro-desc-editor__content"
    />

    <div
      v-if="editor"
      class="allegro-desc-editor__toolbar"
    >
      <button
        type="button"
        class="toolbar-btn"
        title="Cofnij"
        :disabled="!editor.can().undo()"
        @click="editor.chain().focus().undo().run()"
      >
        ↶
      </button>

      <button
        type="button"
        class="toolbar-btn"
        title="Ponów"
        :disabled="!editor.can().redo()"
        @click="editor.chain().focus().redo().run()"
      >
        ↷
      </button>

      <select
        class="toolbar-select"
        :value="blockType"
        @change="setBlockType"
      >
        <option
          v-for="option in blockOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <button
        type="button"
        class="toolbar-btn"
        :class="{ 'toolbar-btn--active': editor.isActive('bold') }"
        title="Pogrubienie"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <strong>B</strong>
      </button>

      <button
        type="button"
        class="toolbar-btn"
        :class="{ 'toolbar-btn--active': editor.isActive('bulletList') }"
        title="Lista punktowana"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        •
      </button>

      <button
        type="button"
        class="toolbar-btn"
        :class="{ 'toolbar-btn--active': editor.isActive('orderedList') }"
        title="Lista numerowana"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        1.
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import Placeholder from '@tiptap/extension-placeholder'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = ref<Editor | null>(null)
const isUpdatingFromEditor = ref(false)
const blockType = ref('paragraph')

const blockOptions = [
  { value: 'paragraph', label: 'Podstawowy tekst' },
  { value: 'h1', label: 'Nagłówek 1' },
  { value: 'h2', label: 'Nagłówek 2' },
]

const updateBlockType = () => {
  if (!editor.value) return

  if (editor.value.isActive('heading', { level: 1 })) {
    blockType.value = 'h1'
    return
  }

  if (editor.value.isActive('heading', { level: 2 })) {
    blockType.value = 'h2'
    return
  }

  blockType.value = 'paragraph'
}

const emitHtml = () => {
  if (!editor.value) return

  const html = editor.value.getHTML()

  isUpdatingFromEditor.value = true
  emit('update:modelValue', html)

  requestAnimationFrame(() => {
    isUpdatingFromEditor.value = false
  })
}

const setBlockType = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value

  if (!editor.value) return

  if (value === 'paragraph') {
    editor.value.chain().focus().setParagraph().run()
  } else if (value === 'h1') {
    editor.value.chain().focus().toggleHeading({ level: 1 }).run()
  } else if (value === 'h2') {
    editor.value.chain().focus().toggleHeading({ level: 2 }).run()
  }

  blockType.value = value
  emitHtml()
}

onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue || '',
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Heading.configure({
        levels: [1, 2],
      }),
      Placeholder.configure({
        placeholder: 'Wpisz opis produktu',
      }),
    ],
    editorProps: {
      attributes: {
        class: 'allegro-desc-editor__prosemirror',
      },
    },
    onUpdate: () => {
      updateBlockType()
      emitHtml()
    },
    onSelectionUpdate: () => {
      updateBlockType()
    },
  })

  updateBlockType()
})

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value || isUpdatingFromEditor.value) return

    const nextValue = value || ''

    if (editor.value.getHTML() === nextValue) return

    editor.value.commands.setContent(nextValue, false)
    updateBlockType()
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.allegro-desc-editor {
  display: flex;
  flex-direction: column;
  min-height: 220px;
  background: #fff;
}

.allegro-desc-editor__content {
  flex: 1;
}

:deep(.allegro-desc-editor__prosemirror) {
  min-height: 180px;
  padding: 16px 20px;
  outline: none;
  font-size: 14px;
  line-height: 1.5;
  color: #111827;
}

:deep(.allegro-desc-editor__prosemirror h1) {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 12px;
  line-height: 1.3;
}

:deep(.allegro-desc-editor__prosemirror h2) {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 10px;
  line-height: 1.3;
}

:deep(.allegro-desc-editor__prosemirror p) {
  margin: 0 0 8px;
}

:deep(.allegro-desc-editor__prosemirror ul),
:deep(.allegro-desc-editor__prosemirror ol) {
  margin: 0 0 8px;
  padding-left: 1.25rem;
}

:deep(.allegro-desc-editor__prosemirror li) {
  margin-bottom: 4px;
}

:deep(.allegro-desc-editor__prosemirror p.is-editor-empty:first-child::before) {
  color: #9ca3af;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.allegro-desc-editor__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 42px;
  padding: 0 16px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}

.toolbar-btn {
  border: 0;
  background: transparent;
  color: #111827;
  font-size: 14px;
  line-height: 1;
  padding: 4px;
  cursor: pointer;
}

.toolbar-btn:disabled {
  color: #d1d5db;
  cursor: default;
}

.toolbar-btn--active {
  color: #ea580c;
}

.toolbar-select {
  border: 0;
  background: transparent;
  color: #111827;
  font-size: 12px;
  outline: none;
  cursor: pointer;
  min-width: 130px;
}
</style>
