# 🚀 GUIDE DE DÉPLOIEMENT — CopyFlow AI
## De zéro à en ligne en 30 minutes

---

## ÉTAPE 1 — Supabase (base de données + auth)
**⏱ 5 minutes · Gratuit**

1. Va sur **supabase.com** → "Start your project" → connecte-toi avec GitHub
2. Clique **"New Project"** → nom : `copyflow` → choisis un mot de passe → région : **Europe West**
3. Attends 2 minutes que le projet se crée

### Copier tes clés Supabase
4. Dans ton projet → **Settings** (icône engrenage) → **API**
5. Copie :
   - `Project URL` → ex: `https://abcdefgh.supabase.co`
   - `anon public` → ex: `eyJhbGc...`

### Créer la table utilisateurs
6. Va dans **SQL Editor** → clique **"New query"** → colle ce code → clique **Run** :

```sql
-- Table profils utilisateurs
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  credits INT DEFAULT 10,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active la sécurité par ligne
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique : chaque user ne voit que son profil
CREATE POLICY "users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Crée automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

✅ Tu devrais voir "Success" → la table est prête !

---

## ÉTAPE 2 — Stripe (paiements)
**⏱ 10 minutes · Gratuit pour démarrer**

1. Va sur **stripe.com** → crée un compte
2. Dans le dashboard → **Products** → **+ Add product**

### Créer les 3 produits
Répète 3 fois avec ces infos :

| Nom | Prix | Type |
|-----|------|------|
| Starter | 9,00 € | Récurrent (mensuel) |
| Pro | 29,00 € | Récurrent (mensuel) |
| Agency | 79,00 € | Récurrent (mensuel) |

### Créer les Payment Links
3. Pour chaque produit → **"Create payment link"**
4. Copie l'URL générée (format `https://buy.stripe.com/XXXX`)

---

## ÉTAPE 3 — Configurer l'app
**⏱ 2 minutes**

Ouvre le fichier `src/App.jsx` et remplace les 5 lignes en haut :

```javascript
const SUPABASE_URL      = "https://TON_ID.supabase.co";  // ← ta vraie URL
const SUPABASE_ANON_KEY = "eyJTON_VRAI_KEY...";          // ← ta vraie clé

const STRIPE_LINKS = {
  starter: "https://buy.stripe.com/TON_LIEN_STARTER",    // ← ton lien
  pro:     "https://buy.stripe.com/TON_LIEN_PRO",        // ← ton lien
  agency:  "https://buy.stripe.com/TON_LIEN_AGENCY",     // ← ton lien
};
```

---

## ÉTAPE 4 — Déployer sur Vercel
**⏱ 5 minutes · Gratuit**

### Option A — Depuis GitHub (recommandé)

1. Crée un repo GitHub : **github.com** → "New repository" → `copyflow-ai`
2. Upload tous les fichiers du dossier `copyflow/`
3. Va sur **vercel.com** → "Add New Project"
4. Connecte GitHub → sélectionne `copyflow-ai`
5. Clique **Deploy** → attends 1 minute
6. ✅ Ton site est en ligne sur `copyflow-ai.vercel.app`

### Option B — Depuis ton terminal

```bash
# 1. Installe Node.js si pas fait → nodejs.org

# 2. Dans le dossier copyflow :
npm install
npm run build

# 3. Installe Vercel CLI
npm install -g vercel

# 4. Déploie
vercel
# → Réponds aux questions (defaults OK)
# → URL donnée automatiquement
```

---

## ÉTAPE 5 — Nom de domaine (optionnel)
**⏱ 5 minutes · ~12€/an**

1. Achète un domaine sur **namecheap.com** ou **ovh.com**
2. Dans Vercel → ton projet → **Settings → Domains**
3. Ajoute ton domaine → suis les instructions DNS
4. Vercel configure le HTTPS automatiquement ✅

---

## AUTOMATISER L'AJOUT DE CRÉDITS APRÈS PAIEMENT

Actuellement, le bouton "Tester sans payer" simule un upgrade.
Pour la vraie intégration Stripe → Supabase :

1. Dans Stripe → **Developers → Webhooks** → "Add endpoint"
2. URL : `https://ton-projet.supabase.co/functions/v1/stripe-webhook`
3. Events à écouter : `checkout.session.completed`

Crée une Edge Function Supabase (`supabase/functions/stripe-webhook/index.ts`) :

```typescript
import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const CREDITS = { starter: 100, pro: 500, agency: 2000 };

serve(async (req) => {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;
  const event = stripe.webhooks.constructEvent(body, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET")!);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email   = session.customer_details?.email;
    const planId  = session.metadata?.planId ?? "starter";
    const credits = CREDITS[planId] ?? 100;

    // Récupère l'user par email et ajoute ses crédits
    const { data: profiles } = await supabase
      .from("profiles").select("id, credits").eq("email", email).single();
    
    if (profiles) {
      await supabase.from("profiles")
        .update({ credits: profiles.credits + credits, plan: planId })
        .eq("id", profiles.id);
    }
  }

  return new Response("ok", { status: 200 });
});
```

---

## RÉSUMÉ DES COÛTS

| Service | Coût |
|---------|------|
| Supabase | **Gratuit** (500MB, 50k users) |
| Vercel | **Gratuit** (100GB bandwidth) |
| Stripe | **0€** + 1,4% + 0,25€ par transaction |
| Claude API | ~0,003€ par génération |
| Domaine | ~12€/an (optionnel) |

**→ Total démarrage : 0€**

---

## MODÈLE ÉCONOMIQUE

```
Coût API par génération : ~0,003€
Prix vendu en crédits   : ~0,05€ à 0,10€ par crédit

Plan Pro (29€) → 500 crédits → coût API ~1,50€ → marge 95%
```

---

## CHECKLIST FINALE

- [ ] Supabase créé + SQL lancé
- [ ] Clés Supabase copiées dans App.jsx
- [ ] 3 produits Stripe créés
- [ ] 3 Payment Links copiés dans App.jsx
- [ ] App déployée sur Vercel
- [ ] Test inscription → 10 crédits reçus
- [ ] Test génération → crédits déduits
- [ ] Test paiement Stripe (carte test 4242 4242 4242 4242)

**🎉 Ton SaaS est en ligne et prêt à générer des revenus !**
