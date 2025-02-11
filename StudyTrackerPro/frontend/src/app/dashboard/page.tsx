'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { PenSquare, LogOut, Edit, Trash2, Clock, Tag, BarChart2, Calendar, Sparkles } from 'lucide-react'
import { marked } from 'marked'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

type DailyStudyTime = {
  date: string
  minutes: number
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
]

export default function Dashboard() {
  const router = useRouter()
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [totalStudyTime, setTotalStudyTime] = useState(0)
  const [weeklyStudyTime, setWeeklyStudyTime] = useState(0)
  const [tagSummary, setTagSummary] = useState<TagSummary[]>([])
  const [dailyStudyTime, setDailyStudyTime] = useState<DailyStudyTime[]>([])

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
  }, [])

  useEffect(() => {
    if (entries.length > 0) {
      calculateSummary()
    }
  }, [entries])

  const calculateSummary = () => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 総学習時間の計算
    const total = entries.reduce((sum, entry) => sum + entry.study_time, 0)
    setTotalStudyTime(total)

    // 週間学習時間の計算
    const weekly = entries
      .filter(entry => new Date(entry.created_at) >= oneWeekAgo)
      .reduce((sum, entry) => sum + entry.study_time, 0)
    setWeeklyStudyTime(weekly)

    // タグごとの集計
    const tagMap = new Map<string, { count: number; totalTime: number }>()
    entries.forEach(entry => {
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
    entries
      .filter(entry => new Date(entry.created_at) >= oneWeekAgo)
      .forEach(entry => {
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
  }

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('学習記録の取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleEdit = (entry: DailyEntry) => {
    router.push(`/daily-entry/edit/${entry.id}`)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('この学習記録を削除してもよろしいですか？')) {
      return
    }

    setDeleting(id)
    try {
      const { error } = await supabase
        .from('daily_entries')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchEntries()
    } catch (error) {
      console.error('削除中にエラーが発生しました:', error)
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#FF8FE2]">
              StudyTracker Pro
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/daily-entry')}
              className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            >
              <PenSquare className="w-4 h-4 mr-2" />
              学習を記録
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/analytics')}
              className="hover:bg-primary/10"
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              詳細分析
            </Button>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-destructive hover:bg-destructive/10 hover:text-destructive font-medium transition-colors rounded-lg border border-destructive/20"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </Button>
          </div>
        </div>

        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#FF8FE2]">
                  <BarChart2 className="w-5 h-5 text-primary" />
                  学習時間サマリー
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                    <span className="text-muted-foreground">総学習時間</span>
                    <span className="font-medium text-lg">{formatStudyTime(totalStudyTime)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                    <span className="text-muted-foreground">直近7日間</span>
                    <span className="font-medium text-lg">{formatStudyTime(weeklyStudyTime)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#FF8FE2]">
                  <Tag className="w-5 h-5 text-primary" />
                  タグ分析
                </h2>
                <div className="space-y-3">
                  {tagSummary.slice(0, 5).map((tag, index) => (
                    <div key={tag.tag} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <span className="tag px-3 py-1 rounded-full text-sm font-medium">
                          {tag.tag}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {tag.count}回
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatStudyTime(tag.totalTime)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                <h2 className="text-xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#FF8FE2]">
                  学習時間の推移
                </h2>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyStudyTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        label={{
                          value: '学習時間（分）',
                          angle: -90,
                          position: 'insideLeft',
                          style: { fill: 'hsl(var(--muted-foreground))' }
                        }}
                      />
                      <Tooltip
                        formatter={(value: number) => formatStudyTime(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar
                        dataKey="minutes"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                <h2 className="text-xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#FF8FE2]">
                  タグ別学習時間分布
                </h2>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tagSummary.slice(0, 5)}
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
                              className="text-xs fill-current"
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                            >
                              {tagSummary[index].tag}
                            </text>
                          )
                        }}
                      >
                        {tagSummary.slice(0, 5).map((entry, index) => (
                          <Cell
                            key={entry.tag}
                            fill={`hsl(var(--chart-${index + 1}))`}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatStudyTime(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-card rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-primary/10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#FF8FE2] animate-pulse" />
                        <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#FF8FE2] to-[#FF6B6B]">
                          {formatDate(entry.created_at)}の記録
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{formatStudyTime(entry.study_time)}</span>
                        </div>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {entry.tags.map((tag) => (
                              <span
                                key={tag}
                                className="tag px-3 py-1.5 rounded-lg text-sm font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                        className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        編集
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleting === entry.id}
                        className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {deleting === entry.id ? '削除中...' : '削除'}
                      </Button>
                    </div>
                  </div>
                  <div className="bg-secondary/30 rounded-xl p-4 prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-h1:text-[#FF8FE2] prose-h2:text-[#FF8FE2] prose-h3:text-[#FF8FE2] prose-h4:text-[#FF8FE2] prose-h5:text-[#FF8FE2] prose-h6:text-[#FF8FE2] prose-a:text-primary hover:prose-a:text-primary/80">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: marked(entry.content, { breaks: true })
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {loading && (
          <div className="bg-card rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="bg-card rounded-2xl shadow-lg p-8 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <Sparkles className="w-12 h-12 text-primary mx-auto" />
              <p className="text-lg font-medium">
                まだ学習記録がありません
              </p>
              <p className="text-muted-foreground">
                右上の「学習を記録」ボタンから、最初の記録を始めましょう！
              </p>
              <Button
                onClick={() => router.push('/daily-entry')}
                className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
              >
                <PenSquare className="w-4 h-4 mr-2" />
                学習を記録する
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
