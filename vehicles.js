const BRAVEL_WPP = '556696400156';

const fmtPrice = p => p.toLocaleString('pt-BR', { style:'currency', currency:'BRL', minimumFractionDigits:0 });

const BRAVEL_VEHICLES = [
  {
    id: 0,
    slug: 'hyundai-creta-ultimate-2025',
    type: 'suv', brand: 'Hyundai',
    model: 'Hyundai Creta', version: 'Ultimate 1.6 TGDI',
    year: '2025/2026', km: '12.000 km', fuel: 'Gasolina', transmission: 'Automático',
    price: 168900, color: null, plate_end: null,
    location: 'Primavera do Leste - MT',
    photos: ['site/veiculos/Creta/01.jpg','site/veiculos/Creta/02.jpg','site/veiculos/Creta/03.jpg','site/veiculos/Creta/04.jpg'],
    emoji: '🚙', gradient: 'linear-gradient(135deg,#1e3a8a,#2563eb)',
    optionals: [],
    description: null,
    badge: 'Novo no estoque'
  },
  {
    id: 1,
    slug: 'fiat-strada-freedom-2021',
    type: 'pickup', brand: 'Fiat',
    model: 'Fiat Strada', version: 'Freedom Cabine Simples 1.3',
    year: '2021/2022', km: '90.000 km', fuel: 'Flex', transmission: 'Manual',
    price: 77900, color: null, plate_end: null,
    location: 'Primavera do Leste - MT',
    photos: ['site/veiculos/Strada/01.jpg','site/veiculos/Strada/02.jpg','site/veiculos/Strada/03.jpg'],
    emoji: '🛻', gradient: 'linear-gradient(135deg,#7c2d12,#ea580c)',
    optionals: [],
    description: null,
    badge: null
  },
  {
    id: 2,
    slug: 'chevrolet-prisma-lt-2016',
    type: 'sedan', brand: 'Chevrolet',
    model: 'Chevrolet Prisma', version: 'LT 1.4',
    year: '2016/2017', km: '91.000 km', fuel: 'Flex', transmission: 'Automático',
    price: 64900, color: null, plate_end: null,
    location: 'Primavera do Leste - MT',
    photos: ['site/veiculos/Prisma/01.jpg','site/veiculos/Prisma/02.jpg','site/veiculos/Prisma/03.jpg'],
    emoji: '🚗', gradient: 'linear-gradient(135deg,#1c1917,#44403c)',
    optionals: [],
    description: null,
    badge: null
  },
  {
    id: 3,
    slug: 'chevrolet-onix-joy-2019',
    type: 'hatch', brand: 'Chevrolet',
    model: 'Chevrolet Onix Joy', version: '1.0',
    year: '2019/2020', km: '50.000 km', fuel: 'Flex', transmission: 'Manual',
    price: 54900, color: null, plate_end: null,
    location: 'Primavera do Leste - MT',
    photos: ['site/veiculos/Onix/01.jpg','site/veiculos/Onix/02.jpg','site/veiculos/Onix/03.jpg'],
    emoji: '🚗', gradient: 'linear-gradient(135deg,#14532d,#16a34a)',
    optionals: [],
    description: null,
    badge: null
  },
  {
    id: 4,
    slug: 'fiat-strada-freedom-2022-cinza',
    type: 'pickup', brand: 'Fiat',
    model: 'Fiat Strada', version: 'Freedom Cabine Simples 1.3',
    year: '2021/2022', km: '125.000 km', fuel: 'Flex', transmission: 'Manual',
    price: 73900, color: 'Cinza', plate_end: null,
    location: 'Primavera do Leste - MT',
    photos: [
      'site/veiculos/Strada cinza/bravelveiculos_1781177608_3917123198285977217_44311545539.jpg',
      'site/veiculos/Strada cinza/bravelveiculos_1781177608_3917123258012860556_44311545539.jpg',
      'site/veiculos/Strada cinza/bravelveiculos_1781177608_3917123268297325472_44311545539.jpg'
    ],
    emoji: '🛻', gradient: 'linear-gradient(135deg,#374151,#6b7280)',
    optionals: ['Computador de bordo', 'Volante multifuncional', 'Central multimídia', 'Piscas nos retrovisores', 'Capota marítima', 'Rodas de liga leve'],
    description: 'Strada Freedom CS 1.3 Flex completa, com capota marítima, central multimídia e rodas de liga leve. Manual do proprietário incluso.',
    badge: 'Novo no estoque'
  },
  {
    id: 5,
    slug: 'chevrolet-onix-lt-turbo-2022-vermelho',
    type: 'hatch', brand: 'Chevrolet',
    model: 'Chevrolet Onix', version: 'LT 1.0 Turbo',
    year: '2021/2022', km: '50.000 km', fuel: 'Flex', transmission: 'Manual',
    price: 71900, color: 'Vermelho', plate_end: null,
    location: 'Primavera do Leste - MT',
    photos: [
      'site/veiculos/onix vermelho/bravelveiculos_1781177412_3917122148434905461_44311545539.jpg',
      'site/veiculos/onix vermelho/bravelveiculos_1781177412_3917122155095365422_44311545539.jpg',
      'site/veiculos/onix vermelho/bravelveiculos_1781177412_3917122171520405691_44311545539.jpg'
    ],
    emoji: '🚗', gradient: 'linear-gradient(135deg,#7f1d1d,#dc2626)',
    optionals: ['Computador de bordo', 'Kit Multimídia', 'Rodas de liga leve', 'Pneus novos', 'Volante multifuncional'],
    description: 'Onix LT 1.0 Turbo Flex completo, com kit multimídia, pneus novos e rodas de liga leve. Chave reserva e manual do proprietário inclusos.',
    badge: 'Novo no estoque'
  },
  {
    id: 6,
    slug: 'fiat-mobi-like-2024',
    type: 'hatch', brand: 'Fiat',
    model: 'Fiat Mobi', version: 'Like 1.0',
    year: '2024/2025', km: '19.000 km', fuel: 'Flex', transmission: 'Manual',
    price: 62900, color: null, plate_end: null,
    location: 'Primavera do Leste - MT',
    photos: [
      'site/veiculos/Mobi/bravelveiculos_1781015391_3915763209021437032_44311545539.jpg',
      'site/veiculos/Mobi/bravelveiculos_1781015391_3915763218576214864_44311545539.jpg',
      'site/veiculos/Mobi/bravelveiculos_1781015391_3915763233793082549_44311545539.jpg'
    ],
    emoji: '🚗', gradient: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
    optionals: ['Computador de bordo', 'Faróis de neblina', 'Pneus novos'],
    description: 'Mobi Like 1.0 Flex com apenas 19.000 km rodados. Completo, com faróis de neblina e pneus novos. Chave reserva e manual do proprietário inclusos.',
    badge: 'Novo no estoque'
  }
];
