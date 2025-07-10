<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <MainPopup />
  </n-config-provider>
</template>

<script setup lang="ts">
import MainPopup from "./components/MainPopup.vue";
import { NConfigProvider, darkTheme } from "naive-ui";

const themeOverrides = {
  common: {
    primaryColor: "#8355ff",
  },
  Spin: {
    //  textColor: '#ffffff',     // 文字颜色 OK
    // opacitySpinning: 0.5, // 透明度 OK
  },

  // ...
};
</script>
