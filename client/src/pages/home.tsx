import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, GraduationCap, Check, RotateCcw, Trash2, Clock, Flame, Target, X, LogOut, User, Loader2, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

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
  dailyGoal: number;
};

const STORAGE_KEY = "learning-tracker-habits";
const DAILY_GOAL_KEY = "learning-tracker-daily-goal";

const COLORS = {
  course: "#917F88",
  book: "#e8c4c4",
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
  goalMinutes,
  onGoalChange
}: { 
  todayMinutes: number; 
  goalMinutes: number;
  onGoalChange: (newGoal: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempGoal, setTempGoal] = useState(goalMinutes.toString());
  
  const percentage = Math.min((todayMinutes / goalMinutes) * 100, 100);
  const radius = 80;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleSaveGoal = () => {
    const newGoal = parseInt(tempGoal, 10);
    if (newGoal && newGoal > 0) {
      onGoalChange(newGoal);
      setIsEditing(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          stroke="#1a1a1a"
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
        <span className="text-xs text-gray-400 uppercase tracking-widest mb-1">
          Сегодня
        </span>
        <motion.span 
          className="text-5xl font-light text-black"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          {todayMinutes}
        </motion.span>
        
        <Popover open={isEditing} onOpenChange={setIsEditing}>
          <PopoverTrigger asChild>
            <button className="text-sm text-gray-500 mt-1 hover:text-black transition-colors flex items-center gap-1 group">
              из {goalMinutes} мин
              <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3 bg-white border border-gray-200">
            <div className="space-y-3">
              <p className="text-sm font-medium text-black">Дневная цель</p>
              <Input
                type="number"
                value={tempGoal}
                onChange={(e) => setTempGoal(e.target.value)}
                className="h-9 bg-gray-50 border-gray-200"
                min="1"
                data-testid="input-daily-goal"
              />
              <Button 
                size="sm" 
                onClick={handleSaveGoal}
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                Сохранить
              </Button>
            </div>
          </PopoverContent>
        </Popover>
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
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-6 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.course }} />
          <span className="text-gray-600">Курсы</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.book }} />
          <span className="text-gray-600">Книги</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {dayLabels.map(label => (
          <span key={label} className="text-[10px] text-gray-400 uppercase py-1 font-medium tracking-wider">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
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
                ${hasAny ? "bg-gray-100" : "bg-white"}
                ${isToday ? "ring-1 ring-black" : ""}
                ${isFuture ? "opacity-30" : ""}
                transition-all duration-200
              `}
            >
              <span className="text-[10px] text-gray-600 mb-0.5 font-medium">
                {new Date(day).getDate()}
              </span>
              <div className="flex gap-0.5">
                <div 
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ backgroundColor: courseCompleted ? COLORS.course : "#e5e5e5" }}
                />
                <div 
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ backgroundColor: bookCompleted ? COLORS.book : "#e5e5e5" }}
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
    <div className="flex items-center gap-4 px-6 py-4 bg-black text-white rounded-lg">
      <Flame className="w-6 h-6" />
      <div>
        <p className="text-3xl font-light">{streak}</p>
        <p className="text-xs text-gray-400 uppercase tracking-wider">дней подряд</p>
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
  const [timeInput, setTimeInput] = useState(entry?.minutes?.toString() || "");
  const isCompleted = entry?.completed;
  
  const accentColor = habitType === "book" ? COLORS.book : COLORS.course;

  const handleSaveMinutes = () => {
    const minutes = timeInput ? parseInt(timeInput, 10) : undefined;
    onUpdate(day, { completed: true, minutes: minutes && !isNaN(minutes) ? minutes : undefined });
    setIsOpen(false);
  };

  const handleRemove = () => {
    onUpdate(day, null);
    setIsOpen(false);
    setTimeInput("");
  };

  const handleClick = () => {
    if (isFuture) return;
    if (!isCompleted) {
      onUpdate(day, { completed: true });
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTimeInput(entry?.minutes?.toString() || "");
    setIsOpen(true);
  };

  const dayName = new Date(day).toLocaleDateString("ru-RU", { weekday: "short" });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className="relative">
        <button
          onClick={handleClick}
          disabled={isFuture}
          className={`
            relative flex flex-col items-center p-2.5 rounded-lg transition-all duration-300 w-full
            ${isCompleted 
              ? "shadow-sm" 
              : isToday 
                ? "bg-gray-100 ring-1 ring-black" 
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }
            ${isFuture ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:scale-105"}
          `}
          style={{
            backgroundColor: isCompleted ? accentColor : undefined,
            color: isCompleted ? (habitType === "book" ? "#1a1a1a" : "white") : undefined,
          }}
        >
          <span className="text-[10px] font-medium uppercase opacity-60">
            {dayName}
          </span>
          <span className="text-sm font-semibold mt-0.5">
            {new Date(day).getDate()}
          </span>
          {entry?.minutes && (
            <span className="text-[9px] mt-0.5 opacity-70">
              {entry.minutes}м
            </span>
          )}
        </button>
        {isCompleted && (
          <PopoverTrigger asChild>
            <motion.button
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              onClick={handleEditClick}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
            >
              <Pencil className="w-2.5 h-2.5 text-gray-600" />
            </motion.button>
          </PopoverTrigger>
        )}
      </div>
      <PopoverContent className="w-56 p-4 bg-white border border-gray-200">
        <div className="space-y-4">
          <p className="text-sm font-medium text-black">Редактировать</p>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <Input
              type="number"
              placeholder="Минуты"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="h-9 bg-gray-50 border-gray-200"
              data-testid="input-time"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSaveMinutes} 
              className="flex-1 bg-black text-white hover:bg-gray-800"
              data-testid="button-save-day"
            >
              Сохранить
            </Button>
            <Button size="sm" variant="outline" onClick={handleRemove} className="border-gray-200" data-testid="button-remove-day">
              <X className="w-4 h-4" />
            </Button>
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
  onDelete,
  onEdit 
}: { 
  habit: Habit; 
  weekDays: string[]; 
  today: string;
  onUpdateDay: (habitId: string, day: string, entry: TimeEntry | null) => void;
  onReset: (habitId: string) => void;
  onDelete: (habitId: string) => void;
  onEdit: (habitId: string, name: string, goal: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(habit.name);
  const [tempGoal, setTempGoal] = useState(habit.dailyGoal.toString());
  
  const completedThisWeek = weekDays.filter(day => habit.dayEntries[day]?.completed).length;
  const totalMinutes = weekDays.reduce((acc, day) => acc + (habit.dayEntries[day]?.minutes || 0), 0);
  
  const isBook = habit.type === "book";
  const Icon = isBook ? BookOpen : GraduationCap;
  const accentColor = isBook ? COLORS.book : COLORS.course;

  const handleSave = () => {
    const newGoal = parseInt(tempGoal, 10);
    if (tempName.trim() && newGoal && newGoal > 0) {
      onEdit(habit.id, tempName.trim(), newGoal);
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border border-gray-200 bg-white overflow-hidden group">
        <CardContent className="relative p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: accentColor }}
              >
                <Icon className={`w-5 h-5 ${isBook ? "text-black" : "text-white"}`} />
              </div>
              <div>
                <h3 className="font-medium text-lg text-black" data-testid={`habit-name-${habit.id}`}>
                  {habit.name}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    {habit.type === "course" ? "Курс" : "Книга"}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {habit.dailyGoal} мин/день
                  </span>
                  {totalMinutes > 0 && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(totalMinutes)} за неделю
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Popover open={isEditing} onOpenChange={(open) => {
                setIsEditing(open);
                if (open) {
                  setTempName(habit.name);
                  setTempGoal(habit.dailyGoal.toString());
                }
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-black hover:bg-gray-100"
                    data-testid={`button-edit-${habit.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 bg-white border border-gray-200">
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-black">Редактировать</p>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Название</Label>
                      <Input
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="h-9 bg-gray-50 border-gray-200"
                        data-testid={`input-edit-name-${habit.id}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Цель (мин/день)</Label>
                      <Input
                        type="number"
                        value={tempGoal}
                        onChange={(e) => setTempGoal(e.target.value)}
                        className="h-9 bg-gray-50 border-gray-200"
                        min="1"
                        data-testid={`input-edit-goal-${habit.id}`}
                      />
                    </div>
                    <Button 
                      size="sm" 
                      onClick={handleSave}
                      className="w-full bg-black text-white hover:bg-gray-800"
                    >
                      Сохранить
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-black hover:bg-gray-100"
                onClick={() => onReset(habit.id)}
                data-testid={`button-reset-${habit.id}`}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-gray-100"
                onClick={() => onDelete(habit.id)}
                data-testid={`button-delete-${habit.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full rounded-full"
                style={{ backgroundColor: accentColor }}
                initial={{ width: 0 }}
                animate={{ width: `${(completedThisWeek / 7) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">{completedThisWeek}/7 дней</span>
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

function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || "Ошибка входа");
        } else {
          toast.success("Добро пожаловать!");
          onOpenChange(false);
          setEmail("");
          setPassword("");
        }
      } else if (mode === "register") {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(error.message || "Ошибка регистрации");
        } else {
          toast.success("Проверьте почту для подтверждения!");
          setMode("login");
        }
      } else if (mode === "reset") {
        const { error } = await resetPassword(email);
        if (error) {
          toast.error(error.message || "Ошибка отправки");
        } else {
          toast.success("Письмо для сброса пароля отправлено!");
          setMode("login");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return "Вход";
      case "register": return "Регистрация";
      case "reset": return "Сброс пароля";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "login": return "Войдите в свой аккаунт";
      case "register": return "Создайте новый аккаунт";
      case "reset": return "Введите email для восстановления";
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case "login": return "Войти";
      case "register": return "Зарегистрироваться";
      case "reset": return "Отправить";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-gray-200 max-w-sm">
        <DialogHeader className="text-center space-y-3">
          <div className="flex justify-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.course }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.book }}>
              <BookOpen className="w-5 h-5 text-black" />
            </div>
          </div>
          <DialogTitle className="text-xl font-medium text-black">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="auth-email" className="text-gray-700">Email</Label>
            <Input
              id="auth-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-auth-email"
              className="border-gray-200 focus:border-black"
            />
          </div>
          {mode !== "reset" && (
            <div className="space-y-2">
              <Label htmlFor="auth-password" className="text-gray-700">Пароль</Label>
              <Input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                data-testid="input-auth-password"
                className="border-gray-200 focus:border-black"
              />
            </div>
          )}
          {mode === "login" && (
            <button
              type="button"
              onClick={() => setMode("reset")}
              className="text-xs text-gray-400 hover:text-black transition-colors"
              data-testid="button-forgot-password"
            >
              Забыли пароль?
            </button>
          )}
          <Button
            type="submit"
            disabled={loading}
            data-testid="button-auth-submit"
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              getButtonText()
            )}
          </Button>
        </form>
        <div className="text-center mt-2 space-y-1">
          {mode === "reset" ? (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              Вернуться к входу
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              data-testid="button-toggle-auth-mode"
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              {mode === "login" ? "Нет аккаунта? Зарегистрируйтесь" : "Уже есть аккаунт? Войдите"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const { user, signOut, loading: authLoading, available: authAvailable } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitType, setNewHabitType] = useState<"course" | "book">("course");
  const [newHabitGoal, setNewHabitGoal] = useState("30");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(60);

  const weekDays = getWeekDays();
  const monthDays = getMonthDays();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const storedGoal = localStorage.getItem(DAILY_GOAL_KEY);
    if (storedGoal) {
      setDailyGoal(parseInt(storedGoal, 10));
    }
  }, []);

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
            return { ...habit, dayEntries, completedDays: undefined, dailyGoal: habit.dailyGoal || 30 };
          }
          return { ...habit, dailyGoal: habit.dailyGoal || 30 };
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

  const handleDailyGoalChange = useCallback((newGoal: number) => {
    setDailyGoal(newGoal);
    localStorage.setItem(DAILY_GOAL_KEY, newGoal.toString());
    toast.success("Цель обновлена!");
  }, []);

  const addHabit = useCallback(() => {
    if (!newHabitName.trim()) {
      toast.error("Введите название");
      return;
    }

    const goalValue = parseInt(newHabitGoal, 10) || 30;

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      type: newHabitType,
      dayEntries: {},
      createdAt: new Date().toISOString(),
      dailyGoal: goalValue,
    };

    setHabits((prev) => [...prev, newHabit]);
    setNewHabitName("");
    setNewHabitGoal("30");
    setIsDialogOpen(false);
    toast.success("Привычка добавлена!");
  }, [newHabitName, newHabitType, newHabitGoal]);

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

  const editHabit = useCallback((habitId: string, name: string, goal: number) => {
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === habitId ? { ...habit, name, dailyGoal: goal } : habit
      )
    );
    toast.success("Изменения сохранены!");
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
    <div className="min-h-screen bg-white">
      <header className="bg-black text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div />
            {authLoading ? (
              <div className="w-20" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 hidden sm:inline">{user.email}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  data-testid="button-logout"
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAuthDialogOpen(true)}
                data-testid="button-login"
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <User className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Войти</span>
              </Button>
            )}
          </div>
          
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl md:text-6xl font-light mb-3 tracking-tight" data-testid="app-title">
              Учебный
              <span className="font-serif italic text-[#e8c4c4] ml-3">трекер</span>
            </h1>
            <p className="text-gray-400 text-lg font-light">
              Отслеживайте прогресс. Достигайте целей.
            </p>
          </motion.div>
        </div>
      </header>

      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.section 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col lg:flex-row items-center gap-12 justify-center">
            <ReadingGoalsCircle 
              todayMinutes={todayMinutes} 
              goalMinutes={dailyGoal}
              onGoalChange={handleDailyGoalChange}
            />
            
            <div className="flex flex-col gap-4">
              <StreakCounter habits={habits} />
              
              <div className="flex items-center gap-4 px-6 py-4 bg-gray-50 rounded-lg">
                <Target className="w-6 h-6 text-gray-400" />
                <div>
                  <p className="text-3xl font-light text-black">{habits.length}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">активных целей</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-5 capitalize text-black">{currentMonth}</h3>
            <MonthCalendar habits={habits} monthDays={monthDays} />
          </div>
        </motion.section>

        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-light text-black">
              Мои курсы и книги
            </h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  data-testid="button-add-habit" 
                  className="gap-2 bg-black text-white hover:bg-gray-800"
                >
                  <Plus className="w-4 h-4" />
                  Добавить
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border border-gray-200">
                <DialogHeader>
                  <DialogTitle className="text-black">Новая учебная привычка</DialogTitle>
                  <DialogDescription className="text-gray-500">
                    Добавьте курс или книгу для отслеживания
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-gray-700 mb-2 block">Название</Label>
                    <Input
                      placeholder="Название курса или книги"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addHabit()}
                      className="bg-gray-50 border-gray-200"
                      data-testid="input-habit-name"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={newHabitType === "course" ? "default" : "outline"}
                      onClick={() => setNewHabitType("course")}
                      className="flex-1"
                      style={{ 
                        backgroundColor: newHabitType === "course" ? COLORS.course : undefined,
                        color: newHabitType === "course" ? "white" : "#374151",
                        borderColor: newHabitType === "course" ? COLORS.course : "#e5e7eb"
                      }}
                      data-testid="button-type-course"
                    >
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Курс
                    </Button>
                    <Button
                      variant={newHabitType === "book" ? "default" : "outline"}
                      onClick={() => setNewHabitType("book")}
                      className="flex-1"
                      style={{ 
                        backgroundColor: newHabitType === "book" ? COLORS.book : undefined,
                        color: newHabitType === "book" ? "#1a1a1a" : "#374151",
                        borderColor: newHabitType === "book" ? COLORS.book : "#e5e7eb"
                      }}
                      data-testid="button-type-book"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Книга
                    </Button>
                  </div>
                  <div>
                    <Label className="text-gray-700 mb-2 block">Цель (минут в день)</Label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={newHabitGoal}
                      onChange={(e) => setNewHabitGoal(e.target.value)}
                      className="bg-gray-50 border-gray-200"
                      min="1"
                      data-testid="input-habit-goal"
                    />
                  </div>
                  <Button 
                    onClick={addHabit} 
                    className="w-full bg-black text-white hover:bg-gray-800" 
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
                className="text-center py-20"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-xl bg-gray-100 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-gray-400" />
                </div>
                <p className="mb-6 text-gray-500">
                  Начните отслеживать свои учебные привычки
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-black text-white hover:bg-gray-800"
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
                    onEdit={editHabit}
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
