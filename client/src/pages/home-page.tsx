import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import type { Block, TestResult, UserRanking } from "@shared/schema";

interface ProfileData {
  user: any;
  testResults: TestResult[];
  ranking: UserRanking;
  subjectProgress: any[];
}

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: blocks, isLoading: blocksLoading } = useQuery<(Block & { variantCount: number; totalQuestions: number })[]>({
    queryKey: ["/api/public/blocks"],
  });

  const { data: profileData } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });



  if (blocksLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 lg:px-6 py-8">
          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 lg:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Добро пожаловать, <span className="text-primary">{user?.username}</span>!
          </h1>
          <p className="text-muted-foreground">
            Выберите блок тестов для начала подготовки к ЕНТ
          </p>
        </div>



        {/* Test Blocks Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Блоки тестирования</h2>
            <Button variant="outline" size="sm">
              <i className="fas fa-filter mr-2"></i>
              Фильтр
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blocks?.map((block) => (
              <Card 
                key={block.id} 
                className="group hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => setLocation(`/block/${block.id}`)}
                data-testid={`card-block-${block.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-800/10 flex items-center justify-center">
                      {block.name.includes('Физика') && <i className="fas fa-atom text-blue-800 text-xl"></i>}
                      {block.name.includes('Химия') && <i className="fas fa-dna text-blue-800 text-xl"></i>}
                      {block.name.includes('История') && <i className="fas fa-globe text-blue-800 text-xl"></i>}
                    </div>
                    <div className="flex items-center space-x-1">
                      {block.hasCalculator && (
                        <i className="fas fa-calculator text-muted-foreground text-sm" title="Калькулятор доступен"></i>
                      )}
                      {block.hasPeriodicTable && (
                        <i className="fas fa-table text-muted-foreground text-sm" title="Таблица Менделеева доступна"></i>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {block.name}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    {block.name.includes('Физика') && "Комплексная подготовка по физике и математике с углубленным изучением ключевых тем"}
                    {block.name.includes('Химия') && "Интенсивная подготовка по химии и биологии для поступления в медицинские вузы"}
                    {block.name.includes('История') && "Комплексная подготовка по истории Казахстана и географии"}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-muted-foreground">
                      <i className="fas fa-file-alt mr-1"></i>
                      {block.variantCount} {block.variantCount === 1 ? 'вариант' : block.variantCount < 5 ? 'варианта' : 'вариантов'}
                    </span>
                    <span className="text-muted-foreground">
                      <i className="fas fa-clock mr-1"></i>
                      240 мин
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Начните тестирование</span>
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/block/${block.id}`);
                      }}
                      data-testid={`button-start-${block.id}`}
                    >
                      Начать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) || []}
          </div>
        </div>


      </main>
      <Footer />
    </div>
  );
}
