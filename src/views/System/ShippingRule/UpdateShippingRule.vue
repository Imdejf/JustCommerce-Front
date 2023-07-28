<script lang="ts" setup>
import { Api } from '/@/services/api'
import RuleForm from '/@/components/Page/System/Rule/RuleForm.vue'
import type { ShippingRuleDTO } from '/@/types/shippingRule/ShippingRule'
import { useStoreStore } from '/@/stores/store'
import { useLanguageStore } from '/@/stores/language'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const store = useStoreStore()
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
  <div v-if="rule">
    <RuleForm :rule="rule" :updated="true" />
  </div>
</template>
