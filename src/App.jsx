import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── CONFIG ───────────────────────────────────────────────────
const SUPABASE_URL      = "https://iqjjbzmygqrmfhjzgvov.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlxampiem15Z3FybWZoanpndm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTMyMzYsImV4cCI6MjA5NTU2OTIzNn0.d6m9aoMHt6J0VpRPnKG7eUN9imC2enwDotxsMjyO0xs";
const STRIPE_LINKS = {
  starter: "https://buy.stripe.com/test_fZu5kF8g2dCz9bS7YX8so00",
  pro:     "https://buy.stripe.com/test_cNi4gBcwigOLfAg5QP8so01",
  agency:  "https://buy.stripe.com/test_bJe5kF67UeGDbk05QP8so02",
};
// ─────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PLANS = [
  { id: "free",    name: "Free",    price: 0,  credits: 10,   color: "#6b7280", icon: "🌱" },
  { id: "starter", name: "Starter", price: 9,  credits: 100,  color: "#f59e0b", icon: "⚡" },
  { id: "pro",     name: "Pro",     price: 29, credits: 500,  color: "#8b5cf6", icon: "🚀" },
  { id: "agency",  name: "Agency",  price: 79, credits: 2000, color: "#06b6d4", icon: "🏢" },
];

const TOOLS = [
  { id: "copy",    label: "Ad Copy",        icon: "📢", cost: 2, desc: "Pubs Facebook & Google Ads",      placeholder: "Ex: Montre connectée sport 149€, résistante à l'eau, autonomie 7j" },
  { id: "email",   label: "Email Marketing", icon: "📧", cost: 3, desc: "Séquences email persuasives",     placeholder: "Ex: Lancement de ma formation en ligne sur le dropshipping" },
  { id: "social",  label: "Posts Réseaux",  icon: "📱", cost: 1, desc: "Instagram, LinkedIn, Twitter",    placeholder: "Ex: Mon agence de design freelance spécialisée en identité de marque" },
  { id: "seo",     label: "Article SEO",    icon: "🔍", cost: 5, desc: "Articles optimisés Google",       placeholder: "Ex: Comment faire du dropshipping en 2025 pour débutants" },
  { id: "product", label: "Fiche Produit",  icon: "🛍️", cost: 2, desc: "Descriptions e-commerce",        placeholder: "Ex: Huile essentielle de lavande bio 30ml, made in France" },
  { id: "pitch",   label: "Pitch Deck",     icon: "🚀", cost: 4, desc: "Argumentaire investisseur",       placeholder: "Ex: App mobile livraison repas sains, levée de fonds seed 200k€" },
];

const PROMPTS = {
  copy:    (i) => `Tu es un expert en copywriting publicitaire. Génère 3 variantes de pub Facebook/Instagram pour : "${i}". Chaque variante : TITRE (accrocheur, max 40 car), TEXTE (2-3 phrases avec bénéfices et émotion), CTA (puissant). Formate clairement. Réponds en français.`,
  email:   (i) => `Tu es un expert en email marketing. Rédige un email marketing complet pour : "${i}". Structure : OBJET (percutant), PRÉ-HEADER, INTRODUCTION (accrocheuse), CORPS (bénéfices concrets), PREUVE SOCIALE (chiffre ou témoignage fictif), CTA (clair), PS (urgence). Réponds en français.`,
  social:  (i) => `Tu es un expert social media. Génère 3 posts optimisés pour : "${i}". Un pour INSTAGRAM (storytelling + emojis), un pour LINKEDIN (professionnel + insights), un pour TWITTER/X (punch + thread hook). Avec hashtags adaptés à chaque plateforme. Réponds en français.`,
  seo:     (i) => `Tu es un rédacteur SEO expert. Pour le sujet "${i}", génère : 1) TITRE H1 optimisé SEO, 2) META-DESCRIPTION (155 car max), 3) PLAN DÉTAILLÉ (H2 + H3), 4) INTRODUCTION complète de 200 mots avec le mot-clé principal. Réponds en français.`,
  product: (i) => `Tu es un expert e-commerce et copywriting. Rédige une fiche produit complète pour : "${i}". Structure : TITRE SEO, ACCROCHE (1 phrase), DESCRIPTION PRINCIPALE (bénéfices + caractéristiques, 150 mots), POINTS CLÉS (5 bullets), FAQ (3 questions/réponses). Réponds en français.`,
  pitch:   (i) => `Tu es un expert en business development. Rédige un pitch exécutif percutant pour : "${i}". Structure : PROBLÈME (douleur du marché), SOLUTION (ta proposition), MARCHÉ CIBLE (taille + profil), VALEUR UNIQUE (pourquoi toi), MODÈLE ÉCONOMIQUE (comment tu gagnes de l'argent), CALL TO ACTION. Réponds en français.`,
};

/* ─── Composants utilitaires ─────────────────────────────── */

function Typewriter({ text }) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setShown(""); setDone(false);
    if (!text) return;
    let i = 0;
    const t = setInterval(() => {
      setShown(text.slice(0, ++i));
      if (i >= text.length) { clearInterval(t); setDone(true); }
    }, 5);
    return () => clearInterval(t);
  }, [text]);
  return <span style={{ whiteSpace: "pre-wrap" }}>{shown}{!done && text && <span className="cursor">▋</span>}</span>;
}

function Toast({ msg, type }) {
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      background: type === "error" ? "#450a0a" : "#052e16",
      border: `1px solid ${type === "error" ? "#dc2626" : "#16a34a"}`,
      borderRadius: 12, padding: "12px 20px", fontSize: 14,
      animation: "fadeUp .3s ease", boxShadow: "0 8px 32px #0009", color: "#e8e8f0",
      maxWidth: 320,
    }}>
      {msg}
    </div>
  );
}

/* ─── Écran Auth ─────────────────────────────────────────── */

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handle = async () => {
    if (!email || !password) return setMsg({ text: "Remplis tous les champs", type: "error" });
    setLoading(true); setMsg(null);
    const { data, error } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (error) setMsg({ text: error.message, type: "error" });
    else if (mode === "signup") setMsg({ text: "✓ Vérifie ton email pour confirmer ton compte !", type: "ok" });
    else onAuth(data.user);
    setLoading(false);
  };

  const inp = {
    width: "100%", background: "#0e0e18", border: "1px solid #2a2a3e",
    borderRadius: 10, padding: "13px 16px", color: "#e8e8f0",
    fontSize: 14, fontFamily: "inherit", outline: "none",
    transition: "border-color .2s, box-shadow .2s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07070f", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400, animation: "fadeUp .4s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 34, fontWeight: 800, marginBottom: 6 }}>
            <span style={{ color: "#7c3aed" }}>copy</span><span style={{ color: "#e8e8f0" }}>flow</span>
            <sup style={{ color: "#7c3aed", fontSize: 12, fontFamily: "inherit", fontWeight: 700 }}>AI</sup>
          </div>
          <p style={{ color: "#444", fontSize: 14 }}>Génère du contenu marketing qui convertit</p>
        </div>

        <div style={{ background: "#0e0e18", border: "1px solid #1a1a2e", borderRadius: 20, padding: 32 }}>
          {/* Toggle */}
          <div style={{ display: "flex", background: "#07070f", borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {[["login", "Connexion"], ["signup", "Inscription"]].map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "9px", borderRadius: 8, border: "none",
                background: mode === m ? "#7c3aed" : "transparent",
                color: mode === m ? "#fff" : "#555",
                fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                transition: "all .2s",
              }}>{label}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input style={inp} type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} />
            <input style={inp} type="password" placeholder="Mot de passe (min 6 caractères)" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handle()} />
          </div>

          {msg && (
            <div style={{
              marginTop: 14, padding: "10px 14px", borderRadius: 8,
              background: msg.type === "error" ? "#450a0a" : "#052e16",
              color: msg.type === "error" ? "#fca5a5" : "#86efac", fontSize: 13,
            }}>{msg.text}</div>
          )}

          <button onClick={handle} disabled={loading} style={{
            width: "100%", marginTop: 18,
            background: loading ? "#1a1a2e" : "linear-gradient(135deg,#7c3aed,#5b21b6)",
            border: "none", borderRadius: 12, padding: "14px",
            color: "#fff", fontSize: 15, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
            transition: "all .2s",
          }}>
            {loading ? "..." : mode === "login" ? "Se connecter →" : "Créer mon compte →"}
          </button>

          {mode === "signup" && (
            <p style={{ color: "#3a3a4a", fontSize: 12, textAlign: "center", marginTop: 14 }}>
              🎁 10 crédits offerts à l'inscription · Sans carte bancaire
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Modale Pricing ─────────────────────────────────────── */

function PricingModal({ profile, onClose, onUpgrade, onStripe }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#0e0e18", border: "1px solid #1a1a2e", borderRadius: 24, padding: 36, maxWidth: 720, width: "100%", animation: "fadeUp .3s ease" }}>
        <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 26, textAlign: "center", marginBottom: 6 }}>Choisir un plan</h2>
        <p style={{ color: "#444", fontSize: 13, textAlign: "center", marginBottom: 30 }}>
          Paiement sécurisé via Stripe · Annulation à tout moment
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
          {PLANS.map(p => {
            const isActive = profile?.plan === p.id;
            return (
              <div key={p.id} style={{
                background: isActive ? `${p.color}0f` : "#07070f",
                border: `2px solid ${isActive ? p.color : "#1a1a2e"}`,
                borderRadius: 18, padding: 20, textAlign: "center",
              }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>{p.icon}</div>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: p.color, fontSize: 15 }}>{p.name}</div>
                <div style={{ fontSize: 24, fontWeight: 700, margin: "8px 0", color: "#e8e8f0" }}>
                  {p.price === 0 ? "Gratuit" : `${p.price}€`}
                </div>
                <div style={{ color: "#444", fontSize: 11, marginBottom: 4 }}>/mois</div>
                <div style={{ color: "#666", fontSize: 12, marginBottom: 16 }}>{p.credits} crédits</div>

                {p.id === "free" ? (
                  <div style={{ fontSize: 12, color: "#333", padding: "8px", borderRadius: 8, border: "1px solid #1a1a2e" }}>
                    {isActive ? "✓ Actif" : "Gratuit"}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button onClick={() => onStripe(p.id)} style={{
                      background: p.color, border: "none", borderRadius: 9, padding: "9px 0",
                      color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%",
                    }}>
                      {isActive ? "✓ Actif" : "Payer →"}
                    </button>
                    <button onClick={() => onUpgrade(p)} style={{
                      background: "transparent", border: "1px solid #2a2a3e", borderRadius: 9, padding: "7px 0",
                      color: "#444", fontSize: 11, cursor: "pointer", width: "100%",
                    }}>
                      Tester (sans payer)
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={onClose} style={{
          display: "block", margin: "24px auto 0",
          background: "transparent", border: "1px solid #1a1a2e",
          color: "#444", padding: "9px 28px", borderRadius: 10, cursor: "pointer", fontSize: 13,
        }}>Fermer</button>
      </div>
    </div>
  );
}

/* ─── App principale ─────────────────────────────────────── */

export default function App() {
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [view, setView]           = useState("home");   // home | history
  const [tool, setTool]           = useState(null);
  const [input, setInput]         = useState("");
  const [output, setOutput]       = useState("");
  const [generating, setGenerating] = useState(false);
  const [toast, setToast]         = useState(null);
  const [history, setHistory]     = useState([]);
  const [showPricing, setShowPricing] = useState(false);
  const [booting, setBooting]     = useState(true);

  const notify = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadProfile = useCallback(async (uid) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (data) setProfile(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); loadProfile(session.user.id); }
      setBooting(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setUser(session.user); loadProfile(session.user.id); }
      else { setUser(null); setProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const logout = async () => {
    await supabase.auth.signOut();
    setView("home"); setTool(null); setOutput("");
  };

  /* ── Génération IA ─────────────────────────────────────── */
  const generate = async () => {
    if (!input.trim()) return notify("Entre une description d'abord", "error");
    const t = TOOLS.find(x => x.id === tool);
    if ((profile?.credits ?? 0) < t.cost) {
      setShowPricing(true);
      return notify("Crédits insuffisants — choisis un plan", "error");
    }
    setGenerating(true); setOutput("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { 
  "Content-Type": "application/json",
"x-api-key": "sk-ant-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,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true"
},
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: PROMPTS[tool](input) }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "Erreur lors de la génération.";
      setOutput(text);

      // Déduire crédits en base Supabase
      const newCredits = (profile.credits ?? 0) - t.cost;
      await supabase.from("profiles").update({ credits: newCredits }).eq("id", user.id);
      setProfile(p => ({ ...p, credits: newCredits }));

      setHistory(h => [{
        tool: t.label, icon: t.icon,
        input: input.length > 50 ? input.slice(0, 50) + "…" : input,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        cost: t.cost,
      }, ...h.slice(0, 19)]);

      notify(`✓ Contenu généré · −${t.cost} crédits`);
    } catch (e) {
      notify("Erreur API — vérifie ta connexion", "error");
      setOutput("Une erreur s'est produite. Réessaie.");
    }
    setGenerating(false);
  };

  /* ── Upgrade plan ──────────────────────────────────────── */
  const handleUpgrade = async (plan) => {
    const newCredits = (profile?.credits ?? 0) + plan.credits;
    await supabase.from("profiles").update({ credits: newCredits, plan: plan.id }).eq("id", user.id);
    setProfile(p => ({ ...p, credits: newCredits, plan: plan.id }));
    setShowPricing(false);
    notify(`🎉 Plan ${plan.name} activé ! +${plan.credits} crédits`);
  };

  const handleStripe = (planId) => {
    window.open(STRIPE_LINKS[planId], "_blank");
    notify("🔗 Stripe ouvert — après paiement, recharge la page");
    setShowPricing(false);
  };

  /* ── Render ────────────────────────────────────────────── */
  if (booting) return (
    <div style={{ background: "#07070f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, animation: "pulse 1.2s infinite" }}>
        <span style={{ color: "#7c3aed" }}>copy</span><span style={{ color: "#e8e8f0" }}>flow</span>
      </div>
    </div>
  );

  if (!user) return <AuthScreen onAuth={(u) => { setUser(u); loadProfile(u.id); }} />;

  const currentPlan = PLANS.find(p => p.id === (profile?.plan || "free")) ?? PLANS[0];

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#07070f", minHeight: "100vh", color: "#e8e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#07070f}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .cursor{animation:blink .7s infinite}
        .card{transition:transform .2s,border-color .2s;cursor:pointer}
        .card:hover{transform:translateY(-4px);border-color:#7c3aed!important}
        .btn{transition:opacity .15s,transform .15s;cursor:pointer}
        .btn:hover:not(:disabled){opacity:.88;transform:translateY(-1px)}
        .nav-link{cursor:pointer;transition:color .2s;color:#444;font-size:13px}
        .nav-link:hover{color:#a78bfa}
        textarea:focus,input:focus{outline:none!important;border-color:#7c3aed!important;box-shadow:0 0 0 3px #7c3aed1a!important}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#2a2a3e;border-radius:4px}
        .shimmer{background:linear-gradient(90deg,#111120 25%,#1c1c30 50%,#111120 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
      `}</style>

      {toast && <Toast msg={toast.text} type={toast.type} />}

      {showPricing && (
        <PricingModal
          profile={profile}
          onClose={() => setShowPricing(false)}
          onUpgrade={handleUpgrade}
          onStripe={handleStripe}
        />
      )}

      {/* ── Navbar ──────────────────────────────────────── */}
      <nav style={{
        borderBottom: "1px solid #111120", padding: "14px 28px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0,
        background: "rgba(7,7,15,.96)", backdropFilter: "blur(14px)", zIndex: 100,
      }}>
        {/* Logo */}
        <div
          onClick={() => { setView("home"); setTool(null); setOutput(""); }}
          style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, cursor: "pointer", userSelect: "none" }}
        >
          <span style={{ color: "#7c3aed" }}>copy</span>
          <span style={{ color: "#e8e8f0" }}>flow</span>
          <sup style={{ color: "#7c3aed", fontSize: 10, fontFamily: "DM Sans", fontWeight: 700 }}>AI</sup>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="nav-link" onClick={() => { setView("history"); setTool(null); }}>Historique</span>

          {/* Crédits */}
          <div style={{
            background: "#0e0e18", border: "1px solid #1a1a2e",
            borderRadius: 20, padding: "6px 14px",
            fontSize: 13, display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ color: "#7c3aed" }}>⚡</span>
            <span style={{ fontWeight: 700 }}>{profile?.credits ?? "…"}</span>
            <span style={{ color: "#33334a", fontSize: 11 }}>crédits</span>
          </div>

          {/* Plan badge */}
          <div
            onClick={() => setShowPricing(true)}
            className="btn"
            style={{
              background: currentPlan.color + "18", border: `1px solid ${currentPlan.color}44`,
              borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600,
              color: currentPlan.color, cursor: "pointer",
            }}
          >
            {currentPlan.icon} {currentPlan.name}
          </div>

          {/* User + logout */}
          <span style={{ color: "#2a2a3e", fontSize: 12 }}>{user.email?.split("@")[0]}</span>
          <button onClick={logout} className="btn" style={{
            background: "transparent", border: "1px solid #1a1a2e",
            color: "#444", padding: "5px 12px", borderRadius: 8, fontSize: 12, fontFamily: "inherit",
          }}>
            Déco
          </button>
        </div>
      </nav>

      {/* ── Contenu ─────────────────────────────────────── */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "44px 20px 60px" }}>

        {/* HISTORIQUE */}
        {view === "history" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 26 }}>📋 Historique</h2>
              <button onClick={() => setView("home")} className="nav-link btn" style={{ background: "transparent", border: "none", fontFamily: "inherit", fontSize: 13 }}>
                ← Retour
              </button>
            </div>
            {history.length === 0
              ? <div style={{ color: "#252535", textAlign: "center", padding: "80px 0", fontSize: 15 }}>Aucune génération pour l'instant</div>
              : history.map((h, i) => (
                <div key={i} style={{
                  background: "#0a0a14", border: "1px solid #141425",
                  borderRadius: 12, padding: "14px 20px", marginBottom: 8,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  animation: `fadeUp .${Math.min(i + 2, 9)}s ease`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 18 }}>{h.icon}</span>
                    <div>
                      <span style={{ color: "#a78bfa", fontWeight: 600, fontSize: 13 }}>{h.tool}</span>
                      <div style={{ color: "#444", fontSize: 12, marginTop: 2 }}>{h.input}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ color: "#ef4444", fontSize: 12 }}>−{h.cost} crédits</span>
                    <span style={{ color: "#252535", fontSize: 11 }}>{h.time}</span>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* HOME — liste outils */}
        {view === "home" && !tool && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{
                display: "inline-block", background: "#7c3aed14",
                border: "1px solid #7c3aed2a", borderRadius: 20,
                padding: "5px 16px", fontSize: 11, color: "#7c3aed",
                marginBottom: 20, letterSpacing: 2, textTransform: "uppercase",
              }}>Powered by Claude AI</div>
              <h1 style={{
                fontFamily: "Syne, sans-serif",
                fontSize: "clamp(30px, 5vw, 54px)",
                fontWeight: 800, lineHeight: 1.1, marginBottom: 16,
              }}>
                Contenu marketing qui<br />
                <span style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  convertit vraiment
                </span>
              </h1>
              <p style={{ color: "#444", fontSize: 17, maxWidth: 420, margin: "0 auto" }}>
                6 outils IA pour ton e-commerce & marketing — résultats en moins de 10 secondes
              </p>
            </div>

            {/* Grid outils */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {TOOLS.map(t => (
                <div key={t.id} className="card"
                  onClick={() => { setTool(t.id); setInput(""); setOutput(""); setView("home"); }}
                  style={{ background: "#0a0a14", border: "1px solid #141425", borderRadius: 18, padding: 24 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <span style={{ fontSize: 30 }}>{t.icon}</span>
                    <span style={{
                      background: "#7c3aed14", color: "#a78bfa",
                      borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 600,
                    }}>{t.cost} crédits</span>
                  </div>
                  <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 17, marginBottom: 5 }}>{t.label}</div>
                  <div style={{ color: "#444", fontSize: 13 }}>{t.desc}</div>
                  <div style={{ marginTop: 18, color: "#7c3aed", fontSize: 12, fontWeight: 600 }}>Utiliser →</div>
                </div>
              ))}
            </div>

            {/* Barre upsell */}
            <div
              onClick={() => setShowPricing(true)}
              className="btn"
              style={{
                marginTop: 40, background: "linear-gradient(135deg,#7c3aed0a,#06b6d40a)",
                border: "1px solid #7c3aed22", borderRadius: 16,
                padding: "20px 28px", display: "flex",
                justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: 12,
              }}
            >
              <div>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16 }}>
                  {profile?.credits ?? 0} crédits restants
                </div>
                <div style={{ color: "#444", fontSize: 13, marginTop: 2 }}>
                  Passe à Pro · 500 crédits/mois · 29€
                </div>
              </div>
              <div style={{
                background: "#7c3aed", color: "#fff",
                padding: "9px 22px", borderRadius: 10, fontWeight: 600, fontSize: 13,
              }}>Voir les plans →</div>
            </div>
          </div>
        )}

        {/* ÉCRAN OUTIL */}
        {view === "home" && tool && (() => {
          const t = TOOLS.find(x => x.id === tool);
          return (
            <div style={{ animation: "fadeUp .3s ease" }}>
              <button
                onClick={() => { setTool(null); setOutput(""); }}
                className="btn"
                style={{ background: "none", border: "none", color: "#444", fontSize: 13, marginBottom: 24, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", cursor: "pointer" }}
              >
                ← Tous les outils
              </button>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                {/* Panel gauche — Input */}
                <div style={{ background: "#0a0a14", border: "1px solid #141425", borderRadius: 20, padding: 26 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 22 }}>
                    <span style={{ fontSize: 28 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 19 }}>{t.label}</div>
                      <div style={{ color: "#333", fontSize: 12, marginTop: 2 }}>{t.desc}</div>
                    </div>
                  </div>

                  <label style={{ display: "block", fontSize: 12, color: "#444", marginBottom: 8, fontWeight: 500 }}>
                    Décris ton produit / service / sujet
                  </label>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={t.placeholder}
                    rows={6}
                    style={{
                      width: "100%", background: "#07070f",
                      border: "1px solid #1a1a2e", borderRadius: 12,
                      padding: "14px", color: "#e8e8f0", fontSize: 13,
                      resize: "vertical", fontFamily: "inherit", lineHeight: 1.75,
                      transition: "border-color .2s, box-shadow .2s",
                    }}
                  />

                  <button
                    className="btn"
                    onClick={generate}
                    disabled={generating}
                    style={{
                      width: "100%", marginTop: 14,
                      background: generating ? "#1a1a2e" : "linear-gradient(135deg,#7c3aed,#5b21b6)",
                      border: "none", borderRadius: 12, padding: "14px",
                      color: "#fff", fontSize: 14, fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      fontFamily: "inherit",
                    }}
                  >
                    {generating
                      ? <><span style={{ animation: "pulse 1s infinite", letterSpacing: 4 }}>● ● ●</span></>
                      : <><span>⚡</span> Générer · {t.cost} crédits</>
                    }
                  </button>

                  <div style={{ marginTop: 10, color: "#252535", fontSize: 11, textAlign: "center" }}>
                    Solde : {profile?.credits ?? 0} crédits · Plan{" "}
                    <span style={{ color: currentPlan.color }}>{currentPlan.name}</span>
                  </div>
                </div>

                {/* Panel droit — Output */}
                <div style={{ background: "#0a0a14", border: "1px solid #141425", borderRadius: 20, padding: 26 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16 }}>Résultat IA</div>
                    {output && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(output); notify("✓ Copié dans le presse-papier !"); }}
                        style={{
                          background: "#141425", border: "1px solid #2a2a3e",
                          color: "#a78bfa", padding: "5px 14px",
                          borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                        }}
                      >📋 Copier</button>
                    )}
                  </div>

                  {!output && !generating && (
                    <div style={{ color: "#1c1c2c", textAlign: "center", paddingTop: 70, fontSize: 14 }}>
                      <div style={{ fontSize: 38, marginBottom: 14 }}>✨</div>
                      Le résultat apparaîtra ici
                    </div>
                  )}

                  {generating && (
                    <div style={{ paddingTop: 10 }}>
                      {[90, 70, 85, 55, 75, 60, 80].map((w, i) => (
                        <div key={i} className="shimmer" style={{ height: 13, borderRadius: 7, marginBottom: 13, width: `${w}%` }} />
                      ))}
                    </div>
                  )}

                  {output && (
                    <div style={{
                      color: "#c4c4d4", fontSize: 13.5, lineHeight: 1.9,
                      maxHeight: 460, overflowY: "auto", paddingRight: 4,
                    }}>
                      <Typewriter text={output} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #0e0e18", padding: "20px", textAlign: "center", color: "#1c1c28", fontSize: 11 }}>
        copyflow.ai · React + Supabase + Stripe + Claude AI · 2025
      </div>
    </div>
  );
}
