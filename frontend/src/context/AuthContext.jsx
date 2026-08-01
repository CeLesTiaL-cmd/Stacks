import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, githubProvider } from "../firebase.js";
import api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null); // Mongo user document
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    try {
      const { data } = await api.get("/api/users/me");
      setProfile(data);
      return data;
    } catch (err) {
      console.error("Could not load profile:", err);
      return null;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await refreshProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    firebaseUser,
    profile,
    loading,
    isAdmin: profile?.role === "admin",
    isModerator: profile?.role === "moderator" || profile?.role === "admin",
    refreshProfile,
    async register(name, email, password) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await refreshProfile();
      return cred.user;
    },
    async login(email, password) {
      return signInWithEmailAndPassword(auth, email, password);
    },
    async loginWithGoogle() {
      return signInWithPopup(auth, googleProvider);
    },
    async loginWithGithub() {
      return signInWithPopup(auth, githubProvider);
    },
    async resetPassword(email) {
      return sendPasswordResetEmail(auth, email);
    },
    async logout() {
      await signOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
