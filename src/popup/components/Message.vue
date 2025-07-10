<template>
  <div class="message-container" :class="typeClass" v-if="visible">
    {{ message }}
  </div>
</template>
<script setup lang="ts">
import { ref, defineExpose } from "vue";
const visible = ref(false); // 是否显示
const typeClass = ref("info");
const message = ref("");

const show = (
  type: "info" | "success" | "warning" | "error",
  data: string
) => {
  visible.value = true;
  typeClass.value = type;
  message.value = data;
  setTimeout(() => {
    visible.value = false;
     message.value = "";
  }, 3000);
};
defineExpose({
  show,
});
</script>
<style lang="less" scoped>
.message-container {
  position: fixed;
  top: 90px;
  z-index: 9999;
  color: #fff;
  width: 80%;
  left: 10%;
  border-radius: 3px;
  padding: 10px 5px;
  transition: all 1s;
  font-size: 14px;
  text-align: center;
}
.info {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 1);
}
.success {
  background-color: rgba(42, 148, 125, 0.8);
  border: 1px solid rgba(42, 148, 125, 1);
}
.warning {
  background-color: rgba(240, 138, 0,0.8);
  border: 1px solid rgba(240, 138, 0, 1);
}
.error {
  background: #d03a5240;
  border: 1px solid rgba(208, 58, 82, 1);
}
</style>
