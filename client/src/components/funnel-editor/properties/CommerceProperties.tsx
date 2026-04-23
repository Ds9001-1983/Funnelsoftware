import { memo } from "react";
import { Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PropertiesProps } from "./types";

export const ProductProperties = memo(function ProductProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Produktname</Label>
        <Input
          value={element.productName || ""}
          onChange={(e) => onUpdate({ productName: e.target.value })}
          placeholder="Premium Coaching"
          className="text-sm h-8"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Preis</Label>
        <Input
          value={element.productPrice || ""}
          onChange={(e) => onUpdate({ productPrice: e.target.value })}
          placeholder="€ 997"
          className="text-sm h-8"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Produktbild URL</Label>
        <Input
          value={element.productImage || ""}
          onChange={(e) => onUpdate({ productImage: e.target.value })}
          placeholder="https://..."
          className="text-sm h-8"
        />
      </div>
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
        <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Produktbild hochladen</p>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Beschreibung</Label>
        <Textarea
          value={element.productDescription || ""}
          onChange={(e) => onUpdate({ productDescription: e.target.value })}
          placeholder="Kurze Produktbeschreibung..."
          rows={3}
          className="text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Button-Text</Label>
        <Input
          value={element.productButtonText || ""}
          onChange={(e) => onUpdate({ productButtonText: e.target.value })}
          placeholder="Jetzt kaufen"
          className="text-sm h-8"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Button-URL</Label>
        <Input
          value={element.productButtonUrl || ""}
          onChange={(e) => onUpdate({ productButtonUrl: e.target.value })}
          placeholder="https://checkout..."
          className="text-sm h-8"
        />
      </div>
    </div>
  );
});

export const TeamProperties = memo(function TeamProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Team-Mitglieder</Label>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            const members = element.teamMembers || [];
            onUpdate({
              teamMembers: [
                ...members,
                {
                  id: `member-${Date.now()}`,
                  name: "Neues Mitglied",
                  role: "Position",
                  image: "",
                },
              ],
            });
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Hinzufügen
        </Button>
      </div>
      <div className="space-y-3">
        {(element.teamMembers || []).map((member, idx) => (
          <div key={member.id} className="p-3 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Mitglied {idx + 1}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive"
                onClick={() => {
                  const members = [...(element.teamMembers || [])];
                  members.splice(idx, 1);
                  onUpdate({ teamMembers: members });
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <Input
              value={member.name}
              onChange={(e) => {
                const members = [...(element.teamMembers || [])];
                members[idx] = { ...members[idx], name: e.target.value };
                onUpdate({ teamMembers: members });
              }}
              placeholder="Name"
              className="text-sm h-8"
            />
            <Input
              value={member.role || ""}
              onChange={(e) => {
                const members = [...(element.teamMembers || [])];
                members[idx] = { ...members[idx], role: e.target.value };
                onUpdate({ teamMembers: members });
              }}
              placeholder="Position"
              className="text-sm h-8"
            />
            <Input
              value={member.image || ""}
              onChange={(e) => {
                const members = [...(element.teamMembers || [])];
                members[idx] = { ...members[idx], image: e.target.value };
                onUpdate({ teamMembers: members });
              }}
              placeholder="Bild-URL"
              className="text-sm h-8"
            />
          </div>
        ))}
        {(!element.teamMembers || element.teamMembers.length === 0) && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Noch keine Mitglieder. Klicke auf "Hinzufügen".
          </div>
        )}
      </div>
    </div>
  );
});
