"use client";

import * as React from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GeminiProvider = "vertex" | "studio";

type GeminiSettingsDto = {
  provider: GeminiProvider;
  model: string;
  modelOptions: string[];
};

function uniq(items: string[]) {
  return Array.from(new Set(items));
}

export default function SettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [provider, setProvider] = React.useState<GeminiProvider>("vertex");
  const [model, setModel] = React.useState<string>("");
  const [modelOptions, setModelOptions] = React.useState<string[]>([]);
  const [newModel, setNewModel] = React.useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/gemini", { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "Failed to load settings");
      }
      const data = (await res.json()) as GeminiSettingsDto;
      setProvider(data.provider);
      setModel(data.model);
      setModelOptions(Array.isArray(data.modelOptions) ? data.modelOptions : []);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load settings";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  async function save(next?: Partial<GeminiSettingsDto>) {
    setSaving(true);
    try {
      const payload = {
        provider: next?.provider ?? provider,
        model: next?.model ?? model,
        modelOptions: next?.modelOptions ?? modelOptions,
      } satisfies GeminiSettingsDto;

      const res = await fetch("/api/settings/gemini", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as
        | (GeminiSettingsDto & { message?: string })
        | null;

      if (!res.ok) {
        throw new Error(data?.message ?? "บันทึกตั้งค่า Gemini ไม่สำเร็จ");
      }

      if (data) {
        setProvider(data.provider);
        setModel(data.model);
        setModelOptions(Array.isArray(data.modelOptions) ? data.modelOptions : []);
      }

      toast.success("Saved Gemini settings");
    } catch (e) {
      const message = e instanceof Error ? e.message : "บันทึกตั้งค่า Gemini ไม่สำเร็จ";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function addModel() {
    const trimmed = newModel.trim();
    if (!trimmed) return;

    const nextOptions = uniq([...modelOptions, trimmed]);
    setModelOptions(nextOptions);
    setModel(trimmed);
    setNewModel("");
  }

  function removeModel(name: string) {
    if (name === model) {
      toast.error("ไม่สามารถลบ Model ที่ถูกเลือกปัจจุบันได้");
      return;
    }
    setModelOptions(modelOptions.filter((m) => m !== name));
  }

  const disabled = loading || saving;

  return (
    <div className="p-4 lg:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>ตั้งค่า Gemini</CardTitle>
          <CardDescription>
            เลือก provider (Vertex/Studio) และจัดการ model ที่สามารถเลือกได้
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={provider}
              onValueChange={(v) => setProvider(v as GeminiProvider)}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vertex">vertex</SelectItem>
                <SelectItem value="studio">studio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <Select
              value={model}
              onValueChange={(v) => setModel(v)}
              disabled={disabled || modelOptions.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>เพิ่ม Model</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. gemini-3.1-pro-preview"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                disabled={disabled}
              />
              <Button type="button" variant="outline" onClick={addModel} disabled={disabled}>
                เพิ่ม
              </Button>
            </div>
            {modelOptions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {modelOptions.map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeModel(m)}
                    disabled={disabled || m === model}
                    title={m === model ? "Selected model cannot be removed" : "Remove model"}
                  >
                    {m}
                    <span className="text-muted-foreground">×</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="justify-between gap-2">
          <Button type="button" variant="outline" onClick={load} disabled={disabled}>
            รีเฟรช
          </Button>
          <Button type="button" onClick={() => void save()} disabled={disabled || !model}>
            บันทึก
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}