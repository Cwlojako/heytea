<script setup>
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <template v-if="route.meta.keepAlive">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </template>
    <template v-else>
      <component :is="Component" />
    </template>
  </router-view>
</template>

<style scoped lang="scss">

</style>
