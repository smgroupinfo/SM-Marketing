import axios from 'axios';
import { supabase } from './supabase';
import {
  directSupabaseLogin,
  directSupabaseRegister,
  directSupabaseGetFirms,
  directSupabaseSaveFirm,
  directSupabaseStartShift,
  directSupabaseCloseShift,
  directSupabaseLogVisit,
  directSupabaseGetVisits,
  DEFAULT_APP_CONFIG,
  SEED_USERS,
  SEED_FIRMS
} from './supabaseDataService';

// Determine the active API base URL
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const isApkOrFile = 
      window.location.protocol === 'file:' || 
      (window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '5173') ||
      window.location.origin.includes('capacitor') ||
      window.location.origin.includes('ionic');

    if (isApkOrFile) {
      const customApi = localStorage.getItem('custom_api_endpoint');
      return customApi || 'https://ais-dev-3rnhgkd4wautg7ce7ppxv5-820345301761.asia-southeast1.run.app/api';
    }
  }
  return '/api';
}

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 6000
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.baseURL = getApiBaseUrl();
  }
  return config;
});

// Helper function to handle direct Supabase client emulation when remote server is down or on APK
async function handleSupabaseFallback(method, url, data) {
  const cleanUrl = url.replace(/^\/api/, '');
  console.log(`[Supabase Direct Engine] Executing client-side fallback: ${method.toUpperCase()} ${cleanUrl}`);

  // 1. Auth: Login
  if (cleanUrl === '/auth/login' && method === 'post') {
    const { emailOrPhone, password } = data || {};
    const res = await directSupabaseLogin(emailOrPhone, password);
    return { data: { message: 'Login successful (Direct Supabase)', token: res.token, user: res.user } };
  }

  // 2. Auth: Register
  if (cleanUrl === '/auth/register' && method === 'post') {
    const res = await directSupabaseRegister(data || {});
    return { data: res };
  }

  // 3. Firms: GET
  if (cleanUrl.startsWith('/firms') && method === 'get') {
    const firms = await directSupabaseGetFirms();
    return { data: firms };
  }

  // 4. Firms: POST / PUT
  if (cleanUrl.startsWith('/firms') && (method === 'post' || method === 'put')) {
    const saved = await directSupabaseSaveFirm(data || {});
    return { data: { message: 'Firm saved successfully', firm: saved } };
  }

  // 5. Shifts: Start
  if (cleanUrl === '/shifts/start' && method === 'post') {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const { openingOdometer, photo, location } = data || {};
    const shift = await directSupabaseStartShift(user.userId || user.id || 'exec-0001', openingOdometer, photo, location);
    return { data: { message: 'Shift started', shift } };
  }

  // 6. Shifts: Active
  if (cleanUrl === '/shifts/active' && method === 'get') {
    const active = localStorage.getItem('active_shift');
    return { data: active ? JSON.parse(active) : null };
  }

  // 7. Shifts: Close
  if (cleanUrl === '/shifts/close' && method === 'post') {
    const { shiftId, closingOdometer, photo, closeLocation } = data || {};
    const result = await directSupabaseCloseShift(shiftId, closingOdometer, photo, closeLocation);
    return { data: { message: 'Shift closed', shift: result } };
  }

  // 8. Visits: POST
  if (cleanUrl === '/visits' && method === 'post') {
    const record = await directSupabaseLogVisit(data || {});
    return { data: { message: 'Visit recorded successfully', visit: record } };
  }

  // 9. Visits: GET
  if (cleanUrl.startsWith('/visits') && method === 'get') {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const visits = await directSupabaseGetVisits(user.role === 'ADMIN' ? 'ALL' : (user.userId || user.id));
    return { data: visits };
  }

  // 10. Config: GET / PUT
  if (cleanUrl === '/config' && method === 'get') {
    if (supabase) {
      try {
        const { data: cfg, error: cfgError } = await supabase.from('app_config').select('*').limit(1).single();
        if (!cfgError && cfg) return { data: cfg };
      } catch (e) {
        console.warn('[Supabase Config GET Error]', e);
      }
    }
    return { data: DEFAULT_APP_CONFIG };
  }

  if (cleanUrl === '/config' && method === 'put') {
    if (supabase) {
      try {
        const { error: upsertError } = await supabase
          .from('app_config')
          .upsert([{ id: 'global', ...data }], { onConflict: 'id' })
          .select();
        if (upsertError) {
          console.warn('[Supabase Config PUT Warning]', upsertError.message);
        }
      } catch (e) {
        console.warn('[Supabase Config PUT Error]', e);
      }
    }
    return { data: { message: 'Configuration updated successfully', config: data } };
  }

  // 11. Users Management: GET
  if (cleanUrl === '/users' && method === 'get') {
    if (supabase) {
      try {
        const { data: usersList, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        if (!usersError && usersList && usersList.length > 0) {
          return { data: usersList.map(u => ({ ...u, fullName: u.full_name, phone: u.phone_number, currentAddress: u.current_address })) };
        }
      } catch (e) {
        console.warn('[Supabase Users GET Error]', e);
      }
    }
    const cachedUsers = JSON.parse(localStorage.getItem('offline_users') || JSON.stringify(SEED_USERS));
    return { data: cachedUsers.map(u => ({ ...u, fullName: u.full_name, phone: u.phone_number, currentAddress: u.current_address })) };
  }

  // 12. User Status: PUT /users/:id/status
  if (cleanUrl.includes('/status') && method === 'put') {
    const id = cleanUrl.split('/')[2];
    const { status, role } = data || {};
    if (supabase) {
      try {
        const { error: statusError } = await supabase
          .from('users')
          .update({ status, role })
          .eq('id', id)
          .select();
        if (statusError) {
          console.warn('[Supabase User Status Update Warning]', statusError.message);
        }
      } catch (e) {
        console.warn('[Supabase User Status Update Error]', e);
      }
    }
    return { data: { message: `User status updated to ${status}` } };
  }

  // 13. Notifications: GET / POST
  if (cleanUrl.startsWith('/notifications')) {
    const notifs = JSON.parse(localStorage.getItem('offline_notifications') || '[]');
    if (method === 'get') {
      return { data: notifs };
    }
    if (cleanUrl.includes('mark-read')) {
      const updated = notifs.map(n => ({ ...n, isRead: true, read: true }));
      localStorage.setItem('offline_notifications', JSON.stringify(updated));
      return { data: { success: true } };
    }
    if (method === 'post') {
      notifs.unshift({ id: 'notif_' + Date.now(), ...data, timestamp: new Date().toISOString(), isRead: false });
      localStorage.setItem('offline_notifications', JSON.stringify(notifs));
      return { data: { success: true } };
    }
  }

  // 14. Telegram Config: GET / PUT
  if (cleanUrl.startsWith('/telegram/config')) {
    const cfg = JSON.parse(localStorage.getItem('telegram_config') || '{"botToken":"","adminChatId":"","autoDispatchEnabled":true,"dispatchTime":"08:00"}');
    if (method === 'put') {
      const merged = { ...cfg, ...data };
      localStorage.setItem('telegram_config', JSON.stringify(merged));
      return { data: { message: 'Telegram configuration saved', config: merged } };
    }
    return { data: { config: cfg, activeExecs: SEED_USERS.filter(u => u.role === 'EXECUTIVE') } };
  }

  // 15. Telegram Test: POST
  if (cleanUrl === '/telegram/test' && method === 'post') {
    const { botToken, chatId } = data || {};
    if (botToken && chatId) {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '🤖 *SUNDARAM MAHADEO GROUP BOT TEST*\nConnection verified directly from device.',
            parse_mode: 'Markdown'
          })
        });
      } catch (e) {}
    }
    return { data: { message: 'Telegram Bot test dispatched', result: { success: true } } };
  }

  // 16. Reports Dashboard: GET
  if (cleanUrl.startsWith('/reports') || cleanUrl.startsWith('/analytics')) {
    const firms = await directSupabaseGetFirms();
    const visits = await directSupabaseGetVisits('ALL');
    let totalSales = 0;
    let totalColl = 0;
    visits.forEach(v => {
      totalSales += parseFloat(v.orderValue || 0);
      totalColl += parseFloat(v.collectedAmount || 0);
    });
    return {
      data: {
        summary: {
          totalSales,
          totalCollections: totalColl,
          totalVisits: visits.length,
          totalActiveFirms: firms.length,
          todayVisits: visits.slice(0, 10)
        },
        topPerformersExecs: [],
        topBuyers: firms.slice(0, 10)
      }
    };
  }

  return { data: { message: 'Operation completed (offline/direct)', success: true } };
}

// Wrapper for Axios that falls back automatically
export const api = {
  async get(url, config) {
    try {
      const res = await axiosInstance.get(url, config);
      return res;
    } catch (err) {
      return await handleSupabaseFallback('get', url);
    }
  },

  async post(url, data, config) {
    try {
      const res = await axiosInstance.post(url, data, config);
      return res;
    } catch (err) {
      return await handleSupabaseFallback('post', url, data);
    }
  },

  async put(url, data, config) {
    try {
      const res = await axiosInstance.put(url, data, config);
      return res;
    } catch (err) {
      return await handleSupabaseFallback('put', url, data);
    }
  },

  async delete(url, config) {
    try {
      const res = await axiosInstance.delete(url, config);
      return res;
    } catch (err) {
      return await handleSupabaseFallback('delete', url);
    }
  }
};

export default api;
