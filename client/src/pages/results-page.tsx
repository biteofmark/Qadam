import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ExportDialog } from "@/components/ui/export-dialog";
import type { TestResult } from "@shared/schema";

interface NavigationState {
  result: TestResult;
  testData: {
    variant: { name: string; block: { name: string } };
    testData: Array<{
      subject: { name: string };
      questions: Array<{ id: string }>;
    }>;
  };
  userAnswers: Record<string, string>;
}

export default function ResultsPage() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  
  // Get test result data from sessionStorage first, then fallback
  const getStoredData = () => {
    try {
      const stored = sessionStorage.getItem('testResultData');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed;
      }
    } catch (error) {
      console.error('Error reading stored test data:', error);
    }
    return null;
  };
  
  const storedData = getStoredData();
  
  // НЕ очищаем sessionStorage сразу - данные могут понадобиться при обновлении страницы
  // sessionStorage будет очищен при начале нового теста
  
  // Fallback query to get the latest test result if no stored data
  const { data: latestResult, isLoading } = useQuery<TestResult>({
    queryKey: ["/api/profile/latest-result"],
    enabled: !storedData,
  });

  // Use stored data or fallback to latest result
  const testResult = storedData?.result || latestResult;
  const testData = storedData?.testData;
  const userAnswers = storedData?.userAnswers;

  // Fix percentage calculation if it's invalid
  const getValidPercentage = (result: TestResult | undefined) => {
    if (!result) return 0;
    
    // Убедимся что score и totalQuestions - числа
    const score = typeof result.score === 'number' ? result.score : 0;
    const totalQuestions = typeof result.totalQuestions === 'number' && result.totalQuestions > 0 ? result.totalQuestions : 1;
    
    const calculatedPercentage = (score / totalQuestions) * 100;
    const resultPercentage = result.percentage;
    
    // Use the calculated percentage if the stored one is invalid
    if (typeof resultPercentage !== 'number' || isNaN(resultPercentage) || resultPercentage == null) {
      return Math.round(calculatedPercentage);
    }
    
    return Math.round(resultPercentage);
  };

  const validPercentage = getValidPercentage(testResult);

  // Calculate subject breakdown from test data if available
  const calculateSubjectBreakdown = () => {
    // Если нет данных теста или ответов пользователя, возвращаем пустой массив
    if (!testData || !testData.testData || !userAnswers) {
            return [];
    }
    
    return testData.testData.map(subject => {
      const totalQuestions = subject.questions.length;
      
      // Подсчитываем правильные ответы для каждого предмета
      let correctAnswers = 0;
      let answeredQuestions = 0;
      
      subject.questions.forEach(question => {
        const userAnswerId = userAnswers[question.id];
        if (userAnswerId) {
          answeredQuestions++;
          // Ищем правильные ответы в вопросе
          if (question.answers && Array.isArray(question.answers)) {
            const selectedAnswer = question.answers.find(a => a.id === userAnswerId);
            if (selectedAnswer && selectedAnswer.isCorrect === true) {
              correctAnswers++;
            }
          }
        }
      });
      
      return {
        name: subject.subject.name,
        correct: correctAnswers,
        total: totalQuestions,
        answered: answeredQuestions,
        percentage: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
      };
    });
  };

  const subjects = calculateSubjectBreakdown();
  if (!storedData && isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 lg:px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!testResult) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 lg:px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Нәтижелер табылмады</h1>
            <p className="text-muted-foreground mb-4">
              Тест нәтижелерін алу мүмкін болмады. Сіз осы бетке тікелей кірген шығарсыз.
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-back-home">
              Вернуться на главную
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatTime = (seconds: number | undefined) => {
    const validSeconds = typeof seconds === 'number' && !isNaN(seconds) ? seconds : 0;
    const hours = Math.floor(validSeconds / 3600);
    const minutes = Math.floor((validSeconds % 3600) / 60);
    return `${hours}ч ${minutes}м`;
  };

  const getScoreColor = (percentage: number) => {
    if (typeof percentage !== 'number' || isNaN(percentage)) return "text-muted-foreground";
    if (percentage >= 80) return "text-accent";
    if (percentage >= 60) return "text-yellow-600";
    return "text-destructive";
  };

  const getScoreBadgeVariant = (percentage: number) => {
    if (typeof percentage !== 'number' || isNaN(percentage)) return "secondary";
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="text-center sm:text-left space-y-4">
              <div className="h-20 w-20 mx-auto sm:mx-0 rounded-full bg-accent/10 flex items-center justify-center">
                <i className="fas fa-check-circle text-accent text-3xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Тест завершен!</h1>
                <p className="text-muted-foreground">
                  Сіздің нәтижелеріңіз сақталды және жалпы рейтингте ескерілді
                </p>
              </div>
            </div>
            <ExportDialog 
              defaultType="TEST_REPORT"
              title="Нәтижелерді экспорттау"
              description="Тест нәтижелерін экспорттау форматын таңдаңыз"
            />
          </div>

          {/* Overall Results */}
          <Card>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Жалпы нәтижелер</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <div className={`text-6xl font-bold ${getScoreColor(validPercentage)}`}>
                  {validPercentage}%
                </div>
                <div className="text-muted-foreground">
                  {testResult.totalQuestions || 0} ішінен {testResult.score || 0} дұрыс жауап
                </div>
                <Badge 
                  variant={getScoreBadgeVariant(validPercentage)}
                  className="text-sm px-3 py-1"
                  data-testid="badge-result-grade"
                >
                  {validPercentage >= 80 ? "Отлично" : 
                   validPercentage >= 60 ? "Хорошо" : "Нужно подучить"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div className="text-center">
                  <div className="h-12 w-12 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <i className="fas fa-clock text-primary"></i>
                  </div>
                  <div className="text-sm text-muted-foreground">Время</div>
                  <div className="text-xl font-semibold text-foreground" data-testid="text-time-spent">
                    {formatTime(testResult.timeSpent)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="h-12 w-12 mx-auto rounded-lg bg-accent/10 flex items-center justify-center mb-2">
                    <i className="fas fa-chart-line text-accent"></i>
                  </div>
                  <div className="text-sm text-muted-foreground">Точность</div>
                  <div className="text-xl font-semibold text-foreground" data-testid="text-accuracy">
                    {validPercentage}%
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="h-12 w-12 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                    <i className="fas fa-trophy text-blue-500"></i>
                  </div>
                  <div className="text-sm text-muted-foreground">Баллы</div>
                  <div className="text-xl font-semibold text-foreground" data-testid="text-score">
                    {testResult.score}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Results */}
          <Card>
            <CardHeader>
              <CardTitle>Пәндер бойынша нәтижелер</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subjects.length > 0 ? (
                subjects.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {subject.name === "Физика" && <i className="fas fa-atom text-primary"></i>}
                        {subject.name === "Математика" && <i className="fas fa-calculator text-primary"></i>}
                        {subject.name === "Химия" && <i className="fas fa-flask text-accent"></i>}
                        {subject.name === "Биология" && <i className="fas fa-dna text-accent"></i>}
                        {!["Физика", "Математика", "Химия", "Биология"].includes(subject.name) && (
                          <i className="fas fa-book text-primary"></i>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{subject.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {subject.total} ішінен {subject.correct} дұрыс
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
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <i className="fas fa-info-circle text-2xl mb-2"></i>
                  <p>Детализация по предметам недоступна</p>
                  <p className="text-sm">Нәтижелер тек тестті толық өткенде ғана көрсетіледі</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Рекомендации</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {validPercentage >= 80 ? (
                <div className="flex items-start space-x-3">
                  <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-check text-accent text-xs"></i>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Тамаша нәтиже!</p>
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
                        {subjects.length > 0 
                          ? "Нәтижесі төмен пәндерге назар аударып, материалды қайталаңыз."
                          : "Материалды қайталап, нәтижені жақсарту үшін тестті тағы бір рет тапсыруды ұсынамыз."
                        }
                      </p>
                    </div>
                  </div>
                  
                  {subjects
                    .filter(s => s.percentage < 70)
                    .map((subject, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="fas fa-exclamation text-destructive text-xs"></i>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Подтяните {subject.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Нәтиже {subject.percentage}% - материалды қосымша оқып үйренуді ұсынамыз.
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
              Профильді қарау
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
            {/* Issue #3: Removed "Тестті қарау" button to prevent returning to completed tests */}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

