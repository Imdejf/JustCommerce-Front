<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()

const loading = ref(false)
const account = ref<any>(null)
const status = ref<any>(null)
const sandbox = ref(false)

const loadAccount = async () => {
  loading.value = true

  try {
    status.value = await Api.allegro.getAccountStatus()
    account.value = await Api.allegro.getAccount()
  } catch {
    toast.error('Nie udało się pobrać danych konta Allegro')
  } finally {
    loading.value = false
  }
}

const connectAccount = async () => {
  try {
    const result = await Api.allegro.getAuthorizationUrl(sandbox.value)

    const url = result?.authorizationUrl || result?.url || result?.data?.authorizationUrl

    if (!url) {
      toast.error('Backend nie zwrócił adresu autoryzacji Allegro')
      return
    }

    window.location.href = url
  } catch {
    toast.error('Nie udało się pobrać linku autoryzacji Allegro')
  }
}

const refreshToken = async () => {
  try {
    await Api.allegro.refreshToken()
    toast.success('Token Allegro został odświeżony')
    await loadAccount()
  } catch {
    toast.error('Nie udało się odświeżyć tokenu Allegro')
  }
}

const disconnectAccount = async () => {
  try {
    await Api.allegro.disconnectAccount()
    toast.success('Konto Allegro zostało odłączone')
    await loadAccount()
  } catch {
    toast.error('Nie udało się odłączyć konta Allegro')
  }
}

onMounted(() => {
  loadAccount()
})
</script>

<template>
  <ContentContainer>
    <FormSection title="Konto Allegro">
      <div class="allegro-account">
        <div class="status-box">
          <div>
            <strong>Status połączenia:</strong>
            <span v-if="status?.connected || status?.isConnected" class="connected">
              Połączone
            </span>
            <span v-else class="disconnected">
              Niepołączone
            </span>
          </div>

          <div v-if="account">
            <strong>Konto:</strong>
            {{ account.login || account.email || account.name || 'Brak danych' }}
          </div>

          <div v-if="status">
            <strong>Sandbox:</strong>
            {{ status.sandbox ? 'Tak' : 'Nie' }}
          </div>
        </div>

        <div class="actions">
          <el-checkbox v-model="sandbox">
            Sandbox
          </el-checkbox>

          <el-button color="#ea580c" :loading="loading" @click="connectAccount">
            Połącz konto Allegro
          </el-button>

          <el-button :loading="loading" @click="refreshToken">
            Odśwież token
          </el-button>

          <el-button type="danger" :loading="loading" @click="disconnectAccount">
            Odłącz konto
          </el-button>
        </div>
      </div>
    </FormSection>
  </ContentContainer>
</template>

<style scoped>
.allegro-account {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.status-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.connected {
  color: #16a34a;
  margin-left: 8px;
  font-weight: 600;
}

.disconnected {
  color: #dc2626;
  margin-left: 8px;
  font-weight: 600;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>