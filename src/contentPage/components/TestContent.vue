<template>
  <div>
    <span>Test Content --</span>
    <br />
    <img src="../../assets/vue.svg">
    <br />
    <img src="../../assets/Vue_Vite_Chrome_ext.png" width="500px" height="300px">
    <br />
    <span>{{ store.count }}</span>
    <br />
    <button  @click="store.increment">
      Tertiary
    </button>
    <ul class="ul">
      <li class="li">
        <span class="span">测试 less</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
// import { NButton } from 'naive-ui'
import { useCounterStore } from '../store/counter'
const store = useCounterStore();
</script>

<style scoped lang="less">
.ul{
  .li{
    .span{
      color: red;
    }
  }
}
</style>