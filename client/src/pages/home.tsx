import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";

type TestItem = {
  id: number;
  title: string;
  description: string | null;
  createdAt: Date;
};

export default function Home() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: items, isLoading } = useQuery<TestItem[]>({
    queryKey: ["test-items"],
    queryFn: async () => {
      const res = await fetch("/api/test-items");
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string | null }) => {
      const res = await fetch("/api/test-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-items"] });
      setTitle("");
      setDescription("");
      toast.success("Запись успешно создана!");
    },
    onError: () => {
      toast.error("Ошибка при создании записи");
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error("Failed to seed database");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-items"] });
      toast.success("База данных успешно наполнена!");
    },
    onError: () => {
      toast.error("Ошибка при наполнении базы данных");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      description: description || null,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">
            Supabase + Replit
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Проект настроен для работы с Supabase
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Добавить запись</CardTitle>
              <CardDescription>
                Создайте новую тестовую запись в базе данных
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Заголовок</Label>
                  <Input
                    id="title"
                    data-testid="input-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Введите заголовок"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    data-testid="input-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Введите описание (необязательно)"
                    rows={3}
                  />
                </div>
                <Button
                  type="submit"
                  data-testid="button-create"
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? "Создание..." : "Создать запись"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t">
                <Button
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                  variant="outline"
                  data-testid="button-seed"
                  className="w-full"
                >
                  {seedMutation.isPending
                    ? "Наполнение..."
                    : "Наполнить БД тестовыми данными"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Записи из базы данных</CardTitle>
              <CardDescription>
                {items?.length || 0} записей найдено
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-slate-500">Загрузка...</p>
              ) : items && items.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      data-testid={`item-${item.id}`}
                      className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1"
                    >
                      <h3
                        className="font-semibold text-slate-900 dark:text-slate-50"
                        data-testid={`title-${item.id}`}
                      >
                        {item.title}
                      </h3>
                      {item.description && (
                        <p
                          className="text-sm text-slate-600 dark:text-slate-400"
                          data-testid={`description-${item.id}`}
                        >
                          {item.description}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">ID: {item.id}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">
                  Нет записей. Нажмите кнопку "Наполнить БД" для добавления
                  тестовых данных.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-50">
              📝 Инструкция по настройке
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 dark:text-blue-200 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">
                Шаг 1: Создайте таблицы в Supabase
              </h4>
              <p className="text-sm">
                Из-за сетевых ограничений Replit, выполните SQL из файла{" "}
                <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                  migrations/init.sql
                </code>{" "}
                в Supabase Dashboard → SQL Editor
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">
                Шаг 2: Проверьте работу
              </h4>
              <p className="text-sm">
                После выполнения SQL, нажмите "Наполнить БД тестовыми данными"
                выше или обновите страницу, чтобы увидеть записи.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Документация</h4>
              <p className="text-sm">
                Подробная инструкция в файле{" "}
                <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                  SUPABASE_SETUP.md
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
