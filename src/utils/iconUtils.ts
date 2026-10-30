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
  darkTint: string;
  darkBackground: string;
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
      background: '#F0F9FF',
      darkTint: '#38BDF8',
      darkBackground: '#13283F'
    };
  }

  // 2. Devocionales
  if (lowerTitle.includes('devocional')) {
    return {
      Icon: Church,
      label: 'Devocional',
      tint: '#4338CA',
      background: '#EEF2FF',
      darkTint: '#A5B4FC',
      darkBackground: '#1E2342'
    };
  }

  // 3. Alimentación / Descanso
  if (lowerCat.includes('descanso') || lowerTitle.includes('almuerzo') || lowerTitle.includes('cena')) {
    return {
      Icon: Utensils,
      label: 'Alimentación',
      tint: '#D97706',
      background: '#FEF3C7',
      darkTint: '#FBBF24',
      darkBackground: '#2E2214'
    };
  }

  // 4. Despedida / Cierre
  if (lowerCat.includes('cierre') || lowerTitle.includes('despedida')) {
    return {
      Icon: Hand,
      label: 'Despedida',
      tint: '#7C3AED',
      background: '#F3E8FF',
      darkTint: '#C084FC',
      darkBackground: '#291E3D'
    };
  }

  // 5. Recreación / Deportes / Fiesta / Porras / Foto
  if (lowerTitle.includes('deportivas') || lowerTitle.includes('juegos')) {
    return {
      Icon: Trophy,
      label: 'Recreación',
      tint: '#0D9488',
      background: '#CCFBF1',
      darkTint: '#2DD4BF',
      darkBackground: '#132E2C'
    };
  }

  if (lowerTitle.includes('porras') || lowerTitle.includes('estandarte')) {
    return {
      Icon: Megaphone,
      label: 'Porras',
      tint: '#0284C7',
      background: '#E0F2FE',
      darkTint: '#38BDF8',
      darkBackground: '#13283F'
    };
  }

  if (lowerTitle.includes('fiesta') || lowerTitle.includes('espectáculo') || lowerTitle.includes('variedades')) {
    return {
      Icon: Sparkles,
      label: 'Recreación',
      tint: '#BE185D',
      background: '#FCE7F3',
      darkTint: '#F472B6',
      darkBackground: '#331A28'
    };
  }

  if (lowerTitle.includes('foto')) {
    return {
      Icon: Camera,
      label: 'Foto',
      tint: '#475569',
      background: '#F1F5F9',
      darkTint: '#CBD5E1',
      darkBackground: '#1F2A38'
    };
  }

  // 6. Actividades de Compañía / Consejero
  if (lowerTitle.includes('consejero')) {
    return {
      Icon: Users,
      label: 'Consejero',
      tint: '#15803D',
      background: '#DCFCE7',
      darkTint: '#4ADE80',
      darkBackground: '#132E1F'
    };
  }

  if (lowerTitle.includes('compañía')) {
    return {
      Icon: UsersRound,
      label: 'Compañía',
      tint: '#1D4ED8',
      background: '#DBEAFE',
      darkTint: '#60A5FA',
      darkBackground: '#152544'
    };
  }

  if (lowerTitle.includes('evangelio') || lowerTitle.includes('historia familiar')) {
    return {
      Icon: BookOpen,
      label: 'Evangelio',
      tint: '#15803D',
      background: '#DCFCE7',
      darkTint: '#4ADE80',
      darkBackground: '#132E1F'
    };
  }

  if (lowerTitle.includes('noche de hogar')) {
    return {
      Icon: Heart,
      label: 'Noche de Hogar',
      tint: '#C2410C',
      background: '#FFEDD5',
      darkTint: '#FB923C',
      darkBackground: '#321D12'
    };
  }

  if (lowerTitle.includes('registro') || lowerTitle.includes('bienvenida')) {
    return {
      Icon: ClipboardList,
      label: 'Registro',
      tint: '#1D4ED8',
      background: '#DBEAFE',
      darkTint: '#60A5FA',
      darkBackground: '#152544'
    };
  }

  // Default
  return {
    Icon: Calendar,
    label: category.trim() || 'Actividad',
    tint: '#1E293B',
    background: '#F1F5F9',
    darkTint: '#CBD5E1',
    darkBackground: '#1D2C43'
  };
}
