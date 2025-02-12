'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { BarChart2, Calendar, ChevronLeft, Clock, Tag } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'

type DailyEntry = {
  id: string
  content: string
  study_time: number
  tags: string[]
  created_at: string
}

type TagSummary = {
  tag: string
  count: number
  totalTime: number
}

type TimeRange = '1週間' | '1ヶ月' | '3ヶ月' | '6ヶ月' | '1年'

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
]

const TIME_RANGES: TimeRange[] = ['1週間', '1ヶ月', '3ヶ月', '6ヶ月', '1年']

export default function Analytics() {
  const router = useRouter()
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1週間')
  const [tagSummary, setTagSummary] = useState<TagSummary[]>([])
  const [dailyStudyTime, setDailyStudyTime] = useState<{ date: string; minutes: number }[]>([])
  const [averageStudyTime, setAverageStudyTime] = useState(0)
  const [totalStudyTime, setTotalStudyTime] = useState(0)
  const [studyDays, setStudyDays] = useState(0)
  const [maxStudyTime, setMaxStudyTime] = useState(0)

  const calculateSummary = useCallback((data: DailyEntry[]) => {
    // タグごとの集計
    const tagMap = new Map<string, { count: number; totalTime: number }>()
    data.forEach(entry => {
      entry.tags?.forEach(tag => {
        const current = tagMap.get(tag) || { count: 0, totalTime: 0 }
        tagMap.set(tag, {
          count: current.count + 1,
          totalTime: current.totalTime + entry.study_time
        })
      })
    })

    const summary = Array.from(tagMap.entries())
      .map(([tag, { count, totalTime }]) => ({
        tag,
        count,
        totalTime
      }))
      .sort((a, b) => b.totalTime - a.totalTime)

    setTagSummary(summary)

    // 日別学習時間の集計
    const dailyMap = new Map<string, number>()
    data.forEach(entry => {
      const date = new Date(entry.created_at).toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric'
      })
      dailyMap.set(date, (dailyMap.get(date) || 0) + entry.study_time)
    })

    const dailyData = Array.from(dailyMap.entries())
      .map(([date, minutes]) => ({
        date,
        minutes
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date.replace('月', '/').replace('日', ''))
        const dateB = new Date(b.date.replace('月', '/').replace('日', ''))
        return dateA.getTime() - dateB.getTime()
      })

    setDailyStudyTime(dailyData)

    // 統計情報の計算
    const total = data.reduce((sum, entry) => sum + entry.study_time, 0)
    const uniqueDays = new Set(data.map(entry =>
      new Date(entry.created_at).toLocaleDateString()
    )).size
    const max = Math.max(...dailyData.map(d => d.minutes))

    setTotalStudyTime(total)
    setStudyDays(uniqueDays)
    setAverageStudyTime(uniqueDays > 0 ? Math.round(total / uniqueDays) : 0)
    setMaxStudyTime(max)
  }, [])

  const fetchEntries = useCallback(async () => {
    try {
      const rangeDate = getRangeDate(selectedRange)
      const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .gte('created_at', rangeDate.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error
      if (data) {
        setEntries(data)
        calculateSummary(data)
      }
    } catch (error) {
      console.error('学習記録の取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedRange, calculateSummary])

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      }
    }
    checkSession()
  }, [router])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const getRangeDate = (range: TimeRange) => {
    const now = new Date()
    switch (range) {
      case '1週間':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '1ヶ月':
        return new Date(now.setMonth(now.getMonth() - 1))
      case '3ヶ月':
        return new Date(now.setMonth(now.getMonth() - 3))
      case '6ヶ月':
        return new Date(now.setMonth(now.getMonth() - 6))
      case '1年':
        return new Date(now.setFullYear(now.getFullYear() - 1))
    }
  }

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours > 0) {
      return `${hours}時間${remainingMinutes > 0 ? ` ${remainingMinutes}分` : ''}`
    }
    return `${minutes}分`
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              ダッシュボードに戻る
            </Button>
            <h1 className="text-2xl font-bold">学習分析</h1>
          </div>
          <div className="flex gap-2">
            {TIME_RANGES.map((range) => (
              <Button
                key={range}
                variant={selectedRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        {!loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-card rounded-lg shadow">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Clock className="w-4 h-4" />
                  総学習時間
                </div>
                <div className="text-2xl font-bold">
                  {formatStudyTime(totalStudyTime)}
                </div>
              </div>
              <div className="p-4 bg-card rounded-lg shadow">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  学習日数
                </div>
                <div className="text-2xl font-bold">
                  {studyDays}日
                </div>
              </div>
              <div className="p-4 bg-card rounded-lg shadow">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <BarChart2 className="w-4 h-4" />
                  1日平均学習時間
                </div>
                <div className="text-2xl font-bold">
                  {formatStudyTime(averageStudyTime)}
                </div>
              </div>
              <div className="p-4 bg-card rounded-lg shadow">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Tag className="w-4 h-4" />
                  学習タグ数
                </div>
                <div className="text-2xl font-bold">
                  {tagSummary.length}個
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-card rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">学習時間の推移</h2>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyStudyTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis
                        label={{
                          value: '学習時間（分）',
                          angle: -90,
                          position: 'insideLeft'
                        }}
                      />
                      <Tooltip
                        formatter={(value: number) => formatStudyTime(value)}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="minutes"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-6 bg-card rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">タグ別学習時間分布</h2>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tagSummary}
                        dataKey="totalTime"
                        nameKey="tag"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({
                          cx,
                          cy,
                          midAngle,
                          innerRadius,
                          outerRadius,
                          value,
                          index
                        }) => {
                          const RADIAN = Math.PI / 180
                          const radius = 25 + innerRadius + (outerRadius - innerRadius)
                          const x = cx + radius * Math.cos(-midAngle * RADIAN)
                          const y = cy + radius * Math.sin(-midAngle * RADIAN)

                          return (
                            <text
                              x={x}
                              y={y}
                              className="text-xs"
                              fill="currentColor"
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                            >
                              {tagSummary[index].tag}
                            </text>
                          )
                        }}
                      >
                        {tagSummary.map((entry, index) => (
                          <Cell
                            key={entry.tag}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatStudyTime(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="p-6 bg-card rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">タグ別詳細分析</h2>
              <div className="grid gap-4">
                {tagSummary.map((tag) => (
                  <div
                    key={tag.tag}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="inline-block px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                        {tag.tag}
                      </span>
                      <span className="text-muted-foreground">
                        {tag.count}回の学習
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        平均: {formatStudyTime(Math.round(tag.totalTime / tag.count))}
                      </span>
                      <span className="font-medium">
                        合計: {formatStudyTime(tag.totalTime)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
