<template>
  <Modal
    ref="modalRef"
    :confirmTxt="confirmTxt"
    title="悠悠账号登录"
    @confirm="handleConfirm"
    @close="closeModal"
  >
    <div style="color: #fff">
      <n-form
        ref="formRef"
        :model="model"
        :rules="rules"
        label-placement="left"
        size="medium"
        label-style="color: #fff"
      >
        <n-form-item label="手机号" path="phone">
          <n-input v-model:value="model.phone" placeholder="手机号" />
        </n-form-item>

        <n-form-item label="验证码" path="code" v-if="!handSend">
          <n-input v-model:value="model.code" placeholder="请输入验证码" />
          <div
            style="
              margin-left: 15px;
              color: #8355ff;
              cursor: pointer;
              width: 120px;
            "
            @click="getVerifyCode"
          >
            {{ verifyMsg }}
          </div>
        </n-form-item>
      </n-form>
      <div v-if="handSend">
        编辑短信内容:<span style="color: #8355ff">短信验证</span>，发送至<span
          style="color: #8355ff; cursor: pointer"
          @click="copyPhone(SmsUpNumber)"
          >{{ SmsUpNumber }}</span
        >
      </div>
    </div>
  </Modal>
  <Message ref="uuLoginRef" />
</template>

<script setup>
import { computed, ref } from "vue";
import { NForm, NFormItem, NInput, NButton } from "naive-ui";
import Message from "./Message.vue";
import Modal from "./Modal.vue";
const SmsUpNumber = ref("");
const generateRandomString2 = (len) => {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const emits = defineEmits(["close"]);
const sessionIdStr = `${generateRandomString2(8)}-${generateRandomString2(
  4
)}-${generateRandomString2(4)}-${generateRandomString2(
  4
)}-${generateRandomString2(12)}`;

const uuLoginRef = ref(null);
const modalRef = ref(null);
const formRef = ref(null);
const model = ref({
  phone: "",
  code: "",
});
const confirmTxt = ref("登录");
const handSend = ref(false);
const headers = {
  "Content-Type": "application/json",
  platform: "android",
  apptype: "4",
  "app-version": "5.19.0",
};

const rules = {
  phone: {
    required: true,
    trigger: ["blur", "input"],
    message: "请输入手机号",
  },
  code: {
    required: true,
    trigger: ["blur", "input"],
    message: "请输入验证码",
  },
};
let timer = 60;
const verifyMsg = ref("获取验证码");
const getVerifyCode = async () => {
  if (timer !== 60) {
    return;
  }
  if (!model.value.phone) {
    uuLoginRef.value?.show("warning", "请输入手机号");
    return;
  }

  const res = await fetch(
    "https://api.youpin898.com/api/user/Auth/SendSignInSmsCode",
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        Mobile: model.value.phone,
        RegTime: 0,
        Code: "",
        SessionId: sessionIdStr,
      }),
    }
  );
  const allData = await res.json();
  const { Code } = allData; // Code === 5050  手动发送  === 0 发送成功
  if (Code === 5050) {
    uuLoginRef.value?.show("warning", "验证码发送失败，请手动发送");
    confirmTxt.value = "我已发送";
    const res2 = await fetch(
      `https://api.youpin898.com/api/user/Auth/GetSmsUpSignInConfig?AppType=3&Platform=ios&SessionId=${sessionIdStr}&Version=5.14.0`,
      {
        method: "GET",
        headers: headers,
      }
    );
    const res2Data = await res2.json();
    SmsUpNumber.value = res2Data.Data?.SmsUpNumber;
    handSend.value = true;
    return;
  }
  if (Code === 0) {
    uuLoginRef.value?.show("success", "验证码发送成功");
    return;
  }

  const interval = setInterval(() => {
    if (timer === 0) {
      timer = 60;
      clearInterval(interval);
      verifyMsg.value = "获取验证码";
    } else {
      verifyMsg.value = `${timer}S后重试`;
      timer--;
    }
  }, 1000);
};

const handleConfirm = () => {
  formRef.value?.validate().then(async (valid) => {
    if (valid) {
      await fetch(`https://api.youpin898.com/api/user/Auth/GetLoginPageInfo?loginName=${model.value.phone}`,{
        method: "GET",
        headers:{
          'User-Agent': 'okhttp/3.14.9',
          ...headers
        }
      })
      if (handSend.value) {
        // 手动发送的短信

        const res2 = await fetch(
          "https://api.youpin898.com/api/user/Auth/SmsUpSignIn",
          {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
              Mobile: model.value.phone,
              SessionId: sessionIdStr,
              AppType: 4,
              area: 86,
            }),
          }
        );
        const allData2 = await res2.json();
        //  手动发送短信 待校验
        const { Data } = allData2;
        const { Token } = Data; // NickName
        chrome.storage.local.set({
          uuCookie: Token,
          uuuser: model.value.phone,
        });
      } else {
        //获取验证码的短信
        const res = await fetch(
          "https://api.youpin898.com/api/user/Auth/SmsSignIn",
          {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
              Mobile: model.value.phone,
              Code: model.value.code,
              DeviceName: "ONEPLISA",
              SessionId: sessionIdStr,
            }),
          }
        );
        const allData = await res.json();
        const { Data } = allData;
        const { Token } = Data; // NickName
        chrome.storage.local.set({
          uuCookie: Token,
          uuuser: model.value.phone,
        });
      }
      emits("close", "success");
      modalRef.value?.closeModal();
    }
  });
};
const closeModal = () => {
  confirmTxt.value = "登录";
  handSend.value = false;
  SmsUpNumber.value = "";
  model.value = {
    phone: "",
    code: "",
  };
};

const show = () => {
  modalRef.value?.show();
};
const copyPhone = (phone) => {
  navigator.clipboard.writeText(phone).then(() => {
    uuLoginRef.value?.show("success", "复制成功");
  });
};
defineExpose({
  show,
});
</script>
<style lang="less">
.n-form-item-label__text {
  color: #fff !important;
}

.n-card__content {
  padding: 0 13px 25px 13px !important;
}
</style>
