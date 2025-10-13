import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Block, Variant } from "@shared/schema";

export default function BlockVariantsPage() {
  const [match, params] = useRoute("/block/:blockId");
  const [, setLocation] = useLocation();
  const blockId = params?.blockId;

  const { data: block, isLoading: blockLoading } = useQuery<Block>({
    queryKey: ["/api/blocks", blockId],
    enabled: !!blockId,
  });

  const { data: variants, isLoading: variantsLoading } = useQuery<Variant[]>({
    queryKey: ["/api/blocks", blockId, "variants"],
    enabled: !!blockId,
  });

  if (!match || !blockId) {
    setLocation("/");
    return null;
  }

  if (blockLoading || variantsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 lg:px-6 py-8">
          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!block || !variants) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 lg:px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Блок не найден</h1>
            <Button onClick={() => setLocation("/")} data-testid="button-back-home">
              Вернуться на главную
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 lg:px-6 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="mb-4"
            data-testid="button-back"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Назад к блокам
          </Button>
        </div>

        {/* Block Title Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-xl bg-primary/10 flex items-center justify-center">
              {block.name.includes('Физика') && <i className="fas fa-atom text-primary text-3xl"></i>}
              {block.name.includes('Химия') && <i className="fas fa-dna text-accent text-3xl"></i>}
              {block.name.includes('История') && <i className="fas fa-globe text-blue-800 text-3xl"></i>}
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-4">{block.name}</h1>
          
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            {block.name.includes('Физика') && "Комплексная подготовка по физике и математике с углубленным изучением ключевых тем"}
            {block.name.includes('Химия') && "Интенсивная подготовка по химии и биологии для поступления в медицинские вузы"}
            {block.name.includes('История') && "Комплексная подготовка по истории Казахстана и географии"}
          </p>
          
          <div className="flex justify-center items-center space-x-6 text-sm text-muted-foreground">
            <span className="flex items-center">
              <i className="fas fa-file-alt mr-2"></i>
              {variants.length} {variants.length === 1 ? 'вариант' : variants.length < 5 ? 'варианта' : 'вариантов'}
            </span>
            <span className="flex items-center">
              <i className="fas fa-clock mr-2"></i>
              240 минут
            </span>
            {block.hasCalculator && (
              <span className="flex items-center">
                <i className="fas fa-calculator mr-2"></i>
                Калькулятор
              </span>
            )}
            {block.hasPeriodicTable && (
              <span className="flex items-center">
                <i className="fas fa-table mr-2"></i>
                Таблица Менделеева
              </span>
            )}
          </div>
        </div>

        {/* Variants Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Выберите вариант для тестирования</h2>
            <p className="text-muted-foreground">Каждый вариант содержит уникальные задания для полноценной подготовки</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {variants.map((variant, index) => (
              <Card 
                key={variant.id} 
                className="group hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => setLocation(`/test/${variant.id}`)}
                data-testid={`card-variant-${variant.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Сложность</div>
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-2 w-2 rounded-full ${
                              i < Math.min(index + 2, 5) ? 'bg-primary' : 'bg-muted'
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {variant.name}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    20 вопросов • 240 минут
                  </p>
                  
                  <div className="space-y-3">
                    {/* Progress indicator if user has attempted this variant */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Лучший результат</span>
                      <span className="text-foreground font-medium">Не пройден</span>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/test/${variant.id}`);
                      }}
                      data-testid={`button-start-variant-${variant.id}`}
                    >
                      Начать тест
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Инструкции по тестированию</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-clock text-primary text-xs"></i>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Время тестирования</p>
                    <p className="text-sm text-muted-foreground">На выполнение теста отводится 240 минут. Таймер запускается автоматически.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-save text-accent text-xs"></i>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Автосохранение</p>
                    <p className="text-sm text-muted-foreground">Ваши ответы автоматически сохраняются каждые 30 секунд.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="h-6 w-6 rounded-full bg-blue-800/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-question-circle text-blue-800 text-xs"></i>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Навигация</p>
                    <p className="text-sm text-muted-foreground">Вы можете переходить между вопросами и изменять ответы до завершения теста.</p>
                  </div>
                </div>
                
                {(block.hasCalculator || block.hasPeriodicTable) && (
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="fas fa-tools text-yellow-500 text-xs"></i>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Инструменты</p>
                      <p className="text-sm text-muted-foreground">
                        Доступны: {block.hasCalculator ? 'калькулятор' : ''}
                        {block.hasCalculator && block.hasPeriodicTable ? ', ' : ''}
                        {block.hasPeriodicTable ? 'таблица Менделеева' : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
