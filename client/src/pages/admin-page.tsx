import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

// User Management Component
function UserManagement() {
  const { toast } = useToast();
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string>("");
  
  // Fetch users
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async (): Promise<User[]> => {
      console.log('Fetching users from API...');
      const res = await apiRequest("GET", "/api/admin/users");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('Users loaded successfully:', data);
      return data;
    }
  });

  // Handle error in useEffect
  if (usersError) {
    console.error('Error fetching users:', usersError);
  }

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Успешно", description: "Пользователь удален" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить пользователя", variant: "destructive" });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/reset-password`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Успешно", 
        description: `Пароль сброшен. Новый пароль: ${data.newPassword}`,
        duration: 10000,
      });
      setResetPasswordUserId("");
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось сбросить пароль", variant: "destructive" });
    },
  });

  const handleDeleteUser = (userId: string, username: string) => {
    if (username === "admin") {
      toast({ 
        title: "Ошибка", 
        description: "Нельзя удалить администратора", 
        variant: "destructive" 
      });
      return;
    }
    
    if (confirm(`Вы уверены, что хотите удалить пользователя "${username}"? Это действие необратимо.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleResetPassword = (userId: string, username: string) => {
    if (confirm(`Вы уверены, что хотите сбросить пароль для пользователя "${username}"?`)) {
      resetPasswordMutation.mutate(userId);
    }
  };

  if (usersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Управление пользователями</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление пользователями</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {usersError && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            Ошибка загрузки пользователей: {usersError?.message || 'Неизвестная ошибка'}
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          Всего пользователей: <strong>{users?.length || 0}</strong>
        </div>

        {users && users.length > 0 && (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="border-2 border-muted">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-user text-primary"></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground">
                          <span className="truncate">{user.username}</span>
                          {user.username === "admin" && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Админ
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Создан: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(user.id, user.username)}
                        disabled={resetPasswordMutation.isPending}
                        data-testid={`button-reset-password-${user.id}`}
                        className="w-full sm:w-auto"
                      >
                        <i className="fas fa-key mr-2"></i>
                        <span className="hidden sm:inline">Сбросить пароль</span>
                        <span className="sm:hidden">Сброс пароля</span>
                      </Button>
                      
                      {user.username !== "admin" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          disabled={deleteUserMutation.isPending}
                          data-testid={`button-delete-user-${user.id}`}
                          className="w-full sm:w-auto"
                        >
                          <i className="fas fa-trash mr-2"></i>
                          Удалить
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {(!users || users.length === 0) && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Пользователи не найдены</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Subject Copy Component
function SubjectCopyManager({ currentVariantId }: { currentVariantId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [sourceVariantId, setSourceVariantId] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Get all blocks for source selection
  const { data: blocks } = useQuery<Block[]>({
    queryKey: ["/api/blocks"],
  });

  // Get variants for source selection
  const { data: sourceVariants } = useQuery<Variant[]>({
    queryKey: ["/api/blocks", sourceVariantId.split('_')[0], "variants"],
    enabled: !!sourceVariantId.includes('_'),
  });

  // Get subjects from source variant
  const { data: sourceSubjects } = useQuery<Subject[]>({
    queryKey: ["/api/variants", sourceVariantId, "subjects"],
    enabled: !!sourceVariantId && !sourceVariantId.includes('_'),
  });

  const copySubjectsMutation = useMutation({
    mutationFn: async (data: { sourceVariantId: string; targetVariantId: string; subjectIds: string[] }) => {
      const res = await apiRequest("POST", "/api/admin/copy-subjects", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/variants", currentVariantId, "subjects"] });
      toast({ 
        title: "Успешно", 
        description: `Скопировано ${selectedSubjects.length} предмет(ов) в текущий вариант` 
      });
      setSelectedSubjects([]);
      setSourceVariantId("");
    },
    onError: (error) => {
      console.error("Copy error:", error);
      toast({ 
        title: "Ошибка", 
        description: "Не удалось скопировать предметы", 
        variant: "destructive" 
      });
    },
  });

  const handleCopySubjects = () => {
    if (!sourceVariantId || selectedSubjects.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите источник и хотя бы один предмет",
        variant: "destructive"
      });
      return;
    }

    if (sourceVariantId === currentVariantId) {
      toast({
        title: "Ошибка", 
        description: "Нельзя копировать из того же варианта",
        variant: "destructive"
      });
      return;
    }

    copySubjectsMutation.mutate({
      sourceVariantId,
      targetVariantId: currentVariantId,
      subjectIds: selectedSubjects
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Selection */}
        <div className="space-y-2">
          <Label>Блок-источник</Label>
          <select
            className="w-full p-2 border border-border rounded-md bg-background"
            value={sourceVariantId.split('_')[0] || ""}
            onChange={(e) => {
              setSourceVariantId(e.target.value + '_block');
              setSelectedSubjects([]);
            }}
          >
            <option value="">Выберите блок...</option>
            {blocks?.map((block) => (
              <option key={block.id} value={block.id}>{block.name}</option>
            ))}
          </select>
        </div>

        {/* Variant Selection */}
        {sourceVariantId.includes('_') && sourceVariants && (
          <div className="space-y-2">
            <Label>Вариант-источник</Label>
            <select
              className="w-full p-2 border border-border rounded-md bg-background"
              value={sourceVariantId.includes('_') ? "" : sourceVariantId}
              onChange={(e) => {
                setSourceVariantId(e.target.value);
                setSelectedSubjects([]);
              }}
            >
              <option value="">Выберите вариант...</option>
              {sourceVariants.map((variant) => (
                <option key={variant.id} value={variant.id}>{variant.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Subject Selection */}
      {sourceSubjects && sourceSubjects.length > 0 && (
        <div className="space-y-2">
          <Label>Предметы для копирования</Label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-border rounded p-2 bg-muted/20">
            {sourceSubjects.map((subject) => (
              <label key={subject.id} className="flex items-center space-x-2 cursor-pointer hover:bg-accent/50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(subject.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSubjects([...selectedSubjects, subject.id]);
                    } else {
                      setSelectedSubjects(selectedSubjects.filter(id => id !== subject.id));
                    }
                  }}
                  className="rounded border-border"
                />
                <span className="text-sm">{subject.name}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Выбрано: {selectedSubjects.length} из {sourceSubjects.length}
            </div>
            <Button
              size="sm"
              onClick={handleCopySubjects}
              disabled={copySubjectsMutation.isPending || selectedSubjects.length === 0}
            >
              {copySubjectsMutation.isPending ? "Копирование..." : "Копировать"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

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
    mutationFn: async (data: { blockId: string; name: string; isFree?: boolean }) => {
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

  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId: string) => {
      await apiRequest("DELETE", `/api/variants/${variantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks", selectedBlock, "variants"] });
      toast({ title: "Успешно", description: "Вариант удален" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить вариант", variant: "destructive" });
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

  const deleteSubjectMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      await apiRequest("DELETE", `/api/subjects/${subjectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/variants", selectedVariant, "subjects"] });
      toast({ title: "Успешно", description: "Предмет удален" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить предмет", variant: "destructive" });
    },
  });

  // Question management
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [solutionImage, setSolutionImage] = useState<File | null>(null);
  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/subjects", selectedSubject, "questions"],
    enabled: !!selectedSubject,
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: { subjectId: string; text: string; imageUrl?: string; solutionImageUrl?: string }) => {
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

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      await apiRequest("DELETE", `/api/questions/${questionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects", selectedSubject, "questions"] });
      toast({ title: "Успешно", description: "Вопрос удален" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить вопрос", variant: "destructive" });
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

  const deleteAnswerMutation = useMutation({
    mutationFn: async (answerId: string) => {
      await apiRequest("DELETE", `/api/answers/${answerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions", selectedQuestion, "answers"] });
      toast({ title: "Успешно", description: "Ответ удален" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить ответ", variant: "destructive" });
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

  const handleCreateQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    let imageUrl = formData.get("imageUrl") as string || undefined;
    let solutionImageUrl = formData.get("solutionImageUrl") as string || undefined;
    
    // Если выбран файл изображения вопроса, загружаем его
    if (questionImage) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('image', questionImage);
        
        const uploadRes = await fetch('/api/upload/question-image', {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          imageUrl = url;
        } else {
          toast({ 
            title: "Ошибка", 
            description: "Не удалось загрузить изображение вопроса", 
            variant: "destructive" 
          });
          return;
        }
      } catch (error) {
        toast({ 
          title: "Ошибка", 
          description: "Не удалось загрузить изображение вопроса", 
          variant: "destructive" 
        });
        return;
      }
    }
    
    // Если выбран файл изображения решения, загружаем его
    if (solutionImage) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('image', solutionImage);
        
        const uploadRes = await fetch('/api/upload/question-image', {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          solutionImageUrl = url;
        } else {
          toast({ 
            title: "Ошибка", 
            description: "Не удалось загрузить изображение решения", 
            variant: "destructive" 
          });
          return;
        }
      } catch (error) {
        toast({ 
          title: "Ошибка", 
          description: "Не удалось загрузить изображение решения", 
          variant: "destructive" 
        });
        return;
      }
    }
    
    createQuestionMutation.mutate({
      subjectId: selectedSubject,
      text: formData.get("text") as string,
      imageUrl,
      solutionImageUrl,
    });
    
    setQuestionImage(null);
    setSolutionImage(null);
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1">
            <TabsTrigger value="blocks" data-testid="tab-blocks" className="text-xs md:text-sm">Блоки</TabsTrigger>
            <TabsTrigger value="variants" data-testid="tab-variants" className="text-xs md:text-sm">Варианты</TabsTrigger>
            <TabsTrigger value="subjects" data-testid="tab-subjects" className="text-xs md:text-sm">Предметы</TabsTrigger>
            <TabsTrigger value="questions" data-testid="tab-questions" className="text-xs md:text-sm">Вопросы</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users" className="text-xs md:text-sm col-span-2 md:col-span-1">Пользователи</TabsTrigger>
          </TabsList>

          <TabsContent value="blocks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Управление блоками</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleCreateBlock} className="space-y-4" data-testid="form-create-block">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="block-name">Название блока</Label>
                      <Input id="block-name" name="name" placeholder="Физика-Математика" required data-testid="input-block-name" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                      <div className="flex items-center space-x-2">
                        <Switch id="has-calculator" name="hasCalculator" />
                        <Label htmlFor="has-calculator">Калькулятор</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="has-periodic-table" name="hasPeriodicTable" />
                        <Label htmlFor="has-periodic-table">Таблица Менделеева</Label>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={createBlockMutation.isPending} data-testid="button-create-block" className="w-full sm:w-auto">
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
                      <div key={block.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-cube text-primary"></i>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-foreground truncate">{block.name}</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {block.hasCalculator && (
                                <Badge variant="secondary" className="text-xs">
                                  <i className="fas fa-calculator mr-1"></i>
                                  <span className="hidden xs:inline">Калькулятор</span>
                                  <span className="xs:hidden">Калк.</span>
                                </Badge>
                              )}
                              {block.hasPeriodicTable && (
                                <Badge variant="secondary" className="text-xs">
                                  <i className="fas fa-table mr-1"></i>
                                  <span className="hidden xs:inline">Таблица</span>
                                  <span className="xs:hidden">Табл.</span>
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
                          className="self-end sm:self-center"
                        >
                          <i className="fas fa-trash mr-2 sm:mr-0"></i>
                          <span className="sm:hidden">Удалить</span>
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
                            {variant.isFree && (
                              <Badge variant="secondary" className="text-xs ml-2">
                                Бесплатный
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Удалить вариант "${variant.name}"? Все предметы и вопросы этого варианта также будут удалены.`)) {
                              deleteVariantMutation.mutate(variant.id);
                            }
                          }}
                          disabled={deleteVariantMutation.isPending}
                        >
                          <i className="fas fa-trash mr-2"></i>
                          Удалить
                        </Button>
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
                  <div className="space-y-4">
                    <form onSubmit={handleCreateSubject} className="space-y-4" data-testid="form-create-subject">
                      <div className="space-y-2">
                        <Label htmlFor="subject-name">Название предмета</Label>
                        <Input id="subject-name" name="name" placeholder="Физика" required data-testid="input-subject-name" />
                      </div>
                      <Button type="submit" disabled={createSubjectMutation.isPending} data-testid="button-create-subject">
                        {createSubjectMutation.isPending ? "Создание..." : "Создать предмет"}
                      </Button>
                    </form>

                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-4">Копирование предметов</h3>
                      <SubjectCopyManager currentVariantId={selectedVariant} />
                    </div>
                  </div>
                )}

                {subjects && subjects.length > 0 && (
                  <div className="space-y-4">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <i className="fas fa-book text-blue-500"></i>
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{subject.name}</h3>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Удалить предмет "${subject.name}"? Все вопросы этого предмета также будут удалены.`)) {
                              deleteSubjectMutation.mutate(subject.id);
                            }
                          }}
                          disabled={deleteSubjectMutation.isPending}
                        >
                          <i className="fas fa-trash mr-2"></i>
                          Удалить
                        </Button>
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="question-image-file">Загрузить изображение</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="question-image-file" 
                          type="file"
                          accept="image/*"
                          onChange={(e) => setQuestionImage(e.target.files?.[0] || null)}
                          className="flex-1"
                        />
                        {questionImage && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setQuestionImage(null)}
                          >
                            <i className="fas fa-times"></i>
                          </Button>
                        )}
                      </div>
                      {questionImage && (
                        <p className="text-xs text-green-600">
                          <i className="fas fa-check mr-1"></i>
                          Выбран файл: {questionImage.name}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="question-image">Или введите URL изображения</Label>
                      <Input 
                        id="question-image" 
                        name="imageUrl" 
                        type="url"
                        placeholder="https://example.com/image.png" 
                        disabled={!!questionImage}
                        data-testid="input-question-image"
                      />
                      <p className="text-xs text-muted-foreground">
                        <i className="fas fa-info-circle mr-1"></i>
                        Можно либо загрузить файл, либо вставить ссылку
                      </p>
                    </div>
                    
                    {/* Изображение решения */}
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-medium text-sm">
                        <i className="fas fa-lightbulb mr-2 text-yellow-500"></i>
                        Изображение решения (показывается после теста)
                      </h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="solution-image-file">Загрузить изображение решения</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="solution-image-file" 
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSolutionImage(e.target.files?.[0] || null)}
                            className="flex-1"
                          />
                          {solutionImage && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSolutionImage(null)}
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          )}
                        </div>
                        {solutionImage && (
                          <p className="text-xs text-green-600">
                            <i className="fas fa-check mr-1"></i>
                            Выбран файл: {solutionImage.name}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="solution-image">Или введите URL изображения решения</Label>
                        <Input 
                          id="solution-image" 
                          name="solutionImageUrl" 
                          type="url"
                          placeholder="https://example.com/solution.png" 
                          disabled={!!solutionImage}
                        />
                        <p className="text-xs text-muted-foreground">
                          <i className="fas fa-info-circle mr-1"></i>
                          Это изображение будет показано пользователю после завершения теста
                        </p>
                      </div>
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
                              {question.imageUrl && (
                                <div className="mt-3">
                                  <img 
                                    src={question.imageUrl} 
                                    alt="Изображение вопроса" 
                                    className="max-w-md rounded-lg border shadow-sm"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.insertAdjacentHTML('afterend', '<p class="text-sm text-red-500"><i class="fas fa-exclamation-triangle mr-1"></i>Ошибка загрузки изображения</p>');
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedQuestion(selectedQuestion === question.id ? "" : question.id)}
                                data-testid={`button-manage-answers-${question.id}`}
                              >
                                <i className="fas fa-edit mr-2"></i>
                                Управлять ответами
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Удалить вопрос "${question.text.substring(0, 50)}..."? Все ответы также будут удалены.`)) {
                                    deleteQuestionMutation.mutate(question.id);
                                  }
                                }}
                                disabled={deleteQuestionMutation.isPending}
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
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
                                    <div className="flex items-center gap-2">
                                      {answer.isCorrect && (
                                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                          <i className="fas fa-check mr-1"></i>
                                          Правильный
                                        </Badge>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          if (confirm(`Удалить ответ "${answer.text}"?`)) {
                                            deleteAnswerMutation.mutate(answer.id);
                                          }
                                        }}
                                        disabled={deleteAnswerMutation.isPending}
                                      >
                                        <i className="fas fa-trash text-destructive"></i>
                                      </Button>
                                    </div>
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


          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          {/* Video recordings content removed */}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
