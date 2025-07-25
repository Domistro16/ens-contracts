import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

const ReferralProgress = ({ referrals } : {referrals: number}) => {
  const tiers = [
    {
      label: '🥉 Bronze',
      threshold: 2,
      percent: 15,
      unlocked: referrals >= 2,
    },
    {
      label: '🥈 Silver',
      threshold: 15,
      percent: 20,
      unlocked: referrals >= 15,
    },
    { label: '🥇 Gold', threshold: 20, percent: 25, unlocked: referrals >= 20 },
  ]

  const nextTier = tiers.find((t) => !t.unlocked)
  const currentTier = [...tiers].reverse().find((t) => t.unlocked)
  const progressToNext = nextTier ? (referrals / nextTier.threshold) * 100 : 100

  return (
    <Card className="w-full mx-auto p-4 mt-3 bg-neutral-800 border-[0.5px] border-neutral-500 text-gray-300">
      {' '}
      <CardContent>
        {' '}
        <h2 className="text-xl font-bold mb-2">Referral Bonus Progress</h2>{' '}
        <div className="mb-4">
          {' '}
          <p className="text-base">
            {' '}
            You’re currently on <Badge>{currentTier?.label} Tier</Badge> —
            earning <strong>{currentTier?.percent}%</strong> referral bonus{' '}
            {(currentTier?.percent as number) > 15 &&
              ', including lifetime renewals'}
            .{' '}
          </p>{' '}
        </div>
        {nextTier && (
          <div>
            <p className="text-sm mb-1">
              {nextTier.threshold - referrals} referrals away from{' '}
              <strong>{nextTier.label} Tier</strong> —
              <span className="ml-1">
                {nextTier.percent}% + lifetime renewals
              </span>
            </p>
            <Progress value={progressToNext} className="h-4 bg-gray-300" />
            <p className="text-xs text-gray-500 mt-1">
              {referrals} / {nextTier.threshold} referrals
            </p>
          </div>
        )}
        {!nextTier && (
          <div className="text-green-600 font-semibold mt-4">
            🎉 You’ve unlocked the highest tier — 🥇 Gold! Thanks for being a
            top supporter.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ReferralProgress
