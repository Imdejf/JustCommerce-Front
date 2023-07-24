<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Api } from '/@/services/api'
import type { ShippingRuleDTO } from '/@/types/shippingRule/ShippingRule'
import ContentContainer from '/@/layouts/ContentContainer.vue'
import RuleNavbar from '/@/components/Page/System/Rule/RuleNavbar.vue'
const route = useRoute()
const rule = ref<ShippingRuleDTO | null>(null)

const getById = (id: string) => {
  return Api.rules.get(id)
}

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  rule.value = result.data
})
</script>

<template>
  <ContentContainer>
    <template #navbar>
      <RuleNavbar :id="route.params.id" :rule="rule" />
    </template>
    <div v-if="rule" class="h-full">
      <InfoBox>
        <FormKit type="text" label="Nazwa" :placeholder="rule.name" :disabled="true" />
        <FormKit
          type="text"
          label="Cena karton"
          :placeholder="rule.shipmentPrice"
          :disabled="true"
        />
        <FormKit
          type="textarea"
          label="Cena paleta"
          :placeholder="rule.shipmentPricePallet"
          :disabled="true"
        />
      </InfoBox>
    </div>
  </ContentContainer>
</template>
