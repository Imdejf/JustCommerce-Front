<template>
  <BuilderNavbar>
    <template #logo>
      <div><img src="../../assets/images/logo.png" /></div>
    </template>
    <template #menu>
      <div>
        <nav>
          <ul class="px-2">
            <li
              v-for="menuItem in menuData"
              :key="menuItem.id"
              class="mt-3 bg-gray-600 bg-gray-300 bg-opacity-40 p-2 rounded-lg font-semibold"
            >
              <router-link
                v-if="menuItem.subMenus.length === 0"
                :to="menuItem.route"
                class="cursor-pointer block"
                >{{ menuItem.name }}</router-link
              >
              <a v-else @click.prevent="toggleSubMenu(menuItem.id)" class="cursor-pointer block">{{
                menuItem.name
              }}</a>
              <ul v-if="showSubMenu === menuItem.id">
                <li v-for="subMenu in menuItem.subMenus" :key="subMenu.name" class="mt-2 !font-xs">
                  <router-link :to="subMenu.route" class="!font-normal text-gray-300">{{
                    subMenu.name
                  }}</router-link>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </template>
  </BuilderNavbar>
</template>

<script lang="ts" setup>
import BuilderNavbar from '../Builder/Navbar.vue'
import { ref } from 'vue'
import { menuData } from '../../static/data/MenuData.ts'

const showSubMenu = ref<number | null>(null)

function toggleSubMenu(menuItemId: number) {
  if (showSubMenu.value === menuItemId) {
    showSubMenu.value = null
  } else {
    showSubMenu.value = menuItemId
  }
}
</script>
