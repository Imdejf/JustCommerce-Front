<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useStoreStore } from '/@/stores/store'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import Cookies from 'universal-cookie'

const cookies = new Cookies()
const useStore = useStoreStore()
const openMenu = ref(false)

const stores = computed(() => useStore.stores)
const selectedStore = computed(() => useStore.selectedStore)

const setStore = (storeId: string) => {
  useStore.setCurrentStore(storeId)
  window.location.reload()
}

const handleLogout = () => {
  cookies.remove('Authorization')
  window.location.reload()
}

const toggleUserMenu = () => {
  openMenu.value = !openMenu.value
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.cosmos-topnav__user')) {
    openMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div class="cosmos-topnav">
    <Menu as="div" class="cosmos-topnav__store">
      <MenuButton class="cosmos-topnav__store-btn">
        <span class="cosmos-topnav__store-icon" aria-hidden="true">◈</span>
        <span class="cosmos-topnav__store-name">{{ selectedStore?.name }}</span>
        <svg class="cosmos-topnav__chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="m12 15.4-6-6L7.4 8l4.6 4.6L16.6 8 18 9.4l-6 6Z" />
        </svg>
      </MenuButton>

      <transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <MenuItems class="cosmos-topnav__store-menu">
          <p class="cosmos-topnav__store-head">Wybierz sklep</p>
          <MenuItem v-for="store in stores" :key="store.id" v-slot="{ active }">
            <button
              type="button"
              class="cosmos-topnav__store-item"
              :class="{
                'cosmos-topnav__store-item--active': active,
                'cosmos-topnav__store-item--selected': store.id === selectedStore?.id
              }"
              @click="setStore(store.id)"
            >
              {{ store.name }}
            </button>
          </MenuItem>
        </MenuItems>
      </transition>
    </Menu>

    <div class="cosmos-topnav__user">
      <button
        type="button"
        class="cosmos-topnav__avatar-btn"
        aria-label="Menu użytkownika"
        @click="toggleUserMenu"
      >
        <img
          class="cosmos-topnav__avatar"
          src="../../assets/images/user-profile.png"
          alt=""
        />
        <span class="cosmos-topnav__avatar-ring" aria-hidden="true" />
      </button>

      <Transition name="cosmos-user-menu">
        <div v-if="openMenu" class="cosmos-topnav__user-menu">
          <div class="cosmos-topnav__user-head">
            <span class="cosmos-topnav__user-name">Dawid Jabłoński</span>
            <span class="cosmos-topnav__user-role">Rola systemowa</span>
          </div>
          <button type="button" class="cosmos-topnav__logout" @click="handleLogout">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" aria-hidden="true">
              <path
                fill="currentColor"
                d="M868 732h-70.3c-4.8 0-9.3 2.1-12.3 5.8c-7 8.5-14.5 16.7-22.4 24.5a353.84 353.84 0 0 1-112.7 75.9A352.8 352.8 0 0 1 512.4 866c-47.9 0-94.3-9.4-137.9-27.8a353.84 353.84 0 0 1-112.7-75.9a353.28 353.28 0 0 1-76-112.5C167.3 606.2 158 559.9 158 512s9.4-94.2 27.8-137.8c17.8-42.1 43.4-80 76-112.5s70.5-58.1 112.7-75.9c43.6-18.4 90-27.8 137.9-27.8c47.9 0 94.3 9.3 137.9 27.8c42.2 17.8 80.1 43.4 112.7 75.9c7.9 7.9 15.3 16.1 22.4 24.5c3 3.7 7.6 5.8 12.3 5.8H868c6.3 0 10.2-7 6.7-12.3C798 160.5 663.8 81.6 511.3 82C271.7 82.6 79.6 277.1 82 516.4C84.4 751.9 276.2 942 512.4 942c152.1 0 285.7-78.8 362.3-197.7c3.4-5.3-.4-12.3-6.7-12.3zm88.9-226.3L815 393.7c-5.3-4.2-13-.4-13 6.3v76H488c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h314v76c0 6.7 7.8 10.5 13 6.3l141.9-112a8 8 0 0 0 0-12.6z"
              />
            </svg>
            Wyloguj
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.cosmos-topnav {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-right: 16px;
}

.cosmos-topnav__store {
  position: relative;
}

.cosmos-topnav__store-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(129, 140, 248, 0.3);
  background: linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
  color: #f1f5f9;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
  max-width: 180px;
}

.cosmos-topnav__store-btn:hover,
.cosmos-topnav__store-btn:focus-visible {
  border-color: rgba(249, 115, 22, 0.5);
  box-shadow:
    0 0 0 1px rgba(249, 115, 22, 0.12),
    0 0 24px rgba(249, 115, 22, 0.18);
  outline: none;
}

.cosmos-topnav__store-icon {
  font-size: 11px;
  color: #fb923c;
  flex-shrink: 0;
}

.cosmos-topnav__store-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cosmos-topnav__chevron {
  width: 14px;
  height: 14px;
  opacity: 0.6;
  flex-shrink: 0;
}

.cosmos-topnav__store-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  min-width: 200px;
  padding: 6px;
  border-radius: 14px;
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 27, 75, 0.96) 100%);
  border: 1px solid rgba(129, 140, 248, 0.28);
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.45),
    0 0 40px rgba(99, 102, 241, 0.12);
  backdrop-filter: blur(16px);
  z-index: 50;
  outline: none;
}

.cosmos-topnav__store-head {
  margin: 0;
  padding: 6px 12px 8px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.cosmos-topnav__store-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 9px 12px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: rgba(226, 232, 240, 0.9);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.cosmos-topnav__store-item--active,
.cosmos-topnav__store-item:hover {
  background: rgba(99, 102, 241, 0.18);
  color: #fff;
}

.cosmos-topnav__store-item--selected {
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(99, 102, 241, 0.12) 100%);
}

.cosmos-topnav__user {
  position: relative;
}

.cosmos-topnav__avatar-btn {
  position: relative;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
}

.cosmos-topnav__avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  position: relative;
  z-index: 1;
}

.cosmos-topnav__avatar-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f97316, #818cf8, #f97316);
  opacity: 0.85;
  z-index: 0;
  transition: opacity 0.2s ease, box-shadow 0.2s ease;
}

.cosmos-topnav__avatar-btn:hover .cosmos-topnav__avatar-ring {
  opacity: 1;
  box-shadow: 0 0 20px rgba(249, 115, 22, 0.5);
}

.cosmos-topnav__user-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 12px);
  width: 220px;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 27, 75, 0.96) 100%);
  border: 1px solid rgba(129, 140, 248, 0.28);
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.45),
    0 0 40px rgba(99, 102, 241, 0.12);
  backdrop-filter: blur(16px);
  z-index: 50;
}

.cosmos-topnav__user-head {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.cosmos-topnav__user-name {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #f8fafc;
}

.cosmos-topnav__user-role {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: rgba(148, 163, 184, 0.9);
}

.cosmos-topnav__logout {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: rgba(226, 232, 240, 0.9);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.cosmos-topnav__logout svg {
  width: 18px;
  height: 18px;
  opacity: 0.7;
}

.cosmos-topnav__logout:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #fecaca;
}

.cosmos-user-menu-enter-active,
.cosmos-user-menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.cosmos-user-menu-enter-from,
.cosmos-user-menu-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
