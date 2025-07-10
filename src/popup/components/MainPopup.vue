<template>
  <n-spin :show="spinShow" content-class="spin-content">
  <div class="popup-container">
    <p class="notice" v-if="noticeContent">
      {{ noticeContent }}
    </p>
    <div class="popup-tips">
      <span  style="color: #fff ">插件说明</span>：本插件为免费插件，专为CS2玩家设计，帮助您轻松管理饰品交易的盈亏情况。<br />
      <span  style="color: #fff ">安全性说明</span>：用户的三方平台登录信息将安全存储在本地，插件代码未加密，便于用户验证和解析。您的数据安全，我们始终放在首位！<br />
      所有源代码已公开(<span
        style="color: rgb(2, 82, 217); cursor: pointer"
        @click="openGithub"
        >GitHub</span
      >|<span style="color: rgb(2, 82, 217); cursor: pointer" @click="openGitee"
        >Gitee</span
      >),接受全球开发者及用户监督；开源 = 公开透明 + 全民可查 + 安全可验
      <div>
        <span  style="color: #fff ">数据同步</span>：选择开启拥有交易记录的平台，点击数据同步，开启自动记账功能！
      </div>
    </div>
    <CustomSwitch
      ref="c5SwitchRef"
      name="C5GAME自动记账"
      type="c5"
      key="c5"
      :isUploading="isAsyncData"
      :cancelTimerNum="cancelTimerNum"
      @change="(type, val) => handleSwitch('c5', type, val)"
    />
    <CustomSwitch
      ref="uuSwitchRef"
      name="悠悠自动记账"
      type="uu"
      key="uu"
      :isUploading="isAsyncData"
      :cancelTimerNum="cancelTimerNum"
      @change="(type, val) => handleSwitch('uu', type, val)"
    />
    <CustomSwitch
      ref="buffSwitchRef"
      name="BUFF自动记账"
      type="buff"
      key="buff"
      :isUploading="isAsyncData"
      :cancelTimerNum="cancelTimerNum"
      @change="(type, val) => handleSwitch('buff', type, val)"
    />
    <div class="btn-container">
      <div class="btn-wrapper" v-if="!isAsyncData || !canOpt" @click="startAsyncData">
        <div
          style="font-size: 14px"
          :class="updateTime ? 'marginTop5' : 'marginTop14'"
        >
          数据同步
        </div>
        <div style="font-size: 12px" v-if="updateTime">
          （上次同步：{{ updateTime }}）
        </div>
      </div>

      <div
        class="btn-wrapper btn-sync"
        v-if="isAsyncData && cancelTimerNum === defaultTimeNum&&canOpt"
        @click="startAsyncData"
      >
        <div class="progress-bar" :style="{ width: percentNum + '%' }"></div>
        <div class="btn-text" style="font-size: 14px">数据同步中...</div>
        <div
          class="btn-text btn-text2"
          style="margin-top: 3px; font-size: 12px"
        >
          {{ percentNum }}%
        </div>
      </div>
    </div>
    <div
      v-if="!isAsyncData && cancelTimerNum === defaultTimeNum"
      style="
        color: #999;
        font-size: 12px;
        padding: 0 20px 20px;
        text-align: center;
      "
    >
      插件或数据存在异常？点我<span
        style="color: rgb(2, 82, 217); cursor: pointer"
        @click="clearStorage"
        >清空缓存</span
      >，重新上传
    </div>
    <div class="btn-container">
      <div
        class="btn-wrapper cancel"
        style="margin: 0 20px 20px 20px"
        v-if="cancelTimerNum < defaultTimeNum && !isAsyncData"
        @click="cancelAsyncData"
      >
        <div style="font-size: 14px" :class="'marginTop14'">
          {{ `正在取消中,${cancelTimerNum}S后可重新上传` }}
        </div>
      </div>
      <div
        class="btn-wrapper cancel"
        style="margin: 0 20px 20px 20px"
        v-if="isAsyncData&&canOpt"
        @click="cancelAsyncData"
      >
        <div style="font-size: 14px" :class="'marginTop14'">
          {{ "取消上传" }}
        </div>
      </div>
    </div>
    <p
      v-if="isAsyncData&&canOpt"
      style="color: #999; font-size: 12px; padding: 0 20px 20px"
    >
      上传进度与尚未上传的交易量相关，最多上传近三个月的交易数据。
    </p>
  </div>
  <Message ref="messageRef" />
  <UpdateModal ref="updateModalRef" />

   <template #description>
        资源加载中。。。
      </template>
  </n-spin>
</template>

<script setup lang="ts">
import { NButton, NSwitch,NSpin } from "naive-ui";
import { useCounterStore } from "../store/counter";
import CustomSwitch from "./CustomSwitch.vue";
import { ref, onMounted, watch, onUnmounted } from "vue";
import Message from "./Message.vue";
import UpdateModal from "./UpdateModal.vue";
import dayjs from "dayjs";
import { getNotice, checkVersion } from "./../utils";

const store = useCounterStore();
const messageRef = ref(null);
const updateModalRef = ref(null);

const defaultTimeNum = 10; //取消倒计时
const isAsyncData = ref(false); // 是否正在同步数据
const spinShow = ref(true); // 加载中

const valideVersion = async () => {
  const valideRes = await checkVersion();

  if (valideRes) {
    // 版本更新
    // messageRef.value?.show("success", "插件版本已是最新");
    chrome.storage.local.set({ cancelFlag: "true" });
    isAsyncData.value = false;
    updateModalRef.value?.show(valideRes);
  } else {
    chrome.storage.local.set({ cancelFlag: "" });
  }
};

const openGithub = () => {
  chrome.tabs.create({
    url: "https://github.com/cs2trading/cs2-trade-manager",
  });
};
const openGitee = () => {
  chrome.tabs.create({
    url: "https://gitee.com/csprogrammer/cs2-trade-manager",
  });
};

const switchLocal = ref({
  c5: false,
  uu: false,
  buff: false,
});

const clearStorage = async () => {
  const res = await chrome.storage.local.clear();
  messageRef.value?.show("success", "清空缓存成功！");
  switchLocal.value = {
    c5: false,
    uu: false,
    buff: false,
  };
  c5SwitchRef.value?.refreshStatus();
  uuSwitchRef.value?.refreshStatus();
  buffSwitchRef.value?.refreshStatus();
};

let timer = null;
const updateTime = ref("");
const percentNum = ref(0);
const canClick = ref(false); // 不能点击
const canOpt = ref(false);  // 为false时 不能操作 开关或者按钮 

let cancelTimer = null;
const cancelTimerNum = ref(defaultTimeNum);
// 取消上传
const cancelAsyncData = async () => {
  chrome.storage.local.set({ percentMap: "" }); // 清空缓存的进度
  if (!isAsyncData.value) return;
  const { cancelFlag } = await chrome.storage.local.get([`cancelFlag`]);
  if (cancelFlag) return;
  chrome.storage.local.set({ cancelFlag: true });
  // 避免闪烁
  cancelTimerNum.value = cancelTimerNum.value - 1;
  isAsyncData.value = false;
  cancelTimer = setInterval(() => {
    cancelTimerNum.value = cancelTimerNum.value - 1;
    if (cancelTimerNum.value < 1) {
      clearInterval(cancelTimer);
      cancelTimer = null;
      cancelTimerNum.value = defaultTimeNum;
      chrome.storage.local.set({ cancelFlag: false });
    }
  }, 1000);
};
onUnmounted(() => {
  clearInterval(cancelTimer);
  cancelTimer = null;
  cancelTimerNum.value = defaultTimeNum;
  chrome.storage.local.set({ cancelFlag: false });
});
const noticeContent = ref("");
const noticeApi = async () => {
  const res = await getNotice();
  noticeContent.value = res?.data || "";
};
noticeApi();
const getPercentNumber = (keys, percentMap) => {
  let num = 0;
  const len = keys.length; // 有几个平台打开了
  const isAllComplete = [];

  keys.forEach((key) => {
    if (key === "c5") {
      if (percentMap.c5Buy === 100) {
        isAllComplete.push(100);
      }
      if (percentMap.c5Sell === 100) {
        isAllComplete.push(100);
      }
      num +=
        percentMap.c5Buy > 90 ? 90 + percentMap.c5Buy / 1000 : percentMap.c5Buy;
      num +=
        percentMap.c5Sell > 90
          ? 90 + percentMap.c5Sell / 1000
          : percentMap.c5Sell;
    }
    if (key === "uu") {
      if (percentMap.uuBuy === 100) {
        isAllComplete.push(100);
      }
      if (percentMap.uuSell === 100) {
        isAllComplete.push(100);
      }
      num +=
        percentMap.uuBuy > 90 ? 90 + percentMap.uuBuy / 1000 : percentMap.uuBuy;
      num +=
        percentMap.uuSell > 90
          ? 90 + percentMap.uuSell / 1000
          : percentMap.uuSell;
    }
    if (key === "buff") {
      if (percentMap.buffBuy === 100) {
        isAllComplete.push(100);
      }
      if (percentMap.buffSell === 100) {
        isAllComplete.push(100);
      }
      num +=
        percentMap.buffBuy > 90
          ? 90 + percentMap.buffBuy / 1000
          : percentMap.buffBuy;
      num +=
        percentMap.buffSell > 90
          ? 90 + percentMap.buffSell / 1000
          : percentMap.buffSell;
    }
  });

  if (
    isAllComplete.length === len * 2 &&
    isAllComplete.every((item) => item === 100)
  ) {
    console.log("完成了");

    return 100; // 完成了
  }

  return num / (len * 2); // 除以2 是因为有买卖和有平台两个数据
};

const getPercent = async () => {
  canClick.value = true;
  const { switchLocal } = await chrome.storage.local.get(["switchLocal"]);
  const keys = switchLocal ? Object.keys(switchLocal) : [];
  if (
    keys.length === 0 ||
    !switchLocal ||
    Object.values(switchLocal).every((item) => !item)
  ) {
    return; // 没有开关的情况
  }
  const { cancelFlag } = await chrome.storage.local.get(["cancelFlag"]);

  // 后台已经
  chrome.storage.local.get(["percentMap"]).then(  (data) => {
    const { percentMap } = data;

    if (!percentMap) {
      return;
    }
    let percent = getPercentNumber(
      keys.filter((item) => switchLocal[item]),
      percentMap
    );

    percentNum.value = percent.toFixed(2);
    if (cancelFlag){
      console.log("因取消标识为true,强制设置分数进度为100")
      percent = 100
    }
    console.log("分数：", percent);
    if (percent >= 100 ) {
      console.log(
        "%c@@@cancelFlag===>",
        "color:green;font-size:15px",
        cancelFlag
      );
      isAsyncData.value = false; // 同步完成
      cancelFlag
        ? messageRef.value?.show("success", "已取消上传")
        : messageRef.value?.show("success", "数据同步完成");
      const time = dayjs().format("YYYY-MM-DD HH:mm:ss");
      updateTime.value = time;
      chrome.storage.local.set({ percentMap: "" });
      chrome.storage.local.set({
        updateTime: time,
      });
    } else if (cancelTimerNum.value === defaultTimeNum) {
      isAsyncData.value = true; // 同步中
    }
  });
};

onMounted(() => {
  isAsyncData.value = true;
  setTimeout(()=>{
    valideVersion();
    isAsyncData.value = false;
    canOpt.value = true;
    spinShow.value = false;
  }, 2000);
  setInterval(getPercent, 2000);

  chrome.storage.local.get(["switchLocal"], (data) => {
    switchLocal.value = data?.switchLocal || switchLocal.value;
  });
  chrome.storage.local.get(["updateTime"], (data) => {
    updateTime.value = data?.updateTime || "";
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "update") {
      valideVersion();
    }
    if (message.type === "error") {
      switch (message.data) {
        case "c5":
          c5ErrorCb();
          break;
        case "uu":
          uuErrorCb();
          break;
        case "buff":
          buffErrorCb();
          break;
        default:
          break;
      }
    }
  });
});

const c5SwitchRef = ref(null);
const c5ErrorCb = () => {
  messageRef.value?.show("error", "C5游戏平台登录失败，请检查您的登录信息");
  c5SwitchRef.value?.showError("c5");
};
const uuSwitchRef = ref(null);
const uuErrorCb = () => {
  messageRef.value?.show("error", "悠悠平台登录失败，请检查您的登录信息");
  uuSwitchRef.value?.showError("uu");
};
const buffSwitchRef = ref(null);
const buffErrorCb = () => {
  messageRef.value?.show("error", "BUFF平台登录失败，请检查您的登录信息");
  buffSwitchRef.value?.showError("buff");
};

// 开始同步数据
const startAsyncData = async () => {
  if(!canOpt.value) return;
 
  if (cancelTimerNum.value < defaultTimeNum) {
    return messageRef.value?.show(
      "warning",
      `请等待${cancelTimerNum.value}秒后再次上传`
    );
  }
  if (!canClick.value || isAsyncData.value) {
    return;
  } // 开始的3S 不能点击
   valideVersion();
  // 第一步 检测打开几个开关 如果没有  返回
  const { switchLocal } = await chrome.storage.local.get(["switchLocal"]);
  const keys = switchLocal ? Object.keys(switchLocal) : [];

  if (
    keys.length === 0 ||
    !switchLocal ||
    Object.values(switchLocal).every((item) => !item)
  ) {
    messageRef.value?.show("warning", "请选择至少一个平台进行同步");
    return;
  }

  // 第二步 每个开关 开启的时候 请求数据  有平台打开了开关
  isAsyncData.value = true;

  keys.forEach(async (key) => {
    if (switchLocal[key]) {
      // 开启了
      // 获取Cookie
      if (key === "c5") {
        const { c5Cookie } = await chrome.storage.local.get(["c5Cookie"]);
        if (!c5Cookie) {
          messageRef.value?.show("warning", "请先登录C5GAME平台");
          return;
        }
        const cookieArr = c5Cookie?.split(";");
        const c5CookieObj = {};
        cookieArr.forEach((item) => {
          const [key, value] = item.split("=");
          c5CookieObj[key.trim()] = value;
        });

        chrome.runtime.sendMessage({
          type: "collectC5",
          data: c5CookieObj?.["NC5_accessToken"],
        });
      }
      if (key === "uu") {
        const { uuCookie } = await chrome.storage.local.get(["uuCookie"]);
        chrome.runtime.sendMessage({ type: "collectUU", data: uuCookie });
      }
      if (key === "buff") {
        const { buffCookie } = await chrome.storage.local.get(["buffCookie"]);
        chrome.runtime.sendMessage({ type: "collectBuff", data: buffCookie });
      }
    }
  });
  // Cookie如果过期了  提示用户登录 重新登录
  // 第三步 解析数据  存储到本地
  // 第四步 依次获取数据 C5GAME BUFF UU
  // 第五步 上传数据  记录时间 & 上传的页码
};
// 切换开关
const handleSwitch = (type, source, val) => {
  isAsyncData.value = false;
  switchLocal.value[type] = val;
  chrome.storage.local.set({ switchLocal: { ...switchLocal.value } }, () => {});
};
</script>

<style scoped lang="less">

:deep(.n-spin-container){
  background-color: #ee0a65 !important;
}

.notice {
  padding: 10px 20px;
  color: #fff;
}

.popup-container {
  width: 350px;
  background: #272727;
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.5);

  .popup-tips {
    background: #000;
    padding: 20px;
    font-weight: 400;
    font-size: 12px;
    color: #777777;
    line-height: 20px;
    text-align: justify;
  }
}

.btn-container {
  display: flex;
  justify-content: center;

  .btn-wrapper {
    width: 310px;
    height: 50px;
    background: #191919;
    border-radius: 4px;
    margin: 20px;
    cursor: pointer;
    border: 1px solid #8355ff;
    color: #8355ff;
    text-align: center;

    &:hover {
      background: rgba(131, 85, 255, 0.1);
      color: #8355ff;
    }
  }

  .cancel {
    border: 1px solid #ee0a65;
    color: #ee0a65;

    &:hover {
      background: rgba(131, 85, 255, 0.1);
      color: #ee0a65;
    }
  }

  .btn-sync {
    color: #fff;
    overflow: hidden;
    position: relative;

    &:hover {
      color: #fff;
    }

    .progress-bar {
      height: 50px;
      background: linear-gradient(270deg, #b98eff 0%, #8355ff 100%);
      width: 30%;
      /* 默认宽度为0 */
      transition: width 0.5s ease;
      /* 添加过渡效果以获得平滑动画 */
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;
    }

    .btn-text {
      position: absolute;
      z-index: 10;
      top: 5px;
      left: 0;
      right: 0;
    }

    .btn-text2 {
      top: 20px;
    }
  }
}

.marginTop14 {
  margin-top: 14px;
}

.marginTop5 {
  margin-top: 5px;
}




</style>
