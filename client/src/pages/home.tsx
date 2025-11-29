import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, Check, RotateCcw, Trash2, Trophy, Target } from "lucide-react";

type Habit = {
  id: string;
  name: string;
  type: "course" | "book";
  completedDays: string[];
  createdAt: string;
};

const STORAGE_KEY = "learning-tracker-habits";

function getWeekDays(): string[] {
  const today = new Date();
  const days: string[] = [];
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day.toISOString().split("T")[0]);
  }
  return days;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric" });
}

function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted/50"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className="text-primary"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span 
          className="text-2xl font-bold text-foreground"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(percentage)}%
        </motion.span>
      </div>
    </div>
  );
}

function HabitCard({ 
  habit, 
  weekDays, 
  today, 
  onToggle, 
  onReset, 
  onDelete 
}: { 
  habit: Habit; 
  weekDays: string[]; 
  today: string;
  onToggle: (habitId: string, day: string) => void;
  onReset: (habitId: string) => void;
  onDelete: (habitId: string) => void;
}) {
  const completedThisWeek = weekDays.filter(day => habit.completedDays.includes(day)).length;
  const progress = (completedThisWeek / 7) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground" data-testid={`habit-name-${habit.id}`}>
                  {habit.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {habit.type === "course" ? "Курс" : "Книга"}
                </p>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onReset(habit.id)}
                data-testid={`button-reset-${habit.id}`}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(habit.id)}
                data-testid={`button-delete-${habit.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Прогресс недели</span>
              <span className="font-medium">{completedThisWeek}/7</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const isCompleted = habit.completedDays.includes(day);
              const isToday = day === today;
              const isFuture = day > today;

              return (
                <button
                  key={day}
                  onClick={() => !isFuture && onToggle(habit.id, day)}
                  disabled={isFuture}
                  data-testid={`day-${habit.id}-${day}`}
                  className={`
                    relative flex flex-col items-center p-2 rounded-lg transition-all duration-200
                    ${isCompleted 
                      ? "bg-primary text-primary-foreground" 
                      : isToday 
                        ? "bg-primary/10 text-primary ring-2 ring-primary/30" 
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }
                    ${isFuture ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  <span className="text-[10px] font-medium uppercase">
                    {formatDate(day).split(",")[0]}
                  </span>
                  <span className="text-xs mt-0.5">
                    {new Date(day).getDate()}
                  </span>
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1"
                    >
                      <Check className="w-3 h-3 text-primary-foreground bg-green-500 rounded-full p-0.5" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitType, setNewHabitType] = useState<"course" | "book">("course");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const weekDays = getWeekDays();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHabits(JSON.parse(stored));
      } catch {
        console.error("Failed to parse stored habits");
      }
    }
  }, []);

  useEffect(() => {
    if (habits.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    }
  }, [habits]);

  const addHabit = useCallback(() => {
    if (!newHabitName.trim()) {
      toast.error("Введите название");
      return;
    }

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      type: newHabitType,
      completedDays: [],
      createdAt: new Date().toISOString(),
    };

    setHabits((prev) => [...prev, newHabit]);
    setNewHabitName("");
    setIsDialogOpen(false);
    toast.success("Привычка добавлена!");
  }, [newHabitName, newHabitType]);

  const toggleDay = useCallback((habitId: string, day: string) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        const isCompleted = habit.completedDays.includes(day);
        return {
          ...habit,
          completedDays: isCompleted
            ? habit.completedDays.filter((d) => d !== day)
            : [...habit.completedDays, day],
        };
      })
    );
  }, []);

  const resetHabit = useCallback((habitId: string) => {
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === habitId ? { ...habit, completedDays: [] } : habit
      )
    );
    toast.success("Прогресс сброшен");
  }, []);

  const deleteHabit = useCallback((habitId: string) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
    toast.success("Привычка удалена");
  }, []);

  const totalDaysThisWeek = habits.length * 7;
  const completedDaysThisWeek = habits.reduce(
    (acc, habit) => acc + weekDays.filter((day) => habit.completedDays.includes(day)).length,
    0
  );
  const weeklyProgress = totalDaysThisWeek > 0 ? (completedDaysThisWeek / totalDaysThisWeek) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.header 
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="app-title">
            Учебный трекер
          </h1>
          <p className="text-muted-foreground">
            Отслеживайте прогресс в изучении курсов и книг
          </p>
        </motion.header>

        <motion.section 
          className="mb-10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="w-5 h-5 text-primary" />
                Мои достижения
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <CircularProgress percentage={weeklyProgress} />
                <div className="text-center sm:text-left">
                  <p className="text-2xl font-bold text-foreground" data-testid="weekly-stats">
                    {completedDaysThisWeek} из {totalDaysThisWeek}
                  </p>
                  <p className="text-muted-foreground">
                    выполненных занятий за эту неделю
                  </p>
                  {weeklyProgress >= 80 && (
                    <motion.p 
                      className="mt-2 text-green-600 font-medium flex items-center gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Target className="w-4 h-4" />
                      Отличный результат!
                    </motion.p>
                  )}
                  {weeklyProgress >= 50 && weeklyProgress < 80 && (
                    <motion.p 
                      className="mt-2 text-amber-600 font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Хороший прогресс!
                    </motion.p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Мои курсы и книги
            </h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-habit" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Добавить привычку
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новая учебная привычка</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Input
                      placeholder="Название курса или книги"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addHabit()}
                      data-testid="input-habit-name"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={newHabitType === "course" ? "default" : "outline"}
                      onClick={() => setNewHabitType("course")}
                      className="flex-1"
                      data-testid="button-type-course"
                    >
                      Курс
                    </Button>
                    <Button
                      variant={newHabitType === "book" ? "default" : "outline"}
                      onClick={() => setNewHabitType("book")}
                      className="flex-1"
                      data-testid="button-type-book"
                    >
                      Книга
                    </Button>
                  </div>
                  <Button onClick={addHabit} className="w-full" data-testid="button-confirm-add">
                    Добавить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <AnimatePresence mode="popLayout">
            {habits.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">
                  У вас пока нет учебных привычек
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(true)}
                  data-testid="button-add-first"
                >
                  Добавить первую привычку
                </Button>
              </motion.div>
            ) : (
              <div className="grid gap-4">
                {habits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    weekDays={weekDays}
                    today={today}
                    onToggle={toggleDay}
                    onReset={resetHabit}
                    onDelete={deleteHabit}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
