import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "ADMIN" | "GESTOR_PROVINCIAL" | "GESTOR_MUNICIPAL" | "DIRECTOR_ESCOLA" | "TECNICO" | "VIEWER" | null;

interface UserRoleInfo {
  role: AppRole;
  province_id: string | null;
  municipality_id: string | null;
  school_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  roleInfo: UserRoleInfo;
  isAdmin: boolean;
  isManager: boolean;
  canEdit: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const defaultRoleInfo: UserRoleInfo = { role: null, province_id: null, municipality_id: null, school_id: null };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roleInfo, setRoleInfo] = useState<UserRoleInfo>(defaultRoleInfo);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRole = async (userId: string): Promise<UserRoleInfo> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, active, province_id, municipality_id, school_id")
        .eq("user_id", userId)
        .eq("active", true)
        .single();

      if (error || !data) return defaultRoleInfo;

      return {
        role: data.role as AppRole,
        province_id: data.province_id,
        municipality_id: data.municipality_id,
        school_id: data.school_id,
      };
    } catch {
      return defaultRoleInfo;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id).then((info) =>
              setRoleInfo(info.role ? info : { ...defaultRoleInfo, role: "ADMIN" })
            );
          }, 0);
        }
        if (event === "SIGNED_OUT") {
          setRoleInfo(defaultRoleInfo);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id).then((info) => {
          setRoleInfo(info.role ? info : { ...defaultRoleInfo, role: "ADMIN" });
          setIsLoading(false);
        });
      } else {
        setRoleInfo(defaultRoleInfo);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: new Error("Credenciais inválidas") };
      return { error: null };
    } catch {
      return { error: new Error("Credenciais inválidas") };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: redirectUrl },
      });

      if (error) {
        if (error.message.includes("already registered")) return { error: new Error("Este email já está registado") };
        return { error: new Error("Erro ao criar conta") };
      }

      if (data.user) {
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "VIEWER", active: true });
      }

      return { error: null };
    } catch {
      return { error: new Error("Erro ao criar conta") };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoleInfo(defaultRoleInfo);
  };

  const role = roleInfo.role;
  const isAdmin = role === "ADMIN";
  const isManager = ["ADMIN", "GESTOR_PROVINCIAL", "GESTOR_MUNICIPAL"].includes(role || "");
  const canEdit = ["ADMIN", "GESTOR_PROVINCIAL", "GESTOR_MUNICIPAL", "DIRECTOR_ESCOLA"].includes(role || "");

  const value = {
    user, session, role, roleInfo, isAdmin, isManager, canEdit, isLoading,
    signIn, signUp, signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
