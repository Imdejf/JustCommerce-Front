<script lang="ts" setup>
import { ref, computed } from 'vue'

interface Tab {
  id: string
  title: string
  component: any
  props?: object
}

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  }
})

const activeTab = ref(props.tabs[0].id)
const tabProps = ref({})

const activeTabComponent = computed(() => {
  const activeTabValue = props.tabs.find((tab: Tab) => tab.id === activeTab.value)
  if (activeTabValue) {
    tabProps.value = activeTabValue.props || {}
    return activeTabValue.component
  }
  return null
})

function changeTab(tabId: string) {
  activeTab.value = tabId
}
</script>

<template>
  <div class="mt-2">
    <ul
      class="flex flex-wrap text-sm font-medium text-center border-b border-gray-200 dark:border-gray-700 tab-content justify-center"
    >
      <li
        class="mr-2"
        v-for="tab in tabs"
        :key="tab.id"
        @click="changeTab(tab.id)"
        :class="`${activeTab === tab.id ? 'active' : ''} bg-slate-300 rounded-t-lg`"
      >
        <a aria-current="page" class="inline-block cursor-pointer p-3 text-white">{{
          tab.title
        }}</a>
      </li>
    </ul>
    <div class="tab-content">
      <component :is="activeTabComponent" v-bind="tabProps"></component>
    </div>
  </div>
</template>

<style>
.tab-content .active {
  background: #fb923c;
}
</style>
