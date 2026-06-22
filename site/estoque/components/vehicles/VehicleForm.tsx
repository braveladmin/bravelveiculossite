"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@heroui/react";
import { GripVertical, ImagePlus, Loader2, Plus, Star, Trash2, X } from "lucide-react";
import type { Vehicle, VehicleStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { formatCurrencyInput, maskCurrencyInput, parseCurrencyInput } from "@/lib/format";
import { CATEGORIES } from "@/lib/constants";

const SURF2   = "#111111";
const BORDER  = "rgba(255,255,255,0.08)";
const MUTED   = "#777777";
const TEXT    = "#ffffff";
const DANGER  = "#a80e0e";
const ACCENT  = "#cc1111";
const YELLOW  = "#ffae1f";

export type VehicleFormData = Omit<Vehicle, "id" | "createdAt" | "archivedAt">;

type Props = {
  defaultValues?: Partial<VehicleFormData>;
  onSubmit: (data: VehicleFormData) => void;
  loading?: boolean;
  cancelHref?: string;
  submitLabel?: string;
};

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503736334956-4c8f8e4733e7?w=800&q=80&auto=format&fit=crop";

const TRANSMISSION_OPTIONS = ["Automático", "Manual", "Automatizado", "CVT"];
const FUEL_OPTIONS       = ["Flex", "Gasolina", "Álcool", "Diesel", "Elétrico", "Híbrido"];
const DOORS_OPTIONS      = [2, 3, 4, 5];
const COLOR_OPTIONS      = [
  "Branco", "Preto", "Prata", "Cinza", "Vermelho", "Azul", "Verde",
  "Amarelo", "Laranja", "Marrom", "Bege", "Dourado", "Outra",
];

const OPTIONALS_LIST = [
  "Ar condicionado", "Ar digital", "Direção elétrica", "Direção hidráulica",
  "Vidros elétricos", "Travas elétricas", "Retrovisores elétricos", "Câmera de ré",
  "Sensor de estacionamento", "Sensor de chuva", "Central multimídia",
  "Bluetooth", "GPS / Navegador", "Banco de couro", "Bancos aquecidos",
  "Teto solar", "Teto panorâmico", "Rodas de liga leve", "Airbag duplo",
  "Airbag lateral", "ABS", "Controle de tração", "Controle de estabilidade",
  "Piloto automático", "Freio a disco nas 4 rodas", "Volante multifuncional",
  "Keyless Entry / Start", "Computador de bordo", "Start/Stop automático",
  "Carregador wireless", "Apple CarPlay / Android Auto", "Kit multimídia original",
  "4×4 / AWD / Tração integral", "Blindagem", "GNV instalado",
];

// ── Native field primitives ───────────────────────────────────────────────────

const labelCls    = "text-[10px] font-bold tracking-[0.12em] uppercase";
const inputBaseCls =
  "w-full h-10 rounded-[10px] px-3 text-[13px] outline-none border transition-colors appearance-none";

function DInput({
  label, error, hint, ...rest
}: { label: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelCls} style={{ color: MUTED }}>{label}</span>
      <input
        className={inputBaseCls}
        style={{ backgroundColor: SURF2, borderColor: error ? DANGER : BORDER, color: TEXT, caretColor: ACCENT }}
        onFocus={(e) => { e.currentTarget.style.borderColor = ACCENT; }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = error ? DANGER : BORDER; }}
        {...rest}
      />
      {error  && <span className="text-[11px]" style={{ color: DANGER }}>{error}</span>}
      {!error && hint && <span className="text-[11px]" style={{ color: MUTED }}>{hint}</span>}
    </div>
  );
}

function DSelect({ label, children, ...rest }: { label: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelCls} style={{ color: MUTED }}>{label}</span>
      <select className={inputBaseCls} style={{ backgroundColor: SURF2, borderColor: BORDER, color: TEXT }} {...rest}>
        {children}
      </select>
    </div>
  );
}

function DSectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-[13px] font-bold" style={{ color: TEXT }}>{children}</h2>;
}

// ── Photo manager (uploads to Supabase Storage) ───────────────────────────────

function PhotoManager({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const fileRef            = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [draggedSrc, setDraggedSrc] = useState<string | null>(null);

  function openPicker() {
    fileRef.current?.click();
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setUploadErr(null);

    const supabase = createClient();
    const urls: string[] = [];

    for (const file of files) {
      const ext  = file.name.split(".").pop() ?? "jpg";
      const path = `vehicles/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("vehicle-images")
        .upload(path, file, { upsert: false, contentType: file.type });

      if (error) {
        setUploadErr(`Erro ao enviar ${file.name}: ${error.message}`);
        setUploading(false);
        e.target.value = "";
        return;
      }

      const { data } = supabase.storage.from("vehicle-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    onChange([...images, ...urls]);
    setUploading(false);
    e.target.value = "";
  }

  function remove(i: number) {
    onChange(images.filter((_, idx) => idx !== i));
  }

  function setCover(i: number) {
    const reordered = [...images];
    const [item] = reordered.splice(i, 1);
    reordered.unshift(item);
    onChange(reordered);
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function handleDragOver(i: number) {
    if (!draggedSrc) return;
    const from = images.indexOf(draggedSrc);
    if (from === -1 || from === i) return;
    reorder(from, i);
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      <div className="flex items-center justify-between">
        <div>
          <span className={labelCls} style={{ color: MUTED }}>Fotos do carro</span>
          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
            A primeira foto vira a capa. Arraste as fotos para reordenar.
          </p>
        </div>
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          className="h-9 px-4 rounded-[10px] flex items-center gap-1.5 text-[12px] font-bold transition-colors shrink-0"
          style={{ backgroundColor: "rgba(204,17,17,0.15)", color: ACCENT, border: `1px solid rgba(204,17,17,0.3)` }}
        >
          {uploading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <ImagePlus className="w-3.5 h-3.5" />
          }
          {uploading ? "Enviando…" : "Adicionar fotos"}
        </button>
      </div>

      {uploadErr && (
        <p className="text-[11px]" style={{ color: DANGER }}>{uploadErr}</p>
      )}

      {images.length > 0 ? (
        <motion.div layout className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((src, i) => (
            <motion.div
              key={src}
              layout
              transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.6 }}
              draggable
              onDragStart={() => setDraggedSrc(src)}
              onDragOver={(e) => { e.preventDefault(); handleDragOver(i); }}
              onDrop={(e) => e.preventDefault()}
              onDragEnd={() => setDraggedSrc(null)}
              className="relative rounded-xl overflow-hidden group cursor-grab active:cursor-grabbing"
              style={{
                aspectRatio: "4/3",
                opacity: draggedSrc === src ? 0.5 : 1,
                scale: draggedSrc === src ? 0.95 : 1,
                zIndex: draggedSrc === src ? 10 : 1,
                boxShadow: draggedSrc === src ? "0 8px 24px rgba(0,0,0,0.5)" : "none",
              }}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
              />
              <div className="absolute top-1.5 right-1.5 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                <GripVertical className="w-3 h-3" style={{ color: "rgba(255,255,255,0.8)" }} />
              </div>
              {i === 0 && (
                <span
                  className="absolute top-1.5 left-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: "rgba(0,0,0,0.7)", color: YELLOW }}
                >
                  CAPA
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => setCover(i)}
                    className="rounded-lg p-1.5"
                    style={{ backgroundColor: "rgba(255,174,31,0.2)", color: YELLOW }}
                    title="Tornar capa"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded-lg p-1.5"
                  style={{ backgroundColor: "rgba(168,14,14,0.2)", color: DANGER }}
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
          <button
            type="button"
            onClick={openPicker}
            className="rounded-xl flex flex-col items-center justify-center gap-1 transition-colors hover:border-blue-400/50"
            style={{ aspectRatio: "4/3", border: `2px dashed ${BORDER}`, color: MUTED }}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px]">Mais fotos</span>
          </button>
        </motion.div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="w-full rounded-xl flex flex-col items-center justify-center gap-2 py-10 transition-colors hover:border-blue-400/40"
          style={{ border: `2px dashed ${BORDER}`, color: MUTED }}
        >
          <ImagePlus className="w-8 h-8" />
          <span className="text-[13px] font-semibold" style={{ color: TEXT }}>Clique para selecionar fotos</span>
          <span className="text-[11px]">JPG, PNG, WEBP — pode selecionar várias de uma vez</span>
        </button>
      )}
    </div>
  );
}

// ── Optionals chips ───────────────────────────────────────────────────────────

function OptionalsSelector({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  function toggle(opt: string) {
    if (selected.includes(opt)) {
      onChange(selected.filter((o) => o !== opt));
    } else {
      onChange([...selected, opt]);
    }
  }

  return (
    <div className="space-y-2">
      <span className={labelCls} style={{ color: MUTED }}>Opcionais</span>
      <p className="text-[11px]" style={{ color: MUTED }}>Clique para marcar. Pode marcar quantos quiser.</p>
      <div className="flex flex-wrap gap-2">
        {OPTIONALS_LIST.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
              style={{
                backgroundColor: active ? "rgba(204,17,17,0.2)" : "rgba(255,255,255,0.04)",
                color:           active ? ACCENT : MUTED,
                border:          `1px solid ${active ? "rgba(204,17,17,0.4)" : BORDER}`,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Premium toggle ────────────────────────────────────────────────────────────

function PremiumToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3"
      style={{ backgroundColor: value ? "rgba(255,174,31,0.08)" : SURF2, border: `1px solid ${value ? "rgba(255,174,31,0.3)" : BORDER}` }}
    >
      <div>
        <p className="text-[13px] font-semibold" style={{ color: value ? YELLOW : TEXT }}>
          <Star className="inline w-4 h-4 mr-1.5" />
          Carro premium
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Destaque especial no estoque</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative rounded-full transition-colors shrink-0"
        style={{ width: "44px", height: "24px", backgroundColor: value ? YELLOW : BORDER }}
      >
        <span
          className="absolute rounded-full transition-all"
          style={{ width: "18px", height: "18px", backgroundColor: "#fff", left: value ? "23px" : "3px", top: "3px" }}
        />
      </button>
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────

export function VehicleForm({
  defaultValues,
  onSubmit,
  loading     = false,
  cancelHref  = "/estoque",
  submitLabel = "Cadastrar carro",
}: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    name:         defaultValues?.name         ?? "",
    brand:        defaultValues?.brand        ?? "",
    model:        defaultValues?.model        ?? "",
    color:        defaultValues?.color        ?? "",
    category:     defaultValues?.category     ?? "",
    year:         defaultValues?.year?.toString()         ?? new Date().getFullYear().toString(),
    yearModel:    defaultValues?.yearModel?.toString()    ?? "",
    km:           defaultValues?.km?.toString()           ?? "0",
    transmission: defaultValues?.transmission ?? "Automático",
    fuel:         defaultValues?.fuel         ?? "Flex",
    doors:        defaultValues?.doors?.toString()        ?? "4",
    motor:        defaultValues?.motor        ?? "",
    price:        defaultValues?.price        ? formatCurrencyInput(defaultValues.price) : "",
    status:       (defaultValues?.status ?? "disponivel") as VehicleStatus,
    acquiredAt:   defaultValues?.acquiredAt   ?? today,
  });

  const [images,    setImages]    = useState<string[]>(
    defaultValues?.images?.length  ? defaultValues.images
    : defaultValues?.imageUrl      ? [defaultValues.imageUrl]
    : []
  );
  const [optionals, setOptionals] = useState<string[]>(defaultValues?.optionals ?? []);
  const [isPremium, setIsPremium] = useState(defaultValues?.isPremium ?? false);
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  function setF(key: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name  = "Obrigatório";
    if (!form.brand.trim()) e.brand = "Obrigatório";
    if (!form.model.trim()) e.model = "Obrigatório";
    const yr = Number(form.year);
    if (!form.year || yr < 1950 || yr > new Date().getFullYear() + 2) e.year = "Ano inválido";
    if (form.yearModel) {
      const yrModel = Number(form.yearModel);
      if (yrModel < yr || yrModel > yr + 1) e.yearModel = "Deve ser o ano de fabricação ou o seguinte";
    }
    if (!form.price || parseCurrencyInput(form.price) <= 0) e.price = "Obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const cover = images[0] ?? PLACEHOLDER_IMAGE;
    onSubmit({
      name:         form.name.trim(),
      brand:        form.brand.trim(),
      model:        form.model.trim(),
      color:        form.color,
      category:     form.category,
      year:         parseInt(form.year),
      yearModel:    form.yearModel ? parseInt(form.yearModel) : undefined,
      km:           parseInt(form.km) || 0,
      transmission: form.transmission,
      fuel:         form.fuel,
      doors:        parseInt(form.doors),
      motor:        form.motor.trim(),
      optionals,
      isPremium,
      images,
      imageUrl:     cover,
      price:        parseCurrencyInput(form.price),
      status:       form.status,
      acquiredAt:   form.acquiredAt || today,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">

      {/* Fotos */}
      <section className="space-y-4">
        <DSectionTitle>Fotos do carro</DSectionTitle>
        <div className="h-px" style={{ backgroundColor: BORDER }} />
        <PhotoManager images={images} onChange={setImages} />
      </section>

      {/* Informações */}
      <section className="space-y-4">
        <DSectionTitle>Informações do veículo</DSectionTitle>
        <div className="h-px" style={{ backgroundColor: BORDER }} />

        <DInput label="Nome completo" placeholder="Ex: Tracker 1.2 Premier Turbo Aut. 5p"
          value={form.name} onChange={(e) => setF("name", e.target.value)} error={errors.name} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DInput label="Marca" placeholder="Ex: Chevrolet"
            value={form.brand} onChange={(e) => setF("brand", e.target.value)} error={errors.brand} />
          <DInput label="Modelo" placeholder="Ex: Tracker"
            value={form.model} onChange={(e) => setF("model", e.target.value)} error={errors.model} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DSelect label="Categoria" value={form.category} onChange={(e) => setF("category", e.target.value)}>
            <option value="">— Selecionar —</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </DSelect>
          <DSelect label="Cor" value={form.color} onChange={(e) => setF("color", e.target.value)}>
            <option value="">— Selecionar —</option>
            {COLOR_OPTIONS.map((c) => <option key={c}>{c}</option>)}
          </DSelect>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <DInput label="Ano fabricação" placeholder="2021" type="number"
            value={form.year} onChange={(e) => setF("year", e.target.value)} error={errors.year} />
          <DInput label="Ano modelo" placeholder="2022" type="number" hint="Opcional"
            value={form.yearModel} onChange={(e) => setF("yearModel", e.target.value)} error={errors.yearModel} />
          <DInput label="KM" placeholder="60000" type="number"
            value={form.km} onChange={(e) => setF("km", e.target.value)} />
          <DSelect label="Portas" value={form.doors} onChange={(e) => setF("doors", e.target.value)}>
            {DOORS_OPTIONS.map((d) => <option key={d} value={d}>{d} portas</option>)}
          </DSelect>
          <DSelect label="Status" value={form.status} onChange={(e) => setF("status", e.target.value as VehicleStatus)}>
            <option value="disponivel">Disponível</option>
            <option value="reservado">Reservado</option>
            <option value="vendido">Vendido</option>
          </DSelect>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DSelect label="Câmbio" value={form.transmission} onChange={(e) => setF("transmission", e.target.value)}>
            {TRANSMISSION_OPTIONS.map((t) => <option key={t}>{t}</option>)}
          </DSelect>
          <DSelect label="Combustível" value={form.fuel} onChange={(e) => setF("fuel", e.target.value)}>
            {FUEL_OPTIONS.map((f) => <option key={f}>{f}</option>)}
          </DSelect>
        </div>

        <DInput label="Motor (opcional)" placeholder="Ex: 1.6 TGDI"
          value={form.motor} onChange={(e) => setF("motor", e.target.value)}
          hint="Aparece nas especificações do site" />

        <DInput label="Data de aquisição" type="date"
          value={form.acquiredAt} onChange={(e) => setF("acquiredAt", e.target.value)}
          hint="Para cálculo de giro no estoque" />

        <div className="pt-2">
          <OptionalsSelector selected={optionals} onChange={setOptionals} />
        </div>

        <PremiumToggle value={isPremium} onChange={setIsPremium} />
      </section>

      {/* Preço */}
      <section className="space-y-4">
        <DSectionTitle>Preço</DSectionTitle>
        <div className="h-px" style={{ backgroundColor: BORDER }} />

        <DInput label="Preço exibido no site (R$)" placeholder="104.590,00" type="text" inputMode="decimal"
          value={form.price} onChange={(e) => setF("price", maskCurrencyInput(e.target.value))} error={errors.price} />
      </section>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
        <Link
          href={cancelHref}
          className="inline-flex items-center px-5 h-9 text-[13px] font-semibold rounded-xl transition-colors hover:bg-white/5"
          style={{ color: MUTED, border: `1px solid ${BORDER}` }}
        >
          Cancelar
        </Link>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isPending={loading}
          className="font-semibold px-5"
          style={{ boxShadow: "0 2px 12px rgba(204,17,17,0.35)" }}
        >
          {submitLabel}
        </Button>
      </div>

    </form>
  );
}
