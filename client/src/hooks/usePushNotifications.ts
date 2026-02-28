import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

type PushPermission = "default" | "granted" | "denied" | "unsupported";

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const subscribeMutation = trpc.push.subscribe.useMutation();
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation();
  const statusQuery = trpc.push.status.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const vapidQuery = trpc.push.vapidPublicKey.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Check if push is supported
  const isSupported = typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;

  // Check current permission and subscription status
  useEffect(() => {
    if (!isSupported) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermission);
  }, [isSupported]);

  // Sync subscription status from server
  useEffect(() => {
    if (statusQuery.data) {
      setIsSubscribed(statusQuery.data.hasActiveSubscription);
    }
  }, [statusQuery.data]);

  // Convert VAPID key from base64 URL to Uint8Array
  const urlBase64ToUint8Array = useCallback((base64String: string): Uint8Array => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported || !vapidQuery.data?.key) return false;

    setIsLoading(true);
    try {
      // Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result as PushPermission);

      if (result !== "granted") {
        setIsLoading(false);
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      // Create new subscription if none exists
      if (!subscription) {
        const appServerKey = urlBase64ToUint8Array(vapidQuery.data.key);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey.buffer as ArrayBuffer,
        });
      }

      // Send subscription to server
      const keys = subscription.toJSON().keys;
      if (keys?.p256dh && keys?.auth) {
        await subscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        });
        setIsSubscribed(true);
        statusQuery.refetch();
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (err) {
      console.error("[Push] Subscribe error:", err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, vapidQuery.data, subscribeMutation, statusQuery, urlBase64ToUint8Array]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!isSupported) return false;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Remove from server
        await unsubscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
        });
      }

      setIsSubscribed(false);
      statusQuery.refetch();
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("[Push] Unsubscribe error:", err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, unsubscribeMutation, statusQuery]);

  // Toggle subscription
  const toggle = useCallback(async () => {
    if (isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe();
    }
  }, [isSubscribed, subscribe, unsubscribe]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    toggle,
    subscriptionCount: statusQuery.data?.subscriptionCount ?? 0,
  };
}
