import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CreditCard, Shield, Truck, Lock, Loader2, UserCheck, Building2, MessageCircle, Copy, Check, ChevronRight, Package } from "lucide-react";
import { formatPrice, getSessionId } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PaymentMethod } from "@shared/schema";

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
type SelectedPaymentType = "credit_card" | "bank_transfer" | "whatsapp";

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
  const [selectedPaymentType, setSelectedPaymentType] = useState<SelectedPaymentType>("credit_card");
  const [customerNote, setCustomerNote] = useState("");
  const [copiedIban, setCopiedIban] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{ orderNumber: string; paymentMethod: string } | null>(null);

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({ queryKey: ["/api/payment-methods"] });

  const bankMethods = paymentMethods.filter(m => m.type === "bank_transfer");
  const whatsappMethods = paymentMethods.filter(m => m.type === "whatsapp");
  const hasCreditCard = paymentMethods.some(m => m.type === "credit_card") || paymentMethods.length === 0;

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: "", email: "", phone: "", address: "", city: "", district: "", zipCode: "", identityNumber: "",
  });

  useEffect(() => {
    if (user && !address.fullName && !address.email) {
      setAddress((prev) => ({ ...prev, fullName: user.fullName || "", email: user.email || "" }));
    }
  }, [user]);

  const [cardInfo, setCardInfo] = useState({
    cardHolderName: "", cardNumber: "", expireMonth: "", expireYear: "", cvc: "",
  });

  const shippingCost = totalPrice >= 500 ? 0 : 29.90;
  const finalTotal = totalPrice + shippingCost;

  if (items.length === 0 && !orderResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center" data-testid="checkout-empty">
        <h1 className="text-2xl font-bold mb-4">Sepetiniz boş</h1>
        <p className="text-muted-foreground mb-6">Ödeme yapabilmek için sepetinize ürün ekleyin.</p>
        <Button onClick={() => setLocation("/urunler")} data-testid="button-go-shop">Alışverişe Başla</Button>
      </div>
    );
  }

  const validateAddress = () => {
    if (!address.fullName || !address.email || !address.phone || !address.address || !address.city || !address.district || !address.zipCode) {
      toast({ title: "Eksik bilgi", description: "Lütfen tüm zorunlu alanları doldurun.", variant: "destructive" });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
      toast({ title: "Geçersiz e-posta", variant: "destructive" });
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
    return true;
  };

  const handleAddressNext = () => {
    if (validateAddress()) setStep("payment");
  };

  const generateOrderNumber = () => `FS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const createOrderRecord = async (paymentMethod: string, paymentStatus: string) => {
    const orderNumber = generateOrderNumber();
    const basketItems = items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      price: parseFloat(item.product.price),
      quantity: item.quantity,
      flavor: item.selectedFlavor,
      weight: item.selectedWeight,
    }));

    await apiRequest("POST", "/api/orders", {
      orderNumber,
      items: basketItems,
      subtotal: String(totalPrice),
      shippingCost: String(shippingCost),
      total: String(finalTotal),
      customerName: address.fullName,
      customerEmail: address.email,
      customerPhone: address.phone,
      shippingAddress: {
        address: address.address,
        city: address.city,
        district: address.district,
        zipCode: address.zipCode,
      },
      paymentMethod,
      paymentStatus,
      customerNote: customerNote || null,
      userId: user?.id || null,
    });

    return orderNumber;
  };

  const handleCreditCardPayment = async () => {
    if (!validateCard()) return;
    if (!kvkkAccepted || !termsAccepted) {
      toast({ title: "Sözleşmeleri kabul edin", description: "Devam etmek için KVKK ve satış sözleşmelerini onaylayın.", variant: "destructive" });
      return;
    }
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
        shippingAddress: { contactName: address.fullName, city: address.city, district: address.district, address: address.address, zipCode: address.zipCode },
        billingAddress: { contactName: address.fullName, city: address.city, district: address.district, address: address.address, zipCode: address.zipCode },
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
        setOrderResult({ orderNumber: result.orderNumber, paymentMethod: "credit_card" });
        setStep("confirm");
        toast({ title: "Ödeme başarılı!", description: `Sipariş numaranız: ${result.orderNumber}` });
      } else {
        toast({ title: "Ödeme başarısız", description: result.errorMessage || "Bir hata oluştu.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ödeme hatası", description: "Bir sorun oluştu. Lütfen tekrar deneyin.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handleBankTransferOrder = async () => {
    if (!kvkkAccepted || !termsAccepted) {
      toast({ title: "Sözleşmeleri kabul edin", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const orderNumber = await createOrderRecord("bank_transfer", "awaiting_payment");
      clearCart();
      setOrderResult({ orderNumber, paymentMethod: "bank_transfer" });
      setStep("confirm");
      toast({ title: "Sipariş oluşturuldu!", description: "Havale/EFT bilgileri siparişinizde görüntüleniyor." });
    } catch {
      toast({ title: "Hata", description: "Sipariş oluşturulamadı.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handleWhatsAppOrder = async () => {
    if (!kvkkAccepted || !termsAccepted) {
      toast({ title: "Sözleşmeleri kabul edin", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const orderNumber = await createOrderRecord("whatsapp", "pending");
      clearCart();

      const wp = whatsappMethods[0];
      const details = wp?.details as any || {};
      const phoneNumber = details.phoneNumber || "";

      const itemsList = items.map(item =>
        `• ${item.product.name}${item.selectedFlavor ? ` (${item.selectedFlavor})` : ""}${item.selectedWeight ? ` - ${item.selectedWeight}` : ""} x${item.quantity} = ${formatPrice(parseFloat(item.product.price) * item.quantity)}`
      ).join("\n");

      let message = details.messageTemplate || "Merhaba, sipariş vermek istiyorum.\n\nSipariş Detayları:\n{items}\n\nToplam: {total}";
      message = message.replace("{items}", itemsList);
      message = message.replace("{total}", formatPrice(finalTotal));
      message = message.replace("{name}", address.fullName);
      message += `\n\nSipariş No: ${orderNumber}`;
      message += `\nAd Soyad: ${address.fullName}`;
      message += `\nTelefon: ${address.phone}`;
      message += `\nAdres: ${address.address}, ${address.district}/${address.city}`;
      if (customerNote) message += `\nNot: ${customerNote}`;

      const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");

      setOrderResult({ orderNumber, paymentMethod: "whatsapp" });
      setStep("confirm");
      toast({ title: "Sipariş oluşturuldu!", description: "WhatsApp ile iletişime geçin." });
    } catch {
      toast({ title: "Hata", description: "Sipariş oluşturulamadı.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handlePayment = () => {
    if (selectedPaymentType === "credit_card") handleCreditCardPayment();
    else if (selectedPaymentType === "bank_transfer") handleBankTransferOrder();
    else if (selectedPaymentType === "whatsapp") handleWhatsAppOrder();
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(\d{4})/g, "$1 ").trim();
  };

  const copyIban = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(iban);
    toast({ title: "IBAN kopyalandı" });
    setTimeout(() => setCopiedIban(null), 2000);
  };

  if (step === "confirm") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center" data-testid="checkout-success">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Siparişiniz Alındı!</h1>
        {orderResult?.orderNumber && (
          <p className="text-lg font-medium text-primary mb-2">Sipariş No: #{orderResult.orderNumber}</p>
        )}

        {orderResult?.paymentMethod === "credit_card" && (
          <p className="text-muted-foreground mb-8">Ödemeniz başarıyla gerçekleştirildi. Sipariş detayları e-posta adresinize gönderilecektir.</p>
        )}

        {orderResult?.paymentMethod === "bank_transfer" && (
          <div className="text-left bg-card border border-border rounded-xl p-6 mb-8">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Havale/EFT Bilgileri
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Aşağıdaki banka hesaplarından birine <strong className="text-foreground">{formatPrice(finalTotal)}</strong> tutarında havale/EFT yapın.
              Açıklama kısmına sipariş numaranızı yazmayı unutmayın.
            </p>
            {bankMethods.map((bank) => {
              const d = bank.details as any || {};
              return (
                <div key={bank.id} className="bg-muted/50 rounded-lg p-4 mb-3 last:mb-0" data-testid={`bank-info-${bank.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{d.bankName}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyIban(d.iban || "")} className="h-7 text-xs" data-testid={`button-copy-iban-${bank.id}`}>
                      {copiedIban === d.iban ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copiedIban === d.iban ? "Kopyalandı" : "IBAN Kopyala"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Hesap Sahibi: <span className="text-foreground">{d.accountHolder}</span></p>
                  <p className="text-sm font-mono text-primary mt-1">{d.iban}</p>
                  {d.branchCode && <p className="text-xs text-muted-foreground mt-1">Şube: {d.branchCode}</p>}
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground mt-3">
              Havale/EFT işleminiz onaylandıktan sonra siparişiniz hazırlanmaya başlayacaktır.
            </p>
          </div>
        )}

        {orderResult?.paymentMethod === "whatsapp" && (
          <div className="mb-8">
            <p className="text-muted-foreground mb-4">WhatsApp üzerinden sipariş bilgileriniz gönderildi. Onay için mesajınızı gönderin.</p>
            {whatsappMethods[0] && (
              <Button
                onClick={() => {
                  const d = whatsappMethods[0].details as any || {};
                  window.open(`https://wa.me/${d.phoneNumber}`, "_blank");
                }}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-open-whatsapp"
              >
                <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp'ı Aç
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-4 justify-center">
          <Button onClick={() => setLocation(`/siparis-takip`)} variant="outline" data-testid="button-track-order">
            <Package className="w-4 h-4 mr-2" /> Sipariş Takip
          </Button>
          <Button onClick={() => setLocation("/")} variant="outline" data-testid="button-go-home">Ana Sayfa</Button>
          <Button onClick={() => setLocation("/urunler")} className="neon-glow" data-testid="button-continue-shopping-after">Alışverişe Devam Et</Button>
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
                    <SelectTrigger data-testid="select-city"><SelectValue placeholder="İl seçin" /></SelectTrigger>
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

              <div>
                <Label htmlFor="customerNote">Sipariş Notu (isteğe bağlı)</Label>
                <Textarea
                  id="customerNote"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Siparişinizle ilgili eklemek istediğiniz not..."
                  rows={2}
                  data-testid="input-customer-note"
                />
              </div>

              <Button className="w-full neon-glow py-6" onClick={handleAddressNext} data-testid="button-address-next">
                Ödeme Adımına Geç <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-6" data-testid="checkout-payment-form">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> Ödeme Yöntemi
                </h2>
                <button onClick={() => setStep("address")} className="text-sm text-primary hover:underline" data-testid="button-back-to-address">
                  Adresi Düzenle
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {hasCreditCard && (
                  <button
                    onClick={() => setSelectedPaymentType("credit_card")}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedPaymentType === "credit_card" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}
                    data-testid="button-select-credit-card"
                  >
                    <CreditCard className={`w-6 h-6 mb-2 ${selectedPaymentType === "credit_card" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium text-sm">Kredi Kartı</p>
                    <p className="text-xs text-muted-foreground mt-1">Güvenli online ödeme</p>
                  </button>
                )}

                {bankMethods.length > 0 && (
                  <button
                    onClick={() => setSelectedPaymentType("bank_transfer")}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedPaymentType === "bank_transfer" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}
                    data-testid="button-select-bank-transfer"
                  >
                    <Building2 className={`w-6 h-6 mb-2 ${selectedPaymentType === "bank_transfer" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium text-sm">Havale / EFT</p>
                    <p className="text-xs text-muted-foreground mt-1">Banka havalesi ile ödeme</p>
                  </button>
                )}

                {whatsappMethods.length > 0 && (
                  <button
                    onClick={() => setSelectedPaymentType("whatsapp")}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedPaymentType === "whatsapp" ? "border-green-500 bg-green-500/5" : "border-border bg-card hover:border-green-500/50"}`}
                    data-testid="button-select-whatsapp"
                  >
                    <MessageCircle className={`w-6 h-6 mb-2 ${selectedPaymentType === "whatsapp" ? "text-green-500" : "text-muted-foreground"}`} />
                    <p className="font-medium text-sm">WhatsApp Sipariş</p>
                    <p className="text-xs text-muted-foreground mt-1">WhatsApp ile sipariş ver</p>
                  </button>
                )}
              </div>

              {selectedPaymentType === "credit_card" && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-center gap-3">
                    <Lock className="w-5 h-5 text-primary flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Kart bilgileriniz 256-bit SSL şifreleme ile korunmaktadır. iyzico güvenli ödeme altyapısı kullanılmaktadır.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="cardHolder">Kart Üzerindeki İsim *</Label>
                    <Input id="cardHolder" value={cardInfo.cardHolderName} onChange={(e) => setCardInfo({ ...cardInfo, cardHolderName: e.target.value })} placeholder="AD SOYAD" data-testid="input-card-holder" />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber">Kart Numarası *</Label>
                    <Input
                      id="cardNumber" value={cardInfo.cardNumber}
                      onChange={(e) => setCardInfo({ ...cardInfo, cardNumber: formatCardNumber(e.target.value) })}
                      placeholder="0000 0000 0000 0000" maxLength={19} data-testid="input-card-number"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Ay *</Label>
                      <Select value={cardInfo.expireMonth} onValueChange={(val) => setCardInfo({ ...cardInfo, expireMonth: val })}>
                        <SelectTrigger data-testid="select-expire-month"><SelectValue placeholder="Ay" /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Yıl *</Label>
                      <Select value={cardInfo.expireYear} onValueChange={(val) => setCardInfo({ ...cardInfo, expireYear: val })}>
                        <SelectTrigger data-testid="select-expire-year"><SelectValue placeholder="Yıl" /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => String(2026 + i)).map((y) => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>CVC *</Label>
                      <Input
                        value={cardInfo.cvc}
                        onChange={(e) => setCardInfo({ ...cardInfo, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        placeholder="000" maxLength={4} data-testid="input-cvc"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedPaymentType === "bank_transfer" && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Siparişiniz oluşturulduktan sonra aşağıdaki banka hesaplarına havale/EFT yapabilirsiniz.
                    Ödemeniz onaylandıktan sonra siparişiniz hazırlanmaya başlayacaktır.
                  </p>
                  {bankMethods.map((bank) => {
                    const d = bank.details as any || {};
                    return (
                      <div key={bank.id} className="bg-muted/50 rounded-lg p-4" data-testid={`checkout-bank-${bank.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">{d.bankName}</span>
                          <Button variant="ghost" size="sm" onClick={() => copyIban(d.iban || "")} className="h-7 text-xs">
                            {copiedIban === d.iban ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                            IBAN Kopyala
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">Hesap Sahibi: <span className="text-foreground">{d.accountHolder}</span></p>
                        <p className="text-sm font-mono text-primary mt-1">{d.iban}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedPaymentType === "whatsapp" && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">WhatsApp ile Sipariş</p>
                      <p className="text-xs text-muted-foreground">
                        Sipariş bilgileriniz otomatik olarak WhatsApp mesajına dönüştürülecek ve ilgili numaraya gönderilecektir.
                      </p>
                    </div>
                  </div>
                  {whatsappMethods[0]?.description && (
                    <p className="text-sm text-muted-foreground">{whatsappMethods[0].description}</p>
                  )}
                </div>
              )}

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-start gap-3">
                  <Checkbox id="kvkk" checked={kvkkAccepted} onCheckedChange={(v) => setKvkkAccepted(v === true)} data-testid="checkbox-kvkk" />
                  <label htmlFor="kvkk" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                    KVKK Aydınlatma Metni'ni okudum ve kişisel verilerimin işlenmesini kabul ediyorum.
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(v === true)} data-testid="checkbox-terms" />
                  <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                    Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu'nu okudum, kabul ediyorum.
                  </label>
                </div>
              </div>

              <Button
                className={`w-full py-6 text-base ${selectedPaymentType === "whatsapp" ? "bg-green-600 hover:bg-green-700" : "neon-glow"}`}
                onClick={handlePayment}
                disabled={isProcessing}
                data-testid="button-pay"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> İşleniyor...</>
                ) : selectedPaymentType === "credit_card" ? (
                  <><Lock className="w-5 h-5 mr-2" /> {formatPrice(finalTotal)} Öde</>
                ) : selectedPaymentType === "bank_transfer" ? (
                  <><Building2 className="w-5 h-5 mr-2" /> Siparişi Oluştur</>
                ) : (
                  <><MessageCircle className="w-5 h-5 mr-2" /> WhatsApp ile Sipariş Ver</>
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
              <span>Güvenli alışveriş garantisi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
