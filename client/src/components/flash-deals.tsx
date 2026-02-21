import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Timer, Zap, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FlashDeal } from "@shared/schema";

function CountdownTimer({ endDate }: { endDate: string | Date }) {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const distance = end - now;

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  const padZero = (num: number) => String(num).padStart(2, "0");

  return (
    <div
      className="flex items-center gap-1 text-xs font-bold animate-pulse"
      data-testid="countdown-timer"
    >
      <Timer className="w-3.5 h-3.5 text-[#39FF14]" />
      <span className="text-[#39FF14]" data-testid="countdown-days">
        {padZero(countdown.days)}
      </span>
      <span className="text-[#39FF14]">:</span>
      <span className="text-[#39FF14]" data-testid="countdown-hours">
        {padZero(countdown.hours)}
      </span>
      <span className="text-[#39FF14]">:</span>
      <span className="text-[#39FF14]" data-testid="countdown-minutes">
        {padZero(countdown.minutes)}
      </span>
      <span className="text-[#39FF14]">:</span>
      <span className="text-[#39FF14]" data-testid="countdown-seconds">
        {padZero(countdown.seconds)}
      </span>
    </div>
  );
}

function FlashDealCard({ deal }: { deal: FlashDeal }) {
  const productIds = Array.isArray(deal.productIds)
    ? deal.productIds
    : deal.productIds
    ? [deal.productIds]
    : [];
  const firstProductId = productIds[0];
  const hasLink = firstProductId !== undefined && firstProductId !== null;

  const cardContent = (
    <div className="flex flex-col h-full" data-testid={`card-flash-deal-${deal.id}`}>
      {deal.image && (
        <div className="relative w-full aspect-video overflow-hidden rounded-t-lg mb-3 bg-muted flex-shrink-0">
          <img
            src={deal.image}
            alt={deal.title}
            className="w-full h-full object-cover"
            data-testid={`image-deal-${deal.id}`}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-sm font-bold text-card-foreground line-clamp-2 flex-1"
            data-testid={`text-deal-title-${deal.id}`}
          >
            {deal.title}
          </h3>
          {deal.discountValue && (
            <Badge
              className="flex-shrink-0 bg-[#39FF14] text-black text-xs font-bold px-1.5 py-0.5"
              data-testid={`badge-discount-${deal.id}`}
            >
              <Zap className="w-2.5 h-2.5 mr-0.5" />
              {deal.discountType === "percentage" ? `%${deal.discountValue}` : `${deal.discountValue} TRY`}
            </Badge>
          )}
        </div>

        {deal.description && (
          <p
            className="text-xs text-muted-foreground line-clamp-2"
            data-testid={`text-deal-description-${deal.id}`}
          >
            {deal.description}
          </p>
        )}

        <div className="mt-auto pt-2 flex flex-col gap-2">
          <div data-testid={`countdown-container-${deal.id}`}>
            <p className="text-[10px] text-muted-foreground mb-1">Kalan Süre</p>
            <CountdownTimer endDate={deal.endDate} />
          </div>

          {hasLink && (
            <Link href={`/urun?deal=${deal.id}`}>
              <Button
                size="sm"
                className="w-full h-7 text-xs bg-[#39FF14] text-black hover:bg-[#39FF14] font-bold"
                data-testid={`button-view-deal-${deal.id}`}
              >
                Ürünleri Gör <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="flex-shrink-0 w-72 bg-card border-border rounded-lg overflow-hidden hover-elevate">
      {cardContent}
    </Card>
  );
}

export default function FlashDeals() {
  const { data: deals, isLoading } = useQuery({
    queryKey: ["/api/flash-deals"],
  });

  const activeDealsList = deals
    ? (deals as FlashDeal[]).filter(
        (deal) =>
          deal.isActive &&
          new Date(deal.endDate).getTime() > new Date().getTime()
      )
    : [];

  if (!activeDealsList || activeDealsList.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-background py-4 px-4" data-testid="flash-deals-banner">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-[#39FF14]" data-testid="icon-flash" />
          <h2 className="text-lg font-bold text-foreground" data-testid="heading-flash">
            Flash İndirimler
          </h2>
        </div>

        <div
          className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
          data-testid="carousel-flash-deals"
        >
          {activeDealsList.map((deal) => (
            <FlashDealCard key={deal.id} deal={deal} data-testid={`deal-card-wrapper-${deal.id}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
