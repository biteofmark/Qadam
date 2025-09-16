import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Trophy, Calculator, Atom } from "lucide-react";
import { Link } from "wouter";
import type { Block, Variant } from "@shared/schema";

interface FreeVariant extends Variant {
  block: Block;
  isFree: boolean;
}

export default function PublicHomePage() {
  const { data: freeVariants, isLoading } = useQuery<FreeVariant[]>({
    queryKey: ['/api/public/free-variants'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">ProjectEnt</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Система тестирования ЕНТ</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link href="/auth">
                <Button variant="outline" data-testid="button-login">
                  Вход
                </Button>
              </Link>
              <Link href="/auth">
                <Button data-testid="button-register">
                  Регистрация
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Подготовка к ЕНТ
            <span className="text-blue-600 block">Бесплатно и Эффективно</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Пройдите бесплатные варианты тестов ЕНТ. Система адаптивного тестирования 
            поможет определить ваш уровень знаний и подготовиться к экзамену.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Тысячи пользователей</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
              <Trophy className="h-5 w-5 text-green-600" />
              <span>Высокие результаты</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <span>Актуальные вопросы</span>
            </div>
          </div>
        </div>
      </section>

      {/* Free Tests Section */}
      <section className="py-16 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Бесплатные Тесты
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Попробуйте наши тесты прямо сейчас, без регистрации
            </p>
          </div>

          {!freeVariants || freeVariants.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Бесплатные тесты скоро появятся
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                Мы готовим для вас качественные тестовые варианты
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freeVariants.map((variant) => (
                <Card 
                  key={variant.id} 
                  className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-500"
                  data-testid={`card-variant-${variant.id}`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                          {variant.block.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                          {variant.name}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        БЕСПЛАТНО
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      {variant.block.hasCalculator && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calculator className="h-4 w-4" />
                          <span>Калькулятор включен</span>
                        </div>
                      )}
                      {variant.block.hasPeriodicTable && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <Atom className="h-4 w-4" />
                          <span>Таблица Менделеева</span>
                        </div>
                      )}
                    </div>
                    
                    <Link href={`/public-test/${variant.id}`}>
                      <Button 
                        className="w-full" 
                        data-testid={`button-start-test-${variant.id}`}
                      >
                        Начать тест
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Готовы к более серьезной подготовке?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Зарегистрируйтесь для доступа ко всем тестам, аналитике и рейтингам
          </p>
          <Link href="/auth">
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-blue-600 hover:bg-gray-100"
              data-testid="button-register-cta"
            >
              Зарегистрироваться бесплатно
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">ProjectEnt</span>
          </div>
          <p className="text-sm text-gray-400">
            © 2025 ProjectEnt. Система подготовки к ЕНТ.
          </p>
        </div>
      </footer>
    </div>
  );
}