import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Package,
  Percent,
  Plus,
  Pizza,
  RefreshCw,
  Settings,
  ShoppingBag,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLXwi0r4QrMlpA7PxYEFwy5ADr_Q9nPqk",
  authDomain: "mano-pizza.firebaseapp.com",
  projectId: "mano-pizza",
  storageBucket: "mano-pizza.firebasestorage.app",
  messagingSenderId: "558530166779",
  appId: "1:558530166779:web:fe990140b59ad5dd1e155e",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DOC_REF = doc(db, "mano_pizza", "veri");

const ADMIN_USERNAME = "mathrew";
const ADMIN_PASSWORD = "01102022";

const DEFAULT_STORES = ["Metro Market", "File Market"];
const SALE_PRODUCTS = [
  "Margarita Pizza",
  ...Array.from({ length: 20 }, (_, i) => `Pizza No:${i + 1}`),
];

const EMPTY_DATA = {
  stores: DEFAULT_STORES,
  purchaseEntries: {},
  purchaseLocks: {},
  salesEntries: {},
  salesLocks: {},
  costs: {},
  lastActiveStore: null,
  users: {
    [ADMIN_USERNAME]: {
      password: ADMIN_PASSWORD,
      role: "admin",
    },
  },
};

function formatTL(value) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function thisMonthISO() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(iso) {
  if (!iso) return "";
  return new Date(`${iso}-01T00:00:00`).toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });
}

function dateLabel(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

function safeParse(value) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export default function ManoPizza() {
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      DOC_REF,
      (snapshot) => {
        if (snapshot.exists()) {
          const incoming = snapshot.data() || {};
          setData({
            ...EMPTY_DATA,
            ...incoming,
            stores: incoming.stores?.length
              ? incoming.stores
              : DEFAULT_STORES,
            users: {
              ...EMPTY_DATA.users,
              ...(incoming.users || {}),
            },
          });
        } else {
          setDoc(DOC_REF, EMPTY_DATA).catch(console.error);
          setData(EMPTY_DATA);
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Veriler yüklenemedi. Firebase bağlantısını kontrol edin.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function persist(nextData) {
    setData(nextData);
    try {
      await setDoc(DOC_REF, nextData);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Değişiklik kaydedilemedi.");
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return (
      <LoginScreen
        users={data.users}
        onSuccess={setCurrentUser}
      />
    );
  }

  const isAdmin = currentUser.role === "admin";

  return (
    <div className="mano-app">
      <style>{CSS}</style>

      <header className="topbar">
        <button
          className="mobile-menu"
          onClick={() => setMobileMenu((v) => !v)}
        >
          <Menu size={21} />
        </button>

        <div className="brand">
          <div className="brand-mark">
            <Pizza size={19} />
          </div>
          <div>
            <strong>Mano Pizza</strong>
            <span>İşletme Yönetim Paneli</span>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="online-dot">
            <span />
            Canlı
          </div>
          <div className="user-pill">
            <div className="avatar">
              {currentUser.username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <b>{currentUser.username}</b>
              <small>{isAdmin ? "Yönetici" : "Kullanıcı"}</small>
            </div>
          </div>
          <button
            className="icon-button"
            title="Çıkış"
            onClick={() => setCurrentUser(null)}
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <div className="app-layout">
        <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
          <div className="nav-section">
            <span className="nav-title">GENEL</span>
            <NavItem
              active={activeView === "dashboard"}
              onClick={() => {
                setActiveView("dashboard");
                setMobileMenu(false);
              }}
              icon={<LayoutDashboard size={17} />}
            >
              Genel Bakış
            </NavItem>
          </div>

          <div className="nav-section">
            <span className="nav-title">OPERASYON</span>
            <NavItem
              active={activeView === "sales"}
              onClick={() => {
                setActiveView("sales");
                setMobileMenu(false);
              }}
              icon={<TrendingUp size={17} />}
            >
              Satışlar
            </NavItem>

            <NavItem
              active={activeView === "purchases"}
              onClick={() => {
                setActiveView("purchases");
                setMobileMenu(false);
              }}
              icon={<ShoppingBag size={17} />}
            >
              Alışlar
            </NavItem>

            {isAdmin && (
              <>
                <NavItem
                  active={activeView === "costs"}
                  onClick={() => {
                    setActiveView("costs");
                    setMobileMenu(false);
                  }}
                  icon={<Percent size={17} />}
                >
                  Maliyetler
                </NavItem>

                <NavItem
                  active={activeView === "profit"}
                  onClick={() => {
                    setActiveView("profit");
                    setMobileMenu(false);
                  }}
                  icon={<BarChart3 size={17} />}
                >
                  Kâr / Zarar
                </NavItem>
              </>
            )}
          </div>

          {isAdmin && (
            <div className="nav-section">
              <span className="nav-title">YÖNETİM</span>
              <NavItem
                active={activeView === "management"}
                onClick={() => {
                  setActiveView("management");
                  setMobileMenu(false);
                }}
                icon={<Settings size={17} />}
              >
                Yönetim
              </NavItem>
            </div>
          )}

          <div className="sidebar-bottom">
            <div className="secure-card">
              <Lock size={15} />
              <div>
                <b>Güvenli kayıt</b>
                <span>Veriler Firebase ile senkron.</span>
              </div>
            </div>
          </div>
        </aside>

        {mobileMenu && (
          <div
            className="mobile-overlay"
            onClick={() => setMobileMenu(false)}
          />
        )}

        <main className="main-content">
          <div className="content-wrap">
            {activeView === "dashboard" && (
              <Dashboard
                data={data}
                date={selectedDate}
                setDate={setSelectedDate}
                setView={setActiveView}
              />
            )}

            {activeView === "sales" && (
              <SalesPage
                data={data}
                date={selectedDate}
                setDate={setSelectedDate}
                persist={persist}
                error={error}
                isAdmin={isAdmin}
              />
            )}

            {activeView === "purchases" && (
              <PurchasesPage
                data={data}
                date={selectedDate}
                persist={persist}
                error={error}
                isAdmin={isAdmin}
              />
            )}

            {activeView === "costs" && isAdmin && (
              <CostsPage
                data={data}
                persist={persist}
                error={error}
              />
            )}

            {activeView === "profit" && isAdmin && (
              <ProfitPage data={data} />
            )}

            {activeView === "management" && isAdmin && (
              <ManagementPage
                data={data}
                persist={persist}
                error={error}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        <Pizza size={30} />
      </div>
      <strong>Mano Pizza</strong>
      <span>Panel hazırlanıyor…</span>
    </div>
  );
}

function LoginScreen({ users, onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const key = username.trim();
    const user = users[key];

    if (user && user.password === password) {
      onSuccess({
        username: key,
        role: user.role,
      });
      return;
    }

    setError("Kullanıcı adı veya şifre hatalı.");
    setPassword("");
  }

  return (
    <div className="login-screen">
      <div className="login-decoration" />
      <div className="login-card">
        <div className="login-logo">
          <Pizza size={31} />
        </div>

        <h1>Mano Pizza</h1>
        <p>İşletme yönetim paneli</p>

        <form onSubmit={submit}>
          <label>Kullanıcı adı</label>
          <input
            autoFocus
            value={username}
            autoCapitalize="none"
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Kullanıcı adınız"
          />

          <label>Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && <div className="form-error">{error}</div>}

          <button className="login-button" type="submit">
            Panele Giriş Yap
          </button>
        </form>

        <div className="login-footer">
          <Lock size={13} />
          Yetkili erişim
        </div>
      </div>
    </div>
  );
}

function NavItem({ active, icon, children, onClick }) {
  return (
    <button
      className={`nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {icon}
      <span>{children}</span>
      {active && <i />}
    </button>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

function DateControl({ date, setDate }) {
  return (
    <div className="date-control">
      <CalendarDays size={16} />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <span>{dateLabel(date)}</span>
    </div>
  );
}

function Dashboard({ data, date, setDate, setView }) {
  const stats = useMemo(() => calculateMonthStats(data), [data]);
  const todaySales = calculateDaySales(data, date);
  const todayPurchases = calculateDayPurchases(data, date);
  const todayUnits = calculateDayUnits(data, date);

  const activeProducts = Object.entries(stats.perProduct)
    .filter(([, v]) => v.qty > 0)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="GENEL BAKIŞ"
        title="Günaydın, işletme 👋"
        description="Mano Pizza operasyonlarının finansal özetini buradan takip edebilirsin."
        actions={
          <DateControl date={date} setDate={setDate} />
        }
      />

      <div className="dashboard-date-mobile">
        <DateControl date={date} setDate={setDate} />
      </div>

      <div className="kpi-grid">
        <KpiCard
          title="Bugünkü Satış"
          value={formatTL(todaySales)}
          meta={`${todayUnits} adet ürün`}
          icon={<TrendingUp size={19} />}
          tone="green"
        />
        <KpiCard
          title="Bugünkü Alış"
          value={formatTL(todayPurchases)}
          meta={`${data.stores.length} tedarik noktası`}
          icon={<ShoppingBag size={19} />}
          tone="red"
        />
        <KpiCard
          title={`${monthLabel(thisMonthISO())} Satış`}
          value={formatTL(stats.salesTotal)}
          meta={`${stats.totalUnits} toplam adet`}
          icon={<CircleDollarSign size={19} />}
          tone="dark"
        />
        <KpiCard
          title="Tahmini Brüt Kâr"
          value={formatTL(stats.maliyetNet)}
          meta={
            stats.salesTotal
              ? `%${((stats.maliyetNet / stats.salesTotal) * 100).toFixed(1)} marj`
              : "Maliyet girilmedi"
          }
          icon={<BarChart3 size={19} />}
          tone={stats.maliyetNet >= 0 ? "green" : "red"}
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <PanelHeader
            title="Aylık Finansal Özet"
            subtitle={monthLabel(thisMonthISO())}
          />
          <div className="mini-chart">
            <div className="chart-bars">
              <div className="bar-group">
                <span className="bar sales-bar" style={{ height: "82%" }} />
                <span className="bar purchase-bar" style={{ height: "51%" }} />
              </div>
              <div className="bar-group">
                <span className="bar sales-bar" style={{ height: "67%" }} />
                <span className="bar purchase-bar" style={{ height: "43%" }} />
              </div>
              <div className="bar-group">
                <span className="bar sales-bar" style={{ height: "91%" }} />
                <span className="bar purchase-bar" style={{ height: "56%" }} />
              </div>
              <div className="bar-group">
                <span className="bar sales-bar" style={{ height: "73%" }} />
                <span className="bar purchase-bar" style={{ height: "48%" }} />
              </div>
              <div className="bar-group">
                <span className="bar sales-bar" style={{ height: "96%" }} />
                <span className="bar purchase-bar" style={{ height: "44%" }} />
              </div>
              <div className="bar-group">
                <span className="bar sales-bar" style={{ height: "78%" }} />
                <span className="bar purchase-bar" style={{ height: "52%" }} />
              </div>
              <div className="bar-group">
                <span className="bar sales-bar" style={{ height: "88%" }} />
                <span className="bar purchase-bar" style={{ height: "49%" }} />
              </div>
            </div>
            <div className="chart-legend">
              <span><i className="legend-sales" /> Satış</span>
              <span><i className="legend-purchase" /> Alış</span>
            </div>
          </div>
        </section>

        <section className="panel quick-panel">
          <PanelHeader
            title="Hızlı İşlemler"
            subtitle="Operasyonlara hızlı erişim"
          />
          <QuickAction
            icon={<TrendingUp size={18} />}
            title="Satış Girişi"
            text="Günlük ürün satışlarını kaydet"
            onClick={() => setView("sales")}
          />
          <QuickAction
            icon={<ShoppingBag size={18} />}
            title="Alış Girişi"
            text="Market ve tedarik alışlarını kaydet"
            onClick={() => setView("purchases")}
          />
          <QuickAction
            icon={<FileText size={18} />}
            title="Raporlar"
            text="Aylık kâr ve zarar görünümünü aç"
            onClick={() => setView("profit")}
          />
        </section>
      </div>

      <div className="dashboard-grid lower">
        <section className="panel">
          <PanelHeader
            title="En Çok Ciro Getiren Ürünler"
            subtitle="Bu ay"
          />
          {activeProducts.length ? (
            <div className="product-list">
              {activeProducts.map(([name, v], index) => (
                <div className="product-row" key={name}>
                  <span className="product-rank">{index + 1}</span>
                  <div className="product-name">
                    <b>{name}</b>
                    <small>{v.qty} adet</small>
                  </div>
                  <div className="product-revenue">
                    {formatTL(v.revenue)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Bu ay için satış kaydı bulunmuyor." />
          )}
        </section>

        <section className="panel">
          <PanelHeader
            title="Operasyon Durumu"
            subtitle="Bugün"
          />
          <StatusRow
            icon={<Clock3 size={17} />}
            title="Satış kaydı"
            text={
              data.salesLocks[date]
                ? "Gün onaylandı ve kilitlendi."
                : "Gün açık, veri girişi yapılabilir."
            }
            status={data.salesLocks[date] ? "Onaylı" : "Açık"}
          />
          <StatusRow
            icon={<Store size={17} />}
            title="Alış noktaları"
            text={`${data.stores.length} aktif mağaza / tedarik noktası`}
            status={`${data.stores.length} aktif`}
          />
          <StatusRow
            icon={<Package size={17} />}
            title="Bugünkü ürün"
            text={`${todayUnits} adet satış kaydı`}
            status={todayUnits > 0 ? "Hareket var" : "Bekliyor"}
          />
        </section>
      </div>
    </>
  );
}

function KpiCard({ title, value, meta, icon, tone }) {
  return (
    <div className={`kpi-card ${tone}`}>
      <div className="kpi-top">
        <span>{title}</span>
        <div className="kpi-icon">{icon}</div>
      </div>
      <strong>{value}</strong>
      <small>{meta}</small>
    </div>
  );
}

function PanelHeader({ title, subtitle, action }) {
  return (
    <div className="panel-header">
      <div>
        <h3>{title}</h3>
        {subtitle && <span>{subtitle}</span>}
      </div>
      {action}
    </div>
  );
}

function QuickAction({ icon, title, text, onClick }) {
  return (
    <button className="quick-action" onClick={onClick}>
      <div className="quick-icon">{icon}</div>
      <div>
        <b>{title}</b>
        <span>{text}</span>
      </div>
      <ChevronRight size={16} />
    </button>
  );
}

function StatusRow({ icon, title, text, status }) {
  return (
    <div className="status-row">
      <div className="status-icon">{icon}</div>
      <div>
        <b>{title}</b>
        <span>{text}</span>
      </div>
      <em>{status}</em>
    </div>
  );
}

function SalesPage({ data, date, setDate, persist, error, isAdmin }) {
  const rowData = data.salesEntries[date] || {};
  const locked = !!data.salesLocks[date];
  const readOnly = locked && !isAdmin;

  function update(product, field, value) {
    const current = rowData[product] || { qty: "", unitPrice: "" };
    const next = {
      ...current,
      [field]: value,
    };

    persist({
      ...data,
      salesEntries: {
        ...data.salesEntries,
        [date]: {
          ...rowData,
          [product]: next,
        },
      },
    });
  }

  function toggleLock() {
    persist({
      ...data,
      salesLocks: {
        ...data.salesLocks,
        [date]: !locked,
      },
    });
  }

  const rows = SALE_PRODUCTS.map((product) => {
    const row = rowData[product] || {};
    const qty = safeParse(row.qty);
    const price = safeParse(row.unitPrice);
    return {
      product,
      qty: row.qty ?? "",
      unitPrice: row.unitPrice ?? "",
      total: qty * price,
    };
  });

  const total = rows.reduce((s, r) => s + r.total, 0);
  const units = rows.reduce((s, r) => s + safeParse(r.qty), 0);
  const filled = rows.filter((r) => safeParse(r.qty) > 0).length;

  return (
    <>
      <PageHeader
        eyebrow="OPERASYON / SATIŞ"
        title="Günlük Satışlar"
        description="Ürün bazında adet ve satış fiyatlarını yönetin."
        actions={<DateControl date={date} setDate={setDate} />}
      />

      <div className="summary-strip">
        <div>
          <span>Günün toplam cirosu</span>
          <strong>{formatTL(total)}</strong>
        </div>
        <div>
          <span>Toplam adet</span>
          <strong>{units}</strong>
        </div>
        <div>
          <span>Dolu ürün</span>
          <strong>{filled}</strong>
        </div>
        <div className="summary-status">
          {locked ? (
            <>
              <Lock size={15} /> Gün kilitli
            </>
          ) : (
            <>
              <CheckCircle2 size={15} /> Veri girişi açık
            </>
          )}
        </div>
      </div>

      {locked && !isAdmin && (
        <div className="notice locked">
          <Lock size={16} />
          Bu günün satışları onaylandı. Değişiklik yapılamaz.
        </div>
      )}

      <section className="panel table-panel">
        <PanelHeader
          title="Satış Kalemleri"
          subtitle={`${dateLabel(date)} · ${filled} ürün girildi`}
          action={
            isAdmin && (
              <button className="secondary-button" onClick={toggleLock}>
                {locked ? <><RefreshCw size={14} /> Kilidi Aç</> : <><Lock size={14} /> Günü Kilitle</>}
              </button>
            )
          }
        />

        <div className="table-scroll">
          <table className="business-table">
            <thead>
              <tr>
                <th>Ürün</th>
                <th className="numeric">Adet</th>
                <th className="numeric">Birim Fiyat</th>
                <th className="numeric">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.product}>
                  <td>
                    <div className="table-product">
                      <div className="mini-pizza"><Pizza size={13} /></div>
                      {row.product}
                    </div>
                  </td>
                  <td>
                    <input
                      className="table-input"
                      type="number"
                      min="0"
                      placeholder="0"
                      disabled={readOnly}
                      value={row.qty}
                      onChange={(e) => update(row.product, "qty", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="table-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      disabled={readOnly}
                      value={row.unitPrice}
                      onChange={(e) => update(row.product, "unitPrice", e.target.value)}
                    />
                  </td>
                  <td className="numeric strong">
                    {formatTL(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>TOPLAM</td>
                <td className="numeric">{units}</td>
                <td />
                <td className="numeric">{formatTL(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {error && <div className="form-error bottom-error">{error}</div>}
    </>
  );
}

function PurchasesPage({ data, date, persist, error, isAdmin }) {
  const [activeStore, setActiveStore] = useState(null);
  const [newStore, setNewStore] = useState("");
  const [showStoreForm, setShowStoreForm] = useState(false);

  const dayEntries = data.purchaseEntries[date] || {};
  const dayLocks = data.purchaseLocks[date] || {};

  const total = data.stores.reduce(
    (sum, store) =>
      sum +
      (dayEntries[store] || []).reduce(
        (s, item) => s + safeParse(item.qty) * safeParse(item.unitPrice),
        0
      ),
    0
  );

  function addStore() {
    const name = newStore.trim();
    if (!name || data.stores.includes(name)) return;

    persist({
      ...data,
      stores: [...data.stores, name],
    });

    setNewStore("");
    setShowStoreForm(false);
  }

  function removeStore(name) {
    const entries = { ...dayEntries };
    const locks = { ...dayLocks };
    delete entries[name];
    delete locks[name];

    persist({
      ...data,
      stores: data.stores.filter((x) => x !== name),
      purchaseEntries: {
        ...data.purchaseEntries,
        [date]: entries,
      },
      purchaseLocks: {
        ...data.purchaseLocks,
        [date]: locks,
      },
    });

    setActiveStore(null);
  }

  if (activeStore) {
    return (
      <PurchaseStore
        store={activeStore}
        date={date}
        data={data}
        persist={persist}
        error={error}
        isAdmin={isAdmin}
        onBack={() => setActiveStore(null)}
        onRemoveStore={() => removeStore(activeStore)}
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="OPERASYON / ALIŞ"
        title="Alış ve Tedarik"
        description="Market, tedarikçi ve günlük işletme alışlarını takip edin."
        actions={<DateControl date={date} setDate={() => {}} />}
      />

      <div className="summary-strip purchase-summary">
        <div>
          <span>Günün toplam alış</span>
          <strong>{formatTL(total)}</strong>
        </div>
        <div>
          <span>Aktif nokta</span>
          <strong>{data.stores.length}</strong>
        </div>
        <div>
          <span>Onaylı kayıt</span>
          <strong>
            {data.stores.filter((s) => dayLocks[s]).length}
          </strong>
        </div>
      </div>

      <section className="panel">
        <PanelHeader
          title="Tedarik Noktaları"
          subtitle={`${dateLabel(date)} alış kayıtları`}
          action={
            isAdmin && (
              showStoreForm ? (
                <div className="inline-form">
                  <input
                    autoFocus
                    value={newStore}
                    onChange={(e) => setNewStore(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addStore()}
                    placeholder="Mağaza adı"
                  />
                  <button className="primary-button" onClick={addStore}>
                    Ekle
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => setShowStoreForm(false)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  className="secondary-button"
                  onClick={() => setShowStoreForm(true)}
                >
                  <Plus size={14} /> Yeni Nokta
                </button>
              )
            )
          }
        />

        <div className="store-grid">
          {data.stores.map((store) => {
            const items = dayEntries[store] || [];
            const storeTotal = items.reduce(
              (s, item) =>
                s +
                safeParse(item.qty) * safeParse(item.unitPrice),
              0
            );
            const locked = !!dayLocks[store];

            return (
              <button
                className="store-card"
                key={store}
                onClick={() => setActiveStore(store)}
              >
                <div className="store-card-top">
                  <div className="store-icon">
                    <Store size={19} />
                  </div>
                  <div className="store-card-title">
                    <b>{store}</b>
                    <span>
                      {locked ? "Kayıt onaylandı" : `${items.length} kalem`}
                    </span>
                  </div>
                  {locked && <Lock size={14} />}
                </div>

                <div className="store-card-bottom">
                  <span>Günlük toplam</span>
                  <strong>{formatTL(storeTotal)}</strong>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

function PurchaseStore({
  store,
  date,
  data,
  persist,
  error,
  isAdmin,
  onBack,
  onRemoveStore,
}) {
  const [form, setForm] = useState({
    product: "",
    qty: "1",
    unitPrice: "",
  });
  const [checked, setChecked] = useState(false);

  const items = data.purchaseEntries[date]?.[store] || [];
  const locked = !!data.purchaseLocks[date]?.[store];
  const readOnly = locked && !isAdmin;

  const total = items.reduce(
    (s, item) =>
      s + safeParse(item.qty) * safeParse(item.unitPrice),
    0
  );

  function addItem(e) {
    e.preventDefault();

    const product = form.product.trim();
    const qty = safeParse(form.qty);
    const price = safeParse(form.unitPrice);

    if (!product || qty <= 0 || price < 0) return;

    const nextItems = [
      ...items,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        product,
        qty,
        unitPrice: price,
      },
    ];

    persist({
      ...data,
      purchaseEntries: {
        ...data.purchaseEntries,
        [date]: {
          ...(data.purchaseEntries[date] || {}),
          [store]: nextItems,
        },
      },
    });

    setForm({
      product: "",
      qty: "1",
      unitPrice: "",
    });
  }

  function removeItem(id) {
    const nextItems = items.filter((item) => item.id !== id);

    persist({
      ...data,
      purchaseEntries: {
        ...data.purchaseEntries,
        [date]: {
          ...(data.purchaseEntries[date] || {}),
          [store]: nextItems,
        },
      },
    });
  }

  function lockStore() {
    if (!checked) return;

    persist({
      ...data,
      purchaseLocks: {
        ...data.purchaseLocks,
        [date]: {
          ...(data.purchaseLocks[date] || {}),
          [store]: true,
        },
      },
    });

    setChecked(false);
  }

  function unlockStore() {
    persist({
      ...data,
      purchaseLocks: {
        ...data.purchaseLocks,
        [date]: {
          ...(data.purchaseLocks[date] || {}),
          [store]: false,
        },
      },
    });
  }

  return (
    <>
      <button className="back-button" onClick={onBack}>
        <ChevronLeft size={16} /> Tedarik noktalarına dön
      </button>

      <PageHeader
        eyebrow="ALIŞ KAYDI"
        title={store}
        description={`${dateLabel(date)} · ${items.length} alış kalemi`}
        actions={
          isAdmin && (
            <button className="danger-button" onClick={onRemoveStore}>
              <Trash2 size={14} /> Noktayı Sil
            </button>
          )
        }
      />

      {locked && (
        <div className="notice locked">
          <Lock size={16} />
          Bu tedarik kaydı onaylandı.
          {isAdmin && (
            <button onClick={unlockStore}>
              Kilidi kaldır
            </button>
          )}
        </div>
      )}

      {!readOnly && (
        <form className="entry-form panel" onSubmit={addItem}>
          <PanelHeader
            title="Yeni Alış Kalemi"
            subtitle="Ürün, miktar ve birim fiyat girin"
          />

          <div className="form-grid three">
            <Field label="Ürün">
              <input
                value={form.product}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    product: e.target.value,
                  }))
                }
                placeholder="Örn. Un"
              />
            </Field>

            <Field label="Miktar">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.qty}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    qty: e.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Birim fiyat">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    unitPrice: e.target.value,
                  }))
                }
                placeholder="0,00"
              />
            </Field>
          </div>

          <button className="primary-button wide" type="submit">
            <Plus size={15} /> Alış Kalemi Ekle
          </button>
        </form>
      )}

      <section className="panel">
        <PanelHeader
          title="Alış Kalemleri"
          subtitle={`${items.length} kayıt`}
        />

        {items.length ? (
          <div className="purchase-list">
            {items.map((item) => (
              <div className="purchase-row" key={item.id}>
                <div>
                  <b>{item.product}</b>
                  <span>
                    {item.qty} × {formatTL(item.unitPrice)}
                  </span>
                </div>
                <strong>
                  {formatTL(item.qty * item.unitPrice)}
                </strong>
                {isAdmin && (
                  <button
                    className="delete-button"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Bu tedarik noktası için henüz alış kaydı yok." />
        )}

        <div className="total-footer">
          <span>{store} toplamı</span>
          <strong>{formatTL(total)}</strong>
        </div>
      </section>

      {!readOnly && !isAdmin && items.length > 0 && (
        <div className="approval-box">
          <label>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            Bu kayıtları kontrol ettim ve onaylıyorum. Onaydan sonra kayıt
            değiştirilemez.
          </label>
          <button
            className="primary-button wide"
            disabled={!checked}
            onClick={lockStore}
          >
            <CheckCircle2 size={16} /> Kaydet ve Onayla
          </button>
        </div>
      )}

      {error && <div className="form-error">{error}</div>}
    </>
  );
}

function CostsPage({ data, persist, error }) {
  const costs = data.costs || {};

  function update(product, field, value) {
    persist({
      ...data,
      costs: {
        ...costs,
        [product]: {
          ...(costs[product] || {}),
          [field]: value,
        },
      },
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="FİNANS / MALİYET"
        title="Ürün Maliyetleri"
        description="Birim maliyet ve satış fiyatlarından ürün bazlı brüt marjı yönetin."
      />

      <div className="notice info">
        <Percent size={16} />
        Kâr marjı otomatik olarak satış fiyatı üzerinden hesaplanır.
      </div>

      <section className="panel table-panel">
        <PanelHeader
          title="Ürün Maliyet Tablosu"
          subtitle={`${SALE_PRODUCTS.length} ürün`}
        />

        <div className="table-scroll">
          <table className="business-table">
            <thead>
              <tr>
                <th>Ürün</th>
                <th className="numeric">Birim Maliyet</th>
                <th className="numeric">Satış Fiyatı</th>
                <th className="numeric">Brüt Kâr</th>
                <th className="numeric">Marj</th>
              </tr>
            </thead>
            <tbody>
              {SALE_PRODUCTS.map((product) => {
                const c = costs[product] || {};
                const cost = safeParse(c.cost);
                const price = safeParse(c.price);
                const margin = price - cost;
                const pct = price ? (margin / price) * 100 : 0;

                return (
                  <tr key={product}>
                    <td>{product}</td>
                    <td>
                      <input
                        className="table-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={c.cost ?? ""}
                        onChange={(e) =>
                          update(product, "cost", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="table-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={c.price ?? ""}
                        onChange={(e) =>
                          update(product, "price", e.target.value)
                        }
                      />
                    </td>
                    <td
                      className={`numeric strong ${
                        margin < 0 ? "negative" : "positive"
                      }`}
                    >
                      {formatTL(margin)}
                    </td>
                    <td
                      className={`numeric strong ${
                        pct < 0 ? "negative" : "positive"
                      }`}
                    >
                      %{pct.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {error && <div className="form-error">{error}</div>}
    </>
  );
}

function ProfitPage({ data }) {
  const [month, setMonth] = useState(thisMonthISO());
  const stats = useMemo(
    () => calculateMonthStats(data, month),
    [data, month]
  );

  const products = Object.entries(stats.perProduct)
    .filter(([, v]) => v.qty > 0)
    .sort((a, b) => b[1].revenue - a[1].revenue);

  return (
    <>
      <PageHeader
        eyebrow="FİNANS / RAPOR"
        title="Kâr ve Zarar"
        description="Satış, alış ve ürün maliyetlerini tek ekranda analiz edin."
        actions={
          <div className="date-control">
            <CalendarDays size={16} />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <span>{monthLabel(month)}</span>
          </div>
        }
      />

      <div className="profit-kpis">
        <KpiCard
          title="Toplam Satış"
          value={formatTL(stats.salesTotal)}
          meta={`${stats.totalUnits} adet`}
          icon={<TrendingUp size={19} />}
          tone="green"
        />
        <KpiCard
          title="Toplam Alış"
          value={formatTL(stats.purchaseTotal)}
          meta="Nakit çıkışı"
          icon={<TrendingDown size={19} />}
          tone="red"
        />
        <KpiCard
          title="Satış - Alış"
          value={formatTL(stats.nakitNet)}
          meta="Nakit bazlı net"
          icon={<CircleDollarSign size={19} />}
          tone={stats.nakitNet >= 0 ? "green" : "red"}
        />
        <KpiCard
          title="Ürün Maliyeti Sonrası"
          value={formatTL(stats.maliyetNet)}
          meta="Brüt kâr"
          icon={<BarChart3 size={19} />}
          tone={stats.maliyetNet >= 0 ? "green" : "red"}
        />
      </div>

      <section className="panel table-panel">
        <PanelHeader
          title="Ürün Performansı"
          subtitle={monthLabel(month)}
        />

        {products.length ? (
          <div className="table-scroll">
            <table className="business-table">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th className="numeric">Adet</th>
                  <th className="numeric">Ciro</th>
                  <th className="numeric">Maliyet</th>
                  <th className="numeric">Brüt Kâr</th>
                </tr>
              </thead>
              <tbody>
                {products.map(([name, value]) => {
                  const profit = value.revenue - value.cost;
                  return (
                    <tr key={name}>
                      <td><b>{name}</b></td>
                      <td className="numeric">{value.qty}</td>
                      <td className="numeric">
                        {formatTL(value.revenue)}
                      </td>
                      <td className="numeric">
                        {formatTL(value.cost)}
                      </td>
                      <td
                        className={`numeric strong ${
                          profit >= 0 ? "positive" : "negative"
                        }`}
                      >
                        {formatTL(profit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="Seçilen ay için satış verisi bulunmuyor." />
        )}
      </section>

      <div className="analysis-note">
        <FileText size={17} />
        <div>
          <b>Rapor nasıl okunmalı?</b>
          <p>
            “Satış - Alış” o ay işletmeden çıkan nakit ile satış gelirini
            karşılaştırır. “Ürün Maliyeti Sonrası” ise satış kayıtlarındaki
            ürün adetlerini Maliyetler sekmesindeki birim maliyetlerle
            eşleştirerek brüt kârı hesaplar.
          </p>
        </div>
      </div>
    </>
  );
}

function ManagementPage({ data, persist, error }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const [store, setStore] = useState("");

  const users = data.users || {};

  function createUser(e) {
    e.preventDefault();

    const username = form.username.trim();
    const password = form.password.trim();

    if (!username || !password) {
      setFormError("Kullanıcı adı ve şifre zorunludur.");
      return;
    }

    if (users[username]) {
      setFormError("Bu kullanıcı adı zaten kullanılıyor.");
      return;
    }

    persist({
      ...data,
      users: {
        ...users,
        [username]: {
          password,
          role: "user",
        },
      },
    });

    setForm({ username: "", password: "" });
    setFormError("");
  }

  function deleteUser(username) {
    const next = { ...users };
    delete next[username];

    persist({
      ...data,
      users: next,
    });
  }

  function addStore() {
    const name = store.trim();
    if (!name || data.stores.includes(name)) return;

    persist({
      ...data,
      stores: [...data.stores, name],
    });

    setStore("");
  }

  function deleteStore(name) {
    persist({
      ...data,
      stores: data.stores.filter((x) => x !== name),
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="YÖNETİM"
        title="İşletme Yönetimi"
        description="Kullanıcıları ve tedarik noktalarını yönetin."
      />

      <div className="management-grid">
        <section className="panel">
          <PanelHeader
            title="Yeni Kullanıcı"
            subtitle="Personel erişimi oluştur"
          />

          <form onSubmit={createUser}>
            <div className="form-grid">
              <Field label="Kullanıcı adı">
                <input
                  autoCapitalize="none"
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      username: e.target.value,
                    }))
                  }
                  placeholder="personel"
                />
              </Field>

              <Field label="Şifre">
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Şifre"
                />
              </Field>
            </div>

            {formError && (
              <div className="form-error">{formError}</div>
            )}

            <button className="primary-button wide" type="submit">
              <UserPlus size={15} /> Kullanıcı Oluştur
            </button>
          </form>

          <div className="user-list">
            {Object.entries(users).map(([username, user]) => (
              <div className="user-row" key={username}>
                <div className="user-avatar">
                  {username.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <b>{username}</b>
                  <span>
                    {user.role === "admin" ? "Yönetici" : "Personel"}
                  </span>
                </div>
                {user.role !== "admin" && (
                  <button
                    className="delete-button"
                    onClick={() => deleteUser(username)}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <PanelHeader
            title="Tedarik Noktaları"
            subtitle={`${data.stores.length} aktif nokta`}
          />

          <div className="inline-form full">
            <input
              value={store}
              onChange={(e) => setStore(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStore()}
              placeholder="Yeni mağaza / tedarikçi"
            />
            <button className="primary-button" onClick={addStore}>
              <Plus size={15} /> Ekle
            </button>
          </div>

          <div className="user-list">
            {data.stores.map((name) => (
              <div className="user-row" key={name}>
                <div className="store-icon small">
                  <Store size={16} />
                </div>
                <div>
                  <b>{name}</b>
                  <span>Aktif tedarik noktası</span>
                </div>
                <button
                  className="delete-button"
                  onClick={() => deleteStore(name)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="security-banner">
        <Lock size={18} />
        <div>
          <b>Yönetici yetkileri</b>
          <span>
            Yönetici hesabı satış, alış, maliyet, rapor ve kullanıcı
            yönetiminin tamamına erişebilir.
          </span>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
    </>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <ClipboardList size={22} />
      <span>{text}</span>
    </div>
  );
}

function calculateDaySales(data, date) {
  const rows = data.salesEntries[date] || {};
  return Object.values(rows).reduce(
    (sum, row) =>
      sum +
      safeParse(row.qty) * safeParse(row.unitPrice),
    0
  );
}

function calculateDayUnits(data, date) {
  const rows = data.salesEntries[date] || {};
  return Object.values(rows).reduce(
    (sum, row) => sum + safeParse(row.qty),
    0
  );
}

function calculateDayPurchases(data, date) {
  const stores = data.purchaseEntries[date] || {};
  return Object.values(stores).reduce(
    (sum, items) =>
      sum +
      (items || []).reduce(
        (s, item) =>
          s +
          safeParse(item.qty) * safeParse(item.unitPrice),
        0
      ),
    0
  );
}

function calculateMonthStats(data, month = thisMonthISO()) {
  let purchaseTotal = 0;
  let salesTotal = 0;
  let cogsTotal = 0;
  let totalUnits = 0;
  const perProduct = {};

  Object.entries(data.purchaseEntries || {}).forEach(
    ([date, stores]) => {
      if (!date.startsWith(month)) return;

      Object.values(stores || {}).forEach((items) => {
        (items || []).forEach((item) => {
          purchaseTotal +=
            safeParse(item.qty) * safeParse(item.unitPrice);
        });
      });
    }
  );

  Object.entries(data.salesEntries || {}).forEach(
    ([date, rows]) => {
      if (!date.startsWith(month)) return;

      Object.entries(rows || {}).forEach(
        ([product, row]) => {
          const qty = safeParse(row.qty);
          const price = safeParse(row.unitPrice);
          const revenue = qty * price;
          const unitCost = safeParse(
            data.costs?.[product]?.cost
          );
          const cost = qty * unitCost;

          salesTotal += revenue;
          cogsTotal += cost;
          totalUnits += qty;

          if (!perProduct[product]) {
            perProduct[product] = {
              qty: 0,
              revenue: 0,
              cost: 0,
            };
          }

          perProduct[product].qty += qty;
          perProduct[product].revenue += revenue;
          perProduct[product].cost += cost;
        }
      );
    }
  );

  return {
    purchaseTotal,
    salesTotal,
    cogsTotal,
    totalUnits,
    nakitNet: salesTotal - purchaseTotal,
    maliyetNet: salesTotal - cogsTotal,
    perProduct,
  };
}

const CSS = `
*{box-sizing:border-box}
:root{
  --bg:#f4f5f3;
  --panel:#fff;
  --text:#1d211e;
  --muted:#737872;
  --line:#e3e7e2;
  --dark:#1d211e;
  --green:#176b4a;
  --green-soft:#e9f5ef;
  --red:#b44732;
  --red-soft:#faece8;
  --yellow:#9a7621;
  --yellow-soft:#fbf5df;
  --shadow:0 8px 30px rgba(26,32,28,.05);
}
body{
  margin:0;
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:var(--bg);
  color:var(--text);
}
button,input{font:inherit}
button{cursor:pointer}
.mano-app{min-height:100vh;background:var(--bg)}
.topbar{
  height:72px;
  background:#fff;
  border-bottom:1px solid var(--line);
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 28px;
  position:sticky;
  top:0;
  z-index:20;
}
.brand{display:flex;align-items:center;gap:11px}
.brand-mark,.login-logo,.loading-logo{
  display:flex;align-items:center;justify-content:center;
  background:#b44732;color:#fff;
}
.brand-mark{width:38px;height:38px;border-radius:10px}
.brand strong{display:block;font-size:15px;letter-spacing:-.02em}
.brand span{display:block;font-size:11px;color:var(--muted);margin-top:2px}
.topbar-actions{display:flex;align-items:center;gap:14px}
.online-dot{font-size:11px;color:#5d655f;display:flex;gap:6px;align-items:center}
.online-dot span{width:7px;height:7px;border-radius:50%;background:#32a46e}
.user-pill{display:flex;align-items:center;gap:8px}
.avatar,.user-avatar{
  width:32px;height:32px;border-radius:50%;
  background:#edf1ed;display:flex;align-items:center;justify-content:center;
  font-size:12px;font-weight:700;color:#33523f;
}
.user-pill b{font-size:12px;display:block}
.user-pill small{font-size:10px;color:var(--muted);display:block}
.icon-button{
  border:1px solid var(--line);background:#fff;color:#5f665f;
  width:34px;height:34px;border-radius:8px;display:flex;
  align-items:center;justify-content:center;
}
.mobile-menu{display:none;border:0;background:none}
.app-layout{display:flex;min-height:calc(100vh - 72px)}
.sidebar{
  width:232px;flex:0 0 232px;background:#fff;border-right:1px solid var(--line);
  padding:25px 14px;display:flex;flex-direction:column;
}
.nav-section{margin-bottom:26px}
.nav-title{font-size:9px;letter-spacing:.12em;color:#9a9f9b;font-weight:800;padding:0 12px 9px;display:block}
.nav-item{
  width:100%;border:0;background:transparent;color:#687069;
  display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;
  text-align:left;font-size:13px;margin-bottom:2px;position:relative;
}
.nav-item:hover{background:#f3f5f3;color:#242a26}
.nav-item.active{background:#edf5f0;color:#145f42;font-weight:700}
.nav-item i{position:absolute;right:0;width:3px;height:20px;border-radius:3px;background:#1d7653}
.sidebar-bottom{margin-top:auto}
.secure-card{
  border:1px solid var(--line);border-radius:10px;padding:11px;
  display:flex;gap:8px;color:#6c736d;background:#fafbfa
}
.secure-card b{font-size:11px;display:block}
.secure-card span{font-size:9px;color:#929892;display:block;margin-top:2px}
.main-content{flex:1;min-width:0}
.content-wrap{max-width:1320px;margin:0 auto;padding:34px 34px 70px}
.page-header{
  display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:25px
}
.eyebrow{font-size:10px;color:#7e867f;font-weight:800;letter-spacing:.11em;margin-bottom:7px}
.page-header h1{font-size:28px;letter-spacing:-.035em;margin:0 0 6px}
.page-header p{font-size:13px;color:var(--muted);margin:0}
.page-actions{display:flex;align-items:center;gap:8px}
.date-control{
  display:flex;align-items:center;gap:8px;border:1px solid var(--line);
  background:#fff;border-radius:9px;padding:9px 11px;color:#666e67;min-width:300px;
}
.date-control input{border:0;outline:0;background:transparent;color:#1f2521;font-size:12px}
.date-control span{font-size:11px;color:#8a908b;margin-left:auto;white-space:nowrap}
.dashboard-date-mobile{display:none}
.kpi-grid,.profit-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-bottom:18px}
.kpi-card{
  border:1px solid var(--line);background:#fff;border-radius:12px;padding:16px;
  min-height:126px;box-shadow:var(--shadow)
}
.kpi-top{display:flex;justify-content:space-between;align-items:center;color:#717872;font-size:11px}
.kpi-icon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center}
.kpi-card.green .kpi-icon{background:var(--green-soft);color:var(--green)}
.kpi-card.red .kpi-icon{background:var(--red-soft);color:var(--red)}
.kpi-card.dark .kpi-icon{background:#eef0ee;color:#252a26}
.kpi-card strong{display:block;font-size:23px;letter-spacing:-.03em;margin:18px 0 5px}
.kpi-card small{color:#8a918b;font-size:10px}
.dashboard-grid{display:grid;grid-template-columns:1.45fr 1fr;gap:15px;margin-bottom:15px}
.dashboard-grid.lower{grid-template-columns:1.45fr 1fr}
.panel{
  background:#fff;border:1px solid var(--line);border-radius:12px;
  box-shadow:var(--shadow);padding:18px
}
.panel-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:15px}
.panel-header h3{margin:0;font-size:14px;letter-spacing:-.01em}
.panel-header span{display:block;font-size:10px;color:#949a95;margin-top:4px}
.chart-panel{min-height:290px}
.mini-chart{height:205px;display:flex;flex-direction:column;justify-content:flex-end}
.chart-bars{
  height:170px;display:flex;align-items:flex-end;justify-content:space-around;
  border-bottom:1px solid #edf0ed;padding:0 20px
}
.bar-group{height:100%;display:flex;align-items:flex-end;gap:5px}
.bar{width:12px;border-radius:4px 4px 0 0;display:block}
.sales-bar{background:#1f7653}
.purchase-bar{background:#d3d8d4}
.chart-legend{display:flex;gap:15px;padding:10px 2px 0;color:#777f79;font-size:10px}
.chart-legend span{display:flex;align-items:center;gap:5px}
.chart-legend i{width:8px;height:8px;border-radius:2px}
.legend-sales{background:#1f7653}
.legend-purchase{background:#d3d8d4}
.quick-action{
  width:100%;display:flex;align-items:center;gap:11px;border:1px solid #edf0ed;
  background:#fbfcfb;border-radius:9px;padding:11px;margin-bottom:8px;text-align:left;color:#1e251f
}
.quick-action:hover{border-color:#d5ded8;background:#f6faf7}
.quick-icon{width:32px;height:32px;border-radius:8px;background:#edf5f0;color:#176b4a;display:flex;align-items:center;justify-content:center}
.quick-action div:nth-child(2){flex:1}
.quick-action b{font-size:12px;display:block}
.quick-action span{font-size:10px;color:#929892;display:block;margin-top:2px}
.quick-action>svg{color:#a2a8a3}
.product-list,.user-list,.purchase-list{display:flex;flex-direction:column}
.product-row,.user-row,.purchase-row{
  display:flex;align-items:center;gap:11px;padding:11px 0;border-top:1px solid #eef0ee
}
.product-row:first-child,.user-row:first-child,.purchase-row:first-child{border-top:0}
.product-rank{width:25px;height:25px;border-radius:7px;background:#f0f3f0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#6e756f}
.product-name{flex:1}.product-name b{font-size:12px;display:block}.product-name small{font-size:10px;color:#929892}
.product-revenue{font-size:12px;font-weight:700}
.status-row{display:flex;align-items:center;gap:10px;padding:13px 0;border-top:1px solid #eef0ee}
.status-row:first-of-type{border-top:0}
.status-icon{width:30px;height:30px;border-radius:8px;background:#f0f3f0;display:flex;align-items:center;justify-content:center;color:#66706a}
.status-row>div:nth-child(2){flex:1}.status-row b{display:block;font-size:12px}.status-row span{display:block;font-size:10px;color:#929892;margin-top:3px}
.status-row em{font-style:normal;font-size:9px;color:#1b7652;background:#edf6f0;padding:4px 7px;border-radius:20px}
.summary-strip{
  background:#20251f;color:#fff;border-radius:12px;padding:15px 18px;display:grid;
  grid-template-columns:1.4fr 1fr 1fr 1fr;gap:15px;margin-bottom:15px
}
.summary-strip>div{border-right:1px solid rgba(255,255,255,.1);padding-right:15px}
.summary-strip>div:last-child{border:0}
.summary-strip span{font-size:10px;color:#aeb5ae;display:block;margin-bottom:5px}
.summary-strip strong{font-size:19px;letter-spacing:-.02em}
.summary-status{display:flex;align-items:center;justify-content:flex-end;gap:6px;font-size:11px!important;color:#d8ded9!important}
.table-panel{padding:0;overflow:hidden}
.table-panel .panel-header{padding:18px 18px 0}
.table-scroll{overflow-x:auto}
.business-table{width:100%;border-collapse:collapse;min-width:650px}
.business-table th{
  background:#f5f7f5;color:#7c847e;text-align:left;font-size:10px;
  padding:10px 18px;font-weight:800;border-top:1px solid var(--line);border-bottom:1px solid var(--line)
}
.business-table td{padding:9px 18px;border-bottom:1px solid #edf0ed;font-size:12px}
.business-table tbody tr:hover{background:#fafcfb}
.business-table tfoot td{background:#f4f6f4;font-weight:800;border-bottom:0}
.numeric{text-align:right}
.strong{font-weight:700}
.positive{color:#176b4a}.negative{color:#b44732}
.table-input{
  width:100%;min-width:95px;border:1px solid #dfe4df;background:#fafbfa;
  border-radius:6px;padding:7px 8px;text-align:right;font-size:11px;outline:none
}
.table-input:focus{border-color:#83a995;background:#fff}
.table-input:disabled{background:#f0f1ef;opacity:.65}
.table-product{display:flex;align-items:center;gap:8px;font-weight:600}
.mini-pizza{width:24px;height:24px;border-radius:6px;background:#fff1ed;color:#b44732;display:flex;align-items:center;justify-content:center}
.secondary-button,.primary-button,.danger-button{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:7px;
  padding:8px 11px;font-size:11px;font-weight:700;border:1px solid var(--line)
}
.secondary-button{background:#fff;color:#3f4841}
.primary-button{background:#20251f;color:#fff;border-color:#20251f}
.primary-button:disabled{opacity:.4;cursor:not-allowed}
.danger-button{background:#fff7f5;color:#b44732;border-color:#f0d7d1}
.wide{width:100%;margin-top:12px}
.notice{
  display:flex;align-items:center;gap:8px;border-radius:9px;padding:11px 13px;
  font-size:11px;margin-bottom:14px
}
.notice.locked{background:#f5f0e7;color:#74633a;border:1px solid #e7dcc2}
.notice.info{background:#edf5f0;color:#21654a;border:1px solid #dbece2}
.notice button{margin-left:auto;border:0;background:none;color:#176b4a;font-weight:700;font-size:11px}
.back-button{border:0;background:none;color:#747c76;padding:0;margin-bottom:14px;font-size:11px;display:flex;align-items:center;gap:4px}
.entry-form{margin-bottom:15px}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.form-grid.three{grid-template-columns:2fr 1fr 1fr}
.field span{font-size:10px;color:#747c76;display:block;margin-bottom:5px;font-weight:700}
.field input,.inline-form input{
  width:100%;border:1px solid #dfe4df;background:#fbfcfb;border-radius:7px;
  padding:9px 10px;outline:0;font-size:12px;color:#222822
}
.field input:focus,.inline-form input:focus{border-color:#86a995;background:#fff}
.purchase-row>div:first-child{flex:1}.purchase-row b{display:block;font-size:12px}.purchase-row span{display:block;font-size:10px;color:#8d958f;margin-top:3px}
.purchase-row>strong{font-size:12px}
.delete-button{border:0;background:none;color:#a3aaa4;padding:5px}
.total-footer{margin-top:13px;padding-top:13px;border-top:1px solid var(--line);display:flex;justify-content:space-between;font-size:12px}
.total-footer strong{font-size:16px}
.approval-box{background:#fff9e9;border:1px solid #eadfbf;border-radius:10px;padding:13px;margin-top:13px}
.approval-box label{display:flex;gap:7px;font-size:11px;color:#77682f;line-height:1.5}
.approval-box input{margin-top:2px}
.store-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.store-card{
  border:1px solid var(--line);background:#fbfcfb;border-radius:10px;padding:14px;
  text-align:left;color:#20251f
}
.store-card:hover{border-color:#c9d7ce;background:#f8fbf9}
.store-card-top{display:flex;align-items:center;gap:10px}
.store-icon{
  width:36px;height:36px;border-radius:9px;background:#eaf4ee;color:#176b4a;
  display:flex;align-items:center;justify-content:center;flex:0 0 auto
}
.store-icon.small{width:32px;height:32px}
.store-card-title{flex:1}.store-card-title b{display:block;font-size:12px}.store-card-title span{display:block;font-size:9px;color:#8f9690;margin-top:3px}
.store-card-bottom{display:flex;justify-content:space-between;align-items:end;border-top:1px solid #e9ede9;margin-top:13px;padding-top:11px}
.store-card-bottom span{font-size:9px;color:#929892}.store-card-bottom strong{font-size:13px}
.inline-form{display:flex;gap:6px;align-items:center}.inline-form input{width:180px}.inline-form.full input{flex:1;width:auto}
.profit-kpis{margin-bottom:18px}
.analysis-note,.security-banner{
  display:flex;gap:10px;padding:13px 15px;border:1px solid #dfe6e0;
  background:#f2f7f3;border-radius:10px;color:#276149;margin-top:14px
}
.analysis-note b,.security-banner b{font-size:11px;display:block}
.analysis-note p,.security-banner span{font-size:10px;color:#708078;line-height:1.55;margin:4px 0 0;display:block}
.management-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}
.user-row .user-avatar{flex:0 0 auto}
.user-row>div:nth-child(2){flex:1}.user-row b{font-size:12px;display:block}.user-row span{font-size:10px;color:#929892;display:block;margin-top:3px}
.security-banner{margin-top:15px}
.form-error{font-size:11px;color:#b44732;background:#fff1ed;border:1px solid #f0d7d1;border-radius:7px;padding:8px 10px;margin:9px 0}
.bottom-error{margin-top:12px}
.empty-state{min-height:130px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:7px;color:#9aa09b;font-size:11px}
.login-screen{
  min-height:100vh;background:#1d211e;display:flex;align-items:center;justify-content:center;
  padding:25px;position:relative;overflow:hidden
}
.login-decoration{
  position:absolute;width:600px;height:600px;border-radius:50%;
  border:1px solid rgba(255,255,255,.05);top:-300px;right:-180px
}
.login-card{width:100%;max-width:360px;text-align:center;position:relative}
.login-logo{width:64px;height:64px;border-radius:17px;margin:0 auto 17px;box-shadow:0 14px 35px rgba(180,71,50,.25)}
.login-card h1{color:#fff;font-size:27px;letter-spacing:-.03em;margin:0}
.login-card>p{color:#939b95;font-size:12px;margin:6px 0 27px}
.login-card form{background:#272c28;border:1px solid #353b36;border-radius:13px;padding:18px;text-align:left}
.login-card label{font-size:10px;color:#aeb5af;display:block;margin:0 0 5px;font-weight:700}
.login-card input{
  width:100%;border:1px solid #3b423d;background:#202520;color:#fff;
  border-radius:8px;padding:11px;font-size:13px;outline:0;margin-bottom:12px
}
.login-card input:focus{border-color:#6e987f}
.login-button{width:100%;border:0;border-radius:8px;background:#f4f5f3;color:#1d211e;padding:11px;font-weight:800;font-size:13px;margin-top:5px}
.login-footer{color:#69716b;font-size:10px;margin-top:17px;display:flex;align-items:center;justify-content:center;gap:5px}
.loading-screen{min-height:100vh;background:#1d211e;color:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:7px}
.loading-logo{width:58px;height:58px;border-radius:15px;margin-bottom:5px}
.loading-screen strong{font-size:18px}.loading-screen span{font-size:11px;color:#89918b}
.mobile-overlay{display:none}
@media(max-width:1050px){
  .sidebar{width:205px;flex-basis:205px}
  .content-wrap{padding:28px 22px 60px}
  .kpi-grid,.profit-kpis{grid-template-columns:repeat(2,1fr)}
  .store-grid{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:800px){
  .topbar{padding:0 16px}
  .mobile-menu{display:flex;align-items:center;justify-content:center;color:#626a64}
  .sidebar{position:fixed;left:-245px;top:72px;bottom:0;z-index:30;transition:left .2s;width:230px;box-shadow:10px 0 30px rgba(0,0,0,.08)}
  .sidebar.open{left:0}
  .mobile-overlay{display:block;position:fixed;inset:72px 0 0;background:rgba(20,25,21,.2);z-index:25}
  .content-wrap{padding:22px 14px 50px}
  .page-header{align-items:flex-start;flex-direction:column}
  .page-actions{width:100%}.page-actions .date-control{width:100%}
  .date-control{min-width:0;width:100%}
  .dashboard-date-mobile{display:block;margin-bottom:14px}
  .dashboard-date-mobile .date-control{display:flex}
  .dashboard-grid,.dashboard-grid.lower,.management-grid{grid-template-columns:1fr}
  .summary-strip{grid-template-columns:1fr 1fr}
  .summary-strip>div:nth-child(2){border-right:0}
  .summary-strip>div:nth-child(3),.summary-strip>div:nth-child(4){border-top:1px solid rgba(255,255,255,.1);padding-top:11px}
  .store-grid{grid-template-columns:1fr}
  .form-grid.three{grid-template-columns:1fr}
  .topbar .online-dot{display:none}
}
@media(max-width:520px){
  .brand span{display:none}
  .user-pill>div:last-child{display:none}
  .kpi-grid,.profit-kpis{grid-template-columns:1fr 1fr}
  .kpi-card{min-height:115px;padding:13px}.kpi-card strong{font-size:18px;margin-top:15px}
  .page-header h1{font-size:24px}
  .summary-strip{grid-template-columns:1fr 1fr}
  .summary-strip strong{font-size:16px}
  .inline-form{flex-wrap:wrap}.inline-form input{width:100%}.inline-form.full{flex-wrap:nowrap}
  .table-panel .panel-header{align-items:flex-start}
  .table-panel .panel-header .secondary-button{white-space:nowrap}
}
`;

export { formatTL, calculateMonthStats, SALE_PRODUCTS };
