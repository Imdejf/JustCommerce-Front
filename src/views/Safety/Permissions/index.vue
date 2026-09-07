<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '/@/services/api'
import type { PermissionDto } from '/@/types/iam/Iam'
import { SYSTEM_ROLE_OPTIONS, roleLabel } from '/@/components/Page/Safety/Iam/roleOptions'

const loading = ref(false)
const saving = ref(false)
const permissions = ref<PermissionDto[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)

const form = reactive({
  permissionCode: '',
  permissionName: '',
  description: '',
  role: 'Administrator'
})

const load = async () => {
  loading.value = true
  try {
    const data = await Api.iamPermissions.list()
    permissions.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się pobrać uprawnień')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const openCreate = () => {
  isEdit.value = false
  form.permissionCode = ''
  form.permissionName = ''
  form.description = ''
  form.role = 'Administrator'
  dialogVisible.value = true
}

const openEdit = (row: PermissionDto) => {
  isEdit.value = true
  form.permissionCode = row.permissionCode
  form.permissionName = row.permissionName
  form.description = row.description
  form.role = String(row.role)
  dialogVisible.value = true
}

const save = async () => {
  if (!form.permissionCode || !form.permissionName) {
    ElMessage.warning('Uzupełnij kod i nazwę')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await Api.iamPermissions.update(form.permissionCode, {
        permissionName: form.permissionName,
        description: form.description,
        role: form.role
      })
    } else {
      await Api.iamPermissions.create({ ...form })
    }
    dialogVisible.value = false
    ElMessage.success('Zapisano uprawnienie')
    await load()
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się zapisać uprawnienia')
  } finally {
    saving.value = false
  }
}

const remove = async (row: PermissionDto) => {
  try {
    await ElMessageBox.confirm(`Usunąć uprawnienie ${row.permissionCode}?`, 'Potwierdzenie', {
      type: 'warning'
    })
    await Api.iamPermissions.remove(row.permissionCode)
    ElMessage.success('Usunięto')
    await load()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error('Nie udało się usunąć')
    }
  }
}
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold">Uprawnienia</h1>
        <p class="text-sm text-gray-500">Katalog permission codes przypisanych do ról.</p>
      </div>
      <el-button type="primary" @click="openCreate">Dodaj uprawnienie</el-button>
    </div>

    <el-table :data="permissions" v-loading="loading" border stripe>
      <el-table-column prop="permissionCode" label="Kod" min-width="180" />
      <el-table-column prop="permissionName" label="Nazwa" min-width="180" />
      <el-table-column prop="description" label="Opis" min-width="200" />
      <el-table-column label="Rola bazowa" min-width="160">
        <template #default="{ row }">
          {{ roleLabel(String(row.role)) }}
        </template>
      </el-table-column>
      <el-table-column label="Akcje" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">Edytuj</el-button>
          <el-button link type="danger" @click="remove(row)">Usuń</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'Edycja uprawnienia' : 'Nowe uprawnienie'"
      width="520px"
    >
      <el-form label-position="top">
        <el-form-item label="Kod">
          <el-input v-model="form.permissionCode" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="Nazwa">
          <el-input v-model="form.permissionName" />
        </el-form-item>
        <el-form-item label="Opis">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="Rola bazowa">
          <el-select v-model="form.role" class="w-full">
            <el-option
              v-for="role in SYSTEM_ROLE_OPTIONS"
              :key="role.value"
              :label="role.label"
              :value="role.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Anuluj</el-button>
        <el-button type="primary" :loading="saving" @click="save">Zapisz</el-button>
      </template>
    </el-dialog>
  </div>
</template>
