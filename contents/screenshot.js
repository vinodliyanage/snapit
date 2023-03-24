(() => {
  document.addEventListener("click", async (event) => {
    if (!event.ctrlKey) return;

    const clickedElement = document.elementFromPoint(
      event.clientX,
      event.clientY
    );

    const postElement = findPost(clickedElement);
    if (!postElement) return;

    const postId = postElement.id;

    const { backgroundColor, color, fontFamily, display, fontSize } =
      window.getComputedStyle(postElement);

    postElement.style.backgroundColor = backgroundColor;
    postElement.style.color = color;
    postElement.style.fontFamily = fontFamily;
    postElement.style.display = display;
    postElement.style.fontSize = fontSize;

    await Promise.race([imgToB64(postElement), timeout(5)]);

    const canvas = await html2canvas(postElement, {
      scale: 1,
      onclone: async (_document) => {
        const post = _document.querySelector(`#${postId}`);
        if (post) post.style.border = 0;
      },
    });
    canvas.toBlob((blob) => blobCallback(blob, postElement));
  });

  function findPost(element) {
    const idRegex = /^p+\d{1,}$/i;

    while (
      !idRegex.test(element?.id || "") ||
      !element.classList.contains("post") ||
      !element.classList.contains("reply")
    ) {
      const parentElement = element.parentElement;
      if (!parentElement) return null;
      element = parentElement;
    }

    return element;
  }

  async function imgToB64(postElement) {
    try {
      const img = postElement.querySelector("img");
      if (!img) return null;

      const port = chrome.runtime.connect({ name: "converter" });
      port.postMessage({ src: img.src });

      const b64 = await new Promise((resolve) =>
        port.onMessage.addListener(({ b64 }) => resolve(b64))
      );
      if (!b64) return null;

      img.src = b64;
      return new Promise((resolve) => (img.onload = () => resolve(true)));
    } catch (e) {
      return null;
    }
  }

  function blobCallback(blob, postElement) {
    navigator.clipboard
      .write([new ClipboardItem({ "image/png": blob })])
      .then(() => setNotification(postElement))
      .catch(() => setNotification(postElement, true));
  }

  function setNotification(postElement, failed = false) {
    const message = failed ? "Capture Failed!" : "Capture Complete!";

    const span = document.createElement("span");
    span.textContent = message;

    const spanStyle = `
    border-radius: 50px;
    background: ${
      failed
        ? "rgb(220 38 38)"
        : "linear-gradient(to bottom right, #9333ea, #3b82f6)"
    };
    box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
    bottom: 10px;
    color: #fff;
    display: block;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 14px;
    font-weight: 600;
    padding: 5px 10px;
    position: absolute;
    right: 10px;
    text-transform: capitalize;
    z-index: 999999;`;

    span.setAttribute("style", spanStyle);

    postElement.style.position = "relative";
    postElement.appendChild(span);

    const timeout = setTimeout(() => {
      postElement.style.position = "unset";
      span.remove();
      clearTimeout(timeout);
    }, 2000);
  }

  function timeout(timeLimit) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        resolve(null);
      }, timeLimit * 1000);
    });
  }
})();
