"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODEL_REGISTRY } from "@/lib/ai/modelRegistry";
import type { ResponseStyle, SettingsState } from "@/store";

const ALLOWED_AI_MODELS = ["groq/compound", "gemini-3.1-flash-lite", "gemma-4-26b-a4b-it"];

interface AiSectionProps {
  settings: {
    defaultAiModel: string;
    responseStyle: ResponseStyle;
    showBiasBadges: boolean;
    showSentiment: boolean;
  };
  onSettingChange: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}

export default function AiSection({ settings, onSettingChange }: AiSectionProps) {
  const aiModels = MODEL_REGISTRY.filter(m => ALLOWED_AI_MODELS.includes(m.id));

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI & Analysis</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the AI assistant and analysis transparency.
        </p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Default AI Model</Label>
              <p className="text-sm text-muted-foreground">
                Choose which model powers your chat sessions.
              </p>
            </div>
            <Select
              value={ALLOWED_AI_MODELS.includes(settings.defaultAiModel) ? settings.defaultAiModel : "groq/compound"}
              onValueChange={(v) => onSettingChange("defaultAiModel", v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {aiModels.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Response Style</Label>
              <p className="text-sm text-muted-foreground">
                Preferred format for AI summaries and chat.
              </p>
            </div>
            <Select
              value={settings.responseStyle}
              onValueChange={(v: ResponseStyle) =>
                onSettingChange("responseStyle", v)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise (Bullets)</SelectItem>
                <SelectItem value="detailed">
                  Detailed (Paragraphs)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Bias Transparency</Label>
              <p className="text-sm text-muted-foreground">
                Show perspective and bias badges on news articles.
              </p>
            </div>
            <Switch
              checked={settings.showBiasBadges}
              onCheckedChange={(checked) =>
                onSettingChange("showBiasBadges", checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Sentiment Analysis</Label>
              <p className="text-sm text-muted-foreground">
                Display detected sentiment on article previews.
              </p>
            </div>
            <Switch
              checked={settings.showSentiment}
              onCheckedChange={(checked) =>
                onSettingChange("showSentiment", checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
