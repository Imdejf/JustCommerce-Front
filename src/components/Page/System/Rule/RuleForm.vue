<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import type { ShippingRuleDTO } from '/@/types/shippingRule/ShippingRule'
import { computed, ref, reactive, watch, onMounted } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import { useLanguageStore } from '/@/stores/language'
import { useStoreStore } from '/@/stores/store'
import Cookies from 'universal-cookie'
import DropZone from '../../../Form/File/DropZone.vue'

const props = defineProps({
  rule: {
    type: Object as ObjectConstructor,
    default: () => ({} as ShippingRuleDTO)
  },
  updated: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const cookies = new Cookies()
const route = useRoute()
const toast = useToast()
const language = useLanguageStore()
const store = useStoreStore()

const currentRule = ref(props.rule)

if (props.updated) {
  currentRule.id = route.params.id
}

const handleSave = async () => {
  try {
    const payload = {
      body: JSON.stringify(currentRule.value)
    }
    if (!props.updated) {
      await Api.rules.create(payload)
      toast.success('Dodano regułe', {
        timeout: 2000
      })
    } else {
      await Api.rules.update(payload)
      toast.success('Edytowano regułe', {
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
  <ContentContainer :showLanguage="true">
    <FormKit ref="myForm" type="form" @submit="handleSave" :actions="false">
      <FormSection :title="'Reguła'">
        <FormKit
          type="text"
          v-model="currentRule.name"
          label="Nazwa reguły"
          validation="required"
          validation-visibility="live"
        />
      </FormSection>
      <FormSection>
        <FormKit type="checkbox" v-model="currentRule.combineProducts" label="Łącz produkty" />
        <FormKit
          type="checkbox"
          v-model="currentRule.partitioningForQuantity"
          label="Dla kolejnych przedziałów"
        />
        <FormKit type="checkbox" v-model="currentRule.stackPallet" label="Licz palety" />
      </FormSection>
      <FormSection :title="'Paczki'">
        <FormKit
          type="number"
          step="0.01"
          v-model="currentRule.shipmentPrice"
          label="Cena paczki"
          validation="required"
          validation-visibility="live"
        />
        <FormKit
          type="text"
          v-model="currentRule.conditionMinQuantity"
          label="Minimum w paczce"
          validation="required"
          validation-visibility="live"
        />
        <FormKit
          type="text"
          v-model="currentRule.conditionMaxQuantity"
          label="Maksimum w paczce"
          validation="required"
          validation-visibility="live"
        />
      </FormSection>
      <FormSection :title="'Palety'">
        <FormKit
          type="number"
          step="0.01"
          v-model="currentRule.shipmentPricePallet"
          label="Cena palety"
          validation="required"
          validation-visibility="live"
        />
        <FormKit
          type="text"
          v-model="currentRule.conditionMinForQuantityPallet"
          label="Minimum na palecie"
          validation="required"
          validation-visibility="live"
        />
        <FormKit
          type="text"
          v-model="currentRule.conditionMaxForQuantityPallet"
          label="Maksimum na palecie"
          validation="required"
          validation-visibility="live"
        />
      </FormSection>
      <FormSection>
        <FormKit
          type="number"
          v-model="currentRule.orderValue"
          label="Kolejność"
          validation="required"
          validation-visibility="live"
        />
      </FormSection>
      <FormSection>
        <FormKit
          type="checkbox"
          label="Aktywne"
          help=""
          v-model="currentRule.active"
          :value="false"
        />
      </FormSection>
      <div class="save-button w-full my-10">
        <FormKit type="submit" label="Zapisz" style="display: flex; justify-content: flex-end" />
      </div>
    </FormKit>
  </ContentContainer>
</template>
