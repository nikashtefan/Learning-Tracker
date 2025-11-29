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

const COLORS = {
  wine: "#4d0011",
  pine: "#102b1f",
  rose: "#bd7880",
  pink: "#ffd9d9",
};

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
      <div className="absolute inset-0 rounded-full bg-[#bd7880]/10 blur-2xl animate-pulse-glow" />
      <svg className="w-52 h-52 transform -rotate-90" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLORS.wine} />
            <stop offset="100%" stopColor={COLORS.rose} />
          </linearGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="rgba(189, 120, 128, 0.2)"
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
        <span className="text-xs text-[#bd7880] uppercase tracking-widest mb-1">
          Сегодня
        </span>
        <motion.span 
          className="text-5xl font-bold gradient-text"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          {todayMinutes}
        </motion.span>
        <span className="text-sm text-[#bd7880] mt-1">
          из {goalMinutes} мин цели
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
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.wine }} />
          <span className="text-[#4d0011]/70">Курсы</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.pine }} />
          <span className="text-[#102b1f]/70">Книги</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {dayLabels.map(label => (
          <span key={label} className="text-[9px] text-[#bd7880] uppercase py-1 font-medium">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="h-7" />
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
                h-7 rounded-md flex flex-col items-center justify-center relative
                ${hasAny ? "bg-[#ffd9d9]" : "bg-white/50"}
                ${isToday ? "ring-2 ring-[#4d0011]/30" : ""}
                ${isFuture ? "opacity-40" : ""}
                transition-all duration-200 shadow-sm
              `}
            >
              <span className="text-[9px] text-[#4d0011]/60 mb-0.5 font-medium">
                {new Date(day).getDate()}
              </span>
              <div className="flex gap-0.5">
                <div 
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ 
                    backgroundColor: courseCompleted ? COLORS.wine : "rgba(189, 120, 128, 0.3)"
                  }} 
                />
                <div 
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ 
                    backgroundColor: bookCompleted ? COLORS.pine : "rgba(16, 43, 31, 0.2)"
                  }} 
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
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl glass-card shadow-md">
      <div className="p-2 rounded-xl" style={{ backgroundColor: COLORS.wine }}>
        <Flame className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: COLORS.wine }}>{streak}</p>
        <p className="text-xs text-[#bd7880]">Дней подряд</p>
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
  const accentColor = isBook ? COLORS.pine : COLORS.wine;

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
            relative flex flex-col items-center p-2 rounded-xl transition-all duration-300 shadow-sm
            ${isCompleted 
              ? "text-white shadow-md" 
              : isToday 
                ? "bg-[#ffd9d9] ring-2" 
                : "bg-white/70 text-[#4d0011]/60 hover:bg-[#ffd9d9]/50"
            }
            ${isFuture ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:scale-105"}
          `}
          style={{
            backgroundColor: isCompleted ? accentColor : undefined,
            color: isToday && !isCompleted ? accentColor : undefined,
            ...(isToday && !isCompleted ? { '--tw-ring-color': `${accentColor}40` } as React.CSSProperties : {}),
          }}
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
              <Check className="w-4 h-4 rounded-full p-0.5" style={{ backgroundColor: COLORS.rose, color: "white" }} />
            </motion.div>
          )}
          {entry?.minutes && (
            <span className="text-[9px] mt-0.5 opacity-80">
              {entry.minutes}м
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-4 glass-card border-[#bd7880]/30">
        <div className="space-y-4">
          <p className="text-sm font-medium" style={{ color: COLORS.wine }}>Отметить выполнение</p>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: COLORS.rose }} />
            <Input
              type="number"
              placeholder="Минуты (необяз.)"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="h-9 bg-white/50 border-[#bd7880]/30"
              data-testid="input-time"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSave} 
              className="flex-1 text-white"
              style={{ backgroundColor: COLORS.wine }}
              data-testid="button-save-day"
            >
              Сохранить
            </Button>
            {isCompleted && (
              <Button size="sm" variant="outline" onClick={handleRemove} className="border-[#bd7880]/30" data-testid="button-remove-day">
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
  const accentColor = isBook ? COLORS.pine : COLORS.wine;
  const cardClass = isBook ? "pine-card" : "wine-card";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`${cardClass} border-0 overflow-hidden group shadow-md`}>
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl shadow-md" style={{ backgroundColor: accentColor }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg" style={{ color: accentColor }} data-testid={`habit-name-${habit.id}`}>
                  {habit.name}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: `${accentColor}15`,
                      color: accentColor
                    }}
                  >
                    {habit.type === "course" ? "Курс" : "Книга"}
                  </span>
                  {totalMinutes > 0 && (
                    <span className="text-xs flex items-center gap-1" style={{ color: COLORS.rose }}>
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
                className="h-8 w-8 hover:bg-white/50"
                style={{ color: COLORS.rose }}
                onClick={() => onReset(habit.id)}
                data-testid={`button-reset-${habit.id}`}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white/50"
                style={{ color: COLORS.wine }}
                onClick={() => onDelete(habit.id)}
                data-testid={`button-delete-${habit.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-2 bg-white/50 rounded-full overflow-hidden">
              <motion.div 
                className="h-full rounded-full"
                style={{ backgroundColor: accentColor }}
                initial={{ width: 0 }}
                animate={{ width: `${(completedThisWeek / 7) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="text-sm font-medium" style={{ color: accentColor }}>{completedThisWeek}/7</span>
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
    <div className="min-h-screen bg-[#9D9167] relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#bd7880]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#102b1f]/5 rounded-full blur-3xl" />
      
      <div className="relative max-w-4xl mx-auto px-4 py-8">
        <motion.header 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2" data-testid="app-title">
            <span className="gradient-text">Учебный трекер</span>
          </h1>
          <p style={{ color: COLORS.rose }}>
            Отслеживайте прогресс. Достигайте целей.
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
              
              <div className="px-4 py-3 rounded-2xl glass-card shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: COLORS.pine }}>
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: COLORS.pine }}>{habits.length}</p>
                    <p className="text-xs" style={{ color: COLORS.rose }}>Активных целей</p>
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
          <div className="glass-card rounded-2xl p-5 shadow-md">
            <h3 className="text-lg font-semibold mb-4 capitalize" style={{ color: COLORS.wine }}>{currentMonth}</h3>
            <MonthCalendar habits={habits} monthDays={monthDays} />
          </div>
        </motion.section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold" style={{ color: COLORS.wine }}>
              Мои курсы и книги
            </h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  data-testid="button-add-habit" 
                  className="gap-2 text-white shadow-lg"
                  style={{ backgroundColor: COLORS.wine }}
                >
                  <Plus className="w-4 h-4" />
                  Добавить
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-[#bd7880]/30">
                <DialogHeader>
                  <DialogTitle style={{ color: COLORS.wine }}>Новая учебная привычка</DialogTitle>
                  <DialogDescription style={{ color: COLORS.rose }}>
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
                      className="bg-white/50 border-[#bd7880]/30"
                      data-testid="input-habit-name"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={newHabitType === "course" ? "default" : "outline"}
                      onClick={() => setNewHabitType("course")}
                      className={`flex-1 ${newHabitType === "course" ? "text-white" : ""}`}
                      style={{ 
                        backgroundColor: newHabitType === "course" ? COLORS.wine : undefined,
                        borderColor: COLORS.rose
                      }}
                      data-testid="button-type-course"
                    >
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Курс
                    </Button>
                    <Button
                      variant={newHabitType === "book" ? "default" : "outline"}
                      onClick={() => setNewHabitType("book")}
                      className={`flex-1 ${newHabitType === "book" ? "text-white" : ""}`}
                      style={{ 
                        backgroundColor: newHabitType === "book" ? COLORS.pine : undefined,
                        borderColor: COLORS.rose
                      }}
                      data-testid="button-type-book"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Книга
                    </Button>
                  </div>
                  <Button 
                    onClick={addHabit} 
                    className="w-full text-white" 
                    style={{ backgroundColor: COLORS.wine }}
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
                <div 
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${COLORS.rose}30` }}
                >
                  <BookOpen className="w-10 h-10" style={{ color: COLORS.wine }} />
                </div>
                <p className="mb-6" style={{ color: COLORS.rose }}>
                  Начните отслеживать свои учебные привычки
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="text-white"
                  style={{ backgroundColor: COLORS.wine }}
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
