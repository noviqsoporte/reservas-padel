import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CanchasSection from "@/components/CanchasSection";
import ComoFuncionaSection from "@/components/ComoFuncionaSection";
import ReservaSection from "@/components/ReservaSection";
import Footer from "@/components/Footer";
import { Cancha, Config } from "@/types";

async function getConfig(): Promise<Config> {
  const defaultConfig: Config = {
    negocio_nombre: "Padel Club",
    horario_apertura: "07:00",
    horario_cierre: "23:00",
    dias_operacion: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
    direccion: "Dirección del club",
    telefono: "+52 55 0000 0000",
    instagram: "@padelclub"
  };

  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/config`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch config');
    const data = await res.json();

    return { ...defaultConfig, ...data.config };
  } catch (error) {
    console.error('Error fetching config, using defaults:', error);
    return defaultConfig;
  }
}

async function getCanchas() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/canchas`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch canchas');
    const data = await res.json();
    return data.canchas as Cancha[];
  } catch (error) {
    console.error('Error fetching canchas:', error);
    return [];
  }
}

export default async function Home() {
  const config = await getConfig();
  const canchas = await getCanchas();

  const nombre = config.negocio_nombre;
  // Usamos as any temporalmente si "descripcion" viene en el payload pero no en el type Config
  const descripcion = (config as unknown as { descripcion?: string }).descripcion || "Las mejores canchas de la ciudad";

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection
        nombre={nombre}
        descripcion={descripcion}
        horarioApertura={config.horario_apertura}
        horarioCierre={config.horario_cierre}
      />

      <CanchasSection canchas={canchas} />
      <ComoFuncionaSection />
      <ReservaSection />

      {/* secciones siguientes se agregarán en próximos prompts */}
      <Footer config={config} />
    </div>
  );
}

