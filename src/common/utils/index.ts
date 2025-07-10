function generateRandomString() {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export const  generateRandomString2 = (len)=>{
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export const randomString2 = generateRandomString2(24);

// 生成并打印随机字符串
const randomString = generateRandomString();
   
export const getUk = async () => {
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
    Sessionid: randomString2,
  };
  const res = await fetch('https://api.youpin898.com/api/app', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  return json.data.uk;
};
  

