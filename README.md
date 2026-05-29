# EdgeProxy 🌐

Быстрый Edge Serverless прокси на базе Vercel Edge Functions. Позволяет обходить региональные блокировки, проксируя запросы через европейские серверы.

![EdgeProxy](https://img.shields.io/badge/Edge-Serverless-blue)
![Vercel](https://img.shields.io/badge/Vercel-Edge%20Functions-black)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Возможности

- 🚀 **Edge Serverless** — запросы обрабатываются на Edge-серверах Vercel в Европе
- ⚡ **Быстрая скорость** — минимальная задержка благодаря Edge Runtime
- 🔒 **Приватность** — без логирования и отслеживания
- 🌍 **Обход блокировок** — доступ к заблокированным ресурсам через европейские IP
- 📡 **Поддержка всех методов** — GET, POST, PUT, DELETE
- 🔄 **Автоматическое переписывание URL** — корректная работа с относительными ссылками

## 🚀 Быстрый старт

### Деплой на Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/edge-proxy)

### Локальная разработка

```bash
# Клонирование репозитория
git clone https://github.com/yourusername/edge-proxy.git
cd edge-proxy

# Установка зависимостей
pnpm install

# Запуск dev сервера
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📖 Использование

### Через веб-интерфейс

1. Откройте главную страницу прокси
2. Введите URL сайта в поле ввода
3. Нажмите "Открыть" или скопируйте сгенерированную ссылку

### Прямой URL

Формат: `https://your-domain.vercel.app/proxy/{encoded-url}`

```
# Простой домен
https://your-domain.vercel.app/proxy/example.com

# С путём (замените / на -SLASH-)
https://your-domain.vercel.app/proxy/github.com-SLASH-vercel-SLASH-next.js
```

### API для разработчиков

#### JavaScript

```javascript
// Функция для создания прокси URL
function createProxyUrl(targetUrl, proxyBase = "https://your-domain.vercel.app") {
  const cleanUrl = targetUrl
    .replace(/^https?:\/\//, "")
    .replace(/\//g, "-SLASH-");
  return `${proxyBase}/proxy/${cleanUrl}`;
}

// Использование
const proxyUrl = createProxyUrl("https://api.example.com/data");
const response = await fetch(proxyUrl);
const data = await response.json();
```

#### Python

```python
import requests

def create_proxy_url(target_url, proxy_base="https://your-domain.vercel.app"):
    clean_url = target_url.replace("https://", "").replace("http://", "")
    clean_url = clean_url.replace("/", "-SLASH-")
    return f"{proxy_base}/proxy/{clean_url}"

# Использование
proxy_url = create_proxy_url("https://api.example.com/data")
response = requests.get(proxy_url)
data = response.json()
```

#### cURL

```bash
# Простой запрос
curl https://your-domain.vercel.app/proxy/example.com

# С путём
curl https://your-domain.vercel.app/proxy/api.example.com-SLASH-v1-SLASH-users

# POST запрос
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}' \
  https://your-domain.vercel.app/proxy/api.example.com-SLASH-data
```

## 🔧 Конфигурация

### Регионы Edge

По умолчанию прокси использует европейские регионы:

```typescript
// app/proxy/[...path]/route.ts
export const preferredRegion = ["fra1", "cdg1", "ams1"]
```

Доступные регионы:
- `fra1` — Frankfurt, Germany
- `cdg1` — Paris, France
- `ams1` — Amsterdam, Netherlands
- `lhr1` — London, UK
- `iad1` — Washington, D.C., USA
- и другие...

### Переменные окружения

Опционально можно настроить:

```env
# Лимит размера запроса (по умолчанию 4MB)
MAX_REQUEST_SIZE=4194304

# Таймаут запроса в мс (по умолчанию 30000)
REQUEST_TIMEOUT=30000
```

## 📁 Структура проекта

```
edge-proxy/
├── app/
│   ├── page.tsx              # Главная страница с документацией
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Глобальные стили
│   └── proxy/
│       └── [...path]/
│           └── route.ts      # Edge proxy route handler
├── components/
│   └── ui/                   # shadcn/ui компоненты
├── lib/
│   └── utils.ts              # Утилиты
├── public/                   # Статические файлы
├── package.json
├── tailwind.config.ts
└── README.md
```

## ⚠️ Ограничения

- **WebSocket** — не поддерживается
- **Размер ответа** — ограничен настройками Edge Runtime (~4MB)
- **Cookies** — могут работать некорректно на некоторых сайтах
- **JavaScript SPA** — могут работать с ограничениями
- **Некоторые сайты** — могут блокировать прокси-запросы

## 🛡️ Безопасность

- Прокси не сохраняет логи посещений
- Все запросы обрабатываются в памяти Edge Runtime
- CORS заголовки настроены для максимальной совместимости
- Удаляются потенциально опасные заголовки безопасности

## 📄 Лицензия

MIT License — используйте свободно, но ответственно.

## ⚖️ Отказ от ответственности

Этот проект предоставляется "как есть" без каких-либо гарантий. Используйте его ответственно и в соответствии с законодательством вашей страны. Авторы не несут ответственности за любое незаконное использование данного программного обеспечения.

---

Сделано с ❤️ используя [Next.js](https://nextjs.org), [Vercel Edge Functions](https://vercel.com/features/edge-functions) и [shadcn/ui](https://ui.shadcn.com)
