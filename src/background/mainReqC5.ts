import {
  genetate90date,
  compareIsUpload,
  isMoreThan3Month,
  setUploadComplete,
} from "./date.ts";
import { flags, getRecordPage } from "./utilsNew";
import { Pause } from "./interfaceUtils";
import {
  getC5SellApi,
  getC5DetailApi,
  uploadDataToServer,
  getC5BuyApi,
} from "./commonApi.ts";
const intervalTimeList = 5000; // 列表5S
const intervalTimeDetail = 3000; // 详情3S
const completeStatus = 3; // 已完成的订单状态
const receivedGoodsStatus = 12; // 已收货的状态

export const getC5SellData = async (
  cookie: string,
  page: number,
  status: number
) => {
  const pause = await Pause();
  if (pause) return;
  if (page === 1) {
    flags.c5Sell = 0;
    await genetate90date("c5Sell");
  }

  const data = await getC5SellApi(cookie, page, status);
  await formatC5Data(data, page, 2, cookie, status); // 整理数据 并上传
};

const formatC5Data = async (
  data: any,
  page: number,
  orderType: number,
  cookie: string,
  status: number
) => {
  const pause = await Pause();
  if (pause) return;
  const { total, list } = data.data;
  // 整理list数据
  const uploadData: any[] = [];
  // 调试
  // chrome.storage.local.set({ [`C5_${orderType}_Page_${page}`]: list });

  const needDetail = list?.filter(
    (item: any) => item.orderAssetList?.length > 5
  );
  const noNeedDetail = list?.filter(
    (item: any) => item.orderAssetList?.length <= 5
  );

  noNeedDetail?.forEach((item: any) => {
    const { orderAssetList, buyerSteamInfo, sellerSteamInfo } = item;
    orderAssetList?.forEach((orderAsset: any) => {
      const {
        orderAssetId,
        itemId,
        assetInfo,
        orderAssetPrice,
        marketHashName,
      } = orderAsset;
      if (!isMoreThan3Month(item.orderCreateTime)) {
        uploadData.push({
          orderId: orderAssetId,
          platformItemId: itemId,
          wear: assetInfo?.wear,
          tradeTime: item.orderCreateTime,
          price: orderAssetPrice, // 出售价格 不是交易价格
          orderType, // 1 买入  2 售出
          platform: "C5",
          marketHashName,
          steamId:
            orderType === 1
              ? buyerSteamInfo?.steamId
              : sellerSteamInfo?.steamId,
          assertId: assetInfo?.assetId,
          classId: assetInfo?.classId,
          instanceId: assetInfo?.instanceId,
          paintIndex: assetInfo?.paintIndex,
          paintSeed: assetInfo?.paintSeed,
          specialStyle: assetInfo?.levelName,
          fade: assetInfo?.gradient,
        });
      }
    });
  });

  if (uploadData.length) {
    await uploadDataToServer(
      uploadData,
      page,
      orderType,
      "c5",
      list?.length < 70
    );
  }

  for (let item of needDetail) {
    const { buyerSteamInfo, sellerSteamInfo, orderId, orderCreateTime } = item;

    const steamId =
      orderType === 1 ? buyerSteamInfo?.steamId : sellerSteamInfo?.steamId;
    if (item.orderAssetList.length > 5) {
      const detaileq = {
        orderId,
        orderType,
        cookie,
        orderCreateTime,
        steamId,
      };
      await new Promise((resolve) => setTimeout(resolve, intervalTimeDetail)); // 等待3秒
      const res: any = await getC5DetailApi(detaileq);

      const detail = res.data?.orderInfo?.orderAssetList;
      const detailList: any[] = [];
      detail?.forEach((orderAsset: any) => {
        const {
          orderAssetId,
          itemId,
          assetInfo,
          orderAssetPrice,
          marketHashName,
        } = orderAsset;
        if (!isMoreThan3Month(orderCreateTime)) {
          detailList.push({
            orderId: orderAssetId,
            platformItemId: itemId,
            wear: assetInfo?.wear,
            tradeTime: orderCreateTime,
            price: orderAssetPrice, // 出售价格 不是交易价格
            orderType, // 1 买入  2 售出
            platform: "C5",
            marketHashName,
            steamId,
            assertId: assetInfo?.assetId,
            classId: assetInfo?.classId,
            instanceId: assetInfo?.instanceId,
            paintIndex: assetInfo?.paintIndex,
            paintSeed: assetInfo?.paintSeed,
            specialStyle: assetInfo?.levelName,
            fade: assetInfo?.gradient,
          });
        }
      });
      //   await new Promise((resolve) => setTimeout(resolve, intervalTimeDetail)); // 等待3秒
      await uploadDataToServer(
        detailList,
        page,
        orderType,
        "c5",
        list?.length < 70
      );
    }
  }

  if (!list?.length) {
    // 没有获取到数据
    // 有4种情况
    // 1. 卖出的订单 且是已完成的状态， 去获取卖出已收货的
    // 2. 卖出的订单 且是已收货的状态， 标记卖出的完成
    // 3. 购买的订单 且是已完成的状态， 去获取购买已收货的
    // 4. 购买的订单 且是已收货的状态， 标记购买完成
    if (orderType === 2 && status === completeStatus) {
      // 卖出且是已完成的状态
      getC5SellData(cookie, 1, receivedGoodsStatus); // 去获取已收货的
    } else if (orderType === 2 && status === receivedGoodsStatus) {
      // 已收货的获取完成
      flags.c5Sell = 100; // 标记完成
      setUploadComplete("c5Sell");
      getC5Data(cookie, 1, completeStatus); // 获取购买的 已完成的订单
    } else if (orderType === 1 && status === completeStatus) {
      getC5Data(cookie, 1, receivedGoodsStatus); // 获取卖出的 已完成的订单
    } else if (orderType === 1 && status === receivedGoodsStatus) {
      // 购买的订单也获取完成了
      flags.c5Buy = 100; // 标记完成
      setUploadComplete("c5Buy");
    }
    return;
  }
  if (orderType === 2) {
    flags.c5Sell = flags.c5Sell + 1;
  } else {
    flags.c5Buy = flags.c5Buy + 1;
  }

  // 整理list数据
  if (
    list?.length === 70 &&
    page * 70 < Number(total) &&
    !isMoreThan3Month(list?.[list.length - 1].orderCreateTime)
  ) {
    await new Promise((resolve) => setTimeout(resolve, intervalTimeList)); // 等待5秒
    getRecordPage("c5user", orderType === 2 ? "sell" : "buy").then(
      (stagePage) => {
        compareIsUpload(
          orderType === 2 ? "c5Sell" : "c5Buy",
          list[list.length - 1].orderCreateTime,
        
          page,
          stagePage
        ).then((p) => {
          if (orderType === 2) {
            if (!p) {
              flags.c5Sell = 100; // 标记完成
              setUploadComplete("c5Sell");
              getC5Data(cookie, 1, status);
            } else {
              getC5SellData(cookie, p + 1, status);
            }
          } else {
            if (!p) {
              flags.c5Buy = 100; // 标记完成
              setUploadComplete("c5Buy");
            } else {
              getC5Data(cookie, p + 1, status);
            }
          }
        });
      }
    );
  } else {
    // 同样 4种情况
    if (orderType === 2 && status === completeStatus) {
      getC5SellData(cookie, 1, receivedGoodsStatus); // 去获取已收货的
    } else if (orderType === 2 && status === receivedGoodsStatus) {
      flags.c5Sell = 100; // 标记完成
      setUploadComplete("c5Sell");
      getC5Data(cookie, 1, completeStatus); // 获取购买的 已完成的订单
    } else if (orderType === 1 && status === completeStatus) {
      getC5Data(cookie, 1, receivedGoodsStatus); // 获取卖出的 已完成的订单
    } else if (orderType === 1 && status === receivedGoodsStatus) {
      flags.c5Buy = 100; // 标记购买完成
      setUploadComplete("c5Buy");
    }
  }
};

export const getC5Data = async (
  cookie: string,
  page: number,
  status: number
) => {
  const pause = await Pause();
  console.log("getC5Data,pause", pause);
  if (pause) return;
  if (page === 1) {
    flags.c5Buy = 0;
    await genetate90date("c5Buy");
  }
  const allData = await getC5BuyApi(cookie, page, status);
  await formatC5Data(allData, page, 1, cookie, status); // 整理数据 并上传
};
