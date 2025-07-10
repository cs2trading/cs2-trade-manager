<script setup lang="ts">
import TestContent from "./components/TestContent.vue";
chrome.runtime.sendMessage({
    info: localStorage['userInfo'] //get from tab's local storage
});
</script>

<template>
  <test-content />
</template>

<style scoped>
</style>
