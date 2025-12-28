
import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';
import { 
  Hexagon, 
  Mail, 
  Lock, 
  User, 
  Camera, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  MailCheck,
  ChevronLeft,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedUserEmail, setUnverifiedUserEmail] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !user.emailVerified) {
        setUnverifiedUserEmail(user.email);
      } else if (!user) {
        setUnverifiedUserEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    // Google fordert oft eine Account-Auswahl
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
      // App.tsx erkennt den Statuswechsel automatisch
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google-Login ist in der Firebase Console noch nicht aktiviert.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Das Login-Fenster wurde von Ihrem Browser blockiert.');
      } else {
        setError('Die Anmeldung mit Google ist fehlgeschlagen.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(email);
    } catch (err: any) {
      setError('E-Mail konnte nicht gesendet werden. Überprüfen Sie die Adresse.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUnverifiedUserEmail(null);
      setIsLogin(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setUnverifiedUserEmail(userCredential.user.email);
        }
      } else {
        if (password !== repeatPassword) {
          throw new Error('Passwörter stimmen nicht überein');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: displayName,
          photoURL: photoPreview
        });
        await sendEmailVerification(userCredential.user);
        setUnverifiedUserEmail(userCredential.user.email);
      }
    } catch (err: any) {
      if (isLogin) {
        setError('Passwort oder E-Mail inkorrekt.');
      } else {
        if (err.code === 'auth/email-already-in-use') {
          setError('Benutzer existiert bereits. Anmelden?');
        } else {
          setError('Registrierung fehlgeschlagen. Bitte prüfen Sie Ihre Daten.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // UI RENDERING
  if (unverifiedUserEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500 text-center">
        <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[40px] shadow-2xl p-10 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-[32px] flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-inner">
            <MailCheck size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">E-Mail bestätigen</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
            Wir haben Ihnen eine Verifizierungs-E-Mail an <span className="text-blue-600 font-bold">{unverifiedUserEmail}</span> gesendet. Verifizieren Sie diese und loggen Sie sich ein.
          </p>
          <button onClick={handleLogout} className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl text-sm font-black shadow-xl transition-all flex items-center justify-center gap-2 group">
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <><ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" /> Zum Login</>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (resetEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500 text-center">
        <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[40px] shadow-2xl p-10 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-[32px] flex items-center justify-center text-blue-600 mx-auto mb-6 shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">E-Mail versendet</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
            Wir haben einen Link zum Zurücksetzen des Passworts an <span className="text-blue-600 font-bold">{resetEmailSent}</span> gesendet.
          </p>
          <button onClick={() => { setResetEmailSent(null); setIsForgotPassword(false); setIsLogin(true); }} className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl text-sm font-black shadow-xl transition-all flex items-center justify-center gap-2 group">
            <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" /> Zum Login
          </button>
        </div>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500">
        <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95 duration-500">
          <button onClick={() => setIsForgotPassword(false)} className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
            <ChevronLeft size={16} /> Zurück
          </button>
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4"><KeyRound size={32} /></div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Passwort vergessen?</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">E-Mail Adresse für Reset-Link eingeben</p>
          </div>
          <form onSubmit={handleResetPassword} className="space-y-5">
            {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold animate-in shake"><AlertCircle size={16} /><span>{error}</span></div>}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="email" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:text-white" placeholder="name@firma.at" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <button disabled={loading} type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Link anfordern'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500">
      <div className="w-full max-w-md relative">
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 mb-4"><Hexagon fill="currentColor" size={32} /></div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">plan4selbst.at</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Business Intelligence für Macher</p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95 duration-500">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8">
            <button onClick={() => { setIsLogin(true); setError(null); }} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>Login</button>
            <button onClick={() => { setIsLogin(false); setError(null); }} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${!isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>Registrieren</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold animate-in shake duration-500"><AlertCircle size={16} /><span>{error}</span></div>}

            {!isLogin && (
              <div className="space-y-5">
                <div className="flex flex-col items-center mb-2">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-[32px] bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center transition-all group-hover:border-blue-500">
                      {photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" /> : <Camera size={32} className="text-slate-300 group-hover:text-blue-500" />}
                    </div>
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoUpload} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3">Profilfoto (optional)</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Name</label>
                  <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input required type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:text-white" placeholder="Max Mustermann" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">E-Mail Adresse</label>
              <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input required type="email" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:text-white" placeholder="name@firma.at" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Passwort</label>
                {isLogin && <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">Passwort vergessen?</button>}
              </div>
              <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input required type="password" name="password" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:text-white" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Passwort wiederholen</label>
                <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input required type="password" name="repeat" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:text-white" placeholder="••••••••" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} /></div>
              </div>
            )}

            <div className="space-y-4 pt-2">
              <button disabled={loading} type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                  <>{isLogin ? 'Jetzt Anmelden' : 'Konto erstellen'}<ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></>
                )}
              </button>
              <div className="relative py-4 flex items-center"><div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div><span className="flex-shrink mx-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Oder</span><div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div></div>
              <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-sm font-black shadow-sm transition-all flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98] disabled:opacity-50">
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google Anmeldung
              </button>
            </div>
          </form>
          <div className="mt-8 text-center"><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{isLogin ? 'Noch kein Konto?' : 'Bereits Mitglied?'}<button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="ml-2 text-blue-600 hover:underline">{isLogin ? 'Hier registrieren' : 'Hier einloggen'}</button></p></div>
        </div>
      </div>
    </div>
  );
};
