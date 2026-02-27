export const SUPER_ADMINS = [
  'lucasreccchia@companyconexaoplay.com',
  'lucasreccchia@gmail.com',
]

export const LEVEL_THRESHOLDS = {
  PLATINA: { min: 0, max: 49, name: 'Platina', color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-muted/20', description: 'Iniciando Jornada' },
  SAFIRA: { min: 50, max: 150, name: 'Safira', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', description: 'Networker Experiente' },
  DIAMANTE: { min: 151, max: Infinity, name: 'Diamante', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', description: 'Elite Empresarial' },
} as const

export function getUserLevel(meetings: number) {
  if (meetings >= 151) return LEVEL_THRESHOLDS.DIAMANTE
  if (meetings >= 50) return LEVEL_THRESHOLDS.SAFIRA
  return LEVEL_THRESHOLDS.PLATINA
}
