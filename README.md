# EdgeProxy

Быстрый Edge Serverless прокси на базе Vercel Edge Functions. Позволяет обходить региональные блокировки, проксируя запросы через европейские серверы.

![EdgeProxy](https://img.shields.io/badge/Edge-Serverless-blue)
![Vercel](https://img.shields.io/badge/Vercel-Edge%20Functions-black)
![License](https://img.shields.io/badge/License-MIT-green)

## Возможности

- **Edge Serverless** - запросы обрабатываются на Edge-серверах Vercel в Европе (Frankfurt, Paris, Amsterdam)
- **Быстрая скорость** - минимальная задержка благодаря Edge Runtime
- **Приватность** - без логирования и отслеживания
- **Обход блокировок** - доступ к заблокированным ресурсам через европейские IP
- **Поддержка всех методов** - GET, POST, PUT, DELETE, HEAD
- **Автоматическое переписывание URL** - корректная работа с относительными ссылками в HTML/CSS
- **Перехват fetch/XHR** - JavaScript запросы также проходят через прокси

## Быстрый старт

### Деплой на Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/OinkTechLtd/v0-edge-serverless-proxy)

### Локальная разработка

```bash
# Клонирование репозитория
git clone https://github.com/OinkTechLtd/v0-edge-serverless-proxy.git
cd v0-edge-serverless-proxy

# Установка зависимостей
pnpm install

# Запуск dev сервера
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Использование

### Через веб-интерфейс

1. Откройте главную страницу прокси
2. Введите URL сайта в поле ввода
3. Нажмите "Открыть" или скопируйте сгенерированную ссылку

### Прямой URL

Формат: `https://your-proxy.vercel.app/proxy/{domain}/{path}`

```
# Простой домен
https://your-proxy.vercel.app/proxy/example.com

# С путём
https://your-proxy.vercel.app/proxy/github.com/vercel/next.js

# С query параметрами
https://your-proxy.vercel.app/proxy/api.site.com/v1/data?key=123
```

### API для разработчиков

#### JavaScript

```javascript
// Функция для создания прокси URL
function createProxyUrl(targetUrl, proxyBase = "https://your-proxy.vercel.app") {
  const cleanUrl = targetUrl.replace(/^https?:\/\//, "");
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

def create_proxy_url(target_url, proxy_base="https://your-proxy.vercel.app"):
    clean_url = target_url.replace("https://", "").replace("http://", "")
    return f"{proxy_base}/proxy/{clean_url}"

# Использование
proxy_url = create_proxy_url("https://api.example.com/data")
response = requests.get(proxy_url)
data = response.json()
```

#### cURL

```bash
# Простой запрос
curl "https://your-proxy.vercel.app/proxy/example.com"

# С путём
curl "https://your-proxy.vercel.app/proxy/api.example.com/v1/users"

# POST запрос
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}' \
  "https://your-proxy.vercel.app/proxy/api.example.com/data"
```

## Конфигурация

### Регионы Edge

По умолчанию прокси использует европейские регионы:

```typescript
// app/proxy/[...path]/route.ts
export const preferredRegion = ["fra1", "cdg1", "ams1"]
```

Доступные регионы:
- `fra1` - Frankfurt, Germany
- `cdg1` - Paris, France
- `ams1` - Amsterdam, Netherlands
- `lhr1` - London, UK
- `iad1` - Washington, D.C., USA

## Структура проекта

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
└── README.md
```

## Как это работает

1. **Получение запроса** - Edge Function получает запрос с закодированным URL
2. **Формирование целевого URL** - Путь преобразуется в полный URL целевого сайта
3. **Проксирование** - Запрос отправляется к целевому серверу из европейского региона
4. **Обработка ответа**:
   - HTML: переписываются ссылки, инъектируется скрипт для перехвата fetch/XHR
   - CSS: переписываются url() ссылки
   - Другое: передается как есть
5. **Возврат** - Ответ возвращается клиенту с необходимыми CORS заголовками

## Ограничения

- **WebSocket** - не поддерживается
- **Размер ответа** - ограничен Edge Runtime (~4MB)
- **Cookies** - привязаны к домену прокси
- **JavaScript SPA** - могут работать с ограничениями
- **Некоторые сайты** - могут блокировать прокси-запросы (CloudFlare, Captcha)

## Безопасность

- Прокси не сохраняет логи посещений
- Все запросы обрабатываются в памяти Edge Runtime
- CORS заголовки настроены для максимальной совместимости
- Удаляются заголовки X-Frame-Options, CSP для корректной работы

## Лицензия

MIT License

## Отказ от ответственности

Этот проект предоставляется "как есть" без каких-либо гарантий. Используйте его ответственно и в соответствии с законодательством вашей страны. Авторы не несут ответственности за любое незаконное использование данного программного обеспечения.

---

Сделано с использованием [Next.js](https://nextjs.org), [Vercel Edge Functions](https://vercel.com/features/edge-functions) и [shadcn/ui](https://ui.shadcn.com)
