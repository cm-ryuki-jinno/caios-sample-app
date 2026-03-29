'use client';

/**
 * 【機能概要】: 新規タスク追加フォームコンポーネント
 * 【実装方針】: テキスト入力フィールドと追加ボタンを提供。空文字・空白のみ入力は無効
 * 【テスト対応】: TC-001(onAdd呼び出し), TC-002(フィールドクリア), TC-003(Enterキー),
 *              TC-016(空文字無効), TC-017(空白のみ無効), TC-021(trim処理), TC-022(1文字)
 * 🔵 信頼性レベル: TASK-0002タスク定義・note.md 3.4「TaskFormコンポーネント」に直接対応
 */

import React, { useState } from 'react';

// 【型定義】: TaskFormが受け取るpropsの型
interface TaskFormProps {
  /** タスク追加時に呼ばれるコールバック関数（trim済みのタイトル文字列を渡す） */
  onAdd: (title: string) => void;
}

/**
 * 【機能概要】: タスク追加フォームのReactコンポーネント
 * 【実装方針】: useState で入力値を管理し、追加時にtrim処理・バリデーション・コールバック呼び出しを行う
 * 【テスト対応】: data-testid="task-input", data-testid="add-button" を使用した操作
 * 🔵 信頼性レベル: TASK-0002タスク定義に直接対応
 */
export default function TaskForm({ onAdd }: TaskFormProps) {
  // 【状態管理】: 入力フィールドの現在値を管理するstate
  const [title, setTitle] = useState('');

  /**
   * 【機能概要】: フォーム送信（ボタン押下・Enterキー）時の処理
   * 【実装方針】: バリデーション → onAdd呼び出し → フィールドクリアの順に処理
   * 🔵 信頼性レベル: note.md 3.4「追加後、入力フィールドをクリア」「空文字ではonAddを呼ばない」に対応
   */
  const handleSubmit = (e: React.FormEvent) => {
    // 【デフォルト動作抑制】: formのsubmitによるページリロードを防ぐ（TC-003 Enterキー対応）
    e.preventDefault();

    // 【バリデーション】: trim後に空文字の場合はonAddを呼ばない（TC-016空文字, TC-017空白のみ対応）
    if (!title.trim()) return;

    // 【コールバック呼び出し】: trim済みのタイトル文字列でonAddを呼ぶ（TC-001, TC-021 trim処理対応）
    onAdd(title.trim());

    // 【フィールドクリア】: タスク追加後に入力フィールドを空にする（TC-002対応）
    setTitle('');
  };

  return (
    // 【フォーム要素】: onSubmitでEnterキーによる送信も処理（TC-003対応）
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      {/* 【入力フィールド】: data-testid="task-input" でテストから参照される（TC-001等） */}
      <input
        type="text"
        data-testid="task-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タスクを入力..."
        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
      />
      {/* 【追加ボタン】: data-testid="add-button" でテストから参照される（TC-001等） */}
      <button
        type="submit"
        data-testid="add-button"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        追加
      </button>
    </form>
  );
}
