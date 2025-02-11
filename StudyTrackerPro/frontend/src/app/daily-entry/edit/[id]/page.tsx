'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { Eye, ChevronLeft } from 'lucide-react'
import { marked } from 'marked'

export default function EditDailyEntry({
  params
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('daily_entries')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) throw error
        if (!data) throw new Error('記録が見つかりません')

        setContent(data.content)
      } catch (err) {
        setError(err instanceof Error ? err.message : '記録の取得に失敗しました')
        console.error('記録の取得に失敗しました:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEntry()
  }, [params.id, router])

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const { error: saveError } = await supabase
        .from('daily_entries')
        .update({ content })
        .eq('id', params.id)

      if (saveError) throw saveError

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存中にエラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
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
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#FF8FE2]">
              学習記録の編集
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">学習内容</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {isPreview ? 'エディタに戻る' : 'プレビュー'}
            </Button>
          </div>

          {isPreview ? (
            <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
              <div
                dangerouslySetInnerHTML={{
                  __html: marked(content, { breaks: true })
                }}
              />
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="学習内容を記録しましょう..."
              className="min-h-[500px] p-4 bg-transparent border-0 rounded-none focus-visible:ring-0 resize-none font-mono text-base leading-relaxed"
            />
          )}
        </div>
      </div>
    </div>
  )
}
