const BRAVEL_WPP = '556699135492';

const fmtPrice = p => p.toLocaleString('pt-BR', { style:'currency', currency:'BRL', minimumFractionDigits:0 });

// ─── Supabase — fonte do estoque (mesma base do painel admin) ──────────────
const SUPABASE_URL      = 'https://hukregsjrnvtkedywgih.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_H70Duzc6e3cUuz5IrBLwog_-jOyMpe2';

const CATEGORY_TO_TYPE = {
  Hatch: 'hatch', Sedan: 'sedan', SUV: 'suv', Pickup: 'pickup', Van: 'minivan',
  'Conversível': 'esportivo', 'Coupé': 'esportivo', Moto: 'moto', 'Elétrico': 'outro', Outro: 'outro',
};

const TYPE_VISUAL = {
  suv:       { emoji: '🚙', gradient: 'linear-gradient(135deg,#1e3a8a,#2563eb)' },
  pickup:    { emoji: '🛻', gradient: 'linear-gradient(135deg,#7c2d12,#ea580c)' },
  sedan:     { emoji: '🚗', gradient: 'linear-gradient(135deg,#1c1917,#44403c)' },
  hatch:     { emoji: '🚗', gradient: 'linear-gradient(135deg,#7f1d1d,#dc2626)' },
  minivan:   { emoji: '🚐', gradient: 'linear-gradient(135deg,#312e81,#4338ca)' },
  esportivo: { emoji: '🏎️', gradient: 'linear-gradient(135deg,#581c87,#9333ea)' },
  moto:      { emoji: '🏍️', gradient: 'linear-gradient(135deg,#164e63,#0891b2)' },
  outro:     { emoji: '🚗', gradient: 'linear-gradient(135deg,#27272a,#52525b)' },
};

const NEW_BADGE_DAYS = 14;

function rowToSiteVehicle(row) {
  const type   = CATEGORY_TO_TYPE[row.category] || 'outro';
  const visual = TYPE_VISUAL[type] || TYPE_VISUAL.outro;
  const isNew  = row.created_at &&
    (Date.now() - new Date(row.created_at).getTime()) < NEW_BADGE_DAYS * 24 * 60 * 60 * 1000;

  return {
    id: row.id,
    type,
    brand: row.brand,
    model: `${row.brand} ${row.model}`,
    modelOnly: row.model,
    version: row.name,
    year: row.year_model ? `${row.year}/${row.year_model}` : row.year,
    km: `${Number(row.km || 0).toLocaleString('pt-BR')} km`,
    fuel: row.fuel,
    transmission: row.transmission,
    motor: row.motor || null,
    price: Number(row.price),
    color: row.color || null,
    location: 'Primavera do Leste - MT',
    photos: row.images || [],
    emoji: visual.emoji,
    gradient: visual.gradient,
    optionals: row.optionals || [],
    description: null,
    badge: isNew ? 'Novo no estoque' : null,
    isPremium: !!row.is_premium,
  };
}

let BRAVEL_VEHICLES = [];

const BRAVEL_VEHICLES_READY = (async () => {
  try {
    const url = `${SUPABASE_URL}/rest/v1/public_vehicles?select=*&order=created_at.desc`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) throw new Error(`Supabase respondeu ${res.status}`);
    const rows = await res.json();
    BRAVEL_VEHICLES = rows.map(rowToSiteVehicle);
  } catch (err) {
    console.error('Erro ao carregar estoque do Supabase:', err);
    BRAVEL_VEHICLES = [];
  }
  return BRAVEL_VEHICLES;
})();
