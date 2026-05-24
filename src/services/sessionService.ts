import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

// ─── Parsers ──────────────────────────────────────────────────────────────────

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getOS() {
  const ua = navigator.userAgent;
  if (/iPhone OS/.test(ua))    return { os: 'iOS',     osVersion: ua.match(/iPhone OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') ?? '' };
  if (/iPad/.test(ua))         return { os: 'iPadOS',  osVersion: ua.match(/CPU OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') ?? '' };
  if (/Android/.test(ua))      return { os: 'Android', osVersion: ua.match(/Android ([\d.]+)/)?.[1] ?? '' };
  if (/Windows NT/.test(ua))   return { os: 'Windows', osVersion: ua.match(/Windows NT ([\d.]+)/)?.[1] ?? '' };
  if (/Mac OS X/.test(ua))     return { os: 'macOS',   osVersion: ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') ?? '' };
  if (/Linux/.test(ua))        return { os: 'Linux',   osVersion: '' };
  return { os: 'Unknown', osVersion: '' };
}

function getBrowser() {
  const ua = navigator.userAgent;
  if (/CriOS/.test(ua))        return { browser: 'Chrome iOS',      browserVersion: ua.match(/CriOS\/([\d.]+)/)?.[1] ?? '' };
  if (/FxiOS/.test(ua))        return { browser: 'Firefox iOS',     browserVersion: ua.match(/FxiOS\/([\d.]+)/)?.[1] ?? '' };
  if (/SamsungBrowser/.test(ua)) return { browser: 'Samsung Browser', browserVersion: ua.match(/SamsungBrowser\/([\d.]+)/)?.[1] ?? '' };
  if (/Edg\//.test(ua))        return { browser: 'Edge',            browserVersion: ua.match(/Edg\/([\d.]+)/)?.[1] ?? '' };
  if (/OPR\//.test(ua))        return { browser: 'Opera',           browserVersion: ua.match(/OPR\/([\d.]+)/)?.[1] ?? '' };
  if (/Chrome/.test(ua))       return { browser: 'Chrome',          browserVersion: ua.match(/Chrome\/([\d.]+)/)?.[1] ?? '' };
  if (/Firefox/.test(ua))      return { browser: 'Firefox',         browserVersion: ua.match(/Firefox\/([\d.]+)/)?.[1] ?? '' };
  if (/Safari/.test(ua))       return { browser: 'Safari',          browserVersion: ua.match(/Version\/([\d.]+)/)?.[1] ?? '' };
  return { browser: 'Unknown', browserVersion: '' };
}

function getNetworkInfo() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection ?? (navigator as any).mozConnection ?? (navigator as any).webkitConnection;
  if (!conn) return {};
  return {
    connectionType:   conn.type          ?? null,
    effectiveType:    conn.effectiveType ?? null,
    downlink_mbps:    conn.downlink      ?? null,
    rtt_ms:           conn.rtt           ?? null,
    saveData:         conn.saveData      ?? null,
  };
}

function getUTMs(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utms: Record<string, string> = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'].forEach(k => {
    const v = params.get(k);
    if (v) utms[k] = v;
  });
  return utms;
}

async function getBatteryInfo(): Promise<Record<string, unknown>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const battery = await (navigator as any).getBattery?.();
    if (!battery) return {};
    return {
      batteryLevel:    Math.round(battery.level * 100),
      batteryCharging: battery.charging,
    };
  } catch {
    return {};
  }
}

async function getIpLocation(): Promise<Record<string, unknown>> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return {};
    const d = await res.json();
    return {
      ip:          d.ip,
      city:        d.city,
      state:       d.region,
      stateCode:   d.region_code,
      country:     d.country_name,
      countryCode: d.country_code,
      postalCode:  d.postal,
      latitude:    d.latitude,
      longitude:   d.longitude,
      timezone:    d.timezone,
      isp:         d.org,
      isMobile:    d.version === 'IPv4' ? null : null, // ipapi doesn't expose this
    };
  } catch {
    return {};
  }
}

function getGPSLocation(): Promise<Record<string, unknown>> {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        gps_lat:      pos.coords.latitude,
        gps_lng:      pos.coords.longitude,
        gps_accuracy: Math.round(pos.coords.accuracy),
        gps_altitude: pos.coords.altitude ?? null,
      }),
      () => resolve({}),          // user denied — fail silently
      { timeout: 6000, maximumAge: 60000 }
    );
  });
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Module state ─────────────────────────────────────────────────────────────

let _docId: string | null = null;
let _sessionId: string | null = null;
const _phaseTimestamps: Record<string, string> = {};

// ─── Public API ───────────────────────────────────────────────────────────────

export async function initSession(): Promise<void> {
  try {
    _sessionId = generateSessionId();
    const { os, osVersion } = getOS();
    const { browser, browserVersion } = getBrowser();

    const baseData = {
      // ── Identificación ───────────────────────────────────────────────
      sessionId:        _sessionId,
      startedAt:        serverTimestamp(),
      phase:            'started',
      phaseTimestamps:  {},
      completed:        false,
      runId:            null,
      resultStatus:     null, // 'success' | 'failed' | null

      // ── Dispositivo ──────────────────────────────────────────────────
      userAgent:        navigator.userAgent,
      deviceType:       getDeviceType(),
      os,
      osVersion,
      browser,
      browserVersion,
      platform:         navigator.platform,
      vendor:           navigator.vendor ?? null,
      maxTouchPoints:   navigator.maxTouchPoints,
      cookiesEnabled:   navigator.cookieEnabled,
      doNotTrack:       navigator.doNotTrack,

      // ── Hardware ─────────────────────────────────────────────────────
      cpuCores:         navigator.hardwareConcurrency ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deviceMemory_gb:  (navigator as any).deviceMemory ?? null,

      // ── Pantalla ─────────────────────────────────────────────────────
      screenWidth:      screen.width,
      screenHeight:     screen.height,
      viewportWidth:    window.innerWidth,
      viewportHeight:   window.innerHeight,
      pixelRatio:       window.devicePixelRatio,
      colorDepth:       screen.colorDepth,
      orientation:      screen.orientation?.type ?? (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'),

      // ── Red ──────────────────────────────────────────────────────────
      ...getNetworkInfo(),
      onLine:           navigator.onLine,

      // ── Idioma / Zona ─────────────────────────────────────────────────
      language:         navigator.language,
      languages:        Array.from(navigator.languages ?? []),
      timezone:         Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset:   new Date().getTimezoneOffset(),
      localTime:        new Date().toISOString(),

      // ── Tráfico ───────────────────────────────────────────────────────
      referrer:         document.referrer || null,
      url:              window.location.href,
      utms:             getUTMs(),

      // ── Rendimiento ───────────────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pageLoadTime_ms:  Math.round((performance as any).timing
        ? performance.now()
        : 0),
    };

    const docRef = await addDoc(collection(db, 'cabezoxxoz_sessions'), baseData);
    _docId = docRef.id;

    // Enriquecer con datos asíncronos en segundo plano (no bloquean UX)
    Promise.all([
      getBatteryInfo(),
      getIpLocation(),
      getGPSLocation(),
    ]).then(([battery, ipLoc, gps]) => {
      if (_docId) {
        updateDoc(doc(db, 'cabezoxxoz_sessions', _docId), {
          ...battery,
          ...ipLoc,
          ...gps,
        }).catch(() => {});
      }
    });

  } catch (err) {
    console.error('[Session] initSession error:', err);
  }
}

export async function updateSessionPhase(
  phase: 'home' | 'photo' | 'waiting' | 'result' | 'failed',
  extra?: Record<string, unknown>
): Promise<void> {
  if (!_docId) return;
  try {
    _phaseTimestamps[phase] = new Date().toISOString();
    await updateDoc(doc(db, 'cabezoxxoz_sessions', _docId), {
      phase,
      phaseTimestamps: _phaseTimestamps,
      lastUpdatedAt: serverTimestamp(),
      ...(phase === 'result' ? { completed: true, completedAt: serverTimestamp() } : {}),
      ...(phase === 'failed' ? { completed: false, failedAt: serverTimestamp() }  : {}),
      ...extra,
    });
  } catch (err) {
    console.error('[Session] updateSessionPhase error:', err);
  }
}
