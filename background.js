chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (request) => {
    const b64 = await getBase64FromUrl(request.src);
    port.postMessage({ b64 });
  });
});

async function getBase64FromUrl(url) {
  const data = await fetch(url);
  const blob = await data.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result;
      resolve(base64data);
    };
  });
}
