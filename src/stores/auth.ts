import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/services/supabase";
import type { User, UserProfile } from "@/types";
import type { AuthError } from "@supabase/supabase-js";

interface AuthResponse {
  success: boolean;
  error?: string;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const profile = ref<UserProfile | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const isAuthenticated = computed(() => !!user.value);
  const isDemoUser = computed(() => user.value?.isAnonymous === true);
  const userEmail = computed(() => user.value?.email || "");
  const userName = computed(() => profile.value?.name || "");

  let _authSubscription: {
    data: { subscription: { unsubscribe: () => void } };
  } | null = null;
  let _initializingPromise: Promise<void> | null = null;
  //const userNickname = computed(() => profile.value?.nickname || '')

  async function loadProfile(userId: string) {
    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.warn("Profile not found:", profileError.message);
        profile.value = null;
        return;
      }

      profile.value = data as UserProfile;
    } catch (e) {
      console.error("Failed to load profile:", e);
      profile.value = null;
    }
  }

  async function setUserFromSession(sessionUser: {
    id: string;
    email?: string | null;
    created_at: string;
    is_anonymous?: boolean;
  }) {
    user.value = {
      id: sessionUser.id,
      email: sessionUser.email ?? null,
      createdAt: sessionUser.created_at,
      isAnonymous: sessionUser.is_anonymous === true,
    };

    await loadProfile(sessionUser.id);
  }

  // async function initialize() {
  //   if (_initializingPromise) return _initializingPromise;

  //   loading.value = true;
  //   try {
  //     const {
  //       data: { session },
  //     } = await supabase.auth.getSession();
  //     console.log("getSession session", session);
  //     if (session?.user) {
  //       await setUserFromSession(session.user);
  //     } else {
  //       user.value = null;
  //       profile.value = null;
  //     }

  //     supabase.auth.onAuthStateChange(async (_event, session) => {
  //       if (session?.user) {
  //         await setUserFromSession(session.user);
  //       } else {
  //         user.value = null;
  //         profile.value = null;
  //       }
  //     });
  //   } catch (e) {
  //     const authError = e as AuthError;
  //     error.value = authError.message;
  //     console.error("Auth initialization error:", authError);
  //   } finally {
  //     loading.value = false;
  //   }
  // }

  async function initialize() {
    // Если уже инициализируется — ждём того же промиса, не запускаем новый
    if (_initializingPromise) return _initializingPromise

    _initializingPromise = (async () => {
      loading.value = true
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await setUserFromSession(session.user)
        } else {
          user.value = null
          profile.value = null
        }

        // Отписываемся от предыдущего подписчика перед созданием нового
        _authSubscription?.data.subscription.unsubscribe()

        _authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
          if (
            //event === 'SIGNED_IN'
           // ||
             event === 'TOKEN_REFRESHED') {
            if (session?.user) await setUserFromSession(session.user)
          } else if (event === 'SIGNED_OUT') {
            user.value = null
            profile.value = null
          }
          // INITIAL_SESSION — игнорируем, уже обработали через getSession()
        })
      } catch (e) {
        const authError = e as AuthError
        error.value = authError.message
        console.error('Auth initialization error:', authError)
      } finally {
        loading.value = false
      }
    })()

    return _initializingPromise
  }

  async function signUp(
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthResponse> {
    loading.value = true;
    error.value = null;

    try {
      // Валидация
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Шаг 1: Регистрация пользователя в Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email,
          password,
          options: {
            data: {
              name: name?.trim() || "",
            },
          },
        },
      );

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error("User registration failed");
      }

      // Устанавливаем пользователя в состояние
      await setUserFromSession(
        authData.user as Parameters<typeof setUserFromSession>[0],
      );

      // Шаг 2: Создаем профиль в таблице profiles (если передано имя)
      // if (name && name.trim()) {
      //   const { data: profileData, error: profileError } = await supabase
      //     .from('profiles')
      //     .insert({
      //       id: authData.user.id, // Foreign key на auth.users.id
      //       name: name.trim()
      //     })
      //     .select()
      //     .single()

      //   if (profileError) {
      //     console.error('Profile creation failed:', profileError)
      //     // Можно добавить логику повторной попытки или оставить профиль пустым
      //   } else {
      //     profile.value = profileData as UserProfile
      //   }
      // }

      await loadProfile(authData.user.id);

      return { success: true };
    } catch (e) {
      const authError = e as AuthError | Error;
      error.value = authError.message;
      return { success: false, error: authError.message };
    } finally {
      loading.value = false;
    }
  }

  async function signIn(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    loading.value = true;
    error.value = null;

    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      if (signInError) throw signInError;
      if (!data.user) {
        throw new Error("Sign in failed");
      }
      await setUserFromSession(data.user as any);

      return { success: true };
    } catch (e) {
      const authError = e as AuthError | Error;
      error.value = authError.message;
      return { success: false, error: authError.message };
    } finally {
      loading.value = false;
    }
  }

  async function signInAnonymously(): Promise<AuthResponse> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: signInError } =
        await supabase.auth.signInAnonymously();

      if (signInError) throw signInError;
      if (!data.user) {
        throw new Error("Anonymous sign in failed");
      }

      await setUserFromSession(data.user as any);

      return { success: true };
    } catch (e) {
      const authError = e as AuthError | Error;
      error.value = authError.message;
      return { success: false, error: authError.message };
    } finally {
      loading.value = false;
    }
  }

  async function signOut() {
    loading.value = true;
    try {
      await supabase.auth.signOut();
      user.value = null;
      profile.value = null;
      error.value = null;
      const { useMediaStore } = await import("./media");
      const mediaStore = useMediaStore();
      mediaStore.clearUserMedia();
    } catch (e) {
      const authError = e as AuthError;
      error.value = authError.message;
      console.error("Sign out error:", authError);
    } finally {
      loading.value = false;
    }
  }
  async function updateProfile(updates: {
    name?: string;
    nickname?: string;
  }): Promise<AuthResponse> {
    if (!user.value) {
      return { success: false, error: "User not authenticated" };
    }

    loading.value = true;
    error.value = null;

    try {
      // Валидация
      if (updates.name !== undefined && !updates.name.trim()) {
        throw new Error("Name cannot be empty");
      }

      // Обновляем профиль в БД
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.value.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Обновляем локальное состояние
      if (profile.value && data) {
        profile.value = {
          ...profile.value,
          ...data,
        };
      }

      return { success: true };
    } catch (e) {
      const err = e as Error;
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  }
  function clearError() {
    error.value = null;
  }

  return {
    user,
    profile,
    loading,
    error,

    isAuthenticated,
    isDemoUser,
    userEmail,
    userName,

    initialize,
    signUp,
    signIn,
    signInAnonymously,
    signOut,
    updateProfile,
    clearError,
  };
});

// import { defineStore } from 'pinia'
// import { ref, computed } from 'vue'
// import { supabase } from '@/services/supabase'
// import type { User } from '@/types'
// import type { AuthError } from '@supabase/supabase-js'

// interface AuthResponse {
//   success: boolean
//   error?: string
// }

// export const useAuthStore = defineStore('auth', () => {
//   const user = ref<User | null>(null)
//   const loading = ref(false)
//   const error = ref<string | null>(null)

//   const isAuthenticated = computed(() => !!user.value)

//   async function initialize() {
//     loading.value = true
//     try {
//       const { data: { session } } = await supabase.auth.getSession()

//       if (session?.user) {
//         user.value = {
//           id: session.user.id,
//           email: session.user.email!,
//           createdAt: session.user.created_at
//         }
//       }

//       // Подписываемся на изменения auth состояния
//       // Когда пользователь логинится/разлогинивается - обновляем состояние
//       supabase.auth.onAuthStateChange((_event, session) => {
//         if (session?.user) {
//           user.value = {
//             id: session.user.id,
//             email: session.user.email!,
//             createdAt: session.user.created_at
//           }
//         } else {
//           user.value = null
//         }
//       })
//     } catch (e) {
//       const authError = e as AuthError
//       error.value = authError.message
//     } finally {
//       loading.value = false
//     }
//   }

//   async function signUp(email: string, password: string): Promise<AuthResponse> {
//     loading.value = true
//     error.value = null
//     try {
//       const { data, error: signUpError } = await supabase.auth.signUp({
//         email,
//         password
//       })

//       if (signUpError) throw signUpError

//       if (data.user) {
//         user.value = {
//           id: data.user.id,
//           email: data.user.email!,
//           createdAt: data.user.created_at
//         }
//       }

//       return { success: true }
//     } catch (e) {
//       const authError = e as AuthError
//       error.value = authError.message
//       return { success: false, error: authError.message }
//     } finally {
//       loading.value = false
//     }
//   }

//   async function signIn(email: string, password: string): Promise<AuthResponse> {
//     loading.value = true
//     error.value = null
//     try {
//       const { data, error: signInError } = await supabase.auth.signInWithPassword({
//         email,
//         password
//       })

//       if (signInError) throw signInError

//       if (data.user) {
//         user.value = {
//           id: data.user.id,
//           email: data.user.email!,
//           createdAt: data.user.created_at
//         }
//       }

//       return { success: true }
//     } catch (e) {
//       const authError = e as AuthError
//       error.value = authError.message
//       return { success: false, error: authError.message }
//     } finally {
//       loading.value = false
//     }
//   }

//   async function signOut() {
//     loading.value = true
//     try {
//       await supabase.auth.signOut()
//       user.value = null
//     } catch (e) {
//       const authError = e as AuthError
//       error.value = authError.message
//     } finally {
//       loading.value = false
//     }
//   }

//   return {
//     user,
//     loading,
//     error,
//     isAuthenticated,
//     initialize,
//     signUp,
//     signIn,
//     signOut
//   }
// })
