import { useEffect, useMemo, useState } from 'react';
import { CarFront, Gauge, Wrench, BellRing, Wallet, Plus, LogOut, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import api from './api';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const today = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('vehicle_tracker_token') || '');
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [vehicles, setVehicles] = useState([]);
  const [selected, setSelected] = useState('');
  const [services, setServices] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [dashboard, setDashboard] = useState({ vehicleCount: 0, serviceCount: 0, totalSpent: 0, upcomingReminderCount: 0 });
  const [vehicleForm, setVehicleForm] = useState({ registrationNumber: '', brand: '', model: '', year: new Date().getFullYear(), currentMileage: 0, fuelType: 'Petrol' });
  const [serviceForm, setServiceForm] = useState({ serviceDate: today(), mileage: '', serviceType: 'General service', serviceCenter: '', cost: '', notes: '' });
  const [reminderForm, setReminderForm] = useState({ title: '', dueDate: '', dueMileage: '' });
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedVehicle = useMemo(() => vehicles.find(v => v._id === selected), [vehicles, selected]);

  async function loadData(vehicleId = selected) {
    const [dashRes, vehiclesRes] = await Promise.all([api.get('/dashboard'), api.get('/vehicles')]);
    setDashboard(dashRes.data);
    setVehicles(vehiclesRes.data);
    const id = vehicleId || vehiclesRes.data[0]?._id || '';
    setSelected(id);
    if (id) {
      const [serviceRes, reminderRes] = await Promise.all([
        api.get(`/services/vehicle/${id}`), api.get(`/reminders/vehicle/${id}`)
      ]);
      setServices(serviceRes.data);
      setReminders(reminderRes.data);
    } else {
      setServices([]);
      setReminders([]);
    }
  }

  useEffect(() => {
    if (!token) return;
    api.get('/auth/me').then(r => setUser(r.data.user)).then(() => loadData()).catch(() => logout());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleAuth(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, authForm);
      localStorage.setItem('vehicle_tracker_token', data.token);
      setUser(data.user); setToken(data.token); setNotice('Welcome to VehicleCare.');
    } catch (err) { setError(err.response?.data?.message || 'Could not connect to the server.'); }
    finally { setBusy(false); }
  }

  function logout() {
    localStorage.removeItem('vehicle_tracker_token');
    setToken(''); setUser(null); setVehicles([]); setServices([]); setReminders([]);
  }

  async function runAction(action, successMessage) {
    setError(''); setNotice('');
    try { await action(); await loadData(selected); setNotice(successMessage); }
    catch (err) { setError(err.response?.data?.message || 'Action failed. Please check your input and try again.'); }
  }

  async function addVehicle(e) {
    e.preventDefault();
    await runAction(async () => {
      const { data } = await api.post('/vehicles', { ...vehicleForm, year: Number(vehicleForm.year), currentMileage: Number(vehicleForm.currentMileage) });
      setSelected(data._id);
      setVehicleForm({ registrationNumber: '', brand: '', model: '', year: new Date().getFullYear(), currentMileage: 0, fuelType: 'Petrol' });
      await loadData(data._id);
    }, 'Vehicle added successfully.');
  }

  async function deleteVehicle(id) {
    if (!window.confirm('Delete this vehicle and its service/reminder records?')) return;
    await runAction(() => api.delete(`/vehicles/${id}`), 'Vehicle deleted.');
  }

  async function addService(e) {
    e.preventDefault();
    if (!selected) return setError('Add a vehicle first.');
    await runAction(async () => {
      await api.post(`/services/vehicle/${selected}`, { ...serviceForm, mileage: Number(serviceForm.mileage), cost: Number(serviceForm.cost) });
      setServiceForm({ serviceDate: today(), mileage: '', serviceType: 'General service', serviceCenter: '', cost: '', notes: '' });
    }, 'Service record saved.');
  }

  async function addReminder(e) {
    e.preventDefault();
    if (!selected) return setError('Add a vehicle first.');
    await runAction(async () => {
      await api.post(`/reminders/vehicle/${selected}`, { title: reminderForm.title, dueDate: reminderForm.dueDate || null, dueMileage: reminderForm.dueMileage === '' ? null : Number(reminderForm.dueMileage) });
      setReminderForm({ title: '', dueDate: '', dueMileage: '' });
    }, 'Reminder created.');
  }

  async function completeReminder(id) {
    await runAction(() => api.put(`/reminders/${id}`, { status: 'Completed' }), 'Reminder marked completed.');
  }

  if (!token) return <main className="auth-shell">
    <section className="auth-brand"><div className="brand-mark"><CarFront size={30}/></div><p className="eyebrow">YOUR CAR, IN GOOD HANDS</p><h1>Every journey starts with a well-kept vehicle.</h1><p className="muted">Track service history, keep maintenance on schedule, and understand your vehicle expenses in one place.</p><div className="auth-feature"><CheckCircle2/> Service records in one place</div><div className="auth-feature"><CheckCircle2/> Maintenance reminders</div><div className="auth-feature"><CheckCircle2/> Clear cost overview</div></section>
    <section className="auth-panel"><div className="auth-card"><div className="brand-mark small"><CarFront/></div><h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p className="muted">{mode === 'login' ? 'Sign in to manage your vehicles.' : 'Start keeping your vehicle records organized.'}</p>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={handleAuth} className="form-stack">
        {mode === 'register' && <Field label="Full name"><input required value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Your name"/></Field>}
        <Field label="Email address"><input required type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@example.com"/></Field>
        <Field label="Password"><input required minLength="8" type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="At least 8 characters"/></Field>
        <button className="primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form><p className="switch-auth">{mode === 'login' ? 'New to VehicleCare?' : 'Already have an account?'} <button className="text-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create account' : 'Sign in'}</button></p>
    </div></section>
  </main>;

  const nav = [
    { id: 'overview', label: 'Overview', icon: Gauge },
    { id: 'vehicles', label: 'My vehicles', icon: CarFront },
    { id: 'services', label: 'Service history', icon: Wrench },
    { id: 'reminders', label: 'Reminders', icon: BellRing }
  ];

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><CarFront/></div><span>Vehicle<span className="brand-accent">Care</span></span></div><p className="side-label">WORKSPACE</p><nav>{nav.map(n => <button key={n.id} className={`nav-item ${activeTab === n.id ? 'active' : ''}`} onClick={() => setActiveTab(n.id)}><n.icon size={18}/>{n.label}</button>)}</nav><div className="sidebar-bottom"><div className="profile"><div className="avatar">{(user?.name || 'U').slice(0,1).toUpperCase()}</div><div className="profile-text"><strong>{user?.name || 'User'}</strong><span>{user?.email}</span></div></div><button className="nav-item logout" onClick={logout}><LogOut size={18}/> Sign out</button></div></aside>
    <main className="main-content"><header className="topbar"><div><p className="eyebrow">VEHICLE MANAGEMENT</p><h1>{nav.find(n => n.id === activeTab)?.label || 'Overview'}</h1></div><div className="topbar-right"><span className="status-dot"/> All systems ready <button className="icon-button" title="Refresh data" onClick={() => loadData()}><RefreshCw size={17}/></button></div></header>
      {error && <div className="alert error">{error}<button onClick={() => setError('')}>×</button></div>}{notice && <div className="alert success">{notice}<button onClick={() => setNotice('')}>×</button></div>}
      {activeTab === 'overview' && <><div className="welcome-row"><div><h2>Good to see you, {user?.name?.split(' ')[0] || 'there'}.</h2><p className="muted">Here is your vehicle maintenance snapshot.</p></div><button className="primary" onClick={() => setActiveTab('vehicles')}><Plus size={17}/> Add vehicle</button></div>
        <div className="stats-grid"><Stat icon={CarFront} label="Vehicles tracked" value={dashboard.vehicleCount}/><Stat icon={Wrench} label="Service records" value={dashboard.serviceCount}/><Stat icon={Wallet} label="Total service spend" value={money(dashboard.totalSpent)}/><Stat icon={BellRing} label="Upcoming reminders" value={dashboard.upcomingReminderCount}/></div>
        <div className="content-grid"><section className="panel wide"><div className="panel-heading"><div><h3>Your vehicles</h3><p className="muted">Your registered vehicles at a glance</p></div><button className="link-button" onClick={() => setActiveTab('vehicles')}>View all</button></div>
          {vehicles.length ? <div className="vehicle-list">{vehicles.slice(0,3).map(v => <VehicleRow key={v._id} v={v} selected={selected === v._id} onSelect={() => { setSelected(v._id); loadData(v._id); }} onDelete={() => deleteVehicle(v._id)}/>)}</div> : <Empty icon={CarFront} title="No vehicles yet" text="Add your first vehicle to start tracking maintenance."/>}</section>
          <section className="panel"><div className="panel-heading"><div><h3>Next reminders</h3><p className="muted">For the selected vehicle</p></div></div>{reminders.filter(r => r.status !== 'Completed').slice(0,4).map(r => <div className="reminder-row" key={r._id}><div className="reminder-icon"><BellRing size={17}/></div><div className="grow"><strong>{r.title}</strong><span>{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : ''}{r.dueMileage != null ? ` · ${Number(r.dueMileage).toLocaleString()} km` : ''}</span></div><Status value={r.computedStatus}/></div>)}{!reminders.filter(r => r.status !== 'Completed').length && <Empty icon={BellRing} title="All caught up" text="No pending reminders for this vehicle."/>}</section></div>
      </>}
      {activeTab === 'vehicles' && <><div className="section-intro"><div><h2>My vehicles</h2><p className="muted">Keep your vehicle details up to date.</p></div></div><div className="content-grid"><section className="panel wide"><div className="panel-heading"><h3>Registered vehicles ({vehicles.length})</h3></div>{vehicles.map(v => <VehicleRow key={v._id} v={v} selected={selected === v._id} onSelect={() => { setSelected(v._id); loadData(v._id); }} onDelete={() => deleteVehicle(v._id)}/>)}{!vehicles.length && <Empty icon={CarFront} title="Nothing here yet" text="Use the form to register a vehicle."/>}</section>
        <section className="panel"><div className="panel-heading"><h3>Add a vehicle</h3></div><form className="form-stack" onSubmit={addVehicle}><Field label="Registration number"><input required value={vehicleForm.registrationNumber} onChange={e => setVehicleForm({...vehicleForm, registrationNumber:e.target.value})} placeholder="TS09AB1234"/></Field><div className="two-fields"><Field label="Brand"><input required value={vehicleForm.brand} onChange={e => setVehicleForm({...vehicleForm, brand:e.target.value})} placeholder="Hyundai"/></Field><Field label="Model"><input required value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model:e.target.value})} placeholder="i20"/></Field></div><div className="two-fields"><Field label="Year"><input required type="number" min="1950" max={new Date().getFullYear()+1} value={vehicleForm.year} onChange={e => setVehicleForm({...vehicleForm, year:e.target.value})}/></Field><Field label="Mileage (km)"><input required type="number" min="0" value={vehicleForm.currentMileage} onChange={e => setVehicleForm({...vehicleForm, currentMileage:e.target.value})}/></Field></div><Field label="Fuel type"><select value={vehicleForm.fuelType} onChange={e => setVehicleForm({...vehicleForm, fuelType:e.target.value})}>{['Petrol','Diesel','Electric','Hybrid','CNG','Other'].map(x => <option key={x}>{x}</option>)}</select></Field><button className="primary full"><Plus size={16}/> Save vehicle</button></form></section></div></>}
      {activeTab === 'services' && <><div className="section-intro"><div><h2>Service history</h2><p className="muted">Log maintenance and keep an accurate service timeline.</p></div><VehicleSelect vehicles={vehicles} selected={selected} onChange={id => { setSelected(id); loadData(id); }}/></div><div className="content-grid"><section className="panel wide"><div className="panel-heading"><h3>Past services</h3><span className="count-pill">{services.length} records</span></div>{services.length ? <div className="table-wrap"><table><thead><tr><th>Date</th><th>Service</th><th>Mileage</th><th>Center</th><th>Cost</th></tr></thead><tbody>{services.map(s => <tr key={s._id}><td>{new Date(s.serviceDate).toLocaleDateString()}</td><td><strong>{s.serviceType}</strong><small>{s.notes}</small></td><td>{Number(s.mileage).toLocaleString()} km</td><td>{s.serviceCenter || '—'}</td><td>{money(s.cost)}</td></tr>)}</tbody></table></div> : <Empty icon={Wrench} title="No service records" text="Add a service record for the selected vehicle."/>}</section>
        <section className="panel"><div className="panel-heading"><h3>Record a service</h3></div>{!selectedVehicle ? <Empty icon={CarFront} title="Add a vehicle first" text="A service record must belong to a vehicle."/> : <form className="form-stack" onSubmit={addService}><Field label="Service date"><input required type="date" value={serviceForm.serviceDate} onChange={e => setServiceForm({...serviceForm,serviceDate:e.target.value})}/></Field><Field label="Service type"><input required value={serviceForm.serviceType} onChange={e => setServiceForm({...serviceForm,serviceType:e.target.value})}/></Field><div className="two-fields"><Field label="Mileage (km)"><input required type="number" min="0" value={serviceForm.mileage} onChange={e => setServiceForm({...serviceForm,mileage:e.target.value})}/></Field><Field label="Cost (₹)"><input required type="number" min="0" step="0.01" value={serviceForm.cost} onChange={e => setServiceForm({...serviceForm,cost:e.target.value})}/></Field></div><Field label="Service center"><input value={serviceForm.serviceCenter} onChange={e => setServiceForm({...serviceForm,serviceCenter:e.target.value})} placeholder="Garage or service center"/></Field><Field label="Notes"><textarea rows="3" value={serviceForm.notes} onChange={e => setServiceForm({...serviceForm,notes:e.target.value})} placeholder="Parts changed, observations…"/></Field><button className="primary full">Save service record</button></form>}</section></div></>}
      {activeTab === 'reminders' && <><div className="section-intro"><div><h2>Maintenance reminders</h2><p className="muted">Stay ahead of upcoming service and expiry dates.</p></div><VehicleSelect vehicles={vehicles} selected={selected} onChange={id => { setSelected(id); loadData(id); }}/></div><div className="content-grid"><section className="panel wide"><div className="panel-heading"><h3>Reminders for {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : 'selected vehicle'}</h3></div>{reminders.map(r => <div className="reminder-card" key={r._id}><div className="reminder-icon"><BellRing/></div><div className="grow"><strong>{r.title}</strong><p className="muted">{r.dueDate ? `Due ${new Date(r.dueDate).toLocaleDateString()}` : 'Date not set'}{r.dueMileage != null ? ` · ${Number(r.dueMileage).toLocaleString()} km` : ''}</p></div><Status value={r.computedStatus}/>{r.status !== 'Completed' && <button className="icon-button" title="Mark completed" onClick={() => completeReminder(r._id)}><CheckCircle2 size={18}/></button>}</div>)}{!reminders.length && <Empty icon={BellRing} title="No reminders" text="Create a reminder to keep maintenance on track."/>}</section>
        <section className="panel"><div className="panel-heading"><h3>Create a reminder</h3></div>{!selectedVehicle ? <Empty icon={CarFront} title="Add a vehicle first" text="Reminders need to be linked to a vehicle."/> : <form className="form-stack" onSubmit={addReminder}><Field label="Reminder title"><input required value={reminderForm.title} onChange={e => setReminderForm({...reminderForm,title:e.target.value})} placeholder="Insurance renewal"/></Field><Field label="Due date (optional)"><input type="date" value={reminderForm.dueDate} onChange={e => setReminderForm({...reminderForm,dueDate:e.target.value})}/></Field><Field label="Due mileage in km (optional)"><input type="number" min="0" value={reminderForm.dueMileage} onChange={e => setReminderForm({...reminderForm,dueMileage:e.target.value})} placeholder="e.g. 25000"/></Field><p className="hint">Enter a date, mileage, or both.</p><button className="primary full"><Plus size={16}/> Create reminder</button></form>}</section></div></>}
      <footer className="footer">VehicleCare <span>·</span> Keep every journey on track</footer>
    </main>
  </div>;
}

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function Stat({ icon: Icon, label, value }) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className="stat-icon"><Icon size={19}/></div></div><strong>{value}</strong><span className="stat-foot">Updated from your records</span></div>; }
function Empty({ icon: Icon, title, text }) { return <div className="empty"><div className="empty-icon"><Icon size={22}/></div><strong>{title}</strong><p>{text}</p></div>; }
function Status({ value }) { const cls = String(value || 'Upcoming').toLowerCase().replaceAll(' ', '-'); return <span className={`status ${cls}`}>{value || 'Upcoming'}</span>; }
function VehicleSelect({ vehicles, selected, onChange }) { return <select className="vehicle-select" value={selected} onChange={e => onChange(e.target.value)}>{!vehicles.length && <option value="">No vehicles</option>}{vehicles.map(v => <option key={v._id} value={v._id}>{v.brand} {v.model} · {v.registrationNumber}</option>)}</select>; }
function VehicleRow({ v, selected, onSelect, onDelete }) { return <div className={`vehicle-row ${selected ? 'selected' : ''}`}><button className="vehicle-main" onClick={onSelect}><div className="vehicle-icon"><CarFront size={23}/></div><div className="grow"><strong>{v.brand} {v.model}</strong><span>{v.registrationNumber} · {v.year} · {v.fuelType}</span></div><span className="mileage">{Number(v.currentMileage).toLocaleString()} km</span></button><button className="icon-button danger" title="Delete vehicle" onClick={onDelete}><Trash2 size={16}/></button></div>; }
