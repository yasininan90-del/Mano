import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Store,
  ChevronLeft,
  Calendar,
  X,
  Lock,
  Unlock,
  Pizza,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Percent,
  Users,
  UserPlus,
  LogOut,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

// --- FIREBASE BAĞLANTISI ---
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLXwi0r4QrMlpA7PxYEFwy5ADr_Q9nPqk",
  authDomain: "mano-pizza.firebaseapp.com",
  projectId: "mano-pizza",
  storageBucket: "mano-pizza.firebasestorage.app",
  messagingSenderId: "558530166779",
  appId: "1:558530166779:web:fe990140b59ad5dd1e155e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DOC_REF = doc(db, "mano_pizza", "veri");
const DEFAULT_STORES = ["Metro Market", "File Market"];
const ADMIN_USERNAME = "mathrew";
const ADMIN_PASSWORD = "01102022";
const SALE_PRODUCTS = ["Margarita Pizza", ...Array.from({ length: 20 }, (_, i) => `Pizza No:${i + 1}`)];

function formatTL(n) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n || 0);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function thisMonthISO() {
  return new Date().toISOString().slice(0, 7);
}
function formatDateLabel(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
}
function formatMonthLabel(iso) {
  const d = new Date(iso + "-01T00:00:00");
  return d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

const EMPTY_DATA = {
  stores: DEFAULT_STORES,
  purchaseEntries: {},
  purchaseLocks: {},
  salesEntries: {},
  salesLocks: {},
  costs: {},
  lastActiveStore: null,
  users: { [ADMIN_USERNAME]: { password: ADMIN_PASSWORD, role: "admin" } },
};

export default function ManoPizza() {
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null); 
  const [date, setDate] = useState(todayISO());
  const [tab, setTab] = useState("alis");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      DOC_REF,
      (docSnap) => {
        if (docSnap.exists()) {
          const parsed = docSnap.data();
          const merged = parsed && parsed.stores ? { ...EMPTY_DATA, ...parsed } : EMPTY_DATA;
          merged.users = { ...EMPTY_DATA.users, ...(parsed?.users || {}) };
          setData(merged);
        } else {
          setDoc(DOC_REF, EMPTY_DATA);
          setData(EMPTY_DATA);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firebase veri okuma hatası:", err);
        setError("Veriler yüklenirken bir hata oluştu.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function persist(next) {
    setData(next);
    try {
      await setDoc(DOC_REF, next);
      setError("");
    } catch (err) {
      console.error("Firebase kayıt hatası:", err);
      setError("Kaydedilemedi, bağlantını kontrol et.");
    }
  }

  if (loading) {
    return (
      <div style={{ background: "#1C1B19", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#9C9890", fontSize: 14 }}>Yükleniyor…</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen users={data.users} onSuccess={setCurrentUser} />;
  }

  const isAdmin = currentUser.role === "admin";
  const tabs = isAdmin
    ? [
        { id: "alis", label: "Alış", icon: <ShoppingBag size={14} /> },
        { id: "satis", label: "Satış", icon: <TrendingUp size={14} /> },
        { id: "maliyet", label: "Maliyetler", icon: <Percent size={14} /> },
        { id: "karzarar", label: "Kâr / Zarar", icon: <TrendingDown size={14} /> },
        { id: "yonetici", label: "Yönetici", icon: <ShieldCheck size={14} /> },
      ]
    : [
        { id: "alis", label: "Alış", icon: <ShoppingBag size={14} /> },
        { id: "satis", label: "Satış", icon: <TrendingUp size={14} /> },
      ];

  return (
    <div style={{ background: "#F7F6F2", minHeight: "100vh", color: "#1C1B19" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px 18px 60px" }}>
        <AppHeader currentUser={currentUser} onLogout={() => setCurrentUser(null)} />

        {(tab === "alis" || tab === "satis") && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#FFFFFF",
              border: "1px solid #E4E1D8",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 14,
            }}
          >
            <Calendar size={16} color="#6B6862" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ border: "none", background: "transparent", fontSize: 14, color: "#1C1B19", flex: 1 }}
            />
            <span style={{ fontSize: 12, color: "#A8A49A" }}>{formatDateLabel(date)}</span>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {tabs.map((t) => (
            <TabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)} icon={t.icon}>
              {t.label}
            </TabButton>
          ))}
        </div>

        {tab === "alis" && <AlisTab data={data} date={date} persist={persist} error={error} isAdmin={isAdmin} />}
        {tab === "satis" && <SatisTab data={data} date={date} persist={persist} error={error} isAdmin={isAdmin} />}
        {tab === "maliyet" && isAdmin && <MaliyetlerTab data={data} persist={persist} error={error} />}
        {tab === "karzarar" && isAdmin && <KarZararTab data={data} />}
        {tab === "yonetici" && isAdmin && <YoneticiTab data={data} persist={persist} error={error} />}
      </div>
    </div>
  );
}

function AppHeader({ currentUser, onLogout }) {
  return (
    <header style={{ marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "#B4432E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Pizza size={18} color="#F7F6F2" />
        </div>
        <div>
          <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>Mano Pizza</h1>
          <p style={{ fontSize: 12, color: "#6B6862", margin: 0 }}>
            {currentUser.username} · {currentUser.role === "admin" ? "Yönetici" : "Kullanıcı"}
          </p>
        </div>
      </div>
      <button
        onClick={onLogout}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          border: "1px solid #E4E1D8",
          background: "#FFFFFF",
          color: "#6B6862",
          borderRadius: 8,
          padding: "7px 10px",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        <LogOut size={13} /> Çıkış
      </button>
    </header>
  );
}

function TabButton({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: "1 1 30%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        padding: "9px 4px",
        borderRadius: 9,
        border: "1px solid " + (active ? "#1C1B19" : "#E4E1D8"),
        background: active ? "#1C1B19" : "#FFFFFF",
        color: active ? "#F7F6F2" : "#6B6862",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

/* ---------------- GİRİŞ ---------------- */

function LoginScreen({ users, onSuccess }) {
  const [stage, setStage] = useState("splash");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [shake, setShake] = useState(false);
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    const u = users[username.trim()];
    if (u && u.password === password) {
      onSuccess({ username: username.trim(), role: u.role });
    } else {
      setErr("Kullanıcı adı veya şifre hatalı.");
      setShake(true);
      setPassword("");
      setTimeout(() => setShake(false), 400);
    }
  }

  return (
    <div style={{ background: "#1C1B19", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 320, textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "#B4432E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}
        >
          <Pizza size={30} color="#F7F6F2" />
        </div>
        <h1 style={{ color: "#F7F6F2", fontSize: 26, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Mano Pizza</h1>
        <p style={{ color: "#9C9890", fontSize: 14, margin: "0 0 32px" }}>Gelir Gider</p>

        {stage === "splash" && (
          <button
            onClick={() => setStage("login")}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 10,
              border: "none",
              background: "#F7F6F2",
              color: "#1C1B19",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Giriş Yap
          </button>
        )}

        {stage === "login" && (
          <form onSubmit={submit} style={{ animation: shake ? "manoShake 0.4s" : "none", textAlign: "left" }}>
            <style>{`
              @keyframes manoShake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-6px); }
                75% { transform: translateX(6px); }
              }
            `}</style>
            <span style={{ fontSize: 11, color: "#9C9890", display: "block", marginBottom: 4 }}>Kullanıcı Adı</span>
            <input
              autoFocus
              type="text"
              autoCapitalize="none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={loginInputStyle}
            />
            <span style={{ fontSize: 11, color: "#9C9890", display: "block", margin: "12px 0 4px" }}>Şifre</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={loginInputStyle} />
            {err && (
              <p style={{ color: "#E08A75", fontSize: 12, marginTop: 8 }}>{err}</p>
            )}
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "13px 0",
                borderRadius: 10,
                border: "none",
                background: "#F7F6F2",
                color: "#1C1B19",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                marginTop: 18,
              }}
            >
              Giriş Yap
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const loginInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #3A3934",
  background: "#2A2926",
  color: "#F7F6F2",
  fontSize: 15,
  boxSizing: "border-box",
  outline: "none",
};

/* ---------------- ALIŞ ---------------- */

function AlisTab({ data, date, persist, error, isAdmin }) {
  const [activeStore, setActiveStore] = useState(data.lastActiveStore || null);
  const [newStoreName, setNewStoreName] = useState("");
  const [showAddStore, setShowAddStore] = useState(false);
  const [itemForm, setItemForm] = useState({ product: "", qty: "1", unitPrice: "" });

  const dayEntries = data.purchaseEntries[date] || {};
  const dayLocks = data.purchaseLocks[date] || {};
  const storeTotal = (storeName) => (dayEntries[storeName] || []).reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const dayTotal = useMemo(() => data.stores.reduce((s, st) => s + storeTotal(st), 0), [data, date]);

  function openStore(store) {
    setActiveStore(store);
    persist({ ...data, lastActiveStore: store });
  }

  function addStore() {
    const name = newStoreName.trim();
    if (!name || data.stores.includes(name)) return;
    persist({ ...data, stores: [...data.stores, name] });
    setNewStoreName("");
    setShowAddStore(false);
  }

  function removeStore(name) {
    const { [name]: _r, ...restToday } = dayEntries;
    const { [name]: _l, ...restLocks } = dayLocks;
    persist({
      ...data,
      stores: data.stores.filter((s) => s !== name),
      purchaseEntries: { ...data.purchaseEntries, [date]: restToday },
      purchaseLocks: { ...data.purchaseLocks, [date]: restLocks },
      lastActiveStore: data.lastActiveStore === name ? null : data.lastActiveStore,
    });
    if (activeStore === name) setActiveStore(null);
  }

  function addItem(e) {
    e.preventDefault();
    const qty = parseFloat(itemForm.qty);
    const unitPrice = parseFloat(itemForm.unitPrice);
    const product = itemForm.product.trim();
    if (!product || !qty || qty <= 0 || !unitPrice || unitPrice < 0) return;
    const item = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, product, qty, unitPrice };
    const storeItems = dayEntries[activeStore] || [];
    const nextDay = { ...dayEntries, [activeStore]: [...storeItems, item] };
    persist({ ...data, purchaseEntries: { ...data.purchaseEntries, [date]: nextDay } });
    setItemForm({ product: "", qty: "1", unitPrice: "" });
  }

  function removeItem(id) {
    const storeItems = (dayEntries[activeStore] || []).filter((it) => it.id !== id);
    const nextDay = { ...dayEntries, [activeStore]: storeItems };
    persist({ ...data, purchaseEntries: { ...data.purchaseEntries, [date]: nextDay } });
  }

  function setLock(store, locked) {
    const nextLocks = { ...dayLocks, [store]: locked };
    persist({ ...data, purchaseLocks: { ...data.purchaseLocks, [date]: nextLocks } });
  }

  if (activeStore && data.stores.includes(activeStore)) {
    const locked = !!dayLocks[activeStore];
    return (
      <StoreDetail
        store={activeStore}
        items={dayEntries[activeStore] || []}
        itemForm={itemForm}
        setItemForm={setItemForm}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onRemoveStore={() => removeStore(activeStore)}
        onBack={() => setActiveStore(null)}
        total={storeTotal(activeStore)}
        error={error}
        isAdmin={isAdmin}
        locked={locked}
        onLock={() => setLock(activeStore, true)}
        onUnlock={() => setLock(activeStore, false)}
      />
    );
  }

  return (
    <>
      <div style={{ background: "#1C1B19", borderRadius: 10, padding: "14px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#C7C4BB", fontSize: 13 }}>Günün Alış Toplamı</span>
        <span style={{ color: "#F7F6F2", fontSize: 20, fontWeight: 700 }}>{formatTL(dayTotal)}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {data.stores.map((store) => {
          const items = dayEntries[store] || [];
          const total = storeTotal(store);
          const locked = !!dayLocks[store];
          return (
            <button
              key={store}
              onClick={() => openStore(store)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#FFFFFF",
                border: "1px solid #E4E1D8",
                borderRadius: 10,
                padding: "14px 16px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#EAF3EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Store size={17} color="#1C6B4E" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    {store}
                    {locked && <Lock size={12} color="#A8A49A" />}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B6862" }}>{items.length === 0 ? "Henüz ürün yok" : `${items.length} ürün`}</div>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: total > 0 ? "#1C1B19" : "#A8A49A" }}>{formatTL(total)}</div>
            </button>
          );
        })}
      </div>

      {isAdmin &&
        (showAddStore ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              autoFocus
              type="text"
              placeholder="Mağaza adı"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStore()}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={addStore} style={primaryBtnStyle}>Ekle</button>
            <button onClick={() => { setShowAddStore(false); setNewStoreName(""); }} style={{ ...ghostBtnStyle, width: 40 }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAddStore(true)} style={{ ...ghostBtnStyle, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Plus size={15} /> Yeni Mağaza Ekle
          </button>
        ))}
      {error && <p style={{ color: "#B4432E", fontSize: 13, marginTop: 10 }}>{error}</p>}
    </>
  );
}

function StoreDetail({ store, items, itemForm, setItemForm, onAddItem, onRemoveItem, onRemoveStore, onBack, total, error, isAdmin, locked, onLock, onUnlock }) {
  const [confirmChecked, setConfirmChecked] = useState(false);
  const readOnly = locked && !isAdmin;

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: "none", color: "#6B6862", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 14 }}>
        <ChevronLeft size={16} /> Mağazalara dön
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          {store}
          {locked && <Lock size={14} color="#A8A49A" />}
        </h2>
        {isAdmin && (
          <div style={{ display: "flex", gap: 10 }}>
            {locked ? (
              <button onClick={onUnlock} style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: "none", color: "#1C6B4E", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                <Unlock size={13} /> Kilidi Kaldır
              </button>
            ) : null}
            <button onClick={onRemoveStore} style={{ border: "none", background: "none", color: "#A8A49A", cursor: "pointer", fontSize: 12 }}>
              Mağazayı sil
            </button>
          </div>
        )}
      </div>

      {readOnly && (
        <div style={{ background: "#F1EFE9", border: "1px solid #E4E1D8", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Lock size={14} color="#6B6862" />
          <span style={{ fontSize: 13, color: "#6B6862" }}>Bu kayıt onaylandı, değiştirilemez.</span>
        </div>
      )}

      {!readOnly && (
        <form onSubmit={onAddItem} style={{ background: "#FFFFFF", border: "1px solid #E4E1D8", borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            <Field label="Ürün">
              <input type="text" placeholder="Örn. Un" value={itemForm.product} onChange={(e) => setItemForm((f) => ({ ...f, product: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Miktar">
              <input type="number" min="0" step="0.01" value={itemForm.qty} onChange={(e) => setItemForm((f) => ({ ...f, qty: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Birim Fiyat">
              <input type="number" min="0" step="0.01" placeholder="0" value={itemForm.unitPrice} onChange={(e) => setItemForm((f) => ({ ...f, unitPrice: e.target.value }))} style={inputStyle} />
            </Field>
          </div>
          <button type="submit" style={{ width: "100%", padding: "9px 0", borderRadius: 7, border: "none", background: "#1C1B19", color: "#F7F6F2", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
            <Plus size={15} /> Ürün Ekle
          </button>
          {error && <p style={{ color: "#B4432E", fontSize: 13, marginTop: 8 }}>{error}</p>}
        </form>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {items.length === 0 && <p style={{ color: "#6B6862", fontSize: 14, textAlign: "center", padding: "16px 0" }}>Bu mağaza için henüz ürün girilmedi.</p>}
        {items.map((it) => (
          <div key={it.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF", border: "1px solid #E4E1D8", borderRadius: 8, padding: "10px 12px" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{it.product}</div>
              <div style={{ fontSize: 12, color: "#6B6862" }}>{it.qty} × {formatTL(it.unitPrice)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{formatTL(it.qty * it.unitPrice)}</span>
              {isAdmin && (
                <button onClick={() => onRemoveItem(it.id)} style={{ border: "none", background: "none", color: "#A8A49A", cursor: "pointer", padding: 4 }} aria-label="Sil">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#1C1B19", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: !readOnly && !isAdmin && items.length > 0 ? 14 : 0 }}>
        <span style={{ color: "#C7C4BB", fontSize: 13 }}>{store} Toplamı</span>
        <span style={{ color: "#F7F6F2", fontSize: 17, fontWeight: 700 }}>{formatTL(total)}</span>
      </div>

      {!readOnly && !isAdmin && items.length > 0 && (
        <ConfirmLockBox checked={confirmChecked} setChecked={setConfirmChecked} onConfirm={onLock} />
      )}
    </div>
  );
}

function ConfirmLockBox({ checked, setChecked, onConfirm }) {
  return (
    <div style={{ background: "#FFF9EC", border: "1px solid #E9DDB8", borderRadius: 10, padding: 14 }}>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#7A6A2E", cursor: "pointer" }}>
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} style={{ marginTop: 2 }} />
        Bu kayıt onaylandıktan sonra değiştirilemeyecek. Onaylıyor musunuz?
      </label>
      <button
        disabled={!checked}
        onClick={onConfirm}
        style={{
          marginTop: 10,
          width: "100%",
          padding: "10px 0",
          borderRadius: 7,
          border: "none",
          background: checked ? "#1C1B19" : "#D8D4C8",
          color: "#F7F6F2",
          fontWeight: 700,
          fontSize: 14,
          cursor: checked ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <CheckCircle2 size={16} /> Kaydet ve Onayla
      </button>
    </div>
  );
}

/* ---------------- SATIŞ ---------------- */

function SatisTab({ data, date, persist, error, isAdmin }) {
  const [confirmChecked, setConfirmChecked] = useState(false);
  const dayRow = data.salesEntries[date] || {};
  const locked = !!data.salesLocks[date];
  const readOnly = locked && !isAdmin;

  function updateRow(product, field, value) {
    const current = dayRow[product] || { qty: "", unitPrice: "" };
    const nextRow = { ...current, [field]: value };
    persist({ ...data, salesEntries: { ...data.salesEntries, [date]: { ...dayRow, [product]: nextRow } } });
  }

  function setLock(value) {
    persist({ ...data, salesLocks: { ...data.salesLocks, [date]: value } });
  }

  const rows = SALE_PRODUCTS.map((product) => {
    const r = dayRow[product] || { qty: "", unitPrice: "" };
    const qty = parseFloat(r.qty) || 0;
    const unitPrice = parseFloat(r.unitPrice) || 0;
    return { product, qty: r.qty ?? "", unitPrice: r.unitPrice ?? "", total: qty * unitPrice };
  });

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const totalUnits = rows.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0);
  const hasAnyEntry = rows.some((r) => (parseFloat(r.qty) || 0) > 0);

  return (
    <div>
      <div style={{ background: "#1C1B19", borderRadius: 10, padding: "14px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#C7C4BB", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          Günün Satış Toplamı {locked && <Lock size={12} />}
        </span>
        <span style={{ color: "#F7F6F2", fontSize: 20, fontWeight: 700 }}>{formatTL(grandTotal)}</span>
      </div>

      {isAdmin && locked && (
        <button onClick={() => setLock(false)} style={{ display: "flex", alignItems: "center", gap: 5, border: "none", background: "none", color: "#1C6B4E", cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
          <Unlock size={13} /> Kilidi Kaldır
        </button>
      )}
      {readOnly && (
        <div style={{ background: "#F1EFE9", border: "1px solid #E4E1D8", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <Lock size={14} color="#6B6862" />
          <span style={{ fontSize: 13, color: "#6B6862" }}>Bu günün satışları onaylandı, değiştirilemez.</span>
        </div>
      )}

      <div style={{ background: "#FFFFFF", border: "1px solid #E4E1D8", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr", gap: 4, padding: "10px 12px", background: "#F1EFE9", fontSize: 11, color: "#6B6862", fontWeight: 600 }}>
          <span>Ürün</span>
          <span style={{ textAlign: "right" }}>Adet</span>
          <span style={{ textAlign: "right" }}>Birim Fiyat</span>
          <span style={{ textAlign: "right" }}>Toplam</span>
        </div>

        {rows.map((r, i) => (
          <div key={r.product} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr", gap: 4, alignItems: "center", padding: "8px 12px", borderTop: "1px solid #EFEDE6", background: i % 2 === 0 ? "#FFFFFF" : "#FBFAF7" }}>
            <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.product}</span>
            <input type="number" min="0" placeholder="0" value={r.qty} disabled={readOnly} onChange={(e) => updateRow(r.product, "qty", e.target.value)} style={{ ...cellInputStyle, opacity: readOnly ? 0.6 : 1 }} />
            <input type="number" min="0" step="0.01" placeholder="0" value={r.unitPrice} disabled={readOnly} onChange={(e) => updateRow(r.product, "unitPrice", e.target.value)} style={{ ...cellInputStyle, opacity: readOnly ? 0.6 : 1 }} />
            <span style={{ fontSize: 13, fontWeight: 700, textAlign: "right", color: r.total > 0 ? "#1C1B19" : "#A8A49A" }}>{formatTL(r.total)}</span>
          </div>
        ))}

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr", gap: 4, padding: "12px 12px", borderTop: "1px solid #E4E1D8", background: "#F1EFE9" }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Toplam</span>
          <span style={{ fontSize: 13, fontWeight: 700, textAlign: "right" }}>{totalUnits}</span>
          <span />
          <span style={{ fontSize: 14, fontWeight: 700, textAlign: "right" }}>{formatTL(grandTotal)}</span>
        </div>
      </div>

      {error && <p style={{ color: "#B4432E", fontSize: 13, marginBottom: 10 }}>{error}</p>}

      {!readOnly && !isAdmin && hasAnyEntry && (
        <ConfirmLockBox checked={confirmChecked} setChecked={setConfirmChecked} onConfirm={() => setLock(true)} />
      )}
    </div>
  );
}

/* ---------------- MALİYETLER ---------------- */

function MaliyetlerTab({ data, persist, error }) {
  const costs = data.costs || {};

  function updateCost(product, field, value) {
    const current = costs[product] || { cost: "", price: "" };
    const next = { ...current, [field]: value };
    persist({ ...data, costs: { ...costs, [product]: next } });
  }

  const rows = SALE_PRODUCTS.map((product) => {
    const c = costs[product] || { cost: "", price: "" };
    const cost = parseFloat(c.cost) || 0;
    const price = parseFloat(c.price) || 0;
    const margin = price - cost;
    const marginPct = price > 0 ? (margin / price) * 100 : 0;
    return { product, cost: c.cost ?? "", price: c.price ?? "", margin, marginPct };
  });

  return (
    <div>
      <p style={{ color: "#6B6862", fontSize: 13, marginBottom: 14 }}>
        Her ürünün birim maliyetini ve satış fiyatını gir; kâr marjı otomatik hesaplanır.
      </p>
      <div style={{ background: "#FFFFFF", border: "1px solid #E4E1D8", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 0.8fr", gap: 4, padding: "10px 12px", background: "#F1EFE9", fontSize: 11, color: "#6B6862", fontWeight: 600 }}>
          <span>Ürün</span>
          <span style={{ textAlign: "right" }}>Maliyet</span>
          <span style={{ textAlign: "right" }}>Satış F.</span>
          <span style={{ textAlign: "right" }}>Kâr</span>
          <span style={{ textAlign: "right" }}>%</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.product} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 0.8fr", gap: 4, alignItems: "center", padding: "8px 12px", borderTop: "1px solid #EFEDE6", background: i % 2 === 0 ? "#FFFFFF" : "#FBFAF7" }}>
            <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.product}</span>
            <input type="number" min="0" step="0.01" placeholder="0" value={r.cost} onChange={(e) => updateCost(r.product, "cost", e.target.value)} style={cellInputStyle} />
            <input type="number" min="0" step="0.01" placeholder="0" value={r.price} onChange={(e) => updateCost(r.product, "price", e.target.value)} style={cellInputStyle} />
            <span style={{ fontSize: 13, fontWeight: 700, textAlign: "right", color: r.margin >= 0 ? "#1C6B4E" : "#B4432E" }}>{formatTL(r.margin)}</span>
            <span style={{ fontSize: 12, fontWeight: 600, textAlign: "right", color: r.margin >= 0 ? "#1C6B4E" : "#B4432E" }}>{r.marginPct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
      {error && <p style={{ color: "#B4432E", fontSize: 13, marginTop: 10 }}>{error}</p>}
    </div>
  );
}

/* ---------------- KÂR / ZARAR ---------------- */

function KarZararTab({ data }) {
  const [month, setMonth] = useState(thisMonthISO());

  const stats = useMemo(() => {
    let purchaseTotal = 0;
    Object.entries(data.purchaseEntries).forEach(([d, stores]) => {
      if (!d.startsWith(month)) return;
      Object.values(stores).forEach((items) => {
        items.forEach((it) => (purchaseTotal += it.qty * it.unitPrice));
      });
    });

    let salesTotal = 0;
    let cogsTotal = 0;
    const perProduct = {};
    Object.entries(data.salesEntries).forEach(([d, row]) => {
      if (!d.startsWith(month)) return;
      Object.entries(row).forEach(([product, r]) => {
        const qty = parseFloat(r.qty) || 0;
        const unitPrice = parseFloat(r.unitPrice) || 0;
        const revenue = qty * unitPrice;
        salesTotal += revenue;
        const unitCost = parseFloat(data.costs?.[product]?.cost) || 0;
        const cost = qty * unitCost;
        cogsTotal += cost;
        if (!perProduct[product]) perProduct[product] = { qty: 0, revenue: 0, cost: 0 };
        perProduct[product].qty += qty;
        perProduct[product].revenue += revenue;
        perProduct[product].cost += cost;
      });
    });

    return {
      purchaseTotal,
      salesTotal,
      cogsTotal,
      nakitNet: salesTotal - purchaseTotal,
      maliyetNet: salesTotal - cogsTotal,
      perProduct,
    };
  }, [data, month]);

  const productRows = Object.entries(stats.perProduct)
    .filter(([, v]) => v.qty > 0)
    .sort((a, b) => b[1].revenue - a[1].revenue);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFFFFF", border: "1px solid #E4E1D8", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
        <Calendar size={16} color="#6B6862" />
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ border: "none", background: "transparent", fontSize: 14, color: "#1C1B19", flex: 1 }} />
        <span style={{ fontSize: 12, color: "#A8A49A" }}>{formatMonthLabel(month)}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <StatCard label="Toplam Satış" value={formatTL(stats.salesTotal)} color="#1C6B4E" icon={<TrendingUp size={15} />} />
        <StatCard label="Toplam Alış" value={formatTL(stats.purchaseTotal)} color="#B4432E" icon={<TrendingDown size={15} />} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <StatCard label="Net (Satış - Alış)" value={formatTL(stats.nakitNet)} color={stats.nakitNet >= 0 ? "#1C6B4E" : "#B4432E"} icon={<Percent size={15} />} />
        <StatCard label="Net (Ürün Maliyetine Göre)" value={formatTL(stats.maliyetNet)} color={stats.maliyetNet >= 0 ? "#1C6B4E" : "#B4432E"} icon={<Percent size={15} />} />
      </div>

      <p style={{ color: "#6B6862", fontSize: 12, marginBottom: 14 }}>
        "Satış - Alış" nakit akışını gösterir (o ay yapılan tüm market alışları). "Ürün Maliyetine Göre" ise Maliyetler
        sekmesindeki birim maliyetlere göre satılan ürünlerin gerçek kârını gösterir.
      </p>

      {productRows.length > 0 && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E4E1D8", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.7fr 1fr 1fr", gap: 4, padding: "10px 12px", background: "#F1EFE9", fontSize: 11, color: "#6B6862", fontWeight: 600 }}>
            <span>Ürün</span>
            <span style={{ textAlign: "right" }}>Adet</span>
            <span style={{ textAlign: "right" }}>Gelir</span>
            <span style={{ textAlign: "right" }}>Kâr</span>
          </div>
          {productRows.map(([product, v], i) => (
            <div key={product} style={{ display: "grid", gridTemplateColumns: "1.6fr 0.7fr 1fr 1fr", gap: 4, padding: "8px 12px", borderTop: "1px solid #EFEDE6", background: i % 2 === 0 ? "#FFFFFF" : "#FBFAF7" }}>
              <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product}</span>
              <span style={{ fontSize: 13, textAlign: "right" }}>{v.qty}</span>
              <span style={{ fontSize: 13, textAlign: "right" }}>{formatTL(v.revenue)}</span>
              <span style={{ fontSize: 13, fontWeight: 700, textAlign: "right", color: v.revenue - v.cost >= 0 ? "#1C6B4E" : "#B4432E" }}>{formatTL(v.revenue - v.cost)}</span>
            </div>
          ))}
        </div>
      )}
      {productRows.length === 0 && <p style={{ color: "#6B6862", fontSize: 14, textAlign: "center", padding: "20px 0" }}>Bu ay için henüz satış kaydı yok.</p>}
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E4E1D8", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color, marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 12, color: "#6B6862", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#1C1B19" }}>{value}</div>
    </div>
  );
}

/* ---------------- YÖNETİCİ PANELİ ---------------- */

function YoneticiTab({ data, persist, error }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [formErr, setFormErr] = useState("");
  const users = data.users || {};

  function createUser(e) {
    e.preventDefault();
    const username = form.username.trim();
    const password = form.password.trim();
    if (!username || !password) {
      setFormErr("Kullanıcı adı ve şifre gerekli.");
      return;
    }
    if (users[username]) {
      setFormErr("Bu kullanıcı adı zaten var.");
      return;
    }
    persist({ ...data, users: { ...users, [username]: { password, role: "user" } } });
    setForm({ username: "", password: "" });
    setFormErr("");
  }

  function deleteUser(username) {
    const { [username]: _r, ...rest } = users;
    persist({ ...data, users: rest });
  }

  return (
    <div>
      <form onSubmit={createUser} style={{ background: "#FFFFFF", border: "1px solid #E4E1D8", borderRadius: 10, padding: 16, marginBottom: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
          <UserPlus size={15} /> Yeni Kullanıcı Oluştur
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <Field label="Kullanıcı Adı">
            <input type="text" autoCapitalize="none" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Şifre">
            <input type="text" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} style={inputStyle} />
          </Field>
        </div>
        <button type="submit" style={{ width: "100%", padding: "9px 0", borderRadius: 7, border: "none", background: "#1C1B19", color: "#F7F6F2", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          Kullanıcı Oluştur
        </button>
        {formErr && <p style={{ color: "#B4432E", fontSize: 13, marginTop: 8 }}>{formErr}</p>}
        {error && <p style={{ color: "#B4432E", fontSize: 13, marginTop: 8 }}>{error}</p>}
      </form>

      <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
        <Users size={15} /> Kullanıcılar
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.entries(users).map(([username, u]) => (
          <div key={username} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF", border: "1px solid #E4E1D8", borderRadius: 10, padding: "10px 14px" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{username}</div>
              <div style={{ fontSize: 12, color: u.role === "admin" ? "#B4432E" : "#6B6862" }}>{u.role === "admin" ? "Yönetici" : "Kullanıcı"}</div>
            </div>
            {u.role !== "admin" && (
              <button onClick={() => deleteUser(username)} style={{ border: "none", background: "none", color: "#A8A49A", cursor: "pointer", padding: 4 }} aria-label="Sil">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontSize: 11, color: "#6B6862", display: "block", marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 7,
  border: "1px solid #E4E1D8",
  fontSize: 14,
  color: "#1C1B19",
  background: "#FCFCFA",
  boxSizing: "border-box",
};

const cellInputStyle = {
  width: "100%",
  padding: "5px 6px",
  borderRadius: 5,
  border: "1px solid #E4E1D8",
  fontSize: 13,
  color: "#1C1B19",
  background: "#FCFCFA",
  boxSizing: "border-box",
  textAlign: "right",
};

const primaryBtnStyle = {
  padding: "0 16px",
  borderRadius: 7,
  border: "none",
  background: "#1C1B19",
  color: "#F7F6F2",
  fontWeight: "600",
  fontSize: 14,
  cursor: "pointer",
};

const ghostBtnStyle = {
  padding: "9px 0",
  borderRadius: 7,
  border: "1px solid #E4E1D8",
  background: "#FFFFFF",
  color: "#1C1B19",
  fontWeight: "600",
  fontSize: 14,
  cursor: "pointer",
};
