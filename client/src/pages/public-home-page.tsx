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
      <header className="bg-blue-800 backdrop-blur-md border-b border-blue-300 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 text-white p-2 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ProjectEnt</h1>
                <p className="text-sm text-blue-100">Система тестирования ЕНТ</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link href="/public-ranking">
                <Button variant="ghost" className="text-white hover:bg-white/10 font-medium" data-testid="button-ranking">
                  Рейтинг
                </Button>
              </Link>
              
              <Link href="/public-tests">
                <Button variant="ghost" className="text-white hover:bg-white/10 font-medium" data-testid="button-tests">
                  Тесты
                </Button>
              </Link>
              
              <Link href="/about">
                <Button variant="ghost" className="text-white hover:bg-white/10 font-medium" data-testid="button-about">
                  О нас
                </Button>
              </Link>
            </div>
            
            <div className="flex space-x-3">
              <Link href="/auth">
                <Button className="bg-white/90 text-blue-800 hover:bg-white border border-white font-medium" data-testid="button-login">
                  Вход
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-20 lg:py-24 h-[75vh] bg-cover bg-center bg-no-repeat relative w-full" style={{backgroundImage: 'url("/12345.jpg")', backgroundSize: '100% auto'}}>
        <div className="container mx-auto px-4 lg:px-6 relative z-10 h-full flex flex-col">
          {/* Text aligned with logo */}
          <div className="text-left pt-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Подготовка к ЕНТ
              <span className="text-blue-200 block">Бесплатно и Эффективно</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl leading-relaxed">
              Пройдите бесплатные варианты тестов ЕНТ. Система адаптивного тестирования 
              поможет определить ваш уровень знаний и подготовиться к экзамену.
            </p>
            
            {/* Button right under text */}
            <div className="text-left">
              <Link href="/auth">
                <Button size="lg" className="bg-blue-800 text-white hover:bg-blue-900 font-medium px-8 py-8 text-lg rounded-lg min-h-[80px]">
                  Зарегистрироваться бесплатно
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Cards */}
      <section className="relative -mt-16 z-20 mb-16">
        <div className="container mx-auto px-8">
          <div className="flex flex-wrap justify-center gap-16 md:gap-24 lg:gap-32">
            <Link href="/public-ranking">
              <div className="w-64 h-48 bg-white shadow-lg rounded-lg flex flex-col items-center justify-center text-center p-6 hover:shadow-xl hover:bg-blue-50 transition-all cursor-pointer">
                <Trophy className="h-12 w-12 text-blue-800 mb-4" />
                <span className="text-gray-800 font-medium">Рейтинг участников</span>
              </div>
            </Link>
            <Link href="/public-tests">
              <div className="w-64 h-48 bg-white shadow-lg rounded-lg flex flex-col items-center justify-center text-center p-6 hover:shadow-xl hover:bg-blue-50 transition-all cursor-pointer">
                <BookOpen className="h-12 w-12 text-blue-800 mb-4" />
                <span className="text-gray-800 font-medium">Тесты</span>
              </div>
            </Link>
            <Link href="/about">
              <div className="w-64 h-48 bg-white shadow-lg rounded-lg flex flex-col items-center justify-center text-center p-6 hover:shadow-xl hover:bg-blue-50 transition-all cursor-pointer">
                <Users className="h-12 w-12 text-blue-800 mb-4" />
                <span className="text-gray-800 font-medium">О нас</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            Готовы к более серьезной подготовке?
          </h2>
          <p className="text-xl mb-8 text-gray-600">
            Зарегистрируйтесь для доступа ко всем тестам, аналитике и рейтингам
          </p>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-blue-800 text-white p-2 rounded-lg">
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