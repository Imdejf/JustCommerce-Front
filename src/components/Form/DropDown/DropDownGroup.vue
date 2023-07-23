<script lang="ts" setup>
import { ref, computed } from 'vue'
import { defineProps, defineEmits } from 'vue'
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot
} from '@headlessui/vue'

const emits = defineEmits(['update:modelValue'])

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  value: {
    type: String,
    default: null
  },
  options: {
    type: Array,
    default: []
  }
})

const people = computed(() => {
  //   if (!props.options.find((c) => c.name === 'Brak')) {
  //     props.options.splice(0, 0, { id: null, name: 'Brak' })
  //   }

  // Odseparuj grupy i pozycje bez grupy
  const groups = props.options.filter((option) => option.group)
  const ungroupedOptions = props.options.filter((option) => !option.group)

  // Wróć do wyświetlania pierwotnej listy osób, ale teraz używając odpowiednich grup
  const peopleWithGroups = []
  groups.forEach((group) => {
    const groupItem = {
      id: group.group.id,
      name: group.group.name,
      isGroup: true
    }
    peopleWithGroups.push(groupItem)
    group.items.forEach((item) => peopleWithGroups.push(item))
  })

  // Dodaj pozycje bez grupy na końcu listy
  peopleWithGroups.push(...ungroupedOptions)

  if (props.value && peopleWithGroups.length > 1) {
    selected.value = peopleWithGroups.find((c) => c.id === props.value)
  } else {
    selected.value = peopleWithGroups[1]
  }

  return peopleWithGroups
})

let selected = ref([])
let query = ref('')

let filteredPeople = computed(() =>
  query.value === ''
    ? people.value
    : people.value.filter((person) =>
        person.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(query.value.toLowerCase().replace(/\s+/g, ''))
      )
)
</script>
<template>
  <div class="top-16 w-72">
    <span class="formkit-label">{{ label }}</span>
    <Combobox
      v-model="selected"
      :defaultValue="people[1]"
      @update:modelValue="(value) => emits('update:modelValue', value.id)"
    >
      <div class="relative mt-1 z-8">
        <div
          class="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm"
        >
          <ComboboxInput
            class="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
            :displayValue="(person) => person.name"
            @change="query = $event.target.value"
          />
          <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-gray-400"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M12 14.975q-.2 0-.388-.075t-.312-.2l-4.6-4.6q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l3.9 3.9l3.9-3.9q.275-.275.7-.275t.7.275q.275.275.275.7t-.275.7l-4.6 4.6q-.15.15-.325.213t-.375.062Z"
              />
            </svg>
          </ComboboxButton>
        </div>
        <TransitionRoot
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          @after-leave="query = ''"
        >
          <ComboboxOptions
            class="absolute mt-1 max-h-60 z-10 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
          >
            <template v-for="(option, index) in filteredPeople">
              <div v-if="option.isGroup" :key="option.id">
                <!-- Grupa: Wyświetl nazwę grupy -->
                <div class="relative cursor-default select-none py-2 pl-4 text-gray-700">
                  {{ option.name }}
                </div>
              </div>
              <ComboboxOption v-else :key="option.id" :value="option" v-slot="{ selected, active }">
                <li
                  class="relative cursor-default select-none py-2 pl-10 pr-4"
                  :class="{
                    'bg-orange-500 text-white': active,
                    'text-gray-900': !active
                  }"
                >
                  <span
                    class="block truncate"
                    :class="{ 'font-medium': selected, 'font-normal': !selected }"
                  >
                    {{ option.name }}
                  </span>
                  <span
                    v-if="selected"
                    class="absolute inset-y-0 left-0 flex items-center pl-3"
                    :class="{ 'text-white': active, 'text-teal-600': !active }"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="m10 16.4l-4-4L7.4 11l2.6 2.6L16.6 7L18 8.4l-8 8Z"
                      />
                    </svg>
                  </span>
                </li>
              </ComboboxOption>
            </template>
          </ComboboxOptions>
        </TransitionRoot>
      </div>
    </Combobox>
  </div>
</template>
