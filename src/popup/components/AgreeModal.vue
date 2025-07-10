<template>
  <Modal
    ref="modalRef"
    confirmTxt="我已知晓，确认授权"
    @confirm="handleConfirm"
  >
    <div style="color: #fff">
      您将授权插件获取 {{ platform }}
      中的个人用户数据，包括购买记录和出售记录。
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

const handleConfirm = () => {
  chrome.storage.local.set({ [props.type]: true }).then(() => {
    // 设置 key
    modalRef.value?.closeModal();
    emits("confirm");
  });
};

const platform = computed(() => {
  if (props.type === "c5") {
    return "C5GAME交易平台";
  }
  if (props.type === "uu") {
    return "悠悠";
  }
  if (props.type === "buff") {
    return "BUFF";
  }
  return "";
});

const show = () => {
  modalRef.value?.show();
};
defineExpose({
  show,
});
</script>
