<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Api } from '/@/services/api'
import { SYSTEM_ROLE_OPTIONS } from '/@/components/Page/Safety/Iam/roleOptions'
import type { UpdateSystemUserRequest } from '/@/types/iam/Iam'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const passwordSaving = ref(false)
const newPassword = ref('')

const form = reactive<UpdateSystemUserRequest>({
  id: String(route.params.id),
  username: '',
  email: '',
  isSystemAccount: true,
  active: true,
  roles: []
})

const load = async () => {
  loading.value = true
  try {
    const user = await Api.iamUsers.get(form.id)
    form.username = user.username
    form.email = user.email
    form.isSystemAccount = user.isSystemAccount
    form.active = user.active
    form.roles = user.roles || []
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się pobrać użytkownika')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const save = async () => {
  if (!form.roles.length) {
    ElMessage.warning('Wybierz co najmniej jedną rolę')
    return
  }
  saving.value = true
  try {
    await Api.iamUsers.update(form.id, form)
    ElMessage.success('Zapisano użytkownika')
    router.push('/safety/users')
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się zapisać użytkownika')
  } finally {
    saving.value = false
  }
}

const setPassword = async () => {
  if (!newPassword.value || newPassword.value.length < 6) {
    ElMessage.warning('Hasło musi mieć min. 6 znaków')
    return
  }
  passwordSaving.value = true
  try {
    await Api.iamUsers.setPassword(form.id, newPassword.value)
    newPassword.value = ''
    ElMessage.success('Ustawiono nowe hasło')
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się ustawić hasła')
  } finally {
    passwordSaving.value = false
  }
}

const sendResetEmail = async () => {
  try {
    await Api.iamUsers.sendPasswordReset(form.id)
    ElMessage.success('Wysłano e-mail z resetem hasła')
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się wysłać e-maila')
  }
}
</script>

<template>
  <div class="p-4 max-w-3xl" v-loading="loading">
    <h1 class="text-xl font-semibold mb-4">Edycja użytkownika</h1>

    <el-form label-position="top">
      <el-form-item label="Login">
        <el-input v-model="form.username" />
      </el-form-item>
      <el-form-item label="E-mail">
        <el-input v-model="form.email" type="email" />
      </el-form-item>
      <el-form-item label="Role">
        <el-select v-model="form.roles" multiple filterable class="w-full">
          <el-option
            v-for="role in SYSTEM_ROLE_OPTIONS"
            :key="role.value"
            :label="role.label"
            :value="role.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Konto systemowe (panel)">
        <el-switch v-model="form.isSystemAccount" />
      </el-form-item>
      <el-form-item label="Aktywny">
        <el-switch v-model="form.active" />
      </el-form-item>

      <div class="flex gap-2 mb-8">
        <el-button type="primary" :loading="saving" @click="save">Zapisz</el-button>
        <el-button @click="router.push('/safety/users')">Anuluj</el-button>
      </div>
    </el-form>

    <el-divider />

    <h2 class="text-lg font-semibold mb-3">Hasło</h2>
    <div class="flex flex-wrap gap-2 items-end mb-3">
      <el-form-item label="Ustaw nowe hasło (admin)" class="mb-0 flex-1 min-w-[240px]">
        <el-input v-model="newPassword" type="password" show-password />
      </el-form-item>
      <el-button type="warning" :loading="passwordSaving" @click="setPassword">
        Ustaw hasło
      </el-button>
    </div>
    <el-button @click="sendResetEmail">Wyślij e-mail z resetem hasła</el-button>
  </div>
</template>
