<script lang="ts" setup>

import { computed, onMounted, reactive, ref, watch } from 'vue'

import {

  DEFAULT_DESCRIPTION_AI_CONFIG,

  DESCRIPTION_AI_CONFIG_STORAGE_KEY,

  type DescriptionLayoutPattern

} from '/@/utils/descriptionRowUtils'

import {

  DESCRIPTION_TEMPLATES,

  getDescriptionTemplate,

  layoutLabel,

  MANUAL_TEMPLATE_ID

} from '/@/utils/descriptionTemplates'



const emit = defineEmits<{

  (e: 'close'): void

  (e: 'generate', config: typeof form): void

}>()



defineProps<{

  loading?: boolean

  imageCount?: number

}>()



const form = reactive({

  templateId: DEFAULT_DESCRIPTION_AI_CONFIG.templateId,

  sectionsCount: DEFAULT_DESCRIPTION_AI_CONFIG.sectionsCount,

  layoutPattern: DEFAULT_DESCRIPTION_AI_CONFIG.layoutPattern as DescriptionLayoutPattern,

  customPrompt: DEFAULT_DESCRIPTION_AI_CONFIG.customPrompt,

  competitorUrl: DEFAULT_DESCRIPTION_AI_CONFIG.competitorUrl,

  exampleDescription: DEFAULT_DESCRIPTION_AI_CONFIG.exampleDescription,

  specification: DEFAULT_DESCRIPTION_AI_CONFIG.specification

})



const showAdvanced = ref(false)



const selectedTemplate = computed(() => getDescriptionTemplate(form.templateId))

const isManualTemplate = computed(() => form.templateId === MANUAL_TEMPLATE_ID)



const templateOptions = DESCRIPTION_TEMPLATES.map((t) => ({

  label: t.name,

  value: t.id

}))



const layoutOptions = [

  { label: 'Na przemian: tekst lewo / zdjęcie prawo (start)', value: 'alternating-text-first' },

  { label: 'Na przemian: zdjęcie lewo / tekst prawo (start)', value: 'alternating-image-first' },

  { label: 'Tylko tekst (bez układu ze zdjęciami)', value: 'text-only' }

]



watch(

  () => form.templateId,

  (id) => {

    const template = getDescriptionTemplate(id)

    if (template.slots.length > 0) {

      form.sectionsCount = template.slots.length

    }

  },

  { immediate: true }

)



const loadConfig = () => {

  try {

    const raw = localStorage.getItem(DESCRIPTION_AI_CONFIG_STORAGE_KEY)

    if (!raw) return

    const saved = JSON.parse(raw)

    Object.assign(form, { ...DEFAULT_DESCRIPTION_AI_CONFIG, ...saved })

  } catch {

    // ignore

  }

}



const saveConfig = () => {

  localStorage.setItem(DESCRIPTION_AI_CONFIG_STORAGE_KEY, JSON.stringify({ ...form }))

}



onMounted(loadConfig)



const handleGenerate = () => {

  saveConfig()

  emit('generate', { ...form })

}



const handleClose = () => {

  emit('close')

}



</script>



<template>

  <el-dialog

    :model-value="true"

    title="Generuj opis produktu z AI (zdjęcia)"

    width="760px"

    @close="handleClose"

  >

    <p class="text-sm text-gray-600 mb-4">

      Wybierz szablon układu sekcji. AI wygeneruje treść dopasowaną do każdej sekcji szablonu.

      <span v-if="imageCount !== undefined" class="block mt-1">

        Dostępne zdjęcia: <strong>{{ imageCount }}</strong>

      </span>

    </p>



    <div class="space-y-3">

      <FormKit

        type="select"

        v-model="form.templateId"

        label="Szablon opisu"

        :options="templateOptions"

      />



      <p class="text-xs text-gray-500 -mt-1">

        {{ selectedTemplate.description }}

      </p>



      <div

        v-if="!isManualTemplate && selectedTemplate.slots.length"

        class="border rounded-md p-3 bg-slate-50 space-y-2"

      >

        <p class="text-sm font-semibold text-slate-700">Podgląd szablonu ({{ selectedTemplate.slots.length }} sekcji)</p>

        <div

          v-for="(slot, index) in selectedTemplate.slots"

          :key="index"

          class="flex gap-2 text-sm border-b border-slate-200 pb-2 last:border-0 last:pb-0"

        >

          <span class="font-medium text-slate-500 shrink-0 w-6">{{ index + 1 }}.</span>

          <div>

            <span class="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-medium mr-2">

              {{ layoutLabel(slot.layout) }}

            </span>

            <span class="text-slate-700">{{ slot.label }}</span>

            <p v-if="slot.headingHint" class="text-xs text-slate-500 mt-0.5">

              Nagłówek: {{ slot.headingHint }}

            </p>

          </div>

        </div>

      </div>



      <template v-if="isManualTemplate">

        <FormKit

          type="number"

          v-model="form.sectionsCount"

          label="Liczba sekcji"

          min="1"

          max="8"

        />



        <FormKit

          type="select"

          v-model="form.layoutPattern"

          label="Układ sekcji ze zdjęciami"

          :options="layoutOptions"

        />

      </template>



      <FormKit

        type="textarea"

        v-model="form.exampleDescription"

        label="Przykładowy opis / notatki (gdy brak zdjęć lub jako kontekst)"

        rows="3"

        placeholder="Wklej opis od klienta, notatki, fragmenty ze specyfikacji..."

      />



      <FormKit

        type="textarea"

        v-model="form.specification"

        label="Specyfikacja techniczna (ważne dla sekcji specyfikacji w szablonie)"

        rows="4"

        placeholder="Wklej parametry produktu – AI użyje ich w sekcji Specyfikacja techniczna ✅"

      />



      <FormKit

        type="text"

        v-model="form.competitorUrl"

        label="Link do strony konkurencji (opcjonalnie, jako kontekst dla opisu)"

        placeholder="https://..."

        help="AI używa strony tylko jako źródła faktów — opis jest pisany własnymi słowami, bez kopiowania 1:1 i bez nazw firmowych konkurentów."

      />



      <el-button text type="primary" @click="showAdvanced = !showAdvanced">

        {{ showAdvanced ? 'Ukryj' : 'Pokaż' }} zaawansowany prompt

      </el-button>



      <div v-if="showAdvanced" class="border rounded p-3 bg-gray-50">

        <p class="text-xs text-gray-500 mb-2">

          Placeholdery: {sectionsCount}, {productName}, {exampleDescription}, {specification},

          {competitorInfo}, {imageCount}, {templateSlots}. Puste pole = domyślny prompt (uwzględnia szablon).

        </p>

        <FormKit

          type="textarea"

          v-model="form.customPrompt"

          label="Własny prompt (nadpisuje domyślny)"

          rows="8"

        />

      </div>

    </div>



    <template #footer>

      <el-button @click="handleClose">Anuluj</el-button>

      <el-button type="primary" :loading="loading" @click="handleGenerate">

        Generuj opis

      </el-button>

    </template>

  </el-dialog>

</template>


