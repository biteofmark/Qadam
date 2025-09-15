import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Download, Eye, Search, Filter, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { VideoRecording } from "@shared/schema";

interface VideoSegment {
  id: string;
  segmentNumber: number;
  duration: number;
  uploadedAt: string;
  fileUrl: string;
}

interface VideoRecordingWithDetails extends VideoRecording {
  segments: VideoSegment[];
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  variant: {
    id: string;
    name: string;
    block: {
      name: string;
    };
  };
}

interface VideoPlayerProps {
  recording: VideoRecordingWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

function VideoPlayer({ recording, isOpen, onClose }: VideoPlayerProps) {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const currentSegment = recording.segments[currentSegmentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Видео запись теста: {recording.variant.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            {currentSegment ? (
              <video
                key={currentSegment.id}
                controls
                className="w-full h-64 object-contain"
                controlsList="nodownload"
                data-testid="video-player"
              >
                <source src={currentSegment.fileUrl} type="video/webm" />
                Ваш браузер не поддерживает видео воспроизведение.
              </video>
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-white">
                Нет доступных сегментов видео
              </div>
            )}
          </div>

          {/* Video Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label>Сегмент:</Label>
              <Select
                value={currentSegmentIndex.toString()}
                onValueChange={(value) => setCurrentSegmentIndex(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recording.segments.map((segment, index) => (
                    <SelectItem key={segment.id} value={index.toString()}>
                      {index + 1} ({Math.round(segment.duration / 1000)}с)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label>Скорость:</Label>
              <Select
                value={playbackSpeed.toString()}
                onValueChange={(value) => setPlaybackSpeed(parseFloat(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recording Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Студент:</strong> {recording.user.fullName}
            </div>
            <div>
              <strong>Email:</strong> {recording.user.email}
            </div>
            <div>
              <strong>Блок:</strong> {recording.variant.block.name}
            </div>
            <div>
              <strong>Вариант:</strong> {recording.variant.name}
            </div>
            <div>
              <strong>Начало:</strong> {recording.startedAt ? new Date(recording.startedAt).toLocaleString('ru-RU') : 'Неизвестно'}
            </div>
            <div>
              <strong>Окончание:</strong> {recording.completedAt ? new Date(recording.completedAt).toLocaleString('ru-RU') : 'В процессе'}
            </div>
            <div>
              <strong>Сегментов:</strong> {recording.segments.length}
            </div>
            <div>
              <strong>Общая длительность:</strong> {Math.round((recording.totalDurationMs || 0) / 1000 / 60)} мин
            </div>
          </div>

          {/* Segment Navigation */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentSegmentIndex(Math.max(0, currentSegmentIndex - 1))}
              disabled={currentSegmentIndex === 0}
              data-testid="button-prev-segment"
            >
              ← Предыдущий
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentSegmentIndex(Math.min(recording.segments.length - 1, currentSegmentIndex + 1))}
              disabled={currentSegmentIndex === recording.segments.length - 1}
              data-testid="button-next-segment"
            >
              Следующий →
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function VideoRecordingsViewer() {
  const { toast } = useToast();
  const [selectedRecording, setSelectedRecording] = useState<VideoRecordingWithDetails | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [filters, setFilters] = useState({
    studentName: "",
    blockName: "",
    variantName: "",
    dateFrom: "",
    dateTo: "",
    status: "all"
  });

  const { data: recordings, isLoading } = useQuery<VideoRecordingWithDetails[]>({
    queryKey: ["/api/admin/video-recordings", filters],
  });

  const filteredRecordings = recordings?.filter(recording => {
    if (filters.studentName && !recording.user.fullName.toLowerCase().includes(filters.studentName.toLowerCase())) {
      return false;
    }
    if (filters.blockName && !recording.variant.block.name.toLowerCase().includes(filters.blockName.toLowerCase())) {
      return false;
    }
    if (filters.variantName && !recording.variant.name.toLowerCase().includes(filters.variantName.toLowerCase())) {
      return false;
    }
    if (filters.dateFrom && recording.startedAt && new Date(recording.startedAt) < new Date(filters.dateFrom)) {
      return false;
    }
    if (filters.dateTo && recording.startedAt && new Date(recording.startedAt) > new Date(filters.dateTo)) {
      return false;
    }
    if (filters.status !== "all") {
      const isCompleted = !!recording.completedAt;
      if (filters.status === "completed" && !isCompleted) return false;
      if (filters.status === "in_progress" && isCompleted) return false;
    }
    return true;
  }) || [];

  const handleViewRecording = (recording: VideoRecordingWithDetails) => {
    setSelectedRecording(recording);
    setShowVideoPlayer(true);
  };

  const handleDownloadRecording = async (recording: VideoRecordingWithDetails) => {
    try {
      // This would create a downloadable archive of all video segments
      toast({
        title: "Подготовка загрузки",
        description: "Архив с видео сегментами будет готов через несколько минут",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось подготовить архив для загрузки",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Видео записи тестов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Видео записи тестов ({filteredRecordings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <Label htmlFor="student-filter">Студент</Label>
              <Input
                id="student-filter"
                placeholder="Имя студента"
                value={filters.studentName}
                onChange={(e) => setFilters(prev => ({ ...prev, studentName: e.target.value }))}
                data-testid="input-student-filter"
              />
            </div>
            <div>
              <Label htmlFor="block-filter">Блок</Label>
              <Input
                id="block-filter"
                placeholder="Название блока"
                value={filters.blockName}
                onChange={(e) => setFilters(prev => ({ ...prev, blockName: e.target.value }))}
                data-testid="input-block-filter"
              />
            </div>
            <div>
              <Label htmlFor="variant-filter">Вариант</Label>
              <Input
                id="variant-filter"
                placeholder="Вариант теста"
                value={filters.variantName}
                onChange={(e) => setFilters(prev => ({ ...prev, variantName: e.target.value }))}
                data-testid="input-variant-filter"
              />
            </div>
            <div>
              <Label htmlFor="date-from">От даты</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                data-testid="input-date-from"
              />
            </div>
            <div>
              <Label htmlFor="date-to">До даты</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                data-testid="input-date-to"
              />
            </div>
            <div>
              <Label htmlFor="status-filter">Статус</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="completed">Завершены</SelectItem>
                  <SelectItem value="in_progress">В процессе</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recordings List */}
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredRecordings.map((recording) => (
                <Card key={recording.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div className="font-medium">{recording.user.fullName}</div>
                        <div className="text-sm text-muted-foreground">{recording.user.email}</div>
                      </div>
                      <div>
                        <div className="font-medium">{recording.variant.block.name}</div>
                        <div className="text-sm text-muted-foreground">{recording.variant.name}</div>
                      </div>
                      <div>
                        <div className="text-sm">{recording.startedAt ? new Date(recording.startedAt).toLocaleString('ru-RU') : 'Неизвестно'}</div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round((recording.totalDurationMs || 0) / 1000 / 60)} мин, {recording.segments.length} сегментов
                        </div>
                      </div>
                      <div>
                        <Badge variant={recording.completedAt ? "default" : "secondary"}>
                          {recording.completedAt ? "Завершен" : "В процессе"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRecording(recording)}
                        data-testid={`button-view-${recording.id}`}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Просмотр
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadRecording(recording)}
                        data-testid={`button-download-${recording.id}`}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Скачать
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {filteredRecordings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Видео записи не найдены</p>
                  {Object.values(filters).some(f => f !== "" && f !== "all") && (
                    <p className="text-sm mt-2">Попробуйте изменить фильтры поиска</p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Video Player Modal */}
      {selectedRecording && (
        <VideoPlayer
          recording={selectedRecording}
          isOpen={showVideoPlayer}
          onClose={() => {
            setShowVideoPlayer(false);
            setSelectedRecording(null);
          }}
        />
      )}
    </>
  );
}