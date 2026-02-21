import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp } from "lucide-react";
import { getSessionId } from "@/lib/utils";

interface ConsentChoices {
  zorunlu: boolean;
  analitik: boolean;
  pazarlama: boolean;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consentChoices, setConsentChoices] = useState<ConsentChoices>({
    zorunlu: true,
    analitik: false,
    pazarlama: false,
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem("kvkk_consent");
    if (!savedConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = async () => {
    const sessionId = getSessionId();
    const choices: ConsentChoices = {
      zorunlu: true,
      analitik: true,
      pazarlama: true,
    };

    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          consentType: "cookie_preferences",
          granted: true,
          ipAddress: null,
          userAgent: navigator.userAgent,
          policyVersion: "1.0",
        }),
      });

      localStorage.setItem("kvkk_consent", JSON.stringify(choices));
      setShowBanner(false);
    } catch (error) {
      console.error("Failed to save consent:", error);
    }
  };

  const handleAcceptNecessary = async () => {
    const sessionId = getSessionId();
    const choices: ConsentChoices = {
      zorunlu: true,
      analitik: false,
      pazarlama: false,
    };

    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          consentType: "cookie_preferences",
          granted: true,
          ipAddress: null,
          userAgent: navigator.userAgent,
          policyVersion: "1.0",
        }),
      });

      localStorage.setItem("kvkk_consent", JSON.stringify(choices));
      setShowBanner(false);
    } catch (error) {
      console.error("Failed to save consent:", error);
    }
  };

  const handleApplySettings = async () => {
    const sessionId = getSessionId();

    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          consentType: "cookie_preferences",
          granted: true,
          ipAddress: null,
          userAgent: navigator.userAgent,
          policyVersion: "1.0",
        }),
      });

      localStorage.setItem("kvkk_consent", JSON.stringify(consentChoices));
      setShowBanner(false);
      setShowSettings(false);
    } catch (error) {
      console.error("Failed to save consent:", error);
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div
      data-testid="cookie-banner-container"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-[#333] p-6"
    >
      {!showSettings ? (
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-white font-semibold text-lg mb-2" data-testid="banner-title">
                Çerezler Hakkında
              </h2>
              <p className="text-gray-300 text-sm" data-testid="banner-description">
                Web sitesini kullanma deneyiminizi iyileştirmek için çerezleri kullanıyoruz.{" "}
                <a href="/sayfa/cerez-politikasi" className="text-[#00ff41] hover:underline" data-testid="policy-link">
                  Çerez politikamız
                </a>{" "}
                hakkında daha fazla bilgi.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-6">
            <Button
              onClick={handleAcceptAll}
              className="bg-[#00ff41] hover:bg-[#00e63b] text-black font-semibold rounded-md"
              data-testid="button-accept-all"
            >
              Tümünü Kabul Et
            </Button>
            <Button
              onClick={handleAcceptNecessary}
              variant="outline"
              className="border-[#333] text-white hover:bg-[#222]"
              data-testid="button-accept-necessary"
            >
              Sadece Zorunlu
            </Button>
            <Button
              onClick={() => setShowSettings(true)}
              variant="ghost"
              className="text-[#00ff41] hover:text-[#00e63b]"
              data-testid="button-settings"
            >
              Ayarlar
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-lg" data-testid="settings-title">
              Çerez Ayarları
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-white"
              aria-label="Kapat"
              data-testid="button-close-settings"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3" data-testid="checkbox-zorunlu">
              <Checkbox
                id="zorunlu"
                checked={consentChoices.zorunlu}
                disabled
                className="cursor-not-allowed"
              />
              <label htmlFor="zorunlu" className="text-white font-medium cursor-not-allowed">
                Zorunlu Çerezler
              </label>
              <span className="text-gray-400 text-sm">(Her zaman aktif)</span>
            </div>

            <div className="flex items-center gap-3" data-testid="checkbox-analitik">
              <Checkbox
                id="analitik"
                checked={consentChoices.analitik}
                onCheckedChange={(checked) =>
                  setConsentChoices({ ...consentChoices, analitik: checked as boolean })
                }
              />
              <label htmlFor="analitik" className="text-white font-medium cursor-pointer">
                Analitik Çerezler
              </label>
              <span className="text-gray-400 text-sm">(İstatistik ve iyileştirme için)</span>
            </div>

            <div className="flex items-center gap-3" data-testid="checkbox-pazarlama">
              <Checkbox
                id="pazarlama"
                checked={consentChoices.pazarlama}
                onCheckedChange={(checked) =>
                  setConsentChoices({ ...consentChoices, pazarlama: checked as boolean })
                }
              />
              <label htmlFor="pazarlama" className="text-white font-medium cursor-pointer">
                Pazarlama Çerezleri
              </label>
              <span className="text-gray-400 text-sm">(Kişiselleştirme ve reklamlar için)</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <Button
              onClick={handleApplySettings}
              className="bg-[#00ff41] hover:bg-[#00e63b] text-black font-semibold rounded-md"
              data-testid="button-apply-settings"
            >
              Ayarları Kaydet
            </Button>
            <Button
              onClick={() => setShowSettings(false)}
              variant="outline"
              className="border-[#333] text-white hover:bg-[#222]"
              data-testid="button-cancel-settings"
            >
              İptal Et
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
