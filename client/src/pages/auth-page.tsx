import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.username || !loginForm.password) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate(loginForm, {
      onSuccess: () => {
        setLocation("/dashboard");
      },
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Пароли не совпадают",
        variant: "destructive",
      });
      return;
    }

    if (registerForm.username.length < 5) {
      toast({
        title: "Ошибка",
        description: "Имя пользователя должно быть не менее 5 символов",
        variant: "destructive",
      });
      return;
    }

    if (registerForm.password.length < 8) {
      toast({
        title: "Ошибка",
        description: "Пароль должен быть не менее 8 символов",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      toast({
        title: "Ошибка",
        description: "Введите корректный email адрес",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password,
    }, {
      onSuccess: () => {
        setLocation("/dashboard");
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hero Section */}
        <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <i className="fas fa-graduation-cap text-primary-foreground"></i>
            </div>
            <span className="text-2xl font-bold text-foreground">ProjectEnt</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Система тестирования ЕНТ
            </h1>
            <p className="text-xl text-muted-foreground">
              Современная платформа для подготовки к Единому Национальному Тестированию
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                <i className="fas fa-check text-accent-foreground text-xs"></i>
              </div>
              <span className="text-muted-foreground">Интерактивные тесты по всем предметам</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                <i className="fas fa-check text-accent-foreground text-xs"></i>
              </div>
              <span className="text-muted-foreground">Детальная статистика и прогресс</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                <i className="fas fa-check text-accent-foreground text-xs"></i>
              </div>
              <span className="text-muted-foreground">Рейтинговая система</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                <i className="fas fa-check text-accent-foreground text-xs"></i>
              </div>
              <span className="text-muted-foreground">Инструменты: калькулятор, таблица Менделеева</span>
            </div>
          </div>
        </div>

        {/* Auth Forms */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex space-x-1 bg-muted p-1 rounded-md">
              <Button
                variant={isLogin ? "default" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setIsLogin(true)}
                data-testid="button-switch-login"
              >
                Вход
              </Button>
              <Button
                variant={!isLogin ? "default" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setIsLogin(false)}
                data-testid="button-switch-register"
              >
                Регистрация
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-4" data-testid="form-login">
                <CardTitle>Войти в систему</CardTitle>
                <div className="space-y-2">
                  <Label htmlFor="login-username">Имя пользователя</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Введите имя пользователя"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    data-testid="input-login-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Введите пароль"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    data-testid="input-login-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                  data-testid="button-login-submit"
                >
                  {loginMutation.isPending ? "Вход..." : "Войти"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4" data-testid="form-register">
                <CardTitle>Создать аккаунт</CardTitle>
                <div className="space-y-2">
                  <Label htmlFor="register-username">Имя пользователя</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="Минимум 5 символов"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                    data-testid="input-register-username"
                  />
                  <p className="text-xs text-muted-foreground">
                    Только буквы и цифры, от 5 до 20 символов
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="user@example.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    data-testid="input-register-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Пароль</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Минимум 8 символов"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                    data-testid="input-register-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Минимум 8 символов, должен содержать буквы и цифры
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Подтвердите пароль</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="Повторите пароль"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    data-testid="input-register-confirm-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                  data-testid="button-register-submit"
                >
                  {registerMutation.isPending ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
