(function () {
  const script = document.currentScript;
  const globalConfig = window.TecnoriaChatWidgetConfig || {};
  const siteKey = globalConfig.siteKey || script?.dataset.siteKey;
  const apiBase = globalConfig.apiBase || script?.dataset.apiBase;
  const configuredBaseUrl =
    globalConfig.widgetBaseUrl
    || globalConfig.widgetOrigin
    || script?.dataset.widgetBaseUrl
    || script?.dataset.widgetOrigin
    || script?.src
    || window.location.href;

  const widgetBaseUrl = normalizeBaseUrl(configuredBaseUrl);
  const frameOrigin = new URL(widgetBaseUrl).origin;

  if (!siteKey || !apiBase) {
    console.error("Tecnoria chat widget requires siteKey and apiBase.");
    return;
  }

  const iframe = document.createElement("iframe");
  const frameUrl = new URL("frame.html", widgetBaseUrl);
  frameUrl.searchParams.set("siteKey", siteKey);
  frameUrl.searchParams.set("apiBase", apiBase);
  frameUrl.searchParams.set("origin", window.location.origin);

  iframe.src = frameUrl.toString();
  iframe.title = "Tecnoria Chat Widget";
  iframe.setAttribute("aria-label", "Tecnoria Chat Widget");
  iframe.style.position = "fixed";
  iframe.style.bottom = "20px";
  iframe.style.right = "20px";
  iframe.style.width = "92px";
  iframe.style.height = "92px";
  iframe.style.border = "0";
  iframe.style.borderRadius = "24px";
  iframe.style.zIndex = "999999";
  iframe.style.background = "transparent";
  iframe.style.boxShadow = "0 18px 45px rgba(0,0,0,0.22)";
  iframe.allow = "clipboard-write";

  const updateSize = (expanded) => {
    iframe.style.width = expanded ? "min(420px, calc(100vw - 24px))" : "92px";
    iframe.style.height = expanded ? "min(680px, calc(100vh - 24px))" : "92px";
    iframe.style.borderRadius = expanded ? "28px" : "24px";
  };

  window.addEventListener("message", (event) => {
    if (event.origin !== frameOrigin || !event.data || event.data.type !== "tecnoria-chat:toggle") {
      return;
    }
    updateSize(Boolean(event.data.expanded));
  });

  document.body.appendChild(iframe);

  function normalizeBaseUrl(value) {
    const url = new URL(value, window.location.href);
    url.hash = "";
    url.search = "";
    if (!url.pathname.endsWith("/")) {
      url.pathname = `${url.pathname}/`;
    }
    return url.toString();
  }
})();
