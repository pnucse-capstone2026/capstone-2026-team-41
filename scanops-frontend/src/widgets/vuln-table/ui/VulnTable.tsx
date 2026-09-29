import { useTranslation } from 'react-i18next'
import type { Vulnerability } from '../../../entities/vulnerability/model/types'

interface Props {
  vulnerabilities: Vulnerability[]
}

const RISK_COLOR: Record<string, string> = {
  LOW: 'text-green-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400',
  CRITICAL: 'text-red-400',
}

export default function VulnTable({ vulnerabilities }: Props) {
  const { t } = useTranslation('common')
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-700">
            <th className="pb-3 pr-4">{t('vulnTable.type')}</th>
            <th className="pb-3 pr-4">URL</th>
            <th className="pb-3 pr-4">{t('vulnTable.severity')}</th>
            <th className="pb-3">CVSS</th>
          </tr>
        </thead>
        <tbody>
          {vulnerabilities.map((v) => (
            <tr key={v.id} className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="py-3 pr-4 text-white">{v.vulnType}</td>
              <td className="py-3 pr-4 text-gray-400 truncate max-w-xs">{v.url}</td>
              <td className={`py-3 pr-4 font-semibold ${RISK_COLOR[v.riskLevel]}`}>
                {v.riskLevel}
              </td>
              <td className="py-3 text-gray-300">{v.cvssScore.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
