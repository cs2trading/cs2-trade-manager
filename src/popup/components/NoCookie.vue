<template>
  <Modal ref="modalRef" confirmTxt="前往" @confirm="handleConfirm">
    <div style="color: #fff">
      插件未检测到登录信息！需要您前往{{ platformName }}进行登录后，在{{ platformName }}页面再次点击开启！
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

const handleConfirm = () => {
  console.log('%c@@@  console.log(location);===>', 'color:green;font-size:15px', location)
  chrome.storage.local.set({ [`${platform.value}Cookie`]: "true" }); //

  
  if (platform.value === "c5") {
    chrome.tabs.create({ url: "https://www.c5game.com" });
  }
  if (platform.value === "buff") {
    chrome.tabs.create({ url: "https://buff.163.com" });
  }
};

const platformName = computed(() => {
  if (platform.value === "c5") {
    return "C5GAME交易平台";
  }

  if (platform.value === "buff") {
    return "BUFF";
  }
  return "";
});

const show = (type) => {
  platform.value = type;
  modalRef.value?.show();
};
defineExpose({
  show,
});
</script>
