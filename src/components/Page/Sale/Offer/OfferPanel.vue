<script lang="ts" setup>
import CardUsage from '../../../Form/Statistic/Offer/CardUsage.vue'
import OfferTable from '../../../Form/DataTable/OfferTable.vue'
import SubOfferTable from '../../../Form/DataTable/SubOfferTable.vue'

</script>
<template>
    <div class="px-10 pt-5 h-[25%]">
        <CardUsage/>
    </div>
    <div class="flex gap-3 justify-center px-2 w-full h-[75%]">
        <div class="w-[65%] h-full">
            <OfferTable/>
        </div>
        <div class="w-[30%]">
            <SubOfferTable/>
        </div>
    </div>
</template>