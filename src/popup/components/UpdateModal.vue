<template>
  <Modal ref="modalRef" confirmTxt="去下载" title="更新提示" :showCancel="false" @confirm="handleConfirm">
    <div style="color: #fff; text-align: center;">
      您需要更新插件了！！！ <br>
      {{ updateData?.content }}
    </div>
  </Modal>
</template>

<script setup>
import { computed, ref, defineEmits } from "vue";

import Modal from "./Modal.vue";
const updateData = ref({});
const modalRef = ref(null);

const handleConfirm = () => {
  updateData.value?.fileUrl && window.open(updateData.value?.fileUrl)
};

const show = (data) => {
  updateData.value = data;
  modalRef.value?.show();
};
defineExpose({
  show,
});
</script>
