import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, RotateCcw, ShoppingCart, Dumbbell, Target, Flame, Wind, Heart, Zap, Sprout, Star, Trophy } from "lucide-react";
import ProductCard from "@/components/product-card";
import type { Product } from "@shared/schema";

interface WizardStep {
  title: string;
  subtitle: string;
  options: { value: string; label: string; icon: any; description: string }[];
}

const STEPS: WizardStep[] = [
  {
    title: "Cinsiyetiniz nedir?",
    subtitle: "Size en uygun urunleri belirlemek icin",
    options: [
      { value: "erkek", label: "Erkek", icon: Dumbbell, description: "Erkek sporcu programi" },
      { value: "kadin", label: "Kadin", icon: Target, description: "Kadin sporcu programi" },
    ],
  },
  {
    title: "Hedefiniz nedir?",
    subtitle: "Antrenman amacinizi secin",
    options: [
      { value: "kas-gelistirme", label: "Kas Gelistirme", icon: Dumbbell, description: "Kas kutlesi artirmak" },
      { value: "yag-yakimi", label: "Yag Yakimi", icon: Flame, description: "Yag yakip form kazanmak" },
      { value: "dayaniklilik", label: "Dayaniklilik", icon: Wind, description: "Performans ve kondisyon" },
      { value: "genel-saglik", label: "Genel Saglik", icon: Heart, description: "Saglikli yasam destegi" },
      { value: "kilo-alma", label: "Kilo Alma", icon: Zap, description: "Saglikli kilo almak" },
    ],
  },
  {
    title: "Deneyim seviyeniz?",
    subtitle: "Supplement kullanim tecrubeniz",
    options: [
      { value: "yeni-baslayan", label: "Yeni Baslayan", icon: Sprout, description: "0-6 ay deneyim" },
      { value: "orta-seviye", label: "Orta Seviye", icon: Star, description: "6 ay - 2 yil deneyim" },
      { value: "ileri-seviye", label: "Ileri Seviye", icon: Trophy, description: "2+ yil deneyim" },
    ],
  },
];

export default function SupplementWizardPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const queryParams = new URLSearchParams({
    ...(answers[0] && { gender: answers[0] }),
    ...(answers[1] && { goal: answers[1] }),
    ...(answers[2] && { experience: answers[2] }),
  }).toString();

  const { data: recommendations = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/wizard/recommendations", queryParams],
    enabled: showResults,
    queryFn: async () => {
      const res = await fetch(`/api/wizard/recommendations?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const handleSelect = (value: string) => {
    const newAnswers = { ...answers, [currentStep]: value };
    setAnswers(newAnswers);

    if (currentStep < STEPS.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
  };

  const progress = showResults ? 100 : ((currentStep + 1) / (STEPS.length + 1)) * 100;

  if (showResults) {
    return (
      <div className="min-h-[70vh] py-12" data-testid="wizard-results">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" /> Sana Özel Öneriler
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading mb-3" data-testid="text-wizard-results-title">
              Senin İçin Seçtiklerimiz
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Hedefin ve deneyim seviyene göre en uygun ürünleri senin için belirledik.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4 text-sm text-muted-foreground flex-wrap">
              {STEPS.map((step, idx) => {
                const selected = step.options.find(o => o.value === answers[idx]);
                if (!selected) return null;
                const Icon = selected.icon;
                return (
                  <span key={idx} className="px-3 py-1 bg-card border border-border rounded-full flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-primary" /> {selected.label}
                  </span>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border animate-pulse">
                  <div className="aspect-square bg-muted rounded-t-xl" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-6 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendations.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground mb-4">Kriterlere uygun ürün bulunamadı.</p>
              <p className="text-sm text-muted-foreground mb-6">Lütfen farklı bir hedef veya seviye seçmeyi deneyin.</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 mt-10">
            <Button variant="outline" onClick={handleReset} data-testid="button-wizard-reset">
              <RotateCcw className="w-4 h-4 mr-2" /> Tekrar Başla
            </Button>
            <Link href="/urunler">
              <Button className="neon-glow" data-testid="button-wizard-all-products">
                <ShoppingCart className="w-4 h-4 mr-2" /> Tüm Ürünleri Gör
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const step = STEPS[currentStep];

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-12" data-testid="wizard-page">
      <div className="max-w-2xl mx-auto px-4 w-full">
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Soru {currentStep + 1} / {STEPS.length}</span>
            <span>%{Math.round(progress)}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
              data-testid="wizard-progress"
            />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold font-heading mb-3" data-testid="text-wizard-step-title">
            {step.title}
          </h1>
          <p className="text-muted-foreground">{step.subtitle}</p>
        </div>

        <div className={`grid gap-4 ${step.options.length <= 2 ? "grid-cols-2" : step.options.length <= 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-3"}`}>
          {step.options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`group relative p-6 rounded-xl border-2 transition-all duration-300 text-center hover:border-primary hover:bg-primary/5 hover:scale-[1.02] ${
                  answers[currentStep] === option.value
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : "border-border bg-card"
                }`}
                data-testid={`button-wizard-option-${option.value}`}
              >
                <div className="flex justify-center mb-3">
                  <Icon className="w-10 h-10 text-primary" />
                </div>
                <span className="text-lg font-semibold block mb-1">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </button>
            );
          })}
        </div>

        {currentStep > 0 && (
          <div className="flex justify-center mt-8">
            <Button variant="ghost" onClick={handleBack} data-testid="button-wizard-back">
              <ArrowLeft className="w-4 h-4 mr-2" /> Geri
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
