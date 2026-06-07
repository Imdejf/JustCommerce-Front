<script lang="ts" setup>
import { ref } from 'vue'
import OfferTable from '../../../Form/DataTable/OfferTable.vue'
import SubOfferTable from '../../../Form/DataTable/SubOfferTable.vue'

const stats = ref<any>(null)

const onStatsLoaded = (payload: any) => {
  stats.value = payload
}
</script>

<template>
  <div class="offer-layout">
    <div class="offer-layout__main">
      <OfferTable @stats-loaded="onStatsLoaded" />
    </div>
    <div class="offer-layout__sidebar">
      <SubOfferTable
        :hot-offers="stats?.hotOffers"
        :pipeline-profit="stats?.pipelineProfitNet"
        :pipeline-value="stats?.pipelineValueGross"
      />
    </div>
  </div>
</template>

<style scoped>
.offer-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 0;
  align-items: start;
  min-height: 100%;
}

.offer-layout__main {
  min-width: 0;
}

.offer-layout__sidebar {
  position: sticky;
  top: 58px;
  height: calc(100vh - 58px);
  padding: 18px 16px 18px 0;
  min-width: 0;
}

@media (max-width: 1400px) {
  .offer-layout {
    grid-template-columns: 1fr;
  }

  .offer-layout__sidebar {
    position: static;
    height: auto;
    padding: 0 20px 24px;
  }
}
</style>
