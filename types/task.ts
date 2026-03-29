/**
 * 【機能概要】: タスクデータの型定義
 * 【実装方針】: TASK-0002タスク定義の型定義セクションに直接対応
 * 【テスト対応】: storage.test.ts, TaskItem.test.tsx等で参照されるTask型
 * 🔵 信頼性レベル: TASK-0002タスク定義「型定義」に直接対応
 */

export interface Task {
  /** タスクの一意識別子（Date.now().toString()で生成） */
  id: string;
  /** タスクのタイトル文字列 */
  title: string;
  /** 完了状態（true: 完了、false: 未完了） */
  completed: boolean;
  /** ISO 8601形式の作成日時 */
  createdAt: string;
}
