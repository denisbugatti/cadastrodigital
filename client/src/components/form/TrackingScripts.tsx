/**
 * TrackingScripts — Injects tracking/analytics scripts into the page head
 * Supports: Google Tag Manager, Google Analytics (GA4), Facebook Pixel, TikTok Pixel
 * Scripts are injected once on mount and cleaned up on unmount.
 */

import { useEffect } from "react";

interface TrackingConfig {
  gtm?: { enabled: boolean; containerId: string };
  googleAnalytics?: { enabled: boolean; measurementId: string };
  facebookPixel?: { enabled: boolean; pixelId: string };
  tiktokPixel?: { enabled: boolean; pixelId: string };
}

interface TrackingScriptsProps {
  tracking?: TrackingConfig;
}

export function TrackingScripts({ tracking }: TrackingScriptsProps) {
  // Google Tag Manager
  useEffect(() => {
    if (!tracking?.gtm?.enabled || !tracking.gtm.containerId) return;
    const id = tracking.gtm.containerId.trim();
    if (!id || document.querySelector(`script[data-tracking="gtm"]`)) return;

    // GTM inline script
    const script = document.createElement("script");
    script.setAttribute("data-tracking", "gtm");
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${id}');
    `;
    document.head.appendChild(script);

    // GTM noscript iframe
    const noscript = document.createElement("noscript");
    noscript.setAttribute("data-tracking", "gtm-noscript");
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${id}`;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);

    return () => {
      document.querySelector(`script[data-tracking="gtm"]`)?.remove();
      document.querySelector(`noscript[data-tracking="gtm-noscript"]`)?.remove();
    };
  }, [tracking?.gtm?.enabled, tracking?.gtm?.containerId]);

  // Google Analytics (GA4)
  useEffect(() => {
    if (!tracking?.googleAnalytics?.enabled || !tracking.googleAnalytics.measurementId) return;
    const id = tracking.googleAnalytics.measurementId.trim();
    if (!id || document.querySelector(`script[data-tracking="ga4"]`)) return;

    // GA4 external script
    const extScript = document.createElement("script");
    extScript.setAttribute("data-tracking", "ga4");
    extScript.async = true;
    extScript.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(extScript);

    // GA4 inline config
    const inlineScript = document.createElement("script");
    inlineScript.setAttribute("data-tracking", "ga4-config");
    inlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${id}');
    `;
    document.head.appendChild(inlineScript);

    return () => {
      document.querySelector(`script[data-tracking="ga4"]`)?.remove();
      document.querySelector(`script[data-tracking="ga4-config"]`)?.remove();
    };
  }, [tracking?.googleAnalytics?.enabled, tracking?.googleAnalytics?.measurementId]);

  // Facebook Pixel
  useEffect(() => {
    if (!tracking?.facebookPixel?.enabled || !tracking.facebookPixel.pixelId) return;
    const id = tracking.facebookPixel.pixelId.trim();
    if (!id || document.querySelector(`script[data-tracking="fbpixel"]`)) return;

    const script = document.createElement("script");
    script.setAttribute("data-tracking", "fbpixel");
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${id}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    // FB Pixel noscript fallback
    const noscript = document.createElement("noscript");
    noscript.setAttribute("data-tracking", "fbpixel-noscript");
    const img = document.createElement("img");
    img.height = 1;
    img.width = 1;
    img.style.display = "none";
    img.src = `https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    return () => {
      document.querySelector(`script[data-tracking="fbpixel"]`)?.remove();
      document.querySelector(`noscript[data-tracking="fbpixel-noscript"]`)?.remove();
    };
  }, [tracking?.facebookPixel?.enabled, tracking?.facebookPixel?.pixelId]);

  // TikTok Pixel
  useEffect(() => {
    if (!tracking?.tiktokPixel?.enabled || !tracking.tiktokPixel.pixelId) return;
    const id = tracking.tiktokPixel.pixelId.trim();
    if (!id || document.querySelector(`script[data-tracking="tiktok"]`)) return;

    const script = document.createElement("script");
    script.setAttribute("data-tracking", "tiktok");
    script.innerHTML = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var i=document.createElement("script");i.type="text/javascript",i.async=!0,i.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(i,a)};
        ttq.load('${id}');
        ttq.page();
      }(window, document, 'ttq');
    `;
    document.head.appendChild(script);

    return () => {
      document.querySelector(`script[data-tracking="tiktok"]`)?.remove();
    };
  }, [tracking?.tiktokPixel?.enabled, tracking?.tiktokPixel?.pixelId]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Helper to fire conversion events from form completion.
 * Call this when a form is submitted successfully.
 */
export function fireTrackingConversion(tracking?: TrackingConfig, formTitle?: string) {
  if (!tracking) return;

  try {
    // GA4 event
    if (tracking.googleAnalytics?.enabled && (window as any).gtag) {
      (window as any).gtag("event", "form_submission", {
        event_category: "form",
        event_label: formTitle || "form",
      });
    }

    // GTM dataLayer push
    if (tracking.gtm?.enabled && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "form_submission",
        formTitle: formTitle || "form",
      });
    }

    // Facebook Pixel
    if (tracking.facebookPixel?.enabled && (window as any).fbq) {
      (window as any).fbq("track", "Lead", {
        content_name: formTitle || "form",
      });
    }

    // TikTok Pixel
    if (tracking.tiktokPixel?.enabled && (window as any).ttq) {
      (window as any).ttq.track("SubmitForm", {
        content_name: formTitle || "form",
      });
    }
  } catch {
    // Silently fail — tracking should never break the form
  }
}
