import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface TestQuestion {
  id: string;
  text: string;
  answers: Array<{ id: string; text: string; }>;
  subjectName?: string;
}

interface MobileTestNavigationProps {
  questions: TestQuestion[];
  currentIndex: number;
  userAnswers: Record<string, string>;
  onQuestionChange: (index: number) => void;
  onAnswerSelect: (questionId: string, answerId: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  timeLeft: number;
  isReviewMode?: boolean;
}

export default function MobileTestNavigation({
  questions,
  currentIndex,
  userAnswers,
  onQuestionChange,
  onAnswerSelect,
  onSubmit,
  isSubmitting,
  timeLeft,
  isReviewMode = false
}: MobileTestNavigationProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [showNavigation, setShowNavigation] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(userAnswers).length;

  // Swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > 50;
    const isRightSwipe = distanceX < -50;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

    // Only trigger horizontal swipes
    if (!isVerticalSwipe) {
      if (isLeftSwipe && currentIndex < questions.length - 1) {
        onQuestionChange(currentIndex + 1);
        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      } else if (isRightSwipe && currentIndex > 0) {
        onQuestionChange(currentIndex - 1);
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onQuestionChange(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        onQuestionChange(currentIndex + 1);
      } else if (e.key >= '1' && e.key <= '4') {
        const answerIndex = parseInt(e.key) - 1;
        if (currentQuestion.answers[answerIndex]) {
          onAnswerSelect(currentQuestion.id, currentQuestion.answers[answerIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQuestion, onQuestionChange, onAnswerSelect]);

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="md:hidden min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Mobile Header - Modern Design */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Sheet open={showNavigation} onOpenChange={setShowNavigation}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 shadow-sm hover:shadow-md transition-all duration-200"
                    data-testid="button-mobile-navigation"
                  >
                    <i className="fas fa-th-large mr-2 text-slate-600 dark:text-slate-300"></i>
                    <span className="font-medium">{currentIndex + 1}/{questions.length}</span>
                  </Button>
                </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Навигация по вопросам
                    </h3>
                    <Badge variant="secondary" className="px-3 py-1 bg-slate-100 dark:bg-slate-700">
                      {Object.keys(userAnswers).length} из {questions.length}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-3 mb-6">
                    {questions.map((question, index) => {
                      const isAnswered = userAnswers[question.id];
                      const isCurrent = currentIndex === index;
                      
                      return (
                        <Button
                          key={question.id}
                          variant="outline"
                          size="sm"
                          className={`h-14 relative transition-all duration-200 font-semibold text-base ${
                            isCurrent 
                              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg scale-105" 
                              : isAnswered 
                                ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-500 text-green-700 dark:text-green-300 shadow-md hover:scale-105" 
                                : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md hover:scale-105"
                          }`}
                          onClick={() => {
                            onQuestionChange(index);
                            setShowNavigation(false);
                          }}
                          data-testid={`mobile-question-${index + 1}`}
                        >
                          <span className="relative z-10">{index + 1}</span>
                          {isAnswered && !isCurrent && (
                            <div className="absolute top-1 right-1">
                              <i className="fas fa-check text-xs text-green-600 dark:text-green-400"></i>
                            </div>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Отвечено:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg text-slate-800 dark:text-slate-200">{answeredCount}</span>
                        <span className="text-slate-500 dark:text-slate-400">из</span>
                        <span className="font-bold text-lg text-slate-800 dark:text-slate-200">{questions.length}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Прогресс:</span>
                        <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{Math.round(progress)}%</span>
                      </div>
                      <Progress 
                        value={progress} 
                        className="h-3 bg-slate-200 dark:bg-slate-600 rounded-full"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
                      <div className="flex items-center space-x-2">
                        <div className="h-3 w-3 rounded-full bg-gradient-to-r from-green-400 to-green-500 shadow-sm"></div>
                        <span className="text-slate-600 dark:text-slate-400 text-sm">Отвечен</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-3 w-3 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"></div>
                        <span className="text-slate-600 dark:text-slate-400 text-sm">Не отвечен</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <Badge 
              variant="secondary" 
              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-medium"
            >
              {currentQuestion?.subjectName}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isReviewMode && (
              <div className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                <i className="fas fa-clock text-orange-500 text-xs"></i>
                <span className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="px-1">
          <Progress 
            value={progress} 
            className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
          />
        </div>
        </div>
      </div>

      {/* Question Content with Swipe - Modern Design */}
      <div 
        ref={containerRef}
        className="p-4 pb-24 min-h-[calc(100vh-200px)] touch-pan-x"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="mobile-question-container"
      >
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Вопрос {currentIndex + 1}
                </h2>
                <Badge variant="outline" className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                  {currentIndex + 1} из {questions.length}
                </Badge>
              </div>
              <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 rounded-lg p-4 border-l-4 border-blue-500">
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-base">
                  {currentQuestion?.text}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {currentQuestion?.answers.map((answer, index) => {
                // Определяем стиль для режима просмотра результатов
                const getAnswerStyle = () => {
                  if (!isReviewMode) {
                    const isSelected = userAnswers[currentQuestion.id] === answer.id;
                    return `
                      flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                      ${isSelected 
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 shadow-lg' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }
                    `;
                  }
                  
                  const isUserAnswer = userAnswers[currentQuestion.id] === answer.id;
                  const isCorrectAnswer = (answer as any).isCorrect;
                  
                  if (isCorrectAnswer && isUserAnswer) {
                    // Мой правильный ответ - синий
                    return "flex items-start space-x-3 p-4 rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 text-blue-700 dark:text-blue-300 transition-all shadow-lg";
                  } else if (isCorrectAnswer && !isUserAnswer) {
                    // Правильный ответ (не мой) - зеленый
                    return "flex items-start space-x-3 p-4 rounded-xl border-2 border-green-500 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 text-green-700 dark:text-green-300 transition-all shadow-lg";
                  } else if (isUserAnswer && !isCorrectAnswer) {
                    // Мой неправильный ответ - красный
                    return "flex items-start space-x-3 p-4 rounded-xl border-2 border-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 text-red-700 dark:text-red-300 transition-all shadow-lg";
                  } else {
                    // Обычный неправильный ответ
                    return "flex items-start space-x-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition-all opacity-60";
                  }
                };

                const getRadioStyle = () => {
                  if (!isReviewMode) {
                    const isSelected = userAnswers[currentQuestion.id] === answer.id;
                    return `
                      w-7 h-7 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all duration-200 shadow-sm
                      ${isSelected 
                        ? 'border-blue-500 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md' 
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
                      }
                    `;
                  }
                  
                  const isUserAnswer = userAnswers[currentQuestion.id] === answer.id;
                  const isCorrectAnswer = (answer as any).isCorrect;
                  
                  if (isCorrectAnswer && isUserAnswer) {
                    // Мой правильный ответ - синий
                    return "w-7 h-7 rounded-full border-2 border-blue-500 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mt-0.5 flex-shrink-0 text-white shadow-lg";
                  } else if (isCorrectAnswer && !isUserAnswer) {
                    // Правильный ответ (не мой) - зеленый
                    return "w-7 h-7 rounded-full border-2 border-green-500 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mt-0.5 flex-shrink-0 text-white shadow-lg";
                  } else if (isUserAnswer && !isCorrectAnswer) {
                    // Мой неправильный ответ - красный
                    return "w-7 h-7 rounded-full border-2 border-red-500 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mt-0.5 flex-shrink-0 text-white shadow-lg";
                  } else {
                    // Обычный неправильный ответ
                    return "w-7 h-7 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center mt-0.5 flex-shrink-0";
                  }
                };

                return (
                  <div
                    key={answer.id}
                    className={getAnswerStyle()}
                    onClick={() => {
                      if (!isReviewMode) {
                        onAnswerSelect(currentQuestion.id, answer.id);
                        if ('vibrate' in navigator) {
                          navigator.vibrate(25);
                        }
                      }
                    }}
                    style={{ minHeight: '44px' }}
                    data-testid={`mobile-answer-${answer.id}`}
                  >
                    <div className={getRadioStyle()}>
                      {isReviewMode ? (
                        // Иконки для режима просмотра
                        (answer as any).isCorrect ? (
                          <i className="fas fa-check text-sm"></i>
                        ) : userAnswers[currentQuestion.id] === answer.id ? (
                          <i className="fas fa-times text-sm"></i>
                        ) : null
                      ) : (
                        // Точка для обычного режима
                        userAnswers[currentQuestion.id] === answer.id && (
                          <div className="w-3 h-3 rounded-full bg-white shadow-sm"></div>
                        )
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start space-x-3">
                        <span className="font-bold text-lg text-slate-600 dark:text-slate-400 min-w-[20px] mt-0.5">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium flex-1">
                          {answer.text}
                        </span>
                        {isReviewMode && (
                          <div className="flex-shrink-0 mt-1">
                            {(answer as any).isCorrect && userAnswers[currentQuestion.id] === answer.id && (
                              <i className="fas fa-check-circle text-blue-500 text-lg"></i>
                            )}
                            {(answer as any).isCorrect && userAnswers[currentQuestion.id] !== answer.id && (
                              <i className="fas fa-check-circle text-green-600 text-lg"></i>
                            )}
                            {userAnswers[currentQuestion.id] === answer.id && !(answer as any).isCorrect && (
                              <i className="fas fa-times-circle text-red-600 text-lg"></i>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Swipe Hint */}
        <div className="text-center text-xs text-muted-foreground mt-4">
          <i className="fas fa-hand-pointer mr-1"></i>
          Проведите влево/вправо для навигации
        </div>
      </div>

      {/* Bottom Navigation - Modern Design */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 shadow-2xl safe-area-padding-bottom">
        <div className="p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onQuestionChange(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="min-w-[100px] h-12 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 disabled:opacity-40"
              data-testid="mobile-button-previous"
            >
              <i className="fas fa-chevron-left mr-2 text-slate-600 dark:text-slate-400"></i>
              Назад
            </Button>
            
            {currentIndex === questions.length - 1 ? (
              <Button
                size="lg"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="min-w-[140px] h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70"
                data-testid="mobile-button-submit"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Завершение...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Завершить тест
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => onQuestionChange(Math.min(questions.length - 1, currentIndex + 1))}
                className="min-w-[100px] h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                data-testid="mobile-button-next"
              >
                Далее
                <i className="fas fa-chevron-right ml-2"></i>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
