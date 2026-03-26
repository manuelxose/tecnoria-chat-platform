(function () {
  const runtimeKey = "__talkarisWidgetRuntime";
  if (window[runtimeKey]?.destroy) {
    window[runtimeKey].destroy();
  }

  const script = document.currentScript;
  const globalConfig = window.TalkarisWidgetConfig || {};
  const siteKey = globalConfig.siteKey || script?.dataset.siteKey;
  const apiBase = globalConfig.apiBase || script?.dataset.apiBase;
  const entryContext = globalConfig.entryContext || script?.dataset.entryContext;
  const brandLabel = globalConfig.brandLabel || script?.dataset.brandLabel;
  const sourceSite = globalConfig.sourceSite || script?.dataset.sourceSite;
  const contactUrl = globalConfig.contactUrl || script?.dataset.contactUrl;
  const assetVersion = globalConfig.assetVersion || script?.dataset.assetVersion;
  const configuredBaseUrl =
    globalConfig.widgetBaseUrl
    || script?.dataset.widgetBaseUrl
    || script?.src
    || window.location.href;

  const widgetBaseUrl = normalizeBaseUrl(configuredBaseUrl);
  const widgetOrigin = new URL(widgetBaseUrl).origin;
  if (!siteKey || !apiBase) {
    console.error("Talkaris widget requires siteKey and apiBase.");
    return;
  }

  const iframe = document.createElement("iframe");
  document.querySelectorAll('iframe[data-talkaris-widget-frame="true"], iframe[title="Talkaris Widget"], iframe[aria-label="Talkaris Widget"]').forEach((node) => {
    node.remove();
  });
  const frameUrl = new URL("frame.html", widgetBaseUrl);
  frameUrl.searchParams.set("siteKey", siteKey);
  frameUrl.searchParams.set("apiBase", apiBase);
  frameUrl.searchParams.set("origin", window.location.origin);
  if (entryContext) {
    frameUrl.searchParams.set("entryContext", entryContext);
  }
  if (brandLabel) {
    frameUrl.searchParams.set("brandLabel", brandLabel);
  }
  if (sourceSite) {
    frameUrl.searchParams.set("sourceSite", sourceSite);
  }
  if (contactUrl) {
    frameUrl.searchParams.set("contactUrl", contactUrl);
  }
  if (assetVersion) {
    frameUrl.searchParams.set("v", assetVersion);
  }

  iframe.src = frameUrl.toString();
  iframe.title = "Talkaris Widget";
  iframe.setAttribute("aria-label", "Talkaris Widget");
  iframe.style.position = "fixed";
  iframe.style.bottom = "20px";
  iframe.style.right = "20px";
  let collapsedWidth = "252px";
  let collapsedHeight = "96px";
  iframe.style.width = collapsedWidth;
  iframe.style.height = collapsedHeight;
  iframe.style.border = "0";
  iframe.style.borderRadius = "34px";
  iframe.style.zIndex = "999999";
  iframe.style.background = "transparent";
  iframe.style.boxShadow = "none";
  iframe.style.overflow = "hidden";
  iframe.style.display = "block";
  iframe.allow = "clipboard-write";
  iframe.dataset.talkarisWidgetFrame = "true";
  let expanded = false;

  const parsePixels = (value, fallback) => {
    const next = Number.parseFloat(String(value || ""));
    return Number.isFinite(next) ? next : fallback;
  };

  const applyFrameLayout = () => {
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const runtimeInset = isMobile ? 6 : 20;
    const availableWidth = Math.max(240, window.innerWidth - (runtimeInset * 2));
    const availableHeight = Math.max(180, window.innerHeight - (runtimeInset * 2));

    iframe.style.right = `${runtimeInset}px`;
    iframe.style.bottom = `${runtimeInset}px`;

    if (expanded) {
      const width = isMobile
        ? availableWidth
        : Math.min(430, availableWidth);
      const height = isMobile
        ? Math.min(Math.round(window.innerHeight * 0.82), availableHeight)
        : Math.min(760, availableHeight);
      iframe.style.width = `${width}px`;
      iframe.style.height = `${height}px`;
      iframe.style.borderRadius = isMobile ? "26px" : "30px";
      iframe.style.boxShadow = "0 22px 52px rgba(0,0,0,0.24)";
      return;
    }

    const nextCollapsedWidth = Math.min(parsePixels(collapsedWidth, 252), availableWidth);
    const nextCollapsedHeight = Math.min(parsePixels(collapsedHeight, 96), availableHeight);
    iframe.style.width = `${nextCollapsedWidth}px`;
    iframe.style.height = `${nextCollapsedHeight}px`;
    iframe.style.borderRadius = isMobile ? "28px" : "34px";
    iframe.style.boxShadow = "none";
  };

  const onMessage = (event) => {
    if (!event.data || typeof event.data.type !== "string") {
      return;
    }

    const knownMessage =
      event.data.type === "talkaris-chat:launcher"
      || event.data.type === "talkaris-chat:toggle";

    if (!knownMessage) {
      return;
    }

    const sameFrame = event.source === iframe.contentWindow;
    const sameWidgetOrigin = !event.origin || event.origin === "null" || event.origin === widgetOrigin;

    if (!sameFrame && !sameWidgetOrigin) {
      return;
    }

    if (event.data.type === "talkaris-chat:launcher") {
      collapsedWidth = typeof event.data.width === "string" ? event.data.width : collapsedWidth;
      collapsedHeight = typeof event.data.height === "string" ? event.data.height : collapsedHeight;
      applyFrameLayout();
      return;
    }

    if (event.data.type === "talkaris-chat:toggle") {
      expanded = Boolean(event.data.expanded);
      applyFrameLayout();
    }
  };

  window.addEventListener("message", onMessage);
  window.addEventListener("resize", applyFrameLayout);

  document.body.appendChild(iframe);
  applyFrameLayout();
  window[runtimeKey] = {
    destroy() {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("resize", applyFrameLayout);
      iframe.remove();
      if (window[runtimeKey] && window[runtimeKey].destroy === this.destroy) {
        delete window[runtimeKey];
      }
    },
  };

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
