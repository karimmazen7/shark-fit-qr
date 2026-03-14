import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import "./App.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (!error && data.session) {
      navigate("/data");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      navigate("/data");
    } catch (err) {
      console.error(err);
      setError("Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adminPage">
      <div className="adminCard">
        <h1 className="adminTitle">Admin Login</h1>
        <p className="adminSubtitle">
          Sign in with your Supabase admin account.
        </p>

        <form onSubmit={handleLogin} className="adminForm">
          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="adminInput"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="adminInput"
          />

          <button type="submit" className="adminButton" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <button
            type="button"
            className="adminBackButton"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>

          {error && <div className="adminError">{error}</div>}
        </form>
      </div>
    </div>
  );
}
