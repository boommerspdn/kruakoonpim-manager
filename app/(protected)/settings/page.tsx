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
  subModel: string | null;
  modelOptions: string[];
};

type CacheEntry = {
  name: string;
  displayName?: string;
  model?: string;
  createTime?: string;
  expireTime?: string;
  usageMetadata?: { totalTokenCount?: number };
};

const SAME_AS_MAIN = "__same__";

function uniq(items: string[]) {
  return Array.from(new Set(items));
}

export default function SettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [provider, setProvider] = React.useState<GeminiProvider>("vertex");
  const [model, setModel] = React.useState<string>("");
  const [subModel, setSubModel] = React.useState<string | null>(null);
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
      setSubModel(data.subModel);
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
      const payload: GeminiSettingsDto = {
        provider: next?.provider ?? provider,
        model: next?.model ?? model,
        subModel: next?.subModel !== undefined ? next.subModel : subModel,
        modelOptions: next?.modelOptions ?? modelOptions,
      };

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
        setSubModel(data.subModel);
        setModelOptions(Array.isArray(data.modelOptions) ? data.modelOptions : []);
      }

      toast.success("บันทึกตั้งค่า Gemini สำเร็จ");
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
    if (name === subModel) {
      toast.error("ไม่สามารถลบ Sub-model ที่ถูกเลือกปัจจุบันได้");
      return;
    }
    setModelOptions(modelOptions.filter((m) => m !== name));
  }

  const [caches, setCaches] = React.useState<CacheEntry[]>([]);
  const [cachesLoading, setCachesLoading] = React.useState(false);
  const [deletingCache, setDeletingCache] = React.useState<string | null>(null);

  async function loadCaches() {
    setCachesLoading(true);
    try {
      const res = await fetch("/api/settings/gemini/caches", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load caches");
      const data = (await res.json()) as { caches: CacheEntry[] };
      setCaches(data.caches);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load caches";
      toast.error(message);
    } finally {
      setCachesLoading(false);
    }
  }

  async function deleteCache(name: string) {
    setDeletingCache(name);
    try {
      const res = await fetch("/api/settings/gemini/caches", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "Failed to delete cache");
      }
      setCaches((prev) => prev.filter((c) => c.name !== name));
      toast.success("ลบ Cache สำเร็จ");
    } catch (e) {
      const message = e instanceof Error ? e.message : "ลบ Cache ไม่สำเร็จ";
      toast.error(message);
    } finally {
      setDeletingCache(null);
    }
  }

  async function deleteAllCaches() {
    if (caches.length === 0) return;
    setCachesLoading(true);
    try {
      await Promise.all(
        caches.map((c) =>
          fetch("/api/settings/gemini/caches", {
            method: "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: c.name }),
          }),
        ),
      );
      setCaches([]);
      toast.success("ลบ Cache ทั้งหมดสำเร็จ");
    } catch {
      toast.error("ลบ Cache บางรายการไม่สำเร็จ");
      void loadCaches();
    } finally {
      setCachesLoading(false);
    }
  }

  const disabled = loading || saving;

  return (
    <div className="p-4 lg:p-6 space-y-6">
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
            <Label>Model (หน้าแรก)</Label>
            <p className="text-xs text-muted-foreground">
              ใช้สำหรับหน้าแรก (อ่านเมนู + ออเดอร์)
            </p>
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
            <Label>Sub-model (หน้า 2+)</Label>
            <p className="text-xs text-muted-foreground">
              ใช้สำหรับหน้าถัดไป (อ่านออเดอร์อย่างเดียว) — เลือก Flash เพื่อความเร็ว
            </p>
            <Select
              value={subModel ?? SAME_AS_MAIN}
              onValueChange={(v) => setSubModel(v === SAME_AS_MAIN ? null : v)}
              disabled={disabled || modelOptions.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sub-model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SAME_AS_MAIN}>
                  ใช้ Model เดียวกับหน้าแรก
                </SelectItem>
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
                    disabled={disabled || m === model || m === subModel}
                    title={
                      m === model
                        ? "Selected model cannot be removed"
                        : m === subModel
                          ? "Selected sub-model cannot be removed"
                          : "Remove model"
                    }
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

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Gemini Context Cache</CardTitle>
          <CardDescription>
            จัดการ cache ที่ถูกสร้างจากการประมวลผลรูปภาพ — ลดค่าใช้จ่าย token
            สำหรับ prompt ที่ซ้ำกัน
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {cachesLoading ? (
            <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
          ) : caches.length === 0 ? (
            <p className="text-sm text-muted-foreground">ไม่พบ Cache</p>
          ) : (
            <div className="space-y-3">
              {caches.map((c) => (
                <div
                  key={c.name}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 space-y-1 text-sm">
                    <p className="font-medium truncate">
                      {c.displayName || c.name}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {c.model && <span>Model: {c.model}</span>}
                      {c.usageMetadata?.totalTokenCount != null && (
                        <span>
                          Tokens: {c.usageMetadata.totalTokenCount.toLocaleString()}
                        </span>
                      )}
                      {c.createTime && (
                        <span>
                          สร้างเมื่อ:{" "}
                          {new Date(c.createTime).toLocaleString("th-TH")}
                        </span>
                      )}
                      {c.expireTime && (
                        <span>
                          หมดอายุ:{" "}
                          {new Date(c.expireTime).toLocaleString("th-TH")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive"
                    disabled={deletingCache === c.name}
                    onClick={() => void deleteCache(c.name!)}
                  >
                    {deletingCache === c.name ? "กำลังลบ..." : "ลบ"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadCaches()}
            disabled={cachesLoading}
          >
            {cachesLoading ? "กำลังโหลด..." : "โหลด Cache"}
          </Button>
          {caches.length > 0 && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => void deleteAllCaches()}
              disabled={cachesLoading}
            >
              ลบทั้งหมด ({caches.length})
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
