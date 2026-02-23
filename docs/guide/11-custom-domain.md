# Chapter 11: Custom Domain Setup

Your app is live at `your-app.vercel.app`. Now let's give it a **real domain name** like `yourapp.com`.

---

## What is a Domain?

```
  WITHOUT CUSTOM DOMAIN:          WITH CUSTOM DOMAIN:
  ──────────────────────          ────────────────────

  my-app-v2-git-main             myapp.com
  -username.vercel.app
                                  Professional!
  Hard to remember                Easy to remember
  Looks generic                   Builds trust
  Not YOUR brand                  YOUR brand
```

---

## How Domains Work (DNS)

When someone types a URL, their computer asks a **DNS server** (like a phone book) where to find that website:

```
  User types: myapp.com
       │
       ▼
  ┌──────────────────┐
  │   DNS SERVER     │     "Where is myapp.com?"
  │   (phone book)   │
  │                  │
  │  myapp.com       │──►  76.76.21.21  (Vercel's IP)
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │   VERCEL         │     "This domain maps to
  │                  │      your-app project"
  │  Serves your     │
  │  Next.js app     │
  └──────────────────┘
       │
       ▼
  User sees your app!
```

**DNS records** are entries in the phone book. You'll add records that say: "myapp.com points to Vercel."

---

## Step 1: Buy a Domain

You need to buy a domain name from a **registrar**. Popular options:

| Registrar | URL | Notes |
|-----------|-----|-------|
| **Namecheap** | namecheap.com | Good prices, popular |
| **Cloudflare** | cloudflare.com | At-cost pricing, free DNS |
| **Google Domains** | domains.google | Clean interface |
| **Vercel** | vercel.com/domains | Integrated with Vercel |

Prices are typically $10-15/year for a `.com` domain.

If you buy from **Vercel**, it auto-configures everything and you can skip Steps 3-4.

---

## Step 2: Add Domain to Vercel

1. Go to **Vercel Dashboard > Your Project > Settings > Domains**
2. Type your domain name (e.g., `myapp.com`) and click **Add**
3. Vercel will show you the DNS records to configure

---

## Step 3: Configure DNS Records

Go to your domain registrar's DNS settings and add these records:

```
  TYPE      NAME     VALUE                   TTL
  ────      ────     ─────                   ───
  A         @        76.76.21.21             Auto
  CNAME     www      cname.vercel-dns.com    Auto
```

**What each record means:**

```
  A RECORD:
  ─────────
  "myapp.com points to this IP address"

  @ means "the root domain" (myapp.com without www)
  76.76.21.21 is Vercel's IP address

  When someone visits myapp.com → goes to Vercel


  CNAME RECORD:
  ─────────────
  "www.myapp.com is an alias for this hostname"

  www means the www subdomain
  cname.vercel-dns.com is Vercel's DNS hostname

  When someone visits www.myapp.com → goes to Vercel
```

Some registrars use different interfaces. Look for "DNS Records", "DNS Management", or "Advanced DNS" in your registrar's dashboard.

---

## Step 4: Wait for DNS Propagation

After adding DNS records, they need to spread across the internet. This takes:

```
  ┌──────────────────────────────┐
  │  Usually: 5 to 30 minutes   │
  │  Worst case: up to 48 hours │
  └──────────────────────────────┘
```

**How to check if it's working:**

1. Visit [whatsmydns.net](https://whatsmydns.net)
2. Enter your domain
3. Select "A" record
4. Click "Search"
5. Green checkmarks = propagated. Red X = still waiting.

While waiting, Vercel will show your domain as "Pending Verification."

---

## Step 5: SSL Certificate (Automatic)

Once DNS is configured, Vercel automatically:
1. Detects the domain is pointing to Vercel
2. Provisions an **SSL certificate** (via Let's Encrypt)
3. Enables HTTPS (the lock icon in the browser)

You don't need to do anything. Your site will be accessible via `https://myapp.com` with a valid certificate.

---

## Step 6: Redirect Setup

Vercel lets you choose how `www` and non-`www` work:

```
  OPTION A: Redirect www → non-www (recommended)
  ────────
  www.myapp.com  →  redirects to  →  myapp.com

  OPTION B: Redirect non-www → www
  ────────
  myapp.com  →  redirects to  →  www.myapp.com
```

Configure this in Vercel Dashboard > Settings > Domains. Pick one and Vercel handles the redirect automatically.

---

## Update Clerk (if using custom domain)

If you switch from `your-app.vercel.app` to `myapp.com`, update Clerk:

1. Go to Clerk Dashboard > Settings > Domains
2. Add your custom domain
3. This ensures Clerk's sign-in redirects work correctly with your new domain

---

> **In our Shagai project...**
>
> The app uses a custom domain for the production deployment. DNS records point to Vercel, and SSL is handled automatically. The public share pages (`/s/[id]` and `/team/s/[id]`) benefit from a clean, memorable domain when shared.

---

## Checkpoint

1. Visit `yourdomain.com` in your browser
2. See your app running with HTTPS (lock icon)
3. Try `www.yourdomain.com` -- should redirect or also work
4. Sign in via Clerk -- should work on the new domain

> **Common mistake:** Wrong DNS record values. Copy them exactly from Vercel's instructions. A typo means your domain won't resolve.

> **Common mistake:** Impatience. DNS propagation takes time. If your domain doesn't work after 5 minutes, wait. Don't change records repeatedly -- that resets the propagation timer.

> **Common mistake:** Forgetting to update Clerk. If sign-in redirects to the old Vercel URL instead of your custom domain, update the domain in Clerk's dashboard.

> **Common mistake:** Using Cloudflare's orange cloud proxy when Vercel needs direct DNS. If using Cloudflare, set the proxy status to "DNS only" (gray cloud) for the records pointing to Vercel.

---

**Next:** [Chapter 12: Environment Variables](12-environment-variables.md)
