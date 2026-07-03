'use client'

import { useState } from 'react'
import { X, BookOpen, Sparkles } from 'lucide-react'

interface HelpModalProps {
  onClose: () => void
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd style={{
      display: 'inline-block', padding: '1px 6px', borderRadius: 4,
      background: 'var(--paper-0)', border: '1px solid var(--rule)',
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
      boxShadow: '0 1px 0 var(--rule)',
    }}>
      {children}
    </kbd>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 className="hand" style={{
        fontSize: 18, fontWeight: 600, color: 'var(--ink)',
        marginBottom: 8, paddingBottom: 4,
        borderBottom: '1px dashed var(--rule)',
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function ShortcutRow({ keys, desc }: { keys: React.ReactNode; desc: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '4px 0',
    }}>
      <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{desc}</span>
      <span style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 12 }}>{keys}</span>
    </div>
  )
}

type Tab = 'usage' | 'updates'

function UsageContent() {
  return (
    <>
      <Section title="基本操作">
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
          <p>キャンバスをダブルクリックしてフィールドを作成します。</p>
          <p>フィールド内の「+ ブロック追加」でセリフブロックを追加します。</p>
          <p>ハンドル（丸いノード）をドラッグして別のフィールドに接続できます。</p>
          <p>ハンドルを空のスペースにドラッグすると新しいフィールドが作成され、自動的に接続されます。</p>
          <p>ハンドルを Alt+クリック すると接続を削除できます。</p>
          <p>フィールド名をダブルクリックで編集できます。</p>
          <p>フィールドの右端をドラッグして幅を変更できます。</p>
        </div>
      </Section>

      <Section title="範囲選択・複数選択">
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
          <p>キャンバスの空きスペースを左ドラッグして矩形範囲を描き、複数のフィールドを一括選択できます。</p>
          <p>キャンバスの移動（パン）はマウスの中ボタン or 右ボタンでドラッグします。</p>
          <p>Shift+クリックでフィールドを追加選択できます。</p>
          <p>複数選択中にフィールドをドラッグすると、選択中の全フィールドがまとめて移動します。</p>
          <p>複数選択時にツールバーが表示され、グループ作成や一括削除が行えます。</p>
        </div>
      </Section>

      <Section title="グループ">
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
          <p>複数フィールドを選択してツールバーの「グループ作成」で、フィールドをグループ化できます。</p>
          <p>グループ名をダブルクリックで編集できます。</p>
          <p>カラードットをクリックしてグループの輪郭色を変更できます。</p>
          <p>✕ボタンでグループを解除できます（フィールドは残ります）。</p>
        </div>
      </Section>

      <Section title="ショートカットキー">
        <ShortcutRow desc="元に戻す" keys={<><Kbd>Ctrl</Kbd><Kbd>Z</Kbd></>} />
        <ShortcutRow desc="やり直し" keys={<><Kbd>Ctrl</Kbd><Kbd>Y</Kbd></>} />
        <ShortcutRow desc="範囲選択" keys={<span>空きスペースをドラッグ</span>} />
        <ShortcutRow desc="追加選択" keys={<><Kbd>Shift</Kbd><span>+クリック</span></>} />
        <ShortcutRow desc="ブロック追加" keys={<><Kbd>Ctrl</Kbd><Kbd>Enter</Kbd></>} />
        <ShortcutRow desc="前のキャラクターに切替" keys={<><Kbd>Alt</Kbd><Kbd>↑</Kbd></>} />
        <ShortcutRow desc="次のキャラクターに切替" keys={<><Kbd>Alt</Kbd><Kbd>↓</Kbd></>} />
      </Section>

      <Section title="プロジェクト管理">
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
          <p>ヘッダーのプロジェクト名をクリックするとプロジェクト一覧が開きます。</p>
          <p>プロジェクトの新規作成・名前変更・削除・切り替えが行えます。</p>
          <p>データはブラウザのローカルストレージに自動保存されます。</p>
        </div>
      </Section>

      <Section title="プレビュー">
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
          <p>フィールドを選択すると、接続先を含む会話の流れが右ペインに表示されます。</p>
          <p>プレビューペインの境界をドラッグして幅を調整できます。</p>
          <p>閉じるボタンでプレビューを折りたためます。</p>
        </div>
      </Section>
    </>
  )
}

interface UpdateEntry {
  date: string
  version: string
  items: string[]
}

const updates: UpdateEntry[] = [
  {
    date: '2026/07/04',
    version: 'v1.0.3',
    items: [
      '接続点とノードが見た目通りに接続されていない不具合を修正'
    ],
  },
  {
    date: '2026/05/27',
    version: 'v1.0.2',
    items: [
      'Markdown + Mermaid形式でのエクスポートに対応',
      'ノードのアニメーションを停止',
    ],
  },
  {
    date: '2026/05/26',
    version: 'v1.0.1',
    items: [
      '矩形範囲選択・複数フィールドの一括移動に対応',
      'グループ機能を追加（名前・色付き輪郭線）',
      'フィールド幅のドラッグリサイズに対応',
      'デフォルトフィールド名を空白に変更',
    ],
  },
  {
    date: '2026/05/25',
    version: 'v1.0.0',
    items: [
      '初回リリース',
    ],
  },
]

function UpdatesContent() {
  return (
    <>
      {updates.map((entry, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8,
            marginBottom: 8, paddingBottom: 4,
            borderBottom: '1px dashed var(--rule)',
          }}>
            <span className="hand" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>
              {entry.version}
            </span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              {entry.date}
            </span>
          </div>
          <ul style={{
            fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.8,
            margin: 0, paddingLeft: 18,
          }}>
            {entry.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </>
  )
}

export function HelpModal({ onClose }: HelpModalProps) {
  const [tab, setTab] = useState<Tab>('usage')

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'usage', label: '使い方', icon: <BookOpen size={16} /> },
    { id: 'updates', label: 'アップデート', icon: <Sparkles size={16} /> },
  ]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(40,30,15,0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--paper-2)', borderRadius: 18,
        boxShadow: 'var(--shadow-deep)',
        width: '90%', maxWidth: 560, maxHeight: '80vh',
        display: 'flex', overflow: 'hidden',
      }}>
        {/* Sidebar */}
        <div style={{
          width: 56, flexShrink: 0,
          background: 'var(--paper-1)',
          borderRight: '1px solid var(--rule)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', paddingTop: 12, gap: 4,
        }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              title={t.label}
              style={{
                width: 40, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, border: 'none', cursor: 'pointer',
                background: tab === t.id ? 'var(--paper-3)' : 'transparent',
                color: tab === t.id ? 'var(--ink)' : 'var(--ink-faint)',
                boxShadow: tab === t.id ? '0 1px 3px rgba(40,30,15,0.12)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', padding: '16px 20px 12px',
            borderBottom: '1px dashed var(--rule)',
          }}>
            <span className="hand" style={{ fontSize: 22, fontWeight: 600, flex: 1 }}>
              {tabs.find(t => t.id === tab)?.label}
            </span>
            <button onClick={onClose} className="btn-ghost" style={{ padding: 6, border: 'none' }}>
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {tab === 'usage' && <UsageContent />}
            {tab === 'updates' && <UpdatesContent />}
          </div>
        </div>
      </div>
    </div>
  )
}
