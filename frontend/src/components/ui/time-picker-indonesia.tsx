"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface TimePickerIndonesiaProps {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export function TimePickerIndonesia({
  value,
  onChange,
  placeholder = "14:00",
  className,
  label,
  disabled = false,
}: TimePickerIndonesiaProps) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activePicker, setActivePicker] = useState<"hours" | "minutes" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  // Initialize from value
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setHours(d.getHours());
      setMinutes(d.getMinutes());
    } else {
      setHours(0);
      setMinutes(0);
    }
  }, [value]);

  // Scroll to selected value when picker opens
  useEffect(() => {
    if (isOpen && activePicker) {
      setTimeout(() => {
        const scrollContainer = activePicker === "hours" ? hoursRef.current : minutesRef.current;
        if (scrollContainer) {
          const selectedElement = scrollContainer.querySelector(`[data-value="${activePicker === "hours" ? hours : minutes}"]`);
          if (selectedElement) {
            selectedElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }, 100);
    }
  }, [isOpen, activePicker, hours, minutes]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActivePicker(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const updateTime = (newHours: number, newMinutes: number) => {
    const baseDate = value || new Date();
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const day = baseDate.getDate();
    
    const newDate = new Date(year, month, day, newHours, newMinutes, 0, 0);
    onChange(newDate);
  };

  const handleHoursChange = (newHours: number) => {
    setHours(newHours);
    updateTime(newHours, minutes);
  };

  const handleMinutesChange = (newMinutes: number) => {
    setMinutes(newMinutes);
    updateTime(hours, newMinutes);
  };

  const handleInputChange = (type: "hours" | "minutes", value: string) => {
    const numValue = parseInt(value) || 0;
    if (type === "hours") {
      const clamped = Math.max(0, Math.min(23, numValue));
      handleHoursChange(clamped);
    } else {
      const clamped = Math.max(0, Math.min(59, numValue));
      handleMinutesChange(clamped);
    }
  };

  const handleInputBlur = (type: "hours" | "minutes", value: string) => {
    const numValue = parseInt(value) || 0;
    if (type === "hours") {
      const clamped = Math.max(0, Math.min(23, numValue));
      setHours(clamped);
      updateTime(clamped, minutes);
    } else {
      const clamped = Math.max(0, Math.min(59, numValue));
      setMinutes(clamped);
      updateTime(hours, clamped);
    }
  };

  // Generate hours (0-23)
  const hoursList = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate minutes (0-59)
  const minutesList = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && (
        <Label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">{label}</Label>
      )}
      
      {/* Input Fields */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Hours Input */}
        <div className="relative flex-1 min-w-0">
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              value={String(hours).padStart(2, '0')}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 23)) {
                  handleInputChange("hours", val);
                }
              }}
              onBlur={(e) => {
                handleInputBlur("hours", e.target.value);
              }}
              onFocus={() => {
                setIsOpen(true);
                setActivePicker("hours");
              }}
              disabled={disabled}
              className="w-full h-8 sm:h-9 text-center pr-6 sm:pr-7 text-sm sm:text-base font-medium py-0"
              placeholder="00"
            />
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen || activePicker !== "hours");
                setActivePicker("hours");
              }}
              disabled={disabled}
              className="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 p-0.5 sm:p-1 hover:bg-accent rounded transition-colors"
            >
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" weight="duotone" />
            </button>
          </div>
        </div>

        <span className="text-base sm:text-lg font-semibold text-muted-foreground">:</span>

        {/* Minutes Input */}
        <div className="relative flex-1 min-w-0">
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              value={String(minutes).padStart(2, '0')}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                  handleInputChange("minutes", val);
                }
              }}
              onBlur={(e) => {
                handleInputBlur("minutes", e.target.value);
              }}
              onFocus={() => {
                setIsOpen(true);
                setActivePicker("minutes");
              }}
              disabled={disabled}
              className="w-full h-8 sm:h-9 text-center pr-6 sm:pr-7 text-sm sm:text-base font-medium py-0"
              placeholder="00"
            />
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen || activePicker !== "minutes");
                setActivePicker("minutes");
              }}
              disabled={disabled}
              className="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 p-0.5 sm:p-1 hover:bg-accent rounded transition-colors"
            >
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" weight="duotone" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Picker Dropdown */}
      {isOpen && !disabled && activePicker && (
        <div className="absolute z-50 mt-1 left-0 right-0 sm:left-auto sm:right-0 sm:w-48 bg-popover border rounded-md shadow-lg">
          <div className="p-1.5 sm:p-2">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2 px-1">
              <span className="text-xs sm:text-sm font-medium">
                {activePicker === "hours" ? "Jam" : "Menit"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setActivePicker(null);
                }}
                className="text-[10px] sm:text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-accent transition-colors"
              >
                Tutup
              </button>
            </div>
            
            <div className="relative">
              {/* Hours Picker */}
              {activePicker === "hours" && (
                <div
                  ref={hoursRef}
                  className="max-h-40 sm:max-h-48 overflow-y-auto scroll-smooth snap-y snap-mandatory"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--muted) transparent',
                  }}
                >
                  <div className="py-16 sm:py-20">
                    {hoursList.map((h) => {
                      const isSelected = h === hours;
                      return (
                        <button
                          key={h}
                          type="button"
                          data-value={h}
                          onClick={() => {
                            handleHoursChange(h);
                            setIsOpen(false);
                            setActivePicker(null);
                          }}
                          className={cn(
                            "w-full px-2 sm:px-3 py-1.5 sm:py-2 text-center rounded-md transition-all snap-center text-xs sm:text-sm",
                            isSelected
                              ? "bg-primary text-primary-foreground font-semibold scale-105"
                              : "hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          {String(h).padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Minutes Picker */}
              {activePicker === "minutes" && (
                <div
                  ref={minutesRef}
                  className="max-h-40 sm:max-h-48 overflow-y-auto scroll-smooth snap-y snap-mandatory"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--muted) transparent',
                  }}
                >
                  <div className="py-16 sm:py-20">
                    {minutesList.map((m) => {
                      const isSelected = m === minutes;
                      return (
                        <button
                          key={m}
                          type="button"
                          data-value={m}
                          onClick={() => {
                            handleMinutesChange(m);
                            setIsOpen(false);
                            setActivePicker(null);
                          }}
                          className={cn(
                            "w-full px-2 sm:px-3 py-1.5 sm:py-2 text-center rounded-md transition-all snap-center text-xs sm:text-sm",
                            isSelected
                              ? "bg-primary text-primary-foreground font-semibold scale-105"
                              : "hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          {String(m).padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
