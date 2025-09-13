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

  const { data: blocks, isLoading: blocksLoading } = useQuery<Block[]>({
    queryKey: ["/api/blocks"],
  });

  const { data: profileData } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const stats = {
    completedTests: profileData?.testResults?.length || 0,
    averageScore: profileData?.ranking?.averagePercentage?.toFixed(1) || "0.0",
    ranking: "#" + (profileData?.ranking ? "24" : "N/A"), // Would need actual ranking calculation
    studyTime: "45ч", // Would need actual time tracking
  };

  const recentTests = profileData?.testResults?.slice(-3).reverse() || [];

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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Пройдено тестов</p>
                  <p className="text-2xl font-bold text-foreground">{stats.completedTests}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <i className="fas fa-check-circle text-primary"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Средний балл</p>
                  <p className="text-2xl font-bold text-foreground">{stats.averageScore}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <i className="fas fa-chart-line text-accent"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Место в рейтинге</p>
                  <p className="text-2xl font-bold text-foreground">{stats.ranking}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <i className="fas fa-trophy text-yellow-500"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Время изучения</p>
                  <p className="text-2xl font-bold text-foreground">{stats.studyTime}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <i className="fas fa-clock text-blue-500"></i>
                </div>
              </div>
            </CardContent>
          </Card>
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
                    <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      {block.name.includes('Физика') && <i className="fas fa-atom text-blue-500 text-xl"></i>}
                      {block.name.includes('Химия') && <i className="fas fa-dna text-green-500 text-xl"></i>}
                      {block.name.includes('История') && <i className="fas fa-globe text-yellow-500 text-xl"></i>}
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
                      {block.name.includes('Физика') ? '8 вариантов' : '6 вариантов'}
                    </span>
                    <span className="text-muted-foreground">
                      <i className="fas fa-clock mr-1"></i>
                      240 мин
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Прогресс</span>
                      <span className="text-foreground font-medium">0%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "0%" }}></div>
                    </div>
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

        {/* Recent Activity Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">Последние результаты</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/profile')}
                data-testid="link-view-all-results"
              >
                Посмотреть все
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentTests.length > 0 ? (
                recentTests.map((test, index) => (
                  <div key={test.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <i className="fas fa-atom text-primary"></i>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Тест #{test.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          Пройден {new Date(test.completedAt!).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        test.percentage >= 80 ? 'text-accent' : 
                        test.percentage >= 60 ? 'text-yellow-600' : 'text-destructive'
                      }`}>
                        {test.percentage.toFixed(0)}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {test.score}/{test.totalQuestions} правильных
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Пока нет завершенных тестов</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Начните тестирование, чтобы увидеть свои результаты
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
