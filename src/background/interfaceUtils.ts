
export const Pause = async () => {
  const { cancelFlag } = await chrome.storage.local.get([`cancelFlag`]);
  if (cancelFlag) {
    return true;
  }
  return false;
};

