import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, GraduationCap, Check, RotateCcw, Trash2, Clock, Flame, Target, X } from "lucide-react";

type TimeEntry = {
  completed: boolean;
  minutes?: number;
};

type Habit = {
  id: string;
  name: string;
  type: "course" | "book";
  dayEntries: Record<string, TimeEntry>;
  createdAt: string;
  dailyGoal?: number;
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

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`;
}

function getMonthDays(): string[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: string[] = [];
  
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d).toISOString().split("T")[0]);
  }
  return days;
}

function ReadingGoalsCircle({ 
  todayMinutes, 
  goalMinutes = 30 
}: { 
  todayMinutes: number; 
  goalMinutes?: number;
}) {
  const percentage = Math.min((todayMinutes / goalMinutes) * 100, 100);
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-2xl animate-pulse-glow" />
      <svg className="w-52 h-52 transform -rotate-90" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="rgba(168, 85, 247, 0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
          Today's Reading
        </span>
        <motion.span 
          className="text-5xl font-bold gradient-text"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          {todayMinutes}
        </motion.span>
        <span className="text-sm text-muted-foreground mt-1">
          of your {goalMinutes}-min goal
        </span>
      </div>
    </div>
  );
}

function MonthCalendar({ habits, monthDays }: { habits: Habit[]; monthDays: string[] }) {
  const today = new Date().toISOString().split("T")[0];
  const firstDayOfMonth = new Date(monthDays[0]);
  const startPadding = (firstDayOfMonth.getDay() + 6) % 7;
  
  const getDayProgress = (day: string) => {
    const courses = habits.filter(h => h.type === "course");
    const books = habits.filter(h => h.type === "book");
    
    const courseCompleted = courses.some(h => h.dayEntries[day]?.completed);
    const bookCompleted = books.some(h => h.dayEntries[day]?.completed);
    
    return { courseCompleted, bookCompleted };
  };

  const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-4 mb-2 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
          <span className="text-muted-foreground">Курсы</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-400 to-rose-600" />
          <span className="text-muted-foreground">Книги</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {dayLabels.map(label => (
          <span key={label} className="text-[9px] text-muted-foreground uppercase py-1">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="h-8" />
        ))}
        {monthDays.map(day => {
          const { courseCompleted, bookCompleted } = getDayProgress(day);
          const isToday = day === today;
          const isFuture = day > today;
          const hasAny = courseCompleted || bookCompleted;
          
          return (
            <motion.div
              key={day}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: Math.random() * 0.2 }}
              className={`
                h-8 rounded flex flex-col items-center justify-center relative
                ${hasAny ? "bg-muted/40" : "bg-muted/20"}
                ${isToday ? "ring-1 ring-purple-400" : ""}
                ${isFuture ? "opacity-30" : ""}
                transition-all duration-200
              `}
            >
              <span className="text-[9px] text-muted-foreground mb-0.5">
                {new Date(day).getDate()}
              </span>
              <div className="flex gap-0.5">
                <div 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    courseCompleted 
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-sm shadow-purple-500/50" 
                      : "bg-muted/50"
                  }`} 
                />
                <div 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    bookCompleted 
                      ? "bg-gradient-to-r from-rose-400 to-rose-600 shadow-sm shadow-rose-500/50" 
                      : "bg-muted/50"
                  }`} 
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StreakCounter({ habits }: { habits: Habit[] }) {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];
    
    const hasAnyCompletion = habits.some(h => h.dayEntries[dateStr]?.completed);
    if (hasAnyCompletion) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl glass-card">
      <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
        <Flame className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{streak}</p>
        <p className="text-xs text-muted-foreground">Reading Streak</p>
      </div>
    </div>
  );
}

function DayButton({
  day,
  entry,
  isToday,
  isFuture,
  habitType,
  onUpdate,
}: {
  day: string;
  entry?: TimeEntry;
  isToday: boolean;
  isFuture: boolean;
  habitType: "course" | "book";
  onUpdate: (day: string, entry: TimeEntry | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeInput, setTimeInput] = useState("");
  const isCompleted = entry?.completed;
  
  const isBook = habitType === "book";

  const handleSave = () => {
    const minutes = timeInput ? parseInt(timeInput, 10) : undefined;
    onUpdate(day, { completed: true, minutes: minutes && !isNaN(minutes) ? minutes : undefined });
    setIsOpen(false);
    setTimeInput("");
  };

  const handleRemove = () => {
    onUpdate(day, null);
    setIsOpen(false);
    setTimeInput("");
  };

  const handleQuickToggle = () => {
    if (isFuture) return;
    if (isCompleted) {
      onUpdate(day, null);
    } else {
      setIsOpen(true);
    }
  };

  const dayName = new Date(day).toLocaleDateString("ru-RU", { weekday: "short" });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={handleQuickToggle}
          disabled={isFuture}
          className={`
            relative flex flex-col items-center p-2 rounded-xl transition-all duration-300
            ${isCompleted 
              ? isBook 
                ? "bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-lg shadow-rose-500/30" 
                : "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
              : isToday 
                ? "bg-purple-500/20 text-purple-300 ring-2 ring-purple-500/50" 
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            }
            ${isFuture ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:scale-105"}
          `}
        >
          <span className="text-[10px] font-medium uppercase opacity-70">
            {dayName}
          </span>
          <span className="text-sm font-semibold mt-0.5">
            {new Date(day).getDate()}
          </span>
          {isCompleted && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute -top-1 -right-1"
            >
              <Check className="w-4 h-4 bg-white text-purple-600 rounded-full p-0.5" />
            </motion.div>
          )}
          {entry?.minutes && (
            <span className="text-[9px] mt-0.5 opacity-80">
              {entry.minutes}м
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-4 glass-card border-purple-500/30">
        <div className="space-y-4">
          <p className="text-sm font-medium text-white">Отметить выполнение</p>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <Input
              type="number"
              placeholder="Минуты (необяз.)"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="h-9 bg-muted/50 border-purple-500/30"
              data-testid="input-time"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSave} 
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              data-testid="button-save-day"
            >
              Сохранить
            </Button>
            {isCompleted && (
              <Button size="sm" variant="outline" onClick={handleRemove} className="border-purple-500/30" data-testid="button-remove-day">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function HabitCard({ 
  habit, 
  weekDays, 
  today, 
  onUpdateDay, 
  onReset, 
  onDelete 
}: { 
  habit: Habit; 
  weekDays: string[]; 
  today: string;
  onUpdateDay: (habitId: string, day: string, entry: TimeEntry | null) => void;
  onReset: (habitId: string) => void;
  onDelete: (habitId: string) => void;
}) {
  const completedThisWeek = weekDays.filter(day => habit.dayEntries[day]?.completed).length;
  const totalMinutes = weekDays.reduce((acc, day) => acc + (habit.dayEntries[day]?.minutes || 0), 0);
  
  const isBook = habit.type === "book";
  const Icon = isBook ? BookOpen : GraduationCap;
  const gradientClass = isBook 
    ? "from-rose-400/20 to-rose-600/20" 
    : "from-purple-500/20 to-pink-500/20";
  const iconGradient = isBook
    ? "from-rose-400 to-rose-600"
    : "from-purple-500 to-pink-500";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`glass-card border-0 overflow-hidden group`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-50`} />
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${iconGradient} shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg" data-testid={`habit-name-${habit.id}`}>
                  {habit.name}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isBook ? "bg-rose-500/20 text-rose-400" : "bg-purple-500/20 text-purple-400"}`}>
                    {habit.type === "course" ? "Курс" : "Книга"}
                  </span>
                  {totalMinutes > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(totalMinutes)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-white"
                onClick={() => onReset(habit.id)}
                data-testid={`button-reset-${habit.id}`}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-400"
                onClick={() => onDelete(habit.id)}
                data-testid={`button-delete-${habit.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full bg-gradient-to-r ${isBook ? "from-rose-400 to-rose-600" : "from-purple-500 to-pink-500"} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${(completedThisWeek / 7) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="text-sm font-medium text-white">{completedThisWeek}/7</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <DayButton
                key={day}
                day={day}
                entry={habit.dayEntries[day]}
                isToday={day === today}
                isFuture={day > today}
                habitType={habit.type}
                onUpdate={(d, entry) => onUpdateDay(habit.id, d, entry)}
              />
            ))}
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
  const monthDays = getMonthDays();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const migrated = parsed.map((habit: any) => {
          if (habit.completedDays && !habit.dayEntries) {
            const dayEntries: Record<string, TimeEntry> = {};
            habit.completedDays.forEach((day: string) => {
              dayEntries[day] = { completed: true };
            });
            return { ...habit, dayEntries, completedDays: undefined };
          }
          return habit;
        });
        setHabits(migrated);
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
      dayEntries: {},
      createdAt: new Date().toISOString(),
    };

    setHabits((prev) => [...prev, newHabit]);
    setNewHabitName("");
    setIsDialogOpen(false);
    toast.success("Привычка добавлена!");
  }, [newHabitName, newHabitType]);

  const updateDay = useCallback((habitId: string, day: string, entry: TimeEntry | null) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        const newEntries = { ...habit.dayEntries };
        if (entry) {
          newEntries[day] = entry;
        } else {
          delete newEntries[day];
        }
        return { ...habit, dayEntries: newEntries };
      })
    );
  }, []);

  const resetHabit = useCallback((habitId: string) => {
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === habitId ? { ...habit, dayEntries: {} } : habit
      )
    );
    toast.success("Прогресс сброшен");
  }, []);

  const deleteHabit = useCallback((habitId: string) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
    toast.success("Привычка удалена");
  }, []);

  const todayMinutes = habits.reduce(
    (acc, habit) => acc + (habit.dayEntries[today]?.minutes || 0),
    0
  );

  const currentMonth = new Date().toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
      
      <div className="relative max-w-4xl mx-auto px-4 py-8">
        <motion.header 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2" data-testid="app-title">
            <span className="gradient-text">Reading Goals</span>
          </h1>
          <p className="text-muted-foreground">
            See your stats soar. Finish more books.
          </p>
        </motion.header>

        <motion.section 
          className="mb-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col lg:flex-row items-center gap-8 justify-center">
            <ReadingGoalsCircle todayMinutes={todayMinutes} goalMinutes={60} />
            
            <div className="flex flex-col gap-4">
              <StreakCounter habits={habits} />
              
              <div className="px-4 py-3 rounded-2xl glass-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{habits.length}</p>
                    <p className="text-xs text-muted-foreground">Active Goals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4 capitalize">{currentMonth}</h3>
            <MonthCalendar habits={habits} monthDays={monthDays} />
          </div>
        </motion.section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Мои курсы и книги
            </h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  data-testid="button-add-habit" 
                  className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30"
                >
                  <Plus className="w-4 h-4" />
                  Добавить
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-purple-500/30">
                <DialogHeader>
                  <DialogTitle className="text-white">Новая учебная привычка</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Добавьте курс или книгу для отслеживания
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Input
                      placeholder="Название курса или книги"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addHabit()}
                      className="bg-muted/50 border-purple-500/30"
                      data-testid="input-habit-name"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={newHabitType === "course" ? "default" : "outline"}
                      onClick={() => setNewHabitType("course")}
                      className={`flex-1 ${newHabitType === "course" ? "bg-gradient-to-r from-purple-500 to-pink-500" : "border-purple-500/30"}`}
                      data-testid="button-type-course"
                    >
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Курс
                    </Button>
                    <Button
                      variant={newHabitType === "book" ? "default" : "outline"}
                      onClick={() => setNewHabitType("book")}
                      className={`flex-1 ${newHabitType === "book" ? "bg-gradient-to-r from-rose-400 to-rose-600" : "border-purple-500/30"}`}
                      data-testid="button-type-book"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Книга
                    </Button>
                  </div>
                  <Button 
                    onClick={addHabit} 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" 
                    data-testid="button-confirm-add"
                  >
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
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-purple-400" />
                </div>
                <p className="text-muted-foreground mb-6">
                  Начните отслеживать свои учебные привычки
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  data-testid="button-add-first"
                >
                  <Plus className="w-4 h-4 mr-2" />
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
                    onUpdateDay={updateDay}
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
