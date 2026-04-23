'use client';

const images = [
  {
    src: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
    alt: 'Cancha de pádel cubierta',
  },
  {
    src: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80',
    alt: 'Instalaciones de pádel',
  },
  {
    src: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    alt: 'Cancha de pádel exterior',
  },
  {
    src: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=800&q=80',
    alt: 'Pista deportiva',
  },
  {
    src: 'https://images.unsplash.com/photo-1567857248564-91f9e32f9451?auto=format&fit=crop&w=800&q=80',
    alt: 'Jugadores de pádel',
  },
  {
    src: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=800&q=80',
    alt: 'Club deportivo',
  },
  {
    src: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=800&q=80',
    alt: 'Cancha indoor',
  },
  {
    src: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80',
    alt: 'Instalaciones deportivas',
  },
];

const doubled = [...images, ...images];

export default function ImageAutoSlider() {
  return (
    <section className="py-24 bg-[#f9fafb] overflow-hidden">
      <style>{`
        @keyframes scroll-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .slider-track {
          animation: scroll-left 35s linear infinite;
        }
        .slider-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Encabezado */}
      <div className="text-center mb-14 px-4">
        <p className="text-[#0057FF] text-xs font-semibold tracking-widest uppercase mb-3">
          NUESTRAS INSTALACIONES
        </p>
        <h2 className="text-4xl font-bold text-[#0f172a]">Conócenos</h2>
        <p className="text-[#64748b] text-lg mt-3">
          Las mejores instalaciones para disfrutar el pádel
        </p>
      </div>

      {/* Galería */}
      <div className="relative">
        {/* Fade izquierda */}
        <div
          className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #f9fafb, transparent)' }}
        />
        {/* Fade derecha */}
        <div
          className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #f9fafb, transparent)' }}
        />

        <div className="slider-track flex gap-5" style={{ width: 'max-content' }}>
          {doubled.map((img, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-80 overflow-hidden rounded-2xl shadow-sm"
              style={{ aspectRatio: '16/9' }}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
