import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEditorStore } from "../store/editor-store";

interface SettingsTabsProps {
  inhaltContent: React.ReactNode;
  styleContent: React.ReactNode;
  erweitertContent?: React.ReactNode;
}

/**
 * Tab-Container für Element-Settings: Inhalt | Style | Erweitert
 */
export function SettingsTabs({ inhaltContent, styleContent, erweitertContent }: SettingsTabsProps) {
  const settingsTab = useEditorStore((s) => s.settingsTab);
  const setSettingsTab = useEditorStore((s) => s.setSettingsTab);

  return (
    <Tabs value={settingsTab} onValueChange={(v) => setSettingsTab(v as "inhalt" | "style" | "erweitert")}>
      <TabsList className="w-full h-9 grid grid-cols-3">
        <TabsTrigger value="inhalt" className="text-xs">Inhalt</TabsTrigger>
        <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
        <TabsTrigger value="erweitert" className="text-xs">Erweitert</TabsTrigger>
      </TabsList>
      <TabsContent value="inhalt" className="mt-3 space-y-4">
        {inhaltContent}
      </TabsContent>
      <TabsContent value="style" className="mt-3 space-y-4">
        {styleContent}
      </TabsContent>
      <TabsContent value="erweitert" className="mt-3 space-y-4">
        {erweitertContent || (
          <p className="text-xs text-muted-foreground text-center py-4">
            Erweiterte Optionen folgen in einem späteren Update.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
