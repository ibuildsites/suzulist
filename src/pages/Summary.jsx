import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Summary() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      // Load session info
      const { data: sessionData } = await supabase
        .from("shopping_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      // Load purchased + not found items
      const { data: sessionItems } = await supabase
        .from("session_items")
        .select("*, items(name, quantity, preferred_store)")
        .eq("session_id", sessionId);

      setSession(sessionData);
      setItems(sessionItems);
      setLoading(false);
    }

    loadSummary();
  }, [sessionId]);

  if (loading) return <p>Loading summary...</p>;

  const purchased = items.filter(i => i.purchased);
  const notFound = items.filter(i => i.not_found);

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={() => navigate("/")}>← Home</button>

      <h1>Shopping Summary</h1>

      <h2>Purchased Items</h2>
      {purchased.length === 0 && (
        <div>
          <p>No Summary Available.. Yet</p>
          <p style={{ fontSize: "0.9em", color: "#666", marginTop: "-10px" }}>
            まだ要約は利用できません
          </p>
        </div>
      )}
      <ul>
        {purchased.map(i => (
          <li key={i.id}>
            <strong>{i.items.name}</strong> — {i.items.quantity}
            <br />
            <em>Bought at: {i.store}</em>
          </li>
        ))}
      </ul>

      <h2>Not Found</h2>
      {notFound.length === 0 && <p>Everything was found!</p>}
      <ul>
        {notFound.map(i => (
          <li key={i.id}>
            <strong>{i.items.name}</strong> — {i.items.quantity}
            {i.items.preferred_store && (
              <span> (Preferred: {i.items.preferred_store})</span>
            )}
          </li>
        ))}
      </ul>

      <h2>Session Details</h2>
      <p>Started: {new Date(session.started_at).toLocaleString()}</p>
      <p>Completed: {new Date(session.completed_at).toLocaleString()}</p>
      <p>Total purchased: {purchased.length}</p>
      <p>Total not found: {notFound.length}</p>
    </div>
  );
}