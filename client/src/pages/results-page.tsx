import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function ResultsPage() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  
  // In a real app, this would come from route state or query params
  // For now, we'll show a placeholder
  const mockResult = {
    score: 17,
    totalQuestions: 20,
    percentage: 85,
    timeSpent: 7200, // 2 hours in seconds
    subjects: [
      { name: "Физика", correct: 8, total: 10, percentage: 80 },
      { name: "Математика", correct: 9, total: 10, percentage: 90 },
    ]
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}ч ${minutes}м`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-accent";
    if (percentage >= 60) return "text-yellow-600";
    return "text-destructive";
  };

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default";
    if (percentage >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 lg:px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="h-20 w-20 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
              <i className="fas fa-check-circle text-accent text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Тест завершен!</h1>
            <p className="text-muted-foreground">
              Ваши результаты сохранены и учтены в общем рейтинге
            </p>
          </div>

          {/* Overall Results */}
          <Card>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Общие результаты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <div className={`text-6xl font-bold ${getScoreColor(mockResult.percentage)}`}>
                  {mockResult.percentage}%
                </div>
                <div className="text-muted-foreground">
                  {mockResult.score} из {mockResult.totalQuestions} правильных ответов
                </div>
                <Badge 
                  variant={getScoreBadgeVariant(mockResult.percentage)}
                  className="text-sm px-3 py-1"
                >
                  {mockResult.percentage >= 80 ? "Отлично" : 
                   mockResult.percentage >= 60 ? "Хорошо" : "Нужно подучить"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div className="text-center">
                  <div className="h-12 w-12 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <i className="fas fa-clock text-primary"></i>
                  </div>
                  <div className="text-sm text-muted-foreground">Время</div>
                  <div className="text-xl font-semibold text-foreground">
                    {formatTime(mockResult.timeSpent)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="h-12 w-12 mx-auto rounded-lg bg-accent/10 flex items-center justify-center mb-2">
                    <i className="fas fa-chart-line text-accent"></i>
                  </div>
                  <div className="text-sm text-muted-foreground">Точность</div>
                  <div className="text-xl font-semibold text-foreground">
                    {mockResult.percentage}%
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="h-12 w-12 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                    <i className="fas fa-trophy text-blue-500"></i>
                  </div>
                  <div className="text-sm text-muted-foreground">Баллы</div>
                  <div className="text-xl font-semibold text-foreground">
                    {mockResult.score}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Results */}
          <Card>
            <CardHeader>
              <CardTitle>Результаты по предметам</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockResult.subjects.map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {subject.name === "Физика" && <i className="fas fa-atom text-primary"></i>}
                      {subject.name === "Математика" && <i className="fas fa-calculator text-primary"></i>}
                      {subject.name === "Химия" && <i className="fas fa-flask text-accent"></i>}
                      {subject.name === "Биология" && <i className="fas fa-dna text-accent"></i>}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{subject.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {subject.correct} из {subject.total} правильных
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${getScoreColor(subject.percentage)}`}>
                      {subject.percentage}%
                    </div>
                    <div className="w-24 bg-muted rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full ${
                          subject.percentage >= 80 ? 'bg-accent' :
                          subject.percentage >= 60 ? 'bg-yellow-500' : 'bg-destructive'
                        }`}
                        style={{ width: `${subject.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Рекомендации</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockResult.percentage >= 80 ? (
                <div className="flex items-start space-x-3">
                  <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-check text-accent text-xs"></i>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Отличный результат!</p>
                    <p className="text-sm text-muted-foreground">
                      Вы хорошо подготовлены по этому блоку. Продолжайте решать тесты для закрепления знаний.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="fas fa-lightbulb text-yellow-500 text-xs"></i>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Рекомендации по улучшению</p>
                      <p className="text-sm text-muted-foreground">
                        Обратите внимание на предметы с низким результатом и повторите материал.
                      </p>
                    </div>
                  </div>
                  
                  {mockResult.subjects
                    .filter(s => s.percentage < 70)
                    .map((subject, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="fas fa-exclamation text-destructive text-xs"></i>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Подтяните {subject.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Результат {subject.percentage}% - рекомендуем дополнительно изучить материал.
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setLocation("/profile")}
              className="flex-1 sm:flex-none"
              data-testid="button-view-profile"
            >
              <i className="fas fa-user mr-2"></i>
              Посмотреть профиль
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setLocation("/ranking")}
              className="flex-1 sm:flex-none"
              data-testid="button-view-ranking"
            >
              <i className="fas fa-trophy mr-2"></i>
              Рейтинг
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setLocation("/")}
              className="flex-1 sm:flex-none"
              data-testid="button-back-home"
            >
              <i className="fas fa-home mr-2"></i>
              На главную
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
