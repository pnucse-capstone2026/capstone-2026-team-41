import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../../../shared/ui/Icon'
import { useAuth } from '../../../shared/lib/auth'
import { completeSurvey, fetchSurveyStatus, submitSurvey } from '../../../shared/api/survey'

type StepType = 'intro' | 'single' | 'text' | 'done'
type Answers = Record<string, string>

interface Option { v: string }
interface FollowUp {
  id: string
  /** 생략하면 옵션 아무거나 골라도 나타남(예/아니오 둘 다 이유를 묻는 경우). */
  trigger?: string[]
}
interface Step {
  id: string
  type: StepType
  options?: Option[]
  followUp?: FollowUp
  /** 다른 답변에 따라 이 스텝 자체를 건너뛸지. */
  when?: (a: Answers) => boolean
}

const QUESTIONS: Step[] = [
  {
    id: 'priorToolUsed', type: 'single',
    options: [{ v: '없다' }, { v: '있다' }],
    followUp: { id: 'priorToolWhat', trigger: ['있다'] },
  },
  {
    id: 'comparisonVsPrior', type: 'text',
    when: (a) => a.priorToolUsed === '있다',
  },
  {
    id: 'purpose', type: 'single',
    options: [
      { v: '배포전점검' },
      { v: '실서비스보안점검' },
      { v: '개인깃허브점검' },
    ],
  },
  {
    id: 'role', type: 'single',
    options: [
      { v: '개발자' },
      { v: 'CTO' },
      { v: '기획자' },
      { v: '보안담당자' },
      { v: '디자이너' },
      { v: '기타' },
    ],
    followUp: { id: 'roleOther', trigger: ['기타'] },
  },
  {
    id: 'reportClarity', type: 'single',
    options: [
      { v: '매우쉬움' },
      { v: '쉬움' },
      { v: '보통' },
      { v: '어려움' },
      { v: '매우어려움' },
    ],
  },
  {
    id: 'falsePositive', type: 'single',
    options: [{ v: '없다' }, { v: '있다' }],
    followUp: { id: 'falsePositiveDetail', trigger: ['있다'] },
  },
  {
    id: 'continueIntent', type: 'single',
    options: [{ v: '예' }, { v: '아니오' }],
    followUp: { id: 'continueReason' },
  },
  {
    id: 'recommendIntent', type: 'single',
    options: [
      { v: '전혀아니다' },
      { v: '고민된다' },
      { v: '추천하겠다' },
    ],
  },
  {
    id: 'likedPoints', type: 'text',
  },
  {
    id: 'wishFeature', type: 'text',
  },
  {
    id: 'missedVuln', type: 'single',
    options: [{ v: '없다' }, { v: '있다' }],
    followUp: { id: 'missedVulnDetail', trigger: ['있다'] },
  },
  {
    id: 'scanSpeed', type: 'single',
    options: [
      { v: '매우느림' },
      { v: '느린편' },
      { v: '적당함' },
      { v: '빠른편' },
      { v: '매우빠름' },
    ],
  },
]

const STEPS: Step[] = [{ id: 'intro', type: 'intro' }, ...QUESTIONS, { id: 'done', type: 'done' }]

function clientId() {
  try {
    let id = localStorage.getItem('scanops_survey_cid')
    if (!id) {
      id = 'c' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
      localStorage.setItem('scanops_survey_cid', id)
    }
    return id
  } catch { return 'no-storage' }
}

export default function SurveyPage() {
  const { t } = useTranslation('survey')
  const navigate = useNavigate()
  const { user } = useAuth()
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(true)

  // 계정당 1회 제한 — 이미 참여했으면 설문을 열지 않고 바로 마이페이지로 돌려보낸다.
  useEffect(() => {
    fetchSurveyStatus()
      .then((s) => { if (s.completed) navigate('/mypage', { replace: true }); else setChecking(false) })
      .catch(() => setChecking(false))
  }, [navigate])

  const step = STEPS[i]
  const isActive = (s: Step) => !s.when || s.when(answers)
  const isQuestion = (s: Step) => s.type !== 'intro' && s.type !== 'done'
  const qCount = STEPS.filter((s) => isQuestion(s) && isActive(s)).length
  const doneCount = STEPS.slice(0, i).filter((s) => isQuestion(s) && isActive(s)).length
  const pct = step.type === 'done' ? 100 : Math.round((doneCount / Math.max(qCount, 1)) * 100)

  const submit = async (finalAnswers: Answers) => {
    if (submitting) return
    setSubmitting(true)
    await submitSurvey({
      clientId: clientId(),
      userEmail: user?.email ?? '',
      userName: user?.name ?? '',
      ...finalAnswers,
      submittedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    })
    try { await completeSurvey() } catch { /* 참여 표시 실패해도 제출 자체는 끝난 상태로 둔다 */ }
    setSubmitting(false)
  }

  const goNext = (nextAnswers = answers) => {
    let j = i + 1
    while (j < STEPS.length && STEPS[j].when && !STEPS[j].when!(nextAnswers)) j++
    setI(j)
    if (STEPS[j]?.type === 'done') submit(nextAnswers)
  }

  const back = () => {
    let j = i - 1
    while (j >= 0 && STEPS[j].when && !STEPS[j].when!(answers)) j--
    if (j >= 0) setI(j)
  }

  const pick = (v: string) => {
    setAnswers((a) => ({ ...a, [step.id]: v }))
  }

  if (checking) return <div className="min-h-screen bg-field" />

  return (
    <div className="min-h-screen bg-field flex justify-center">
      <div className="w-full max-w-[480px] bg-field min-h-screen flex flex-col">
        {/* top */}
        <div className="sticky top-0 z-10 bg-field px-5 pt-2">
          <div className="h-11 flex items-center">
            {i > 0 && step.type !== 'done' && (
              <button onClick={back} aria-label={t('back')} className="w-8 h-8 -ml-1.5 flex items-center justify-center text-ink">
                <Icon name="chevron-left" size={22} />
              </button>
            )}
          </div>
          {step.type !== 'intro' && (
            <div className="h-1 bg-line rounded-full overflow-hidden">
              <div className="h-full bg-brand rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>

        {/* body */}
        <div className="flex-1 px-5 pt-6 overflow-y-auto">
          {step.type === 'intro' && <IntroView onStart={() => goNext()} />}
          {step.type === 'done' && <DoneView submitting={submitting} onExit={() => navigate('/mypage')} />}
          {step.type === 'single' && (
            <SingleView
              step={step}
              value={answers[step.id]}
              followUpValue={step.followUp ? (answers[step.followUp.id] ?? '') : ''}
              onPick={pick}
              onFollowUpChange={(v) => setAnswers((a) => ({ ...a, [step.followUp!.id]: v }))}
              onContinue={() => goNext()}
              isLast={STEPS[i + 1]?.type === 'done'}
            />
          )}
          {step.type === 'text' && (
            <TextView
              step={step}
              value={answers[step.id] ?? ''}
              onChange={(v) => setAnswers((a) => ({ ...a, [step.id]: v }))}
              onNext={() => goNext()}
              isLast={STEPS[i + 1]?.type === 'done'}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function IntroView({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation('survey')
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-10 min-h-[70vh]">
      <div className="w-[72px] h-[72px] rounded-[22px] bg-brand flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(49,130,246,.35)]">
        <Icon name="edit-3" size={32} className="text-white" />
      </div>
      <h1 className="text-[26px] font-extrabold text-ink leading-snug tracking-tight">
        {t('intro.titleLine1')}<br />{t('intro.titleLine2')}
      </h1>
      <p className="mt-3 text-[15px] text-ink-muted leading-relaxed">
        {t('intro.subtitleLine1')}<br />{t('intro.subtitleLine2')}
      </p>

      <div className="w-full mt-6 rounded-2xl bg-danger-soft border border-danger-soft px-5 py-4 flex items-center gap-3.5 text-left">
        <span className="w-11 h-11 rounded-xl bg-danger text-white flex items-center justify-center shrink-0">
          <Icon name="zap" size={20} />
        </span>
        <div>
          <p className="text-[17px] font-bold text-danger">{t('intro.rewardTitle')}</p>
          <p className="text-[13px] text-ink-sub leading-relaxed mt-0.5">
            {t('intro.rewardPre')}<b className="text-ink font-bold">{t('intro.rewardBold')}</b>{t('intro.rewardSuffix')}
          </p>
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 bg-white rounded-full px-3.5 py-2 text-[13px] font-semibold text-ink-sub mt-5">
        {t('intro.meta')}
      </div>
      <button
        onClick={onStart}
        className="mt-10 w-full h-[54px] rounded-2xl bg-brand text-white text-[17px] font-bold hover:bg-brand-hover active:scale-[.99] transition-all"
      >
        {t('intro.start')}
      </button>
    </div>
  )
}

function DoneView({ submitting, onExit }: { submitting: boolean; onExit: () => void }) {
  const { t } = useTranslation('survey')
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-10 min-h-[70vh]">
      <div className="w-[72px] h-[72px] rounded-[22px] bg-brand flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(49,130,246,.35)]">
        <Icon name="check" size={34} className="text-white" strokeWidth={3} />
      </div>
      <h1 className="text-[24px] font-extrabold text-ink leading-snug tracking-tight">
        {t('done.titleLine1')}<br />{t('done.titleLine2')}
      </h1>
      <p className="mt-3 text-[15px] text-ink-muted leading-relaxed">
        {t('done.descLine1')}<br />{t('done.descLine2')}<br />
        {t('done.descLine3')}
      </p>
      <button
        onClick={onExit}
        disabled={submitting}
        className="mt-10 w-full h-[54px] rounded-2xl bg-brand text-white text-[17px] font-bold hover:bg-brand-hover active:scale-[.99] transition-all disabled:opacity-60"
      >
        {t('done.exit')}
      </button>
    </div>
  )
}

function SingleView({ step, value, followUpValue, onPick, onFollowUpChange, onContinue, isLast }: {
  step: Step
  value?: string
  followUpValue: string
  onPick: (v: string) => void
  onFollowUpChange: (v: string) => void
  onContinue: () => void
  isLast: boolean
}) {
  const { t } = useTranslation('survey')
  const showFollowUp = !!step.followUp && !!value && (!step.followUp.trigger || step.followUp.trigger.includes(value))
  return (
    <div>
      <p className="text-[13px] font-semibold text-brand mb-2.5">{t(`questions.${step.id}.eyebrow`)}</p>
      <h1 className="text-[22px] font-bold text-ink leading-snug mb-6 whitespace-pre-line">{t(`questions.${step.id}.title`)}</h1>
      <div className="flex flex-col gap-2.5">
        {step.options!.map((o) => {
          const selected = value === o.v
          return (
            <button
              key={o.v}
              onClick={() => onPick(o.v)}
              className={`w-full text-left rounded-2xl px-4 py-4 text-[16px] font-semibold flex items-center justify-between gap-3 transition-all shadow-[0_1px_2px_rgba(0,0,0,.03)] border-[1.5px] active:scale-[.985] ${
                selected ? 'bg-brand-soft border-brand text-brand-press' : 'bg-white border-white text-ink'
              }`}
            >
              {t(`questions.${step.id}.options.${o.v}`)}
              <span
                className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected ? 'bg-brand border-brand' : 'border-line-strong'
                }`}
              >
                {selected && <Icon name="check" size={13} className="text-white" strokeWidth={3} />}
              </span>
            </button>
          )
        })}
      </div>

      {showFollowUp && (
        <textarea
          value={followUpValue}
          onChange={(e) => onFollowUpChange(e.target.value)}
          placeholder={t(`questions.${step.id}.followUpPlaceholder`)}
          rows={3}
          className="w-full mt-3 rounded-2xl bg-white border border-line px-4 py-3.5 text-[15px] text-ink placeholder:text-ink-faint outline-none focus:border-brand transition-colors resize-none"
        />
      )}

      {value && (
        <button
          onClick={onContinue}
          disabled={showFollowUp && !followUpValue.trim()}
          className="mt-4 w-full h-[54px] rounded-2xl bg-brand text-white text-[17px] font-bold hover:bg-brand-hover active:scale-[.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isLast ? t('submit') : t('next')}
        </button>
      )}
    </div>
  )
}

function TextView({ step, value, onChange, onNext, isLast }: {
  step: Step; value: string; onChange: (v: string) => void; onNext: () => void; isLast: boolean
}) {
  const { t } = useTranslation('survey')
  return (
    <div className="flex flex-col h-full">
      <p className="text-[13px] font-semibold text-brand mb-2.5">{t(`questions.${step.id}.eyebrow`)}</p>
      <h1 className="text-[22px] font-bold text-ink leading-snug mb-6 whitespace-pre-line">{t(`questions.${step.id}.title`)}</h1>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t(`questions.${step.id}.placeholder`)}
        rows={5}
        className="w-full rounded-2xl bg-white border border-line px-4 py-3.5 text-[15px] text-ink placeholder:text-ink-faint outline-none focus:border-brand transition-colors resize-none"
      />
      <div className="mt-auto pt-8 pb-6">
        <button
          onClick={onNext}
          disabled={!value.trim()}
          className="w-full h-[54px] rounded-2xl bg-brand text-white text-[17px] font-bold hover:bg-brand-hover active:scale-[.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isLast ? t('submit') : t('next')}
        </button>
      </div>
    </div>
  )
}
