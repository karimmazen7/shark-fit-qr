import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import "./App.css";

export default function Data() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        navigate("/login");
        return;
      }

      await fetchRows();
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("shark_fit_leads")
        .select("id, phone_number, discount, created_at")
        .order("id", { ascending: false });

      if (error) throw error;

      setRows(data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="dataPage">
      <div className="dataHeader">
        <div>
          <h1 className="dataTitle">Shark Fit Leads</h1>
          <p className="dataSubtitle">
            Phone numbers and discount results from the campaign.
          </p>
        </div>

        <div className="dataHeaderActions">
          <button className="refreshBtn" onClick={fetchRows}>
            Refresh
          </button>
          <button className="logoutBtn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <div className="dataMessage">Loading data...</div>
      ) : error ? (
        <div className="dataError">{error}</div>
      ) : (
        <div className="tableWrap">
          <table className="dataTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Phone Number</th>
                <th>Discount</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="4" className="emptyRow">
                    No data found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.phone_number}</td>
                    <td>{row.discount || "—"}</td>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
