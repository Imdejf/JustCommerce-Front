<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import InfoBox from '/@/components/Form/Box/InfoBox.vue'
import { Api } from '/@/services/api'
import type { AttributeGroupDTO } from '/@/types/attributeGroup/AttributeGroup.ts'
import ContentContainer from '/@/layouts/ContentContainer.vue'
import AttributeGroupNavbar from '/@/components/Page/Catalog/AttributeGroup/AttributeGroupDetailNavbar.vue'

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
  <ContentContainer>
    <template #navbar>
      <AttributeGroupNavbar :id="route.params.id" :attributeGroup="attributeGroup" />
    </template>
    <div v-if="attributeGroup" class="h-full">
      <InfoBox>
        <FormKit
          type="text"
          label="Meta tytuł"
          :placeholder="attributeGroup.name"
          :disabled="true"
        />
      </InfoBox>
    </div>
  </ContentContainer>
</template>
