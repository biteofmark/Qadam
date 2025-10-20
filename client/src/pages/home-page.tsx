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

  const { data: blocks, isLoading: blocksLoading } = useQuery<(Block & { variantCount: number; totalQuestions: number })[]>({
    queryKey: ["/api/public/blocks"],
  });

  const { data: profileData } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });



  if (blocksLoading) {
    return (
      <div className="min-h-screen bg-blue-100">
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
    <div className="min-h-screen bg-blue-100">
      <Header />
      <main className="container mx-auto px-4 lg:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Қош келдіңіз, <span className="text-primary">{user?.username}</span>!
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            ҰБТ-ға дайындалу үшін тест блогын таңдаңыз
          </p>
        </div>



        {/* Test Blocks Grid */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 space-y-3 sm:space-y-0">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">Тестілеу блоктары</h2>
            <Button variant="outline" size="sm" className="self-start sm:self-auto">
              <i className="fas fa-filter mr-2"></i>
              Сүзгі
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {blocks?.map((block) => (
          <Card 
            key={block.id} 
            className="group hover:shadow-md transition-all duration-200 cursor-pointer h-full flex flex-col"
            onClick={() => setLocation(`/block/${block.id}`)}
            data-testid={`card-block-${block.id}`}
          >
            <CardContent className="p-4 md:p-6 flex flex-col h-full flex-grow">
              {/* Заголовок и иконки */}
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  {block.name.includes('Физика') && <i className="fas fa-atom text-blue-500 text-lg md:text-xl"></i>}
                  {block.name.includes('Химия') && <i className="fas fa-dna text-blue-500 text-lg md:text-xl"></i>}
                  {block.name.includes('История') && <i className="fas fa-globe text-blue-500 text-lg md:text-xl"></i>}
                </div>
                <div className="flex items-center space-x-1">
                  {block.hasCalculator && (
                    <i className="fas fa-calculator text-muted-foreground text-xs md:text-sm" title="Калькулятор қолжетімді"></i>
                  )}
                  {block.hasPeriodicTable && (
                    <i className="fas fa-table text-muted-foreground text-xs md:text-sm" title="Менделеев кестесі қолжетімді"></i>
                  )}
                </div>
              </div>
              
              {/* Название блока */}
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {block.name}
              </h3>
              
              {/* Описание */}
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-3">
                {block.name.includes('Физика') && "Физика мен математика бойынша кешенді дайындық және негізгі тақырыптарды терең зерделеу"}
                {block.name.includes('Химия') && "Медицина жоғары оқу орындарына түсу үшін химия мен биология бойынша қарқынды дайындық"}
                {block.name.includes('История') && "Қазақстан тарихы мен география бойынша кешенді дайындық"}
              </p>
              
              {/* Статистика */}
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-muted-foreground">
                  <i className="fas fa-file-alt mr-1"></i>
                  {block.variantCount} нұсқа
                </span>
                <span className="text-muted-foreground">
                  <i className="fas fa-clock mr-1"></i>
                  240 мин
                </span>
              </div>
              
              {/* Пустое пространство, которое займет всю доступную высоту */}
              <div className="flex-grow"></div>
              
              {/* Кнопка - всегда внизу */}
              <Button 
                className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-700 text-white font-semibold mt-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation(`/block/${block.id}`);
                }}
                data-testid={`button-start-${block.id}`}
              >
                ТЕГІН НҰСҚА
              </Button>
            </CardContent>
          </Card>
            )) || []}
          </div>
        </div>


      </main>
      <Footer />
    </div>
  );
}