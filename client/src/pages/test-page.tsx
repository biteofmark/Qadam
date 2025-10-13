import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
// Header intentionally not rendered on test page to avoid navigation during a running test
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import TestTimer from "@/components/test-timer";
import Calculator from "@/components/calculator";
import PeriodicTable from "@/components/periodic-table";
// Proctoring removed
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import NetworkStatus from "@/components/network-status";
import type { Variant, Block } from "@shared/schema";
import type { ActiveTest } from "@/lib/offline-db";

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
  const [publicMatch, publicParams] = useRoute("/public-test/:variantId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { syncStatus, saveDraftTest, saveCompletedTest, getOfflineTest } = useOfflineSync();
  const variantId = params?.variantId || publicParams?.variantId;
  const isPublicTest = !!publicMatch;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPeriodicTable, setShowPeriodicTable] = useState(false);
  const [timeLeft, setTimeLeft] = useState(240 * 60); // 240 minutes in seconds
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [testStartTime] = useState(Date.now());

  // Small helper: Timer display component
  function TimerDisplay({ seconds }: { seconds: number }) {
    const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
    const ss = (seconds % 60).toString().padStart(2, '0');
    const isUrgent = seconds <= 30 * 60; // <=30 minutes
    return (
      <div className={`text-2xl font-mono ${isUrgent ? 'text-red-600' : 'text-black'}`}>
        {mm}:{ss}
      </div>
    );
  }

  // Small helper: numeric pagination (simple)
  function Pagination({ total, current, onChange }: { total: number; current: number; onChange: (i: number) => void }) {
    const windowSize = 7; // number of page buttons to show in pager window
    if (total <= 1) return null;

    const half = Math.floor(windowSize / 2);
    let start = Math.max(0, current - half);
    let end = Math.min(total, start + windowSize);
    if (end - start < windowSize) {
      start = Math.max(0, end - windowSize);
    }

    const pages: number[] = [];
    for (let i = start; i < end; i++) pages.push(i);

    const showLeftEllipsis = start > 1;
    const showRightEllipsis = end < total - 1;

    return (
      <div className="flex items-center gap-2">
        {/* first page if not in window */}
        {start > 0 && (
          <button onClick={() => onChange(0)} className={`px-2 py-1 rounded ${0 === current ? 'bg-accent text-white' : 'bg-transparent border'}`}>1</button>
        )}
        {showLeftEllipsis && <span className="px-2">...</span>}
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-2 py-1 rounded ${p === current ? 'bg-accent text-white' : 'bg-transparent border'}`}
          >{p+1}</button>
        ))}
        {showRightEllipsis && <span className="px-2">...</span>}
        {end < total && (
          <button onClick={() => onChange(total - 1)} className={`px-2 py-1 rounded ${total - 1 === current ? 'bg-accent text-white' : 'bg-transparent border'}`}>{total}</button>
        )}
      </div>
    );
  }

  // Timer ticking effect: decrement timeLeft every second
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          // call time up handler on next tick
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // pagination window size intentionally unified across devices

  // Proctoring removed

  const { data: testData, isLoading } = useQuery<TestData>({
    queryKey: [isPublicTest ? "/api/public/variants" : "/api/variants", variantId, "test"],
    enabled: !!variantId,
  });

  // Proctoring removed

  const submitTestMutation = useMutation({
    mutationFn: async (answers: Record<string, string>) => {
  // Proctoring removed: no action needed here.

      try {
        // Try online submission first
        if (syncStatus.isOnline) {
          const endpoint = isPublicTest ? "/api/public/test-results" : "/api/test-results";
          const res = await apiRequest("POST", endpoint, {
            variantId,
            answers,
            timeSpent: (240 * 60) - timeLeft,
          });
          return await res.json();
        } else {
          throw new Error('Offline mode');
        }
      } catch (error) {
        // For public tests, don't save offline - just show error
        if (isPublicTest) {
          throw error;
        }
        
        // Save for offline sync if online submission fails (only for authenticated users)
        const offlineResult = {
          id: `result-${variantId}-${user?.id}-${Date.now()}`,
          testId: `${variantId}-${user?.id}`,
          variantId: variantId!,
          answers,
          timeSpent: (240 * 60) - timeLeft,
          completedAt: Date.now(),
          syncStatus: 'pending' as const,
          syncAttempts: 0
        };
        
        await saveCompletedTest(offlineResult);
        
        return {
          offline: true,
          message: 'Тест сохранен для синхронизации'
        };
      }
    },
    onSuccess: (result) => {
      if (result.offline) {
        toast({
          title: "Тест завершен",
          description: "Результаты будут синхронизированы при восстановлении связи",
        });
      } else {
        const successMessage = result.isGuestResult 
          ? "Результаты готовы! Зарегистрируйтесь для сохранения прогресса" 
          : "Результаты успешно сохранены";
          
        toast({
          title: "Тест завершен",
          description: successMessage,
        });
        
        if (!result.isGuestResult) {
          queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        }
      }
      
      // Clean up offline data
      localStorage.removeItem(`test_${variantId}_answers`);
      
      // For guest results, show results directly, for authenticated users navigate to results page
      if (result.isGuestResult) {
        setTimeout(() => {
          setLocation("/", { 
            state: { 
              guestResult: result,
              testData, 
              userAnswers,
              showResults: true
            } 
          });
        }, 0);
      } else {
        setTimeout(() => {
          setLocation("/results", { state: { result, testData, userAnswers } });
        }, 0);
      }
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить результаты теста",
        variant: "destructive",
      });
    },
  });

  // Auto-save answers every 30 seconds (offline-first)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (variantId && testData && Object.keys(userAnswers).length > 0) {
        try {
          const activeTest: ActiveTest = {
            id: `${variantId}-${user?.id}`,
            variantId,
            variant: {
              ...testData.variant,
              block: {
                ...testData.variant.block,
                hasCalculator: testData.variant.block.hasCalculator ?? false,
                hasPeriodicTable: testData.variant.block.hasPeriodicTable ?? false,
              }
            },
            testData: testData.testData,
            userAnswers,
            startedAt: testStartTime,
            lastSavedAt: Date.now(),
            timeSpent: (240 * 60) - timeLeft,
            isCompleted: false,
            syncStatus: 'pending',
            syncAttempts: 0
          };
          
          await saveDraftTest(activeTest);
          
          // Fallback to localStorage
          localStorage.setItem(`test_${variantId}_answers`, JSON.stringify(userAnswers));
        } catch (error) {
          console.error('Failed to save test draft:', error);
          // Fallback to localStorage only
          localStorage.setItem(`test_${variantId}_answers`, JSON.stringify(userAnswers));
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [variantId, userAnswers, testData, timeLeft, user?.id, testStartTime, saveDraftTest]);

  // Load saved answers on component mount (offline-first)
  useEffect(() => {
    if (variantId && user?.id) {
      const loadSavedTest = async () => {
        try {
          // Try offline database first
          const offlineTest = await getOfflineTest(`${variantId}-${user.id}`);
          if (offlineTest) {
            setUserAnswers(offlineTest.userAnswers);
            setTimeLeft(Math.max(0, 240 * 60 - offlineTest.timeSpent));
            setIsOfflineMode(true);
            
            toast({
              title: "Тест восстановлен",
              description: "Продолжаем с сохраненного места",
            });
            return;
          }
          
          // Fallback to localStorage
          const savedAnswers = localStorage.getItem(`test_${variantId}_answers`);
          if (savedAnswers) {
            setUserAnswers(JSON.parse(savedAnswers));
          }
        } catch (error) {
          console.error('Failed to load saved test:', error);
          // Fallback to localStorage
          const savedAnswers = localStorage.getItem(`test_${variantId}_answers`);
          if (savedAnswers) {
            setUserAnswers(JSON.parse(savedAnswers));
          }
        }
      };
      
      loadSavedTest();
    }
  }, [variantId, user?.id, getOfflineTest, toast]);

  if ((!match && !publicMatch) || !variantId) {
    setLocation("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
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

  // Mobile view removed: mobile will now use the same DesktopView markup

  // Desktop view
  const DesktopView = () => (
    <div className="min-h-screen bg-background">
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
              {isOfflineMode && (
                <div className="flex items-center mt-2">
                  <NetworkStatus showDetails={true} className="text-sm" />
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <NetworkStatus className="md:hidden" />
              {/* old header timer removed */}
            </div>
          </div>
          
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

  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left subject menu (1 of 6) */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Предметы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {testData.testData.map((s, si) => {
                  const unanswered = s.questions.filter(q => !userAnswers[q.id]).length;
                  return (
                    <button
                      key={s.subject.id}
                      className={`w-full text-left p-2 rounded-lg flex items-center justify-between hover:bg-muted/50 ${testData.testData.findIndex(x=>x.subject.id===s.subject.id) === si ? 'bg-muted' : ''}`}
                      onClick={() => {
                        // jump to first question of this subject
                        const qIndex = allQuestions.findIndex(q => q.subjectName === s.subject.name);
                        if (qIndex >= 0) setCurrentQuestionIndex(qIndex);
                      }}
                    >
                      <span>{s.subject.name}</span>
                      <Badge>{unanswered}</Badge>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Timer small at bottom */}
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Таймер</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Custom timer display: black normally, red when < 30 minutes */}
                  <div className="text-center">
                    <TimerDisplay seconds={timeLeft} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Question Content (center) */}
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
                
                <div className="flex items-center justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    data-testid="button-previous-question"
                  >
                    <i className="fas fa-chevron-left mr-2"></i>
                    Назад
                  </Button>

                  {/* Subject-scoped pagination: only show questions that belong to current subject */}
                  <div className="flex items-center gap-2">
                    {(() => {
                      const curSubjectName = currentQuestion?.subjectName;
                      if (!curSubjectName) return null;
                      const subject = testData.testData.find(s => s.subject.name === curSubjectName);
                      if (!subject) return null;
                      return (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const total = subject.questions.length;
                            const localIndex = subject.questions.findIndex(qi => qi.id === currentQuestion?.id);
                            const windowSize = 9; // unified window size for mobile & desktop
                            const half = Math.floor(windowSize / 2);
                            let start = Math.max(0, localIndex - half);
                            let end = Math.min(total, start + windowSize);
                            if (end - start < windowSize) start = Math.max(0, end - windowSize);

                            const buttons = [] as any[];
                            for (let li = start; li < end; li++) {
                              const q = subject.questions[li];
                              const globalIndex = allQuestions.findIndex(aq => aq.id === q.id);
                              const answered = !!userAnswers[q.id];
                              const active = globalIndex === currentQuestionIndex;
                              buttons.push(
                                <Button
                                  key={q.id}
                                  variant={active ? "default" : "outline"}
                                  size="sm"
                                  className={`h-8 w-8 p-0 ${answered ? 'bg-accent/20 border-accent text-accent-foreground' : ''}`}
                                  onClick={() => setCurrentQuestionIndex(globalIndex)}
                                  data-testid={`button-subject-question-${li+1}`}
                                >{li+1}</Button>
                              );
                            }
                            return buttons;
                          })()}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2">
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
                      <>
                        <Button
                          onClick={() => setCurrentQuestionIndex(Math.min(allQuestions.length - 1, currentQuestionIndex + 1))}
                          data-testid="button-next-question"
                        >
                          Далее
                          <i className="fas fa-chevron-right ml-2"></i>
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={handleSubmitTest}
                          data-testid="button-inline-finish"
                          className="ml-2 text-sm"
                        >
                          Завершить тест
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar removed as per request */}
        </div>

        {/* external pagination removed (navigation shown inside question card) */}

        {/* Fixed finish button bottom-right */}
        <div>
          <Button onClick={handleSubmitTest} data-testid="button-finish-bottom" className="fixed bottom-6 right-6 z-50 bg-accent hover:bg-accent/90">Завершить тест</Button>
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

        {/* Video proctoring removed */}
      </main>
    </div>
  );

  return <DesktopView />;
}
