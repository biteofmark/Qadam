import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import TestTimer from "@/components/test-timer";
import Calculator from "@/components/calculator";
import PeriodicTable from "@/components/periodic-table";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Variant, Block } from "@shared/schema";

interface TestQuestion {
  id: string;
  text: string;
  answers: Array<{
    id: string;
    text: string;
  }>;
}

interface TestSubject {
  subject: {
    id: string;
    name: string;
  };
  questions: TestQuestion[];
}

interface TestData {
  variant: Variant & { block: Block };
  testData: TestSubject[];
}

export default function TestPage() {
  const [match, params] = useRoute("/test/:variantId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const variantId = params?.variantId;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPeriodicTable, setShowPeriodicTable] = useState(false);
  const [timeLeft, setTimeLeft] = useState(240 * 60); // 240 minutes in seconds

  const { data: testData, isLoading } = useQuery<TestData>({
    queryKey: ["/api/variants", variantId, "test"],
    enabled: !!variantId,
  });

  const submitTestMutation = useMutation({
    mutationFn: async (answers: Record<string, string>) => {
      const res = await apiRequest("POST", "/api/test-results", {
        variantId,
        answers,
        timeSpent: (240 * 60) - timeLeft,
      });
      return await res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setLocation("/results", { state: { result, testData, userAnswers } });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить результаты теста",
        variant: "destructive",
      });
    },
  });

  // Auto-save answers every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, you'd save to localStorage or send to server
      localStorage.setItem(`test_${variantId}_answers`, JSON.stringify(userAnswers));
    }, 30000);

    return () => clearInterval(interval);
  }, [variantId, userAnswers]);

  // Load saved answers on component mount
  useEffect(() => {
    if (variantId) {
      const savedAnswers = localStorage.getItem(`test_${variantId}_answers`);
      if (savedAnswers) {
        setUserAnswers(JSON.parse(savedAnswers));
      }
    }
  }, [variantId]);

  if (!match || !variantId) {
    setLocation("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 lg:px-6 py-8">
          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Skeleton className="h-96 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!testData || !testData.variant || !testData.variant.block || !testData.testData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 lg:px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Тест не найден</h1>
            <Button onClick={() => setLocation("/")} data-testid="button-back-home">
              Вернуться на главную
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const allQuestions = testData.testData.flatMap(subject => 
    subject.questions.map(q => ({ ...q, subjectName: subject.subject.name }))
  );
  const currentQuestion = allQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / allQuestions.length) * 100;

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleSubmitTest = () => {
    if (Object.keys(userAnswers).length < allQuestions.length) {
      toast({
        title: "Внимание",
        description: `Вы ответили только на ${Object.keys(userAnswers).length} из ${allQuestions.length} вопросов. Завершить тест?`,
        variant: "destructive",
      });
    }
    
    submitTestMutation.mutate(userAnswers);
  };

  const handleTimeUp = () => {
    toast({
      title: "Время вышло",
      description: "Тест автоматически завершен",
    });
    submitTestMutation.mutate(userAnswers);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 lg:px-6 py-8">
        {/* Test Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {testData.variant.block.name} - {testData.variant.name}
              </h1>
              <p className="text-muted-foreground">
                Вопрос {currentQuestionIndex + 1} из {allQuestions.length} • 
                Предмет: {currentQuestion?.subjectName}
              </p>
            </div>
            <TestTimer 
              initialTime={240 * 60}
              onTimeUp={handleTimeUp}
              onTick={setTimeLeft}
            />
          </div>
          
          <Progress value={progress} className="mb-4" />
          
          <div className="flex items-center space-x-4">
            {testData.variant.block.hasCalculator && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalculator(!showCalculator)}
                data-testid="button-calculator"
              >
                <i className="fas fa-calculator mr-2"></i>
                Калькулятор
              </Button>
            )}
            {testData.variant.block.hasPeriodicTable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPeriodicTable(!showPeriodicTable)}
                data-testid="button-periodic-table"
              >
                <i className="fas fa-table mr-2"></i>
                Таблица Менделеева
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Вопрос {currentQuestionIndex + 1}</CardTitle>
                  <Badge variant="secondary">{currentQuestion?.subjectName}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-lg text-foreground leading-relaxed">
                  {currentQuestion?.text}
                </div>
                
                <div className="space-y-3">
                  {currentQuestion?.answers.map((answer, index) => (
                    <div key={answer.id} className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id={`answer-${answer.id}`}
                        name={`question-${currentQuestion.id}`}
                        value={answer.id}
                        checked={userAnswers[currentQuestion.id] === answer.id}
                        onChange={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                        className="mt-1"
                        data-testid={`radio-answer-${answer.id}`}
                      />
                      <label
                        htmlFor={`answer-${answer.id}`}
                        className="flex-1 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <span className="font-medium text-primary mr-3">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        {answer.text}
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    data-testid="button-previous-question"
                  >
                    <i className="fas fa-chevron-left mr-2"></i>
                    Назад
                  </Button>
                  
                  {currentQuestionIndex === allQuestions.length - 1 ? (
                    <Button
                      onClick={handleSubmitTest}
                      disabled={submitTestMutation.isPending}
                      className="bg-accent hover:bg-accent/90"
                      data-testid="button-submit-test"
                    >
                      {submitTestMutation.isPending ? "Завершение..." : "Завершить тест"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setCurrentQuestionIndex(Math.min(allQuestions.length - 1, currentQuestionIndex + 1))}
                      data-testid="button-next-question"
                    >
                      Далее
                      <i className="fas fa-chevron-right ml-2"></i>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Question Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Навигация</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {allQuestions.map((question, index) => (
                    <Button
                      key={question.id}
                      variant={currentQuestionIndex === index ? "default" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        userAnswers[question.id] 
                          ? currentQuestionIndex === index 
                            ? "bg-accent" 
                            : "bg-accent/20 border-accent text-accent-foreground" 
                          : ""
                      }`}
                      onClick={() => setCurrentQuestionIndex(index)}
                      data-testid={`button-question-${index + 1}`}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
                
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded bg-accent"></div>
                    <span className="text-muted-foreground">Отвечен</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded border border-border"></div>
                    <span className="text-muted-foreground">Не отвечен</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Статистика</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Отвечено:</span>
                  <span className="font-medium">{Object.keys(userAnswers).length}/{allQuestions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Прогресс:</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tools Modals */}
        {showCalculator && (
          <Calculator 
            isOpen={showCalculator}
            onClose={() => setShowCalculator(false)}
          />
        )}
        
        {showPeriodicTable && (
          <PeriodicTable
            isOpen={showPeriodicTable}
            onClose={() => setShowPeriodicTable(false)}
          />
        )}
      </main>
    </div>
  );
}
