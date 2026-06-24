"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { GripVertical, ImagePlus, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const SURF2  = "#111111";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED  = "#777777";
const TEXT   = "#ffffff";
const DANGER = "#a80e0e";
const ACCENT = "#cc1111";
const YELLOW = "#ffae1f";

const labelCls = "text-[10px] font-bold tracking-[0.12em] uppercase";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503736334956-4c8f8e4733e7?w=800&q=80&auto=format&fit=crop";

type Props = { images: string[]; onChange: (imgs: string[]) => void };

// Uploader de fotos pra Supabase Storage (bucket vehicle-images), compartilhado
// entre o formulário de veículo (VehicleForm.tsx) e a página de rascunhos do
// conector MCP (/estoque/rascunhos/[id]).
export function PhotoManager({ images, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
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
