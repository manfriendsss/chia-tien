import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  PlusCircle, Receipt, Users, CreditCard, Trash2, 
  ChevronRight, Wallet, Mic, MicOff, Sparkles, Loader2, 
  Settings, UserPlus, X, Edit2, Check, Banknote, Send, 
  MessageCircle, Sun, Moon, Leaf, History
} from 'lucide-react';

// Danh sách các tông màu hỗ trợ cho Nhóm
const COLOR_OPTIONS = [
  { id: 'emerald', label: 'Xanh lá', classes: 'bg-emerald-100 text-emerald-700 border-emerald-400' },
  { id: 'orange', label: 'Cam', classes: 'bg-orange-100 text-orange-700 border-orange-400' },
  { id: 'purple', label: 'Tím', classes: 'bg-purple-100 text-purple-700 border-purple-400' },
  { id: 'blue', label: 'Xanh dương', classes: 'bg-blue-100 text-blue-700 border-blue-400' },
  { id: 'pink', label: 'Hồng', classes: 'bg-pink-100 text-pink-700 border-pink-400' },
  { id: 'slate', label: 'Xám', classes: 'bg-slate-100 text-slate-700 border-slate-400' }
];

const App = () => {
  // 1. Quản lý Theme (Sáng/Tối) - Sử dụng màu trung tính bảo vệ mắt
  const [theme, setTheme] = useState('light');
  
  // 2. State Quản lý Nhóm/Thành viên
  const [families, setFamilies] = useState([
    { id: 'f1', name: 'Nhà Mô Mía', members: ['QAnh', 'Linh'], colorId: 'emerald' },
    { id: 'f2', name: 'Nhà Thỏ Bắp', members: ['Hưng', 'Trang'], colorId: 'orange' },
    { id: 'f3', name: 'Nhà Gấu', members: ['Hùng', 'Mai Anh'], colorId: 'purple' }
  ]);

  const allMembers = useMemo(() => families.flatMap(f => f.members), [families]);

  // 3. State Chi tiêu - Khôi phục 10 khoản chi ban đầu
  const [expenses, setExpenses] = useState([
    { id: 1, payer: 'Trang', amount: 491000, note: 'Aeon 1', date: new Date().toISOString() },
    { id: 2, payer: 'Trang', amount: 77000, note: 'Aeon 2', date: new Date().toISOString() },
    { id: 3, payer: 'Trang', amount: 120000, note: 'Thịt lợn', date: new Date().toISOString() },
    { id: 4, payer: 'Trang', amount: 145000, note: 'Dưa vàng', date: new Date().toISOString() },
    { id: 5, payer: 'Trang', amount: 15000, note: 'Bánh mì', date: new Date().toISOString() },
    { id: 6, payer: 'Trang', amount: 120000, note: 'Thịt bò và nấm kim châm', date: new Date().toISOString() },
    { id: 7, payer: 'Trang', amount: 80000, note: 'Xà lách + dưa chuột + ớt chuông', date: new Date().toISOString() },
    { id: 8, payer: 'Linh', amount: 60000, note: 'Than và cồn khô', date: new Date().toISOString() },
    { id: 9, payer: 'QAnh', amount: 30000, note: 'Giấy bạc', date: new Date().toISOString() },
    { id: 10, payer: 'Mai Anh', amount: 300000, note: 'Dưa hấu, dưa chuột, roi, xoài', date: new Date().toISOString() },
  ]);

  const [newExpense, setNewExpense] = useState({ payer: '', amount: '', note: '' });
  const [activeTab, setActiveTab] = useState('list');
  const [editingFamily, setEditingFamily] = useState(null);

  // 4. State AI Chatbox
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Chào bạn! Mình là trợ lý SplitMate. Hãy chat hoặc nói để mình giúp bạn ghi lại chi tiêu nhé! 🌿' }]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  // Khởi tạo Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'vi-VN';
      recognitionRef.current.onresult = (e) => handleSendMessage(e.results[0][0].transcript);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, [allMembers, families]);

  // Hàm gọi API Gemini để xử lý ngôn ngữ tự nhiên
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    setIsProcessing(true);

    const apiKey = ""; // API key sẽ được truyền vào lúc runtime
    const systemPrompt = `Bạn là trợ lý ảo SplitMate chuyên bóc tách dữ liệu chi tiêu.
    Hãy trích xuất JSON từ câu nói của người dùng. 
    Danh sách thành viên: ${allMembers.join(', ')}.
    Nhóm: ${families.map(f => `${f.name}: ${f.members.join(',')}`).join('; ')}.
    Nếu người dùng nói tên nhóm, hãy gán cho thành viên đầu tiên của nhóm đó.
    Trả về JSON duy nhất: {"payer": "tên_người", "amount": số_tiền_number, "note": "nội_dung"}.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: text }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await response.json();
      const result = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

      if (result.amount > 0) {
        setExpenses(prev => [{ id: Date.now(), ...result, date: new Date().toISOString() }, ...prev]);
        setMessages(prev => [...prev, { role: 'bot', text: `✅ Đã ghi nhận: ${result.payer} chi ${result.amount.toLocaleString()}đ cho "${result.note}"` }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: '❌ Mình chưa hiểu rõ số tiền hoặc người chi. Bạn có thể nói lại chi tiết hơn không?' }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Có lỗi kết nối AI. Bạn hãy thử lại nhé.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const toggleVoice = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current?.start();
    }
  };

  // Logic tính toán sòng phẳng giữa các nhóm
  const summary = useMemo(() => {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const avgPerFamily = families.length > 0 ? totalSpent / families.length : 0;
    
    const familyStats = families.map(fam => {
      const paid = expenses.reduce((sum, exp) => fam.members.includes(exp.payer) ? sum + exp.amount : sum, 0);
      return { ...fam, paid, balance: paid - avgPerFamily };
    });

    let trans = [];
    let bals = familyStats.map(f => ({ name: f.name, amount: f.balance }));
    let debtors = bals.filter(b => b.amount < -1).sort((a, b) => a.amount - b.amount);
    let creditors = bals.filter(b => b.amount > 1).sort((a, b) => b.amount - a.amount);
    
    let d = 0, c = 0;
    while (d < debtors.length && c < creditors.length) {
      const amt = Math.min(Math.abs(debtors[d].amount), creditors[c].amount);
      if (amt > 1) trans.push({ from: debtors[d].name, to: creditors[c].name, amount: Math.round(amt) });
      debtors[d].amount += amt; creditors[c].amount -= amt;
      if (Math.abs(debtors[d].amount) < 1) d++; if (Math.abs(creditors[c].amount) < 1) c++;
    }
    return { totalSpent, avgPerFamily, familyStats, transactions: trans };
  }, [expenses, families]);

  const getFamilyStyle = (payerName) => {
    const fam = families.find(f => f.members.includes(payerName));
    return COLOR_OPTIONS.find(c => c.id === (fam?.colorId || 'slate')).classes;
  };

  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  // Cấu hình Style theo Theme
  const isDark = theme === 'dark';
  const styles = {
    bg: isDark ? 'bg-[#1A1C1E]' : 'bg-[#F4F7F6]',
    card: isDark ? 'bg-[#25282C] border-[#31353B]' : 'bg-[#FFFFFF] border-[#E2E8F0]',
    text: isDark ? 'text-[#E2E8F0]' : 'text-[#2D3748]',
    textMuted: isDark ? 'text-[#94A3B8]' : 'text-[#718096]',
    input: isDark ? 'bg-[#2D3136] text-[#E2E8F0]' : 'bg-[#F8FAFC] text-[#2D3748]',
    tabActive: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
    tabInactive: isDark ? 'text-[#94A3B8] hover:bg-[#2D3136]' : 'text-[#718096] hover:bg-slate-100'
  };

  return (
    <div className={`min-h-screen ${styles.bg} ${styles.text} font-sans pb-32 transition-colors duration-300`}>
      <div className="max-w-xl mx-auto px-4 pt-6">
        
        {/* Header */}
        <header className={`mb-6 flex items-center justify-between p-4 rounded-[2rem] shadow-sm border ${styles.card}`}>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Leaf className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">SplitMate</h1>
              <p className="text-[9px] uppercase tracking-widest opacity-50 font-bold">Quản lý chi tiêu nhóm</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className={`p-2.5 rounded-xl transition-all ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-50 text-emerald-600'}`}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setActiveTab(activeTab === 'settings' ? 'list' : 'settings')} 
              className={`p-2.5 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-emerald-500 text-white shadow-lg' : isDark ? 'bg-[#2D3136] text-slate-400' : 'bg-slate-50 text-slate-400'}`}
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Stats Row (1 hàng) */}
        {activeTab !== 'settings' && (
          <div className="grid grid-cols-2 gap-4 mb-6 animate-in fade-in zoom-in-95">
            <div className={`text-center p-5 rounded-[2rem] shadow-sm border ${styles.card}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${styles.textMuted}`}>Tổng chi tiêu</p>
              <p className="text-xl font-black text-emerald-600">{formatMoney(summary.totalSpent)}</p>
            </div>
            <div className={`text-center p-5 rounded-[2rem] shadow-sm border ${styles.card}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${styles.textMuted}`}>Trung bình/Nhóm</p>
              <p className={`text-xl font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatMoney(summary.avgPerFamily)}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className={`flex ${isDark ? 'bg-[#2D3136]' : 'bg-slate-200/50'} p-1.5 rounded-2xl mb-6`}>
          <button onClick={() => setActiveTab('list')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'list' ? styles.tabActive : styles.tabInactive}`}>
            <Receipt size={14} /> DANH SÁCH CHI
          </button>
          <button onClick={() => setActiveTab('summary')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'summary' ? styles.tabActive : styles.tabInactive}`}>
            <Users size={14} /> TỔNG KẾT NHÓM
          </button>
        </div>

        {/* Main List View */}
        {activeTab === 'list' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            {/* Form Thêm nhanh */}
            <form 
              onSubmit={(e) => { e.preventDefault(); if(newExpense.amount && newExpense.note) { setExpenses([{ id: Date.now(), ...newExpense, amount: parseInt(newExpense.amount), date: new Date().toISOString() }, ...expenses]); setNewExpense({ ...newExpense, amount: '', note: '' }); } }}
              className={`p-6 rounded-[2rem] shadow-sm border ${styles.card}`}
            >
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="col-span-1">
                  <label className={`text-[9px] font-black uppercase mb-2 block ${styles.textMuted}`}>Người trả</label>
                  <select className={`w-full border-none rounded-xl p-3 text-xs font-bold outline-none ring-1 ${isDark ? 'ring-[#31353B]' : 'ring-slate-100'} ${styles.input}`} value={newExpense.payer} onChange={(e) => setNewExpense({...newExpense, payer: e.target.value})}>
                    <option value="">Chọn người</option>
                    {allMembers.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className={`text-[9px] font-black uppercase mb-2 block ${styles.textMuted}`}>Số tiền</label>
                  <input type="number" placeholder="0" className={`w-full border-none rounded-xl p-3 text-xs font-bold outline-none ring-1 ${isDark ? 'ring-[#31353B]' : 'ring-slate-100'} ${styles.input}`} value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className={`text-[9px] font-black uppercase mb-2 block ${styles.textMuted}`}>Nội dung</label>
                  <input type="text" placeholder="Ghi chú chi tiêu..." className={`w-full border-none rounded-xl p-3 text-xs font-bold outline-none ring-1 ${isDark ? 'ring-[#31353B]' : 'ring-slate-100'} ${styles.input}`} value={newExpense.note} onChange={(e) => setNewExpense({...newExpense, note: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black py-4 rounded-2xl uppercase tracking-[0.15em] transition-all">
                Ghi lại chi tiêu
              </button>
            </form>

            {/* Danh sách lịch sử chi tiêu */}
            <div className={`p-6 rounded-[2rem] shadow-sm border ${styles.card}`}>
              <h3 className={`text-[10px] font-black uppercase mb-4 tracking-widest flex items-center gap-2 ${styles.textMuted}`}>
                <History size={14} className="text-emerald-500" /> Lịch sử chi tiêu ({expenses.length})
              </h3>
              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <p className="text-center py-8 text-xs italic text-slate-400">Chưa có khoản chi nào được ghi lại.</p>
                ) : (
                  expenses.map((exp) => (
                    <div key={exp.id} className={`p-4 rounded-[1.5rem] border ${isDark ? 'border-[#31353B] bg-[#2D3136]/50' : 'border-slate-50 bg-slate-50/50'} flex items-center justify-between transition-all hover:scale-[1.01]`}>
                      <div className="flex flex-col gap-1.5">
                        <p className="font-bold text-xs tracking-tight">{exp.note}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-wider ${getFamilyStyle(exp.payer)}`}>
                            {exp.payer}
                          </span>
                          <span className={`text-[9px] font-bold ${styles.textMuted}`}>{new Date(exp.date).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-xs">{formatMoney(exp.amount)}</span>
                        <button onClick={() => setExpenses(expenses.filter(e => e.id !== exp.id))} className="text-slate-300 hover:text-red-500 p-2">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Summary View */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-in fade-in">
            <div className={`p-6 rounded-[2rem] shadow-sm border ${styles.card}`}>
              <h3 className={`text-[10px] font-black uppercase mb-6 tracking-widest flex items-center gap-2 ${styles.textMuted}`}>
                <Wallet size={14} className="text-emerald-500" /> TÌNH TRẠNG CHI TIÊU NHÓM
              </h3>
              {summary.familyStats.map((fam) => {
                const colorConfig = COLOR_OPTIONS.find(c => c.id === fam.colorId);
                return (
                  <div key={fam.id} className="mb-8 last:mb-0">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-xs font-black">{fam.name}</span>
                      <span className="text-xs font-black text-emerald-600">{formatMoney(fam.paid)}</span>
                    </div>
                    <div className={`${isDark ? 'bg-[#2D3136]' : 'bg-slate-100'} h-3 rounded-full overflow-hidden p-0.5 shadow-inner`}>
                      <div 
                        className={`h-full transition-all duration-1000 rounded-full ${colorConfig.classes.split(' ')[2].replace('border-', 'bg-')}`} 
                        style={{ width: `${Math.min(100, (fam.paid / (summary.totalSpent || 1)) * (families.length * 100))}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-3">
                      <p className={`text-[9px] font-bold uppercase ${styles.textMuted}`}>{fam.members.join(', ')}</p>
                      <p className={`text-[9px] font-black uppercase ${fam.balance >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {fam.balance >= 0 ? `Dư: ${formatMoney(fam.balance)}` : `Thiếu: ${formatMoney(Math.abs(fam.balance))}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`p-6 rounded-[2rem] shadow-lg border-2 border-emerald-500/20 ${isDark ? 'bg-emerald-900/10' : 'bg-emerald-50/50'} transition-all`}>
              <h3 className="text-[10px] font-black uppercase text-emerald-600 mb-6 tracking-widest flex items-center gap-2">
                <CreditCard size={16} /> KẾ HOẠCH QUYẾT TOÁN NHANH
              </h3>
              {summary.transactions.length === 0 ? (
                <p className={`text-xs italic text-center py-6 ${styles.textMuted}`}>Các nhóm đã chi tiêu rất cân bằng.</p>
              ) : (
                <div className="space-y-3">
                  {summary.transactions.map((t, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-[#25282C] border-emerald-500/30' : 'bg-white border-white'} shadow-sm animate-in slide-in-from-right-4`} style={{ animationDelay: `${idx * 100}ms` }}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-emerald-600">{t.from}</span>
                        <ChevronRight size={12} className="text-slate-400" />
                        <span className={`text-xs font-black ${styles.text}`}> {t.to}</span>
                      </div>
                      <span className="text-base font-black text-emerald-600">{formatMoney(t.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings View */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in slide-in-from-top-4">
            <div className="flex items-center justify-between px-2">
              <h3 className={`text-[10px] font-black uppercase tracking-widest ${styles.textMuted}`}>Quản lý nhóm</h3>
              <button 
                onClick={() => {
                  const name = prompt("Tên nhóm mới:");
                  if(name) setFamilies([...families, { id: 'f'+Date.now(), name, members: [], colorId: 'slate' }]);
                }}
                className="text-[9px] font-black bg-emerald-500 text-white px-4 py-2 rounded-full flex items-center gap-1.5 uppercase shadow-md shadow-emerald-500/20"
              >
                <PlusCircle size={12} /> Thêm nhóm
              </button>
            </div>

            {families.map((fam) => {
              const colorConfig = COLOR_OPTIONS.find(c => c.id === fam.colorId);
              return (
                <div key={fam.id} className={`${styles.card} p-5 rounded-[2rem] shadow-sm border-2 transition-all ${colorConfig.classes.split(' ')[2]}`}>
                  <div className="flex items-center justify-between mb-5">
                    {editingFamily === fam.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input 
                          className={`border-none rounded-xl px-4 py-2 text-xs font-bold w-full outline-none ring-2 ring-emerald-500 ${styles.input}`}
                          defaultValue={fam.name}
                          onBlur={(e) => { setFamilies(families.map(f => f.id === fam.id ? { ...f, name: e.target.value } : f)); setEditingFamily(null); }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setEditingFamily(fam.id)}>
                        <h4 className="font-black text-sm">{fam.name}</h4>
                        <Edit2 size={12} className="text-slate-300 group-hover:text-emerald-500" />
                      </div>
                    )}
                    <div className="flex gap-1.5 p-1 rounded-full bg-slate-500/5">
                      {COLOR_OPTIONS.map(c => (
                        <button key={c.id} onClick={() => setFamilies(families.map(f => f.id === fam.id ? { ...f, colorId: c.id } : f))} className={`w-5 h-5 rounded-full border-2 ${c.classes.split(' ')[0]} ${fam.colorId === c.id ? 'border-slate-800 scale-110 shadow-sm' : 'border-white dark:border-[#25282C]'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fam.members.map(m => (
                      <div key={m} className={`${isDark ? 'bg-[#2D3136]' : 'bg-slate-50'} px-3 py-1.5 rounded-xl flex items-center gap-2 border ${isDark ? 'border-[#31353B]' : 'border-slate-100'} shadow-sm`}>
                        <span className="text-[10px] font-bold">{m}</span>
                        <button onClick={() => setFamilies(families.map(f => f.id === fam.id ? { ...f, members: f.members.filter(mem => mem !== m) } : f))} className="text-slate-300 hover:text-red-500 transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => { const name = prompt("Tên thành viên mới:"); if(name) setFamilies(families.map(f => f.id === fam.id ? { ...f, members: [...f.members, name] } : f)); }} className={`border-2 border-dashed ${isDark ? 'border-[#31353B]' : 'border-slate-200'} px-3 py-1.5 rounded-xl text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all`}>
                      <UserPlus size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Chatbox Widget */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50">
        {isChatOpen && (
          <div className={`w-72 md:w-80 h-[450px] rounded-[2.5rem] shadow-2xl border ${styles.card} flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 zoom-in-95`}>
            <div className="bg-emerald-600 p-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="animate-pulse" />
                <span className="font-black text-[10px] uppercase tracking-[0.2em]">SplitMate AI</span>
              </div>
              <button onClick={() => setIsChatOpen(false)}><X size={18} /></button>
            </div>
            
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-[#1E2124]' : 'bg-slate-50'}`}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-[1.25rem] text-[10px] font-bold shadow-sm ${m.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : isDark ? 'bg-[#2D3136] text-[#E2E8F0] border border-[#31353B] rounded-tl-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isProcessing && <div className="p-3 bg-white/20 rounded-full animate-pulse"><Loader2 size={14} className="animate-spin" /></div>}
              <div ref={chatEndRef} />
            </div>

            <div className={`p-4 border-t ${isDark ? 'border-[#31353B]' : 'border-slate-100'}`}>
              <div className={`flex items-center gap-2 rounded-[1.5rem] p-1 pr-2 ring-2 ${isDark ? 'bg-[#2D3136] ring-[#31353B]' : 'bg-white ring-slate-100'}`}>
                <button onMouseDown={toggleVoice} className={`p-2 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-emerald-600'}`}>
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <input type="text" placeholder="Chat chi tiêu..." className="flex-1 bg-transparent border-none text-[10px] font-bold outline-none py-2" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(chatInput)} />
                <button onClick={() => handleSendMessage(chatInput)} className="bg-emerald-600 text-white p-2 rounded-xl shadow-lg disabled:opacity-50" disabled={!chatInput.trim() || isProcessing}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-[1.5rem] shadow-2xl flex items-center justify-center transition-all transform active:scale-90 ${isChatOpen ? 'bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/40'}`}
        >
          {isChatOpen ? <X className="text-white" size={24} /> : <MessageCircle className="text-white" size={24} />}
          {!isChatOpen && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-[#1A1C1E]"></span></span>}
        </button>
      </div>
    </div>
  );
};

export default App;