
import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
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

  // Effekt zur Überwachung des Verifizierungsstatus
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(email);
    } catch (err: any) {
      console.error(err);
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
        // Falls der User nicht verifiziert ist, wird er durch App.tsx blockiert und hier die UI angepasst
        if (!userCredential.user.emailVerified) {
          setUnverifiedUserEmail(userCredential.user.email);
        }
      } else {
        if (password !== repeatPassword) {
          throw new Error('Passwörter stimmen nicht überein');
        }
        
        // 1. User erstellen (Firebase loggt ihn automatisch ein)
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 2. Profil aktualisieren
        await updateProfile(userCredential.user, {
          displayName: displayName,
          photoURL: photoPreview
        });

        // 3. Verifizierungs-E-Mail senden
        await sendEmailVerification(userCredential.user);
        
        // UI zeigt nun automatisch den Verifizierungs-Screen durch den useEffect oben
        setUnverifiedUserEmail(userCredential.user.email);
      }
    } catch (err: any) {
      console.error(err);
      if (isLogin) {
        setError('Passwort oder E-Mail inkorrekt');
      } else {
        if (err.code === 'auth/email-already-in-use') {
          setError('Benutzer existiert bereits. Anmelden?');
        } else {
          setError(err.message || 'Ein Fehler ist aufgetreten');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // 1. Verifizierungsbildschirm (Wird angezeigt wenn User eingeloggt aber !verified)
  if (unverifiedUserEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500">
        <div className="w-full max-w-md relative">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[40px] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-[32px] flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-inner">
              <MailCheck size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">E-Mail bestätigen</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
              Wir haben Ihnen eine Verifizierungs-E-Mail an <span className="text-blue-600 font-bold">{unverifiedUserEmail}</span> gesendet. 
              Verifizieren Sie diese und loggen Sie sich ein.
            </p>
            <button 
              onClick={handleLogout}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl text-sm font-black shadow-xl transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                  Zum Login
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Passwort-Reset Erfolgsbildschirm
  if (resetEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500">
        <div className="w-full max-w-md relative">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[40px] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-[32px] flex items-center justify-center text-blue-600 mx-auto mb-6 shadow-inner">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">E-Mail versendet</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
              Wir haben einen Link zum Zurücksetzen des Passworts an <span className="text-blue-600 font-bold">{resetEmailSent}</span> gesendet.
            </p>
            <button 
              onClick={() => {
                setResetEmailSent(null);
                setIsForgotPassword(false);
                setIsLogin(true);
              }}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl text-sm font-black shadow-xl transition-all flex items-center justify-center gap-2 group"
            >
              <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
              Zum Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Passwort vergessen Formular
  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500">
        <div className="w-full max-w-md relative">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95 duration-500">
            <button 
              onClick={() => setIsForgotPassword(false)}
              className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
            >
              <ChevronLeft size={16} /> Zurück
            </button>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4">
                <KeyRound size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Passwort vergessen?</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">Geben Sie Ihre E-Mail Adresse ein</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold animate-in shake">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">E-Mail Adresse</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required 
                    type="email" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:text-white"
                    placeholder="name@firma.at"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <button 
                disabled={loading}
                type="submit" 
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Link anfordern'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 4. Standard Auth Form (Login/Registrierung)
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 mb-4">
            <Hexagon fill="currentColor" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">plan4selbst.at</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Business Intelligence für Macher</p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95 duration-500">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
            >
              Login
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${!isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
            >
              Registrieren
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold animate-in shake duration-500">
                <AlertCircle size={16} />
                <span>{error}</span>
                {error.includes('Anmelden?') && (
                  <button type="button" onClick={() => setIsLogin(true)} className="ml-auto underline text-blue-600">Login</button>
                )}
              </div>
            )}

            {!isLogin && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-[32px] bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center transition-all group-hover:border-blue-500">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={32} className="text-slate-300 group-hover:text-blue-500" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handlePhotoUpload}
                    />
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-xl shadow-lg">
                      <PlusIcon size={12} />
                    </div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3">Profilfoto hochladen</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Vollständiger Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required 
                      type="text" 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:text-white"
                      placeholder="Max Mustermann"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">E-Mail Adresse</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required 
                  type="email" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:text-white"
                  placeholder="name@firma.at"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Passwort</label>
                {isLogin && (
                  <button 
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline"
                  >
                    Passwort vergessen?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required 
                  type="password" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:text-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Passwort wiederholen</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required 
                    type="password" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:text-white"
                    placeholder="••••••••"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button 
              disabled={loading}
              type="submit" 
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  {isLogin ? 'Jetzt Anmelden' : 'Konto erstellen'}
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              {isLogin ? 'Noch kein Konto?' : 'Bereits Mitglied?'}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="ml-2 text-blue-600 hover:underline"
              >
                {isLogin ? 'Hier registrieren' : 'Hier einloggen'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlusIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
