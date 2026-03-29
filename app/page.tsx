'use client';

/**
 * 【機能概要】: タスク管理アプリのメインページ
 * 【実装方針】: useEffectでLocalStorageからタスク読み込み。追加・完了切り替え・削除をsaveTasksで永続化
 * 【設計方針】: 状態管理と操作ロジックをpage.tsxに集中させ、UIは各コンポーネントに委譲
 * 【リファクタ改善】:
 *   - フィルタUIをTaskFilterBarコンポーネントに分離（単一責任原則）
 *   - filteredTasks/activeTaskCountをuseMemoで最適化（不要な再計算防止）
 * 【テスト対応】: TC-012〜015(基本操作), TC-DELETE-01〜02(削除), TC-FILTER-01(フィルタ), TC-COUNT-01(件数)
 * 🔵 信頼性レベル: TASK-0002タスク定義・note.md 3.6「メインページ」に直接対応
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { Task } from '../types/task';
import { loadTasks, saveTasks } from '../lib/storage';
import TaskForm from '../components/TaskForm';
import TaskItem from '../components/TaskItem';
import TaskFilterBar, { type FilterType } from '../components/TaskFilterBar';

/**
 * 【機能概要】: タスク管理アプリのHomeページコンポーネント
 * 【実装方針】: useState でタスク状態管理、useEffect でLocalStorageから初回読み込み
 * 🔵 信頼性レベル: note.md 3.6「メインページ」データフロー図に直接対応
 */
export default function Home() {
  // 【状態管理】: タスク一覧を管理するstate。初期値は空配列（useEffectで読み込む）
  const [tasks, setTasks] = useState<Task[]>([]);

  /**
   * 【状態管理】: フィルタ状態を管理するstate
   * 【実装方針】: 'all'=全表示, 'active'=未完了のみ, 'completed'=完了のみ
   * 【リファクタ改善】: FilterType型をTaskFilterBarから共有してDRY化
   * 【テスト対応】: TC-FILTER-01（filter-activeボタンでフィルタリング）
   * 🔵 Greenフェーズ実装をリファクタ（型共有化）
   */
  const [filter, setFilter] = useState<FilterType>('all');

  // 【初回マウント時処理】: useEffectでLocalStorageからタスクを読み込んで表示（TC-012対応）
  // 【SSR対応】: loadTasks()内でtypeof window チェック済みのため安全
  useEffect(() => {
    // 【LocalStorage読み込み】: loadTasks()でタスク一覧を取得してstateに設定
    const loaded = loadTasks();
    setTasks(loaded);
  }, []);

  /**
   * 【機能概要】: 新規タスクを追加してLocalStorageに保存する
   * 【実装方針】: Date.now()でID生成、既存タスクの末尾に追加、saveTasks()で永続化
   * 【テスト対応】: TC-013(一覧反映), TC-015(LocalStorage永続化)
   * 🔵 信頼性レベル: note.md 3.6「addTask(): 新規タスクを追加しsaveTasksで永続化」に対応
   * @param {string} title - 追加するタスクのタイトル（trim済み）
   */
  const addTask = (title: string) => {
    // 【新規タスク生成】: IDはDate.now().toString()、作成日はISO 8601形式
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // 【状態更新】: 既存タスク配列の末尾に新規タスクを追加
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);

    // 【永続化】: 更新後のタスク配列をLocalStorageに保存（TC-015対応）
    saveTasks(updatedTasks);
  };

  /**
   * 【機能概要】: 指定IDのタスクの完了状態を反転してLocalStorageに保存する
   * 【実装方針】: map()で対象タスクのcompletedを反転、saveTasks()で永続化
   * 【テスト対応】: TC-014(完了状態切り替え)
   * 🔵 信頼性レベル: note.md 3.6「toggleTask(): 完了状態を反転しsaveTasksで永続化」に対応
   * @param {string} id - 完了状態を切り替えるタスクのID
   */
  const toggleTask = (id: string) => {
    // 【完了状態反転】: 対象タスクのcompletedをbooleanで反転する
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);

    // 【永続化】: 更新後のタスク配列をLocalStorageに保存
    saveTasks(updatedTasks);
  };

  /**
   * 【Greenフェーズ追加】: 指定IDのタスクを削除してLocalStorageに保存する
   * 【実装方針】: filter()で対象タスクを除外し、saveTasks()で永続化
   * 【テスト対応】: TC-DELETE-01（削除ボタンクリックでタスクが一覧から消える）
   * 🔵 Redフェーズ記録の実装方針「deleteTask: タスクをfilterで除外しlocalStorageも同期」に直接対応
   * @param {string} id - 削除するタスクのID
   */
  const deleteTask = (id: string) => {
    // 【タスク削除処理】: 指定IDを除外した新しいタスク配列を生成
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);

    // 【永続化】: 削除後のタスク配列をLocalStorageに保存
    saveTasks(updatedTasks);
  };

  /**
   * 【Greenフェーズ追加】: 完了済みタスクを一括削除してLocalStorageに保存する
   * 【実装方針】: filter()で未完了タスクのみ残し、saveTasks()で永続化
   * 【テスト対応】: TC-DELETE-02（clear-completedボタンで完了タスクが一括削除される）
   * 🔵 Redフェーズ記録の実装方針「clearCompleted: completedがfalseのタスクのみ残す」に直接対応
   */
  const clearCompleted = () => {
    // 【完了済み除外処理】: completedがtrueのタスクを全て除外する
    const updatedTasks = tasks.filter((task) => !task.completed);
    setTasks(updatedTasks);

    // 【永続化】: 一括削除後のタスク配列をLocalStorageに保存
    saveTasks(updatedTasks);
  };

  /**
   * 【機能概要】: フィルタ状態に応じて表示するタスクを絞り込む（メモ化済み）
   * 【改善内容】: Greenフェーズの直接計算をuseMemoでメモ化し、不要な再計算を防止
   * 【設計方針】: tasks/filter が変化した時のみ再計算。レンダリング毎の filter() 呼び出しを抑制
   * 【パフォーマンス】: タスク件数が増えた場合の計算コスト最適化
   * 【テスト対応】: TC-FILTER-01（filter-activeボタンで未完了タスクのみ表示）
   * 🟡 useMemo最適化はReactベストプラクティスから妥当な推測
   */
  const filteredTasks = useMemo(() => {
    // 【フィルタ処理】: filter stateに応じて表示するタスクを絞り込む
    if (filter === 'active') return tasks.filter((task) => !task.completed);   // 【未完了のみ】
    if (filter === 'completed') return tasks.filter((task) => task.completed); // 【完了のみ】
    return tasks;                                                                // 【全表示】
  }, [tasks, filter]);

  /**
   * 【機能概要】: 未完了タスクの件数を計算する（メモ化済み）
   * 【改善内容】: Greenフェーズの直接計算をuseMemoでメモ化し、不要な再計算を防止
   * 【設計方針】: tasksが変化した時のみ再計算。filter()とlengthの毎レンダリング実行を抑制
   * 【パフォーマンス】: フィルタ変更時はtasksが変わらないため再計算をスキップ
   * 【テスト対応】: TC-COUNT-01（task-count要素に未完了タスク数が表示される）
   * 🟡 useMemo最適化はReactベストプラクティスから妥当な推測
   */
  const activeTaskCount = useMemo(
    () => tasks.filter((task) => !task.completed).length,
    [tasks]
  );

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      {/* 【ページタイトル】: アプリケーションのヘッダー表示 */}
      <h1 className="text-2xl font-bold mb-6">社内タスク管理アプリ</h1>
      <p className="text-gray-500 text-sm mb-4">CAIOS デモ用サンプルアプリケーション</p>

      {/* 【タスク追加フォーム】: TaskFormコンポーネントにaddTaskをonAddとして渡す */}
      <TaskForm onAdd={addTask} />

      {/*
       * 【リファクタ改善】: フィルタUI を TaskFilterBar コンポーネントに委譲
       * 【改善内容】: Greenフェーズのインラインフィルタ実装をコンポーネント分離
       * 【設計方針】: page.tsxは状態管理のみ担当し、UIはTaskFilterBarに委譲
       * 【テスト対応】: TC-COUNT-01(task-count), TC-FILTER-01(filter-active), TC-DELETE-02(clear-completed)
       * 🔵 TaskFilterBarコンポーネントが同じdata-testid属性を保持するため、テストへの影響なし
       */}
      <TaskFilterBar
        activeCount={activeTaskCount}
        currentFilter={filter}
        onFilterChange={setFilter}
        onClearCompleted={clearCompleted}
      />

      {/*
       * 【タスク一覧】: filteredTasksをmap()でTaskItemとして表示
       * 【変更点】: Greenフェーズで tasks → filteredTasks に変更（フィルタ対応）
       * 【変更点】: onDelete={deleteTask} を追加（削除ボタン対応）
       */}
      <div>
        {filteredTasks.map((task) => (
          // 【キー設定】: Reactのリスト描画に必要なkeyとしてtask.idを使用
          <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
        ))}
      </div>
    </main>
  );
}
