"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteFaqAction, saveFaqAction } from "@/data-access/admin";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form-controls";

export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
}

function FaqItem({ faq, onDone }: { faq: FaqRow | null; onDone: () => void }) {
  const [v, setV] = useState({
    question: faq?.question ?? "",
    answer: faq?.answer ?? "",
    sortOrder: faq?.sort_order ?? 100,
    isPublished: faq?.is_published ?? true,
  });
  const [busy, setBusy] = useState<string | null>(null);
  const id = faq?.id ?? "new";
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-surface p-4">
      <Field label="السؤال" htmlFor={`q-${id}`}>
        <Input id={`q-${id}`} value={v.question} onChange={(e) => setV({ ...v, question: e.target.value })} />
      </Field>
      <Field label="الإجابة" htmlFor={`a-${id}`}>
        <Textarea id={`a-${id}`} value={v.answer} onChange={(e) => setV({ ...v, answer: e.target.value })} />
      </Field>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="الترتيب" htmlFor={`o-${id}`} className="w-28">
          <Input id={`o-${id}`} type="number" value={v.sortOrder} onChange={(e) => setV({ ...v, sortOrder: Number(e.target.value) || 0 })} />
        </Field>
        <label className="flex h-11 items-center gap-2 text-sm">
          <Checkbox checked={v.isPublished} onChange={(e) => setV({ ...v, isPublished: e.target.checked })} /> منشور
        </label>
        <Button
          disabled={!!busy}
          onClick={async () => {
            setBusy("save");
            const res = await saveFaqAction(faq?.id ?? null, v);
            setBusy(null);
            if (!res.ok) return void toast.error(res.error);
            toast.success("تم الحفظ");
            onDone();
          }}
        >
          {busy === "save" ? <Spinner /> : <Save />} حفظ
        </Button>
        {faq ? (
          <Button
            variant="danger-ghost"
            disabled={!!busy}
            onClick={async () => {
              if (!window.confirm("حذف هذا السؤال نهائيًا؟")) return;
              setBusy("del");
              const res = await deleteFaqAction(faq.id);
              setBusy(null);
              if (!res.ok) return void toast.error(res.error);
              toast.success("تم الحذف");
              onDone();
            }}
          >
            <Trash2 /> حذف
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function FaqManager({ faqs, onChanged }: { faqs: FaqRow[]; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const refresh = () => {
    setAdding(false);
    onChanged();
  };
  return (
    <div className="flex flex-col gap-4">
      {faqs.map((f) => <FaqItem key={f.id} faq={f} onDone={refresh} />)}
      {adding ? <FaqItem faq={null} onDone={refresh} /> : (
        <Button variant="outline" className="self-start" onClick={() => setAdding(true)}><Plus /> سؤال جديد</Button>
      )}
    </div>
  );
}
