import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { subscribeToPush } from "../push";
import { sendNotification } from "../sendNotification";

const LIST_ID = "00000000-0000-0000-0000-000000000001";
const STORES = ["aldi", "walmart", "shoprite"];

export default function Shopper() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState("chooseOrder");
  const [session, setSession] = useState(null);
  const [order, setOrder] = useState(STORES);
  const [currentStoreIndex, setCurrentStoreIndex] = useState(0);

  const [items, setItems] = useState([]);
  const [purchased, setPurchased] = useState({});

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
      .channel("items-changes-shopper")
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

  // Load active session
  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase
        .from("shopping_sessions")
        .select("*")
        .is("completed_at", null)
        .eq("list_id", LIST_ID)
        .maybeSingle();

      if (data) {
        setSession(data);

        const sessionOrder = data.store_order || STORES;
        setOrder(sessionOrder);
        setPhase("shopping");
        setCurrentStoreIndex(sessionOrder.indexOf(data.current_store));

        // Load purchased items
        const { data: purchasedRows } = await supabase
          .from("session_items")
          .select("*")
          .eq("session_id", data.id);

        const purchasedMap = {};
        (purchasedRows || []).forEach(row => {
          if (row.purchased) purchasedMap[row.item_id] = true;
        });

        setPurchased(purchasedMap);
      }
    }

    loadSession();
  }, []);

  async function startStandardOrder() {
    const defaultOrder = ["aldi", "walmart", "shoprite"];

    const { data, error } = await supabase
      .from("shopping_sessions")
      .insert({
        list_id: LIST_ID,
        current_store: "aldi",
        store_order: defaultOrder
      })
      .select()
      .single();

    if (!error && data) {
      await sendNotification(
        "lister",
        "Shopping Started",
        "The shopper has begun at Aldi."
      );

      setSession(data);
      setOrder(defaultOrder);
      setPhase("shopping");
      setCurrentStoreIndex(0);
    }
  }

  async function toggleItem(itemId) {
    if (!session) return;

    const alreadyPurchased = purchased[itemId];

    setPurchased(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));

    await supabase.from("session_items").upsert({
      session_id: session.id,
      item_id: itemId,
      purchased: !alreadyPurchased,
      store: order[currentStoreIndex]
    });
  }

  async function finishStore() {
    if (!session) return;

    const nextIndex = currentStoreIndex + 1;

    if (nextIndex < order.length) {
      const nextStore = order[nextIndex];

      await supabase
        .from("shopping_sessions")
        .update({ current_store: nextStore })
        .eq("id", session.id);

      setCurrentStoreIndex(nextIndex);
    } else {
      await supabase
        .from("shopping_sessions")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", session.id);

      await sendNotification(
        "lister",
        "Shopping Complete",
        "Tap to view the shopping summary."
      );

      navigate(`/summary/${session.id}`);
    }
  }

  function getItemsForStore(store) {
    const currentIndex = order.indexOf(store);

    return items.filter(item => {
      const preferred = item.preferred_store;

      if (preferred) {
        const preferredIndex = order.indexOf(preferred);
        if (currentIndex < preferredIndex) return false;
      }

      if (purchased[item.id]) return false;

      return true;
    });
  }

  // UI: choose order
  if (phase === "chooseOrder") {
    return (
      <div className="page">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <img src="/suzulist152.png" alt="Suzulist" style={{ width: 48, height: 48 }} />
          <h1 style={{ margin: 0, color: "var(--brand-teal)" }}>SuzuList</h1>
        </div>

        <button onClick={() => navigate("/")} className="btn" style={{ marginBottom: "20px" }}>
          <span className="material-symbols-outlined">arrow_back</span>
          Back
        </button>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Choose Shopping Order</h2>

          <button onClick={startStandardOrder} className="btn btn-orange" style={{ marginTop: "12px" }}>
            <span className="material-symbols-outlined">shopping_cart</span>
            Standard Order (Aldi → Walmart → Shoprite)
          </button>

          <button
            onClick={() => subscribeToPush("shopper")}
            className="btn"
            style={{ marginTop: "20px" }}
          >
            <span className="material-symbols-outlined">notifications</span>
            Enable Notifications
          </button>

          <p style={{ marginTop: "20px", color: "var(--text-muted)" }}>
            Custom order coming soon.
          </p>
        </div>
      </div>
    );
  }

  // UI: shopping
  if (phase === "shopping") {
    const currentStore = order[currentStoreIndex];
    const storeItems = getItemsForStore(currentStore);

    return (
      <div className="page">

        {/* Store Header */}
        <div className="store-header">
          <img src={`/${currentStore}-logo.png`} alt={currentStore} />
          <h1 style={{ margin: 0 }}>{currentStore.toUpperCase()}</h1>
        </div>

        {/* Store Progress Buttons */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          {order.map((store, index) => (
            <button
              key={store}
              disabled={index > currentStoreIndex}
              className="btn"
              style={{
                background: index === currentStoreIndex ? "var(--brand-orange)" : "#ddd",
                color: index === currentStoreIndex ? "white" : "#333",
                flex: 1
              }}
            >
              {store.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Items */}
        {storeItems.length === 0 && (
          <p style={{ color: "var(--text-muted)" }}>No items for this store.</p>
        )}

        {storeItems.map(item => (
          <div key={item.id} className="item card-pop">
            <div className="item-left">
              <input
                type="checkbox"
                checked={!!purchased[item.id]}
                onChange={() => toggleItem(item.id)}
              />
              <span style={{ fontSize: "18px" }}>
                <strong>{item.name}</strong> — {item.quantity}
              </span>
            </div>
          </div>
        ))}

        <button onClick={finishStore} className="btn btn-orange" style={{ marginTop: "20px" }}>
          <span className="material-symbols-outlined">check_circle</span>
          Finished at {currentStore.toUpperCase()}
        </button>
      </div>
    );
  }

  return null;
}
