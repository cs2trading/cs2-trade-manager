import { updateNear90Date } from "./date.ts";


const validator = {
  async set(target: any, property: string, value: any) {
    // 正常设置属性
    target[property] = value;
    const { cancelFlag } = await chrome.storage.local.get([`cancelFlag`]);
    if (cancelFlag) {
      console.log("因取消上传，强制设置percentMap为null");
      target = null;
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
  // @ts-ignore
  validator
);

export const errorCb = (type: string) => {
  chrome.runtime.sendMessage({
    type: "error",
    data: type,
  });
};

export const getRecordPage = async (key: string, type: string) => {
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
const saveRecordPage = async (
  key: string,
  type: string,
  page: number,
  isEnd: boolean
) => {
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

// 定义一个异步函数，用于更新记录页码
export const updateRecordPage = async (
  page: number,
  orderType: number,
  platform: string,
  isEnd: boolean,
  status?:number
) => {
  // 获取上一次保存的页码
  const prevPage = await getRecordPage(
    `${platform}user`,
    orderType === 1 ? "buy" : "sell"
  );
  if (platform==='c5') { // 仅针对c5
    chrome.storage.local.set({
      [`${platform}status`]: status
    })
  }
  console.log('更新页码',prevPage, page)
  // 如果上一次保存的页码小于这一次的页码，或者已经到了最后一页，则更新保存的页码
  if (Number(prevPage) <= page) {
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

export const updateRecordDate = async (
  orderType: number,
  platform: string,
  date: number
) => {
  // 更新点亮的日期
  if (!date) return;
  const type = orderType === 1 ? "Buy" : "Sell";
  const platformType = `${platform}${type}`;
  updateNear90Date(platformType, date);
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


// 调用接口 获取接口返回的配置数据 并设置好对应的属性 等调用接口的时候使用