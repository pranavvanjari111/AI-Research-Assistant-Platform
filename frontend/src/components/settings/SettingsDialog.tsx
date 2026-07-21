import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { AppConfig } from "@/types";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AppConfig;
  onChange: (config: AppConfig) => void;
}

export function SettingsDialog({ open, onOpenChange, config, onChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuration</DialogTitle>
          <DialogDescription>Controls how retrieval and generation behave.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <Field label="LLM">
            <Select value={config.llm} onValueChange={(v) => onChange({ ...config, llm: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o mini</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Embedding model">
            <Select
              value={config.embeddingModel}
              onValueChange={(v) => onChange({ ...config, embeddingModel: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
                <SelectItem value="text-embedding-3-large">text-embedding-3-large</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Retriever">
            <Select
              value={config.retriever}
              onValueChange={(v) => onChange({ ...config, retriever: v as AppConfig["retriever"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="similarity">Similarity</SelectItem>
                <SelectItem value="mmr">MMR</SelectItem>
                <SelectItem value="compression">Compression retriever</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label={`Top K · ${config.topK}`}>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[config.topK]}
              onValueChange={([v]) => onChange({ ...config, topK: v })}
            />
          </Field>

          <Field label={`Temperature · ${config.temperature.toFixed(1)}`}>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[config.temperature]}
              onValueChange={([v]) => onChange({ ...config, temperature: v })}
            />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground/80">{label}</label>
      {children}
    </div>
  );
}
