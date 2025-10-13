import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
// Video recordings admin view removed
import type { Block, Variant, Subject, Question, Answer } from "@shared/schema";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("blocks");

  // Block management
  const { data: blocks, isLoading: blocksLoading } = useQuery<Block[]>({
    queryKey: ["/api/blocks"],
  });

  const createBlockMutation = useMutation({
    mutationFn: async (data: { name: string; hasCalculator: boolean; hasPeriodicTable: boolean }) => {
      const res = await apiRequest("POST", "/api/blocks", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      toast({ title: "Успешно", description: "Блок создан" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось создать блок", variant: "destructive" });
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      await apiRequest("DELETE", `/api/blocks/${blockId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      toast({ title: "Успешно", description: "Блок удален" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить блок", variant: "destructive" });
    },
  });

  // Variant management
  const [selectedBlock, setSelectedBlock] = useState<string>("");
  const { data: variants } = useQuery<Variant[]>({
    queryKey: ["/api/blocks", selectedBlock, "variants"],
    enabled: !!selectedBlock,
  });

  const createVariantMutation = useMutation({
    mutationFn: async (data: { blockId: string; name: string }) => {
      const res = await apiRequest("POST", "/api/variants", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks", selectedBlock, "variants"] });
      toast({ title: "Успешно", description: "Вариант создан" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось создать вариант", variant: "destructive" });
    },
  });

  // Subject management
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/variants", selectedVariant, "subjects"],
    enabled: !!selectedVariant,
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (data: { variantId: string; name: string }) => {
      const res = await apiRequest("POST", "/api/subjects", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/variants", selectedVariant, "subjects"] });
      toast({ title: "Успешно", description: "Предмет создан" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось создать предмет", variant: "destructive" });
    },
  });

  // Question management
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/subjects", selectedSubject, "questions"],
    enabled: !!selectedSubject,
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: { subjectId: string; text: string }) => {
      const res = await apiRequest("POST", "/api/questions", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects", selectedSubject, "questions"] });
      toast({ title: "Успешно", description: "Вопрос создан" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось создать вопрос", variant: "destructive" });
    },
  });

  // Answer management
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const { data: answers } = useQuery<Answer[]>({
    queryKey: ["/api/questions", selectedQuestion, "answers"],
    enabled: !!selectedQuestion,
  });

  const createAnswerMutation = useMutation({
    mutationFn: async (data: { questionId: string; text: string; isCorrect: boolean }) => {
      const res = await apiRequest("POST", "/api/answers", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions", selectedQuestion, "answers"] });
      toast({ title: "Успешно", description: "Ответ создан" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось создать ответ", variant: "destructive" });
    },
  });

  // Form handlers
  const handleCreateBlock = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createBlockMutation.mutate({
      name: formData.get("name") as string,
      hasCalculator: formData.get("hasCalculator") === "on",
      hasPeriodicTable: formData.get("hasPeriodicTable") === "on",
    });
    e.currentTarget.reset();
  };

  const handleCreateVariant = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createVariantMutation.mutate({
      blockId: selectedBlock,
      name: formData.get("name") as string,
    });
    e.currentTarget.reset();
  };

  const handleCreateSubject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createSubjectMutation.mutate({
      variantId: selectedVariant,
      name: formData.get("name") as string,
    });
    e.currentTarget.reset();
  };

  const handleCreateQuestion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createQuestionMutation.mutate({
      subjectId: selectedSubject,
      text: formData.get("text") as string,
    });
    e.currentTarget.reset();
  };

  const handleCreateAnswer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createAnswerMutation.mutate({
      questionId: selectedQuestion,
      text: formData.get("text") as string,
      isCorrect: formData.get("isCorrect") === "on",
    });
    e.currentTarget.reset();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 lg:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Панель администратора</h1>
          <p className="text-muted-foreground">Управление тестовыми материалами и структурой</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="blocks" data-testid="tab-blocks">Блоки</TabsTrigger>
            <TabsTrigger value="variants" data-testid="tab-variants">Варианты</TabsTrigger>
            <TabsTrigger value="subjects" data-testid="tab-subjects">Предметы</TabsTrigger>
            <TabsTrigger value="questions" data-testid="tab-questions">Вопросы и ответы</TabsTrigger>
            {/* Video recordings tab removed (proctoring deprecated) */}
          </TabsList>

          <TabsContent value="blocks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Управление блоками</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleCreateBlock} className="space-y-4" data-testid="form-create-block">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="block-name">Название блока</Label>
                      <Input id="block-name" name="name" placeholder="Физика-Математика" required data-testid="input-block-name" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="has-calculator" name="hasCalculator" />
                      <Label htmlFor="has-calculator">Калькулятор</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="has-periodic-table" name="hasPeriodicTable" />
                      <Label htmlFor="has-periodic-table">Таблица Менделеева</Label>
                    </div>
                  </div>
                  <Button type="submit" disabled={createBlockMutation.isPending} data-testid="button-create-block">
                    {createBlockMutation.isPending ? "Создание..." : "Создать блок"}
                  </Button>
                </form>

                <div className="space-y-4">
                  {blocksLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    blocks?.map((block) => (
                      <div key={block.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <i className="fas fa-cube text-primary"></i>
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{block.name}</h3>
                            <div className="flex space-x-2 mt-1">
                              {block.hasCalculator && (
                                <Badge variant="secondary" className="text-xs">
                                  <i className="fas fa-calculator mr-1"></i>
                                  Калькулятор
                                </Badge>
                              )}
                              {block.hasPeriodicTable && (
                                <Badge variant="secondary" className="text-xs">
                                  <i className="fas fa-table mr-1"></i>
                                  Таблица
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteBlockMutation.mutate(block.id)}
                          disabled={deleteBlockMutation.isPending}
                          data-testid={`button-delete-block-${block.id}`}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Управление вариантами</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Выберите блок</Label>
                  <select 
                    className="w-full p-2 border border-border rounded-md bg-background"
                    value={selectedBlock}
                    onChange={(e) => setSelectedBlock(e.target.value)}
                    data-testid="select-block"
                  >
                    <option value="">Выберите блок...</option>
                    {blocks?.map((block) => (
                      <option key={block.id} value={block.id}>{block.name}</option>
                    ))}
                  </select>
                </div>

                {selectedBlock && (
                  <form onSubmit={handleCreateVariant} className="space-y-4" data-testid="form-create-variant">
                    <div className="space-y-2">
                      <Label htmlFor="variant-name">Название варианта</Label>
                      <Input id="variant-name" name="name" placeholder="Вариант 1" required data-testid="input-variant-name" />
                    </div>
                    <Button type="submit" disabled={createVariantMutation.isPending} data-testid="button-create-variant">
                      {createVariantMutation.isPending ? "Создание..." : "Создать вариант"}
                    </Button>
                  </form>
                )}

                {variants && variants.length > 0 && (
                  <div className="space-y-4">
                    {variants.map((variant) => (
                      <div key={variant.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                            <i className="fas fa-file-alt text-accent"></i>
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{variant.name}</h3>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Управление предметами</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Выберите блок</Label>
                    <select 
                      className="w-full p-2 border border-border rounded-md bg-background"
                      value={selectedBlock}
                      onChange={(e) => {
                        setSelectedBlock(e.target.value);
                        setSelectedVariant("");
                      }}
                      data-testid="select-block-for-subjects"
                    >
                      <option value="">Выберите блок...</option>
                      {blocks?.map((block) => (
                        <option key={block.id} value={block.id}>{block.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Выберите вариант</Label>
                    <select 
                      className="w-full p-2 border border-border rounded-md bg-background"
                      value={selectedVariant}
                      onChange={(e) => setSelectedVariant(e.target.value)}
                      disabled={!selectedBlock}
                      data-testid="select-variant"
                    >
                      <option value="">Выберите вариант...</option>
                      {variants?.map((variant) => (
                        <option key={variant.id} value={variant.id}>{variant.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedVariant && (
                  <form onSubmit={handleCreateSubject} className="space-y-4" data-testid="form-create-subject">
                    <div className="space-y-2">
                      <Label htmlFor="subject-name">Название предмета</Label>
                      <Input id="subject-name" name="name" placeholder="Физика" required data-testid="input-subject-name" />
                    </div>
                    <Button type="submit" disabled={createSubjectMutation.isPending} data-testid="button-create-subject">
                      {createSubjectMutation.isPending ? "Создание..." : "Создать предмет"}
                    </Button>
                  </form>
                )}

                {subjects && subjects.length > 0 && (
                  <div className="space-y-4">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-lg bg-blue-800/10 flex items-center justify-center">
                            <i className="fas fa-book text-blue-800"></i>
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{subject.name}</h3>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Управление вопросами и ответами</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Выберите блок</Label>
                    <select 
                      className="w-full p-2 border border-border rounded-md bg-background"
                      value={selectedBlock}
                      onChange={(e) => {
                        setSelectedBlock(e.target.value);
                        setSelectedVariant("");
                        setSelectedSubject("");
                        setSelectedQuestion("");
                      }}
                      data-testid="select-block-for-questions"
                    >
                      <option value="">Выберите блок...</option>
                      {blocks?.map((block) => (
                        <option key={block.id} value={block.id}>{block.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Выберите вариант</Label>
                    <select 
                      className="w-full p-2 border border-border rounded-md bg-background"
                      value={selectedVariant}
                      onChange={(e) => {
                        setSelectedVariant(e.target.value);
                        setSelectedSubject("");
                        setSelectedQuestion("");
                      }}
                      disabled={!selectedBlock}
                      data-testid="select-variant-for-questions"
                    >
                      <option value="">Выберите вариант...</option>
                      {variants?.map((variant) => (
                        <option key={variant.id} value={variant.id}>{variant.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Выберите предмет</Label>
                    <select 
                      className="w-full p-2 border border-border rounded-md bg-background"
                      value={selectedSubject}
                      onChange={(e) => {
                        setSelectedSubject(e.target.value);
                        setSelectedQuestion("");
                      }}
                      disabled={!selectedVariant}
                      data-testid="select-subject"
                    >
                      <option value="">Выберите предмет...</option>
                      {subjects?.map((subject) => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedSubject && (
                  <form onSubmit={handleCreateQuestion} className="space-y-4" data-testid="form-create-question">
                    <div className="space-y-2">
                      <Label htmlFor="question-text">Текст вопроса</Label>
                      <Textarea 
                        id="question-text" 
                        name="text" 
                        placeholder="Введите текст вопроса..." 
                        rows={3}
                        required 
                        data-testid="textarea-question-text"
                      />
                    </div>
                    <Button type="submit" disabled={createQuestionMutation.isPending} data-testid="button-create-question">
                      {createQuestionMutation.isPending ? "Создание..." : "Создать вопрос"}
                    </Button>
                  </form>
                )}

                {questions && questions.length > 0 && (
                  <div className="space-y-6">
                    {questions.map((question) => (
                      <Card key={question.id} className="border-2 border-muted">
                        <CardHeader className="pb-4">
                          <div className="flex items-start space-x-4">
                            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-question text-yellow-500"></i>
                            </div>
                            <div className="flex-1">
                              <p className="text-foreground font-medium">{question.text}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedQuestion(selectedQuestion === question.id ? "" : question.id)}
                              data-testid={`button-manage-answers-${question.id}`}
                            >
                              <i className="fas fa-edit mr-2"></i>
                              Управлять ответами
                            </Button>
                          </div>
                        </CardHeader>
                        
                        {selectedQuestion === question.id && (
                          <CardContent className="pt-0 space-y-4">
                            {/* Форма для добавления ответа */}
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <form onSubmit={handleCreateAnswer} className="space-y-4" data-testid="form-create-answer">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="md:col-span-3 space-y-2">
                                    <Label htmlFor="answer-text">Новый ответ</Label>
                                    <Input 
                                      id="answer-text" 
                                      name="text" 
                                      placeholder="Введите вариант ответа..." 
                                      required 
                                      data-testid="input-answer-text"
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <div className="flex items-center space-x-2">
                                      <Switch id="is-correct" name="isCorrect" />
                                      <Label htmlFor="is-correct">Правильный</Label>
                                    </div>
                                  </div>
                                </div>
                                <Button type="submit" disabled={createAnswerMutation.isPending} data-testid="button-create-answer">
                                  {createAnswerMutation.isPending ? "Создание..." : "Добавить ответ"}
                                </Button>
                              </form>
                            </div>

                            {/* Список существующих ответов */}
                            {answers && answers.length > 0 && (
                              <div className="space-y-3">
                                <Label className="text-sm font-medium">Существующие ответы:</Label>
                                {answers.map((answer, index) => (
                                  <div key={answer.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
                                    <div className="flex items-center space-x-3">
                                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        answer.isCorrect ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'
                                      }`}>
                                        {String.fromCharCode(65 + index)}
                                      </div>
                                      <span className="text-foreground">{answer.text}</span>
                                    </div>
                                    {answer.isCorrect && (
                                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                        <i className="fas fa-check mr-1"></i>
                                        Правильный
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* Video recordings content removed */}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
