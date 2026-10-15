export const GITHUB_URL = 'https://github.com/iray-tno/envarly';
export const RELEASE_URL = 'https://github.com/iray-tno/envarly/releases/latest';
export const STORYBOOK_URL = '/envarly/storybook/';
export const REPORTS_URL = '/envarly/reports/';
export const VERSION = '1.7.0';
export const WINGET_COMMAND = 'winget install Envarly.Envarly';

export type LandingLang = 'en' | 'ja' | 'zh-CN' | 'ru' | 'ko' | 'vi';

export const LANGUAGES: Array<{ code: LandingLang; path: string; label: string }> = [
  { code: 'en', path: '/envarly/', label: 'English' },
  { code: 'ja', path: '/envarly/ja/', label: '日本語' },
  { code: 'zh-CN', path: '/envarly/zh-cn/', label: '简体中文' },
  { code: 'ru', path: '/envarly/ru/', label: 'Русский' },
  { code: 'ko', path: '/envarly/ko/', label: '한국어' },
  { code: 'vi', path: '/envarly/vi/', label: 'Tiếng Việt' },
];

export type LandingCopy = {
  lang: LandingLang;
  title: string;
  description: string;
  ogDescription: string;
  canonicalPath: string;
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
    videoAlt: string;
    pathEditorAlt: string;
    applyModalAlt: string;
    videoLabel: string;
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
  privacyNote: string;
  faq: {
    heading: string;
    items: Array<{ id: string; question: string; answer: string }>;
    cliSetup: string;
    cliDocs: string;
  };
  footer: {
    copyright: string;
    releases: string;
    license: string;
  };
};

export const enCopy: LandingCopy = {
  faq: {
    heading: 'Frequently asked questions',
    items: [
      {
        id: 'windows-editor',
        question: 'How does Envarly differ from the Windows environment variable editor?',
        answer: 'Envarly lets you stage multiple environment variable changes and review their diffs before applying them. It also includes a PATH list editor with folder selection and path checks, secret detection, and encrypted snapshots.',
      },
      {
        id: 'path',
        question: 'Can I add folders to PATH and change their order?',
        answer: 'Yes. In the PATH list editor, type a folder path or choose a folder, then drag entries to reorder them. You can also move between rows with the arrow keys and reorder with Alt + Up/Down. Stage the edit and review the diff before applying it.',
      },
      {
        id: 'preview',
        question: 'Can I review environment variable changes before saving them?',
        answer: 'Yes. Editing and staging do not write to the registry. The Apply dialog shows additions, changes, and deletions together, including before-and-after values and PATH entry diffs. Only confirming Apply writes the staged changes.',
      },
      {
        id: 'snapshots',
        question: 'Can I back up environment variables and restore an earlier state?',
        answer: 'Yes. Save a named snapshot, or use the automatic snapshot taken before applying changes in the app. Restoring a snapshot stages the changes for review, including deletion of variables added since that snapshot. Snapshots are encrypted with Windows DPAPI and can only be decrypted by the same Windows account on the same PC; they are not portable backups.',
      },
      {
        id: 'admin',
        question: 'Can I use Envarly without administrator privileges?',
        answer: 'Yes. You can view User and System variables and edit your own User variables without elevation. Changing System variables or editing another account requires administrator privileges. Envarly can restart with elevation when needed.',
      },
      {
        id: 'terminal',
        question: 'Why are my changed environment variables not reflected in the terminal?',
        answer: 'An already running process keeps its own environment. Envarly notifies Windows after applying changes, but it cannot replace the environment of an existing shell. Restart the terminal or the application that launches it, such as your editor; opening a new tab in an existing terminal may not be enough.',
      },
      {
        id: 'cli',
        question: 'Can I use Envarly from the command line or scripts?',
        answer: 'Yes. Envarly provides get, list, and export commands for reading, plus set, delete, and import for changes. These write commands default to a dry run and only modify the registry when you add --apply. Run envarly --help to see the commands and options.',
      },
    ],
    cliSetup: 'Run these commands from a terminal. Add the Envarly installation folder to PATH using the app, or invoke envarly.exe by its full path.',
    cliDocs: 'CLI usage and examples',
  },
  lang: 'en',
  title: 'Envarly — Windows Environment Variable Manager',
  description: 'Preview every change as a diff before it touches the registry. Safe PATH editing, secret detection, encrypted snapshots. Free and open source for Windows 10/11.',
  ogDescription: 'Preview every change as a diff before it touches the registry. Safe PATH editing, secret detection, encrypted snapshots. Free and open source for Windows 10/11.',
  canonicalPath: '/envarly/',
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
    videoAlt: 'Envarly — short walkthrough: fixing a broken PATH entry and reviewing the change before applying it',
    pathEditorAlt: 'Envarly — PATH editor with per-entry validation and staged change',
    applyModalAlt: 'Envarly — Apply confirmation modal with Full diff view for PATH entries',
    videoLabel: 'Walkthrough video',
    firstLabel: 'Screenshot 1',
    secondLabel: 'Screenshot 2',
    prevLabel: 'Previous screenshot',
    nextLabel: 'Next screenshot',
  },
  featuresHeading: 'Features',
  featuresLead: 'Everything you need to manage environment variables safely.',
  features: [
    {
      icon: '±',
      title: 'Diff preview',
      desc: 'Every staged change is shown as a diff before you click Apply — nothing reaches the registry without going through this review.',
    },
    {
      icon: '⚿',
      title: 'Secret detection',
      desc: 'Name-based heuristics and value-pattern matching across 35+ token formats — GitHub, AWS, Anthropic, Stripe, npm, and more.',
    },
    {
      icon: '⇄',
      title: 'External change detection',
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
      icon: '⠿',
      title: 'Practical PATH editor',
      desc: 'Reorder entries, validate each one with a live ✓ / ✗ existence check, switch between list and plain text, move through rows with the keyboard, and choose folders — all without leaving the editor.',
    },
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
    {
      icon: '>_',
      title: 'Command-line interface',
      desc: 'Read, export, and edit environment variables from scripts. Write commands default to a dry run and require --apply to save changes.',
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
  privacyNote: "No telemetry in the app — its only network call is a daily version check against GitHub. (This website uses analytics; the app doesn't.)",
  footer: {
    copyright: '© 2026 Envarly · MIT License',
    releases: 'Releases',
    license: 'License',
  },
};

export const jaCopy: LandingCopy = {
  faq: {
    heading: 'よくある質問',
    items: [
      {
        id: 'windows-editor',
        question: 'Envarly は、Windows 標準の環境変数エディターと何が違いますか？',
        answer: 'Envarly は、複数の環境変数の変更をステージし、適用前に差分をまとめて確認できます。フォルダー選択とパスの存在確認に対応した PATH リストエディター、シークレット検出、暗号化スナップショットも備えています。',
      },
      {
        id: 'path',
        question: 'PATH にフォルダーを追加したり、順番を変更したりできますか？',
        answer: 'はい。PATH のリストエディターでパスを入力するか、フォルダーを選んで追加し、ドラッグで順番を変更できます。上下キーで行を移動し、Alt + 上下キーで並べ替えることもできます。編集後にステージし、差分を確認してから適用します。',
      },
      {
        id: 'preview',
        question: '環境変数の変更内容を、保存する前に確認できますか？',
        answer: 'はい。編集やステージの時点ではレジストリに書き込みません。適用ダイアログで追加・変更・削除をまとめて確認でき、変更前後の値や PATH のエントリーごとの差分も表示されます。適用を確定したときに、ステージした変更を書き込みます。',
      },
      {
        id: 'snapshots',
        question: '環境変数をバックアップして、変更前の状態に戻せますか？',
        answer: 'はい。名前付きスナップショットを保存でき、アプリでの変更適用前にも自動保存されます。復元する際は差分がステージされ、スナップショット作成後に追加された変数の削除も含めて確認できます。スナップショットは Windows DPAPI で暗号化され、同じ PC の同じ Windows アカウントでのみ復号できます。別の PC に持ち運ぶためのバックアップではありません。',
      },
      {
        id: 'admin',
        question: '管理者権限なしでも使えますか？',
        answer: 'はい。管理者権限がなくても User・System の環境変数を表示でき、自分の User 変数を編集できます。System 変数の変更や別アカウントの編集には管理者権限が必要です。必要なときはアプリから管理者として再起動できます。',
      },
      {
        id: 'terminal',
        question: '変更した環境変数がターミナルに反映されないのはなぜですか？',
        answer: '起動済みのプロセスは、それぞれの環境変数を保持しているためです。Envarly は適用後に Windows へ変更を通知しますが、実行中のシェルの環境変数を置き換えることはできません。ターミナルや、その起動元のエディターなどを再起動してください。既存のターミナルで新しいタブを開くだけでは反映されない場合があります。',
      },
      {
        id: 'cli',
        question: 'Envarly をコマンドラインやスクリプトから使えますか？',
        answer: 'はい。読み取り用の get・list・export と、変更用の set・delete・import を利用できます。変更用コマンドは既定ではドライランになり、--apply を付けたときだけレジストリへ書き込みます。envarly --help でコマンドとオプションを確認できます。',
      },
    ],
    cliSetup: 'ターミナルから実行してください。アプリで Envarly のインストール先を PATH に追加するか、envarly.exe をフルパスで指定します。',
    cliDocs: 'CLI の使い方と実行例',
  },
  lang: 'ja',
  title: 'Envarly — Windows 環境変数マネージャー',
  description: '変更はレジストリに書き込む前に必ず差分プレビュー。安全なPATH編集、シークレット検出、暗号化スナップショットに対応した無料のオープンソースGUI。Windows 10/11向け。',
  ogDescription: '変更はレジストリに書き込む前に必ず差分プレビュー。安全なPATH編集、シークレット検出、暗号化スナップショットに対応した無料のオープンソースGUI。Windows 10/11向け。',
  canonicalPath: '/envarly/ja/',
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
    videoAlt: 'Envarly — 短いウォークスルー: 壊れた PATH エントリを修正し、適用前に変更内容を確認する',
    pathEditorAlt: 'Envarly — エントリごとの検証とステージ済み変更を表示する PATH エディター',
    applyModalAlt: 'Envarly — PATH エントリの詳細差分を表示する適用確認モーダル',
    videoLabel: 'ウォークスルー動画',
    firstLabel: 'スクリーンショット 1',
    secondLabel: 'スクリーンショット 2',
    prevLabel: '前のスクリーンショット',
    nextLabel: '次のスクリーンショット',
  },
  featuresHeading: '機能',
  featuresLead: '環境変数を安全に管理するために必要なものをひとまとめに。',
  features: [
    {
      icon: '±',
      title: '差分プレビュー',
      desc: 'ステージした変更はすべて、Apply をクリックする前に差分として表示されます。このレビューを経ずにレジストリへ反映されることはありません。',
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
      icon: '⠿',
      title: '実用的な PATH エディター',
      desc: 'エントリの並べ替え、ライブの ✓ / ✗ 存在チェックによる検証、リスト表示とプレーンテキストの切り替え、キーボードでの行移動、フォルダ選択まで、すべてエディターを離れずに行えます。',
    },
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
    {
      icon: '>_',
      title: 'コマンドライン操作',
      desc: 'スクリプトから環境変数を読み取り・エクスポート・編集できます。変更用コマンドは既定ではドライランになり、--apply で書き込みます。',
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
  privacyNote: 'アプリ本体にテレメトリはありません — 唯一の通信は GitHub への日次バージョンチェックだけです。(この Web サイトはアクセス解析を使っていますが、アプリ本体は使っていません。)',
  footer: {
    copyright: '© 2026 Envarly · MIT License',
    releases: 'リリース',
    license: 'ライセンス',
  },
};

export const zhCNCopy: LandingCopy = {
  faq: {
    heading: '常见问题',
    items: [
      {
        id: 'windows-editor',
        question: 'Envarly 与 Windows 自带的环境变量编辑器有什么区别？',
        answer: 'Envarly 可以暂存多个环境变量的更改，并在应用前集中查看差异。它还提供支持文件夹选择和路径检查的 PATH 列表编辑器、敏感信息检测以及加密快照。',
      },
      {
        id: 'path',
        question: '可以向 PATH 添加文件夹并调整顺序吗？',
        answer: '可以。在 PATH 列表编辑器中输入路径或选择文件夹，然后拖动条目调整顺序。也可以用上下方向键切换行，用 Alt + 上下方向键排序。暂存编辑后，先查看差异再应用。',
      },
      {
        id: 'preview',
        question: '保存前可以查看环境变量的更改内容吗？',
        answer: '可以。编辑和暂存不会写入注册表。应用对话框会集中显示新增、修改和删除，包括更改前后的值以及 PATH 条目的差异。只有确认应用后才会写入暂存的更改。',
      },
      {
        id: 'snapshots',
        question: '可以备份环境变量并恢复到之前的状态吗？',
        answer: '可以。您可以保存命名快照，应用内应用更改前也会自动保存快照。恢复时会暂存差异供您检查，包括删除快照创建后新增的变量。快照使用 Windows DPAPI 加密，只能由同一台电脑上的同一个 Windows 账户解密，不能用作跨电脑迁移的备份。',
      },
      {
        id: 'admin',
        question: '没有管理员权限也能使用 Envarly 吗？',
        answer: '可以。无需管理员权限即可查看用户和系统变量，并编辑自己的用户变量。修改系统变量或编辑其他账户需要管理员权限。必要时可以从应用中以管理员身份重新启动。',
      },
      {
        id: 'terminal',
        question: '为什么修改后的环境变量没有在终端中生效？',
        answer: '已经运行的进程保留自己的环境变量。Envarly 会在应用更改后通知 Windows，但无法替换现有 shell 的环境。请重新启动终端或启动它的应用，例如编辑器；仅在现有终端中打开新标签页可能不够。',
      },
      {
        id: 'cli',
        question: '可以从命令行或脚本使用 Envarly 吗？',
        answer: '可以。get、list 和 export 用于读取，set、delete 和 import 用于修改。修改命令默认为试运行，只有添加 --apply 才会写入注册表。运行 envarly --help 可查看命令和选项。',
      },
    ],
    cliSetup: '请在终端中运行。通过应用将 Envarly 安装目录添加到 PATH，或使用 envarly.exe 的完整路径。',
    cliDocs: 'CLI 用法和示例',
  },
  lang: 'zh-CN',
  title: 'Envarly — Windows 环境变量管理器',
  description: '每一处更改在写入注册表前都会先以差异形式预览。安全的 PATH 编辑、敏感信息检测、加密快照。免费开源，适用于 Windows 10/11。',
  ogDescription: '每一处更改在写入注册表前都会先以差异形式预览。安全的 PATH 编辑、敏感信息检测、加密快照。免费开源，适用于 Windows 10/11。',
  canonicalPath: '/envarly/zh-cn/',
  nav: {
    features: '功能',
    storybook: 'Storybook',
    reports: '报告',
    download: '下载',
  },
  hero: {
    eyebrow: `Windows 环境变量管理器 · v${VERSION}`,
    lead: '编辑、审计并保护你的 Windows 环境变量。应用前预览每一处更改，通过文件夹选择器整理 PATH 条目，让每一次注册表写入都清晰可控。',
    download: `下载 Windows 版 v${VERSION}`,
    github: '在 GitHub 上查看 →',
  },
  install: {
    label: '或使用 WinGet 安装：',
    copy: '复制',
    copied: '已复制！',
  },
  screenshots: {
    videoAlt: 'Envarly — 简短演示：修复失效的 PATH 条目，并在应用前查看更改内容',
    pathEditorAlt: 'Envarly — 带逐项校验和暂存更改的 PATH 编辑器',
    applyModalAlt: 'Envarly — 显示 PATH 条目完整差异的应用确认弹窗',
    videoLabel: '演示视频',
    firstLabel: '截图 1',
    secondLabel: '截图 2',
    prevLabel: '上一张截图',
    nextLabel: '下一张截图',
  },
  featuresHeading: '功能',
  featuresLead: '安全管理环境变量所需的一切。',
  features: [
    {
      icon: '±',
      title: '差异预览',
      desc: '每一处已暂存的更改，在点击 Apply 之前都会以差异形式展示 — 不经过这一步审阅，任何内容都不会写入注册表。',
    },
    {
      icon: '⚿',
      title: '敏感信息检测',
      desc: '基于名称的启发式规则和值模式匹配，覆盖 35+ 种令牌格式 — 包括 GitHub、AWS、Anthropic、Stripe、npm 等。',
    },
    {
      icon: '⇄',
      title: '外部更改检测',
      desc: 'Envarly 运行期间，检测其他进程对注册表所做的更改，并显示差异，可逐项选择接受。',
    },
    {
      icon: '📸',
      title: '快照与演示模式',
      desc: '保存完整环境变量的命名快照，使用 DPAPI 加密。演示模式会打开逼真的示例数据，方便截图和演示而不影响你的实际注册表。',
    },
  ],
  otherFeaturesHeading: '还包括',
  otherFeatures: [
    {
      icon: '⠿',
      title: '实用的 PATH 编辑器',
      desc: '重新排序条目，通过实时的 ✓ / ✗ 存在性检查逐项校验，在列表和纯文本模式间切换，用键盘在行间移动，并直接选择文件夹 — 全程无需离开编辑器。',
    },
    {
      icon: '⚠',
      title: '环境变量说明',
      desc: '为常见变量显示简短说明，并对路径条目中无法解析的 %VAR% 引用发出警告。',
    },
    {
      icon: '↩',
      title: '暂存前的本地撤销',
      desc: '在详情面板中暂存前，可多步 Ctrl+Z 撤销。拖动排序与文本编辑是各自独立的撤销步骤。',
    },
    {
      icon: '⏳',
      title: '应用进度与日志',
      desc: '暂存的更改写入注册表期间，进度条和逐变量日志会准确展示发生了什么。',
    },
    {
      icon: '⇅',
      title: '导入 / 导出',
      desc: '读写 .json 与 .reg 格式，还可导出为 PowerShell、DSC 及 Ansible 友好的文件格式。写入前均可预览。',
    },
    {
      icon: '↔',
      title: '可调整面板宽度',
      desc: '拖动侧边栏和快照面板到你想要的宽度，重启后仍会记住。',
    },
    {
      icon: '🔎',
      title: '检查命令',
      desc: '查明命令为何找不到 — 按名称或 exe 路径搜索有效 PATH，并标记被遮蔽的重复项。',
    },
    {
      icon: '>_',
      title: '命令行界面',
      desc: '通过脚本读取、导出和编辑环境变量。修改命令默认为试运行，需要 --apply 才会保存更改。',
    },
  ],
  audience: {
    heading: '适合谁使用？',
    paragraphs: [
      'Envarly 专为经常在 Windows 10 / 11 上编辑用户和系统环境变量的开发者与高级用户打造 — 提供比内置 Windows 设置面板更安全、更直观的替代方案。',
      '无论是整理杂乱的 PATH 变量、轮换存储为环境变量的 API 密钥、导入团队的 .env 基线，还是在安装失败后恢复快照 — Envarly 都能让你在写入注册表之前，完全掌握每一处更改。',
    ],
  },
  stack: {
    label: 'Built with',
    items: ['Tauri v2', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'Rust'],
  },
  privacyNote: '应用本身不含任何遥测 — 唯一的网络请求是每天向 GitHub 检查新版本。（本网站使用网站访问分析，应用本身不使用。）',
  footer: {
    copyright: '© 2026 Envarly · MIT License',
    releases: '发行版',
    license: '许可证',
  },
};

export const ruCopy: LandingCopy = {
  faq: {
    heading: 'Частые вопросы',
    items: [
      {
        id: 'windows-editor',
        question: 'Чем Envarly отличается от редактора переменных среды Windows?',
        answer: 'Envarly позволяет подготовить несколько изменений переменных среды и просмотреть их различия перед применением. Также доступны редактор PATH с выбором папок и проверкой путей, обнаружение секретов и зашифрованные снимки.',
      },
      {
        id: 'path',
        question: 'Можно ли добавлять папки в PATH и менять их порядок?',
        answer: 'Да. В редакторе списка PATH введите путь или выберите папку, затем перетаскивайте записи для изменения порядка. Стрелки переключают строки, а Alt + Вверх/Вниз меняет их порядок. Подготовьте изменения и проверьте различия перед применением.',
      },
      {
        id: 'preview',
        question: 'Можно ли проверить изменения переменных среды перед сохранением?',
        answer: 'Да. Редактирование и подготовка изменений не записывают данные в реестр. Диалог применения показывает добавления, изменения и удаления, включая старые и новые значения и различия записей PATH. Запись происходит только после подтверждения применения.',
      },
      {
        id: 'snapshots',
        question: 'Можно ли сохранить переменные среды и восстановить прежнее состояние?',
        answer: 'Да. Можно сохранить именованный снимок; перед применением изменений в приложении снимок создаётся автоматически. При восстановлении различия подготавливаются для проверки, включая удаление переменных, добавленных после создания снимка. Снимки зашифрованы Windows DPAPI: расшифровать их может только та же учётная запись Windows на том же ПК. Они не предназначены для переноса на другой компьютер.',
      },
      {
        id: 'admin',
        question: 'Можно ли пользоваться Envarly без прав администратора?',
        answer: 'Да. Без повышения прав можно просматривать пользовательские и системные переменные и редактировать свои пользовательские переменные. Для изменения системных переменных или работы с другой учётной записью нужны права администратора. Приложение можно перезапустить с повышением прав.',
      },
      {
        id: 'terminal',
        question: 'Почему изменённые переменные среды не появились в терминале?',
        answer: 'Уже запущенный процесс сохраняет собственное окружение. Envarly уведомляет Windows после применения изменений, но не может заменить окружение работающей оболочки. Перезапустите терминал или запускающее его приложение, например редактор. Открытия новой вкладки в работающем терминале может быть недостаточно.',
      },
      {
        id: 'cli',
        question: 'Можно ли использовать Envarly из командной строки или скриптов?',
        answer: 'Да. Команды get, list и export читают данные, а set, delete и import подготавливают изменения. По умолчанию команды изменения работают в пробном режиме и записывают в реестр только с флагом --apply. Команда envarly --help показывает доступные команды и параметры.',
      },
    ],
    cliSetup: 'Запускайте команды из терминала. Добавьте папку установки Envarly в PATH через приложение или укажите полный путь к envarly.exe.',
    cliDocs: 'Использование CLI и примеры',
  },
  lang: 'ru',
  title: 'Envarly — менеджер переменных окружения Windows',
  description: 'Каждое изменение показывается как diff перед записью в реестр. Безопасное редактирование PATH, обнаружение секретов, зашифрованные снимки. Бесплатно, с открытым исходным кодом, для Windows 10/11.',
  ogDescription: 'Каждое изменение показывается как diff перед записью в реестр. Безопасное редактирование PATH, обнаружение секретов, зашифрованные снимки. Бесплатно, с открытым исходным кодом, для Windows 10/11.',
  canonicalPath: '/envarly/ru/',
  nav: {
    features: 'Возможности',
    storybook: 'Storybook',
    reports: 'Отчёты',
    download: 'Скачать',
  },
  hero: {
    eyebrow: `Менеджер переменных окружения Windows · v${VERSION}`,
    lead: 'Редактируйте, проверяйте и защищайте переменные окружения Windows. Просматривайте каждое изменение перед применением, приводите PATH в порядок с помощью выбора папок и делайте каждую запись в реестр осознанной.',
    download: `Скачать v${VERSION} для Windows`,
    github: 'Смотреть на GitHub →',
  },
  install: {
    label: 'Или установите через WinGet:',
    copy: 'Копировать',
    copied: 'Скопировано!',
  },
  screenshots: {
    videoAlt: 'Envarly — короткая демонстрация: исправление неработающей записи PATH и просмотр изменения перед применением',
    pathEditorAlt: 'Envarly — редактор PATH с проверкой каждой записи и изменениями в очереди',
    applyModalAlt: 'Envarly — окно подтверждения применения с полным просмотром различий для записей PATH',
    videoLabel: 'Видео с демонстрацией',
    firstLabel: 'Скриншот 1',
    secondLabel: 'Скриншот 2',
    prevLabel: 'Предыдущий скриншот',
    nextLabel: 'Следующий скриншот',
  },
  featuresHeading: 'Возможности',
  featuresLead: 'Всё необходимое для безопасного управления переменными окружения.',
  features: [
    {
      icon: '±',
      title: 'Предпросмотр diff',
      desc: 'Каждое отложенное изменение показывается как diff перед нажатием Apply — ничего не попадает в реестр, минуя этот просмотр.',
    },
    {
      icon: '⚿',
      title: 'Обнаружение секретов',
      desc: 'Эвристика по именам и сопоставление по шаблонам значений для более чем 35 форматов токенов — GitHub, AWS, Anthropic, Stripe, npm и другие.',
    },
    {
      icon: '⇄',
      title: 'Обнаружение внешних изменений',
      desc: 'Обнаруживает изменения реестра, сделанные другими процессами, пока Envarly открыт. Показывает различия с выборочным применением по каждой записи.',
    },
    {
      icon: '📸',
      title: 'Снимки и демо-режим',
      desc: 'Сохраняйте именованные снимки всего окружения, зашифрованные через DPAPI. Демо-режим открывает реалистичные тестовые данные для скриншотов и демонстраций, не затрагивая реестр.',
    },
  ],
  otherFeaturesHeading: 'Также включено',
  otherFeatures: [
    {
      icon: '⠿',
      title: 'Удобный редактор PATH',
      desc: 'Меняйте порядок записей, проверяйте каждую в реальном времени (✓ / ✗ на существование), переключайтесь между списком и обычным текстом, перемещайтесь по строкам с клавиатуры и выбирайте папки — всё, не покидая редактор.',
    },
    {
      icon: '⚠',
      title: 'Подсказки по переменным',
      desc: 'Показывает краткие описания для известных переменных и предупреждает о неразрешимых ссылках %VAR% в записях пути.',
    },
    {
      icon: '↩',
      title: 'Локальная отмена до постановки в очередь',
      desc: 'Многошаговый Ctrl+Z в панели деталей до постановки в очередь. Перетаскивание и редактирование текста — отдельные шаги отмены.',
    },
    {
      icon: '⏳',
      title: 'Прогресс применения и журнал',
      desc: 'Индикатор прогресса и журнал по каждой переменной точно показывают, что происходит при записи изменений из очереди в реестр.',
    },
    {
      icon: '⇅',
      title: 'Импорт / Экспорт',
      desc: 'Чтение и запись форматов .json и .reg, а также экспорт в файлы, совместимые с PowerShell, DSC и Ansible. Предпросмотр перед любой записью.',
    },
    {
      icon: '↔',
      title: 'Изменяемые панели',
      desc: 'Перетащите боковую панель и панель снимков на нужную ширину. Размеры сохраняются между перезапусками.',
    },
    {
      icon: '🔎',
      title: 'Проверка команды',
      desc: 'Узнайте, почему команда не найдена — поиск по эффективному PATH по имени или пути к exe-файлу с выявлением перекрытых дублей.',
    },
    {
      icon: '>_',
      title: 'Командная строка',
      desc: 'Читайте, экспортируйте и редактируйте переменные из скриптов. Команды изменения по умолчанию работают в пробном режиме; для записи нужен --apply.',
    },
  ],
  audience: {
    heading: 'Для кого это?',
    paragraphs: [
      'Envarly создан для разработчиков и опытных пользователей Windows 10 и 11, которые часто редактируют пользовательские и системные переменные окружения — и хотят более безопасную и наглядную альтернативу встроенной панели настроек Windows.',
      'Приводите ли вы в порядок захламлённую переменную PATH, ротируете API-ключи, хранящиеся как переменные окружения, импортируете базовый .env команды или восстанавливаете снимок после неудачной установки — Envarly даёт полную видимость до того, как что-либо будет записано в реестр.',
    ],
  },
  stack: {
    label: 'Built with',
    items: ['Tauri v2', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'Rust'],
  },
  privacyNote: 'В приложении нет телеметрии — единственный сетевой запрос — ежедневная проверка новой версии на GitHub. (Этот сайт использует веб-аналитику, само приложение — нет.)',
  footer: {
    copyright: '© 2026 Envarly · MIT License',
    releases: 'Релизы',
    license: 'Лицензия',
  },
};

export const koCopy: LandingCopy = {
  faq: {
    heading: '자주 묻는 질문',
    items: [
      {
        id: 'windows-editor',
        question: 'Envarly는 Windows 기본 환경 변수 편집기와 무엇이 다른가요?',
        answer: 'Envarly는 여러 환경 변수의 변경 사항을 스테이징하고 적용 전에 차이를 한 번에 확인할 수 있습니다. 폴더 선택과 경로 확인을 지원하는 PATH 목록 편집기, 비밀 정보 탐지, 암호화된 스냅샷도 제공합니다.',
      },
      {
        id: 'path',
        question: 'PATH에 폴더를 추가하거나 순서를 바꿀 수 있나요?',
        answer: '네. PATH 목록 편집기에서 경로를 입력하거나 폴더를 선택하고, 항목을 드래그하여 순서를 바꿀 수 있습니다. 위아래 방향키로 행을 이동하고 Alt + 위/아래로 순서를 변경할 수도 있습니다. 편집 내용을 스테이징한 뒤 차이를 확인하고 적용합니다.',
      },
      {
        id: 'preview',
        question: '환경 변수 변경 내용을 저장 전에 확인할 수 있나요?',
        answer: '네. 편집하거나 스테이징하는 단계에서는 레지스트리에 쓰지 않습니다. 적용 대화 상자에서 추가, 변경, 삭제를 한 번에 확인하며 변경 전후의 값과 PATH 항목별 차이도 볼 수 있습니다. 적용을 확정할 때만 스테이징한 변경 사항을 기록합니다.',
      },
      {
        id: 'snapshots',
        question: '환경 변수를 백업하고 이전 상태로 복원할 수 있나요?',
        answer: '네. 이름을 지정한 스냅샷을 저장할 수 있으며 앱에서 변경 사항을 적용하기 전에도 자동으로 저장됩니다. 복원 시 차이가 스테이징되며, 스냅샷 이후 추가된 변수의 삭제도 확인할 수 있습니다. 스냅샷은 Windows DPAPI로 암호화되어 같은 PC의 같은 Windows 계정에서만 복호화할 수 있습니다. 다른 PC로 옮기는 용도의 백업은 아닙니다.',
      },
      {
        id: 'admin',
        question: '관리자 권한 없이도 사용할 수 있나요?',
        answer: '네. 관리자 권한 없이 사용자 및 시스템 변수를 보고 자신의 사용자 변수를 편집할 수 있습니다. 시스템 변수를 변경하거나 다른 계정을 편집하려면 관리자 권한이 필요합니다. 필요할 때 앱에서 관리자 권한으로 다시 시작할 수 있습니다.',
      },
      {
        id: 'terminal',
        question: '변경한 환경 변수가 터미널에 반영되지 않는 이유는 무엇인가요?',
        answer: '이미 실행 중인 프로세스는 자신의 환경을 유지하기 때문입니다. Envarly는 적용 후 Windows에 변경을 알리지만 실행 중인 셸의 환경을 바꿀 수는 없습니다. 터미널이나 터미널을 실행한 편집기 등의 앱을 다시 시작하세요. 기존 터미널에서 새 탭만 여는 것으로는 부족할 수 있습니다.',
      },
      {
        id: 'cli',
        question: '명령줄이나 스크립트에서 Envarly를 사용할 수 있나요?',
        answer: '네. get, list, export는 읽기에, set, delete, import는 변경에 사용합니다. 변경 명령은 기본적으로 미리 실행만 하며 --apply를 추가할 때만 레지스트리에 기록합니다. envarly --help로 명령과 옵션을 확인할 수 있습니다.',
      },
    ],
    cliSetup: '터미널에서 실행하세요. 앱에서 Envarly 설치 폴더를 PATH에 추가하거나 envarly.exe의 전체 경로를 지정하세요.',
    cliDocs: 'CLI 사용법과 예제',
  },
  lang: 'ko',
  title: 'Envarly — Windows 환경 변수 관리자',
  description: '모든 변경 사항은 레지스트리에 기록되기 전에 diff로 미리 확인할 수 있습니다. 안전한 PATH 편집, 민감 정보 감지, 암호화된 스냅샷. Windows 10/11용 무료 오픈소스 GUI.',
  ogDescription: '모든 변경 사항은 레지스트리에 기록되기 전에 diff로 미리 확인할 수 있습니다. 안전한 PATH 편집, 민감 정보 감지, 암호화된 스냅샷. Windows 10/11용 무료 오픈소스 GUI.',
  canonicalPath: '/envarly/ko/',
  nav: {
    features: '기능',
    storybook: 'Storybook',
    reports: '리포트',
    download: '다운로드',
  },
  hero: {
    eyebrow: `Windows 환경 변수 관리자 · v${VERSION}`,
    lead: 'Windows 환경 변수를 편집, 점검, 보호하세요. 적용 전 모든 변경 사항을 미리 보고, 폴더 선택 기능으로 PATH 항목을 정리하며, 레지스트리에 쓰는 모든 내용을 의도한 대로 유지할 수 있습니다.',
    download: `Windows용 v${VERSION} 다운로드`,
    github: 'GitHub에서 보기 →',
  },
  install: {
    label: '또는 WinGet으로 설치:',
    copy: '복사',
    copied: '복사됨!',
  },
  screenshots: {
    videoAlt: 'Envarly — 짧은 둘러보기: 손상된 PATH 항목을 수정하고 적용 전에 변경 사항을 검토합니다',
    pathEditorAlt: 'Envarly — 항목별 검증과 스테이징된 변경 사항을 보여주는 PATH 편집기',
    applyModalAlt: 'Envarly — PATH 항목의 전체 차이를 보여주는 적용 확인 모달',
    videoLabel: '둘러보기 영상',
    firstLabel: '스크린샷 1',
    secondLabel: '스크린샷 2',
    prevLabel: '이전 스크린샷',
    nextLabel: '다음 스크린샷',
  },
  featuresHeading: '기능',
  featuresLead: '환경 변수를 안전하게 관리하는 데 필요한 모든 것.',
  features: [
    {
      icon: '±',
      title: 'Diff 미리보기',
      desc: '스테이징된 모든 변경 사항은 Apply를 누르기 전에 diff로 표시됩니다. 이 검토를 거치지 않고는 어떤 것도 레지스트리에 반영되지 않습니다.',
    },
    {
      icon: '⚿',
      title: '민감 정보 감지',
      desc: '이름 기반 휴리스틱과 값 패턴 매칭으로 GitHub, AWS, Anthropic, Stripe, npm 등 35개 이상의 토큰 형식을 감지합니다.',
    },
    {
      icon: '⇄',
      title: '외부 변경 감지',
      desc: 'Envarly가 열려 있는 동안 다른 프로세스가 만든 레지스트리 변경을 감지합니다. 항목별로 선택하여 적용할 수 있는 차이를 보여줍니다.',
    },
    {
      icon: '📸',
      title: '스냅샷 및 데모 모드',
      desc: '전체 환경의 이름 있는 스냅샷을 DPAPI로 암호화하여 저장합니다. 데모 모드는 실제 레지스트리를 건드리지 않고 스크린샷과 시연을 위한 사실적인 샘플 데이터를 엽니다.',
    },
  ],
  otherFeaturesHeading: '이 외에도',
  otherFeatures: [
    {
      icon: '⠿',
      title: '실용적인 PATH 편집기',
      desc: '항목 순서 변경, 실시간 ✓ / ✗ 존재 여부 검사로 항목별 검증, 목록과 일반 텍스트 전환, 키보드로 행 이동, 폴더 선택까지 — 편집기를 벗어나지 않고 모두 할 수 있습니다.',
    },
    {
      icon: '⚠',
      title: '환경 변수 안내',
      desc: '잘 알려진 변수에 대한 간단한 설명을 보여주고, 경로 항목의 해석할 수 없는 %VAR% 참조에 대해 경고합니다.',
    },
    {
      icon: '↩',
      title: '스테이징 전 로컬 실행 취소',
      desc: '스테이징 전 상세 패널에서 여러 단계의 Ctrl+Z를 사용할 수 있습니다. 드래그 순서 변경과 텍스트 편집은 별도의 실행 취소 단계로 취급됩니다.',
    },
    {
      icon: '⏳',
      title: '적용 진행률 및 로그',
      desc: '스테이징된 변경 사항이 레지스트리에 기록되는 동안 진행률 표시줄과 변수별 로그로 정확히 무슨 일이 일어나는지 보여줍니다.',
    },
    {
      icon: '⇅',
      title: '가져오기 / 내보내기',
      desc: '.json과 .reg 형식을 읽고 쓰며, PowerShell, DSC, Ansible 친화적인 파일로도 내보낼 수 있습니다. 쓰기 전에 항상 미리 볼 수 있습니다.',
    },
    {
      icon: '↔',
      title: '크기 조절 가능한 패널',
      desc: '사이드바와 스냅샷 패널을 원하는 너비로 드래그하세요. 크기는 재시작 후에도 기억됩니다.',
    },
    {
      icon: '🔎',
      title: '명령어 확인',
      desc: '명령어를 찾을 수 없는 이유를 확인하세요 — 이름이나 exe 경로로 유효 PATH를 검색하고 가려진 중복 항목을 표시합니다.',
    },
    {
      icon: '>_',
      title: '명령줄 인터페이스',
      desc: '스크립트에서 환경 변수를 읽고 내보내고 편집하세요. 변경 명령은 기본적으로 미리 실행만 하며 --apply를 추가해야 기록합니다.',
    },
  ],
  audience: {
    heading: '누구를 위한 도구인가요?',
    paragraphs: [
      'Envarly는 Windows 10과 11에서 사용자 및 시스템 환경 변수를 자주 편집하는 개발자와 파워 유저를 위해 만들어졌습니다 — 기본 Windows 설정 패널보다 더 안전하고 시각적인 대안을 제공합니다.',
      '어수선한 PATH 변수를 정리하든, 환경 변수로 저장된 API 키를 교체하든, 팀의 .env 기준선을 가져오든, 설치 실패 후 스냅샷을 복원하든 — Envarly는 레지스트리에 어떤 것이 기록되기 전에 완전한 가시성을 제공합니다.',
    ],
  },
  stack: {
    label: 'Built with',
    items: ['Tauri v2', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'Rust'],
  },
  privacyNote: '앱에는 텔레메트리가 없습니다 — 유일한 네트워크 요청은 GitHub에서 매일 새 버전을 확인하는 것뿐입니다. (이 웹사이트는 방문자 분석을 사용하지만, 앱 자체는 사용하지 않습니다.)',
  footer: {
    copyright: '© 2026 Envarly · MIT License',
    releases: '릴리스',
    license: '라이선스',
  },
};

export const viCopy: LandingCopy = {
  faq: {
    heading: 'Câu hỏi thường gặp',
    items: [
      {
        id: 'windows-editor',
        question: 'Envarly khác gì so với trình chỉnh sửa biến môi trường của Windows?',
        answer: 'Envarly cho phép chuẩn bị nhiều thay đổi biến môi trường và xem các khác biệt trước khi áp dụng. Ứng dụng còn có trình chỉnh sửa danh sách PATH với tính năng chọn thư mục và kiểm tra đường dẫn, phát hiện thông tin bí mật và ảnh chụp nhanh được mã hóa.',
      },
      {
        id: 'path',
        question: 'Tôi có thể thêm thư mục vào PATH và thay đổi thứ tự không?',
        answer: 'Có. Trong trình chỉnh sửa danh sách PATH, nhập đường dẫn hoặc chọn thư mục, sau đó kéo các mục để sắp xếp lại. Bạn cũng có thể chuyển dòng bằng phím mũi tên và đổi thứ tự bằng Alt + Lên/Xuống. Đưa thay đổi vào danh sách chờ và xem khác biệt trước khi áp dụng.',
      },
      {
        id: 'preview',
        question: 'Tôi có thể xem lại thay đổi biến môi trường trước khi lưu không?',
        answer: 'Có. Việc chỉnh sửa và đưa vào danh sách chờ không ghi vào registry. Hộp thoại áp dụng hiển thị các mục thêm, sửa và xóa cùng giá trị trước và sau, cũng như khác biệt từng mục PATH. Chỉ khi xác nhận áp dụng thì các thay đổi đang chờ mới được ghi.',
      },
      {
        id: 'snapshots',
        question: 'Tôi có thể sao lưu biến môi trường và khôi phục trạng thái trước đó không?',
        answer: 'Có. Bạn có thể lưu ảnh chụp nhanh có tên; ứng dụng cũng tự động lưu trước khi áp dụng thay đổi. Khi khôi phục, các khác biệt được đưa vào danh sách chờ để xem lại, kể cả việc xóa các biến được thêm sau thời điểm chụp. Ảnh chụp được mã hóa bằng Windows DPAPI và chỉ cùng tài khoản Windows trên cùng máy tính mới giải mã được; chúng không phải bản sao lưu để chuyển sang máy khác.',
      },
      {
        id: 'admin',
        question: 'Tôi có thể dùng Envarly mà không có quyền quản trị không?',
        answer: 'Có. Bạn có thể xem biến Người dùng và Hệ thống, đồng thời chỉnh sửa biến Người dùng của mình mà không cần quyền quản trị. Thay đổi biến Hệ thống hoặc chỉnh sửa tài khoản khác cần quyền quản trị. Khi cần, bạn có thể khởi động lại ứng dụng với quyền quản trị.',
      },
      {
        id: 'terminal',
        question: 'Tại sao biến môi trường đã thay đổi chưa được cập nhật trong terminal?',
        answer: 'Tiến trình đang chạy giữ môi trường riêng của nó. Envarly thông báo cho Windows sau khi áp dụng, nhưng không thể thay môi trường của shell đang chạy. Hãy khởi động lại terminal hoặc ứng dụng mở terminal, chẳng hạn trình soạn thảo; chỉ mở tab mới trong terminal hiện tại có thể chưa đủ.',
      },
      {
        id: 'cli',
        question: 'Tôi có thể dùng Envarly từ dòng lệnh hoặc script không?',
        answer: 'Có. get, list và export dùng để đọc; set, delete và import dùng để thay đổi. Các lệnh thay đổi mặc định chỉ chạy thử và chỉ ghi vào registry khi thêm --apply. Chạy envarly --help để xem các lệnh và tùy chọn.',
      },
    ],
    cliSetup: 'Chạy từ terminal. Thêm thư mục cài đặt Envarly vào PATH bằng ứng dụng, hoặc dùng đường dẫn đầy đủ tới envarly.exe.',
    cliDocs: 'Cách dùng CLI và ví dụ',
  },
  lang: 'vi',
  title: 'Envarly — Trình quản lý biến môi trường Windows',
  description: 'Mọi thay đổi đều được xem trước dạng diff trước khi ghi vào registry. Chỉnh sửa PATH an toàn, phát hiện thông tin nhạy cảm, ảnh chụp nhanh mã hóa. Miễn phí, mã nguồn mở, dành cho Windows 10/11.',
  ogDescription: 'Mọi thay đổi đều được xem trước dạng diff trước khi ghi vào registry. Chỉnh sửa PATH an toàn, phát hiện thông tin nhạy cảm, ảnh chụp nhanh mã hóa. Miễn phí, mã nguồn mở, dành cho Windows 10/11.',
  canonicalPath: '/envarly/vi/',
  nav: {
    features: 'Tính năng',
    storybook: 'Storybook',
    reports: 'Báo cáo',
    download: 'Tải xuống',
  },
  hero: {
    eyebrow: `Trình quản lý biến môi trường Windows · v${VERSION}`,
    lead: 'Chỉnh sửa, kiểm tra và bảo vệ biến môi trường Windows của bạn. Xem trước mọi thay đổi trước khi áp dụng, dọn dẹp các mục PATH bằng công cụ chọn thư mục, và giữ mọi lần ghi vào registry đều có chủ đích.',
    download: `Tải xuống v${VERSION} cho Windows`,
    github: 'Xem trên GitHub →',
  },
  install: {
    label: 'Hoặc cài đặt bằng WinGet:',
    copy: 'Sao chép',
    copied: 'Đã sao chép!',
  },
  screenshots: {
    videoAlt: 'Envarly — video ngắn: sửa một mục PATH bị lỗi và xem lại thay đổi trước khi áp dụng',
    pathEditorAlt: 'Envarly — trình chỉnh sửa PATH với kiểm tra từng mục và thay đổi đang chờ',
    applyModalAlt: 'Envarly — hộp thoại xác nhận áp dụng với chế độ xem đầy đủ khác biệt cho các mục PATH',
    videoLabel: 'Video giới thiệu',
    firstLabel: 'Ảnh chụp màn hình 1',
    secondLabel: 'Ảnh chụp màn hình 2',
    prevLabel: 'Ảnh chụp màn hình trước',
    nextLabel: 'Ảnh chụp màn hình tiếp theo',
  },
  featuresHeading: 'Tính năng',
  featuresLead: 'Mọi thứ bạn cần để quản lý biến môi trường một cách an toàn.',
  features: [
    {
      icon: '±',
      title: 'Xem trước diff',
      desc: 'Mọi thay đổi đã xếp hàng đều được hiển thị dưới dạng diff trước khi bạn nhấn Apply — không có gì được ghi vào registry nếu chưa qua bước xem xét này.',
    },
    {
      icon: '⚿',
      title: 'Phát hiện thông tin nhạy cảm',
      desc: 'Suy đoán dựa trên tên biến và đối chiếu mẫu giá trị trên hơn 35 định dạng token — GitHub, AWS, Anthropic, Stripe, npm và nhiều hơn nữa.',
    },
    {
      icon: '⇄',
      title: 'Phát hiện thay đổi bên ngoài',
      desc: 'Phát hiện các thay đổi registry do tiến trình khác thực hiện trong khi Envarly đang mở. Hiển thị khác biệt và cho phép áp dụng chọn lọc từng mục.',
    },
    {
      icon: '📸',
      title: 'Ảnh chụp nhanh & chế độ demo',
      desc: 'Lưu các ảnh chụp nhanh có tên của toàn bộ môi trường, được mã hóa bằng DPAPI. Chế độ demo mở dữ liệu mẫu chân thực để chụp màn hình và trình diễn mà không ảnh hưởng đến registry thật của bạn.',
    },
  ],
  otherFeaturesHeading: 'Còn có thêm',
  otherFeatures: [
    {
      icon: '⠿',
      title: 'Trình chỉnh sửa PATH thực dụng',
      desc: 'Sắp xếp lại các mục, kiểm tra từng mục bằng dấu ✓ / ✗ theo thời gian thực, chuyển đổi giữa dạng danh sách và văn bản thuần, di chuyển qua các dòng bằng bàn phím, và chọn thư mục — tất cả mà không cần rời khỏi trình chỉnh sửa.',
    },
    {
      icon: '⚠',
      title: 'Hướng dẫn về biến môi trường',
      desc: 'Hiển thị mô tả ngắn gọn cho các biến phổ biến và cảnh báo khi có tham chiếu %VAR% không thể giải quyết trong các mục đường dẫn.',
    },
    {
      icon: '↩',
      title: 'Hoàn tác cục bộ trước khi xếp hàng',
      desc: 'Ctrl+Z nhiều bước trong bảng chi tiết trước khi xếp hàng. Sắp xếp lại bằng kéo thả và chỉnh sửa văn bản là các bước hoàn tác độc lập.',
    },
    {
      icon: '⏳',
      title: 'Tiến trình áp dụng & nhật ký',
      desc: 'Thanh tiến trình và nhật ký theo từng biến cho biết chính xác điều gì đang xảy ra khi các thay đổi đang chờ được ghi vào registry.',
    },
    {
      icon: '⇅',
      title: 'Nhập / Xuất',
      desc: 'Đọc và ghi định dạng .json và .reg, cùng khả năng xuất sang các tệp thân thiện với PowerShell, DSC và Ansible. Xem trước trước khi ghi bất kỳ điều gì.',
    },
    {
      icon: '↔',
      title: 'Bảng có thể đổi kích thước',
      desc: 'Kéo thanh bên và bảng ảnh chụp nhanh đến độ rộng bạn muốn. Kích thước được ghi nhớ qua các lần khởi động lại.',
    },
    {
      icon: '🔎',
      title: 'Kiểm tra lệnh',
      desc: 'Tìm hiểu tại sao một lệnh không được tìm thấy — tìm kiếm PATH hiệu lực theo tên hoặc đường dẫn exe và đánh dấu các bản sao bị che khuất.',
    },
    {
      icon: '>_',
      title: 'Giao diện dòng lệnh',
      desc: 'Đọc, xuất và chỉnh sửa biến môi trường từ script. Các lệnh thay đổi mặc định chỉ chạy thử và cần --apply để ghi.',
    },
  ],
  audience: {
    heading: 'Dành cho ai?',
    paragraphs: [
      'Envarly được xây dựng cho các nhà phát triển và người dùng có kinh nghiệm trên Windows 10 và 11, những người thường xuyên chỉnh sửa biến môi trường Người dùng và Hệ thống — và muốn một giải pháp thay thế an toàn hơn, trực quan hơn so với bảng Cài đặt tích hợp sẵn của Windows.',
      'Dù bạn đang dọn dẹp một biến PATH lộn xộn, xoay vòng API key được lưu dưới dạng biến môi trường, nhập baseline .env của nhóm, hay khôi phục ảnh chụp nhanh sau một lần cài đặt lỗi — Envarly cho bạn toàn quyền kiểm soát trước khi bất kỳ điều gì được ghi vào registry.',
    ],
  },
  stack: {
    label: 'Built with',
    items: ['Tauri v2', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'Rust'],
  },
  privacyNote: 'Ứng dụng không thu thập dữ liệu từ xa — yêu cầu mạng duy nhất là kiểm tra phiên bản mới hằng ngày trên GitHub. (Trang web này sử dụng công cụ phân tích truy cập, bản thân ứng dụng thì không.)',
  footer: {
    copyright: '© 2026 Envarly · MIT License',
    releases: 'Bản phát hành',
    license: 'Giấy phép',
  },
};
