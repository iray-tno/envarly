export const GITHUB_URL = 'https://github.com/iray-tno/envarly';
export const RELEASE_URL = 'https://github.com/iray-tno/envarly/releases/latest';
export const STORYBOOK_URL = '/envarly/storybook/';
export const REPORTS_URL = '/envarly/reports/';
export const VERSION = '1.4.0';
export const WINGET_COMMAND = 'winget install Envarly.Envarly';

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
  install: {
    label: string;
    copy: string;
    copied: string;
  };
  screenshots: {
    pathEditorAlt: string;
    applyModalAlt: string;
    firstLabel: string;
    secondLabel: string;
    prevLabel: string;
    nextLabel: string;
  };
  featuresHeading: string;
  featuresLead: string;
  features: Array<{
    icon: string;
    title: string;
    desc: string;
  }>;
  otherFeaturesHeading: string;
  otherFeatures: Array<{
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
  description: 'Windows environment variable manager — edit PATH with folder pickers, detect secrets, and preview changes before applying. Free & open source on Windows 10 and 11.',
  ogDescription: 'Windows environment variable manager — edit PATH with folder pickers, detect secrets, and preview changes before applying. Free & open source.',
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
    lead: 'Edit, audit, and protect your Windows environment variables. Preview every change before applying, clean up PATH entries with folder pickers, and keep registry writes intentional.',
    download: `Download v${VERSION} for Windows`,
    github: 'View on GitHub →',
  },
  install: {
    label: 'Or install with WinGet:',
    copy: 'Copy',
    copied: 'Copied!',
  },
  screenshots: {
    pathEditorAlt: 'Envarly — PATH editor with per-entry validation and staged change',
    applyModalAlt: 'Envarly — Apply confirmation modal with Full diff view for PATH entries',
    firstLabel: 'Screenshot 1',
    secondLabel: 'Screenshot 2',
    prevLabel: 'Previous screenshot',
    nextLabel: 'Next screenshot',
  },
  featuresHeading: 'Features',
  featuresLead: 'Everything you need to manage environment variables safely.',
  features: [
    {
      icon: '⠿',
      title: 'Practical PATH editor',
      desc: 'Reorder entries, validate each one with a live ✓ / ✗ existence check, switch between list and plain text, move through rows with the keyboard, and choose folders — all without leaving the editor.',
    },
    {
      icon: '⚿',
      title: 'Secret detection',
      desc: 'Name-based heuristics and value-pattern matching across 35+ token formats — GitHub, AWS, Anthropic, Stripe, npm, and more.',
    },
    {
      icon: '⇄',
      title: 'Diff detection',
      desc: 'Detects registry changes made by other processes while Envarly is open. Shows a diff with selective apply per entry.',
    },
    {
      icon: '📸',
      title: 'Snapshots & demo mode',
      desc: 'Save named snapshots of your full environment, encrypted with DPAPI. Demo mode opens realistic sample data for screenshots and walkthroughs without touching your registry.',
    },
  ],
  otherFeaturesHeading: 'Also included',
  otherFeatures: [
    {
      icon: '⚠',
      title: 'Environment guidance',
      desc: 'Shows short descriptions for well-known variables and warns on unresolvable %VAR% references in path entries.',
    },
    {
      icon: '↩',
      title: 'Local undo before staging',
      desc: 'Multi-step Ctrl+Z in the detail panel before staging. Drag reorders and text edits are independent undo steps.',
    },
    {
      icon: '⏳',
      title: 'Apply progress & log',
      desc: 'A progress bar and per-variable log show exactly what happened while staged changes are written to the registry.',
    },
    {
      icon: '⇅',
      title: 'Import / Export',
      desc: 'Read and write .json and .reg formats, plus export to PowerShell, DSC, and Ansible-friendly files. Preview before any write.',
    },
    {
      icon: '↔',
      title: 'Resizable panels',
      desc: 'Drag the sidebar and snapshots panel to the width you want. Sizes are remembered across restarts.',
    },
    {
      icon: '🔎',
      title: 'Check command',
      desc: "Find out why a command isn't found — searches the effective PATH for a name or exe path and flags shadowed duplicates.",
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
  description: 'Windows の環境変数を安全に編集できるマネージャー。フォルダ選択付きの PATH 編集、シークレット検出、変更前プレビューに対応。Windows 10 / 11 向けの無料オープンソースアプリです。',
  ogDescription: 'Windows の環境変数を安全に編集。フォルダ選択付きの PATH 編集、シークレット検出、変更前プレビューに対応した無料オープンソースアプリ。',
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
    lead: 'Windows の環境変数を、編集・確認・保護。適用前にすべての変更をプレビューし、フォルダ選択付きの PATH 編集で、レジストリへの書き込みを意図したものにできます。',
    download: `Windows 版 v${VERSION} をダウンロード`,
    github: 'GitHub で見る →',
  },
  install: {
    label: 'または WinGet でインストール:',
    copy: 'コピー',
    copied: 'コピーしました！',
  },
  screenshots: {
    pathEditorAlt: 'Envarly — エントリごとの検証とステージ済み変更を表示する PATH エディター',
    applyModalAlt: 'Envarly — PATH エントリの詳細差分を表示する適用確認モーダル',
    firstLabel: 'スクリーンショット 1',
    secondLabel: 'スクリーンショット 2',
    prevLabel: '前のスクリーンショット',
    nextLabel: '次のスクリーンショット',
  },
  featuresHeading: '機能',
  featuresLead: '環境変数を安全に管理するために必要なものをひとまとめに。',
  features: [
    {
      icon: '⠿',
      title: '実用的な PATH エディター',
      desc: 'エントリの並べ替え、ライブの ✓ / ✗ 存在チェックによる検証、リスト表示とプレーンテキストの切り替え、キーボードでの行移動、フォルダ選択まで、すべてエディターを離れずに行えます。',
    },
    {
      icon: '⚿',
      title: 'シークレット検出',
      desc: '変数名のヒューリスティックと値のパターン照合で、GitHub、AWS、Anthropic、Stripe、npm など 35 種類以上のトークン形式を検出します。',
    },
    {
      icon: '⇄',
      title: '外部変更の差分検出',
      desc: 'Envarly を開いている間に他プロセスがレジストリを変更した場合、差分を検出。項目ごとに受け入れる変更を選べます。',
    },
    {
      icon: '📸',
      title: 'スナップショットとデモモード',
      desc: '環境変数全体の名前付きスナップショットを DPAPI で暗号化して保存。デモモードでは、実際のレジストリに触れずにサンプルデータで動作を確認できます。',
    },
  ],
  otherFeaturesHeading: 'そのほかの機能',
  otherFeatures: [
    {
      icon: '⚠',
      title: '環境変数の説明とガイド',
      desc: 'よく使われる環境変数には短い説明を表示し、パス内の解決できない %VAR% 参照も警告します。',
    },
    {
      icon: '↩',
      title: 'ステージ前のローカル Undo',
      desc: '詳細パネルでステージする前に Ctrl+Z を複数段階使えます。ドラッグでの並べ替えとテキスト編集を別の Undo として扱います。',
    },
    {
      icon: '⏳',
      title: '適用の進捗とログ',
      desc: 'ステージした変更をレジストリに書き込む間、進捗バーと変数ごとのログで何が起きているか確認できます。',
    },
    {
      icon: '⇅',
      title: 'インポート / エクスポート',
      desc: '.json と .reg 形式の読み書きに加えて、PowerShell、DSC、Ansible 向けの形式へエクスポートできます。書き込み前にプレビューできます。',
    },
    {
      icon: '↔',
      title: 'パネルの幅を変更',
      desc: 'サイドバーとスナップショットパネルの幅をドラッグで調整できます。次回起動時も幅を記憶します。',
    },
    {
      icon: '🔎',
      title: 'コマンドを調べる',
      desc: 'コマンドが見つからない理由を調査。実効PATHをコマンド名やexeパスで検索し、シャドーイングされた重複も検出します。',
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
