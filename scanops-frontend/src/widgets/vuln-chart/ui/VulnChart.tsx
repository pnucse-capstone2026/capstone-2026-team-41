import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'
import type { Vulnerability } from '../../../entities/vulnerability/model/types'

interface Props {
  vulnerabilities: Vulnerability[]
}

export default function VulnChart({ vulnerabilities }: Props) {
  const { t } = useTranslation('common')
  const counts = vulnerabilities.reduce<Record<string, number>>((acc, v) => {
    acc[v.riskLevel] = (acc[v.riskLevel] ?? 0) + 1
    return acc
  }, {})

  const data = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => ({
    name: level,
    count: counts[level] ?? 0,
  }))

  const COLORS: Record<string, string> = {
    LOW: '#4ade80',
    MEDIUM: '#facc15',
    HIGH: '#fb923c',
    CRITICAL: '#f87171',
  }

  return (
    <div className="bg-gray-800 rounded-lg p-5">
      <h3 className="text-sm text-gray-400 mb-4">{t('vulnChart.title')}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }}
            labelStyle={{ color: '#f3f4f6' }}
          />
          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}
            label={false}
          >
            {data.map((entry) => (
              <rect key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
