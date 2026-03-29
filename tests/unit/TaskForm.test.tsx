/**
 * TaskFormコンポーネント ユニットテスト
 * 対応テストケース: TC-001, TC-002, TC-003, TC-016, TC-017, TC-021, TC-022
 *
 * テストフレームワーク: Vitest 1.0.0 + @testing-library/react 14.0.0
 * テスト実行: npm run test:unit (= vitest run)
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 【実装対象】: まだ存在しないコンポーネントをインポート（Redフェーズ: 失敗することを確認）
import TaskForm from '../../components/TaskForm';

describe('TaskFormコンポーネント', () => {
  let mockOnAdd: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモック関数を初期化し、独立したテスト環境を保証
    // 【環境初期化】: 前のテストのモック呼び出し履歴が残らないようにリセット
    mockOnAdd = vi.fn();
  });

  // 【ユーザーイベント設定】: delay:nullでReact 18のact()環境でのWarningを抑制
  // 【改善内容】: userEvent.setup({ delay: null }) により、非同期state更新がact()内でバッチングされる
  // 🔵 信頼性レベル: @testing-library/user-event v14 + React 18 公式推奨パターン
  const createUser = () => userEvent.setup({ delay: null });

  afterEach(() => {
    // 【テスト後処理】: vi.restoreAllMocks()でモックを復元
    // 【状態復元】: 次のテストに影響しないようモック状態をリセット
    vi.restoreAllMocks();
  });

  // =====================================================================
  // 正常系テストケース
  // =====================================================================

  it('TC-001: タスクタイトル入力→追加ボタン押下でonAddコールバックが呼ばれる', async () => {
    // 【テスト目的】: TaskFormの基本的なタスク追加フロー（入力→送信→コールバック発火）を確認
    // 【テスト内容】: 入力フィールドにテキストを入力し、追加ボタンを押すとonAddが呼ばれることを検証
    // 【期待される動作】: onAddがtrim済みのタイトル文字列で呼ばれる
    // 🔵 信頼性レベル: TASK-0002タスク定義「入力フィールドにテキストを入力し追加ボタンを押すとonAddが呼ばれる」に直接対応

    const user = createUser();

    // 【テストデータ準備】: 一般的なタスクタイトルを代表する有効な文字列を用意
    // 【初期条件設定】: TaskFormをonAddモックと共にレンダリング
    render(<TaskForm onAdd={mockOnAdd} />);

    // 【実際の処理実行】: 入力フィールドへのテキスト入力と追加ボタンのクリック
    // 【処理内容】: data-testid="task-input" に文字列を入力し、data-testid="add-button" をクリック
    const input = screen.getByTestId('task-input');
    const addButton = screen.getByTestId('add-button');

    await user.type(input, '新しいタスク');
    await user.click(addButton);

    // 【結果検証】: onAddコールバックの呼び出し状況を検証
    // 【改善内容】: waitForでact()バッチング完了を待機し、act() Warningを解消
    // 【期待値確認】: onAddが正確に1回、'新しいタスク'を引数に呼ばれることを確認

    // 【確認内容】: onAddコールバックが正確に1回呼ばれたこと 🔵
    await waitFor(() => expect(mockOnAdd).toHaveBeenCalledTimes(1));

    // 【確認内容】: trim済みのタイトル文字列がonAddに渡されること 🔵
    expect(mockOnAdd).toHaveBeenCalledWith('新しいタスク');
  });

  it('TC-002: タスク追加後に入力フィールドが空になる', async () => {
    // 【テスト目的】: タスク追加成功後の入力フィールドのリセット動作を確認
    // 【テスト内容】: onAdd呼び出し後、入力フィールドの値が空文字列に戻ることを検証
    // 【期待される動作】: 追加ボタン押下後、入力フィールドのvalueが ""になる
    // 🔵 信頼性レベル: note.md - 3.4 TaskFormコンポーネント「追加後、入力フィールドをクリア」に直接対応

    const user = createUser();

    // 【テストデータ準備】: 追加処理が完了する有効なタスクタイトルを用意
    // 【初期条件設定】: TaskFormをレンダリングし、入力フィールドを特定
    render(<TaskForm onAdd={mockOnAdd} />);

    const input = screen.getByTestId('task-input') as HTMLInputElement;
    const addButton = screen.getByTestId('add-button');

    // 【実際の処理実行】: テキストを入力後、追加ボタンをクリックしてタスクを追加
    // 【処理内容】: 入力→追加ボタン押下の操作シーケンスを実行
    await user.type(input, '完了するタスク');
    await user.click(addButton);

    // 【結果検証】: 入力フィールドのクリア状態を検証
    // 【期待値確認】: 追加後に入力フィールドが空になることを確認

    // 【確認内容】: 追加ボタン押下後、入力フィールドのvalueが空文字列になること 🔵
    expect(input.value).toBe('');
  });

  it('TC-003: フォーム送信（Enterキー）でonAddが呼ばれる', async () => {
    // 【テスト目的】: form要素のsubmitイベントによるタスク追加動作を確認
    // 【テスト内容】: 入力フィールドでEnterを押すとフォームが送信され、onAddが呼ばれることを検証
    // 【期待される動作】: Enterキー押下でonAddが'Enterで追加'を引数に呼ばれる
    // 🟡 信頼性レベル: 実装コードの<form onSubmit>から推測。要件定義書にEnterキー操作の明示的記載なし

    const user = createUser();

    // 【テストデータ準備】: キーボード操作によるフォーム送信を模擬するためのタスクタイトル
    // 【初期条件設定】: TaskFormをレンダリング
    render(<TaskForm onAdd={mockOnAdd} />);

    const input = screen.getByTestId('task-input');

    // 【実際の処理実行】: テキスト入力後にEnterキーを押下してフォームを送信
    // 【処理内容】: form.onSubmitイベントを通じてonAddが呼び出されることを確認
    await user.type(input, 'Enterで追加');
    await user.keyboard('{Enter}');

    // 【結果検証】: Enterキー送信によるonAdd呼び出しを検証
    // 【期待値確認】: ボタンクリックと同様にonAddが呼ばれることを確認

    // 【確認内容】: Enterキー押下でonAddが呼ばれること 🟡
    expect(mockOnAdd).toHaveBeenCalledTimes(1);

    // 【確認内容】: 'Enterで追加'を引数にonAddが呼ばれること 🟡
    expect(mockOnAdd).toHaveBeenCalledWith('Enterで追加');
  });

  // =====================================================================
  // 異常系テストケース
  // =====================================================================

  it('TC-016: 空文字で追加ボタンを押してもonAddが呼ばれない', async () => {
    // 【テスト目的】: 空のタスクタイトルでの追加を防止するバリデーションを確認
    // 【テスト内容】: 空文字の状態で追加ボタンを押してもonAddが呼ばれないことを検証
    // 【期待される動作】: onAddが呼ばれない（callCount = 0）
    // 🔵 信頼性レベル: TASK-0002タスク定義「空文字ではonAddが呼ばれない」に直接対応

    const user = createUser();

    // 【テストデータ準備】: タスクタイトルとして意味のない空文字列の状態を用意
    // 【初期条件設定】: TaskFormを入力なしでレンダリング（空文字が初期値）
    render(<TaskForm onAdd={mockOnAdd} />);

    const addButton = screen.getByTestId('add-button');

    // 【実際の処理実行】: 何も入力せずに追加ボタンをクリック
    // 【処理内容】: 入力フィールドが空の状態でのバリデーション動作を確認
    await user.click(addButton);

    // 【結果検証】: onAddが呼ばれていないことを検証
    // 【期待値確認】: 空文字入力時にonAddが実行されないことを確認

    // 【確認内容】: 空文字ではonAddが一度も呼ばれないこと 🔵
    expect(mockOnAdd).toHaveBeenCalledTimes(0);
  });

  it('TC-017: 空白のみの文字列で追加ボタンを押してもonAddが呼ばれない', async () => {
    // 【テスト目的】: スペースやタブのみの入力を防止するバリデーションを確認
    // 【テスト内容】: 空白のみの文字列で追加ボタンを押してもonAddが呼ばれないことを検証
    // 【期待される動作】: onAddが呼ばれない（callCount = 0）
    // 🔵 信頼性レベル: 要件定義書4.5「空白のみの文字列も同様に無効」に直接対応

    const user = createUser();

    // 【テストデータ準備】: trim()後に空文字となる半角スペース3文字を用意
    // 【初期条件設定】: TaskFormをレンダリング
    render(<TaskForm onAdd={mockOnAdd} />);

    const input = screen.getByTestId('task-input');
    const addButton = screen.getByTestId('add-button');

    // 【実際の処理実行】: 空白のみを入力し、追加ボタンをクリック
    // 【処理内容】: trim()後に空文字になる入力値でのバリデーション動作を確認
    await user.type(input, '   ');
    await user.click(addButton);

    // 【結果検証】: onAddが呼ばれていないことを検証
    // 【期待値確認】: trim後の空文字チェック（!title.trim()）が正しく機能することを確認

    // 【確認内容】: 空白のみではonAddが一度も呼ばれないこと 🔵
    expect(mockOnAdd).toHaveBeenCalledTimes(0);
  });

  // =====================================================================
  // 境界値テストケース
  // =====================================================================

  it('TC-021: 前後に空白を含むタイトル入力がtrim後の文字列でonAddに渡される', async () => {
    // 【テスト目的】: trim()処理の境界動作を確認（空白を含むが有効な入力）
    // 【テスト内容】: 前後に空白を含むタイトルがtrim後の文字列でonAddに渡されることを検証
    // 【期待される動作】: onAddが"テストタスク"（trim済み）を引数に呼ばれる
    // 🔵 信頼性レベル: 実装コード onAdd(title.trim()) に直接対応

    const user = createUser();

    // 【テストデータ準備】: 先頭と末尾にスペースを含む文字列（コピー&ペースト時の余分な空白を想定）
    // 【初期条件設定】: TaskFormをレンダリング
    render(<TaskForm onAdd={mockOnAdd} />);

    const input = screen.getByTestId('task-input');
    const addButton = screen.getByTestId('add-button');

    // 【実際の処理実行】: 前後に空白を含む文字列を入力し追加ボタンをクリック
    // 【処理内容】: trim処理の境界動作を確認
    await user.type(input, '  テストタスク  ');
    await user.click(addButton);

    // 【結果検証】: trim済みの文字列がonAddに渡されることを検証
    // 【期待値確認】: trim後の'テストタスク'がonAddに渡されることを確認

    // 【確認内容】: trim済みのタイトル文字列がonAddに渡されること 🔵
    expect(mockOnAdd).toHaveBeenCalledWith('テストタスク');
  });

  it('TC-022: 1文字のタスクタイトルでonAddが正常に呼ばれる', async () => {
    // 【テスト目的】: 有効な入力の最小長（1文字）での動作を確認
    // 【テスト内容】: 1文字のタスクタイトルでonAddが正常に呼ばれることを検証
    // 【期待される動作】: onAddが"a"を引数に呼ばれる
    // 🟡 信頼性レベル: 要件定義書にタイトルの最小長の明示的記載なし。trim()後の空文字チェックのみが条件であることから推測

    const user = createUser();

    // 【テストデータ準備】: trim後に空でない最小の文字列（1文字）を用意
    // 【初期条件設定】: TaskFormをレンダリング
    render(<TaskForm onAdd={mockOnAdd} />);

    const input = screen.getByTestId('task-input');
    const addButton = screen.getByTestId('add-button');

    // 【実際の処理実行】: 1文字のみを入力し追加ボタンをクリック
    // 【処理内容】: 最小有効入力でのバリデーション通過を確認
    await user.type(input, 'a');
    await user.click(addButton);

    // 【結果検証】: 1文字でもonAddが呼ばれることを検証
    // 【期待値確認】: 1文字が有効なタスクタイトルとして受理されることを確認

    // 【確認内容】: 1文字でもonAddが呼ばれること 🟡
    expect(mockOnAdd).toHaveBeenCalledTimes(1);

    // 【確認内容】: 'a'を引数にonAddが呼ばれること 🟡
    expect(mockOnAdd).toHaveBeenCalledWith('a');
  });
});
