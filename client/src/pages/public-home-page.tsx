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
      <header className="bg-blue-500 backdrop-blur-md border-b border-blue-700 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 text-white p-2 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ProjectEnt</h1>
                <p className="text-sm text-blue-50">ҰБТ тестілеу жүйесі</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/public-ranking">
                <Button variant="ghost" className="text-white hover:bg-white/10 font-medium" data-testid="button-ranking">
                  Рейтинг
                </Button>
              </Link>
              
              <Link href="/public-tests">
                <Button variant="ghost" className="text-white hover:bg-white/10 font-medium" data-testid="button-tests">
                  Тесттер
                </Button>
              </Link>
              
              <Link href="/about">
                <Button variant="ghost" className="text-white hover:bg-white/10 font-medium" data-testid="button-about">
                  Біз туралы
                </Button>
              </Link>
            </div>
            
            <div className="flex space-x-2 md:space-x-3">
              <Link href="/auth">
                <Button className="bg-white/90 text-blue-500 hover:bg-white border border-white font-medium text-sm md:text-base px-3 md:px-4" data-testid="button-login">
                  Кіру
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-20 lg:py-24 min-h-[70vh] relative w-full">
        {/* Background with glass effect */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url("/1123.png")'}}></div>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-blue-700/30"></div>
        
        <div className="container mx-auto px-4 lg:px-6 relative z-20 h-full flex flex-col">
          {/* Text aligned with logo */}
          <div className="text-center md:text-left pt-8 md:pt-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight">
              ҰБТ-ға дайындық
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-50 mb-6 md:mb-8 max-w-2xl leading-relaxed mx-auto md:mx-0">
              ҰБТ тесттерінің тегін нұсқаларын тапсырыңыз. Бейімделгіш тестілеу жүйесі 
              сіздің білім деңгейіңізді анықтап, емтиханға дайындалуға көмектеседі.
            </p>
            
            {/* Button right under text */}
            <div className="text-center md:text-left">
              <Link href="/auth">
                <Button size="lg" className="bg-blue-500 text-white hover:bg-blue-700 font-medium px-6 md:px-8 py-6 md:py-8 text-base md:text-lg rounded-lg min-h-[60px] md:min-h-[80px] w-full sm:w-auto">
                  Тегін тіркелу
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Cards */}
      <section className="relative -mt-8 md:-mt-16 z-20 mb-8 md:mb-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12 max-w-6xl mx-auto">
            <Link href="/public-ranking">
              <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 hover:shadow-xl hover:bg-blue-50 transition-all cursor-pointer min-h-[200px] md:min-h-[224px]">
                <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                  <Trophy className="h-8 w-8 md:h-12 md:w-12 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-800 font-semibold text-xl md:text-2xl lg:text-3xl">Рейтингтер</span>
                </div>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                  Барлық қатысушылардың рейтингін көріп, студенттер арасындағы өз орныңызды біліңіз.
                </p>
              </div>
            </Link>
            <Link href="/public-tests">
              <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 hover:shadow-xl hover:bg-blue-50 transition-all cursor-pointer min-h-[200px] md:min-h-[224px]">
                <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                  <BookOpen className="h-8 w-8 md:h-12 md:w-12 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-800 font-semibold text-xl md:text-2xl lg:text-3xl">Тесттер</span>
                </div>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                  Әртүрлі пәндер бойынша тесттерден өтіп, толық нәтижелер мен талдауды алыңыз.
                </p>
              </div>
            </Link>
            <Link href="/about">
              <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 hover:shadow-xl hover:bg-blue-50 transition-all cursor-pointer min-h-[200px] md:min-h-[224px]">
                <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                  <Users className="h-8 w-8 md:h-12 md:w-12 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-800 font-semibold text-xl md:text-2xl lg:text-3xl">Біз туралы</span>
                </div>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                  Онлайн тестілеу және студенттерді білімдендіру платформамыз туралы көбірек біліңіз.
                </p>
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
            <div className="bg-blue-500 text-white p-2 rounded-lg">
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
