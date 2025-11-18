/**
 * ContentManager - Иерархическая структура контента
 * 
 * СТРУКТУРА:
 * 
 * 📦 БЛОКИ (Blocks)
 *    └─ Тематические группы тестов (пример: "Физика+Математика", "2025", "ЕНТ 2026")
 *       └─ Настройки: калькулятор, таблица Менделеева
 * 
 *       📝 ВАРИАНТЫ (Variants)
 *          └─ Тестовые работы внутри блока (пример: "Вариант 1", "Вариант 2")
 *             └─ Статус: бесплатный/платный
 * 
 *             📚 ПРЕДМЕТЫ (Subjects)
 *                └─ Дисциплины внутри варианта (пример: "Математика", "Физика", "История Казахстана")
 * 
 *                   ❓ ВОПРОСЫ (Questions)
 *                      └─ Тестовые задания по предмету (текст вопроса + варианты ответов)
 * 
 * НАВИГАЦИЯ: Блоки → Варианты → Предметы → Вопросы
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChevronRight, ChevronDown, Plus, Trash2, Edit, GripVertical, Calculator, Atom, Upload } from "lucide-react";
import type { Block, Variant, Subject, Question, Answer } from "@shared/schema";



// Sortable Drag Handle Component
// Компонент SortableCard с drag-and-drop логикой
interface SortableCardProps {
  id: string;
  children: (props: { attributes: any, listeners: any }) => React.ReactNode;
}

function SortableCard({ id, children }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card className={`transition-shadow ${isDragging ? 'shadow-lg' : 'hover:shadow-md'}`}>
        <CardContent className="p-0">
          {children({ attributes, listeners })}
        </CardContent>
      </Card>
    </div>
  );
}

// Variants View Component
interface VariantsViewProps {
  block: Block;
  onSelectVariant: (variant: Variant) => void;
}

function VariantsView({ block, onSelectVariant }: VariantsViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [newVariantName, setNewVariantName] = useState("");
  const [isFree, setIsFree] = useState(true);

  const { data: variants = [], isLoading } = useQuery({
    queryKey: [`/api/blocks/${block.id}/variants`],
    queryFn: async (): Promise<Variant[]> => {
      const res = await apiRequest("GET", `/api/blocks/${block.id}/variants`);
      return await res.json();
    },
  });

  const createVariantMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/variants", {
        name: newVariantName,
        blockId: block.id,
        isFree,
      });
    },
    onSuccess: () => {
      // Issue #4: Comprehensive query invalidation for real-time updates
      queryClient.invalidateQueries({ queryKey: [`/api/blocks/${block.id}/variants`] });
      queryClient.invalidateQueries({ queryKey: ["/api/blocks", block.id, "variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/blocks"] });
      setNewVariantName("");
      setIsFree(true);
      toast({ title: "Успешно", description: "Вариант создан" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось создать вариант", variant: "destructive" });
    },
  });

  const updateVariantMutation = useMutation({
    mutationFn: async (variant: Variant) => {
      await apiRequest("PUT", `/api/variants/${variant.id}`, variant);
    },
    onSuccess: () => {
      // Issue #4: Comprehensive query invalidation for real-time updates
      queryClient.invalidateQueries({ queryKey: [`/api/blocks/${block.id}/variants`] });
      queryClient.invalidateQueries({ queryKey: ["/api/blocks", block.id, "variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/blocks"] });
      setEditingVariant(null);
      toast({ title: "Успешно", description: "Вариант обновлен" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить вариант", variant: "destructive" });
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId: string) => {
      await apiRequest("DELETE", `/api/variants/${variantId}`);
    },
    onSuccess: () => {
      // Issue #4: Comprehensive query invalidation for real-time updates
      queryClient.invalidateQueries({ queryKey: [`/api/blocks/${block.id}/variants`] });
      queryClient.invalidateQueries({ queryKey: ["/api/blocks", block.id, "variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/blocks"] });
      toast({ title: "Успешно", description: "Вариант удален" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить вариант", variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await apiRequest("POST", "/api/variants/reorder", { blockId: block.id, ids });
    },
    onSuccess: () => {
      // Invalidate both possible query keys for variants
      queryClient.invalidateQueries({ queryKey: [`/api/blocks/${block.id}/variants`] });
      queryClient.invalidateQueries({ queryKey: ["/api/blocks", block.id, "variants"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/blocks/${block.id}/variants`] });
      queryClient.invalidateQueries({ queryKey: ["/api/blocks", block.id, "variants"] });
      toast({ title: "Ошибка", description: "Не удалось изменить порядок", variant: "destructive" });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = variants.findIndex((v) => v.id === active.id);
      const newIndex = variants.findIndex((v) => v.id === over.id);

      const newVariants = arrayMove(variants, oldIndex, newIndex);
      queryClient.setQueryData([`/api/blocks/${block.id}/variants`], newVariants);
      reorderMutation.mutate(newVariants.map((v) => v.id));
    }
  };

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  return (
    <div className="space-y-6">


      {/* Add Variant Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Добавить вариант
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать вариант</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="variantName">Название варианта</Label>
              <Input
                id="variantName"
                value={newVariantName}
                onChange={(e) => setNewVariantName(e.target.value)}
                placeholder="Введите название"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isFree"
                checked={isFree}
                onCheckedChange={setIsFree}
              />
              <Label htmlFor="isFree">Бесплатный</Label>
            </div>
            <Button
              onClick={() => createVariantMutation.mutate()}
              disabled={!newVariantName.trim() || createVariantMutation.isPending}
              className="w-full"
            >
              Создать
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variants List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={variants.map((v) => v.id)}
          strategy={verticalListSortingStrategy}
        >
          {variants.map((variant) => (
            <SortableCard key={variant.id} id={variant.id}>
              {({ attributes, listeners }) => (
                <div className="flex items-center gap-2 min-h-[60px] w-full">
                  {/* Drag handle - отдельная кликабельная область */}
                  <div 
                    className="cursor-grab active:cursor-grabbing p-2 flex items-center self-stretch" 
                    {...attributes} 
                    {...listeners}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  {/* Основная кликабельная область - занимает все доступное пространство */}
                  <div 
                    className="flex-1 flex items-center gap-2 cursor-pointer hover:text-primary hover:bg-muted/50 rounded-md transition-colors self-stretch px-3"
                    onClick={() => onSelectVariant(variant)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{variant.name}</div>
                      <Badge variant={variant.isFree ? "outline" : "default"} className="text-xs">
                        {variant.isFree ? "Бесплатный" : "Платный"}
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                  
                  {/* Кнопки действий - отдельная область */}
                  <div className="flex gap-1 flex-shrink-0 pr-2">
                <Dialog open={editingVariant?.id === variant.id} onOpenChange={(open) => !open && setEditingVariant(null)}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingVariant(variant);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Редактировать вариант</DialogTitle>
                    </DialogHeader>
                    {editingVariant && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="editVariantName">Название варианта</Label>
                          <Input
                            id="editVariantName"
                            value={editingVariant.name}
                            onChange={(e) =>
                              setEditingVariant({ ...editingVariant, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="editIsFree"
                            checked={editingVariant.isFree ?? false}
                            onCheckedChange={(checked) =>
                              setEditingVariant({ ...editingVariant, isFree: checked })
                            }
                          />
                          <Label htmlFor="editIsFree">Бесплатный</Label>
                        </div>
                        <Button
                          onClick={() => updateVariantMutation.mutate(editingVariant)}
                          disabled={updateVariantMutation.isPending}
                          className="w-full"
                        >
                          Сохранить
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Удалить вариант "${variant.name}"?`)) {
                      deleteVariantMutation.mutate(variant.id);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                  </div>
                </div>
              )}
            </SortableCard>
          ))}
        </SortableContext>
      </DndContext>

      {variants.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          Нет вариантов. Создайте первый вариант.
        </div>
      )}
    </div>
  );
}

// Subjects View Component
interface SubjectsViewProps {
  variant: Variant;
  onSelectSubject: (subject: Subject) => void;
}

function SubjectsView({ variant, onSelectSubject }: SubjectsViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [bulkImportJson, setBulkImportJson] = useState("");
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: [`/api/variants/${variant.id}/subjects`],
    queryFn: async (): Promise<Subject[]> => {
      const res = await apiRequest("GET", `/api/variants/${variant.id}/subjects`);
      return await res.json();
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/subjects", {
        name: newSubjectName,
        variantId: variant.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/variants/${variant.id}/subjects`] });
      setNewSubjectName("");
      toast({ title: "Успешно", description: "Предмет создан" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось создать предмет", variant: "destructive" });
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: async (subject: Subject) => {
      await apiRequest("PUT", `/api/subjects/${subject.id}`, subject);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/variants/${variant.id}/subjects`] });
      setEditingSubject(null);
      toast({ title: "Успешно", description: "Предмет обновлен" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить предмет", variant: "destructive" });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      await apiRequest("DELETE", `/api/subjects/${subjectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/variants/${variant.id}/subjects`] });
      toast({ title: "Успешно", description: "Предмет удален" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить предмет", variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await apiRequest("POST", "/api/subjects/reorder", { variantId: variant.id, ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/variants/${variant.id}/subjects`] });
      queryClient.invalidateQueries({ queryKey: ["/api/variants", variant.id, "test"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/variants", variant.id, "test"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/variants/${variant.id}/subjects`] });
      toast({ title: "Ошибка", description: "Не удалось изменить порядок", variant: "destructive" });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (bulkData: any) => {
      const response = await apiRequest("POST", "/api/subjects/bulk-import", { 
        variantId: variant.id, 
        bulkData 
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/variants/${variant.id}/subjects`] });
      setBulkImportJson("");
      setBulkImportOpen(false);
      toast({ 
        title: "Успешно", 
        description: `Предмет "${data.subject.name}" создан с ${data.questionsCount} вопросами` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось импортировать данные", 
        variant: "destructive" 
      });
    },
  });

  const handleBulkImport = async () => {
    try {
      if (!bulkImportJson.trim()) {
        toast({ title: "Ошибка", description: "Введите JSON данные", variant: "destructive" });
        return;
      }

      const bulkData = JSON.parse(bulkImportJson);
      
      // Basic validation
      if (!bulkData.name || !Array.isArray(bulkData.questions)) {
        toast({ title: "Ошибка", description: "Неверная структура JSON", variant: "destructive" });
        return;
      }

      bulkImportMutation.mutate(bulkData);
    } catch (error) {
      toast({ title: "Ошибка", description: "Неверный JSON формат", variant: "destructive" });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = subjects.findIndex((s) => s.id === active.id);
      const newIndex = subjects.findIndex((s) => s.id === over.id);

      const newSubjects = arrayMove(subjects, oldIndex, newIndex);
      queryClient.setQueryData([`/api/variants/${variant.id}/subjects`], newSubjects);
      reorderMutation.mutate(newSubjects.map((s) => s.id));
    }
  };

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  return (
    <div className="space-y-6">


      {/* Add Subject Buttons */}
      <div className="flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex-1">
              <Plus className="mr-2 h-4 w-4" />
              Добавить предмет
            </Button>
          </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать предмет</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subjectName">Название предмета</Label>
              <Input
                id="subjectName"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Введите название"
              />
            </div>
            <Button
              onClick={() => createSubjectMutation.mutate()}
              disabled={!newSubjectName.trim() || createSubjectMutation.isPending}
              className="w-full"
            >
              Создать
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex-1">
            <Upload className="mr-2 h-4 w-4" />
            Массовая загрузка
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Массовая загрузка предмета</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkJson">JSON данные</Label>
              <textarea
                id="bulkJson"
                value={bulkImportJson}
                onChange={(e) => setBulkImportJson(e.target.value)}
                className="w-full h-64 p-3 border rounded-md font-mono text-sm"
                placeholder={`{
  "name": "Физика",
  "questions": [
    {
      "text": "Какая формула описывает закон Ома?",
      "answers": [
        { "text": "I = U/R", "isCorrect": true },
        { "text": "U = I/R", "isCorrect": false },
        { "text": "R = U*I", "isCorrect": false },
        { "text": "P = U*I", "isCorrect": false },
        { "text": "V = I*R", "isCorrect": false }
      ]
    }
  ]
}`}
              />
            </div>
            <Button 
              onClick={handleBulkImport}
              disabled={bulkImportMutation.isPending}
              className="w-full"
            >
              {bulkImportMutation.isPending ? "Импортирование..." : "Импортировать предмет"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

      {/* Subjects List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={subjects.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {subjects.map((subject) => (
            <SortableCard key={subject.id} id={subject.id}>
              {({ attributes, listeners }) => (
                <div className="flex items-center gap-2 min-h-[60px] w-full">
                  {/* Drag handle - отдельная кликабельная область */}
                  <div 
                    className="cursor-grab active:cursor-grabbing p-2 flex items-center self-stretch" 
                    {...attributes} 
                    {...listeners}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  {/* Основная кликабельная область - занимает все доступное пространство */}
                  <div 
                    className="flex-1 flex items-center gap-2 cursor-pointer hover:text-primary hover:bg-muted/50 rounded-md transition-colors self-stretch px-3"
                    onClick={() => onSelectSubject(subject)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{subject.name}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                  
                  {/* Кнопки действий - отдельная область */}
                  <div className="flex gap-1 flex-shrink-0 pr-2">
                <Dialog open={editingSubject?.id === subject.id} onOpenChange={(open) => !open && setEditingSubject(null)}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSubject(subject);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Редактировать предмет</DialogTitle>
                    </DialogHeader>
                    {editingSubject && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="editSubjectName">Название предмета</Label>
                          <Input
                            id="editSubjectName"
                            value={editingSubject.name}
                            onChange={(e) =>
                              setEditingSubject({ ...editingSubject, name: e.target.value })
                            }
                          />
                        </div>
                        <Button
                          onClick={() => updateSubjectMutation.mutate(editingSubject)}
                          disabled={updateSubjectMutation.isPending}
                          className="w-full"
                        >
                          Сохранить
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Удалить предмет "${subject.name}"?`)) {
                      deleteSubjectMutation.mutate(subject.id);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                  </div>
                </div>
              )}
            </SortableCard>
          ))}
        </SortableContext>
      </DndContext>

      {subjects.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          Нет предметов. Создайте первый предмет.
        </div>
      )}
    </div>
  );
}

// Questions View Component
interface QuestionsViewProps {
  subject: Subject;
  variant: Variant;
  onSelectQuestion: (question: Question) => void;
}

function QuestionsView({ subject, variant, onSelectQuestion }: QuestionsViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [editingAnswer, setEditingAnswer] = useState<Answer | null>(null);
  const [editAnswerText, setEditAnswerText] = useState("");
  const [showAddAnswerDialog, setShowAddAnswerDialog] = useState(false);
  const [selectedQuestionForAnswer, setSelectedQuestionForAnswer] = useState<Question | null>(null);
  const [newAnswerText, setNewAnswerText] = useState("");

  const { data: questions = [], isLoading } = useQuery({
    queryKey: [`/api/subjects/${subject.id}/questions`],
    queryFn: async (): Promise<Question[]> => {
      const res = await apiRequest("GET", `/api/subjects/${subject.id}/questions`);
      return await res.json();
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/questions", {
        text: "Новый вопрос",
        subjectId: subject.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subjects/${subject.id}/questions`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/subjects/${subject.id}/questions`] });
      toast({ title: "Успешно", description: "Вопрос удален" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить вопрос", variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await apiRequest("POST", "/api/questions/reorder", { subjectId: subject.id, ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subjects/${subject.id}/questions`] });
      queryClient.invalidateQueries({ queryKey: ["/api/variants", variant.id, "test"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/variants", variant.id, "test"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subjects/${subject.id}/questions`] });
      toast({ title: "Ошибка", description: "Не удалось изменить порядок", variant: "destructive" });
    },
  });

  const reorderAnswersMutation = useMutation({
    mutationFn: async ({ questionId, answerIds }: { questionId: string; answerIds: string[] }) => {
      await apiRequest("PUT", `/api/questions/${questionId}/reorder-answers`, { answerIds });
    },
    onSuccess: (_, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}/answers`] });
      toast({ title: "Успешно", description: "Порядок ответов изменен" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось изменить порядок ответов", variant: "destructive" });
    },
  });

  const toggleAnswerCorrectness = useMutation({
    mutationFn: async ({ answerId, isCorrect }: { answerId: string; isCorrect: boolean }) => {
      await apiRequest("PUT", `/api/answers/${answerId}`, { isCorrect });
    },
    onSuccess: () => {
      // Перезагружаем ответы для всех раскрытых вопросов
      expandedQuestions.forEach(questionId => {
        queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}/answers`] });
      });
      toast({ title: "Успешно", description: "Правильность ответа изменена" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось изменить правильность ответа", variant: "destructive" });
    },
  });

  const deleteAnswerMutation = useMutation({
    mutationFn: async (answerId: string) => {
      await apiRequest("DELETE", `/api/answers/${answerId}`);
    },
    onSuccess: () => {
      // Перезагружаем ответы для всех раскрытых вопросов
      expandedQuestions.forEach(questionId => {
        queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}/answers`] });
      });
      toast({ title: "Успешно", description: "Ответ удален" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить ответ", variant: "destructive" });
    },
  });

  const editAnswerMutation = useMutation({
    mutationFn: async ({ answerId, text }: { answerId: string; text: string }) => {
      await apiRequest("PUT", `/api/answers/${answerId}`, { text });
    },
    onSuccess: () => {
      // Перезагружаем ответы для всех раскрытых вопросов
      expandedQuestions.forEach(questionId => {
        queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}/answers`] });
      });
      setEditingAnswer(null);
      setEditAnswerText("");
      toast({ title: "Успешно", description: "Ответ обновлен" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить ответ", variant: "destructive" });
    },
  });

  const createAnswerMutation = useMutation({
    mutationFn: async ({ questionId, text }: { questionId: string; text: string }) => {
      await apiRequest("POST", "/api/answers", {
        text,
        questionId,
        isCorrect: false
      });
    },
    onSuccess: () => {
      // Перезагружаем ответы для всех раскрытых вопросов
      expandedQuestions.forEach(questionId => {
        queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}/answers`] });
      });
      setShowAddAnswerDialog(false);
      setSelectedQuestionForAnswer(null);
      setNewAnswerText("");
      toast({ title: "Успешно", description: "Ответ добавлен" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось добавить ответ", variant: "destructive" });
    },
  });

  const handleEditAnswer = (answer: Answer) => {
    setEditingAnswer(answer);
    setEditAnswerText(answer.text);
  };

  const handleSaveAnswer = () => {
    if (editingAnswer && editAnswerText.trim()) {
      editAnswerMutation.mutate({ 
        answerId: editingAnswer.id, 
        text: editAnswerText.trim() 
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingAnswer(null);
    setEditAnswerText("");
  };

  const handleAddAnswer = (question: Question) => {
    setSelectedQuestionForAnswer(question);
    setShowAddAnswerDialog(true);
  };

  const handleSaveNewAnswer = () => {
    if (selectedQuestionForAnswer && newAnswerText.trim()) {
      createAnswerMutation.mutate({ 
        questionId: selectedQuestionForAnswer.id, 
        text: newAnswerText.trim() 
      });
    }
  };

  const handleCancelAddAnswer = () => {
    setShowAddAnswerDialog(false);
    setSelectedQuestionForAnswer(null);
    setNewAnswerText("");
  };

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      queryClient.setQueryData([`/api/subjects/${subject.id}/questions`], newQuestions);
      reorderMutation.mutate(newQuestions.map((q) => q.id));
    }
  };

  // Component for individual question with answers
  const QuestionWithAnswers = ({ question, attributes, listeners }: { question: Question, attributes: any, listeners: any }) => {
    const isExpanded = expandedQuestions.has(question.id);
    
    const { data: answers = [] } = useQuery({
      queryKey: [`/api/questions/${question.id}/answers`],
      queryFn: async (): Promise<Answer[]> => {
        const res = await apiRequest("GET", `/api/questions/${question.id}/answers`);
        return await res.json();
      },
      enabled: isExpanded,
    });

    const answerSensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8,
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const handleAnswerDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id && answers) {
        const oldIndex = answers.findIndex((answer) => answer.id === active.id);
        const newIndex = answers.findIndex((answer) => answer.id === over?.id);

        const newAnswers = arrayMove(answers, oldIndex, newIndex);
        const answerIds = newAnswers.map((answer) => answer.id);
        
        // Оптимистическое обновление
        queryClient.setQueryData([`/api/questions/${question.id}/answers`], newAnswers);
        reorderAnswersMutation.mutate({ questionId: question.id, answerIds });
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 min-h-[60px] w-full">
          {/* Drag handle - отдельная кликабельная область */}
          <div 
            className="cursor-grab active:cursor-grabbing p-2 flex items-center self-stretch" 
            {...attributes} 
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Основная кликабельная область - занимает все доступное пространство */}
          <button
            className="flex-1 flex items-center gap-2 text-left cursor-pointer hover:text-primary hover:bg-muted/50 rounded-md transition-colors self-stretch px-3"
            onClick={() => toggleQuestion(question.id)}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
            <div className="text-sm line-clamp-2 flex-1">{question.text}</div>
          </button>
          
          {/* Кнопки действий - отдельная область */}
          <div className="flex gap-1 flex-shrink-0 pr-2">
            <Button
              variant="destructive"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Удалить вопрос?")) {
                  deleteQuestionMutation.mutate(question.id);
                }
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
              </div>
        </div>
        
        {isExpanded && (
          <div className="ml-6 space-y-2">
            {answers.length > 0 ? (
              <DndContext
                sensors={answerSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleAnswerDragEnd}
              >
                <SortableContext
                  items={answers.map((answer) => answer.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {answers.map((answer) => (
                    <QuestionSortableAnswerItem
                      key={answer.id}
                      answer={answer}
                      onDelete={deleteAnswerMutation.mutate}
                      onToggleCorrect={(id, isCorrect) => 
                        toggleAnswerCorrectness.mutate({ answerId: id, isCorrect })
                      }
                      onEdit={handleEditAnswer}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Нет ответов для этого вопроса
              </div>
            )}
            
            {/* Add Answer Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => handleAddAnswer(question)}
            >
              <Plus className="mr-2 h-3 w-3" />
              Добавить ответ
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  return (
    <div className="space-y-6">


      {/* Add Question Button */}
      <Button
        className="w-full"
        onClick={() => createQuestionMutation.mutate()}
        disabled={createQuestionMutation.isPending}
      >
        <Plus className="mr-2 h-4 w-4" />
        Добавить вопрос
      </Button>

      {/* Questions List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questions.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          {questions.map((question) => (
            <SortableCard key={question.id} id={question.id}>
              {({ attributes, listeners }) => (
                <QuestionWithAnswers question={question} attributes={attributes} listeners={listeners} />
              )}
            </SortableCard>
          ))}
        </SortableContext>
      </DndContext>

      {questions.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          Нет вопросов. Создайте первый вопрос.
        </div>
      )}

      {/* Edit Answer Dialog */}
      <Dialog open={!!editingAnswer} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать ответ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="answer-text">Текст ответа</Label>
              <Input
                id="answer-text"
                value={editAnswerText}
                onChange={(e) => setEditAnswerText(e.target.value)}
                placeholder="Введите текст ответа"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancelEdit}>
                Отмена
              </Button>
              <Button 
                onClick={handleSaveAnswer}
                disabled={!editAnswerText.trim() || editAnswerMutation.isPending}
              >
                {editAnswerMutation.isPending ? "Сохраняется..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Answer Dialog */}
      <Dialog open={showAddAnswerDialog} onOpenChange={(open) => !open && handleCancelAddAnswer()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить ответ</DialogTitle>
            {selectedQuestionForAnswer && (
              <p className="text-sm text-muted-foreground">
                К вопросу: {selectedQuestionForAnswer.text.substring(0, 100)}
                {selectedQuestionForAnswer.text.length > 100 ? '...' : ''}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-answer-text">Текст ответа</Label>
              <Input
                id="new-answer-text"
                value={newAnswerText}
                onChange={(e) => setNewAnswerText(e.target.value)}
                placeholder="Введите текст ответа"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newAnswerText.trim()) {
                    handleSaveNewAnswer();
                  }
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancelAddAnswer}>
                Отмена
              </Button>
              <Button 
                onClick={handleSaveNewAnswer}
                disabled={!newAnswerText.trim() || createAnswerMutation.isPending}
              >
                {createAnswerMutation.isPending ? "Добавляется..." : "Добавить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



// Sortable Answer Item Component for Questions View
function QuestionSortableAnswerItem({
  answer,
  onDelete,
  onToggleCorrect,
  onEdit,
}: {
  answer: Answer;
  onDelete: (id: string) => void;
  onToggleCorrect: (id: string, isCorrect: boolean) => void;
  onEdit?: (answer: Answer) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: answer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-2 bg-muted/30 rounded-lg border ${
        isDragging ? 'shadow-lg border-primary' : 'border-border'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      
      <button
        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors p-2 min-h-[32px] min-w-[32px] ${
          answer.isCorrect 
            ? 'bg-green-500 border-green-500' 
            : 'bg-gray-300 border-gray-300 hover:border-green-400'
        }`}
        onClick={() => onToggleCorrect(answer.id, !answer.isCorrect)}
        title={answer.isCorrect ? "Правильный ответ" : "Неправильный ответ"}
      >
        {answer.isCorrect && <div className="h-2 w-2 bg-white rounded-full" />}
      </button>
      
      <span className="text-sm flex-1">{answer.text}</span>
      
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-2 min-h-[32px] min-w-[32px]"
          onClick={() => onEdit(answer)}
          title="Редактировать ответ"
        >
          <Edit className="h-3 w-3" />
        </Button>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-2 min-h-[32px] min-w-[32px] text-destructive hover:text-destructive"
        onClick={() => onDelete(answer.id)}
        title="Удалить ответ"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Original Sortable Answer Item Component for Question Editor
function SortableAnswerItem({
  answer,
  onDelete,
}: {
  answer: Answer;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: answer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-muted/30 rounded-lg border ${
        isDragging ? 'shadow-lg border-primary' : 'border-border'
      }`}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className={`h-3 w-3 rounded-full ${answer.isCorrect ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <span className="text-sm flex-1">{answer.text}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        onClick={() => onDelete(answer.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Question Editor Component
interface QuestionEditorProps {
  question: Question;
  subject: Subject;
  onBack: () => void;
}

function QuestionEditor({ question, subject, onBack }: QuestionEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAnswers, setShowAnswers] = useState(false);

  const { data: answers = [], isLoading: answersLoading } = useQuery({
    queryKey: [`/api/questions/${question.id}/answers`],
    queryFn: async (): Promise<Answer[]> => {
      const res = await apiRequest("GET", `/api/questions/${question.id}/answers`);
      return await res.json();
    },
    enabled: showAnswers,
  });

  const reorderAnswersMutation = useMutation({
    mutationFn: async (answerIds: string[]) => {
      await apiRequest("PUT", `/api/questions/${question.id}/reorder-answers`, { answerIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${question.id}/answers`] });
      toast({ title: "Успешно", description: "Порядок ответов изменен" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось изменить порядок ответов", variant: "destructive" });
    },
  });

  const deleteAnswerMutation = useMutation({
    mutationFn: async (answerId: string) => {
      await apiRequest("DELETE", `/api/answers/${answerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${question.id}/answers`] });
      toast({ title: "Успешно", description: "Ответ удален" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить ответ", variant: "destructive" });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && answers) {
      const oldIndex = answers.findIndex((answer) => answer.id === active.id);
      const newIndex = answers.findIndex((answer) => answer.id === over?.id);

      const newAnswers = arrayMove(answers, oldIndex, newIndex);
      const answerIds = newAnswers.map((answer) => answer.id);
      
      // Оптимистическое обновление
      queryClient.setQueryData([`/api/questions/${question.id}/answers`], newAnswers);
      reorderAnswersMutation.mutate(answerIds);
    }
  };

  const toggleAnswers = () => {
    setShowAnswers(!showAnswers);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline">
          ← Назад к вопросам
        </Button>
      </div>

      {/* Question Card */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Текст вопроса</label>
              <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">{question.text}</p>
              </div>
            </div>

            {/* Issue #6: Image Upload Section */}
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-muted-foreground">Изображение вопроса</label>
              <div className="mt-2 space-y-2">
                {question.imageUrl && (
                  <div className="relative inline-block">
                    <img 
                      src={question.imageUrl} 
                      alt="Question image" 
                      className="max-w-xs rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        // TODO: Implement image removal
                        toast({ title: "Функция в разработке", description: "Удаление изображения будет добавлено" });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('image', file);
                        
                        try {
                          const res = await fetch('/api/upload/question-image', {
                            method: 'POST',
                            body: formData,
                            credentials: 'include'
                          });
                          
                          if (!res.ok) throw new Error('Upload failed');
                          
                          const data = await res.json();
                          
                          // Update question with image URL
                          await apiRequest("PUT", `/api/questions/${question.id}`, {
                            ...question,
                            imageUrl: data.url
                          });
                          
                          queryClient.invalidateQueries({ queryKey: [`/api/subjects/${subject.id}/questions`] });
                          toast({ title: "Успешно", description: "Изображение загружено" });
                        } catch (error) {
                          toast({ 
                            title: "Ошибка", 
                            description: "Не удалось загрузить изображение", 
                            variant: "destructive" 
                          });
                        }
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Загрузите изображение для вопроса (макс. 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Solution Image Upload */}
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-muted-foreground">Изображение решения</label>
              <div className="mt-2 space-y-2">
                {question.solutionImageUrl && (
                  <div className="relative inline-block">
                    <img 
                      src={question.solutionImageUrl} 
                      alt="Solution image" 
                      className="max-w-xs rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        // TODO: Implement solution image removal
                        toast({ title: "Функция в разработке", description: "Удаление изображения будет добавлено" });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('image', file);
                        
                        try {
                          const res = await fetch('/api/upload/question-image', {
                            method: 'POST',
                            body: formData,
                            credentials: 'include'
                          });
                          
                          if (!res.ok) throw new Error('Upload failed');
                          
                          const data = await res.json();
                          
                          // Update question with solution image URL
                          await apiRequest("PUT", `/api/questions/${question.id}`, {
                            ...question,
                            solutionImageUrl: data.url
                          });
                          
                          queryClient.invalidateQueries({ queryKey: [`/api/subjects/${subject.id}/questions`] });
                          toast({ title: "Успешно", description: "Изображение решения загружено" });
                        } catch (error) {
                          toast({ 
                            title: "Ошибка", 
                            description: "Не удалось загрузить изображение", 
                            variant: "destructive" 
                          });
                        }
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Загрузите изображение решения (показывается после теста)
                  </p>
                </div>
              </div>
            </div>

            {/* Answers Toggle */}
            <div className="border-t pt-4">
              <Button
                variant="ghost"
                className="w-full justify-between p-3 hover:bg-muted/50"
                onClick={toggleAnswers}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Варианты ответов</span>
                  <Badge variant="secondary">{answers.length}</Badge>
                </div>
                {showAnswers ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>

              {/* Answers List */}
              {showAnswers && (
                <div className="mt-4 space-y-3">
                  {answersLoading ? (
                    <div className="text-center py-4">
                      <div className="text-sm text-muted-foreground">Загрузка ответов...</div>
                    </div>
                  ) : answers.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={answers.map((answer) => answer.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {answers.map((answer) => (
                          <SortableAnswerItem
                            key={answer.id}
                            answer={answer}
                            onDelete={deleteAnswerMutation.mutate}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Нет вариантов ответов</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Block List Component
interface BlocksViewProps {
  onSelectBlock: (block: Block) => void;
}

function BlocksView({ onSelectBlock }: BlocksViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [newBlockName, setNewBlockName] = useState("");
  const [hasCalculator, setHasCalculator] = useState(false);
  const [hasPeriodicTable, setHasPeriodicTable] = useState(false);

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ["/api/blocks"],
    queryFn: async (): Promise<Block[]> => {
      const res = await apiRequest("GET", "/api/blocks");
      return await res.json();
    },
  });

  const createBlockMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/blocks", {
        name: newBlockName,
        hasCalculator,
        hasPeriodicTable,
      });
    },
    onSuccess: () => {
      // Issue #4: Comprehensive query invalidation for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/blocks"] });
      setNewBlockName("");
      setHasCalculator(false);
      setHasPeriodicTable(false);
      toast({ title: "Успешно", description: "Блок создан" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось создать блок", variant: "destructive" });
    },
  });

  const updateBlockMutation = useMutation({
    mutationFn: async (block: Block) => {
      await apiRequest("PUT", `/api/blocks/${block.id}`, block);
    },
    onSuccess: () => {
      // Issue #4: Comprehensive query invalidation for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/blocks"] });
      setEditingBlock(null);
      toast({ title: "Успешно", description: "Блок обновлен" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить блок", variant: "destructive" });
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      await apiRequest("DELETE", `/api/blocks/${blockId}`);
    },
    onSuccess: () => {
      // Issue #4: Comprehensive query invalidation for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/blocks"] });
      toast({ title: "Успешно", description: "Блок удален" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить блок", variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await apiRequest("POST", "/api/blocks/reorder", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      toast({ title: "Ошибка", description: "Не удалось изменить порядок", variant: "destructive" });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);

      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      queryClient.setQueryData(["/api/blocks"], newBlocks);
      reorderMutation.mutate(newBlocks.map((b) => b.id));
    }
  };

  const filteredBlocks = blocks.filter((block) =>
    block.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">


      {/* Search */}
      <Input
        placeholder="Поиск блоков..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Add Block Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Добавить блок
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать блок</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="blockName">Название блока</Label>
              <Input
                id="blockName"
                value={newBlockName}
                onChange={(e) => setNewBlockName(e.target.value)}
                placeholder="Введите название"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="calculator"
                checked={hasCalculator}
                onCheckedChange={setHasCalculator}
              />
              <Label htmlFor="calculator">Калькулятор</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="periodicTable"
                checked={hasPeriodicTable}
                onCheckedChange={setHasPeriodicTable}
              />
              <Label htmlFor="periodicTable">Таблица Менделеева</Label>
            </div>
            <Button
              onClick={() => createBlockMutation.mutate()}
              disabled={!newBlockName.trim() || createBlockMutation.isPending}
              className="w-full"
            >
              Создать
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Blocks List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredBlocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {filteredBlocks.map((block) => (
            <SortableCard key={block.id} id={block.id}>
              {({ attributes, listeners }) => (
                <div className="flex items-center gap-2 min-h-[60px] w-full">
                  {/* Drag handle - отдельная кликабельная область */}
                  <div 
                    className="cursor-grab active:cursor-grabbing p-2 flex items-center self-stretch" 
                    {...attributes} 
                    {...listeners}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  {/* Основная кликабельная область - занимает все доступное пространство */}
                  <div 
                    className="flex-1 flex items-center gap-2 cursor-pointer hover:text-primary hover:bg-muted/50 rounded-md transition-colors self-stretch px-3"
                    onClick={() => onSelectBlock(block)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{block.name}</div>
                      <div className="flex gap-1 mt-1">
                        {block.hasCalculator && (
                          <Badge variant="outline" className="text-xs">
                            <Calculator className="h-3 w-3 mr-1" />
                            Калькулятор
                          </Badge>
                        )}
                        {block.hasPeriodicTable && (
                          <Badge variant="outline" className="text-xs">
                            <Atom className="h-3 w-3 mr-1" />
                            Таблица Менделеева
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                <Dialog open={editingBlock?.id === block.id} onOpenChange={(open) => !open && setEditingBlock(null)}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBlock(block);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Редактировать блок</DialogTitle>
                    </DialogHeader>
                    {editingBlock && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="editBlockName">Название блока</Label>
                          <Input
                            id="editBlockName"
                            value={editingBlock.name}
                            onChange={(e) =>
                              setEditingBlock({ ...editingBlock, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="editCalculator"
                            checked={editingBlock.hasCalculator ?? false}
                            onCheckedChange={(checked) =>
                              setEditingBlock({ ...editingBlock, hasCalculator: checked })
                            }
                          />
                          <Label htmlFor="editCalculator">Калькулятор</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="editPeriodicTable"
                            checked={editingBlock.hasPeriodicTable ?? false}
                            onCheckedChange={(checked) =>
                              setEditingBlock({ ...editingBlock, hasPeriodicTable: checked })
                            }
                          />
                          <Label htmlFor="editPeriodicTable">Таблица Менделеева</Label>
                        </div>
                        <Button
                          onClick={() => updateBlockMutation.mutate(editingBlock)}
                          disabled={updateBlockMutation.isPending}
                          className="w-full"
                        >
                          Сохранить
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Удалить блок "${block.name}"?`)) {
                      deleteBlockMutation.mutate(block.id);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                  </div>
                </div>
              )}
            </SortableCard>
          ))}
        </SortableContext>
      </DndContext>

      {filteredBlocks.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          {search ? "Блоки не найдены" : "Нет блоков. Создайте первый блок."}
        </div>
      )}
    </div>
  );
}

// Main Content Manager Component
export function ContentManager() {
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Reset navigation when going back
  const handleBackToBlocks = () => {
    setSelectedBlock(null);
    setSelectedVariant(null);
    setSelectedSubject(null);
    setSelectedQuestion(null);
  };

  const handleBackToVariants = () => {
    setSelectedVariant(null);
    setSelectedSubject(null);
    setSelectedQuestion(null);
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setSelectedQuestion(null);
  };

  const handleBackToQuestions = () => {
    setSelectedQuestion(null);
  };

  // Breadcrumbs
  const renderBreadcrumbs = () => {
    const crumbs = [];
    
    if (selectedBlock) {
      crumbs.push(
        <Button key="blocks" variant="link" onClick={handleBackToBlocks} className="p-0 h-auto">
          Блоки
        </Button>
      );
      crumbs.push(<span key="sep1" className="mx-2">/</span>);
      crumbs.push(
        <Button key="block" variant="link" onClick={() => !selectedVariant && handleBackToBlocks()} className="p-0 h-auto">
          {selectedBlock.name}
        </Button>
      );
    }

    if (selectedVariant) {
      crumbs.push(<span key="sep2" className="mx-2">/</span>);
      crumbs.push(
        <Button key="variant" variant="link" onClick={() => !selectedSubject && handleBackToVariants()} className="p-0 h-auto">
          {selectedVariant.name}
        </Button>
      );
    }

    if (selectedSubject) {
      crumbs.push(<span key="sep3" className="mx-2">/</span>);
      crumbs.push(
        <Button key="subject" variant="link" onClick={() => !selectedQuestion && handleBackToSubjects()} className="p-0 h-auto">
          {selectedSubject.name}
        </Button>
      );
    }

    if (selectedQuestion) {
      crumbs.push(<span key="sep4" className="mx-2">/</span>);
      crumbs.push(<span key="question" className="font-semibold">Редактирование вопроса</span>);
    }

    return crumbs.length > 0 ? (
      <div className="mb-6 flex items-center text-sm">
        {crumbs}
      </div>
    ) : null;
  };

  return (
    <div>
      {renderBreadcrumbs()}
      
      {!selectedBlock && (
        <BlocksView onSelectBlock={setSelectedBlock} />
      )}

      {selectedBlock && !selectedVariant && (
        <VariantsView block={selectedBlock} onSelectVariant={setSelectedVariant} />
      )}

      {selectedVariant && !selectedSubject && (
        <SubjectsView variant={selectedVariant} onSelectSubject={setSelectedSubject} />
      )}

      {selectedSubject && !selectedQuestion && (
        <QuestionsView subject={selectedSubject} variant={selectedVariant!} onSelectQuestion={setSelectedQuestion} />
      )}

      {selectedQuestion && (
        <QuestionEditor question={selectedQuestion} subject={selectedSubject!} onBack={handleBackToQuestions} />
      )}
    </div>
  );
}
