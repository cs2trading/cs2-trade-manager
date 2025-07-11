<template>
  <Modal ref="modalRef" :confirmTxt="confirmTxt" @confirm="handleConfirm">
    <div style="color: #fff">
      插件未检测到登录信息！需要您{{confirmTxt==="前往"?"前往":"登录"}}{{ platformName }}{{
        confirmTxt === "前往" ? "进行登录" : ""
      }}后，在{{
        platformName
      }}页面再次点击开启！
    </div>
  </Modal>
</template>

<script setup>
import { computed, ref, defineEmits } from "vue";

import Modal from "./Modal.vue";
const props = defineProps({
  type: {
    type: String,
    default: "c5",
  },
});
const emits = defineEmits(["confirm"]);
const modalRef = ref(null);
const platform = ref("");
const currentUrl = ref("");

const handleConfirm = () => {
  if (platform.value === "c5") {
    if (!currentUrl.value.includes("c5game.com")) {
      chrome.tabs.create({ url: "https://www.c5game.com" });
    }
  }
  if (platform.value === "buff") {
    if (!currentUrl.value.includes("buff.163.com")) {
      chrome.tabs.create({ url: "https://buff.163.com" });
    }
  }
  if (platform.value === "uu") {
    if (!currentUrl.value.includes("www.youpin898.com")) {
      chrome.tabs.create({ url: "https://www.youpin898.com" });
    }
  }
   modalRef.value?.closeModal();
};

const confirmTxt = computed(() => {
  if(currentUrl.value.includes("c5game.com")&&platform.value === "c5") return '知道了'
  if(currentUrl.value.includes("buff.163.com")&&platform.value === "buff") return '知道了'
  if(currentUrl.value.includes("www.youpin898.com")&&platform.value === "uu") return '知道了'
  return '前往'
})

const platformName = computed(() => {
  if (platform.value === "c5") {
    return "C5GAME交易平台";
  }

  if (platform.value === "buff") {
    return "BUFF";
  }
  if (platform.value === "uu") {
    return "悠悠有品";
  }
  return "";
});

const show = (type, url) => {
  platform.value = type;
  currentUrl.value = url;
  modalRef.value?.show();
};
defineExpose({
  show,
});
</script>
