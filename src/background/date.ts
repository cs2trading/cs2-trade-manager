// 生成一个近90天的日历数据 并更新
export const genetate90date = async (type:string) => {
  const nearThreeMonthsDates = gethreeMonthsDay();
  const olderDate = await chrome.storage.local.get([`${type}Date`]); // {20210901:true, 20210902:true, 20210903:true}
  const newDate = compareDate(nearThreeMonthsDates, olderDate[`${type}Date`]);
  await chrome.storage.local.set({ [`${type}Date`]: newDate });
  const newDateArr = Object.keys(olderDate[`${type}Date`] || {});

  if (
    newDateArr.length &&
    newDateArr.every((item) => olderDate[`${type}Date`][item])
  ) {
    // 全部点亮了

    return true;
  }
  return false;
};

export const setUploadComplete = async (type:string) => {
  const { cancelFlag } = await chrome.storage.local.get([`cancelFlag`]);
  if (cancelFlag) {
    console.log(type + "全部日期点亮,因已取消而不设置" )
    return;
  }
  const olderDate = await chrome.storage.local.get([`${type}Date`]);
  const date = olderDate[`${type}Date`];
  const oldDateKeys = Object.keys(date);

  oldDateKeys.forEach((item, index) => {
    if (index !== oldDateKeys.length - 1) {
      date[item] = true;
    }
  });
  console.log(
    "%c@@@setUploadComplete===>",
    "color:green;font-size:15px",
    type + "全部完成"
  );
  await chrome.storage.local.set({ [`${type}Date`]: date });
};

export const updateNear90Date = async (platformType:string, date:number) => {
  // 已经传完的数据 打标识
  const olderDate = await chrome.storage.local.get([`${platformType}Date`]); // 获取已经存的
  const newDateArr = getDatesFromTimestamp(date); // 是一个日期数组
  const oldDateData = olderDate[`${platformType}Date`] || {};
  const olderDateKeys = Object.keys(oldDateData);
  olderDateKeys.forEach((item) => {
    if (newDateArr.includes(item)) {
      oldDateData[item] = true;
    }
  });
  chrome.storage.local.set({ [`${platformType}Date`]: oldDateData });
};

export const isMoreThan3Month = (timestamp:number) => {
  const now = new Date(); // 当前时间
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3); // 设置为3个月前

  // 将目标时间戳转换为 Date 对象进行比较
  const threeMonthsAgoTime = threeMonthsAgo.getTime(); // 3个月前的时间戳 3.30  3.11
  if (String(timestamp).length === 10) {
    timestamp = timestamp * 1000;
  }
  return timestamp <= threeMonthsAgoTime;
};

export const compareIsUpload = async (
  type:string,
  startDate:number,
  page:number,
  stagePage:number
) => {
  // 第一个日期 和第二个日期  如果两个日期都是true 说明已经传过了 则需要跳页

  const stageDate = await chrome.storage.local.get([`${type}Date`]);

  const olderDate = stageDate[`${type}Date`];
  if (!olderDate) {
    // 之前没存  不要管了 直接上传
    return page;
  }
  const startDateStr = timestampToDates(startDate);

  const allDate = Object.keys(olderDate);
  allDate.pop()
  const isAllUpload = allDate.every(
    (item) => olderDate[item]
  );
  if (isAllUpload) {
    return null;
  }
  
  if (olderDate[startDateStr]) {
    // 说明数据已经上传完了的
    return stagePage;
  }
  return page;
};

// 内部函数
function timestampToDates(timestamp:number) {
  if (String(timestamp).length === 10) {
    timestamp = timestamp * 1000;
  }
  const date = new Date(timestamp);
  return formatDate(date);
}
/**
 * 获取从给定时间戳到当前时间的每一天，格式化为 YYYYMMDD 数组
 * @param {number} timestamp - 输入的时间戳（毫秒）
 * @returns {string[]} 日期数组，格式如 ['20250620', '20250619', ...]
 */
function getDatesFromTimestamp(timestamp:number) {
  if (String(timestamp).length !== 13) {
    timestamp = timestamp * 1000;
  }
  let result = [];
  const startDate = new Date(timestamp);
  const today = new Date();

  // 确保时间戳是合法的日期
  if (isNaN(startDate.getTime())) {
    throw new Error("Invalid timestamp");
  }

  let currentDate = new Date(startDate);

  // 格式化日期为 YYYYMMDD
  function formatDate(date:Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  while (currentDate < today) {
    result.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  result.shift();
  result = result.filter((item) => item !== formatDate(new Date()));
  return result;
}
// newDate 数组
// oldDate 对象
function compareDate(newDate:number[]|string[], oldDate:any) {

  const newDateObj:{[key:string]:boolean} = {};
  oldDate = oldDate || {};
  newDate.forEach((item) => {
    newDateObj[item] = oldDate[item] ? true : false;
  });
  return newDateObj;
}

function getLastThreeMonthsDates() {
  const result = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 3);
  // 从 startDate 开始，逐天往后推，直到 today
  let currentDate = new Date(startDate);
  while (currentDate <= today) {
    // 注意：避免引用问题，复制为字符串或新对象
    result.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

function formatDate(date:Date) {

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function gethreeMonthsDay() {
  const dateArray = getLastThreeMonthsDates();
  const formattedDates = dateArray.map(formatDate);
  return formattedDates;
}
