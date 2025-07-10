const init = () => {
  const addIframe = (id: string, pagePath: string) => {
    const contentIframe = document.createElement("iframe");
    contentIframe.id = id;
    // contentIframe.style.cssText = "width: 100%; height: 100%; position: fixed; inset: 0px; margin: 0px auto; z-index: 10000002; border: none;";
    const getContentPage = chrome.runtime.getURL(pagePath);

    // chrome.runtime.sendMessage({ type: "badge", data: document.cookie });
  };
  chrome.runtime.onMessage.addListener(
    async (message, sender, sendResponse) => {

      console.log('%c@@@content-msg===>', 'color:green;font-size:15px', message);
      
      const href = window.location.href;
      if (message.type === "c5" && href.includes("c5game.com")) {
        // 获取cookie
        chrome.runtime.sendMessage({
          type: "c5Cookie",
          data: document.cookie,
          store: localStorage.getItem("store"),
        });
      } else if (message.type === "buff" && href.includes("buff.163.com")) {
        console.log('%c@@@buffCookie===>', 'color:green;font-size:15px', '这里发送了了么,')
        // 获取cookie
        chrome.runtime.sendMessage({
          type: "buffCookie",
          data: document.cookie,
        });
      } else {
        chrome.runtime.sendMessage({ type: "noMatch", data: message.type }); // 空消息 没有命中
      }
    }
  );

  addIframe("content-start-iframe", "contentPage/index.html");
};

// 判断 window.top 和 self 是否相等，如果不相等，则不注入 iframe
if (window.top === window.self) {
  init();
}
