
import {
  genetate90date,
  compareIsUpload,
  isMoreThan3Month,
  setUploadComplete,
} from "./date.ts";
import { flags, getRecordPage } from "./utilsNew.ts";
import { Pause } from "./interfaceUtils.ts";
import {
  uploadDataToServer,
  getBuffSellApi,
  getBuffApi,
  getBuffDetailApi,
  getBuffDetailList,
} from "./commonApi.ts";
const intervalTimeList = 5000; // 列表5S
const intervalTimeDetail = 3000; // 详情3S

export const getBuffSellData = async (cookie:string, page:number) => {
  const pause = await Pause();
  if (pause) return;
  if (page === 1) {
    flags.buffSell = 0;
    const isUpload = await genetate90date("buffSell");
    if (isUpload) {
      flags.buffSell = 100; // 标记完成
      getBuffData(cookie, 1);
      return;
    }
  }

    const allData = await getBuffSellApi(cookie, page);
    await formatBuffData(allData, page, 2, cookie);

};

export const getBuffData = async (cookie:string, page:number) => {

  const pause = await Pause();
  if (pause) return;
  if (page === 1) {
    flags.buffBuy = 0;
    const isUpload = await genetate90date("buffBuy");
    if (isUpload) {
      flags.buffBuy = 100; // 标记完成
      return;
    }
  }

    const allData = await getBuffApi(cookie, page);
    await formatBuffData(allData, page, 1, cookie);

};


const formatBuffData = async (allData:any, page:number, orderType:number, cookie:string) => {
  const pause = await Pause();
  if (pause) return;
  // 从allData中解构出data
  console.log('%c@@@platform: "BUFF"===>', "color:red;font-size:15px", allData);
  const { data } = allData;
  const { items, goods_infos } = data;
  if (!items?.length) {
    if (orderType === 2) {
      flags.buffSell = 100; // 标记完成
      setUploadComplete("buffSell");
      getBuffData(cookie, 1);
    } else {
      flags.buffBuy = 100; // 标记完成
      setUploadComplete("buffBuy");
    }

    return;
  }
  if (orderType === 2) {
    flags.buffSell = flags.buffSell + 1;
  } else {
    flags.buffBuy = flags.buffBuy + 1;
  }

  // 调试
  // chrome.storage.local.set({ [`BUFF_${orderType}_Page_${page}`]: items });
  const validItems =
    orderType === 1
      ? items
          .filter((item:any) => item.buyer_steamid)
          .filter((item:any) => !isMoreThan3Month(item.created_at))
      : items
          .filter((item:any) => item.seller_steamid)
          .filter((item:any) => !isMoreThan3Month(item.created_at)); // 如果列表中seller_steamid字段不存在，丢弃该条数据
  // console.log('%c@@@validItems===>', 'color:green;font-size:15px', validItems)

  const noNeedDetail = validItems?.filter(
    (item:any) => Number(item?.asset_count || "0") <= 4
  );
  const needDetail = validItems?.filter(
    (item:any) => Number(item?.asset_count || "0") > 4
  );
  // console.log('%c@@@detailList===>', 'color:green;font-size:15px', page, noNeedDetail, needDetail)
  // 整理list数据
  const uploadData:any[] = [];
  noNeedDetail?.forEach((item:any) => {
    const {
      id,
      asset_info,
      created_at,
      goods_id,
      buyer_steamid,
      seller_steamid,
   
      price,
    } = item;
    if (!isMoreThan3Month(created_at)) {
      uploadData.push({
        orderId: id,
        platformItemId: goods_id,
        wear: asset_info?.paintwear,
        tradeTime: created_at,
        price: price, //
        orderType, // 1 买入  2 售出
        platform: "BUFF",
        marketHashName: goods_infos[goods_id].market_hash_name,
        steamId: orderType === 1 ? buyer_steamid : seller_steamid,
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

  // console.log('BUFF ', orderType, page, uploadData);

  if (uploadData?.length) {
    await uploadDataToServer(
      uploadData,
      page,
      orderType,
      "buff",
      items?.length < 24
    );
  }
  for (let item of needDetail) {
   
    await new Promise((resolve) => setTimeout(resolve, intervalTimeDetail)); // 等待3秒
    const detailData:any = await getBuffDetailApi(item.id, orderType, cookie);

    if (!detailData) return;

    const { data } = detailData;
    let detailReqBuff:any[] = [];
    data?.items.forEach((detailItem:any) => {
      detailReqBuff.push({
        id: detailItem.sell_order_id,
        cookie,
        orderType,
        steamid:
          orderType === 1
            ? detailItem.buyer_steamid
            : detailItem.seller_steamid,
      });
    });
    for (let detailItem of detailReqBuff) {
      await new Promise((resolve) => setTimeout(resolve, intervalTimeDetail)); // 等待3秒
      const detailList:any = await getBuffDetailList(detailItem);

      const collectDetailDataBuff:any[] = [];
      if (!detailList) return;
      if (!Array.isArray(detailList)) {
        const { id, orderType, steamid } = detailItem;

        const {
          items,
          goods_infos,
         
          created_at
          
        } = detailList?.data;
        items.forEach((item:any) => {
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
              marketHashName:
                goods_infos[asset_info?.goods_id].market_hash_name,
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
      } await uploadDataToServer(
        Array.isArray(detailList) ? detailList : collectDetailDataBuff,
        page,
        orderType,
        "buff",
        items?.length < 24
      );
    }
  }

  if (
    items?.length === 24 &&
    !isMoreThan3Month(items?.[items?.length - 1].created_at)
  ) {
    await new Promise((resolve) => setTimeout(resolve, intervalTimeList)); // 等待5秒
    getRecordPage("buffuser", orderType === 2 ? "sell" : "buy").then(
      (stagePage) => {
        compareIsUpload(
          orderType === 2 ? "buffSell" : "buffBuy",
          items[items?.length - 1].created_at,
        
          page,
          stagePage
        ).then((p) => {
          if (orderType === 2) {
            if (!p) {
              setUploadComplete("buffSell");
              flags.buffSell = 100;
              getBuffData(cookie, 1);
            } else {
              getBuffSellData(cookie, p + 1);
            }
          } else {
            if (p) {
              getBuffData(cookie, p + 1);
            } else {
              flags.buffBuy = 100;
              setUploadComplete("buffBuy");
            }
          }
        });
      }
    );
  } else {
    if (orderType === 2) {
      flags.buffSell = 100;
      setUploadComplete("buffSell");
      getBuffData(cookie, 1);
    } else {
      flags.buffBuy = 100;
      setUploadComplete("buffBuy");
    }
  }
};
