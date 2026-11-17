import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, sendEmailVerification, reload, signOut, updateProfile } from "firebase/auth";
import { auth, googleProvider, githubProvider } from "../firebase.js";
import api, { clearApiCache } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tick, bump] = useReducer((x) => x + 1, 0);

  const refreshProfile = useCallback(async () => {
    try { const { data } = await api.get("/api/users/me"); setProfile(data); return data; }
    catch (err) { console.error("Could not load profile:", err); return null; }
  }, []);

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    setFirebaseUser(user);
    if (user) await refreshProfile(); else setProfile(null);
    setLoading(false);
  }), [refreshProfile]);

  const value = useMemo(() => ({
    firebaseUser, profile, loading,
    isAdmin: profile?.role === "admin",
    isModerator: profile?.role === "moderator" || profile?.role === "admin",
    refreshProfile,
    async register(name, email, password) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await cred.user.getIdToken(true); // server then sees the real name, not the email prefix
      sendEmailVerification(cred.user).catch(() => {});
      await refreshProfile();
      return cred.user;
    },
    login: (email, password) => signInWithEmailAndPassword(auth, email, password),
    loginWithGoogle: () => signInWithPopup(auth, googleProvider),
    loginWithGithub: () => signInWithPopup(auth, githubProvider),
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
    async sendVerificationEmail() { if (!auth.currentUser) throw new Error("Not signed in"); return sendEmailVerification(auth.currentUser); },
    async refreshFirebaseUser() {
      if (!auth.currentUser) return null;
      await reload(auth.currentUser);
      await auth.currentUser.getIdToken(true);
      setFirebaseUser(auth.currentUser);
      bump();
      return auth.currentUser;
    },
    async logout() { await signOut(auth); clearApiCache(); },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [firebaseUser, profile, loading, refreshProfile, tick]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
