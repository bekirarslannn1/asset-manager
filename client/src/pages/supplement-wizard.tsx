import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  Dumbbell,
  Flame,
  Heart,
  Zap,
  RefreshCw,
  TrendingUp,
  User,
  Users,
  Clock,
  Utensils,
  Leaf,
  Timer,
  Package,
  CheckCircle2,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";

type WizardPhase = "steps" | "loading" | "results";

interface WizardData {
  gender: string;
  age: number;
  weight: number;
  trainingFrequency: string;
  goal: string;
  dietType: string;
}

interface BundleProduct {
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: string;
    images: string[];
  };
}

interface Recommendation {
  id: number;
  name: string;
  description: string;
  image: string;
  goalTags: string[];
  discountPercent: number;
  price: string;
  comparePrice: string;
  matchScore: number;
  bundleProducts: BundleProduct[];
}

interface WizardResult {
  profile: Record<string, unknown>;
  recommendations: Recommendation[];
  matchPercentage: number;
}

const GOALS = [
  { value: "kas_kazanimi", label: "Kas Kazanımı", icon: Dumbbell },
  { value: "yag_yakim", label: "Yağ Yakım", icon: Flame },
  { value: "genel_saglik", label: "Genel Sağlık", icon: Heart },
  { value: "performans", label: "Performans", icon: Zap },
  { value: "toparlanma", label: "Toparlanma", icon: RefreshCw },
  { value: "kilo_alma", label: "Kilo Alma", icon: TrendingUp },
];

const DIETS = [
  { value: "normal", label: "Normal Beslenme", icon: Utensils },
  { value: "vegan", label: "Vegan", icon: Leaf },
  { value: "keto", label: "Keto / Düşük Karbonhidrat", icon: Flame },
  { value: "intermittent", label: "Aralıklı Oruç", icon: Timer },
];

const TRAINING_FREQUENCIES = [
  { value: "1-2", label: "1-2/hafta" },
  { value: "3-4", label: "3-4/hafta" },
  { value: "5+", label: "5+/hafta" },
];

function ProgressBar({ step, totalSteps }: { step: number; totalSteps: number }) {
  const progress = (step / totalSteps) * 100;
  return (
    <div className="w-full max-w-2xl mx-auto mb-8" data-testid="wizard-progress-container">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
        <span>Adım {step} / {totalSteps}</span>
        <span>%{Math.round(progress)}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
          data-testid="wizard-progress"
        />
      </div>
    </div>
  );
}

function StepGender({ onSelect }: { onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4">
      <h1 className="text-3xl md:text-4xl font-bold font-heading mb-3 text-center" data-testid="text-wizard-step-title">
        Cinsiyetiniz nedir?
      </h1>
      <p className="text-muted-foreground text-center mb-10">Size en uygun ürünleri belirlemek için</p>
      <div className="grid grid-cols-2 gap-6 w-full max-w-md">
        <button
          onClick={() => onSelect("erkek")}
          className="group p-8 rounded-xl border-2 border-border bg-card transition-all duration-300 text-center hover:border-primary/60 hover:scale-[1.02] focus:outline-none focus:border-primary"
          data-testid="button-wizard-gender-erkek"
        >
          <div className="flex justify-center mb-4">
            <User className="w-14 h-14 text-primary" />
          </div>
          <span className="text-xl font-semibold block">Erkek</span>
        </button>
        <button
          onClick={() => onSelect("kadin")}
          className="group p-8 rounded-xl border-2 border-border bg-card transition-all duration-300 text-center hover:border-primary/60 hover:scale-[1.02] focus:outline-none focus:border-primary"
          data-testid="button-wizard-gender-kadin"
        >
          <div className="flex justify-center mb-4">
            <Users className="w-14 h-14 text-primary" />
          </div>
          <span className="text-xl font-semibold block">Kadın</span>
        </button>
      </div>
    </div>
  );
}

function StepAgeWeight({
  age,
  weight,
  trainingFrequency,
  onAgeChange,
  onWeightChange,
  onFrequencyChange,
  onNext,
  onBack,
}: {
  age: number;
  weight: number;
  trainingFrequency: string;
  onAgeChange: (v: number) => void;
  onWeightChange: (v: number) => void;
  onFrequencyChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const isValid = age >= 14 && age <= 100 && weight >= 30 && weight <= 300 && trainingFrequency;

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4">
      <h1 className="text-3xl md:text-4xl font-bold font-heading mb-3 text-center" data-testid="text-wizard-step-title">
        Bilgileriniz
      </h1>
      <p className="text-muted-foreground text-center mb-10">Yaş, kilo ve antrenman sıklığınızı girin</p>

      <div className="w-full max-w-md space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Yaş</label>
            <Input
              type="number"
              min={14}
              max={100}
              value={age || ""}
              onChange={(e) => onAgeChange(parseInt(e.target.value) || 0)}
              placeholder="25"
              data-testid="input-wizard-age"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Kilo (kg)</label>
            <Input
              type="number"
              min={30}
              max={300}
              value={weight || ""}
              onChange={(e) => onWeightChange(parseInt(e.target.value) || 0)}
              placeholder="80"
              data-testid="input-wizard-weight"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3 text-muted-foreground">Antrenman Sıklığı</label>
          <div className="grid grid-cols-3 gap-3">
            {TRAINING_FREQUENCIES.map((freq) => (
              <button
                key={freq.value}
                onClick={() => onFrequencyChange(freq.value)}
                className={`p-3 rounded-xl border-2 transition-all duration-200 text-center text-sm font-medium ${
                  trainingFrequency === freq.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/40"
                }`}
                data-testid={`button-wizard-frequency-${freq.value}`}
              >
                {freq.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button variant="ghost" onClick={onBack} data-testid="button-wizard-back">
            <ArrowLeft className="w-4 h-4 mr-2" /> Geri
          </Button>
          <Button
            className="flex-1 neon-glow"
            disabled={!isValid}
            onClick={onNext}
            data-testid="button-wizard-next"
          >
            Devam Et <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepGoal({ onSelect, onBack }: { onSelect: (v: string) => void; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4">
      <h1 className="text-3xl md:text-4xl font-bold font-heading mb-3 text-center" data-testid="text-wizard-step-title">
        Hedefiniz nedir?
      </h1>
      <p className="text-muted-foreground text-center mb-10">Antrenman amacınızı seçin</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-xl">
        {GOALS.map((goal) => {
          const Icon = goal.icon;
          return (
            <button
              key={goal.value}
              onClick={() => onSelect(goal.value)}
              className="group p-6 rounded-xl border-2 border-border bg-card transition-all duration-300 text-center hover:border-primary/60 hover:scale-[1.02] focus:outline-none focus:border-primary"
              data-testid={`button-wizard-goal-${goal.value}`}
            >
              <div className="flex justify-center mb-3">
                <Icon className="w-10 h-10 text-primary" />
              </div>
              <span className="text-sm font-semibold block">{goal.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-8">
        <Button variant="ghost" onClick={onBack} data-testid="button-wizard-back">
          <ArrowLeft className="w-4 h-4 mr-2" /> Geri
        </Button>
      </div>
    </div>
  );
}

function StepDiet({ onSelect, onBack }: { onSelect: (v: string) => void; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4">
      <h1 className="text-3xl md:text-4xl font-bold font-heading mb-3 text-center" data-testid="text-wizard-step-title">
        Beslenme Tipiniz
      </h1>
      <p className="text-muted-foreground text-center mb-10">Beslenme düzeninizi seçin</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        {DIETS.map((diet) => {
          const Icon = diet.icon;
          return (
            <button
              key={diet.value}
              onClick={() => onSelect(diet.value)}
              className="group p-6 rounded-xl border-2 border-border bg-card transition-all duration-300 text-left hover:border-primary/60 hover:scale-[1.02] focus:outline-none focus:border-primary flex items-center gap-4"
              data-testid={`button-wizard-diet-${diet.value}`}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-base font-semibold">{diet.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-8">
        <Button variant="ghost" onClick={onBack} data-testid="button-wizard-back">
          <ArrowLeft className="w-4 h-4 mr-2" /> Geri
        </Button>
      </div>
    </div>
  );
}

function FakeLoadingScreen() {
  const [textIndex, setTextIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const texts = [
    "Verileriniz analiz ediliyor...",
    "Profilinize uygun paketler belirleniyor...",
  ];

  useEffect(() => {
    const textTimer = setTimeout(() => setTextIndex(1), 1000);
    return () => clearTimeout(textTimer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return p + 2;
      });
    }, 35);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 min-h-[60vh]" data-testid="wizard-loading">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-8 animate-pulse">
        <Package className="w-8 h-8 text-primary" />
      </div>
      <p className="text-lg font-medium mb-6 text-center" data-testid="text-loading-message">
        {texts[textIndex]}
      </p>
      <div className="w-full max-w-sm">
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
            data-testid="loading-progress"
          />
        </div>
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultsPage({ result, onReset }: { result: WizardResult; onReset: () => void }) {
  const { addToCart, isAdding } = useCart();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) return 0;
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerText = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isUrgent = timeLeft < 5 * 60;

  const handleAddAllToCart = useCallback(() => {
    if (!result.recommendations.length) return;
    const rec = result.recommendations[0];
    if (!rec.bundleProducts?.length) return;

    rec.bundleProducts.forEach((item) => {
      addToCart({ productId: item.product.id, quantity: item.quantity });
    });

    toast({
      title: "Paket sepete eklendi!",
      description: `${rec.bundleProducts.length} ürün sepetinize eklendi.`,
    });
  }, [result, addToCart, toast]);

  const rec = result.recommendations?.[0];

  return (
    <div className="min-h-[80vh] py-8 px-4" data-testid="wizard-results">
      <div className="max-w-3xl mx-auto">
        <div
          className={`mb-6 p-4 rounded-xl border text-center transition-colors ${
            isUrgent
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-primary/10 border-primary/30"
          }`}
          data-testid="wizard-urgency-timer"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-sm">Testi tamamladığınız için tebrikler!</span>
          </div>
          <p className="text-sm">
            Bu ürünlerdeki <span className="font-bold">%10 ekstra indiriminiz</span>{" "}
            <span className={`font-mono font-bold text-lg ${isUrgent ? "text-destructive" : "text-primary"}`} data-testid="text-timer">
              {timerText}
            </span>{" "}
            dakika içinde sona erecek
          </p>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2" data-testid="text-wizard-results-title">
            Profilinizle %{result.matchPercentage} Eşleşen Kombinasyon
          </h1>
        </div>

        {rec ? (
          <div>
            <Card className="p-6 mb-6" data-testid={`card-recommendation-${rec.id}`}>
              <div className="flex items-start gap-4 mb-6">
                {rec.image && (
                  <img
                    src={rec.image}
                    alt={rec.name}
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                    data-testid="img-bundle"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold mb-1" data-testid="text-bundle-name">{rec.name}</h2>
                  {rec.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{rec.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      %{rec.matchScore} eşleşme
                    </span>
                    {rec.discountPercent > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive font-medium">
                        %{rec.discountPercent} indirim
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {rec.bundleProducts && rec.bundleProducts.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Paket İçeriği</h3>
                  {rec.bundleProducts.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background"
                      data-testid={`card-bundle-product-${item.productId}`}
                    >
                      {item.product.images?.[0] && (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-14 h-14 rounded-md object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">Adet: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold shrink-0" data-testid={`text-product-price-${item.productId}`}>
                        {formatPrice(item.product.price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                <div>
                  <span className="text-sm text-muted-foreground">Paket Fiyatı</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl font-bold text-primary" data-testid="text-bundle-price">
                      {formatPrice(rec.price)}
                    </span>
                    {rec.comparePrice && parseFloat(rec.comparePrice) > parseFloat(rec.price) && (
                      <span className="text-sm text-muted-foreground line-through" data-testid="text-bundle-compare-price">
                        {formatPrice(rec.comparePrice)}
                      </span>
                    )}
                  </div>
                </div>
                <Clock className="w-6 h-6 text-primary" />
              </div>

              <Button
                className="w-full neon-glow text-base py-6"
                onClick={handleAddAllToCart}
                disabled={isAdding}
                data-testid="button-add-bundle-to-cart"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Tüm Paketi Sepete Ekle
              </Button>
            </Card>

            {result.recommendations.length > 1 &&
              result.recommendations.slice(1).map((altRec) => (
                <Card key={altRec.id} className="p-5 mb-4" data-testid={`card-recommendation-${altRec.id}`}>
                  <div className="flex items-center gap-3">
                    {altRec.image && (
                      <img src={altRec.image} alt={altRec.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{altRec.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-primary font-bold text-sm">{formatPrice(altRec.price)}</span>
                        {altRec.comparePrice && parseFloat(altRec.comparePrice) > parseFloat(altRec.price) && (
                          <span className="text-xs text-muted-foreground line-through">{formatPrice(altRec.comparePrice)}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                      %{altRec.matchScore}
                    </span>
                  </div>
                </Card>
              ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-4">Kriterlere uygun paket bulunamadı.</p>
            <p className="text-sm text-muted-foreground mb-6">Lütfen farklı bir hedef seçmeyi deneyin.</p>
          </div>
        )}

        <div className="flex items-center justify-center mt-8">
          <Button variant="outline" onClick={onReset} data-testid="button-wizard-reset">
            Tekrar Başla
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SupplementWizardPage() {
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<WizardPhase>("steps");
  const [data, setData] = useState<WizardData>({
    gender: "",
    age: 0,
    weight: 0,
    trainingFrequency: "",
    goal: "",
    dietType: "",
  });
  const [result, setResult] = useState<WizardResult | null>(null);
  const { toast } = useToast();

  const totalSteps = 4;

  const handleGender = (gender: string) => {
    setData((d) => ({ ...d, gender }));
    setTimeout(() => setStep(2), 300);
  };

  const handleGoal = (goal: string) => {
    setData((d) => ({ ...d, goal }));
    setTimeout(() => setStep(4), 300);
  };

  const handleDiet = (dietType: string) => {
    const updatedData = { ...data, dietType };
    setData(updatedData);
    setTimeout(() => startAnalysis(updatedData), 300);
  };

  const startAnalysis = async (wizardData: WizardData) => {
    setPhase("loading");

    try {
      const res = await apiRequest("POST", "/api/wizard/analyze", {
        age: wizardData.age,
        weight: wizardData.weight,
        goal: wizardData.goal,
        gender: wizardData.gender,
        trainingFrequency: wizardData.trainingFrequency,
        dietType: wizardData.dietType,
      });
      const json = await res.json();

      setTimeout(() => {
        setResult(json);
        setPhase("results");
      }, 2000);
    } catch {
      setTimeout(() => {
        toast({
          title: "Hata",
          description: "Analiz sırasında bir sorun oluştu. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
        setPhase("steps");
        setStep(4);
      }, 2000);
    }
  };

  const handleReset = () => {
    setStep(1);
    setPhase("steps");
    setData({ gender: "", age: 0, weight: 0, trainingFrequency: "", goal: "", dietType: "" });
    setResult(null);
  };

  if (phase === "loading") {
    return (
      <div className="min-h-[80vh] flex flex-col" data-testid="wizard-page">
        <FakeLoadingScreen />
      </div>
    );
  }

  if (phase === "results" && result) {
    return <ResultsPage result={result} onReset={handleReset} />;
  }

  return (
    <div className="min-h-[80vh] flex flex-col py-8" data-testid="wizard-page">
      <div className="px-4">
        <ProgressBar step={step} totalSteps={totalSteps} />
      </div>

      {step === 1 && <StepGender onSelect={handleGender} />}
      {step === 2 && (
        <StepAgeWeight
          age={data.age}
          weight={data.weight}
          trainingFrequency={data.trainingFrequency}
          onAgeChange={(age) => setData((d) => ({ ...d, age }))}
          onWeightChange={(weight) => setData((d) => ({ ...d, weight }))}
          onFrequencyChange={(trainingFrequency) => setData((d) => ({ ...d, trainingFrequency }))}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && <StepGoal onSelect={handleGoal} onBack={() => setStep(2)} />}
      {step === 4 && <StepDiet onSelect={handleDiet} onBack={() => setStep(3)} />}
    </div>
  );
}
