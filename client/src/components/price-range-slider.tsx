import { useState, useRef, useEffect } from "react";

interface PriceRangeSliderProps {
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  minBound?: number;
  maxBound?: number;
}

export default function PriceRangeSlider({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minBound = 0,
  maxBound = 5000,
}: PriceRangeSliderProps) {
  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);
  const [minVal, setMinVal] = useState(minValue ? Number(minValue) : minBound);
  const [maxVal, setMaxVal] = useState(maxValue ? Number(maxValue) : maxBound);

  useEffect(() => {
    if (minValue) setMinVal(Number(minValue));
  }, [minValue]);

  useEffect(() => {
    if (maxValue) setMaxVal(Number(maxValue));
  }, [maxValue]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value <= maxVal) {
      setMinVal(value);
      onMinChange(String(value));
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value >= minVal) {
      setMaxVal(value);
      onMaxChange(String(value));
    }
  };

  const minPercent = ((minVal - minBound) / (maxBound - minBound)) * 100;
  const maxPercent = ((maxVal - minBound) / (maxBound - minBound)) * 100;

  return (
    <div className="space-y-4" data-testid="price-range-slider">
      <div className="relative h-2 bg-muted rounded-full">
        <div
          className="absolute h-full bg-primary rounded-full"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
          data-testid="slider-track"
        />
        <input
          ref={minInputRef}
          type="range"
          min={minBound}
          max={maxBound}
          value={minVal}
          onChange={handleMinChange}
          className="absolute w-full h-full opacity-0 cursor-pointer pointer-events-none"
          style={{ zIndex: minVal > maxBound - (maxBound - minBound) / 2 ? 5 : 3 }}
          data-testid="input-min-price"
        />
        <input
          ref={maxInputRef}
          type="range"
          min={minBound}
          max={maxBound}
          value={maxVal}
          onChange={handleMaxChange}
          className="absolute w-full h-full opacity-0 cursor-pointer pointer-events-none"
          style={{ zIndex: 4 }}
          data-testid="input-max-price"
        />
        <div
          className="absolute top-0 -translate-x-1/2 -translate-y-2 pointer-events-none"
          style={{ left: `${minPercent}%` }}
        >
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-1 rounded whitespace-nowrap">
              {minVal.toLocaleString("tr-TR")} ₺
            </span>
            <div className="w-3 h-3 bg-primary rounded-full border-2 border-background" />
          </div>
        </div>
        <div
          className="absolute top-0 -translate-x-1/2 -translate-y-2 pointer-events-none"
          style={{ left: `${maxPercent}%` }}
        >
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-1 rounded whitespace-nowrap">
              {maxVal.toLocaleString("tr-TR")} ₺
            </span>
            <div className="w-3 h-3 bg-primary rounded-full border-2 border-background" />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Min</label>
          <input
            type="number"
            value={minVal}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value <= maxVal) {
                setMinVal(value);
                onMinChange(String(value));
              }
            }}
            className="w-full px-2 py-1.5 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Min"
            data-testid="input-min-value"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Max</label>
          <input
            type="number"
            value={maxVal}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= minVal) {
                setMaxVal(value);
                onMaxChange(String(value));
              }
            }}
            className="w-full px-2 py-1.5 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Max"
            data-testid="input-max-value"
          />
        </div>
      </div>
    </div>
  );
}
