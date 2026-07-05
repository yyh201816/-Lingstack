/**
 * data-redaction.service.ts — 敏感信息脱敏
 *
 * 对 API Key、密码、私钥、手机号、邮箱、服务器 IP 等做脱敏处理，
 * 确保训练数据不包含可识别的敏感信息。
 *
 * 当前全部在本地执行，不上传云端。
 */

/** 脱敏规则集合 */
const RULES: { name: string; pattern: RegExp; replacement: string | ((m: string) => string) }[] = [
  // OpenAI / 通用 API Key
  { name: 'api_key_sk', pattern: /sk-[a-zA-Z0-9]{32,}/g, replacement: '<API_KEY>' },
  // 通用 API Key（key=xxx / apiKey=xxx）
  { name: 'api_key_param', pattern: /(?:api[_-]?key|apikey|token)\s*[=:]\s*['"]?[a-zA-Z0-9_\-]{16,}['"]?/gi, replacement: '<REDACTED_API_KEY>' },
  // 密码字段
  { name: 'password', pattern: /(?:password|passwd|pwd)\s*[=:]\s*['"]?\S+['"]?/gi, replacement: 'password=<REDACTED>' },
  // 私钥（PEM 格式）
  { name: 'private_key', pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g, replacement: '<PRIVATE_KEY>' },
  // JWT Token
  { name: 'jwt', pattern: /eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}/g, replacement: '<JWT_TOKEN>' },
  // 手机号（中国大陆）
  { name: 'phone_cn', pattern: /1[3-9]\d{9}/g, replacement: '1**********' },
  // 邮箱
  { name: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '<EMAIL>' },
  // 服务器 IPv4 地址
  { name: 'ipv4', pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: (m: string) => {
    // 保留 localhost / 内网
    if (m.startsWith('127.') || m.startsWith('192.168.') || m.startsWith('10.') || m.startsWith('172.16.')) return m
    return '<SERVER_IP>'
  }},
  // AWS Access Key
  { name: 'aws_key', pattern: /AKIA[0-9A-Z]{16}/g, replacement: '<AWS_ACCESS_KEY>' },
  // 数据库连接字符串
  { name: 'db_conn', pattern: /(?:mongodb|mysql|postgres|postgresql|redis):\/\/[^\s]+\@/gi, replacement: '<DB_CONNECTION>' },
]

/**
 * 对文本执行所有脱敏规则
 */
export function redactText(text: string): string {
  if (!text || typeof text !== 'string') return ''
  let result = text
  for (const rule of RULES) {
    result = result.replace(rule.pattern, rule.replacement as string)
  }
  return result
}

/**
 * 对 TrainingSample 的关键字段执行脱敏
 */
export function redactSample(sample: {
  userInput: string
  systemPrompt: string
  modelOutput: string
  finalOutput: string
}): typeof sample {
  return {
    userInput: redactText(sample.userInput),
    systemPrompt: redactText(sample.systemPrompt),
    modelOutput: redactText(sample.modelOutput),
    finalOutput: redactText(sample.finalOutput),
  }
}

/**
 * 检查文本是否包含可疑的敏感信息
 */
export function detectSensitiveContent(text: string): string[] {
  const found: string[] = []
  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      found.push(rule.name)
    }
  }
  return found
}
