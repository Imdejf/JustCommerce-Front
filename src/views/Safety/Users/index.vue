<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '/@/services/api'
import type { SystemUserListItemDto } from '/@/types/iam/Iam'
import { roleLabel } from '/@/components/Page/Safety/Iam/roleOptions'

const router = useRouter()
const loading = ref(false)
const search = ref('')
const users = ref<SystemUserListItemDto[]>([])

const load = async () => {
  loading.value = true
  try {
    const data = await Api.iamUsers.list(search.value)
    users.value = Array.isArray(data) ? data : data?.items ?? []
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się pobrać użytkowników')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const handleCreate = () => router.push('/safety/users/add')
const handleEdit = (id: string) => router.push(`/safety/users/edit/${id}`)

const handleDelete = async (row: SystemUserListItemDto) => {
  try {
    await ElMessageBox.confirm(`Usunąć użytkownika ${row.email}?`, 'Potwierdzenie', {
      type: 'warning'
    })
    await Api.iamUsers.remove(row.id)
    ElMessage.success('Usunięto użytkownika')
    await load()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error('Nie udało się usunąć użytkownika')
    }
  }
}

const handleSendReset = async (row: SystemUserListItemDto) => {
  try {
    await Api.iamUsers.sendPasswordReset(row.id)
    ElMessage.success('Wysłano e-mail z resetem hasła')
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się wysłać e-maila')
  }
}
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">Użytkownicy systemu</h1>
        <p class="text-sm text-gray-500">Tworzenie kont, role i reset haseł.</p>
      </div>
      <el-button type="primary" @click="handleCreate">Dodaj użytkownika</el-button>
    </div>

    <div class="mb-4 flex gap-2">
      <el-input
        v-model="search"
        placeholder="Szukaj po e-mail / loginie"
        clearable
        class="max-w-sm"
        @keyup.enter="load"
      />
      <el-button @click="load">Szukaj</el-button>
    </div>

    <el-table :data="users" v-loading="loading" border stripe>
      <el-table-column prop="username" label="Login" min-width="140" />
      <el-table-column prop="email" label="E-mail" min-width="200" />
      <el-table-column label="Role" min-width="220">
        <template #default="{ row }">
          <el-tag
            v-for="role in row.roles || []"
            :key="role"
            class="mr-1 mb-1"
            size="small"
          >
            {{ roleLabel(role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Typ" width="120">
        <template #default="{ row }">
          {{ row.isSystemAccount ? 'Admin' : 'Użytkownik' }}
        </template>
      </el-table-column>
      <el-table-column label="Aktywny" width="90">
        <template #default="{ row }">
          <el-tag :type="row.active ? 'success' : 'info'" size="small">
            {{ row.active ? 'Tak' : 'Nie' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Akcje" width="320" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row.id)">Edytuj</el-button>
          <el-button link type="warning" @click="handleSendReset(row)">Reset e-mail</el-button>
          <el-button link type="danger" @click="handleDelete(row)">Usuń</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
