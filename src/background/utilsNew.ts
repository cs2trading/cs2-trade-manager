// import dayjs from 'dayjs'
import { getUk, randomString2 } from "../common/utils/index.ts";
import {
  genetate90date,
  updateNear90Date,
  isMoreThan3Month
} from "./date.ts";
import { Pause } from "./interfaceUtils.ts";
import { splitArrayIntoChunks } from "./commonApi.ts";
import { BASE_URL, pkg } from "./const.ts";

 const  validator  = {
   async set(target, property, value) {
    // 正常设置属性
    target[property] = value;
    const { cancelFlag } = await chrome.storage.local.get([`cancelFlag`]);
    if (cancelFlag) {
      console.log("因取消上传，强制设置percentMap为null")
      target = null
    }
    chrome.storage.local.set({ percentMap: target });
    return true; // 表示设置成功
  },
};

export const flags = new Proxy(
  {
    c5Buy: 0,
    c5Sell: 0,
    buffBuy: 0,
    buffSell: 0,
    uuBuy: 0,
    uuSell: 0,
  },
  validator
);
const intervalTime = 10000; // 10秒



export const errorCb = (type) => {
  chrome.runtime.sendMessage({
    type: "error",
    data: type,
  });
};

export const getRecordPage = async (key, type) => {
  const user = await chrome.storage.local.get([key]);
  const userKey = user[key];
  if (userKey) {
    const page = await chrome.storage.local.get([
      `${userKey}${type}${key}Page`,
    ]);
    const storePage = page[`${userKey}${type}${key}Page`];
    return storePage || 1;
  }
  return 1;
};
// 定义一个异步函数，用于保存记录页数
const saveRecordPage = async (key, type, page, isEnd) => {
  // 从本地存储中获取用户信息
  const user = await chrome.storage.local.get([key]);
  // 获取用户信息中的key值
  const userKey = user[key];

  if (page >= 1) {
    chrome.storage.local.set({
      [`${userKey}${type}${key}Page`]: page,
    });
  }
  if (isEnd) {
    chrome.storage.local.set({ [`${userKey}${type}${key}Page`]: page - 1 });
  }
};

// 购买订单明细

// 定义一个异步函数，用于格式化UU数据

// 定义一个异步函数，用于更新记录页码
export const updateRecordPage = async (page, orderType, platform, isEnd) => {
  // 获取上一次保存的页码
  const prevPage = await getRecordPage(
    `${platform}user`,
    orderType === 1 ? "buy" : "sell"
  );
  // 如果上一次保存的页码小于这一次的页码，或者已经到了最后一页，则更新保存的页码
  if (Number(prevPage) < page) {
    // 上一次存的页码 比这一次的大 不更新
    // 更新保存的页码
    saveRecordPage(
      `${platform}user`,
      orderType === 1 ? "buy" : "sell",
      page,
      isEnd
    );
  }
};

export const updateRecordDate = async (page, orderType, platform, date) => {
  // 更新点亮的日期
  if (!date) return;
  const type = orderType === 1 ? "Buy" : "Sell";
  const platformType = `${platform}${type}`;
  updateNear90Date(platformType, date);
};

const uploadDataToServer = (data, page, orderType, platform, isEnd) => {
  // console.log("上传的数据", data);
  const params = {
    tradeHistoryList: data,
  };
  if (data.length < 1) {
    return;
  }
  if (data.length <= 70) {
    upload70toServer([data], page, orderType, platform, isEnd);
  } else {
    const uplist = splitArrayIntoChunks(data);
    upload70toServer(uplist, page, orderType, platform, isEnd);
  }
};

const upload70toServer = (uplist, page, orderType, platform, isEnd) => {
  const num = uplist.length;
  if (num === 1) {
    uploadApi(uplist[0], page, orderType, platform, true); // 更新
  } else {
    let index = 0;
    let timer = setInterval(() => {
      uploadApi(uplist[index], page, orderType, platform, index === num - 1); // 更新
      if (index === num - 1) {
        clearInterval(timer);
        timer = null;
      } else {
        index++;
      }
    }, intervalTime);
  }
};

export const uploadApi = async (params, page, orderType, platform, isRecord) => {
  console.log(
    `%c${platform}_${orderType}  上传数据  ${params.length}条`,
    "color:green;font-size:15px"
  );
  const res = fetch(`${BASE_URL}/reptile/inventory/v1/third-trade/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "plugin-version": pkg.version,
    },
    body: JSON.stringify({
      tradeHistoryList: params,
    }),
  });
  res
    .then(async (res) => {
      const uploadRes = await res.json();

      if (uploadRes?.errorCode === 50001) {
        chrome.runtime.sendMessage({
          type: "update",
        });
        return false;
      }

      if (uploadRes.success && isRecord) {
        updateRecordDate(
          page,
          orderType,
          platform,
          params[params.length - 1]?.tradeTime
        ); // 更新点亮的日期
      }
    })
    .catch((err) => {
      console.log("上传失败，被捕获了", err);
    });
};

export const complatePercentage = () => {
  const keys = Object.keys(flags);
  let num = 0;
  for (let i = 0; i < keys.length; i++) {
    num += flags[keys[i]];
  }

  if (num >= 600) {
    return 100;
  } else {
    return num / 6 > 90 ? 81 + num / 6 / 10 : num / 6; // 尽可能像
  }
};
