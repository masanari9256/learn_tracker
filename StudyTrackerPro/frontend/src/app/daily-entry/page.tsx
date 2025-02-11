'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { X, ChevronLeft, Clock, Tag as TagIcon, Sparkles, Eye } from 'lucide-react'
import { marked } from 'marked'

export default function DailyEntry() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [studyTime, setStudyTime] = useState('')
  const [currentTag, setCurrentTag] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault()
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()])
      }
      setCurrentTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSave = async () => {
    if (!studyTime || isNaN(Number(studyTime)) || Number(studyTime) <= 0) {
      setError('有効な学習時間を入力してください')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      const { error: saveError } = await supabase
        .from('daily_entries')
        .insert([
          {
            user_id: user.id,
            content,
            study_time: Number(studyTime),
            tags,
            created_at: new Date().toISOString(),
          }
        ])

      if (saveError) throw saveError

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
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
              学習を記録
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
              disabled={loading || !content.trim() || !studyTime}
              className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            >
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid gap-8">
          <div className="bg-card rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="w-4 h-4" />
                学習時間（分）
              </label>
              <Input
                type="number"
                min="1"
                value={studyTime}
                onChange={(e) => setStudyTime(e.target.value)}
                placeholder="学習時間を分単位で入力"
                className="max-w-[200px] bg-secondary/50 border-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TagIcon className="w-4 h-4" />
                タグ
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="tag inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="タグを入力してEnterで追加"
                className="max-w-[300px] bg-secondary/50 border-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
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
    </div>
  )
}
