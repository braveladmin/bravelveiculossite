"use client"

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503736334956-4c8f8e4733e7?w=800&q=80&auto=format&fit=crop"

type Props = {
  src: string
  alt?: string
  /** "cover" preenche o quadro de ponta a ponta (pode cortar o carro). "contain" mostra o carro inteiro com fundo desfocado preenchendo as laterais/bordas. */
  fit?: "cover" | "contain"
}

export function PhotoBackdrop({ src, alt = "", fit = "contain" }: Props) {
  if (fit === "cover") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
        />
      </div>
    )
  }

  // Evita cortar o carro quando a foto (paisagem) não bate com o formato vertical
  // do preview: fundo desfocado preenche o quadro, foto nítida fica inteira por cima.
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={src}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "blur(28px) brightness(0.55)", transform: "scale(1.2)" }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
      />
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-contain"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
      />
    </div>
  )
}
