import { useState, useEffect, useRef } from "react";
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
import MobileTestNavigation from "@/components/mobile-test-navigation";
import CameraPreview from "@/components/proctoring/CameraPreview";
import RecordingStatus from "@/components/proctoring/RecordingStatus";
import PermissionDialog from "@/components/proctoring/PermissionDialog";
import { VideoRecordingService } from "@/lib/video-recording-service";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import NetworkStatus from "@/components/network-status";
import type { Variant, Block } from "@shared/schema";
import type { ActiveTest } from "@/lib/offline-db";
import type { VideoSegment, RecordingMetadata } from "@/lib/video-recording-service";

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
  const { syncStatus, saveDraftTest, saveCompletedTest, getOfflineTest } = useOfflineSync();
  const variantId = params?.variantId;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPeriodicTable, setShowPeriodicTable] = useState(false);
  const [timeLeft, setTimeLeft] = useState(240 * 60); // 240 minutes in seconds
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [testStartTime] = useState(Date.now());

  // Video proctoring states
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"pending" | "granted" | "denied" | "error">("pending");
  const [isRecording, setIsRecording] = useState(false);
  const [cameraPreviewMinimized, setCameraPreviewMinimized] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [uploadProgress, setUploadProgress] = useState({
    uploaded: 0,
    total: 0,
    pending: 0,
    failed: 0,
  });
  const [recordingDuration, setRecordingDuration] = useState(0);
  const videoRecordingServiceRef = useRef<VideoRecordingService | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: testData, isLoading } = useQuery<TestData>({
    queryKey: ["/api/variants", variantId, "test"],
    enabled: !!variantId,
  });

  // Initialize video proctoring if required
  useEffect(() => {
    if (testData?.variant?.block?.requiresProctoring && user?.id && variantId) {
      setShowPermissionDialog(true);
      
      // Initialize video recording service
      const testSessionId = `${variantId}-${user.id}-${testStartTime}`;
      videoRecordingServiceRef.current = new VideoRecordingService({
        userId: user.id,
        testSessionId,
        variantId,
        chunkDurationMs: 2 * 60 * 1000, // 2 minutes chunks
        videoBitsPerSecond: 1000000, // 1Mbps
        audioBitsPerSecond: 128000   // 128kbps
      });

      // Set up callbacks
      videoRecordingServiceRef.current.setCallbacks({
        onSegmentReady: (segment: VideoSegment) => {
          setUploadProgress(prev => ({
            ...prev,
            total: prev.total + 1,
            pending: prev.pending + 1
          }));
        },
        onUploadProgress: (segment: VideoSegment, uploaded: boolean) => {
          setUploadProgress(prev => ({
            ...prev,
            uploaded: uploaded ? prev.uploaded + 1 : prev.uploaded,
            pending: uploaded ? prev.pending - 1 : prev.pending,
            failed: uploaded ? prev.failed : prev.failed + 1
          }));
        },
        onRecordingStatusChange: (recording: boolean) => {
          setIsRecording(recording);
        },
        onError: (error: string) => {
          toast({
            title: "Ошибка видео-прокторинга",
            description: error,
            variant: "destructive",
          });
        }
      });
    }
  }, [testData, user, variantId, testStartTime, toast]);

  // Update recording duration timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1000);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  // Video proctoring handlers
  const handlePermissionGranted = async () => {
    if (!videoRecordingServiceRef.current) return;

    try {
      const hasPermission = await videoRecordingServiceRef.current.requestCameraPermission();
      if (hasPermission) {
        setPermissionStatus("granted");
        setVideoStream(videoRecordingServiceRef.current.getVideoStream());
        setShowPermissionDialog(false);

        // Start recording automatically
        const started = await videoRecordingServiceRef.current.startRecording();
        if (!started) {
          toast({
            title: "Ошибка",
            description: "Не удалось начать запись видео",
            variant: "destructive",
          });
        }
      } else {
        setPermissionStatus("denied");
      }
    } catch (error) {
      console.error('Permission grant failed:', error);
      setPermissionStatus("error");
    }
  };

  const handlePermissionDenied = () => {
    setPermissionStatus("denied");
    toast({
      title: "Видео-прокторинг обязателен",
      description: "Для прохождения данного теста необходим доступ к камере",
      variant: "destructive",
    });
  };

  const handleRetryUploads = () => {
    // This would retry failed video segment uploads
    toast({
      title: "Повторная загрузка",
      description: "Попытка повторной загрузки неудачных сегментов...",
    });
  };

  // Cleanup video recording on unmount
  useEffect(() => {
    return () => {
      if (videoRecordingServiceRef.current) {
        videoRecordingServiceRef.current.cleanup();
      }
    };
  }, []);

  const submitTestMutation = useMutation({
    mutationFn: async (answers: Record<string, string>) => {
      // Stop video recording if it's active
      if (videoRecordingServiceRef.current && isRecording) {
        try {
          await videoRecordingServiceRef.current.stopRecording();
          toast({
            title: "Видео запись завершена",
            description: "Завершаем обработку видео записи...",
          });
        } catch (error) {
          console.error('Failed to stop video recording:', error);
        }
      }

      try {
        // Try online submission first
        if (syncStatus.isOnline) {
          const res = await apiRequest("POST", "/api/test-results", {
            variantId,
            answers,
            timeSpent: (240 * 60) - timeLeft,
          });
          return await res.json();
        } else {
          throw new Error('Offline mode');
        }
      } catch (error) {
        // Save for offline sync if online submission fails
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
        toast({
          title: "Тест завершен",
          description: "Результаты успешно сохранены",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      }
      
      // Clean up offline data
      localStorage.removeItem(`test_${variantId}_answers`);
      
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

  // Auto-save answers every 30 seconds (offline-first)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (variantId && testData && Object.keys(userAnswers).length > 0) {
        try {
          const activeTest: ActiveTest = {
            id: `${variantId}-${user?.id}`,
            variantId,
            variant: testData.variant,
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

  // Mobile view with swipe navigation
  const MobileView = () => (
    <div className="md:hidden min-h-screen bg-background">
      <Header />
      <MobileTestNavigation
        questions={allQuestions}
        currentIndex={currentQuestionIndex}
        userAnswers={userAnswers}
        onQuestionChange={setCurrentQuestionIndex}
        onAnswerSelect={handleAnswerSelect}
        onSubmit={handleSubmitTest}
        isSubmitting={submitTestMutation.isPending}
        timeLeft={timeLeft}
      />
      
      {/* Mobile Tools */}
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
    </div>
  );

  // Desktop view
  const DesktopView = () => (
    <div className="hidden md:block min-h-screen bg-background">
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
              {isOfflineMode && (
                <div className="flex items-center mt-2">
                  <NetworkStatus showDetails={true} className="text-sm" />
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <NetworkStatus className="md:hidden" />
              <TestTimer 
                initialTime={timeLeft}
                onTimeUp={handleTimeUp}
                onTick={setTimeLeft}
              />
            </div>
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

        {/* Video Proctoring Components */}
        {testData?.variant?.block?.requiresProctoring && (
          <>
            <PermissionDialog
              isOpen={showPermissionDialog}
              onClose={() => setShowPermissionDialog(false)}
              onPermissionGranted={handlePermissionGranted}
              onPermissionDenied={handlePermissionDenied}
              permissionStatus={permissionStatus}
            />

            {permissionStatus === "granted" && videoStream && (
              <CameraPreview
                stream={videoStream}
                isRecording={isRecording}
                isMinimized={cameraPreviewMinimized}
                onToggleMinimize={() => setCameraPreviewMinimized(!cameraPreviewMinimized)}
              />
            )}

            {isRecording && (
              <RecordingStatus
                isRecording={isRecording}
                recordingDuration={recordingDuration}
                uploadProgress={uploadProgress}
                connectionStatus={syncStatus.isOnline ? "online" : "offline"}
                onRetryUploads={handleRetryUploads}
              />
            )}
          </>
        )}
      </main>
    </div>
  );

  return (
    <>
      <MobileView />
      <DesktopView />
    </>
  );
}
