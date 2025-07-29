import { BASE_URL, pkg } from "./const";
import { updateRecordDate, updateRecordPage, flags, errorCb } from "./utilsNew";
import { Pause } from "./interfaceUtils.ts";
import { isMoreThan3Month } from "./date.ts";
import { getUk, randomString2 } from "../common/utils/index.ts";

const uploadMaxNum = 100; // 一次上传的最大数量
// 异步函数，用于发送请求并重试

async function handlePlatformError(url: string, options: any, retries: number) {
  console.warn(
    `Request failed. Retrying in 1 minute... (Remaining retries: ${
      retries - 1
    }${url})`
  );

  const raceRs = Promise.race([
    new Promise((resolve) => setTimeout(resolve, 60000)), // 等待 1 分钟
    new Promise((resolve, reject) => {
      let timer: number | null = setInterval(() => {
        Pause().then((res) => {
          if (res) {
            clearInterval(timer as number);
            timer = null;
            resolve({ customError: "canceled" });
          }
        });
      }, 1000);
    }),
  ]);

  let rsData: any = await raceRs;
  if (rsData?.customError) {
    options?.resolve && options?.resolve(rsData);
    return rsData;
  }
  return null;
}
async function fetchWithRetry(url: string, options = {} as any, retries = 3) {
  const pause = await Pause();
  if (pause) {
    return { customError: "canceled" };
  }
  let resData;
  try {
    // 发送请求
    const response = await fetch(url, options);
    // 网络错误或无效响应
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 解析响应数据
    resData = await response.json();
    // UU 获取详情的
    if (url.includes("/order/query/detail")) {
      if (!resData?.data?.userCommodityVOList) {
        if (retries > 1) {
          const res = await handlePlatformError(url, options, retries);
          if (res) {
            return res;
          }
          return fetchWithRetry(url, options, retries - 1);
        } else {
          return { customError: "error" };
        }
      }
      // UU 特殊款式
    } else if (url.includes("/commodity/Commodity/Detail")) {
      if (!resData?.Data) {
        if (retries > 1) {
          const res = await handlePlatformError(url, options, retries);
          if (res) {
            return res;
          }
          return fetchWithRetry(url, options, retries - 1);
        } else {
          return { customError: "error" };
        }
      }
      // Buff 详情
    } else if (url.includes("/bundle_overview")) {
      if (!resData?.data) {
        // 不存在
        if (retries > 1) {
          const res = await handlePlatformError(url, options, retries);
          if (res) {
            return res;
          }
          return fetchWithRetry(url, options, retries - 1);
        } else {
          return { customError: "error" };
        }
      }
      // Buff的 出售&购买列表以及用id获取一条数据的
    } else if (url.includes("/history")) {
      //
      const items = resData?.data?.items;
      const { code } = resData; // Buff的登录
      if (code === "Login Required") {
        return { customError: "error" };
      }
      console.log("history items：", items);
      // 如果响应数据不是数组，则重试
      if (!Array.isArray(items)) {
        if (retries > 1) {
          const res = await handlePlatformError(url, options, retries);
          if (res) {
            return res;
          }

          return fetchWithRetry(url, options, retries - 1);
        } else {
          return { customError: "error" };
        }
      }

      // UU 出售&购买列表
    } else if (url.includes("v1/sell/list") || url.includes("v1/buy/list")) {
      console.log("%c@@@/sell/list===>", "color:red;font-size:15px", resData);
      if (resData.code === 84101) {
        return { customError: "error" };
      }
      // 悠悠的列表
      const orderList = resData?.data?.orderList;
      // 如果响应数据不是数组，则重试
      if (!Array.isArray(orderList)) {
        if (retries > 1) {
          const res = await handlePlatformError(url, options, retries);
          if (res) {
            return res;
          }

          return fetchWithRetry(url, options, retries - 1);
        } else {
          return { customError: "error" };
        }
      }
      // 是我们的接口 0为正常 50001为版本升级 其他的报错均有问题
    } else if (url.includes("www.c5game.com")) {
      // C5的接口
      const { errorCode } = resData;
      console.log("C5的接口");
      if (errorCode === 101) {
        // 未登录 或者 token过期
        return { customError: "error" };
      }
    } else if (
      url.includes(BASE_URL) &&
      resData.errorCode !== 0 &&
      resData.errorCode !== 50001
    ) {
      console.log("上传报错", resData.errorCode);
      if (retries > 1) {
        const res = await handlePlatformError(url, options, retries);
        if (res) {
          return res;
        }

        return fetchWithRetry(url, options, retries - 1);
      } else {
        return { customError: "error" };
      }
    }
    // 如果options中包含resolve函数，则调用resolve函数
    options?.resolve && options?.resolve(resData);
    return resData;
  } catch (error) {
    console.log(error);
    console.log("请求接口报错：", url, options);
    if (retries > 1) {
      console.warn(
        `Request failed. Retrying in 1 minute... (Remaining retries: ${
          retries - 1
        }${url})`
      );
      await new Promise((resolve) => setTimeout(resolve, 60000)); // 等待 1 分钟
      return fetchWithRetry(url, options, retries - 1);
    } else {
      return { customError: "error" };
    }
  }
}

export const splitArrayIntoChunks = (arr: any, chunkSize = 100) => {
  if (!Array.isArray(arr)) {
    throw new TypeError("第一个参数必须是一个数组");
  }
  const result = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  return result;
};

export const uploadDataToServer = async (
  data: any,
  page: number,
  orderType: number,
  platform: string,
  isEnd: boolean
) => {
  if (data.length < 1) {
    return;
  }
  if (data.length <= uploadMaxNum) {
    await upload100toServer([data], page, orderType, platform);
  } else {
    const uplist = splitArrayIntoChunks(data);
    await upload100toServer(uplist, page, orderType, platform);
  }
  await updateRecordPage(page, orderType, platform, isEnd); // 更新页码
};

const upload100toServer = async (
  uplist: any[],
  page: number,
  orderType: number,
  platform: string
) => {
  const num = uplist.length;
  if (num === 1) {
    await uploadApi(uplist[0], page, orderType, platform, true);
  } else {
    return await new Promise((resolve) => {
      let index = 0;
      let timer: number | null = setInterval(async () => {
        await uploadApi(
          uplist[index],
          page,
          orderType,
          platform,
          index === num - 1
        );
        if (index === num - 1) {
          clearInterval(timer as number);
          timer = null;
          resolve("");
        } else {
          index++;
        }
      }, 3000);
    });
  }
};

const uploadApi = async (
  params: any,
  page: number,
  orderType: number,
  platform: string,
  isRecord: boolean
) => {
  return new Promise(async (resolve, reject) => {
    const res = fetchWithRetry(
      `${BASE_URL}/reptile/inventory/v1/third-trade/batch`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "plugin-version": pkg.version, 
        },
        body: JSON.stringify({
          tradeHistoryList: params,
        }),
        resolve,
      }
    );
    res.then(async (res) => {
      exceptionHandlingAll(res);
      const uploadRes = res;

      if (uploadRes?.errorCode === 50001) {
        // console.log("版本错误");
        chrome.runtime.sendMessage({
          type: "update",
        });
        return false;
      }

      if (uploadRes.success && isRecord) {
        updateRecordDate(
          orderType,
          platform,
          params[params.length - 1]?.tradeTime
        ); // 更新点亮的日期
      }
      console.log(
        `%c${platform}_${orderType}  上传数据  ${params.length}条`,
        "color:green;font-size:15px"
      );
      resolve(null);
    });
  });
};

export const getSpecialList = async () => {
  const res = await fetchWithRetry(
    `${BASE_URL}/common/config/v1/special-styles/short-names`
  );
  exceptionHandlingAll(res);
  const { data } = res;
  return data;
};

export const getC5SellApi = async (
  cookie: string,
  page: number,
  status: number = 3
) => {
  return await new Promise(async (resolve) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "70",
      appId: "730",
      status: status.toString(),
      type: "",
      keyword: "",
    });
    const allData = await fetchWithRetry(
      `https://www.c5game.com/napi/trade/search/v3/merchant/orders/list?${params}`,
      {
        method: "GET",
        headers: {
          device: 1,
          platform: 2,
          Access_token: cookie,
        },
        resolve,
      }
    );
    exceptionHandlingC5(allData);
    resolve(allData.data);
    return allData.data;
  });
};

export const getC5BuyApi = async (
  cookie: string,
  page: number,
  status: number = 3
) => {
  return await new Promise(async (resolve) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "70",
      appId: "730",
      status: status.toString(),
      type: "",
      keyword: "",
    });

    // 购买记录
    const allData = await fetchWithRetry(
      `https://www.c5game.com/napi/trade/search/v2/purchase/orders/list?${params}`,
      {
        method: "GET",
        headers: {
          device: 1,
          platform: 2,
          Access_token: cookie,
        },
        resolve,
      }
    );
    exceptionHandlingC5(allData);
    resolve(allData.data);
    return allData.data;
  });
};

export const getC5DetailApi = async ({
  orderId,
  orderType,
  cookie,
}: {
  orderId: string;
  orderType: number;
  cookie: string;
}) => {
  return await new Promise(async (resolve) => {
    const typeStr = orderType === 1 ? "buyer-order" : "seller-order"; // 1 买入  2 售出

    const url = `https://www.c5game.com/napi/trade/support/order/v1/${typeStr}/${orderId}`;
    const data = await fetchWithRetry(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        device: 1,
        platform: 2,
        Access_token: cookie,
      },
      resolve,
    });
    exceptionHandlingC5(data);
    const itemList = data?.data?.orderInfo?.orderAssetList;
    console.log("C5订单详情", itemList);
    resolve(itemList);
    return itemList;
  });
};

export const getBuffSellApi = async (cookie: string, page: number) => {
  return await new Promise(async (resolve) => {
    const params = new URLSearchParams({
      page_num: page.toString(),
      page_size: "24",
      state: "success",
      game: "csgo",
      appid: "730",
    });

    const allData = await fetchWithRetry(
      `https://buff.163.com/api/market/sell_order/history?${params}`,
      {
        method: "GET",
        headers: {
          cookie: cookie,
          "Access-Control-Allow-Origin": "*",
        },
        resolve,
      }
    );
    console.log("BUFF - history：allData", allData);
    exceptionHandlingBuff(allData);
    resolve(allData);
    return allData;
  });
};

export const getBuffApi = async (cookie: string, page: number) => {
  return await new Promise(async (resolve) => {
    const params = new URLSearchParams({
      page_num: page.toString(),
      page_size: "24",
      state: "success",
      game: "csgo",
      appid: "730",
    });
    const allData = await fetchWithRetry(
      `https://buff.163.com/api/market/buy_order/history?${params}`,
      {
        method: "GET",
        headers: {
          cookie: cookie,
          "Access-Control-Allow-Origin": "*",
        },
        resolve,
      }
    );
    exceptionHandlingBuff(allData);
    resolve(allData);
    return allData;
  });
};

export const getBuffDetailApi = async (
  id: string,
  type: number,
  cookie: string
) => {
  const pause = await Pause();
  if (pause) return;
  return await new Promise(async (resolve) => {
    const typeStr = type === 1 ? "buy_order" : "sell_order";

    const detailData = await fetchWithRetry(
      `https://buff.163.com/api/market/${typeStr}/history?page_num=1&page_size=1&search=${id}&game=csgo&appid=730`,
      {
        method: "GET",
        headers: {
          cookie: cookie,
          "Access-Control-Allow-Origin": "*",
        },
        resolve,
      }
    );
    exceptionHandlingBuff(detailData);
    resolve(detailData);
    return detailData;
  });
};

export const getBuffDetailList = async (param: any) => {
  const pause = await Pause();
  if (pause) return;
  return await new Promise(async (resolve) => {
    const { id, orderType, cookie, steamid } = param;
    const detailListRes = await fetchWithRetry(
      `https://buff.163.com/api/market/bundle_overview/${id}?game=csgo&appid=730`,
      {
        method: "GET",
        headers: {
          cookie,
          "Access-Control-Allow-Origin": "*",
        },
        resolve,
      }
    );
    exceptionHandlingBuff(detailListRes);
    const collectDetailDataBuff: any[] = [];
    const { items, goods_infos, created_at } = detailListRes?.data;
    items.forEach((item: any) => {
      const { asset_info } = item;
      if (!isMoreThan3Month(created_at)) {
        collectDetailDataBuff.push({
          orderId: id,
          platformItemId: asset_info?.goods_id,
          wear: asset_info?.paintwear,
          tradeTime: created_at,
          price: goods_infos[asset_info?.goods_id].sell_reference_price, //
          orderType, // 1 买入  2 售出
          platform: "BUFF",
          marketHashName: goods_infos[asset_info?.goods_id].market_hash_name,
          name: goods_infos[asset_info?.goods_id].name,
          steamId: steamid,
          assertId: asset_info?.assetid,
          classId: asset_info?.classid,
          instanceId: asset_info?.instanceid,
          paintIndex: asset_info?.info?.paintindex,
          paintSeed: asset_info?.info?.paintseed,
          specialStyle: asset_info?.info?.phase_data,
          fade: "", // 没有
        });
      }
    });
    resolve(collectDetailDataBuff);
    return collectDetailDataBuff;
  });
};

let ukCode = "";

const getUKData = async () => {
  if (ukCode) return;
  const uk = await getUk();
  ukCode = uk;
};
getUKData();

export const getUUSellDataApi = async (cookie: string, page: number) => {
  return await new Promise(async (resolve) => {
    const headers = {
      tracestate: "bnro=android/11_android/8.12.1_okhttp/3.14.9",
      traceparent: "00-89981f9d92d94ef69aebe1ffc7f30273-97ab70354b502f17-01",
      DeviceToken: "YQv1Ss8HPpMDAHQPwrSZ6zZd",
      DeviceId: "YQv1Ss8HPpMDAHQPwrSZ6zZd",
      requestTag: "297F4E566F34770C3B53A2D72F06D257",
      Gameid: 730,
      deviceType: 5,
      platform: "android",
      currentTheme: "Light",
      "package-type": "uuyp",
      "App-Version": "5.31.3",
      uk: ukCode,
      deviceUk:
        "5FJokW4TQMKHyjoXg6jsC09O4mLNzNh0REBbiDzO09E79zGrWAkm1l7AMbmNqY91H",
      "Device-Info": {
        deviceId: "YQv1Ss8HPpMDAHQPwrSZ6zZd",
        deviceType: "ONEPLUSA6000",
        hasSteamApp: 1,
        requestTag: "765BCF7707B5ABF809C72D5CE4A59BA0",
        "systemName ": "Android",
        systemVersion: "11",
      },
      AppType: 4,
      Authorization: `${cookie}`,
      "User-Agent": "okhttp/3.14.9",
      "Content-Type": "application/json",
    };

    const dataSell = await fetchWithRetry(
      "https://api.youpin898.com/api/youpin/bff/trade/sale/v1/sell/list",
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          keys: "",
          orderStatus: 340, // 订单已完成
          pageIndex: page,
          pageSize: 20,
          presenterId: 0,
          sceneType: 0,
          Sessionid: randomString2,
        }),
        resolve,
      }
    );
    exceptionHandlingUu(dataSell);
    resolve(dataSell);
    return dataSell;
  });
};

export const getUUBuyDataApi = async (cookie: string, page: number) => {
  return await new Promise(async (resolve) => {
    const headers = {
      tracestate: "bnro=android/11_android/8.12.1_okhttp/3.14.9",
      traceparent: "00-89981f9d92d94ef69aebe1ffc7f30273-97ab70354b502f17-01",
      DeviceToken: "YQv1Ss8HPpMDAHQPwrSZ6zZd",
      DeviceId: "YQv1Ss8HPpMDAHQPwrSZ6zZd",
      requestTag: "297F4E566F34770C3B53A2D72F06D257",
      Gameid: 730,
      deviceType: 5,
      platform: "android",
      currentTheme: "Light",
      "package-type": "uuyp",
      "App-Version": "5.31.3",
      uk: ukCode,
      deviceUk:
        "5FJokW4TQMKHyjoXg6jsC09O4mLNzNh0REBbiDzO09E79zGrWAkm1l7AMbmNqY91H",
      "Device-Info": {
        deviceId: "YQv1Ss8HPpMDAHQPwrSZ6zZd",
        deviceType: "ONEPLUSA6000",
        hasSteamApp: 1,
        requestTag: "765BCF7707B5ABF809C72D5CE4A59BA0",
        "systemName ": "Android",
        systemVersion: "11",
      },
      AppType: 4,
      Authorization: `${cookie}`,
      "User-Agent": "okhttp/3.14.9",
      "Content-Type": "application/json",
    };
    const data = await fetchWithRetry(
      "https://api.youpin898.com/api/youpin/bff/trade/sale/v1/buy/list",
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          keys: "",
          orderStatus: 340, // 订单已完成
          pageIndex: page,
          pageSize: 20,
          presenterId: 0,
          sceneType: 0,
          Sessionid: randomString2,
        }),
        resolve,
      }
    );
    exceptionHandlingUu(data);
    resolve(data);
    return data;
  });
};

export const getUUSpeicalStyle = async (id: string, cookie: string) => {
  const pause = await Pause();
  if (pause) return;
  return await new Promise(async (resolve) => {
    const data = await fetchWithRetry(
      `https://api.youpin898.com/api/commodity/Commodity/Detail?Id=${id}&SupportQueryStickerTemplateId=1&pageSourceCode=PG3000005`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          Authorization: `${cookie}`,
        },
        resolve,
      }
    );
    exceptionHandlingUu(data);
    const Data = data.Data;

    resolve(Data?.DopplerName || Data?.HardenedName);
    return Data?.DopplerName || Data?.HardenedName;
  });
};

export const getUUDetail = async ({
  cookie,
  orderNo,
}: {
  cookie: string;
  orderNo: string;
}) => {
  const pause = await Pause();
  if (pause) return;
  return await new Promise(async (resolve) => {
    const headers = {
      tracestate: "bnro=android/11_android/8.12.1_okhttp/3.14.9",
      traceparent: "00-89981f9d92d94ef69aebe1ffc7f30273-97ab70354b502f17-01",
      DeviceToken: "YQv1Ss8HPpMDAHQPwrSZ6zZd",
      DeviceId: "YQv1Ss8HPpMDAHQPwrSZ6zZd",
      requestTag: "297F4E566F34770C3B53A2D72F06D257",
      Gameid: 730,
      deviceType: 5,
      platform: "android",
      currentTheme: "Light",
      "package-type": "uuyp",
      "App-Version": "5.31.3",
      uk: ukCode,
      deviceUk:
        "5FJokW4TQMKHyjoXg6jsC09O4mLNzNh0REBbiDzO09E79zGrWAkm1l7AMbmNqY91H",
      "Device-Info": {
        deviceId: "YQv1Ss8HPpMDAHQPwrSZ6zZd",
        deviceType: "ONEPLUSA6000",
        hasSteamApp: 1,
        requestTag: "765BCF7707B5ABF809C72D5CE4A59BA0",
        "systemName ": "Android",
        systemVersion: "11",
      },
      AppType: 4,
      Authorization: `${cookie}`,
      "User-Agent": "okhttp/3.14.9",
      "Content-Type": "application/json",
    };

    const data = await fetchWithRetry(
      `https://api.youpin898.com/api/youpin/bff/trade/v1/order/query/detail`,
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          orderNo,
          userId: "",
          Sessionid: randomString2,
        }),
        resolve,
      }
    );
    exceptionHandlingUu(data);
    resolve(data);
    return data;
  });
};

function exceptionHandlingC5(data: any) {
  if (data?.customError) {
    flags.c5Sell = 100; // 标记完成
    flags.c5Buy = 100; // 标记完成
    if (data.customError === "error") {
      errorCb("c5");
    }
    if (data.customError === "canceled") {
      chrome.storage.local.set({ cancelFlag: "true" });
    }
    console.error(data);
    throw new Error("c5停止上传");
  }
}

function exceptionHandlingBuff(data: any) {
  if (data?.customError) {
    flags.buffSell = 100; // 标记完成
    flags.buffBuy = 100; // 标记完成
    if (data.customError === "error") {
      errorCb("buff");
    }
    if (data.customError === "canceled") {
      chrome.storage.local.set({ cancelFlag: "true" });
    }
    console.error(data);
    throw new Error("buff停止上传,");
  }
}

function exceptionHandlingUu(data: any) {
  if (data?.customError) {
    flags.uuSell = 100; // 标记完成
    flags.uuBuy = 100; // 标记完成
    if (data.customError === "error") {
      errorCb("uu");
    }
    if (data.customError === "canceled") {
      chrome.storage.local.set({ cancelFlag: "true" });
    }
    console.error(data);
    throw new Error("uu停止上传");
  }
}

function exceptionHandlingAll(data: any) {
  if (data?.customError) {
    chrome.storage.local.set({ cancelFlag: "true" });
    flags.c5Sell = 100; // 标记完成
    flags.c5Buy = 100; // 标记完成
    flags.buffSell = 100; // 标记完成
    flags.buffBuy = 100; // 标记完成
    flags.uuSell = 100; // 标记完成
    flags.uuBuy = 100; // 标记完成
    console.error(data);
    throw new Error("全部停止上传");
  }
}
