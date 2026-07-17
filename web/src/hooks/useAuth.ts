import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserType = 'buyer' | 'investor' | 'both';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(loginErrorMessage(error.message));
  }

  // Returns whether a session was created immediately — depends on the
  // Supabase project's "Confirm email" setting. If it's on, signUp
  // succeeds but returns no session until the user clicks the
  // confirmation link, so the caller shouldn't redirect to a page that
  // assumes an active session.
  async function register(email: string, password: string, userType: UserType): Promise<{ hasSession: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { user_type: userType } },
    });
    if (error) throw new Error(registerErrorMessage(error.message));
    return { hasSession: !!data.session };
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error('E-Mail konnte nicht gesendet werden.');
  }

  // Only valid once the recovery-link session (set up by supabase-js
  // parsing the URL on /reset-password) is active — see ResetPasswordForm.
  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error('Passwort konnte nicht aktualisiert werden.');
  }

  return { currentUser, loading, login, register, logout, resetPassword, updatePassword };
}

function loginErrorMessage(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-Mail oder Passwort ist falsch.';
  if (message.includes('Email not confirmed')) return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
  return 'Anmeldung fehlgeschlagen.';
}

function registerErrorMessage(message: string): string {
  if (message.includes('already registered') || message.includes('already exists')) {
    return 'Für diese E-Mail existiert bereits ein Konto.';
  }
  if (message.includes('Password should be at least')) return 'Das Passwort ist zu kurz (mind. 6 Zeichen).';
  return 'Registrierung fehlgeschlagen.';
}
