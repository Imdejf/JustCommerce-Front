<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import Cookies from 'universal-cookie'
import { Api } from '/@/services/api'
import { useLanguageStore } from '/@/stores/language'
import { SYSTEM_ROLE_OPTIONS } from '/@/components/Page/Safety/Iam/roleOptions'
import type { CreateSystemUserRequest } from '/@/types/iam/Iam'

const router = useRouter()
const cookies = new Cookies()
const language = useLanguageStore()
const saving = ref(false)

const form = reactive<CreateSystemUserRequest>({
  username: '',
  email: '',
  password: '',
  storeId: cookies.get('dsStore') || '',
  languageId: language.languages?.[0]?.id || '',
  isSystemAccount: true,
  active: true,
  roles: ['Manager']
})

const save = async () => {
  if (!form.username || !form.email || !form.password) {
    ElMessage.warning('Uzupełnij login, e-mail i hasło')
    return
  }
  if (!form.roles.length) {
    ElMessage.warning('Wybierz co najmniej jedną rolę')
    return
  }

  saving.value = true
  try {
    if (!form.languageId && language.languages?.length) {
      form.languageId = language.languages[0].id
    }
    await Api.iamUsers.create(form)
    ElMessage.success('Utworzono użytkownika')
    router.push('/safety/users')
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się utworzyć użytkownika')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-4 max-w-3xl">
    <h1 class="text-xl font-semibold mb-4">Nowy użytkownik</h1>

    <el-form label-position="top">
      <el-form-item label="Login">
        <el-input v-model="form.username" />
      </el-form-item>
      <el-form-item label="E-mail">
        <el-input v-model="form.email" type="email" />
      </el-form-item>
      <el-form-item label="Hasło początkowe">
        <el-input v-model="form.password" type="password" show-password />
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
      <div class="flex gap-2">
        <el-button type="primary" :loading="saving" @click="save">Zapisz</el-button>
        <el-button @click="router.push('/safety/users')">Anuluj</el-button>
      </div>
    </el-form>
  </div>
</template>
