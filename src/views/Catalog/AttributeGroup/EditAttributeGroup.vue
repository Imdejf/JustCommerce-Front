<script lang="ts" setup>
import { Api } from '/@/services/api'
import type { AttributeGroupDTO } from '/@/types/attributeGroup/AttributeGroup.ts'
import { onMounted, ref } from 'vue'
import AttributeGroupForm from '/@/components/Page/Catalog/AttributeGroup/AttributeGroupForm.vue'
import { useRoute } from 'vue-router'
import { useLanguageStore } from '/@/stores/language'

const language = useLanguageStore()
const route = useRoute()
const attributeGroup = ref<AttributeGroupDTO | null>(null)

const getById = (id: string) => {
  return Api.attributeGroups.get(id)
}

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  attributeGroup.value = result.data
})
</script>
<template>
  <div v-if="attributeGroup">
    <AttributeGroupForm :attributeGroup="attributeGroup" :updated="true" />
  </div>
</template>
