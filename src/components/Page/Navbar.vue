<script lang="ts" setup>
import BuilderNavbar from '../Builder/Navbar.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { menuData } from '/@/static/data/MenuData.ts'

const route = useRoute()
const showSubMenu = ref<number | null>(null)
const hoveredMenu = ref<number | null>(null)

function toggleSubMenu(menuItemId: number) {
  showSubMenu.value = showSubMenu.value === menuItemId ? null : menuItemId
}

function closeSubMenu() {
  showSubMenu.value = null
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.cosmos-nav')) {
    showSubMenu.value = null
  }
}

function isMenuActive(menuItem: (typeof menuData)[0]) {
  if (menuItem.subMenus.length === 0) {
    return menuItem.route === '/' ? route.path === '/' : route.path.startsWith(menuItem.route)
  }
  return menuItem.subMenus.some((sub) => route.path.startsWith(sub.route))
}

function isSubActive(subRoute: string) {
  return route.path === subRoute || route.path.startsWith(subRoute + '/')
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <BuilderNavbar>
    <template #logo />
    <template #menu>
      <nav class="cosmos-nav" aria-label="Główne menu">
        <ul class="cosmos-nav__list">
          <li
            v-for="menuItem in menuData"
            :key="menuItem.id"
            class="cosmos-nav__item"
            :class="{
              'cosmos-nav__item--active': isMenuActive(menuItem),
              'cosmos-nav__item--open': showSubMenu === menuItem.id,
              'cosmos-nav__item--hover': hoveredMenu === menuItem.id
            }"
            @mouseenter="hoveredMenu = menuItem.id"
            @mouseleave="hoveredMenu = null"
          >
            <div class="cosmos-nav__trigger">
              <router-link
                v-if="menuItem.subMenus.length === 0"
                :to="menuItem.route"
                class="cosmos-nav__link"
                :class="{ 'cosmos-nav__link--active': isMenuActive(menuItem) }"
              >
                <span class="cosmos-nav__label">{{ menuItem.name }}</span>
                <span v-if="isMenuActive(menuItem)" class="cosmos-nav__glow" aria-hidden="true" />
              </router-link>

              <button
                v-else
                type="button"
                class="cosmos-nav__link cosmos-nav__link--dropdown"
                :class="{ 'cosmos-nav__link--active': isMenuActive(menuItem) }"
                :aria-expanded="showSubMenu === menuItem.id"
                @click.prevent="toggleSubMenu(menuItem.id)"
              >
                <span class="cosmos-nav__label">{{ menuItem.name }}</span>
                <svg
                  class="cosmos-nav__chevron"
                  :class="{ 'cosmos-nav__chevron--open': showSubMenu === menuItem.id }"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path fill="currentColor" d="m12 15.4-6-6L7.4 8l4.6 4.6L16.6 8 18 9.4l-6 6Z" />
                </svg>
                <span v-if="isMenuActive(menuItem)" class="cosmos-nav__glow" aria-hidden="true" />
              </button>
            </div>

            <Transition name="cosmos-dropdown">
              <ul
                v-if="menuItem.subMenus.length && showSubMenu === menuItem.id"
                class="cosmos-nav__dropdown"
                role="menu"
              >
                <li class="cosmos-nav__dropdown-head">
                  <span>{{ menuItem.name }}</span>
                </li>
                <li
                  v-for="subMenu in menuItem.subMenus"
                  :key="subMenu.name"
                  role="none"
                >
                  <router-link
                    :to="subMenu.route"
                    role="menuitem"
                    class="cosmos-nav__dropdown-link"
                    :class="{ 'cosmos-nav__dropdown-link--active': isSubActive(subMenu.route) }"
                    @click="closeSubMenu"
                  >
                    <span class="cosmos-nav__dropdown-dot" aria-hidden="true" />
                    {{ subMenu.name }}
                  </router-link>
                </li>
              </ul>
            </Transition>
          </li>
        </ul>
      </nav>
    </template>
  </BuilderNavbar>
</template>

<style scoped>
.cosmos-nav {
  height: 100%;
  display: flex;
  align-items: center;
}

.cosmos-nav__list {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0;
  padding: 0 4px;
  list-style: none;
}

.cosmos-nav__item {
  position: relative;
}

.cosmos-nav__trigger {
  position: relative;
}

.cosmos-nav__link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(226, 232, 240, 0.82);
  text-decoration: none;
  background: transparent;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.25s ease,
    transform 0.15s ease;
  white-space: nowrap;
}

.cosmos-nav__link--dropdown {
  font-family: inherit;
}

.cosmos-nav__item--hover .cosmos-nav__link:not(.cosmos-nav__link--active),
.cosmos-nav__item--open .cosmos-nav__link:not(.cosmos-nav__link--active) {
  color: #f8fafc;
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(129, 140, 248, 0.25);
  box-shadow:
    0 0 0 1px rgba(99, 102, 241, 0.08),
    0 4px 20px rgba(79, 70, 229, 0.18);
}

.cosmos-nav__link--active {
  color: #fff;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.18) 0%, rgba(99, 102, 241, 0.14) 100%);
  border-color: rgba(249, 115, 22, 0.45);
  box-shadow:
    0 0 0 1px rgba(249, 115, 22, 0.15),
    0 0 24px rgba(249, 115, 22, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.cosmos-nav__label {
  position: relative;
  z-index: 1;
}

.cosmos-nav__glow {
  position: absolute;
  left: 50%;
  bottom: 2px;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, #f97316, #fb923c, transparent);
  box-shadow: 0 0 12px rgba(249, 115, 22, 0.8);
  pointer-events: none;
}

.cosmos-nav__chevron {
  width: 14px;
  height: 14px;
  opacity: 0.55;
  transition: transform 0.2s ease, opacity 0.2s ease;
  flex-shrink: 0;
}

.cosmos-nav__item--hover .cosmos-nav__chevron,
.cosmos-nav__item--open .cosmos-nav__chevron {
  opacity: 0.9;
}

.cosmos-nav__chevron--open {
  transform: rotate(180deg);
}

.cosmos-nav__dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 210px;
  margin: 0;
  padding: 6px;
  list-style: none;
  border-radius: 14px;
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.97) 0%, rgba(30, 27, 75, 0.95) 100%);
  border: 1px solid rgba(129, 140, 248, 0.28);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04),
    0 20px 50px rgba(0, 0, 0, 0.45),
    0 0 40px rgba(99, 102, 241, 0.15);
  backdrop-filter: blur(16px);
  z-index: 99;
}

.cosmos-nav__dropdown::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 10px;
  height: 10px;
  background: rgba(15, 23, 42, 0.97);
  border-top: 1px solid rgba(129, 140, 248, 0.28);
  border-left: 1px solid rgba(129, 140, 248, 0.28);
}

.cosmos-nav__dropdown-head {
  padding: 6px 12px 8px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 4px;
}

.cosmos-nav__dropdown-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(226, 232, 240, 0.88);
  text-decoration: none;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

.cosmos-nav__dropdown-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.5);
  flex-shrink: 0;
  transition: background 0.15s ease, box-shadow 0.15s ease;
}

.cosmos-nav__dropdown-link:hover {
  color: #fff;
  background: rgba(99, 102, 241, 0.18);
  box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.2);
}

.cosmos-nav__dropdown-link:hover .cosmos-nav__dropdown-dot {
  background: #818cf8;
  box-shadow: 0 0 8px rgba(129, 140, 248, 0.7);
}

.cosmos-nav__dropdown-link--active {
  color: #fff;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%);
  box-shadow:
    inset 0 0 0 1px rgba(249, 115, 22, 0.35),
    0 0 16px rgba(249, 115, 22, 0.12);
}

.cosmos-nav__dropdown-link--active .cosmos-nav__dropdown-dot {
  background: #f97316;
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.8);
}

.cosmos-dropdown-enter-active,
.cosmos-dropdown-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.cosmos-dropdown-enter-from,
.cosmos-dropdown-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-6px);
}
</style>
