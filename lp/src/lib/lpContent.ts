export const GITHUB_URL = 'https://github.com/iray-tno/envarly';
export const RELEASE_URL = 'https://github.com/iray-tno/envarly/releases/latest';
export const STORYBOOK_URL = '/envarly/storybook/';
export const REPORTS_URL = '/envarly/reports/';
export const VERSION = '1.1.0';

export type LandingCopy = {
  lang: 'en' | 'ja';
  title: string;
  description: string;
  ogDescription: string;
  canonicalPath: string;
  alternatePath: string;
  alternateLabel: string;
  nav: {
    features: string;
    storybook: string;
    reports: string;
    download: string;
  };
  hero: {
    eyebrow: string;
    lead: string;
    download: string;
    github: string;
  };
  screenshots: {
    pathEditorAlt: string;
    applyModalAlt: string;
    firstLabel: string;
    secondLabel: string;
  };
  featuresHeading: string;
  featuresLead: string;
  features: Array<{
    icon: string;
    title: string;
    desc: string;
  }>;
  audience: {
    heading: string;
    paragraphs: string[];
  };
  stack: {
    label: string;
    items: string[];
  };
  footer: {
    copyright: string;
    releases: string;
    license: string;
  };
};

export const enCopy: LandingCopy = {
  lang: 'en',
  title: 'Envarly — Windows Environment Variable Manager',
  description: 'Windows environment variable manager — edit PATH, detect secrets, and preview changes before applying. Free & open source on Windows 10 and 11.',
  ogDescription: 'Windows environment variable manager — edit PATH, detect secrets, and preview changes before applying. Free & open source.',
  canonicalPath: '/envarly/',
  alternatePath: '/envarly/ja/',
  alternateLabel: '日本語',
  nav: {
    features: 'Features',
    storybook: 'Storybook',
    reports: 'Reports',
    download: 'Download',
  },
  hero: {
    eyebrow: `Windows Environment Variable Manager · v${VERSION}`,
    lead: 'Edit, audit, and protect your Windows environment variables. Preview every change before applying — never break your PATH again.',
    download: `Download v${VERSION} for Windows`,
    github: 'View on GitHub →',
  },
  screenshots: {
    pathEditorAlt: 'Envarly — PATH editor with per-entry validation and staged change',
    applyModalAlt: 'Envarly — Apply confirmation modal with Full diff view for PATH entries',
    firstLabel: 'Screenshot 1',
    secondLabel: 'Screenshot 2',
  },
  featuresHeading: 'Features',
  featuresLead: 'Everything you need to manage environment variables safely.',
  features: [
    {
      icon: '⠿',
      title: 'Drag-and-drop list editor',
      desc: 'Reorder PATH, PATHEXT, NO_PROXY and any semicolon- or comma-separated variable. Auto-detects separator from the variable name.',
    },
    {
      icon: '✓',
      title: 'Path validation',
      desc: 'Each entry in PATH-style variables gets a live ✓ / ✗ existence check so broken paths are caught before you apply.',
    },
    {
      icon: '⚠',
      title: '%VAR% reference lint',
      desc: 'Warns on unresolvable %VAR% references in path entries. Evaluated on focus-out; skips Windows built-in volatile vars.',
    },
    {
      icon: '↩',
      title: 'Local undo before staging',
      desc: 'Multi-step Ctrl+Z in the detail panel before staging. Drag reorders and text edits are independent undo steps.',
    },
    {
      icon: '⚿',
      title: 'Secret detection',
      desc: 'Name-based heuristics and value-pattern matching across 35+ token formats — GitHub, AWS, Anthropic, Stripe, npm, and more.',
    },
    {
      icon: '📸',
      title: 'Snapshots & time-travel',
      desc: 'Save named snapshots of your full environment, encrypted with DPAPI. Restore to any previous state in two clicks.',
    },
    {
      icon: '⇄',
      title: 'Diff detection',
      desc: 'Detects registry changes made by other processes while Envarly is open. Shows a diff with selective apply per entry.',
    },
    {
      icon: '⇅',
      title: 'Import / Export',
      desc: 'Read and write .json and .reg formats. Preview before any write. Merge or Replace strategy on import. Registry is never touched until you click Apply.',
    },
  ],
  audience: {
    heading: 'Who is it for?',
    paragraphs: [
      'Envarly is built for developers and power users on Windows 10 and 11 who frequently edit User and System environment variables — and want a safer, more visual alternative to the built-in Windows Settings panel.',
      'Whether you are managing a cluttered PATH variable, rotating API keys stored as environment variables, importing a team\'s .env baseline, or restoring a snapshot after a bad install — Envarly gives you full visibility before any registry write happens.',
    ],
  },
  stack: {
    label: 'Built with',
    items: ['Tauri v2', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'Rust'],
  },
  footer: {
    copyright: '© 2026 Envarly · MIT License',
    releases: 'Releases',
    license: 'License',
  },
};

export const jaCopy: LandingCopy = {
  lang: 'ja',
  title: 'Envarly — Windows 環境変数マネージャー',
  description: 'Windows の環境変数を安全に編集できるマネージャー。PATH 編集、シークレット検出、変更前プレビューに対応。Windows 10 / 11 向けの無料オープンソースアプリです。',
  ogDescription: 'Windows の環境変数を安全に編集。PATH 編集、シークレット検出、変更前プレビューに対応した無料オープンソースアプリ。',
  canonicalPath: '/envarly/ja/',
  alternatePath: '/envarly/',
  alternateLabel: 'English',
  nav: {
    features: '機能',
    storybook: 'Storybook',
    reports: 'Reports',
    download: 'ダウンロード',
  },
  hero: {
    eyebrow: `Windows 環境変数マネージャー · v${VERSION}`,
    lead: 'Windows の環境変数を、編集・確認・保護。適用前にすべての変更をプレビューできるので、PATH を壊す前に気づけます。',
    download: `Windows 版 v${VERSION} をダウンロード`,
    github: 'GitHub で見る →',
  },
  screenshots: {
    pathEditorAlt: 'Envarly — エントリごとの検証とステージ済み変更を表示する PATH エディター',
    applyModalAlt: 'Envarly — PATH エントリの詳細差分を表示する適用確認モーダル',
    firstLabel: 'スクリーンショット 1',
    secondLabel: 'スクリーンショット 2',
  },
  featuresHeading: '機能',
  featuresLead: '環境変数を安全に管理するために必要なものをひとまとめに。',
  features: [
    {
      icon: '⠿',
      title: 'ドラッグ＆ドロップのリスト編集',
      desc: 'PATH、PATHEXT、NO_PROXY など、セミコロン区切り・カンマ区切りの変数を並べ替え。変数名から区切り文字を自動判定します。',
    },
    {
      icon: '✓',
      title: 'パス検証',
      desc: 'PATH 系の各エントリに対して存在チェックを行い、壊れたパスを適用前に見つけられます。',
    },
    {
      icon: '⚠',
      title: '%VAR% 参照の lint',
      desc: 'パス内の解決できない %VAR% 参照を警告。フォーカスアウト時に評価し、Windows 組み込みの揮発変数は除外します。',
    },
    {
      icon: '↩',
      title: 'ステージ前のローカル Undo',
      desc: '詳細パネルでステージする前に Ctrl+Z を複数段階使えます。ドラッグでの並べ替えとテキスト編集を別の Undo として扱います。',
    },
    {
      icon: '⚿',
      title: 'シークレット検出',
      desc: '変数名のヒューリスティックと値のパターン照合で、GitHub、AWS、Anthropic、Stripe、npm など 35 種類以上のトークン形式を検出します。',
    },
    {
      icon: '📸',
      title: 'スナップショットと復元',
      desc: '環境変数全体の名前付きスナップショットを DPAPI で暗号化して保存。過去の状態へ数クリックで戻せます。',
    },
    {
      icon: '⇄',
      title: '外部変更の差分検出',
      desc: 'Envarly を開いている間に他プロセスがレジストリを変更した場合、差分を検出。項目ごとに受け入れる変更を選べます。',
    },
    {
      icon: '⇅',
      title: 'インポート / エクスポート',
      desc: '.json と .reg 形式の読み書きに対応。書き込み前にプレビューし、Merge / Replace 戦略を選べます。Apply を押すまでレジストリは変更されません。',
    },
  ],
  audience: {
    heading: '誰のためのアプリ？',
    paragraphs: [
      'Envarly は、Windows 10 / 11 で User / System 環境変数をよく編集する開発者やパワーユーザー向けです。標準の Windows 設定画面より安全で、見通しよく扱える代替手段を目指しています。',
      '散らかった PATH 変数の整理、環境変数に保存された API キーのローテーション、チームの .env ベースラインの取り込み、インストール失敗後のスナップショット復元まで。レジストリに書き込む前に、変更内容をしっかり確認できます。',
    ],
  },
  stack: {
    label: 'Built with',
    items: ['Tauri v2', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'Rust'],
  },
  footer: {
    copyright: '© 2026 Envarly · MIT License',
    releases: 'リリース',
    license: 'ライセンス',
  },
};
