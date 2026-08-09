export const GITHUB_URL = 'https://github.com/iray-tno/envarly';
export const RELEASE_URL = 'https://github.com/iray-tno/envarly/releases/latest';
export const STORYBOOK_URL = '/envarly/storybook/';
export const REPORTS_URL = '/envarly/reports/';
export const VERSION = '1.6.0';
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
  footer: {
    copyright: string;
    releases: string;
    license: string;
  };
};

export const enCopy: LandingCopy = {
  lang: 'en',
  title: 'Envarly — Windows Environment Variable Manager',
  description: 'A free, open-source GUI for Windows environment variables — safe PATH editing with folder pickers, secret detection, change previews, encrypted snapshots.',
  ogDescription: 'A free, open-source GUI for Windows environment variables — safe PATH editing with folder pickers, secret detection, change previews, encrypted snapshots.',
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
  privacyNote: "No telemetry in the app — its only network call is a daily version check against GitHub. (This website uses analytics; the app doesn't.)",
  footer: {
    copyright: '© 2026 Envarly · MIT License',
    releases: 'Releases',
    license: 'License',
  },
};

export const jaCopy: LandingCopy = {
  lang: 'ja',
  title: 'Envarly — Windows 環境変数マネージャー',
  description: '無料のオープンソースGUIでWindowsの環境変数を安全に編集 — フォルダ選択付きのPATH編集、シークレット検出、変更プレビュー、暗号化スナップショットに対応。',
  ogDescription: '無料のオープンソースGUIでWindowsの環境変数を安全に編集 — フォルダ選択付きのPATH編集、シークレット検出、変更プレビュー、暗号化スナップショットに対応。',
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
  privacyNote: 'アプリ本体にテレメトリはありません — 唯一の通信は GitHub への日次バージョンチェックだけです。(この Web サイトはアクセス解析を使っていますが、アプリ本体は使っていません。)',
  footer: {
    copyright: '© 2026 Envarly · MIT License',
    releases: 'リリース',
    license: 'ライセンス',
  },
};

export const zhCNCopy: LandingCopy = {
  lang: 'zh-CN',
  title: 'Envarly — Windows 环境变量管理器',
  description: '免费开源的 Windows 环境变量图形化编辑工具 — 支持文件夹选择的 PATH 编辑、敏感信息检测、更改预览与加密快照。',
  ogDescription: '免费开源的 Windows 环境变量图形化编辑工具 — 支持文件夹选择的 PATH 编辑、敏感信息检测、更改预览与加密快照。',
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
      icon: '⠿',
      title: '实用的 PATH 编辑器',
      desc: '重新排序条目，通过实时的 ✓ / ✗ 存在性检查逐项校验，在列表和纯文本模式间切换，用键盘在行间移动，并直接选择文件夹 — 全程无需离开编辑器。',
    },
    {
      icon: '⚿',
      title: '敏感信息检测',
      desc: '基于名称的启发式规则和值模式匹配，覆盖 35+ 种令牌格式 — 包括 GitHub、AWS、Anthropic、Stripe、npm 等。',
    },
    {
      icon: '⇄',
      title: '差异检测',
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
  lang: 'ru',
  title: 'Envarly — менеджер переменных окружения Windows',
  description: 'Бесплатный опенсорсный GUI для переменных окружения Windows — безопасное редактирование PATH с выбором папок, обнаружение секретов, предпросмотр изменений, зашифрованные снимки.',
  ogDescription: 'Бесплатный опенсорсный GUI для переменных окружения Windows — безопасное редактирование PATH с выбором папок, обнаружение секретов, предпросмотр изменений, зашифрованные снимки.',
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
      icon: '⠿',
      title: 'Удобный редактор PATH',
      desc: 'Меняйте порядок записей, проверяйте каждую в реальном времени (✓ / ✗ на существование), переключайтесь между списком и обычным текстом, перемещайтесь по строкам с клавиатуры и выбирайте папки — всё, не покидая редактор.',
    },
    {
      icon: '⚿',
      title: 'Обнаружение секретов',
      desc: 'Эвристика по именам и сопоставление по шаблонам значений для более чем 35 форматов токенов — GitHub, AWS, Anthropic, Stripe, npm и другие.',
    },
    {
      icon: '⇄',
      title: 'Обнаружение различий',
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
  lang: 'ko',
  title: 'Envarly — Windows 환경 변수 관리자',
  description: '무료 오픈소스 Windows 환경 변수 GUI — 폴더 선택 지원 PATH 편집, 민감 정보 감지, 변경 미리보기, 암호화된 스냅샷을 제공합니다.',
  ogDescription: '무료 오픈소스 Windows 환경 변수 GUI — 폴더 선택 지원 PATH 편집, 민감 정보 감지, 변경 미리보기, 암호화된 스냅샷을 제공합니다.',
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
      icon: '⠿',
      title: '실용적인 PATH 편집기',
      desc: '항목 순서 변경, 실시간 ✓ / ✗ 존재 여부 검사로 항목별 검증, 목록과 일반 텍스트 전환, 키보드로 행 이동, 폴더 선택까지 — 편집기를 벗어나지 않고 모두 할 수 있습니다.',
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
  lang: 'vi',
  title: 'Envarly — Trình quản lý biến môi trường Windows',
  description: 'GUI miễn phí, mã nguồn mở quản lý biến môi trường Windows — sửa PATH an toàn, phát hiện thông tin nhạy cảm, xem trước thay đổi, ảnh chụp nhanh mã hóa.',
  ogDescription: 'GUI miễn phí, mã nguồn mở quản lý biến môi trường Windows — sửa PATH an toàn, phát hiện thông tin nhạy cảm, xem trước thay đổi, ảnh chụp nhanh mã hóa.',
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
      icon: '⠿',
      title: 'Trình chỉnh sửa PATH thực dụng',
      desc: 'Sắp xếp lại các mục, kiểm tra từng mục bằng dấu ✓ / ✗ theo thời gian thực, chuyển đổi giữa dạng danh sách và văn bản thuần, di chuyển qua các dòng bằng bàn phím, và chọn thư mục — tất cả mà không cần rời khỏi trình chỉnh sửa.',
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
