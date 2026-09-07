<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Api } from '/@/services/api'
import type { PermissionDto, SystemRoleDto } from '/@/types/iam/Iam'
import { roleLabel } from '/@/components/Page/Safety/Iam/roleOptions'

const loading = ref(false)
const saving = ref(false)
const roles = ref<SystemRoleDto[]>([])
const permissions = ref<PermissionDto[]>([])
const selectedRole = ref('')
const selectedPermissionCodes = ref<string[]>([])

const load = async () => {
  loading.value = true
  try {
    const [rolesData, permissionsData] = await Promise.all([
      Api.iamRoles.list(),
      Api.iamPermissions.list()
    ])
    roles.value = Array.isArray(rolesData) ? rolesData : []
    permissions.value = Array.isArray(permissionsData) ? permissionsData : []
    if (!selectedRole.value && roles.value.length) {
      selectedRole.value = roles.value[0].code
      selectedPermissionCodes.value = [...(roles.value[0].permissionCodes || [])]
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się pobrać ról')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const onRoleChange = (roleCode: string) => {
  const role = roles.value.find((r) => r.code === roleCode)
  selectedPermissionCodes.value = [...(role?.permissionCodes || [])]
}

const save = async () => {
  if (!selectedRole.value) return
  saving.value = true
  try {
    await Api.iamRoles.updatePermissions(selectedRole.value, selectedPermissionCodes.value)
    ElMessage.success('Zapisano uprawnienia roli')
    await load()
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się zapisać uprawnień roli')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-4" v-loading="loading">
    <h1 class="text-xl font-semibold mb-1">Role i uprawnienia</h1>
    <p class="text-sm text-gray-500 mb-4">
      Przypisz uprawnienia do roli systemowej. Użytkownik z wieloma rolami dostaje sumę uprawnień.
    </p>

    <el-form label-position="top" class="max-w-3xl">
      <el-form-item label="Rola">
        <el-select v-model="selectedRole" class="w-full" @change="onRoleChange">
          <el-option
            v-for="role in roles"
            :key="role.code"
            :label="roleLabel(role.code)"
            :value="role.code"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Uprawnienia">
        <el-select
          v-model="selectedPermissionCodes"
          multiple
          filterable
          class="w-full"
          placeholder="Wybierz uprawnienia"
        >
          <el-option
            v-for="permission in permissions"
            :key="permission.permissionCode"
            :label="`${permission.permissionName} (${permission.permissionCode})`"
            :value="permission.permissionCode"
          />
        </el-select>
      </el-form-item>

      <el-button type="primary" :loading="saving" @click="save">Zapisz</el-button>
    </el-form>
  </div>
</template>
