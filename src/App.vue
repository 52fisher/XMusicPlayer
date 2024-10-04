<script setup>
import {  RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style lang="scss">
/* Properties */
:where(body) {
  --background-color: #fff;
  --text-color: #262338;
}
body {
  background-color: var(--background-color);
  color: var(--text-color);
  margin: 0;
}
@media (prefers-color-scheme: dark) {
  :where(body) {
    --background-color: hsl(228, 5%, 15%);
    --text-color: hsl(228, 5%, 80%);
  }
}
.no-scroll{
  overflow: hidden;
}
</style>
