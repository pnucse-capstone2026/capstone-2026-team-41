import { useTranslation } from 'react-i18next'

interface Props {
  score: number
}

const getSeverity = (score: number) => {
  if (score >= 9) return { label: 'Critical', color: 'text-red-500' }
  if (score >= 7) return { label: 'High', color: 'text-orange-500' }
  if (score >= 4) return { label: 'Medium', color: 'text-yellow-500' }
  return { label: 'Low', color: 'text-green-500' }
}

export default function CvssGauge({ score }: Props) {
  const { t } = useTranslation('common')
  const { label, color } = getSeverity(score)
  const pct = Math.min((score / 10) * 100, 100)

  return (
    <div className="bg-gray-800 rounded-lg p-5">
      <h3 className="text-sm text-gray-400 mb-3">{t('cvssGauge.title')}</h3>
      <p className={`text-5xl font-bold ${color} mb-2`}>{score.toFixed(1)}</p>
      <p className={`text-sm font-semibold ${color} mb-4`}>{label}</p>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
