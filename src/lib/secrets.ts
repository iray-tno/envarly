export type SecretInfo = {
  service: string; // e.g. "AWS", "GitHub", "Database", "Generic"
  label: string; // e.g. "AWS credentials", "GitHub token"
};

// ── Name-based detection ────────────────────────────────────────────────────

// Exact name → known service (highest priority)
const EXACT: Record<string, SecretInfo> = {
  AWS_ACCESS_KEY_ID: { service: "AWS", label: "AWS Access Key" },
  AWS_SECRET_ACCESS_KEY: { service: "AWS", label: "AWS Secret Key" },
  AWS_SESSION_TOKEN: { service: "AWS", label: "AWS Session Token" },
  GITHUB_TOKEN: { service: "GitHub", label: "GitHub Token" },
  GH_TOKEN: { service: "GitHub", label: "GitHub Token" },
  GITLAB_TOKEN: { service: "GitLab", label: "GitLab Token" },
  NPM_TOKEN: { service: "npm", label: "npm Token" },
  NPM_AUTH_TOKEN: { service: "npm", label: "npm Token" },
  OPENAI_API_KEY: { service: "OpenAI", label: "OpenAI API Key" },
  ANTHROPIC_API_KEY: { service: "Anthropic", label: "Anthropic API Key" },
  GEMINI_API_KEY: { service: "Google", label: "Gemini API Key" },
  GOOGLE_API_KEY: { service: "Google", label: "Google API Key" },
  STRIPE_SECRET_KEY: { service: "Stripe", label: "Stripe Secret Key" },
  STRIPE_PUBLISHABLE_KEY: { service: "Stripe", label: "Stripe Publishable Key" },
  SLACK_TOKEN: { service: "Slack", label: "Slack Token" },
  SLACK_BOT_TOKEN: { service: "Slack", label: "Slack Bot Token" },
  DISCORD_TOKEN: { service: "Discord", label: "Discord Token" },
  DATABASE_URL: { service: "Database", label: "Database URL" },
  DB_PASSWORD: { service: "Database", label: "Database Password" },
  DB_URL: { service: "Database", label: "Database URL" },
  REDIS_URL: { service: "Database", label: "Redis URL" },
  MONGO_URL: { service: "Database", label: "MongoDB URL" },
  MONGODB_URI: { service: "Database", label: "MongoDB URI" },
  SENTRY_DSN: { service: "Sentry", label: "Sentry DSN" },
};

// Service prefix → service info (only matched when remainder contains a secret keyword)
const SERVICE_PREFIXES: Array<{ prefix: string } & SecretInfo> = [
  { prefix: "AWS_", service: "AWS", label: "AWS credentials" },
  { prefix: "GITHUB_", service: "GitHub", label: "GitHub credentials" },
  { prefix: "GH_", service: "GitHub", label: "GitHub credentials" },
  { prefix: "GITLAB_", service: "GitLab", label: "GitLab credentials" },
  { prefix: "GOOGLE_", service: "Google", label: "Google credentials" },
  { prefix: "GCP_", service: "Google Cloud", label: "GCP credentials" },
  { prefix: "GCLOUD_", service: "Google Cloud", label: "GCP credentials" },
  { prefix: "AZURE_", service: "Azure", label: "Azure credentials" },
  { prefix: "OPENAI_", service: "OpenAI", label: "OpenAI credentials" },
  { prefix: "ANTHROPIC_", service: "Anthropic", label: "Anthropic credentials" },
  { prefix: "STRIPE_", service: "Stripe", label: "Stripe credentials" },
  { prefix: "SLACK_", service: "Slack", label: "Slack credentials" },
  { prefix: "DISCORD_", service: "Discord", label: "Discord credentials" },
  { prefix: "TWILIO_", service: "Twilio", label: "Twilio credentials" },
  { prefix: "SENDGRID_", service: "SendGrid", label: "SendGrid credentials" },
  { prefix: "DATADOG_", service: "Datadog", label: "Datadog credentials" },
  { prefix: "SENTRY_", service: "Sentry", label: "Sentry credentials" },
  { prefix: "CLOUDFLARE_", service: "Cloudflare", label: "Cloudflare credentials" },
  { prefix: "VERCEL_", service: "Vercel", label: "Vercel credentials" },
  { prefix: "HEROKU_", service: "Heroku", label: "Heroku credentials" },
  { prefix: "DOCKER_", service: "Docker", label: "Docker credentials" },
  { prefix: "NPM_", service: "npm", label: "npm credentials" },
  { prefix: "DATABASE_", service: "Database", label: "Database credentials" },
  { prefix: "DB_", service: "Database", label: "Database credentials" },
  { prefix: "POSTGRES_", service: "Database", label: "PostgreSQL credentials" },
  { prefix: "MYSQL_", service: "Database", label: "MySQL credentials" },
  { prefix: "MONGODB_", service: "Database", label: "MongoDB credentials" },
  { prefix: "REDIS_", service: "Database", label: "Redis credentials" },
];

const SECRET_KEYWORDS = [
  "SECRET",
  "TOKEN",
  "PASSWORD",
  "PASSWD",
  "API_KEY",
  "APIKEY",
  "PRIVATE_KEY",
  "ACCESS_KEY",
  "AUTH_KEY",
  "SIGNING_KEY",
  "CREDENTIAL",
  "WEBHOOK",
  "DSN",
  "AUTH_TOKEN",
];

// ── Value-based detection (structured token patterns) ───────────────────────
//
// Many services now embed the service identity in the token prefix itself.
// These patterns match the token VALUE regardless of what the variable is named,
// so `MY_KEY=ghp_xxx` is still detected as a GitHub token.

const VALUE_PATTERNS: Array<{ regex: RegExp } & SecretInfo> = [
  // GitHub — https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github
  { regex: /^ghp_[A-Za-z0-9_]{20,}$/, service: "GitHub", label: "GitHub Personal Access Token" },
  { regex: /^gho_[A-Za-z0-9_]{20,}$/, service: "GitHub", label: "GitHub OAuth Token" },
  { regex: /^ghs_[A-Za-z0-9_]{20,}$/, service: "GitHub", label: "GitHub Actions Secret" },
  { regex: /^ghr_[A-Za-z0-9_]{20,}$/, service: "GitHub", label: "GitHub Refresh Token" },
  { regex: /^github_pat_[A-Za-z0-9_]{20,}$/, service: "GitHub", label: "GitHub Fine-Grained PAT" },

  // GitLab — https://docs.gitlab.com/ee/security/token_overview.html
  { regex: /^glpat-[A-Za-z0-9_-]{20,}$/, service: "GitLab", label: "GitLab Personal Access Token" },
  { regex: /^gloas-[A-Za-z0-9_-]{20,}$/, service: "GitLab", label: "GitLab OAuth App Secret" },
  { regex: /^glcbt-[A-Za-z0-9_-]{20,}$/, service: "GitLab", label: "GitLab CI Build Token" },
  { regex: /^glptt-[A-Za-z0-9_-]{20,}$/, service: "GitLab", label: "GitLab Trigger Token" },
  { regex: /^glagent-[A-Za-z0-9_-]{20,}$/, service: "GitLab", label: "GitLab Agent Token" },
  { regex: /^glft-[A-Za-z0-9_-]{20,}$/, service: "GitLab", label: "GitLab Feature Flag Token" },

  // Slack — https://api.slack.com/authentication/token-types
  { regex: /^xoxb-[A-Za-z0-9-]{30,}$/, service: "Slack", label: "Slack Bot Token" },
  { regex: /^xoxp-[A-Za-z0-9-]{60,}$/, service: "Slack", label: "Slack User Token" },
  { regex: /^xapp-[A-Za-z0-9_-]{50,}$/, service: "Slack", label: "Slack App-Level Token" },
  { regex: /^xoxa-[A-Za-z0-9_-]{50,}$/, service: "Slack", label: "Slack OAuth Token" },
  { regex: /^xoxr-[A-Za-z0-9_-]{50,}$/, service: "Slack", label: "Slack Refresh Token" },

  // Anthropic
  { regex: /^sk-ant-[A-Za-z0-9_-]{30,}$/, service: "Anthropic", label: "Anthropic API Key" },

  // OpenAI
  { regex: /^sk-proj-[A-Za-z0-9_-]{30,}$/, service: "OpenAI", label: "OpenAI Project API Key" },
  // Legacy format: exactly sk- + 48 alphanumeric chars (51 total)
  { regex: /^sk-[A-Za-z0-9]{48}$/, service: "OpenAI", label: "OpenAI API Key" },

  // Stripe — https://docs.stripe.com/keys
  { regex: /^sk_live_[A-Za-z0-9]{24,}$/, service: "Stripe", label: "Stripe Live Secret Key" },
  { regex: /^sk_test_[A-Za-z0-9]{24,}$/, service: "Stripe", label: "Stripe Test Secret Key" },
  { regex: /^rk_live_[A-Za-z0-9]{24,}$/, service: "Stripe", label: "Stripe Live Restricted Key" },
  { regex: /^rk_test_[A-Za-z0-9]{24,}$/, service: "Stripe", label: "Stripe Test Restricted Key" },

  // AWS — access key IDs have a 4-char service prefix + 16 uppercase alphanumeric
  // AKIA=long-term, ASIA=STS temporary, AROA=role, AIDA=user, AIPA=instance profile, ANPA=managed policy
  {
    regex: /^(AKIA|ASIA|AROA|AIDA|AIPA|ANPA|ANVA|APKA)[A-Z0-9]{16}$/,
    service: "AWS",
    label: "AWS Access Key ID",
  },

  // Google Cloud — OAuth short-lived access tokens (ya29. prefix)
  {
    regex: /^ya29\.[A-Za-z0-9_-]{100,}$/,
    service: "Google Cloud",
    label: "GCP OAuth Access Token",
  },

  // npm — granular access tokens introduced 2022
  { regex: /^npm_[A-Za-z0-9]{36,}$/, service: "npm", label: "npm Granular Access Token" },

  // PyPI — https://pypi.org/help/#apitoken
  { regex: /^pypi-[A-Za-z0-9_-]{32,}$/, service: "PyPI", label: "PyPI API Token" },

  // HuggingFace
  { regex: /^hf_[A-Za-z0-9]{30,}$/, service: "HuggingFace", label: "HuggingFace API Token" },

  // Databricks
  { regex: /^dapi[a-z0-9]{32}$/, service: "Databricks", label: "Databricks Personal Access Token" },

  // HashiCorp Vault — https://developer.hashicorp.com/vault/docs/concepts/tokens
  { regex: /^hvs\.[A-Za-z0-9_-]{80,}$/, service: "HashiCorp Vault", label: "Vault Service Token" },
  { regex: /^hvb\.[A-Za-z0-9_-]{80,}$/, service: "HashiCorp Vault", label: "Vault Batch Token" },
  { regex: /^hvr\.[A-Za-z0-9_-]{80,}$/, service: "HashiCorp Vault", label: "Vault Recovery Token" },

  // SendGrid — format: SG. + 22 chars + . + 43 chars
  {
    regex: /^SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}$/,
    service: "SendGrid",
    label: "SendGrid API Key",
  },

  // Shopify — https://shopify.dev/docs/apps/build/authentication-authorization
  { regex: /^shpat_[A-Za-z0-9]{32,}$/, service: "Shopify", label: "Shopify Admin API Token" },
  { regex: /^shpss_[A-Za-z0-9]{32,}$/, service: "Shopify", label: "Shopify Shared Secret" },
  { regex: /^shppa_[A-Za-z0-9]{32,}$/, service: "Shopify", label: "Shopify Partner API Token" },
  { regex: /^shpca_[A-Za-z0-9]{32,}$/, service: "Shopify", label: "Shopify Custom App Token" },

  // PlanetScale
  { regex: /^pscale_tkn_[A-Za-z0-9_]{32,}$/, service: "PlanetScale", label: "PlanetScale Token" },
];

export function detectSecretByValue(value: string): SecretInfo | null {
  // Short values are never meaningful tokens; skip for performance
  if (value.length < 10) return null;
  for (const { regex, service, label } of VALUE_PATTERNS) {
    if (regex.test(value)) return { service, label };
  }
  return null;
}

// ── Combined API ─────────────────────────────────────────────────────────────

/** Name-based detection only. Use resolveSecret when the value is also available. */
export function detectSecret(name: string): SecretInfo | null {
  const upper = name.toUpperCase();

  if (EXACT[upper]) return EXACT[upper];

  for (const { prefix, service, label } of SERVICE_PREFIXES) {
    if (upper.startsWith(prefix)) {
      const rest = upper.slice(prefix.length);
      if (SECRET_KEYWORDS.some((kw) => rest.includes(kw))) {
        return { service, label };
      }
    }
  }

  if (SECRET_KEYWORDS.some((kw) => upper.includes(kw))) {
    return { service: "Generic", label: "Secret value" };
  }

  return null;
}

/** Name first, then value pattern. Prefer this when both are available. */
export function resolveSecret(name: string, value: string): SecretInfo | null {
  return detectSecret(name) ?? detectSecretByValue(value);
}

export function isSecretVar(name: string): boolean {
  return detectSecret(name) !== null;
}
