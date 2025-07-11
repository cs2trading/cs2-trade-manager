import { complatePercentage } from "./utilsNew"; 
 import {getC5SellData} from './mainReqC5'
 import { getBuffSellData } from "./mainReqBuff";
 import {getUUSellData} from './mainReqUU'
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

  console.log('%c@@@document.cookie===>', 'color:green;font-size:15px', 'servicede', message)
  if (["c5Cookie", "buffCookie", 'uuCookie'].includes(message.type)) {
    chrome.runtime.sendMessage(message);
  }

  if (["collectC5", "collectUU", "collectBuff"].includes(message.type)) {
    getPercent();
  }
  if (message.type === "collectC5") {
    getC5SellData(message.data, 1);
  }
  if (message.type === "collectUU") {
    const cookie = message.data!==true? message.data?.split('=')?.[1] :'';
    getUUSellData(cookie, 1);
  }
  if (message.type === "collectBuff") {
    getBuffSellData(message.data, 1);
  }
});

chrome.alarms.create("myAlarm", {
  delayInMinutes: 1, // 初始延迟
  periodInMinutes: (1 / 60) * 30, // 每隔30 S触发一次
});

function getPercent() {
  let timer = setInterval(() => {
    const percent = complatePercentage();

    chrome.runtime.sendMessage({ type: "percent", data: percent });
    if (percent >= 100) {
      clearInterval(timer);
      timer = null;
    }
  }, 2000);
}




