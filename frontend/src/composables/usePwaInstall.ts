import { ref } from "vue";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const canInstall = ref(false);

let listenersRegistered = false;

export function usePwaInstall() {
  if (typeof window !== "undefined" && !listenersRegistered) {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt.value = e as BeforeInstallPromptEvent;
      canInstall.value = true;
    });

    window.addEventListener("appinstalled", () => {
      deferredPrompt.value = null;
      canInstall.value = false;
    });

    listenersRegistered = true;
  }

  async function installApp() {
    const prompt = deferredPrompt.value;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      deferredPrompt.value = null;
      canInstall.value = false;
    }
  }

  return { canInstall, installApp };
}
