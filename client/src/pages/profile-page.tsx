import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProfileData {
  user: any;
  testResults: any[];
  ranking: any;
  subjectProgress: any[];
}

export default function ProfilePage() {
  const { user } = useAuth();

  const { data: profileData, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 lg:px-6 py-8">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  const stats = {
    testsCompleted: profileData?.testResults?.length || 0,
    averageScore: profileData?.ranking?.averagePercentage?.toFixed(1) || "0.0",
    totalScore: profileData?.ranking?.totalScore || 0,
    ranking: "#24", // Would calculate actual ranking
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 lg:px-6 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-6">
                <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-foreground">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground mb-2">{user?.username}</h1>
                  <p className="text-muted-foreground mb-4">
                    Участник с {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-foreground">{stats.testsCompleted}</div>
                      <div className="text-xs text-muted-foreground">Тестов пройдено</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-foreground">{stats.averageScore}%</div>
                      <div className="text-xs text-muted-foreground">Средний балл</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-foreground">{stats.totalScore}</div>
                      <div className="text-xs text-muted-foreground">Общий счет</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-foreground">{stats.ranking}</div>
                      <div className="text-xs text-muted-foreground">Место</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="results" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="results" data-testid="tab-results">Результаты тестов</TabsTrigger>
            <TabsTrigger value="progress" data-testid="tab-progress">Прогресс по предметам</TabsTrigger>
            <TabsTrigger value="achievements" data-testid="tab-achievements">Достижения</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>История тестирования</CardTitle>
              </CardHeader>
              <CardContent>
                {profileData?.testResults && profileData.testResults.length > 0 ? (
                  <div className="space-y-4">
                    {profileData.testResults.slice().reverse().map((result, index) => (
                      <div key={result.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <i className="fas fa-file-alt text-primary"></i>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Тест #{result.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(result.completedAt).toLocaleDateString()} • 
                              Время: {Math.floor(result.timeSpent / 60)}м {result.timeSpent % 60}с
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <Badge 
                              variant={result.percentage >= 80 ? "default" : 
                                      result.percentage >= 60 ? "secondary" : "destructive"}
                            >
                              {result.percentage.toFixed(0)}%
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              {result.score}/{result.totalQuestions}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                      <i className="fas fa-file-alt text-muted-foreground text-xl"></i>
                    </div>
                    <p className="text-muted-foreground">Пока нет завершенных тестов</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Начните тестирование, чтобы увидеть свои результаты здесь
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Прогресс по предметам</CardTitle>
              </CardHeader>
              <CardContent>
                {profileData?.subjectProgress && profileData.subjectProgress.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profileData.subjectProgress.map((progress, index) => {
                      const accuracy = progress.totalAnswered > 0 
                        ? (progress.correctAnswered / progress.totalAnswered) * 100 
                        : 0;
                      
                      return (
                        <div key={index} className="p-4 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-foreground">{progress.subjectName}</h3>
                            <Badge variant="outline">{accuracy.toFixed(0)}%</Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Всего ответов:</span>
                              <span className="text-foreground">{progress.totalAnswered}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Правильных:</span>
                              <span className="text-accent">{progress.correctAnswered}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 mt-3">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  accuracy >= 80 ? 'bg-accent' :
                                  accuracy >= 60 ? 'bg-yellow-500' : 'bg-destructive'
                                }`}
                                style={{ width: `${Math.min(accuracy, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                      <i className="fas fa-chart-line text-muted-foreground text-xl"></i>
                    </div>
                    <p className="text-muted-foreground">Нет данных о прогрессе</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Пройдите несколько тестов, чтобы увидеть статистику по предметам
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Достижения</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Sample achievements - would be dynamic in real app */}
                  <div className={`p-4 rounded-lg border border-border ${
                    stats.testsCompleted >= 1 ? 'bg-accent/5 border-accent' : 'opacity-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        stats.testsCompleted >= 1 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <i className="fas fa-play"></i>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Первый тест</p>
                        <p className="text-xs text-muted-foreground">Пройти первый тест</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border border-border ${
                    stats.testsCompleted >= 5 ? 'bg-accent/5 border-accent' : 'opacity-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        stats.testsCompleted >= 5 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <i className="fas fa-fire"></i>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Активность</p>
                        <p className="text-xs text-muted-foreground">Пройти 5 тестов</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border border-border ${
                    parseFloat(stats.averageScore) >= 80 ? 'bg-accent/5 border-accent' : 'opacity-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        parseFloat(stats.averageScore) >= 80 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <i className="fas fa-star"></i>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Отличник</p>
                        <p className="text-xs text-muted-foreground">Средний балл 80%+</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border opacity-50">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                        <i className="fas fa-trophy"></i>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Топ-10</p>
                        <p className="text-xs text-muted-foreground">Попасть в топ-10 рейтинга</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border opacity-50">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                        <i className="fas fa-clock"></i>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Скорость</p>
                        <p className="text-xs text-muted-foreground">Завершить тест за 2 часа</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border opacity-50">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                        <i className="fas fa-graduation-cap"></i>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Мастер</p>
                        <p className="text-xs text-muted-foreground">100% по всем предметам</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
