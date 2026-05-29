"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, Shield, Zap, Copy, Check, ArrowRight, Server, Code, BookOpen } from "lucide-react"

export default function ProxyLandingPage() {
  const [url, setUrl] = useState("")
  const [copied, setCopied] = useState<string | null>(null)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.vercel.app"

  const generateProxyUrl = (targetUrl: string) => {
    if (!targetUrl) return ""
    const cleanUrl = targetUrl
      .replace(/^https?:\/\//, "")
      .replace(/\//g, "-SLASH-")
    return `${baseUrl}/proxy/${cleanUrl}`
  }

  const proxyUrl = generateProxyUrl(url)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const examples = [
    { name: "Lovable App", url: "flexai-ru.lovable.app" },
    { name: "GitHub", url: "github.com" },
    { name: "Vercel Docs", url: "vercel.com/docs" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">EdgeProxy</span>
          </div>
          <nav className="flex items-center gap-4">
            <a href="#docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Документация
            </a>
            <a href="#api" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              API
            </a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <Zap className="h-4 w-4" />
              Edge Serverless Proxy
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Открывайте любые сайты
              <span className="text-primary"> без ограничений</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Быстрый Edge-прокси работающий через европейские серверы Vercel. 
              Обходите блокировки и получайте доступ к любым ресурсам.
            </p>

            {/* URL Generator */}
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-left">Генератор прокси-ссылки</CardTitle>
                <CardDescription className="text-left">
                  Введите URL сайта, который хотите открыть через прокси
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="example.com или https://example.com/page"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => url && window.open(proxyUrl, "_blank")}
                    disabled={!url}
                  >
                    Открыть
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                {proxyUrl && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-sm break-all text-left">{proxyUrl}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(proxyUrl, "main")}
                      >
                        {copied === "main" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Преимущества</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Server className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Edge Serverless</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Запросы обрабатываются на Edge-серверах Vercel в Европе, 
                    обеспечивая минимальную задержку и обход региональных блокировок.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Zap className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Быстрая скорость</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Оптимизированная обработка запросов без лишних задержек. 
                    Поддержка потоковой передачи данных для больших файлов.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Приватность</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Мы не сохраняем логи посещений и не отслеживаем вашу активность. 
                    Полная анонимность при работе с сайтами.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Documentation */}
        <section id="docs" className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <BookOpen className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">Документация</h2>
            </div>

            <div className="space-y-8">
              {/* How to use */}
              <Card>
                <CardHeader>
                  <CardTitle>Как использовать</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Способ 1: Генератор ссылок</h4>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Введите URL сайта в поле выше</li>
                      <li>Нажмите &quot;Открыть&quot; или скопируйте сгенерированную ссылку</li>
                      <li>Сайт откроется через европейский прокси-сервер</li>
                    </ol>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Способ 2: Прямой URL</h4>
                    <p className="text-muted-foreground">
                      Добавьте домен сайта после <code className="bg-muted px-1.5 py-0.5 rounded">/proxy/</code>:
                    </p>
                    <div className="bg-muted p-3 rounded-lg">
                      <code className="text-sm">{baseUrl}/proxy/example.com</code>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Для страниц с путями</h4>
                    <p className="text-muted-foreground">
                      Замените <code className="bg-muted px-1.5 py-0.5 rounded">/</code> на <code className="bg-muted px-1.5 py-0.5 rounded">-SLASH-</code>:
                    </p>
                    <div className="bg-muted p-3 rounded-lg space-y-2">
                      <div>
                        <span className="text-muted-foreground text-sm">Оригинал:</span>
                        <code className="text-sm ml-2">github.com/vercel/next.js</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Прокси:</span>
                        <code className="text-sm ml-2">{baseUrl}/proxy/github.com-SLASH-vercel-SLASH-next.js</code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Examples */}
              <Card>
                <CardHeader>
                  <CardTitle>Примеры</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {examples.map((example) => {
                      const exampleProxyUrl = `${baseUrl}/proxy/${example.url.replace(/\//g, "-SLASH-")}`
                      return (
                        <div key={example.url} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{example.name}</p>
                            <code className="text-sm text-muted-foreground">{example.url}</code>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(exampleProxyUrl, example.url)}
                            >
                              {copied === example.url ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(exampleProxyUrl, "_blank")}
                            >
                              Открыть
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* API */}
              <Card id="api">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    <CardTitle>API для разработчиков</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Формат запроса</h4>
                    <div className="bg-zinc-950 text-zinc-50 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">
{`GET /proxy/{encoded-url}

Параметры:
  {encoded-url} - URL сайта с заменой / на -SLASH-

Примеры:
  /proxy/example.com
  /proxy/api.example.com-SLASH-v1-SLASH-data`}
                      </pre>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Пример на JavaScript</h4>
                    <div className="bg-zinc-950 text-zinc-50 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">
{`// Функция для создания прокси URL
function createProxyUrl(targetUrl) {
  const baseUrl = "${baseUrl}";
  const cleanUrl = targetUrl
    .replace(/^https?:\\/\\//, "")
    .replace(/\\//g, "-SLASH-");
  return \`\${baseUrl}/proxy/\${cleanUrl}\`;
}

// Использование
const proxyUrl = createProxyUrl("https://api.example.com/data");
const response = await fetch(proxyUrl);
const data = await response.json();`}
                      </pre>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Заголовки</h4>
                    <p className="text-muted-foreground">
                      Прокси автоматически пробрасывает большинство заголовков, включая:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Content-Type</li>
                      <li>Authorization</li>
                      <li>Accept</li>
                      <li>User-Agent</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Limitations */}
              <Card>
                <CardHeader>
                  <CardTitle>Ограничения</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Некоторые сайты могут блокировать прокси-запросы</li>
                    <li>WebSocket соединения не поддерживаются</li>
                    <li>Максимальный размер ответа ограничен настройками Edge Runtime</li>
                    <li>Cookies могут работать некорректно на некоторых сайтах</li>
                    <li>JavaScript-heavy SPA могут работать с ограничениями</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>EdgeProxy — бесплатный Edge Serverless прокси на базе Vercel</p>
          <p className="text-sm mt-2">
            Используйте ответственно. Не предназначен для незаконной деятельности.
          </p>
        </div>
      </footer>
    </div>
  )
}
