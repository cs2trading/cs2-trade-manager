import {
  genetate90date,
  compareIsUpload,
  isMoreThan3Month,
  setUploadComplete,
} from "./date.ts";
import { flags, getRecordPage } from "./utilsNew.ts";
import { Pause } from "./interfaceUtils.ts";
import {
  getUUSellDataApi,
  getUUBuyDataApi,
  uploadDataToServer,
  getUUDetail,
  getSpecialList,
  getUUSpeicalStyle,
} from "./commonApi.ts";
const intervalTimeList = 5000; // 列表5S
const intervalTimeDetail = 3000; // 详情3S

let uUspecialList: any[] = [];

export const getUUSellData = async (cookie: string, page: number) => {
  const pause = await Pause();
  if (pause) return;
  if (page === 1) {
    uUspecialList = await getSpecialList();

    flags.uuSell = 0;
    const isUpload = await genetate90date("uuSell");
    if (isUpload) {
      flags.uuSell = 100; // 标记完成
      getUUData(cookie, 1);
      return;
    }
  }
  // 出售记录
  await new Promise((resolve) => setTimeout(resolve, intervalTimeDetail));
  const dataSell = await getUUSellDataApi(cookie, page);
  await formatUUData(dataSell, page, 2, cookie); // 整理数据 并上传
};

export const getUUData = async (cookie: string, page: number) => {
  const pause = await Pause();
  if (pause) return;
  if (page === 1) {
    flags.uuBuy = 0;
    const isUpload = await genetate90date("uuBuy");
    if (isUpload) {
      flags.uuBuy = 100; // 标记完成
      return;
    }
  }

  // 请求接口  购买记录
  await new Promise((resolve) => setTimeout(resolve, intervalTimeDetail));
  const data = await getUUBuyDataApi(cookie, page);

  await formatUUData(data, page, 1, cookie);
};

const formatUUData = async (
  allData: any,
  page: number,
  orderType: number,
  cookie: string
) => {
  const pause = await Pause();
  if (pause) return;
  const {
    data: { orderList },
  } = allData;
  const uploadData = [];
  const { uuSteamId } = await chrome.storage.local.get([`uuSteamId`]);
  // 调试
  // chrome.storage.local.set({ [`UU_${orderType}_Page_${page}`]: orderList });
  const needDetail = orderList?.filter((item: any) => item.commodityNum > 3);
  const noNeedDetail = orderList?.filter((item: any) => item.commodityNum <= 3);
  console.log(
    "%c@@@needDetail===>",
    "color:green;font-size:15px",
    needDetail,
    noNeedDetail
  );
  for (let item of noNeedDetail) {
    const { productDetailList ,createOrderTime} = item;
    for (let productDetail of productDetailList) {
      const {
        orderDetailNo,
        abrade,
        price,
        commodityHashName,
        assertId,
        paintIndex,
        paintSeed,
        fadeNumber,
        commodityTemplateId,
        commodityName,
        isDoppler,
        dopplerName,
        commodityId,
        // 定义一个特殊样式变量
      } = productDetail;
      // 如果不是多普勒，并且uUspecialList中包含commodityHashName
      let specialStyle = "";
      if (
        isDoppler === 0 &&
        uUspecialList?.some((item) => commodityHashName?.includes(item))
      ) {
        // 不是多普勒
        await new Promise((resolve) => setTimeout(resolve, intervalTimeDetail)); // 等待3秒
        //   获取特殊样式
        const res: any = await getUUSpeicalStyle(commodityId, cookie);
        specialStyle = res.Data?.DopplerName || res?.Data?.HardenedName;
      }
    
      if (!isMoreThan3Month(createOrderTime)) {
        uploadData.push({
          commodityName,
          orderId: orderDetailNo,
          platformItemId: commodityTemplateId,
          wear: abrade,
          tradeTime: createOrderTime,
          price: Number(price / 100).toFixed(2), //
          orderType, // 1 买入  2 售出
          platform: "YOUPIN",
          marketHashName: commodityHashName,
          steamId: uuSteamId,
          assertId,
          classId: "",
          instanceId: "",
          paintIndex,
          paintSeed,
          specialStyle: isDoppler === 1 ? dopplerName : specialStyle,
          fade: fadeNumber,
        });
      }
    }
  }
  if (uploadData.length > 0) {
    await uploadDataToServer(
      uploadData,
      page,
      orderType,
      "uu",
      orderList?.length < 20
    );
  }
  for (let item of needDetail) {
    // 需要详情
    const { productDetailList, orderNo, buyerUserId, createOrderTime } = item;
    const detailParams = {
      cookie,
      orderNo,
      buyerUserId,
      productDetailList,
      orderType,
      steamId: uuSteamId,
      uUspecialList,
      createOrderTime
    };
    if (!isMoreThan3Month(createOrderTime)) {
      await new Promise((resolve) => setTimeout(resolve, intervalTimeDetail)); // 等待3秒
      const detailRes = await getUUDetail(detailParams);

      await uploadDataDetail(
        detailRes,
        detailParams,
        page,
        orderType,
        orderList?.length < 20,
        cookie
      );
    }
  }

  // 从item中解构出需要的属性
  if (orderType === 2) {
    flags.uuSell = flags.uuSell + 1;
  } else {
    flags.uuBuy = flags.uuBuy + 1;
  }
  if (
    orderList?.length === 20 &&
    !isMoreThan3Month(orderList?.[orderList.length - 1].createOrderTime)
  ) {
    await new Promise((resolve) => setTimeout(resolve, intervalTimeList)); // 等待5秒
    getRecordPage("uuuser", orderType === 1 ? "buy" : "sell").then(
      (stagePage) => {
        compareIsUpload(
          orderType === 1 ? "uuBuy" : "uuSell",
          orderList[orderList.length - 1].createOrderTime,
      
          page,
          stagePage
        ).then((p) => {
          if (orderType === 2) {
            if (!p) {
              flags.uuSell = 100;
              setUploadComplete("uuSell");
              getUUData(cookie, 1);
            } else {
              getUUSellData(cookie, p + 1);
            }
          }
          if (orderType === 1) {
            if (!p) {
              flags.uuBuy = 100;
              setUploadComplete("uuBuy");
            } else {
              getUUData(cookie, p + 1);
            }
          }
        });
      }
    );
  } else {
    if (orderType === 1) {
      flags.uuBuy = 100;
      setUploadComplete("uuBuy");
    }
    if (orderType === 2) {
      flags.uuSell = 100;
      setUploadComplete("uuSell");
      getUUData(cookie, 1);
    }
  }
};

const uploadDataDetail = async (
  detailData:any,
  param:any,
  page:number,
  orderType:number,
  isEnd:boolean,
  cookie:string
) => {
  const pause = await Pause();
  if (pause) return;
  const { uuSteamId } = await chrome.storage.local.get([`uuSteamId`]);
  const { orderNo, productDetailList, uUspecialList, createOrderTime } = param;
  //
  //   const uploadData = [];
  const { data } = detailData;
  const { userCommodityVOList } = data;
  const list = userCommodityVOList?.[0].commodityVOList;
  const { commodityTemplateId, paintIndex } = productDetailList?.[0];

  // chrome.storage.local.set({
  //   [`UU-detail_${orderNo}_${steamid}`]: userCommodityVOList,
  // });

  console.log("%c@@@===>详情：：", "color:green;font-size:15px", list);
  const detaildata = [];
  let index = 0;

  for (let item of list) {
    const {
      abrade,
      name,
      price,
      commodityHashName,
      commodityId,
      dopplerName,
      isDoppler,
    } = item;

    let specialStyle = "";

    if (
      isDoppler === 0 &&
      uUspecialList?.some((item: any) => commodityHashName?.includes(item))
    ) {
      // 不是多普勒
      await new Promise((resolve) => setTimeout(resolve, intervalTimeDetail)); // 等待3秒
      //   获取特殊样式
      const res: any = await getUUSpeicalStyle(commodityId, cookie);
      specialStyle = res.Data?.DopplerName || res?.Data?.HardenedName;
    }

    if (!isMoreThan3Month(createOrderTime)) {
      const updateOne = {
        orderId: `${orderNo}${index + 1 < 10 ? "0" + (index + 1) : index + 1}`,
        platformItemId: commodityTemplateId,
        wear: abrade,
        tradeTime: createOrderTime,
        price, //
        orderType, // 1 买入  2 售出
        platform: "YOUPIN",
        marketHashName: commodityHashName,
        name,
        steamId: uuSteamId,
        assertId: "",
        classId: "",
        instanceId: "",
        paintIndex,
        paintSeed: "",
        specialStyle: isDoppler === 1 ? dopplerName : specialStyle,
        fade: "", // fadeNumber
      };
      detaildata.push(updateOne);
      index++;
    }
  }
  console.log("%c@@@上传的详情===>", "color:green;font-size:15px", detaildata);
  if (detaildata.length > 0) {
    await uploadDataToServer(detaildata, page, orderType, "uu", isEnd);
  }
};
