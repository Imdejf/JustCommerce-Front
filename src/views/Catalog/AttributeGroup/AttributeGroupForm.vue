<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import type { AttributeGroupDTO } from '/@/types/attributeGroup/AttributeGroup.ts'
import { reactive, ref } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'

const props = defineProps({
  attributeGroup: {
    type: Object as ObjectConstructor,
    default: () => ({} as AttributeGroupDTO)
  },
  updated: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const route = useRoute()
const toast = useToast()

const currentAttributeGroup = reactive(props.attributeGroup)

if (props.updated) {
  currentAttributeGroup.attributeGroupId = route.params.id
}

const handleSave = async () => {
  try {
    const payload = {
      body: JSON.stringify(currentAttributeGroup)
    }
    if (!props.updated) {
      await Api.attributeGroups.create(payload)
      toast.success('Dodano kategorie', {
        timeout: 2000
      })
    } else {
      await Api.attributeGroups.update(payload)
      toast.success('Edytowano kategorie', {
        timeout: 2000
      })
    }

    router.go(-1)
  } catch (error) {
    toast.error('Wystąpił błąd', {
      timeout: 2000
    })
  }
}
</script>

<template>
  <ContentContainer :showLanguage="false">
    <FormKit ref="myForm" type="form" @submit="handleSave" :actions="false">
      <FormSection :title="'Grupa atrybutów'">
        <FormKit
          type="text"
          v-model="currentAttributeGroup.name"
          label="Nazwa"
          validation="required"
          validation-visibility="live"
          help=""
        />
      </FormSection>
      <div class="save-button w-full my-10">
        <FormKit type="submit" label="Zapisz" style="display: flex; justify-content: flex-end" />
      </div>
    </FormKit>
  </ContentContainer>
</template>
