import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CanchasSection from "@/components/CanchasSection";
import ComoFuncionaSection from "@/components/ComoFuncionaSection";
import ReservaSection from "@/components/ReservaSection";
import Footer from "@/components/Footer";
import IntroAnimation from "@/components/IntroAnimation";
import FloatingContactButtons from "@/components/FloatingContactButtons";
import { Config } from "@/types";
import { getConfig, getCanchas } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [config, canchas] = await Promise.all([
    getConfig().catch(() => ({
      negocio_nombre: 'Lood',
      horario_apertura: '07:00 a.m.',
      horario_cierre: '11:00 p.m.',
      dias_operacion: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
      direccion: 'Dirección del club',
      telefono: '+52 55 0000 0000',
      instagram: '@lood'
    } as unknown as Config)),
    getCanchas().catch(() => [])
  ]);

  const nombre = config.negocio_nombre || 'Lood';
  const descripcion = (config as unknown as { descripcion?: string }).descripcion || "Las mejores canchas de la ciudad";
  const canchasActivas = canchas.filter(c => c.activa).length;

  return (
    <div className="min-h-screen bg-white page-public">
      <IntroAnimation nombre={nombre} />
      <Navbar nombre={nombre} />
      <HeroSection
        nombre={nombre}
        descripcion={descripcion}
        horarioApertura={config.horario_apertura}
        horarioCierre={config.horario_cierre}
        canchasActivas={canchasActivas}
      />

      <CanchasSection canchas={canchas} />
      <ComoFuncionaSection />
      <ReservaSection />

      <Footer config={config} />
      <FloatingContactButtons telefono={config.telefono} instagram={config.instagram} />
    </div>
  );
}
