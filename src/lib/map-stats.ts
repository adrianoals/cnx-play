import type { UserStats, PlatformTotals, LeaderboardRow } from '@/types'

export function mapUserStats(row: Record<string, unknown>): UserStats {
  return {
    userId: row.user_id as string,
    fullName: (row.full_name as string) || '',
    companyName: (row.company_name as string) || null,
    meetingsCompleted: Number(row.meetings_completed) || 0,
    referralsCompleted: Number(row.referrals_completed) || 0,
    referralPoints: Number(row.referral_points) || 0,
    totalDealValue: Number(row.total_deal_value) || 0,
    dealCount: Number(row.deal_count) || 0,
    score: Number(row.score) || 0,
    level: (row.level as string) || 'Platina',
  }
}

export function mapPlatformTotals(row: Record<string, unknown>): PlatformTotals {
  return {
    activeUsers: Number(row.active_users) || 0,
    totalMeetings: Number(row.total_meetings) || 0,
    totalDealValue: Number(row.total_deal_value) || 0,
    totalDeals: Number(row.total_deals) || 0,
    totalReferrals: Number(row.total_referrals) || 0,
    pendingApprovals: Number(row.pending_approvals) || 0,
  }
}

export function mapLeaderboardRow(row: Record<string, unknown>): LeaderboardRow {
  return {
    userId: row.user_id as string,
    fullName: (row.full_name as string) || '',
    companyName: (row.company_name as string) || null,
    avatarUrl: (row.avatar_url as string) || null,
    score: Number(row.score) || 0,
    meetingsCompleted: Number(row.meetings_completed) || 0,
    totalDealValue: Number(row.total_deal_value) || 0,
    dealCount: Number(row.deal_count) || 0,
    level: (row.level as string) || 'Platina',
    rankPosition: Number(row.rank_position) || 0,
  }
}
