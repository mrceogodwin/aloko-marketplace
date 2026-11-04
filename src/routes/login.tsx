import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const [mode, setMode] = useState<"in" | "up">("up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <main className="login-page">
      <form
        className="login-card"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          const run =
            mode === "up"
              ? authClient.signUp.email({ email, password, name: name.trim() || "Aloko member", callbackURL: "/" })
              : authClient.signIn.email({ email, password, callbackURL: "/" });
          void run
            .then((result) => {
              if (result.error) throw new Error(result.error.message || "Could not sign in.");
              window.location.assign("/");
            })
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "Could not sign in.");
              setBusy(false);
            });
        }}
      >
        <p className="eyebrow">ALOKO</p>
        <h1>{mode === "up" ? "Create your account" : "Sign in"}</h1>
        <p>Buyers, sellers, businesses and decluttering services use one account.</p>
        {authEnabled ? (
          <>
            {mode === "up" && (
              <label>
                Name
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
              </label>
            )}
            <label>
              Email
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </label>
            <label>
              Password
              <input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "up" ? "new-password" : "current-password"} />
            </label>
            {error && <p className="err">{error}</p>}
            <button className="primary" type="submit" disabled={busy}>
              {busy ? "Please wait…" : mode === "up" ? "Create account" : "Sign in"}
            </button>
            <button className="ghost" type="button" onClick={() => setMode(mode === "up" ? "in" : "up")}>
              {mode === "up" ? "I already have an account" : "New to Aloko? Create an account"}
            </button>
            {GROK_PROVIDERS.map((provider) => (
              <button key={provider.providerId} className="ghost" type="button" onClick={() => signIn(provider.providerId, { callbackURL: "/" })}>
                Continue with {provider.label}
              </button>
            ))}
          </>
        ) : (
          <p>Sign-in is off.</p>
        )}
        <Link to="/">Back to Aloko</Link>
      </form>
    </main>
  );
}
