/**
 * LocalStorageユーティリティ（storage.ts）ユニットテスト
 * 対応テストケース: TC-004, TC-005, TC-006, TC-018, TC-019, TC-023, TC-024
 *
 * テストフレームワーク: Vitest 1.0.0
 * テスト実行: npm run test:unit (= vitest run)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Task } from '../../types/task';

// 【実装対象】: まだ存在しないユーティリティ関数をインポート（Redフェーズ: 失敗することを確認）
import { saveTasks, loadTasks } from '../../lib/storage';

describe('LocalStorageユーティリティ（storage.ts）', () => {
  beforeEach(() => {
    // 【テスト前準備】: LocalStorageをクリアして各テストを独立した状態で開始
    // 【環境初期化】: 前のテストのデータが残留しないことを保証
    localStorage.clear();
  });

  afterEach(() => {
    // 【テスト後処理】: モックを復元し、LocalStorageをクリーンにする
    // 【状態復元】: 次のテストに影響しないよう環境をリセット
    vi.restoreAllMocks();
    localStorage.clear();
  });

  // =====================================================================
  // 正常系テストケース
  // =====================================================================

  it('TC-004: saveTasksで保存したデータがloadTasksで正しく復元される', () => {
    // 【テスト目的】: LocalStorageへのタスクデータの保存と読み込みの往復（ラウンドトリップ）を確認
    // 【テスト内容】: saveTasksで保存したTask配列がloadTasksで同一内容で返されることを検証
    // 【期待される動作】: 保存したデータが完全に復元される
    // 🔵 信頼性レベル: TASK-0002タスク定義「saveTasksでデータ保存→loadTasksで復元」に直接対応

    // 【テストデータ準備】: Task型に準拠した最小限の有効データを用意
    // 【初期条件設定】: LocalStorageが空の状態から開始（beforeEachでclear済み）
    const testTasks: Task[] = [
      {
        id: 'test-1',
        title: 'テストタスク',
        completed: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    // 【実際の処理実行】: saveTasksでデータを保存
    // 【処理内容】: Task配列をJSON.stringifyしてLocalStorageに保存
    saveTasks(testTasks);

    // 【実際の処理実行】: loadTasksでデータを読み込み
    // 【処理内容】: LocalStorageからJSON.parseしてTask配列を復元
    const loadedTasks = loadTasks();

    // 【結果検証】: 保存前と読み込み後のデータ整合性を検証
    // 【期待値確認】: id, title, completed, createdAtの全フィールドが一致することを確認

    // 【確認内容】: 読み込まれたタスク数が正しいこと 🔵
    expect(loadedTasks).toHaveLength(1);

    // 【確認内容】: 保存したデータと完全に一致すること 🔵
    expect(loadedTasks[0]).toEqual(testTasks[0]);
  });

  it('TC-005: LocalStorageにデータがない場合、初期データ（2件）が返される', () => {
    // 【テスト目的】: LocalStorageが空（初回アクセス時）の場合のフォールバック動作を確認
    // 【テスト内容】: loadTasks()が初期データを返すことを検証
    // 【期待される動作】: 「AWS環境の確認」「月次レポート作成」の2件が返される
    // 🔵 信頼性レベル: TASK-0002タスク定義「LocalStorage未設定時は初期データが返る」に直接対応

    // 【テストデータ準備】: なし（LocalStorageクリア状態を使用）
    // 【初期条件設定】: LocalStorageが空の状態（beforeEachでclear済み）

    // 【実際の処理実行】: LocalStorageが空の状態でloadTasksを呼び出し
    // 【処理内容】: getInitialTasks()経由で初期データが返されることを確認
    const tasks = loadTasks();

    // 【結果検証】: 初期データの件数と内容を検証
    // 【期待値確認】: 初期データとして定義された2件が正しく返されることを確認

    // 【確認内容】: 初期データが2件返されること 🔵
    expect(tasks).toHaveLength(2);

    // 【確認内容】: 1件目が「AWS環境の確認」（未完了）であること 🔵
    expect(tasks[0].title).toBe('AWS環境の確認');
    expect(tasks[0].completed).toBe(false);

    // 【確認内容】: 2件目が「月次レポート作成」（完了）であること 🔵
    expect(tasks[1].title).toBe('月次レポート作成');
    expect(tasks[1].completed).toBe(true);
  });

  it('TC-006: 複数のタスクがある場合、全件が正しく保存・復元される', () => {
    // 【テスト目的】: 複数件のタスクデータの保存・読み込みの整合性を確認
    // 【テスト内容】: 3件のタスクを保存し、全件が正しい順序で復元されることを検証
    // 【期待される動作】: 保存した3件が同一順序・同一内容で復元される
    // 🔵 信頼性レベル: note.md「複数のタスクがある場合、全件が正しく保存・復元される」に直接対応

    // 【テストデータ準備】: 未完了・完了・未完了が混在する3件のTask配列を用意
    // 【初期条件設定】: 実運用に近い複数タスクの状態を模擬
    const testTasks: Task[] = [
      { id: 'task-1', title: 'タスク1', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'task-2', title: 'タスク2', completed: true, createdAt: '2026-01-02T00:00:00.000Z' },
      { id: 'task-3', title: 'タスク3', completed: false, createdAt: '2026-01-03T00:00:00.000Z' },
    ];

    // 【実際の処理実行】: 3件のタスクを保存し、読み込む
    // 【処理内容】: JSON配列のシリアライズが順序を保持することを確認
    saveTasks(testTasks);
    const loadedTasks = loadTasks();

    // 【結果検証】: 保存前と読み込み後の配列全体の整合性を検証
    // 【期待値確認】: 配列の長さ、各要素のフィールド値、順序が一致することを確認

    // 【確認内容】: 3件全て復元されること 🔵
    expect(loadedTasks).toHaveLength(3);

    // 【確認内容】: 順序が保持されていること 🔵
    expect(loadedTasks[0]).toEqual(testTasks[0]);
    expect(loadedTasks[1]).toEqual(testTasks[1]);
    expect(loadedTasks[2]).toEqual(testTasks[2]);
  });

  // =====================================================================
  // 異常系テストケース
  // =====================================================================

  it('TC-018: サーバーサイド環境ではlocalStorageにアクセスせず初期データが返される', () => {
    // 【テスト目的】: SSR時のlocalStorageアクセスエラーを防止する保護ロジックを確認
    // 【テスト内容】: typeof window === 'undefined' の状態でloadTasksが安全に動作することを検証
    // 【期待される動作】: 初期データ（2件のタスク）が返される。エラーが発生しない
    // 🔵 信頼性レベル: 要件定義書3.2 SSR対応制約「typeof window === 'undefined' チェック」に直接対応

    // 【テストデータ準備】: windowオブジェクトをundefinedとして模擬
    // 【初期条件設定】: Next.jsのサーバーサイドレンダリング時の状態をシミュレート
    const originalWindow = globalThis.window;
    // @ts-expect-error: SSR環境を模擬するためにwindowをundefinedに設定
    delete globalThis.window;

    let tasks: Task[];
    try {
      // 【実際の処理実行】: window未定義状態でloadTasksを呼び出し
      // 【処理内容】: typeof window === 'undefined'の保護ロジックが動作することを確認
      tasks = loadTasks();
    } finally {
      // 【テスト後処理】: windowオブジェクトを復元
      globalThis.window = originalWindow;
    }

    // 【結果検証】: SSR時に初期データが返されることを検証
    // 【期待値確認】: エラーが発生せず、初期データが返されることを確認

    // 【確認内容】: SSR時に初期データ（2件）が返されること 🔵
    expect(tasks).toHaveLength(2);
  });

  it('TC-019: LocalStorageに不正なJSONデータが保存されている場合、初期データにフォールバックする', () => {
    // 【テスト目的】: JSON.parse()の失敗時の安全なフォールバックを確認
    // 【テスト内容】: LocalStorageに不正なJSONが保存されている場合のloadTasksの動作を検証
    // 【期待される動作】: JSON.parse()がSyntaxErrorを投げるが、try-catchで捕捉され初期データが返される
    // 🟡 信頼性レベル: 要件定義書4.7「フォールバックが望ましい」に基づくが、実装コード例にtry-catchが含まれておらず推測を含む

    // 【テストデータ準備】: JSON構文として不正な文字列をLocalStorageに設定
    // 【初期条件設定】: データ破損・手動編集・他スクリプトによる上書きを模擬
    localStorage.setItem('caios-tasks', '{invalid json}');

    // 【実際の処理実行】: 不正なJSONが保存された状態でloadTasksを呼び出し
    // 【処理内容】: try-catchによるエラーハンドリングで初期データへのフォールバックを確認
    const tasks = loadTasks();

    // 【結果検証】: 初期データが返されることを検証
    // 【期待値確認】: アプリがクラッシュせず、初期データで動作可能であることを確認

    // 【確認内容】: 不正なJSONの場合に初期データ（2件）が返されること 🟡
    expect(tasks).toHaveLength(2);

    // 【確認内容】: 初期データの1件目が「AWS環境の確認」であること 🟡
    expect(tasks[0].title).toBe('AWS環境の確認');
  });

  // =====================================================================
  // 境界値テストケース
  // =====================================================================

  it('TC-023: 空のタスク配列を保存・読み込みできる', () => {
    // 【テスト目的】: タスク配列の最小ケース（0件）での動作を確認
    // 【テスト内容】: 空配列を保存し、空配列として復元されることを検証
    // 【期待される動作】: saveTasks([])後、loadTasks()が[]を返す
    // 🟡 信頼性レベル: 要件定義書に空配列保存の明示的記載なし。JSON.stringify/parseの挙動から推測

    // 【テストデータ準備】: 空配列を用意
    // 【初期条件設定】: 全タスク削除後の状態を模擬
    const emptyTasks: Task[] = [];

    // 【実際の処理実行】: 空配列を保存し、読み込む
    // 【処理内容】: JSON.stringify([]) = "[]" が正しく保存・復元されることを確認
    saveTasks(emptyTasks);
    const loadedTasks = loadTasks();

    // 【結果検証】: 空配列が空配列として返されることを検証
    // 【期待値確認】: nullや初期データにフォールバックしないことを確認

    // 【確認内容】: 空配列が空配列として返されること（初期データにフォールバックしない）🟡
    expect(loadedTasks).toHaveLength(0);

    // 【確認内容】: 空配列であること 🟡
    expect(loadedTasks).toEqual([]);
  });

  it('TC-024: 非常に長いタスクタイトルが正しく保存・復元される', () => {
    // 【テスト目的】: 文字列長の上限付近でのデータ永続化の正確性を確認
    // 【テスト内容】: 1000文字のタスクタイトルが切り捨てられず完全に保存・復元されることを検証
    // 【期待される動作】: 1000文字のタイトルが完全に保存・復元される
    // 🟡 信頼性レベル: 要件定義書にタイトル長の制約記載なし。LocalStorageの一般的な容量制限の範囲内であることを前提に推測

    // 【テストデータ準備】: 1000文字の長いタスクタイトルを持つTaskを用意
    // 【初期条件設定】: 詳細な説明をタイトルに含めるケースを模擬
    const longTitle = 'あ'.repeat(1000);
    const testTasks: Task[] = [
      { id: 'long-task', title: longTitle, completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
    ];

    // 【実際の処理実行】: 長いタイトルのタスクを保存し、読み込む
    // 【処理内容】: JSON.stringifyは文字列長に制限がないため、正しく処理されることを確認
    saveTasks(testTasks);
    const loadedTasks = loadTasks();

    // 【結果検証】: 長いタイトルが完全に保存・復元されることを検証
    // 【期待値確認】: 1000文字が1文字も欠けずに復元されることを確認

    // 【確認内容】: 1件のタスクが復元されること 🟡
    expect(loadedTasks).toHaveLength(1);

    // 【確認内容】: タイトルが1000文字全て保持されていること 🟡
    expect(loadedTasks[0].title).toHaveLength(1000);

    // 【確認内容】: 保存前後でタイトルが完全に一致すること 🟡
    expect(loadedTasks[0].title).toBe(longTitle);
  });
});
