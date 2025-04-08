<script lang="ts" setup>
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import { useRoute, useRouter } from 'vue-router'
import { ref, watch, computed } from 'vue';

const toast = useToast()
const router = useRouter()
const route = useRoute()

const slug = route.params.slug
const sendInvoice = async () => {
  await Api.invoices.sendInvoice(slug)
}
</script>

<template>
  <el-button @click="sendInvoice" type="primary" round>Wyślij fakturę</el-button>
</template>
