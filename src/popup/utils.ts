import pkg from "./../../package.json";
const BASE_URL = "https://api.66stea.com";

function generateRandomString() {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
function generateRandomString2(len:number) {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const genSessionId = generateRandomString2(24);

// 生成并打印随机字符串
const randomString = generateRandomString();

const getUk = async () => {
  const data = {
    appVersion: "5.28.2",
    data: {
      manu: "HUAWEI",
      brand: "HUAWEI",
      mod: 1718369655000,
      cpucnt: 4,
      abi: "arm64-v8a",
      abi2: "x86_64",
      cpuinfos:
        "Processor\t: ARMv8 processor rev 1 (aarch64)\nprocessor\t: 0\nBogoMIPS\t: 24.00\nFeatures\t: fp asimd aes pmull sha1 sha2 crc32 atomics\nCPU implementer\t: 0x4e\nCPU architecture: 8\nCPU variant\t: 0x02\nCPU part\t: 0x000\nCPU revision\t: 1\n\nprocessor\t: 1\nBogoMIPS\t: 24.00\nFeatures\t: fp asimd aes pmull sha1 sha2 crc32 atomics\nCPU implementer\t: 0x4e\nCPU architecture: 8\nCPU variant\t: 0x02\nCPU part\t: 0x000\nCPU revision\t: 1\n\nprocessor\t: 2\nBogoMIPS\t: 24.00\nFeatures\t: fp asimd aes pmull sha1 sha2 crc32 atomics\nCPU implementer\t: 0x4e\nCPU architecture: 8\nCPU variant\t: 0x02\nCPU part\t: 0x000\nCPU revision\t: 1\n\nprocessor\t: 3\nBogoMIPS\t: 24.00\nFeatures\t: fp asimd aes pmull sha1 sha2 crc32 atomics\nCPU implementer\t: 0x4e\nCPU architecture: 8\nCPU variant\t: 0x02\nCPU part\t: 0x000\nCPU revision\t: 1\n\nHardware\t: placeholder",
      cpumax: "3200000",
      mems: 536870912,
      fmem: 479239008,
      fd: 126139039744,
      ds: 134208294912,
      scr: "1080*1920",
      dpi: 480,
      type: "Phone",
      os: "Android",
      osvn: "12",
      osvc: 32,
      osb: "V417IR",
      tz: "Asia/Shanghai",
      loc: "CN",
      lang: "zh",
      fp: "OnePlus/OnePlus8Pro/OnePlus8Pro:12/V417IR/2406142054:user/release-keys",
      bootT: 1738912442819,
      font: 1,
      pkg: "com.uu898.uuhavequality",
      lvc: 0,
      vc: 2025012411,
      vn: "5.28.2",
      dn: "com.uu898.uuhavequality.app.App",
      it: 1738910936755,
      ut: 1738910936755,
      u: false,
      sn: "-998, Attempt to invoke virtual method 'android.content.pm.Signature[] android.content.pm.SigningInfo.getApkContentsSigners()' on a null object reference",
      len: 78245620,
      aid: randomString,
      fs: "/data/user/0/com.uu898.uuhavequality/files",
      imeis: "-999",
      phone: "-999",
      mac: "",
      bt: true,
      mob: true,
      av: true,
      con: true,
      r: false,
    },
    src: "android",
    time: 1738912472578,
    uid: "4996d030-f656-4881-8ee3-74fd50cfa6b0",
    uk: "",
    userId: 0,
    version: "v1.0.0",
    Sessionid: genSessionId,
  };
  const res = await fetch("https://api.youpin898.com/api/app", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return json.data.uk;
};

let ukCode = "";

const getUKData = async () => {
  if(ukCode) return
  const uk = await getUk();
  ukCode = uk;
 
};
getUKData();

export const getNotice = async () => {
  // BASE_URL
  const data = await fetch(`${BASE_URL}/steam/plugin/v1/notice`);
  // /steam/plugin/v1/notice
  return await data.json();
};

export const getC5Data = async (cookie:string, errorCb:(type:string)=>void) => {

  try {
    const params = new URLSearchParams({
      page: '1',
      limit: '10',
      appId: '730',
      status: '3',
      type: "",
      keyword: "",
    });

    // 购买记录
    const response = await fetch(
      `https://www.c5game.com/napi/trade/search/v2/purchase/orders/list?${params}`,
      {
        method: "GET",
        // @ts-ignore
        headers: {
          device: 1,
          platform: 2,
          Access_token: cookie,
        },
      }
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const allData = await response.json();
    const { errorCode } = allData;
    if (errorCode === 101) {
      errorCb("c5");
      return false
    }
    return true
  } catch (error) {
   
      console.log("错误");
        return false
  }
};

export const getBuffData = async (cookie:string, errorCb:(type:string)=>void) => {
  const params = new URLSearchParams({
    page_num: "1",
    page_size: "24",
    state: "success",
    game: "csgo",
    appid: "730",
  });

  try {
    const response = await fetch(
      `https://buff.163.com/api/market/buy_order/history?${params}`,
      {
        method: "GET",
        headers: {
          cookie: cookie,
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const allData = await response.json();
    const {code} = allData;
    if(code === 'Login Required'){
        errorCb("buff");
        return false
    }
  return true
    
  } catch (error) {
    
    console.log("错误");
    errorCb("buff");
    return false
  }
};

export const getUUData = async (cookie:string, errorCb:(type:string)=>void) => {

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
  try {
    // 请求接口  购买记录
    const res = await fetch(
      "https://api.youpin898.com/api/youpin/bff/trade/sale/v1/buy/list",
      {
        method: "POST",
        // @ts-ignore
        headers: headers,
        body: JSON.stringify({
          keys: "",
          orderStatus: 340, // 订单已完成
          pageIndex: 1,
          pageSize: 20,
          presenterId: 0,
          sceneType: 0,
          Sessionid: genSessionId,
        }),
      }
    );
    const data = await res.json();
    console.log('UU=data', data)
    if(data.code === 84101){
      errorCb("uu");
      return false
    }
    return true
  } catch (error) {
    
      console.log("错误");
    errorCb("uu");
    return false
  }
};

export const checkVersion = async () => {
  const res = await fetch(`${BASE_URL}/steam/plugin/v1/version`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "plugin-version": pkg.version,
    },
  });
  const data = await res.json();
  if(data?.data?.showVersion){
    return data.data
  }else{
    return false
  }
 
};
