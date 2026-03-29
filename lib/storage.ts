/**
 * 【機能概要】: LocalStorageを使ったタスクデータの永続化ユーティリティ
 * 【実装方針】: SSR対応・try-catchエラーハンドリング・初期データフォールバックを実装
 * 【テスト対応】: TC-004〜TC-006, TC-018, TC-019, TC-023, TC-024
 * 🔵 信頼性レベル: TASK-0002タスク定義・note.md「LocalStorageユーティリティ」に直接対応
 */

import type { Task } from '../types/task';

// 【定数定義】: LocalStorageのキー名。テスト(TC-015)で直接参照される
const STORAGE_KEY = 'caios-tasks';

/**
 * 【機能概要】: 初期表示用のサンプルタスクデータを返す
 * 【実装方針】: LocalStorage未設定時(TC-005)・SSR時(TC-018)・JSONエラー時(TC-019)のフォールバックに使用
 * 【テスト対応】: TC-005「AWS環境の確認」「月次レポート作成」の2件
 * 🔵 信頼性レベル: note.md 6.4「初期データの用意」に直接対応
 */
function getInitialTasks(): Task[] {
  // 【初期データ生成】: デモ表示用の2件のサンプルタスクを返す
  const now = new Date().toISOString();
  return [
    {
      // 【タスク1】: 未完了の確認作業タスク（TC-005で title='AWS環境の確認', completed=false を検証）
      id: 'initial-1',
      title: 'AWS環境の確認',
      completed: false,
      createdAt: now,
    },
    {
      // 【タスク2】: 完了済みのレポートタスク（TC-005で title='月次レポート作成', completed=true を検証）
      id: 'initial-2',
      title: '月次レポート作成',
      completed: true,
      createdAt: now,
    },
  ];
}

/**
 * 【機能概要】: LocalStorageからタスク一覧を読み込む
 * 【実装方針】: SSR対応（typeof window チェック）+ JSON.parseのtry-catchによる安全な読み込み
 * 【テスト対応】: TC-004(往復), TC-005(未設定時), TC-006(複数件), TC-018(SSR), TC-019(不正JSON), TC-023(空配列), TC-024(長タイトル)
 * 🔵 信頼性レベル: note.md 3.2・6.1 SSR対応、要件定義書 4.7 フォールバックに対応
 * @returns {Task[]} LocalStorageのタスク配列。未設定・SSR・エラー時は初期データ
 */
export function loadTasks(): Task[] {
  // 【SSR保護】: サーバーサイドレンダリング時はwindowが存在しないため初期データを返す（TC-018対応）
  // 【実装内容】: typeof window === 'undefined' でSSR環境を検出
  if (typeof window === 'undefined') {
    return getInitialTasks();
  }

  try {
    // 【LocalStorage読み込み】: 'caios-tasks' キーからJSONデータを取得
    const stored = localStorage.getItem(STORAGE_KEY);

    // 【未設定チェック】: データがない場合（初回アクセス）は初期データを返す（TC-005対応）
    if (stored === null) {
      return getInitialTasks();
    }

    // 【JSONパース】: 保存されたJSON文字列をTask配列に変換（TC-004, TC-006, TC-023, TC-024対応）
    const parsed: unknown = JSON.parse(stored);

    // 【型バリデーション】: パース結果が配列であることを確認（LocalStorage改ざん対策）
    // 【安全性向上】: 配列以外のデータ（文字列・オブジェクト等）が保存されていた場合に初期データへフォールバック
    // 🟡 信頼性レベル: JSON.parse結果の型安全性確保のため防御的実装として追加
    if (!Array.isArray(parsed)) {
      return getInitialTasks();
    }

    return parsed as Task[];
  } catch {
    // 【エラーハンドリング】: JSON.parseが失敗した場合（不正なJSONデータ等）は初期データへフォールバック（TC-019対応）
    // 【フォールバック理由】: アプリのクラッシュを防ぎ、安全な初期状態を保証する
    return getInitialTasks();
  }
}

/**
 * 【機能概要】: タスク一覧をLocalStorageに保存する
 * 【実装方針】: SSR保護を追加。Task配列をJSON.stringifyしてLocalStorageに保存する
 * 【改善内容】: SSR環境（typeof window === 'undefined'）では保存をスキップするSSR保護を追加
 * 【設計方針】: loadTasksと対称的なSSR保護を持たせることで、一貫した安全性を確保
 * 🟡 信頼性レベル: TASK-0002タスク定義「saveTasks(tasks): void」に対応。SSR保護はloadTasksの実装方針から推測
 * @param {Task[]} tasks - 保存するタスク配列
 */
export function saveTasks(tasks: Task[]): void {
  // 【SSR保護】: サーバーサイドレンダリング時はwindowが存在しないため保存をスキップ
  // 【対称性】: loadTasksのSSR保護と同じパターンでSSR環境を検出
  if (typeof window === 'undefined') {
    return;
  }

  // 【JSON変換・保存】: Task配列をJSON文字列に変換し、'caios-tasks'キーで保存
  // 【キー名】: TC-015でlocalStorage.getItem('caios-tasks')として直接参照される
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
