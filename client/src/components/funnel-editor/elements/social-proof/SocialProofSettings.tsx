import type { ElementSettingsProps } from "../../registry/element-registry";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SocialProofSettings({ element, onUpdate }: ElementSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="social-proof-type">Typ</Label>
        <Select
          value={element.socialProofType ?? "badges"}
          onValueChange={(value) => onUpdate({ socialProofType: value as "badges" | "logos" | "stats" | "reviews" })}
        >
          <SelectTrigger id="social-proof-type">
            <SelectValue placeholder="Typ wählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="badges">Badges</SelectItem>
            <SelectItem value="logos">Logos</SelectItem>
            <SelectItem value="stats">Stats</SelectItem>
            <SelectItem value="reviews">Reviews</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
