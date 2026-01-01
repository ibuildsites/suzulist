import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { subscribeToPush } from "../push";
import { sendNotification } from "../sendNotification";

const LIST_ID = "00000000-0000-0000-0000-000000000001";

export default function Lister() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [preferredStore, setPreferredStore] = useState("");

  // Load items
  useEffect(() => {
    async function loadItems() {
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("list_id", LIST_ID)
        .order("created_at", { ascending: true });

      if (data) setItems(data);
    }
    loadItems();
  }, []);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("items-changes-lister")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `list_id=eq.${LIST_ID}`
        },
        () => {
          supabase
            .from("items")
            .select("*")
            .eq("list_id", LIST_ID)
            .order("created_at", { ascending: true })
            .then(({ data }) => data && setItems(data));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function addItem() {
    if (!name.trim() || !quantity.trim()) return;

    const { data, error } = await supabase
      .from("items")
      .insert({
        list_id: LIST_ID,
        name,
        quantity,
        preferred_store: preferredStore || null
      })
      .select();

    if (!error && data && data[0]) {
      setItems([...items, data[0]]);

      await sendNotification(
        "shopper",
        "New Item Added",
        `${name} (${quantity}) was added to your list.`
      );

      setName("");
      setQuantity("");
      setPreferredStore("");
    }
  }

  async function deleteItem(id) {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (!error) setItems(items.filter(item => item.id !== id));
  }

  async function clearList() {
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("list_id", LIST_ID);

    if (!error) setItems([]);
  }

  return (
    <div className="page">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <img
          src="/suzulist152.png"
          alt="Suzulist"
          style={{ width: 48, height: 48 }}
        />
        <h1 style={{ margin: 0, color: "var(--brand-teal)" }}>SuzuList</h1>
      </div>

      <button onClick={() => navigate("/")} className="btn" style={{ marginBottom: "20px" }}>
        <span className="material-symbols-outlined">arrow_back</span>
        Back
      </button>

      {/* Notifications */}
      <button
        onClick={() => subscribeToPush("lister")}
        className="btn btn-orange"
        style={{ marginBottom: "20px" }}
      >
        <span className="material-symbols-outlined">notifications</span>
        Enable Notifications
      </button>

      {/* Add Item Card */}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Add Item</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            type="text"
            placeholder="Item name"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Quantity"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
          />

          <select
            value={preferredStore}
            onChange={e => setPreferredStore(e.target.value)}
          >
            <option value="">Preferred store (optional)</option>
            <option value="aldi">Aldi</option>
            <option value="walmart">Walmart</option>
            <option value="shoprite">Shoprite</option>
          </select>

          <button className="btn btn-orange" onClick={addItem}>
            <span className="material-symbols-outlined">add</span>
            Add Item
          </button>
        </div>
      </div>

      {/* Current List */}
      <h2 style={{ marginTop: "30px" }}>Current List</h2>

      {items.length === 0 && <p style={{ color: "var(--text-muted)" }}>No items yet.</p>}

      {items.map(item => (
        <div key={item.id} className="item card-pop">
          <div className="item-left">
            <span style={{ fontSize: "18px" }}>
              <strong>{item.name}</strong> — {item.quantity}
            </span>

            {item.preferred_store && (
              <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>
                ({item.preferred_store})
              </span>
            )}
          </div>

          <button
            onClick={() => deleteItem(item.id)}
            className="btn"
            style={{
              width: "auto",
              padding: "8px 12px",
              background: "#e74c3c"
            }}
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      ))}

      {/* Footer Buttons */}
      <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
        <button className="btn" style={{ background: "#999" }} onClick={clearList}>
          <span className="material-symbols-outlined">delete_sweep</span>
          Clear List
        </button>

        <button className="btn btn-orange">
          <span className="material-symbols-outlined">sync</span>
          Update List
        </button>
      </div>
    </div>
  );
}
