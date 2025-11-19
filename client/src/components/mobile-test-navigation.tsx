import React, { useMemo } from 'react';

interface MobileQuestion {
  id: string;
  text: string;
  imageUrl?: string;
  answers: Array<{ id: string; text: string }>;
  subjectName?: string;
}

interface Props {
  questions: MobileQuestion[];
  currentIndex: number;
  userAnswers: Record<string, string | string[]>;
  onQuestionChange: (i: number) => void;
  onAnswerSelect: (questionId: string, answerId: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  timeLeft?: number;
  isReviewMode?: boolean;
}

export default function MobileTestNavigation({
  questions,
  currentIndex,
  userAnswers,
  onQuestionChange,
  onAnswerSelect,
  onSubmit,
  isSubmitting = false,
  timeLeft = 0,
  isReviewMode = false,
}: Props) {
  const current = questions[currentIndex];
  const total = questions.length;

  const userAnswerForCurrent = userAnswers[current?.id as string];

  const isMultipleChoice = useMemo(() => {
    if (!current) return false;
    return current.answers.length === 8; // keep same heuristic as TestPage
  }, [current]);

  if (!current) return null;

  const handleAnswer = (questionId: string, answerId: string) => {
    if (isReviewMode) return;
    onAnswerSelect(questionId, answerId);

    // Auto-advance for single-choice questions after a short delay
    if (!isMultipleChoice) {
      setTimeout(() => {
        if (currentIndex < total - 1) {
          onQuestionChange(currentIndex + 1);
        } else {
          // if last question - optionally submit
        }
      }, 400); // 400ms delay to show selection
    }
  };

  const minutes = Math.floor((timeLeft || 0) / 60);
  const seconds = (timeLeft || 0) % 60;

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium">
            {current.subjectName ? `${current.subjectName} • Вопрос ${currentIndex + 1}/${total}` : `Вопрос ${currentIndex + 1}/${total}`}
          </div>
          <div className="text-sm font-mono">
            {`${minutes}:${String(seconds).padStart(2, '0')}`}
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4 mb-4">
          <div className="text-base md:text-lg leading-relaxed break-words">{current.text}</div>
          {current.imageUrl && (
            <div className="mt-4">
              <img src={current.imageUrl} alt="Изображение вопроса" className="w-full h-auto object-contain rounded-md border" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          {current.answers.map((ans, idx) => {
            const isSelected = Array.isArray(userAnswerForCurrent)
              ? userAnswerForCurrent.includes(ans.id)
              : userAnswerForCurrent === ans.id;

            return (
              <button
                key={ans.id}
                onClick={() => handleAnswer(current.id, ans.id)}
                disabled={isReviewMode}
                className={`w-full text-left p-4 rounded-lg transition-colors flex items-start gap-3 ${isSelected ? 'border-2 border-blue-500 bg-blue-50 text-blue-600' : 'border border-border bg-white hover:bg-muted/50'}`}>  
                <div className="flex-shrink-0 mt-0.5">
                  {isMultipleChoice ? (
                    <div className={`w-11 h-11 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}>  
                      {isSelected ? '✓' : ''}
                    </div>
                  ) : (
                    <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-500' : 'border-gray-300'}`}>  
                      {isSelected ? <div className="w-3 h-3 rounded-full bg-blue-500" /> : null}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-medium mb-1">{String.fromCharCode(65 + idx)}.</div>
                  <div className="text-sm leading-relaxed break-words">{ans.text}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => onQuestionChange(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 rounded-md border"
          >
            Назад
          </button>

          {currentIndex === total - 1 ? (
            <button onClick={onSubmit} disabled={isSubmitting} className="px-4 py-2 rounded-md bg-accent text-white">
              {isSubmitting ? 'Завершение...' : 'Завершить тест'}
            </button>
          ) : (
            <button onClick={() => onQuestionChange(Math.min(total - 1, currentIndex + 1))} className="px-4 py-2 rounded-md bg-primary text-white">
              Далее
            </button>
          )}
        </div>
      </div>
    </div>
  );
}