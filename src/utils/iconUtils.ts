import {
  Navigation,
  Church,
  Utensils,
  Hand,
  Trophy,
  Megaphone,
  Sparkles,
  Camera,
  Users,
  UsersRound,
  BookOpen,
  Heart,
  ClipboardList,
  Calendar,
  type LucideIcon
} from 'lucide-react';

export interface CategoryStyle {
  Icon: LucideIcon;
  label: string;
  tint: string;
  background: string;
}

export function getCategoryStyle(category: string, title = '', _iconName = ''): CategoryStyle {
  const lowerTitle = title.toLowerCase();
  const lowerCat = category.toLowerCase();

  // 1. Traslados
  if (lowerCat.includes('traslado') || lowerTitle.startsWith('traslado')) {
    return {
      Icon: Navigation,
      label: 'Traslado',
      tint: '#0284C7',
      background: '#F0F9FF'
    };
  }

  // 2. Devocionales
  if (lowerTitle.includes('devocional')) {
    return {
      Icon: Church,
      label: 'Devocional',
      tint: '#4338CA',
      background: '#EEF2FF'
    };
  }

  // 3. Alimentación / Descanso
  if (lowerCat.includes('descanso') || lowerTitle.includes('almuerzo') || lowerTitle.includes('cena')) {
    return {
      Icon: Utensils,
      label: 'Alimentación',
      tint: '#D97706',
      background: '#FEF3C7'
    };
  }

  // 4. Despedida / Cierre
  if (lowerCat.includes('cierre') || lowerTitle.includes('despedida')) {
    return {
      Icon: Hand,
      label: 'Despedida',
      tint: '#7C3AED',
      background: '#F3E8FF'
    };
  }

  // 5. Recreación / Deportes / Fiesta / Porras / Foto
  if (lowerTitle.includes('deportivas') || lowerTitle.includes('juegos')) {
    return {
      Icon: Trophy,
      label: 'Recreación',
      tint: '#0D9488',
      background: '#CCFBF1'
    };
  }

  if (lowerTitle.includes('porras') || lowerTitle.includes('estandarte')) {
    return {
      Icon: Megaphone,
      label: 'Porras',
      tint: '#0284C7',
      background: '#E0F2FE'
    };
  }

  if (lowerTitle.includes('fiesta') || lowerTitle.includes('espectáculo') || lowerTitle.includes('variedades')) {
    return {
      Icon: Sparkles,
      label: 'Recreación',
      tint: '#BE185D',
      background: '#FCE7F3'
    };
  }

  if (lowerTitle.includes('foto')) {
    return {
      Icon: Camera,
      label: 'Foto',
      tint: '#475569',
      background: '#F1F5F9'
    };
  }

  // 6. Actividades de Compañía / Consejero
  if (lowerTitle.includes('consejero')) {
    return {
      Icon: Users,
      label: 'Consejero',
      tint: '#15803D',
      background: '#DCFCE7'
    };
  }

  if (lowerTitle.includes('compañía')) {
    return {
      Icon: UsersRound,
      label: 'Compañía',
      tint: '#1D4ED8',
      background: '#DBEAFE'
    };
  }

  if (lowerTitle.includes('evangelio') || lowerTitle.includes('historia familiar')) {
    return {
      Icon: BookOpen,
      label: 'Evangelio',
      tint: '#15803D',
      background: '#DCFCE7'
    };
  }

  if (lowerTitle.includes('noche de hogar')) {
    return {
      Icon: Heart,
      label: 'Noche de Hogar',
      tint: '#C2410C',
      background: '#FFEDD5'
    };
  }

  if (lowerTitle.includes('registro') || lowerTitle.includes('bienvenida')) {
    return {
      Icon: ClipboardList,
      label: 'Registro',
      tint: '#1D4ED8',
      background: '#DBEAFE'
    };
  }

  // Default
  return {
    Icon: Calendar,
    label: category.trim() || 'Actividad',
    tint: '#1E293B',
    background: '#F1F5F9'
  };
}
