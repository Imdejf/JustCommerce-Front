<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useStoreStore } from '/@/stores/store'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import Cookies from 'universal-cookie'

const cookies = new Cookies()
const useStore = useStoreStore()
const openMenu = ref(false)

var stores = computed(() => {
  return useStore.stores
})

var selectedStore = computed(() => {
  return useStore.selectedStore
})

const changeMenu = () => {
  openMenu.value = !openMenu.value
}

const setStore = (storeId: string) => {
  useStore.setCurrentStore(storeId)
  window.location.reload()
}
</script>
<template>
  <div class="my-auto container mx-10 xl:mx-auto flex w-full justify-between">
    <div class="w-56">
      <Menu as="div" class="relative inline-block text-left">
        <div>
          <MenuButton
            class="inline-flex w-full justify-center rounded-md bg-black bg-opacity-20 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
          >
            {{ selectedStore?.name }}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4l-6 6Z" />
            </svg>
          </MenuButton>
        </div>

        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <MenuItems
            class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none left-0"
          >
            <div class="px-1 py-1">
              <MenuItem v-for="store in stores" :key="store.id">
                <button
                  @click="setStore(store.id)"
                  :class="[
                    active ? 'bg-violet-500 text-white' : 'text-gray-900',
                    'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                  ]"
                >
                  {{ store.name }}
                </button>
              </MenuItem>
            </div>
          </MenuItems>
        </transition>
      </Menu>
    </div>
    <div>dasads</div>
    <div class="relative">
      <img
        class="w-10 h-10 p-1 rounded-full ring-1 ring-orange-500 bg-white cursor-pointer"
        src="../../assets/images/user-profile.png"
        alt="Bordered avatar"
        @click="changeMenu()"
      />
      <div
        :class="`${
          openMenu ? 'absolute inset-1/2 -translate-x-[130px] translate-y-[20px]' : 'hidden'
        }`"
        style="min-width: 4rem"
      >
        <div
          class="absolute bg-slate-50 border-solid border-[0.5px] border-orange-400 rounded-lg w-44 h-48"
        >
          <div class="border-b border-gray-300 p-3">
            <span class="text-center w-full block text-md"> Dawid Jabłoński </span>
            <span class="text-center w-full block text-sm"> Rola systemowa </span>
          </div>
          <div>
            <div>
              <button class="flex items-center p-3 gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5 text-gray-500"
                  viewBox="0 0 1024 1024"
                >
                  <path
                    fill="currentColor"
                    d="M868 732h-70.3c-4.8 0-9.3 2.1-12.3 5.8c-7 8.5-14.5 16.7-22.4 24.5a353.84 353.84 0 0 1-112.7 75.9A352.8 352.8 0 0 1 512.4 866c-47.9 0-94.3-9.4-137.9-27.8a353.84 353.84 0 0 1-112.7-75.9a353.28 353.28 0 0 1-76-112.5C167.3 606.2 158 559.9 158 512s9.4-94.2 27.8-137.8c17.8-42.1 43.4-80 76-112.5s70.5-58.1 112.7-75.9c43.6-18.4 90-27.8 137.9-27.8c47.9 0 94.3 9.3 137.9 27.8c42.2 17.8 80.1 43.4 112.7 75.9c7.9 7.9 15.3 16.1 22.4 24.5c3 3.7 7.6 5.8 12.3 5.8H868c6.3 0 10.2-7 6.7-12.3C798 160.5 663.8 81.6 511.3 82C271.7 82.6 79.6 277.1 82 516.4C84.4 751.9 276.2 942 512.4 942c152.1 0 285.7-78.8 362.3-197.7c3.4-5.3-.4-12.3-6.7-12.3zm88.9-226.3L815 393.7c-5.3-4.2-13-.4-13 6.3v76H488c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h314v76c0 6.7 7.8 10.5 13 6.3l141.9-112a8 8 0 0 0 0-12.6z"
                  />
                </svg>
                <span>Wyloguj</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
