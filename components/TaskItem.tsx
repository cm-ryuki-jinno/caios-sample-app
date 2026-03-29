'use client';

/**
 * 【機能概要】: 個別タスク行の表示・チェックボックス操作・削除コンポーネント
 * 【実装方針】: タスクデータを受け取り、完了状態に応じたスタイルとチェックボックス操作・削除ボタンを提供
 * 【テスト対応】: TC-007(未完了表示), TC-008(完了時打ち消し線), TC-009(onToggle呼び出し),
 *              TC-010(formatDate表示), TC-011(日付フォーマット),
 *              TC-DELETE-01(削除ボタン追加 - Greenフェーズ実装)
 * 🔵 信頼性レベル: TASK-0002タスク定義・note.md 3.5「TaskItemコンポーネント」に直接対応
 *              Greenフェーズ追加分はRedフェーズ記録の実装方針に基づく
 */

import React from 'react';
import type { Task } from '../types/task';
import { formatDate } from '../lib/dateUtils';

// 【型定義】: TaskItemが受け取るpropsの型
interface TaskItemProps {
  /** 表示対象のタスクデータ */
  task: Task;
  /** チェックボックス変更時のコールバック（タスクIDを渡す） */
  onToggle: (id: string) => void;
  /**
   * 【Greenフェーズ追加】: 削除ボタン押下時のコールバック（タスクIDを渡す）
   * 🔵 Redフェーズ記録「TC-DELETE-01: onDelete: (id: string) => void propsを追加」に対応
   */
  onDelete: (id: string) => void;
}

/**
 * 【機能概要】: タスクアイテムのReactコンポーネント
 * 【実装方針】: task.completedに応じてタイトルのスタイルを切り替え、formatDateで日付表示。
 *              Greenフェーズで削除ボタンを追加
 * 🔵 信頼性レベル: TASK-0002タスク定義に直接対応
 */
export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    // 【ルート要素】: data-testid="task-item" でテストから参照される（TC-012等で件数検証に使用）
    <div data-testid="task-item" className="flex items-center gap-3 py-2 border-b border-gray-100">
      {/* 【チェックボックス】: data-testid="task-checkbox" でテストから参照される（TC-009, TC-014等） */}
      {/* 【onChange処理】: クリック時にonToggleをtask.idを引数に呼び出す（TC-009対応） */}
      <input
        type="checkbox"
        data-testid="task-checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="w-4 h-4 cursor-pointer"
      />
      {/* 【タイトル表示】: 完了状態に応じてline-through text-gray-400を適用（TC-008対応） */}
      {/* 【スタイル切り替え】: task.completedがtrueの場合のみ打ち消し線クラスを付与 */}
      <span
        className={task.completed ? 'line-through text-gray-400 flex-1' : 'flex-1'}
      >
        {task.title}
      </span>
      {/* 【作成日表示】: data-testid="task-date" でテストから参照される（TC-010対応） */}
      {/* 【formatDate呼び出し】: lib/dateUtils の formatDate() でISO日付文字列を整形（TC-011対応） */}
      <span data-testid="task-date" className="text-sm text-gray-400">
        {formatDate(task.createdAt)}
      </span>
      {/*
       * 【Greenフェーズ追加】: 削除ボタン
       * 【実装方針】: data-testid="delete-button" でテストから参照される（TC-DELETE-01対応）
       * 【処理内容】: クリック時にonDeleteをtask.idを引数に呼び出す
       * 🔵 Redフェーズ記録の実装方針「TaskItemに削除ボタン追加 + onDelete props追加」に直接対応
       */}
      <button
        data-testid="delete-button"
        onClick={() => onDelete(task.id)}
        className="text-red-400 hover:text-red-600 text-sm ml-2"
      >
        削除
      </button>
    </div>
  );
}
