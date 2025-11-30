import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || "Ошибка входа");
        } else {
          toast.success("Добро пожаловать!");
          setLocation("/");
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(error.message || "Ошибка регистрации");
        } else {
          toast.success("Регистрация успешна! Проверьте почту для подтверждения.");
          setIsLogin(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDEBDD] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/90 backdrop-blur-sm border-[#bd7880]/20 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-12 h-12 bg-[#4d0011]/10 rounded-xl flex items-center justify-center"
              >
                <GraduationCap className="w-6 h-6 text-[#4d0011]" />
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="w-12 h-12 bg-[#102b1f]/10 rounded-xl flex items-center justify-center"
              >
                <BookOpen className="w-6 h-6 text-[#102b1f]" />
              </motion.div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-[#4d0011]">
                Учебный трекер
              </CardTitle>
              <CardDescription className="text-[#856D55]">
                {isLogin ? "Войдите в свой аккаунт" : "Создайте новый аккаунт"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#4d0011]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                  className="border-[#bd7880]/30 focus:border-[#4d0011] focus:ring-[#4d0011]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#4d0011]">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="input-password"
                  className="border-[#bd7880]/30 focus:border-[#4d0011] focus:ring-[#4d0011]/20"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                data-testid="button-submit"
                className="w-full bg-gradient-to-r from-[#4d0011] to-[#bd7880] hover:from-[#4d0011]/90 hover:to-[#bd7880]/90 text-white"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isLogin ? (
                  "Войти"
                ) : (
                  "Зарегистрироваться"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                data-testid="button-toggle-auth"
                className="text-sm text-[#bd7880] hover:text-[#4d0011] transition-colors"
              >
                {isLogin ? "Нет аккаунта? Зарегистрируйтесь" : "Уже есть аккаунт? Войдите"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
