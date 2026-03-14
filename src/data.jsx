import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import "./App.css";

export default function Data() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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
        .order("created_at", { ascending: false });

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

  const normalizePhone = (value) => {
    return String(value || "").replace(/\D/g, "");
  };

  const handleSearch = () => {
    setSearchTerm(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;

    const normalizedSearch = normalizePhone(searchTerm);

    return rows.filter((row) =>
      normalizePhone(row.phone_number).includes(normalizedSearch),
    );
  }, [rows, searchTerm]);

  const groupedRows = useMemo(() => {
    const groups = {};

    filteredRows.forEach((row) => {
      const date = new Date(row.created_at);

      const dayKey = date.toLocaleDateString("en-CA"); // YYYY-MM-DD
      const dayLabel = date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groups[dayKey]) {
        groups[dayKey] = {
          label: dayLabel,
          items: [],
        };
      }

      groups[dayKey].items.push(row);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredRows]);

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

      <div className="searchBarWrap">
        <input
          type="text"
          className="searchInput"
          placeholder="Search by phone number..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />

        <button className="searchBtn" onClick={handleSearch}>
          Search
        </button>

        <button className="clearBtn" onClick={handleClearSearch}>
          Clear
        </button>
      </div>

      {!loading && !error && (
        <div className="resultsInfo">
          Showing <strong>{filteredRows.length}</strong> result
          {filteredRows.length !== 1 ? "s" : ""}
          {searchTerm ? (
            <>
              {" "}
              for <strong>{searchTerm}</strong>
            </>
          ) : null}
        </div>
      )}

      {loading ? (
        <div className="dataMessage">Loading data...</div>
      ) : error ? (
        <div className="dataError">{error}</div>
      ) : groupedRows.length === 0 ? (
        <div className="tableWrap">
          <div
            className="emptyRow"
            style={{ padding: "24px", textAlign: "center" }}
          >
            No data found.
          </div>
        </div>
      ) : (
        <div className="groupedTables">
          {groupedRows.map(([dayKey, group]) => (
            <div className="daySection" key={dayKey}>
              <div className="daySectionHeader">
                <h2 className="dayTitle">{group.label}</h2>
                <span className="dayCount">
                  {group.items.length} lead{group.items.length !== 1 ? "s" : ""}
                </span>
              </div>

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
                    {group.items.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.phone_number}</td>
                        <td>{row.discount || "—"}</td>
                        <td>{new Date(row.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
