'use client';

/**
 * 【機能概要】: タスクフィルタバー（件数表示・フィルタ切り替え・一括削除）コンポーネント
 * 【改善内容】: app/page.tsxからフィルタUI関連のJSXを切り出し、単一責任原則を適用
 * 【設計方針】: 表示ロジックと状態管理を親（page.tsx）に保持し、UIのみを担当するプレゼンテーションコンポーネント
 * 【テスト対応】: TC-COUNT-01(task-count), TC-FILTER-01(filter-active), TC-DELETE-02(clear-completed)
 * 【保守性】: フィルタ関連のUIを1ファイルに集約することで変更時の影響範囲を限定
 * 🔵 信頼性レベル: Greenフェーズのpage.tsx実装から抽出。単一責任原則の適用
 */

import React from 'react';

// 【型定義】: フィルタの種類。'all'=全表示, 'active'=未完了, 'completed'=完了
// 🔵 Greenフェーズのfilter state定義と同一
export type FilterType = 'all' | 'active' | 'completed';

// 【型定義】: TaskFilterBarが受け取るpropsの型
interface TaskFilterBarProps {
  /** 未完了タスクの件数（task-count要素に表示される） */
  activeCount: number;
  /** 現在のフィルタ状態 */
  currentFilter: FilterType;
  /** フィルタ変更時のコールバック */
  onFilterChange: (filter: FilterType) => void;
  /** 完了済みタスク一括削除時のコールバック */
  onClearCompleted: () => void;
}

/**
 * 【機能概要】: タスク一覧のフィルタ操作バーコンポーネント
 * 【改善内容】: page.tsxから切り出したプレゼンテーションコンポーネント
 * 【設計方針】: 状態を持たず、propsのみで表示を制御するステートレスコンポーネント
 * 【パフォーマンス】: 状態変化は親コンポーネントで管理するため、不要な再レンダリングを抑制
 * 🔵 信頼性レベル: Greenフェーズの実装を機能変更なしで分離
 */
export default function TaskFilterBar({
  activeCount,
  currentFilter,
  onFilterChange,
  onClearCompleted,
}: TaskFilterBarProps) {
  return (
    // 【コンテナ】: フィルタ要素を横並びに配置するフレックスコンテナ
    <div className="flex items-center gap-4 mb-4 py-2">
      {/*
       * 【未完了タスク件数表示】: data-testid="task-count" でTC-COUNT-01から参照される
       * 【表示内容】: activeCount（completedがfalseのタスク数）+ 「件」のテキスト
       * 🔵 Greenフェーズのapp/page.tsxから移植
       */}
      <span data-testid="task-count" className="text-sm text-gray-600">
        {activeCount}件
      </span>

      {/*
       * 【未完了フィルタボタン】: data-testid="filter-active" でTC-FILTER-01から参照される
       * 【処理内容】: クリック時にonFilterChangeで'active'フィルタを親に通知
       * 【アクティブ状態】: currentFilterが'active'の場合に強調スタイルを適用
       * 🔵 Greenフェーズのapp/page.tsxから移植
       */}
      <button
        data-testid="filter-active"
        onClick={() => onFilterChange('active')}
        className={
          currentFilter === 'active'
            ? 'text-sm text-blue-700 font-bold'
            : 'text-sm text-blue-500 hover:text-blue-700'
        }
      >
        未完了
      </button>

      {/*
       * 【全件表示ボタン】: data-testid="filter-all" でテストから参照可能
       * 【処理内容】: クリック時にonFilterChangeで'all'フィルタを親に通知（フィルタリセット）
       * 【アクティブ状態】: currentFilterが'all'の場合に強調スタイルを適用
       * 🔵 Greenフェーズのapp/page.tsxから移植
       */}
      <button
        data-testid="filter-all"
        onClick={() => onFilterChange('all')}
        className={
          currentFilter === 'all'
            ? 'text-sm text-gray-700 font-bold'
            : 'text-sm text-gray-500 hover:text-gray-700'
        }
      >
        すべて
      </button>

      {/*
       * 【完了済み一括削除ボタン】: data-testid="clear-completed" でTC-DELETE-02から参照される
       * 【処理内容】: クリック時にonClearCompleted()を呼び出し、親が完了タスクを一括削除
       * 【配置】: ml-autoで右端に配置し、操作の重要度を視覚的に区別
       * 🔵 Greenフェーズのapp/page.tsxから移植
       */}
      <button
        data-testid="clear-completed"
        onClick={onClearCompleted}
        className="text-sm text-red-400 hover:text-red-600 ml-auto"
      >
        完了済みを削除
      </button>
    </div>
  );
}
