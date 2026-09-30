/** Development-only fixtures. This module is eliminated from production builds. */
import cpgSample from './cpg-sample.json'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ReportPage from '../report/ui/ReportPage'
import DashboardPage from '../dashboard/ui/DashboardPage'
import { mapVuln } from '../../shared/api/scan'
import { excerptAround } from '../../shared/lib/sourceContext'
import type { Report } from '../../shared/lib/mock'
import type { TokenWallet } from '../../shared/api/tokens'

// Deliberately synthetic display fixture, never sent to or bundled with production.
const source = `package demo;

import java.io.IOException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class VulnerableServlet {
    public void render(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("text/html; charset=UTF-8");

        String query = req.getParameter("q");
        String message = query;

        resp.getWriter().println(message);
    }
}`
const nodes = [
  { id: 'n0', role: 'source', line: 11, code: 'req.getParameter("q")' },
  { id: 'n1', role: 'intermediate', line: 12, code: 'String message = query' },
  { id: 'n2', role: 'sink', line: 14, code: 'resp.getWriter().println(message)' },
].map((node) => ({
  ...node,
  file: 'VulnerableServlet.java',
  excerpt: excerptAround(source, node.line, 'VulnerableServlet.java'),
}))
const wallet: TokenWallet = {
  plan: 'FREE',
  team: false,
  subscriptionBalance: 5987,
  purchasedBalance: 0,
  heldBalance: 0,
  available: 5987,
  monthlyGrant: 0,
  sourceLinesLeft: 5987,
  sourceLinesMonthlyLimit: 0,
  dastSubscriptionRemaining: 0,
  dastPurchasedRemaining: 1,
  dastHeld: 0,
  dastAvailable: 1,
  dastMonthlyLimit: 0,
  websiteScansLeft: 1,
  periodEnd: null,
  maxConcurrentDastScans: 1,
  maxConcurrentSastScans: 1,
  topUpPriceKrw: 5000,
  topUpTokens: 3000,
  dastTopUpPriceKrw: 5000,
  dastTopUpCount: 3,
}

export default function DesignPreview() {
  const { screen } = useParams()
  const [params] = useSearchParams()
  const mode = params.get('graph')
  const graphNodes =
    mode === 'callsite' ? nodes.slice(-1) : mode === 'partial' ? nodes.slice(0, 2) : nodes
  const legacyGraph =
    mode === 'missing'
      ? null
      : JSON.stringify({
          version: 1,
          kind:
            mode === 'callsite' ? 'call-site' : mode === 'partial' ? 'partial-flow' : 'data-flow',
          nodes: graphNodes,
          edges: graphNodes.slice(1).map((n, i) => ({ source: graphNodes[i].id, target: n.id })),
        })
  const actual = !mode || mode === 'actual'
  const graph = actual
    ? JSON.stringify({
        ...cpgSample.graph,
        nodes: cpgSample.graph.nodes.map((node) => ({
          ...node,
          excerpt: excerptAround(cpgSample.source, node.line, node.file),
        })),
      })
    : legacyGraph
  const excerpt = excerptAround(
    actual ? cpgSample.source : source,
    actual ? 7 : 14,
    actual ? 'Demo.java' : 'VulnerableServlet.java'
  )!
  useTranslation('report') // rebuild localized fixtures when the language changes
  const report: Report = {
    id: 'preview',
    target: actual ? 'Demo.java' : 'VulnerableServlet.java',
    mode: 'GITHUB_REPO',
    status: 'DONE',
    maxCvss: 0,
    counts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 1 },
    total: 1,
    createdAt: '2026-09-30T03:59:00Z',
    durationSec: 37,
    vulnerabilities: [
      mapVuln({
        vulnId: 'preview-cwe-79',
        vulnType: 'CWE-79',
        url: actual ? 'Demo.java#L7' : 'VulnerableServlet.java#L14',
        cpgGraph: graph,
        sourceSnippet: excerpt.code,
        sourceStartLine: excerpt.startLine,
        sourceLine: excerpt.targetLine,
        sourcePath: actual ? 'Demo.java' : 'VulnerableServlet.java',
        cause:
          '파일: VulnerableServlet.java 줄번호: 12 공격: 탐지 출처: cpg 근거: CPG 정적 규칙 탐지 후보',
        solution:
          '해당 위치의 CWE-79 후보를 검토하고 안전한 수정과 회귀 테스트를 추가하세요. 수정 요청 프롬프트: 파일 VulnerableServlet.java, 줄 12',
      }),
    ],
  }
  return (
    <>
      <div className="bg-brand-soft border-b border-brand/20 px-4 py-3 text-[13px] flex flex-wrap justify-center gap-x-5 gap-y-2">
        <strong className="text-brand-press">
          {actual
            ? '로컬 미리보기 · 샘플 Java의 실제 Joern 분석 결과'
            : '로컬 디자인 미리보기 · 예시 데이터'}
        </strong>
        <Link className="underline" to="/">
          랜딩
        </Link>
        <Link className="underline" to="/preview/dashboard">
          대시보드
        </Link>
        <Link className="underline" to="/preview/report">
          취약점 상세
        </Link>
      </div>
      {screen === 'dashboard' ? (
        <DashboardPage previewData={{ wallet, scans: [report] }} />
      ) : (
        <ReportPage previewReport={report} />
      )}
    </>
  )
}
