<script lang="ts" setup>
import BuilderNavbar from '../Builder/Navbar.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { menuData } from '/@/static/data/MenuData.ts'

const showSubMenu = ref<number | null>(null)

// Funkcja otwierająca/zamykająca submenu
function toggleSubMenu(menuItemId: number) {
  if (showSubMenu.value === menuItemId) {
    showSubMenu.value = null // Zamknij, jeśli kliknięto to samo menu
  } else {
    showSubMenu.value = menuItemId // Otwórz nowe menu
  }
}

// Funkcja zamykająca submenu przy kliknięciu poza
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('nav')) {
    showSubMenu.value = null // Zamknij wszystkie menu
  }
}

</script>

<template>
  <BuilderNavbar>
    <template #logo>
    </template>
    <template #menu>
      <div>
        <nav>
          <ul class="px-2 flex color-text">
            <li
              v-for="menuItem in menuData"
              :key="menuItem.id"
              class="m-3 bg-opacity-40 p-1 rounded-lg relative text-[12px]"
            >
            <div class="flex">
              <router-link
                v-if="menuItem.subMenus.length === 0"
                :to="menuItem.route"
                class="cursor-pointer"
                >{{ menuItem.name }}</router-link
              >
              <a v-else @click.prevent="toggleSubMenu(menuItem.id)" class="cursor-pointer block">{{
                menuItem.name
              }} </a>
              <span class="m-auto">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4l-6 6Z" />
              </svg>
              </span>
            </div>
              <ul
                v-if="showSubMenu === menuItem.id"
                class="absolute bg-gray-900 w-[180px] text-center rounded-md mt-[21px] z-[99]"
                style="left: 50%; transform: translateX(-50%);"

              >
                <li
                  v-for="subMenu in menuItem.subMenus"
                  :key="subMenu.name"
                  class="mt-2 !font-xs mx-3 my-3"
                  @click="showSubMenu = null"
                >
                  <router-link :to="subMenu.route" class="!font-normal">{{
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
