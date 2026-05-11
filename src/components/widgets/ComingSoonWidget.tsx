interface Props {
  titleTh: string
  requiredPlan: 'pro' | 'business'
  descriptionTh?: string
}

export default function ComingSoonWidget({ titleTh, requiredPlan, descriptionTh }: Props) {
  const label = requiredPlan === 'pro' ? 'Pro' : 'Business'
  const badgeClass = requiredPlan === 'pro'
    ? 'bg-blue-100 text-blue-600'
    : 'bg-purple-100 text-purple-600'

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-4">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeClass}`}>{label}</span>
      <p className="text-sm font-semibold text-slate-700">{titleTh}</p>
      {descriptionTh && <p className="text-xs text-slate-400">{descriptionTh}</p>}
      <p className="text-xs text-slate-300 mt-1">🚧 กำลังพัฒนา</p>
    </div>
  )
}
