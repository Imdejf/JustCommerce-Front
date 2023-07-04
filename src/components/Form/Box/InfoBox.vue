<scritp lang="ts" setup></scritp>

<template>
  <div>
    <FormKit type="form" :actions="false">
      <div class="flex gap-10">
        <div class="w-1/5 h-[150px] flex bg-gray-300 bg-opacity-20 bg-rounded-xl">
          <slot name="picture"></slot>
        </div>
        <div class="overflow-auto w-full h-[300px]">
          <div class="block px-2">
            <slot></slot>
          </div>
        </div>
      </div>
    </FormKit>
  </div>
</template>
