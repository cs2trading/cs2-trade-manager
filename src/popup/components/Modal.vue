<template>
  <n-modal
    v-model:show="showModal"
    class="custom-card"
    preset="card"
    size="huge"
    :bordered="false"
    @close="closeModal"
  >
  <template #header>
    <div style="color: #fff;font-weight: 600;font-size: 16px;text-align: center;">
      {{ title }}
    </div>
  </template>
    <slot></slot>
    <template #footer>
      <div class="n-modal-footer">
        <div class="cancel" @click="closeModal">{{ cancelTxt }}</div>
        <div class="confirm" @click="confirm">{{ confirmTxt }}</div>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { ref } from "vue";
import { NModal } from "naive-ui";
const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  cancelTxt: {
    type: String,
    default: "取消",
  },
  confirmTxt: {
    type: String,
    default: "确认",
  },
  close:{
    type: Function,
    default: () => {},
  },
  showCancel:{
    type: Boolean,
    default: true,
  }
});

const emits = defineEmits(["close", "confirm"]);

const showModal = ref(false);

const show = () => {
  showModal.value = true;
};
const closeModal = () => {
  showModal.value = false;
  emits("close");
};
const confirm = () => {
  emits("confirm");
};
defineExpose({
  show,
  closeModal,
});
</script>
<style lang="less">
.n-card.n-modal {
  background: #272727 !important;
}

.n-modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  & > div {
    min-width: 80px;
    height: 46px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
      filter: brightness(1.1);
    }
  }
  .confirm {
    background: #8355ff;
    color: #fff;
  }
  .cancel {
    border: 1px solid #8355ff;
    color: #8355ff;
    height: 44px;
  }
}
</style>
