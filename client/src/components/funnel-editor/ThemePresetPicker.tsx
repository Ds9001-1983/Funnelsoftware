import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { themePresets, type ThemePreset } from "@/lib/design-system";

interface ThemePresetPickerProps {
  selectedThemeId: string;
  onSelectTheme: (themeId: string) => void;
}

export function ThemePresetPicker({
  selectedThemeId,
  onSelectTheme,
}: ThemePresetPickerProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Farbpalette</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {themePresets.map((preset) => (
            <ThemePresetCard
              key={preset.id}
              preset={preset}
              isSelected={preset.id === selectedThemeId}
              onSelect={() => onSelectTheme(preset.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ThemePresetCard({
  preset,
  isSelected,
  onSelect,
}: {
  preset: ThemePreset;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { palette } = preset;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        relative rounded-lg border-2 p-3 text-left transition-all
        hover:shadow-md cursor-pointer
        ${isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-muted-foreground/30"
        }
      `}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 rounded-full bg-primary p-0.5">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}

      {/* Farbvorschau */}
      <div className="mb-2 flex gap-1">
        {[palette.primary, palette.secondary, palette.accent, palette.background, palette.text].map(
          (color, i) => (
            <div
              key={i}
              className="h-5 flex-1 rounded-sm"
              style={{ backgroundColor: color }}
            />
          )
        )}
      </div>

      {/* Name und Beschreibung */}
      <p className="text-xs font-medium">{preset.name}</p>
      <p className="text-[10px] text-muted-foreground">{preset.description}</p>
    </button>
  );
}
