import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CreditCard, Shield, Truck, Lock, Loader2, UserCheck } from "lucide-react";
import { formatPrice, getSessionId } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const TURKISH_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya",
  "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl",
  "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
  "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir",
  "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta",
  "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu",
  "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya",
  "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir",
  "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt",
  "Sinop", "Sivas", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak",
  "Van", "Yalova", "Yozgat", "Zonguldak"
];

type CheckoutStep = "address" | "payment" | "confirm";

interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  zipCode: string;
  identityNumber: string;
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoggedIn } = useAuth();
  const [step, setStep] = useState<CheckoutStep>("address");
  const [isProcessing, setIsProcessing] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    zipCode: "",
    identityNumber: "",
  });

  useEffect(() => {
    if (user && !address.fullName && !address.email) {
      setAddress((prev) => ({
        ...prev,
        fullName: user.fullName || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const [cardInfo, setCardInfo] = useState({
    cardHolderName: "",
    cardNumber: "",
    expireMonth: "",
    expireYear: "",
    cvc: "",
  });

  const shippingCost = totalPrice >= 500 ? 0 : 29.90;
  const finalTotal = totalPrice + shippingCost;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center" data-testid="checkout-empty">
        <h1 className="text-2xl font-bold mb-4">Sepetiniz boş</h1>
        <p className="text-muted-foreground mb-6">Ödeme yapabilmek için sepetinize ürün ekleyin.</p>
        <Button onClick={() => setLocation("/urunler")} data-testid="button-go-shop">
          Alışverişe Başla
        </Button>
      </div>
    );
  }

  const validateAddress = () => {
    if (!address.fullName || !address.email || !address.phone || !address.address || !address.city || !address.district || !address.zipCode) {
      toast({ title: "Eksik bilgi", description: "Lütfen tüm zorunlu alanları doldurun.", variant: "destructive" });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(address.email)) {
      toast({ title: "Geçersiz e-posta", description: "Lütfen geçerli bir e-posta adresi girin.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateCard = () => {
    if (!cardInfo.cardHolderName || !cardInfo.cardNumber || !cardInfo.expireMonth || !cardInfo.expireYear || !cardInfo.cvc) {
      toast({ title: "Eksik bilgi", description: "Lütfen tüm kart bilgilerini doldurun.", variant: "destructive" });
      return false;
    }
    const cleanNumber = cardInfo.cardNumber.replace(/\s/g, "");
    if (cleanNumber.length < 15 || cleanNumber.length > 16) {
      toast({ title: "Geçersiz kart numarası", variant: "destructive" });
      return false;
    }
    if (!kvkkAccepted || !termsAccepted) {
      toast({ title: "Sözleşmeleri kabul edin", description: "Devam etmek için KVKK ve satış sözleşmelerini onaylayın.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleAddressNext = () => {
    if (validateAddress()) setStep("payment");
  };

  const handlePayment = async () => {
    if (!validateCard()) return;
    setIsProcessing(true);
    try {
      const basketItems = items.map((item) => ({
        id: String(item.productId),
        name: item.product.name,
        category: "Supplement",
        price: parseFloat(item.product.price),
        quantity: item.quantity,
        variantId: item.variantId,
      }));

      const res = await apiRequest("POST", "/api/payment/initialize", {
        buyer: {
          name: address.fullName.split(" ")[0] || address.fullName,
          surname: address.fullName.split(" ").slice(1).join(" ") || address.fullName,
          email: address.email,
          phone: address.phone,
          identityNumber: address.identityNumber || "11111111111",
          address: address.address,
          city: address.city,
          country: "Turkey",
          zipCode: address.zipCode,
          ip: "85.34.78.112",
        },
        shippingAddress: {
          contactName: address.fullName,
          city: address.city,
          district: address.district,
          address: address.address,
          zipCode: address.zipCode,
        },
        billingAddress: {
          contactName: address.fullName,
          city: address.city,
          district: address.district,
          address: address.address,
          zipCode: address.zipCode,
        },
        card: {
          cardHolderName: cardInfo.cardHolderName,
          cardNumber: cardInfo.cardNumber.replace(/\s/g, ""),
          expireMonth: cardInfo.expireMonth,
          expireYear: cardInfo.expireYear,
          cvc: cardInfo.cvc,
        },
        basketItems,
        totalPrice: finalTotal,
        shippingCost,
        sessionId: getSessionId(),
      });

      const result = await res.json();

      if (result.status === "success") {
        clearCart();
        setStep("confirm");
        toast({ title: "Ödeme başarılı!", description: `Sipariş numaranız: ${result.orderNumber}` });
      } else {
        toast({ title: "Ödeme başarısız", description: result.errorMessage || "Bir hata oluştu. Lütfen tekrar deneyin.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Ödeme hatası", description: "Bir sorun oluştu. Lütfen tekrar deneyin.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(\d{4})/g, "$1 ").trim();
  };

  if (step === "confirm") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center" data-testid="checkout-success">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Siparişiniz Alındı!</h1>
        <p className="text-muted-foreground mb-2">Ödemeniz başarıyla gerçekleştirildi.</p>
        <p className="text-muted-foreground mb-8">Sipariş detayları e-posta adresinize gönderildi.</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => setLocation("/")} variant="outline" data-testid="button-go-home">
            Ana Sayfa
          </Button>
          <Button onClick={() => setLocation("/urunler")} className="neon-glow" data-testid="button-continue-shopping-after">
            Alışverişe Devam Et
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" data-testid="checkout-page">
      <Button variant="ghost" onClick={() => setLocation("/sepet")} className="mb-6" data-testid="button-back-to-cart">
        <ArrowLeft className="w-4 h-4 mr-2" /> Sepete Dön
      </Button>

      <div className="flex items-center gap-4 mb-8">
        <div className={`flex items-center gap-2 ${step === "address" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === "address" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>1</div>
          <span className="text-sm font-medium hidden sm:inline">Teslimat Bilgileri</span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className={`flex items-center gap-2 ${step === "payment" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === "payment" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>2</div>
          <span className="text-sm font-medium hidden sm:inline">Ödeme</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === "address" && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6" data-testid="checkout-address-form">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" /> Teslimat Bilgileri
              </h2>

              {!isLoggedIn && (
                <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-lg p-3" data-testid="guest-checkout-banner">
                  <UserCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">Misafir olarak sipariş veriyorsunuz.</span>{" "}
                    Sipariş takibi için e-posta adresinize bilgilendirme gönderilecektir.
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="fullName">Ad Soyad *</Label>
                  <Input id="fullName" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} placeholder="Ad Soyad" data-testid="input-fullname" />
                </div>
                <div>
                  <Label htmlFor="email">E-posta *</Label>
                  <Input id="email" type="email" value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })} placeholder="ornek@email.com" data-testid="input-email" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input id="phone" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="+905xxxxxxxxx" data-testid="input-phone" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Adres *</Label>
                  <Input id="address" value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} placeholder="Mahalle, Sokak, No" data-testid="input-address" />
                </div>
                <div>
                  <Label htmlFor="city">İl *</Label>
                  <Select value={address.city} onValueChange={(val) => setAddress({ ...address, city: val })}>
                    <SelectTrigger data-testid="select-city">
                      <SelectValue placeholder="İl seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {TURKISH_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="district">İlçe *</Label>
                  <Input id="district" value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} placeholder="İlçe" data-testid="input-district" />
                </div>
                <div>
                  <Label htmlFor="zipCode">Posta Kodu *</Label>
                  <Input id="zipCode" value={address.zipCode} onChange={(e) => setAddress({ ...address, zipCode: e.target.value })} placeholder="34000" data-testid="input-zipcode" />
                </div>
                <div>
                  <Label htmlFor="identityNumber">TC Kimlik No (isteğe bağlı)</Label>
                  <Input id="identityNumber" value={address.identityNumber} onChange={(e) => setAddress({ ...address, identityNumber: e.target.value })} placeholder="11111111111" data-testid="input-identity" />
                </div>
              </div>

              <Button className="w-full neon-glow py-6" onClick={handleAddressNext} data-testid="button-address-next">
                Ödeme Adımına Geç <CreditCard className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {step === "payment" && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6" data-testid="checkout-payment-form">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> Kart Bilgileri
                </h2>
                <button onClick={() => setStep("address")} className="text-sm text-primary hover:underline" data-testid="button-back-to-address">
                  Adresi Düzenle
                </button>
              </div>

              <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-center gap-3">
                <Lock className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Kart bilgileriniz 256-bit SSL şifreleme ile korunmaktadır. iyzico güvenli ödeme altyapısı kullanılmaktadır.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardHolder">Kart Üzerindeki İsim *</Label>
                  <Input id="cardHolder" value={cardInfo.cardHolderName} onChange={(e) => setCardInfo({ ...cardInfo, cardHolderName: e.target.value })} placeholder="AD SOYAD" data-testid="input-card-holder" />
                </div>
                <div>
                  <Label htmlFor="cardNumber">Kart Numarası *</Label>
                  <Input
                    id="cardNumber"
                    value={cardInfo.cardNumber}
                    onChange={(e) => setCardInfo({ ...cardInfo, cardNumber: formatCardNumber(e.target.value) })}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    data-testid="input-card-number"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="expMonth">Ay *</Label>
                    <Select value={cardInfo.expireMonth} onValueChange={(val) => setCardInfo({ ...cardInfo, expireMonth: val })}>
                      <SelectTrigger data-testid="select-expire-month">
                        <SelectValue placeholder="Ay" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expYear">Yıl *</Label>
                    <Select value={cardInfo.expireYear} onValueChange={(val) => setCardInfo({ ...cardInfo, expireYear: val })}>
                      <SelectTrigger data-testid="select-expire-year">
                        <SelectValue placeholder="Yıl" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => String(2026 + i)).map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cvc">CVC *</Label>
                    <Input
                      id="cvc"
                      value={cardInfo.cvc}
                      onChange={(e) => setCardInfo({ ...cardInfo, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      placeholder="000"
                      maxLength={4}
                      data-testid="input-cvc"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="kvkk"
                    checked={kvkkAccepted}
                    onCheckedChange={(v) => setKvkkAccepted(v === true)}
                    data-testid="checkbox-kvkk"
                  />
                  <label htmlFor="kvkk" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                    KVKK Aydınlatma Metni'ni okudum ve kişisel verilerimin işlenmesini kabul ediyorum.
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(v) => setTermsAccepted(v === true)}
                    data-testid="checkbox-terms"
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                    Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu'nu okudum, kabul ediyorum.
                  </label>
                </div>
              </div>

              <Button
                className="w-full neon-glow py-6 text-base"
                onClick={handlePayment}
                disabled={isProcessing}
                data-testid="button-pay"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> İşleniyor...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" /> {formatPrice(finalTotal)} Öde
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6 sticky top-24" data-testid="checkout-summary">
            <h3 className="font-bold text-lg mb-4">Sipariş Özeti</h3>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3" data-testid={`checkout-item-${item.id}`}>
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {item.product.images?.[0] ? (
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                    <div className="flex gap-1 text-xs text-muted-foreground">
                      {item.selectedFlavor && <span>{item.selectedFlavor}</span>}
                      {item.selectedWeight && <span>• {item.selectedWeight}</span>}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                      <span className="text-sm font-bold text-primary">{formatPrice(parseFloat(item.product.price) * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kargo</span>
                <span className={shippingCost === 0 ? "text-primary" : ""}>
                  {shippingCost === 0 ? "Ücretsiz" : formatPrice(shippingCost)}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                <span>Toplam</span>
                <span className="text-primary" data-testid="text-checkout-total">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>iyzico güvenli ödeme altyapısı</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
