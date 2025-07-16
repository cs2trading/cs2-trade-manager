<template>
  <div class="custom-switch" :key="type" :title="type">
    <div>{{ name }}</div>
    <div
      class="switch"
      @click="toggleSwitch"
      :style="{ cursor: uploading ? 'not-allowed' : 'pointer' }"
    >
      <div :class="selected ? '' : 'unselected'">关闭</div>
      <div :class="selected ? 'selected' : ''">开启</div>
    </div>
  </div>
  <div
    v-if="showError"
    style="
      margin-top: 10px;
      text-align: right;
      color: #d50000;
      padding-right: 20px;
    "
  >
    登录信息失效或获取数据失败，请<span
      style="color: #8355ff; text-decoration: underline; cursor: pointer"
      @click="reLoginNoValid"
      >重新登录</span
    >或等会再试
  </div>

  <AgreeModal ref="modalRef" :type="type" @confirm="getCookies(true)" />
  <Message ref="messageSwitchRef" />
  <UULogin ref="uuLoginRef" @close="uuLoginClose" />
  <NoCookie ref="noCookieRef" />
</template>
<script setup>
import { ref, watch, toRefs, onMounted } from "vue";
import Message from "./Message.vue";
import UULogin from "./UULogin.vue";
import NoCookie from "./NoCookie.vue";

import AgreeModal from "./AgreeModal.vue";
import { getC5Data, getBuffData, getUUData } from "./../utils";
const props = defineProps({
  name: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "c5",
  },
  isUploading: {
    type: Boolean | Number,
  },
  cancelTimerNum: {
    type: Number,
  },
});

const emits = defineEmits(["change"]);

const selected = ref(false);
const showError = ref(false);
const messageSwitchRef = ref(null);
const modalRef = ref();
const uuLoginRef = ref(null);
const noCookieRef = ref(null);

const { isUploading } = toRefs(props);
const uploading = ref(false);

// 监听value变化
watch(
  () => [props.isUploading, props.cancelTimerNum],
  (newVal, oldVal) => {
    console.log(
      "%c@@@props.isUploading===>",
      "color:green;font-size:15px",
      props.isUploading
    );
    if (
      (!props.isUploading && props.cancelTimerNum < 10) ||
      props.isUploading
    ) {
      uploading.value = true;
    } else {
      uploading.value = false;
    }
  }
);

onMounted(() => {
  chrome.storage.local.get(["switchLocal"], (data) => {
    selected.value = data.switchLocal?.[props.type] || false;
  });
});

const showErrorFn = (type) => {
  if (type === props.type) {
    selected.value = false;
    emits("change", props.type, selected.value);
    showError.value = true;
  }
};
const uuLoginClose = (status) => {
  // UU
  if (status === "success") {
    selected.value = true;
    emits("change", props.type, selected.value);
    showError.value = false;
  }
};
const reLoginNoValid = async () => {
  const url = await getURL();
  if (props.type === "c5") {
    if (url.includes("c5game.com")) {
      messageSwitchRef.value?.show("warning", "请登录后，重新打开插件");
      return;
    } else {
      chrome.tabs.create({ url: "https://www.c5game.com" });
    }
  } else if (props.type === "buff") {
    if (url.includes("buff.163.com")) {
      messageSwitchRef.value?.show("warning", "请登录后，重新打开插件");
      return;
    } else {
      chrome.tabs.create({ url: "https://buff.163.com" });
    }
  } else if (props.type === "uu") {
    if (url.includes("www.youpin898.com")) {
      messageSwitchRef.value?.show("warning", "请登录后，重新打开插件");
      return;
    } else {
      chrome.tabs.create({ url: "https://www.youpin898.com" });
    }
  }
};

async function isAgree(key) {
  let result = false;
  const res = await chrome.storage.local.get([key]);
  if (res[key]) {
    // 说明之前同意过了
    result = true;
  }
  return result;
}

const openSwitch = async (isAgree) => {
  const url = await getURL();
  if (props.type === "c5") {
    if (!url.includes("c5game.com") && isAgree) {
      messageSwitchRef.value?.show("warning", "请在C5GAME平台打开插件");
      setTimeout(() => {
        chrome.tabs.create({ url: "https://www.c5game.com" });
      }, 2000);
      return;
    }
    const { c5Cookie } = await chrome.storage.local.get(["c5Cookie"]);
    if (c5Cookie) {
      selected.value = true;
      emits("change", props.type, selected.value);
    } else {
      noCookieRef.value?.show("c5", url);
      selected.value = false;
    }
    if (!c5Cookie && !url.includes("c5game.com")) {
      noCookieRef.value?.show("c5", url);
      selected.value = false;
    }
  }
  if (props.type === "buff") {
    const { buffCookie } = await chrome.storage.local.get(["buffCookie"]);

    if (!url.includes("buff.163.com") && isAgree) {
      messageSwitchRef.value?.show("warning", "请在BUFF平台打开插件");
      setTimeout(() => {
        chrome.tabs.create({ url: "https://buff.163.com" });
      }, 2000);
      return;
    }
    if (buffCookie) {
      selected.value = true;
      emits("change", props.type, selected.value);
    } else {
      noCookieRef.value?.show("buff", url);
      selected.value = false;
    }

    if (!buffCookie && !url.includes("buff.163.com")) {
      noCookieRef.value?.show("buff", url);
      selected.value = false;
    }
  }

  if (props.type === "uu") {
    if (!url.includes("youpin898.com") && isAgree) {
      messageSwitchRef.value?.show("warning", "请在悠悠有品平台打开插件");
      setTimeout(() => {
        chrome.tabs.create({ url: "https://www.youpin898.com" });
      }, 2000);
      return;
    }
    const { uuCookie } = await chrome.storage.local.get(["uuCookie"]);

    if (uuCookie) {
      selected.value = true;
      emits("change", props.type, selected.value);
    } else {
      noCookieRef.value?.show("uu", url);
      selected.value = false;
    }
    if (!uuCookie && !url.includes("youpin898.com")) {
      noCookieRef.value?.show("uu", url);
      selected.value = false;
    }
  }
  // if (isAgree && props.type === "uu") {
  //   uuLoginRef.value?.show();
  // }
};

const getCookies = async (isAgree) => {
   setTimeout(() => {
      openSwitch(isAgree);
    }, 1000);
  // await openSwitch(isAgree);
  // if (!isAgree) {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);

  if (tab) {
    // 使用 chrome.tabs.sendMessage 发送消息

    chrome.tabs.sendMessage(tab.id, {
      type: props.type,
      url: tab.url,
    });
  }
  // }

  if (isAgree) {
    // await chrome.storage.local.set({ [`${props.type}Cookie`]: true });
    setTimeout(() => {
      openSwitch(isAgree);
    }, 1500);
  }
};

const getURL = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab.url;
};

async function toggleSwitch() {
  if (uploading.value) {
    return;
  }
  if (selected.value) {
    selected.value = false; // 关闭
    emits("change", props.type, selected.value);
    return;
  }

  // 第一步 ： 之前是否同意过 可以获取登录态及抓取数据
  const isAgreeRes = await isAgree(props.type);

  if (!isAgreeRes) {
    // 之前没有同意过 弹出是否同意的弹窗
    modalRef.value?.show();
    return;
  }

  // 第二步 获取Cookie

  getCookies(false);
}
// 监听发送过来的Cookie  ['c5Cookie','uuCookie','buffCookie']
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "noMatch") {
    const url = await getURL();
    // 没有命中
    if (message.data === "c5" && props.type === "c5") {
      if (url.includes("c5game.com")) {
        messageSwitchRef.value?.show("warning", "请登录后，重新打开插件");
        return;
      }
  
    }
    if (message.data === "buff" && props.type === "buff") {
      if (url.includes("buff.163.com")) {
        messageSwitchRef.value?.show("warning", "请登录后，重新打开插件");
        return;
      }

 
    }
    if (message.data === "uu" && props.type === "uu") {
      if (url.includes("www.youpin898.com")) {
        messageSwitchRef.value?.show("warning", "请登录后，重新打开插件");
        return;
      }

    
    }

    return;
  }

  if (message.type.includes(props.type)) {
    if (message.type === "c5Cookie") {
      const store = JSON.parse(message?.store || "{}");
      const { detailed_userInfo } = store;
      const userId = detailed_userInfo?.personalData?.userId;
      if (userId) {
        chrome.storage.local.set({ c5user: userId });
      }
    }else if (message.type === "buffCookie") {
      const res = await fetch(
        "https://buff.163.com/account/api/user/info/v2?meta_list=is_premium&_=" +
          new Date().getTime(),
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
            Cookie: message.data,
          },
        }
      );
      const data = await res.json();
      const useId = data?.data?.user_info?.id;

      if (useId) {
        chrome.storage.local.set({ buffuser: useId });
      }
    }else if (message.type === "uuCookie") {
      console.log("UU的消息", message);
      const store = JSON.parse(message?.store || "{}");
      const SteamId = store?.SteamId;
      const UserId = store?.UserId;
      if (SteamId) {
        chrome.storage.local.set({ uuSteamId: SteamId });
        chrome.storage.local.set({ uuuser: UserId });
      }else {
        messageSwitchRef.value?.show("warning", "当前悠悠有品账号未绑定Steam");
        return;
      }

    }

    chrome.storage.local.set({ [message.type]: message.data }, function () {
      validLoginStatus();
    });
  }
});

// 校验登录态
const validLoginStatus = async () => {
  const { switchLocal } = await chrome.storage.local.get(["switchLocal"]);
  const keys = switchLocal ? Object.keys(switchLocal) : [];
  const url = await getURL();

  keys?.forEach(async (key) => {
    if (switchLocal[key]) {
      // 开启了
      // 获取Cookie
      if (key === "c5") {
        const { c5Cookie } = await chrome.storage.local.get(["c5Cookie"]);
        if (!c5Cookie) {
          noCookieRef.value?.show("c5", url);
          selected.value = false;
          return;
        }
        const cookieArr = c5Cookie?.split(";");
        const c5CookieObj = {};
        cookieArr.forEach((item) => {
          const [key, value] = item.split("=");
          c5CookieObj[key.trim()] = value;
        });
        getC5Data(c5CookieObj["NC5_accessToken"], showErrorFn);
      }
      if (key === "uu") {
        const { uuCookie } = await chrome.storage.local.get(["uuCookie"]);
        if (!uuCookie) {
          noCookieRef.value?.show("uu", url);
          selected.value = false;
          return;
        }

        const cookieArr = uuCookie?.split(";");
        const uuCookieObj = {};
        cookieArr.forEach((item) => {
          const [key, value] = item.split("=");
          uuCookieObj[key.trim()] = value;
        });

        // const cookieArr = uuCookie?.split("=");
        // console.log(
        //   "%获取的Cookie",
        //   "color:green;font-size:15px",
        //   uuCookie,
        //   cookieArr
        // );

        getUUData(uuCookieObj["uu_token"], showErrorFn);
      }
      if (key === "buff") {
        const { buffCookie } = await chrome.storage.local.get(["buffCookie"]);
        if (!buffCookie) {
          noCookieRef.value?.show("buff", url);
          selected.value = false;
          return;
        }
        getBuffData(buffCookie, showErrorFn);
      }
    }
    selected.value = true;
    emits("change", props.type, selected.value);
    chrome.notifications.create(
      {
        type: "basic",
        title: "CS2交易记录管理工具",
        message: "获取登录信息",
        iconUrl: "../icons/icon_32.png",
      },
      (notificationId) => {}
    );
  });
};
watch(
  () => selected.value,
  () => {
    showError.value = false;
  }
);

const refreshStatus = () => {
  chrome.storage.local.get(["switchLocal"], (data) => {
    selected.value = data.switchLocal?.[props.type] || false;
  });
  showError.value = false;
};

defineExpose({
  showError: showErrorFn,
  refreshStatus,
});
</script>
<style lang="less" scoped>
.custom-switch {
  font-weight: 400;
  font-size: 14px;
  color: #ffffff;
  padding-left: 20px;
  padding-right: 19px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  cursor: pointer;

  .switch {
    display: flex;
    width: 120px;
    height: 30px;
    background: #191919;
    border-radius: 4px;
    align-items: center;
    position: relative;

    & > div {
      width: 60px;
      color: #777;
      text-align: center;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      transition: 0.4s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    & > div:last-child {
      transform: translateX(60px);
    }

    .unselected {
      background: #666666;
      height: 30px;
      color: #ffffff;
      border-radius: 4px;
      transition: 0.4s;
      transform: translateX(0px);
    }

    .selected {
      background: #8355ff;
      height: 30px;
      color: #ffffff;
      border-radius: 4px;

      transition: 0.4s;
      transform: translateX(60px);
    }
  }
}
</style>
