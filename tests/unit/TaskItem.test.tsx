/**
 * TaskItemコンポーネント & dateUtils ユニットテスト
 * 対応テストケース: TC-007, TC-008, TC-009, TC-010, TC-011, TC-012, TC-013, TC-014, TC-015, TC-020
 *
 * テストフレームワーク: Vitest 1.0.0 + @testing-library/react 14.0.0
 * テスト実行: npm run test:unit (= vitest run)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Task } from '../../types/task';

// 【実装対象】: まだ存在しないコンポーネント・関数をインポート（Redフェーズ: 失敗することを確認）
import TaskItem from '../../components/TaskItem';
import { formatDate } from '../../lib/dateUtils';
import Home from '../../app/page';

// =====================================================================
// TaskItemコンポーネント テスト
// =====================================================================

// 【ユーザーイベント設定】: delay:nullでReact 18のact()環境でのWarningを抑制
// 【改善内容】: userEvent.setup({ delay: null }) により、非同期state更新がact()内でバッチングされる
// 🔵 信頼性レベル: @testing-library/user-event v14 + React 18 公式推奨パターン
const createUser = () => userEvent.setup({ delay: null });

describe('TaskItemコンポーネント', () => {
  let mockOnToggle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモック関数を初期化
    // 【環境初期化】: 前のテストのモック呼び出し履歴をリセット
    mockOnToggle = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    // 【テスト後処理】: モックを復元
    // 【状態復元】: 次のテストに影響しないようモック状態をリセット
    vi.restoreAllMocks();
  });

  it('TC-007: 未完了タスクのタイトルと作成日が正しく表示される', () => {
    // 【テスト目的】: TaskItemに未完了のTaskを渡した場合のレンダリングを確認
    // 【テスト内容】: タスクタイトルが表示され、チェックボックスが未チェック状態で、打ち消し線がないことを検証
    // 【期待される動作】: タスクタイトルが表示される。チェックボックスがunchecked。line-throughクラスが適用されていない
    // 🔵 信頼性レベル: TASK-0002 TaskItemコンポーネント定義に直接対応

    // 【テストデータ準備】: 未完了状態の標準的なタスクを用意
    // 【初期条件設定】: completedがfalseのTaskオブジェクト
    const task: Task = {
      id: '1',
      title: 'テストタスク',
      completed: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    // 【実際の処理実行】: TaskItemをレンダリング
    // 【処理内容】: 未完了タスクのレンダリング結果を確認
    render(<TaskItem task={task} onToggle={mockOnToggle} />);

    // 【結果検証】: 未完了タスクの表示状態を検証
    // 【期待値確認】: テキスト表示、チェックボックス状態を確認

    // 【確認内容】: タスクタイトルがテキストとして表示されること 🔵
    expect(screen.getByText('テストタスク')).toBeInTheDocument();

    // 【確認内容】: チェックボックスがunchecked状態であること 🔵
    const checkbox = screen.getByTestId('task-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('TC-008: 完了状態のタスクに打ち消し線スタイルが適用される', () => {
    // 【テスト目的】: TaskItemに完了済みのTaskを渡した場合の視覚的表示を確認
    // 【テスト内容】: タスクタイトルにline-through text-gray-400クラスが適用されることを検証
    // 【期待される動作】: タイトル表示要素にline-throughクラスが含まれる。チェックボックスがchecked
    // 🔵 信頼性レベル: TASK-0002 TaskItem実装コード「完了時は打ち消し線」に直接対応

    // 【テストデータ準備】: 完了状態のタスクを用意
    // 【初期条件設定】: completedがtrueのTaskオブジェクト
    const task: Task = {
      id: '2',
      title: '完了タスク',
      completed: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    // 【実際の処理実行】: TaskItemをレンダリング
    // 【処理内容】: 完了タスクのレンダリング結果を確認
    render(<TaskItem task={task} onToggle={mockOnToggle} />);

    // 【結果検証】: 完了タスクの視覚的フィードバックを検証
    // 【期待値確認】: CSSクラスの適用とチェックボックス状態を確認

    // 【確認内容】: チェックボックスがchecked状態であること 🔵
    const checkbox = screen.getByTestId('task-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    // 【確認内容】: タイトル要素にline-throughクラスが含まれること 🔵
    const titleElement = screen.getByText('完了タスク');
    expect(titleElement.className).toContain('line-through');
  });

  it('TC-009: チェックボックスクリックでonToggleコールバックがタスクIDで呼ばれる', async () => {
    // 【テスト目的】: チェックボックスの変更イベントによるonToggle発火を確認
    // 【テスト内容】: チェックボックスをクリックするとonToggleがタスクのidを引数に呼ばれることを検証
    // 【期待される動作】: onToggleが"test-id-1"を引数に1回呼ばれる
    // 🔵 信頼性レベル: TASK-0002 TaskItem実装コード・note.md「チェックボックス操作でonToggleが呼ばれる」に直接対応

    const user = createUser();

    // 【テストデータ準備】: 特定のIDを持つタスクを用意
    // 【初期条件設定】: チェックボックス操作でIDが返されることを確認するためのタスク
    const task: Task = {
      id: 'test-id-1',
      title: 'トグルテスト',
      completed: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    // 【実際の処理実行】: TaskItemをレンダリングし、チェックボックスをクリック
    // 【処理内容】: onChange={() => onToggle(task.id)} の動作を確認
    render(<TaskItem task={task} onToggle={mockOnToggle} />);
    const checkbox = screen.getByTestId('task-checkbox');
    await user.click(checkbox);

    // 【結果検証】: onToggleの呼び出し状況を検証
    // 【期待値確認】: onToggleが正確に1回、task.idを引数に呼ばれることを確認

    // 【確認内容】: onToggleが1回呼ばれること 🔵
    expect(mockOnToggle).toHaveBeenCalledTimes(1);

    // 【確認内容】: onToggleに"test-id-1"が渡されること 🔵
    expect(mockOnToggle).toHaveBeenCalledWith('test-id-1');
  });

  it('TC-010: タスク作成日がformatDate関数で整形された文字列で表示される', () => {
    // 【テスト目的】: TaskItemがformatDate()を呼び出し、その返り値を表示することを確認
    // 【テスト内容】: data-testid="task-date" にformatDate(createdAt)の返り値が表示されることを検証
    // 【期待される動作】: task-date要素にformatDate("2026-01-15T09:30:00.000Z")の返り値が表示される
    // 🔵 信頼性レベル: TASK-0002 TaskItem実装コード・note.md日付ユーティリティ仕様に対応

    // 【テストデータ準備】: ISO 8601形式の日付文字列を持つタスクを用意
    // 【初期条件設定】: formatDate()のスタブ実装が正しく呼び出されることを確認するためのデータ
    const task: Task = {
      id: '10',
      title: '日付テスト',
      completed: false,
      createdAt: '2026-01-15T09:30:00.000Z',
    };

    // 【実際の処理実行】: TaskItemをレンダリング
    // 【処理内容】: {formatDate(task.createdAt)} の動作を確認
    render(<TaskItem task={task} onToggle={mockOnToggle} />);

    // 【結果検証】: 日付表示が正しく行われていることを検証
    // 【期待値確認】: task-date要素に何らかの日付文字列が表示されることを確認

    // 【確認内容】: task-date要素が存在し、空でない文字列が表示されること 🔵
    const dateElement = screen.getByTestId('task-date');
    expect(dateElement).toBeInTheDocument();
    expect(dateElement.textContent).toBeTruthy();
  });
});

// =====================================================================
// dateUtils（スタブ実装）テスト
// =====================================================================

describe('dateUtils（スタブ実装）', () => {
  it('TC-011: formatDateが有効なISO 8601日付文字列を日本語ロケールでフォーマットする', () => {
    // 【テスト目的】: スタブ実装のformatDateが有効な日付文字列を受け取り、フォーマット済み文字列を返すことを確認
    // 【テスト内容】: formatDate("2026-01-15T09:30:00.000Z") が日本語ロケールの日付文字列を返すことを検証
    // 【期待される動作】: "2026/1/15" 相当の文字列が返される
    // 🔵 信頼性レベル: note.md 3.3 日付ユーティリティのスタブ実装定義に直接対応

    // 【テストデータ準備】: ISO 8601形式の標準的な日付文字列
    // 【初期条件設定】: スタブ実装 new Date(dateString).toLocaleDateString('ja-JP') の動作を確認
    const isoDateString = '2026-01-15T09:30:00.000Z';

    // 【実際の処理実行】: formatDateを呼び出し
    // 【処理内容】: スタブ実装がISO 8601文字列を日本語ロケールでフォーマットすることを確認
    const result = formatDate(isoDateString);

    // 【結果検証】: フォーマット結果を検証
    // 【期待値確認】: 空でなく、日付として妥当な文字列であることを確認

    // 【確認内容】: 返り値が空でない文字列であること 🔵
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');

    // 【確認内容】: 返り値が"Invalid Date"でないこと（有効な日付が返されること） 🔵
    expect(result).not.toBe('Invalid Date');
  });

  it('TC-020: 不正な日付文字列をformatDateに渡した場合の動作', () => {
    // 【テスト目的】: ISO 8601形式でない文字列が渡された場合の処理を確認
    // 【テスト内容】: "not-a-date"を渡した場合に例外をスローすることを検証
    // 【期待される動作】: date-fns v2の parseISO/format が RangeError をスローする
    // 🔵 信頼性レベル: date-fns-utils-requirements.md 2.1「無効なISO文字列の場合、例外をスロー」に直接対応
    // 【仕様更新理由】: TASK-0002のスタブ実装前提（不スロー）→ TASK-0003のdate-fns本実装（スロー）に仕様更新

    // 【テストデータ準備】: ISO 8601に準拠しない不正な文字列
    // 【初期条件設定】: データ移行時の型不一致・手動LocalStorage編集を模擬
    const invalidDateString = 'not-a-date';

    // 【実際の処理実行】: 不正な文字列でformatDateを呼び出し
    // 【処理内容】: parseISO("not-a-date") は Invalid Date を返し、format()がRangeErrorをスロー
    // 🔵 date-fns-utils-testcases.md TC-008「無効なISO文字列を渡すと例外をスローする」と同等の期待値
    expect(() => formatDate(invalidDateString)).toThrow();
  });
});

// =====================================================================
// メインページ（Home / page.tsx）統合テスト
// =====================================================================

describe('メインページ（Home）統合テスト', () => {
  beforeEach(() => {
    // 【テスト前準備】: LocalStorageをクリアして各テストを独立した状態で開始
    // 【環境初期化】: 前のテストのデータが残留しないことを保証
    localStorage.clear();
  });

  afterEach(() => {
    // 【テスト後処理】: モックを復元しLocalStorageをクリーン
    // 【状態復元】: 次のテストに影響しないよう環境をリセット
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('TC-012: ページマウント時にLocalStorageからタスクが読み込まれ一覧表示される', async () => {
    // 【テスト目的】: useEffectによるloadTasks呼び出しと、結果のレンダリングを確認
    // 【テスト内容】: ページマウント後、初期データ（2件）のタスクが表示されることを検証
    // 【期待される動作】: data-testid="task-item" が2件表示される
    // 🔵 信頼性レベル: TASK-0002完了条件「タスク一覧が表示される（初期データあり）」に直接対応

    // 【テストデータ準備】: なし（初回マウント、LocalStorage空状態）
    // 【初期条件設定】: ページ初回アクセスを模擬

    // 【実際の処理実行】: Homeページをレンダリング
    // 【処理内容】: useEffectでloadTasks()が実行され、初期データが表示されることを確認
    const { findAllByTestId } = render(<Home />);

    // 【結果検証】: 初期データのタスクアイテムが表示されることを検証
    // 【期待値確認】: 「AWS環境の確認」「月次レポート作成」の2件が表示されることを確認

    // 【確認内容】: タスクアイテムが2件表示されること 🔵
    const taskItems = await findAllByTestId('task-item');
    expect(taskItems).toHaveLength(2);

    // 【確認内容】: 「AWS環境の確認」がテキストとして含まれること 🔵
    expect(screen.getByText('AWS環境の確認')).toBeInTheDocument();

    // 【確認内容】: 「月次レポート作成」がテキストとして含まれること 🔵
    expect(screen.getByText('月次レポート作成')).toBeInTheDocument();
  });

  it('TC-013: 入力フォームからタスクを追加すると一覧に反映される', async () => {
    // 【テスト目的】: TaskFormの入力→追加→一覧表示への統合的な動作を確認
    // 【テスト内容】: テキスト入力→追加ボタン押下→新しいタスクが一覧に表示されることを検証
    // 【期待される動作】: 初期データ2件 + 新規1件 = 合計3件のタスクアイテムが表示される
    // 🔵 信頼性レベル: TASK-0002完了条件「タスク追加フォームが動作する（入力→追加→一覧反映）」に直接対応

    const user = createUser();

    // 【テストデータ準備】: ユーザーによるタスク追加操作の模擬
    // 【初期条件設定】: LocalStorage空状態からHomeページをレンダリング
    render(<Home />);

    const input = screen.getByTestId('task-input');
    const addButton = screen.getByTestId('add-button');

    // 【実際の処理実行】: タスクタイトルを入力し、追加ボタンをクリック
    // 【処理内容】: addTask関数が[...tasks, newTask]で一覧に追加する動作を確認
    await user.type(input, '新規追加タスク');
    await user.click(addButton);

    // 【結果検証】: 追加後のタスク一覧を検証
    // 【期待値確認】: 3件のタスクアイテムと新規タスクのタイトル表示を確認

    // 【確認内容】: タスクアイテムが3件（初期2件 + 新規1件）表示されること 🔵
    const taskItems = screen.getAllByTestId('task-item');
    expect(taskItems).toHaveLength(3);

    // 【確認内容】: 新規追加タスクのタイトルが表示されること 🔵
    expect(screen.getByText('新規追加タスク')).toBeInTheDocument();
  });

  it('TC-014: タスクのチェックボックスをクリックすると完了状態が切り替わる', async () => {
    // 【テスト目的】: toggleTask関数によるcompleted状態の反転とUI反映を確認
    // 【テスト内容】: 未完了タスクのチェックボックスをクリック→完了状態になることを検証
    // 【期待される動作】: 「AWS環境の確認」のチェックボックスがchecked状態になる
    // 🔵 信頼性レベル: TASK-0002完了条件「タスク完了チェックボックスが動作する」に直接対応

    const user = createUser();

    // 【テストデータ準備】: 初期データの「AWS環境の確認」（completed: false）を対象に使用
    // 【初期条件設定】: LocalStorage空状態からHomeページをレンダリング
    render(<Home />);

    // タスクが表示されるまで待機
    await screen.findByText('AWS環境の確認');

    // 【実際の処理実行】: 最初のチェックボックス（「AWS環境の確認」）をクリック
    // 【処理内容】: toggleTask関数が{ ...t, completed: !t.completed }で反転することを確認
    const checkboxes = screen.getAllByTestId('task-checkbox') as HTMLInputElement[];
    const firstCheckbox = checkboxes[0]; // 「AWS環境の確認」のチェックボックス

    // 初期状態の確認（未完了）
    expect(firstCheckbox.checked).toBe(false);

    await user.click(firstCheckbox);

    // 【結果検証】: チェックボックス状態の変化を検証
    // 【期待値確認】: クリック後にchecked状態になることを確認

    // 【確認内容】: クリック後にチェックボックスがchecked状態になること 🔵
    expect(firstCheckbox.checked).toBe(true);
  });

  it('TC-015: タスク追加操作後、LocalStorageにデータが永続化される', async () => {
    // 【テスト目的】: addTask関数内のsaveTasks呼び出しによるLocalStorage保存を確認
    // 【テスト内容】: タスク追加後、LocalStorageに保存されたデータに新規タスクが含まれることを検証
    // 【期待される動作】: localStorage.getItem('caios-tasks')をJSONパースした配列に「永続化テスト」タイトルのタスクが含まれる
    // 🔵 信頼性レベル: TASK-0002完了条件「データがLocalStorageに保存され、リロードしても消えない」に直接対応

    const user = createUser();

    // 【テストデータ準備】: LocalStorage保存の確認用タスク
    // 【初期条件設定】: LocalStorage空状態からHomeページをレンダリング
    render(<Home />);

    const input = screen.getByTestId('task-input');
    const addButton = screen.getByTestId('add-button');

    // 【実際の処理実行】: タスクを追加してLocalStorageへの保存を確認
    // 【処理内容】: saveTasks()がaddTask()内で呼ばれ、LocalStorageに保存されることを確認
    await user.type(input, '永続化テスト');
    await user.click(addButton);

    // 【結果検証】: LocalStorage内のデータを検証
    // 【期待値確認】: 'caios-tasks'キーにJSONデータが保存されていることを確認

    // 【確認内容】: LocalStorageに'caios-tasks'キーでデータが保存されていること 🔵
    const storedData = localStorage.getItem('caios-tasks');
    expect(storedData).not.toBeNull();

    // 【確認内容】: 保存されたJSONに「永続化テスト」タイトルのタスクが含まれること 🔵
    const parsedTasks: Task[] = JSON.parse(storedData!);
    const addedTask = parsedTasks.find(t => t.title === '永続化テスト');
    expect(addedTask).toBeDefined();
  });
});
