import React from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Alert,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMilestone } from "../hooks/use-milestone";
import * as Speech from "expo-speech";
import {
  getHighlightsByBook,
  saveHighlight,
  deleteHighlight,
  getProgress,
  saveProgress,
  updateReadingStats,
} from "../components/services/bookServices";

export default function Reader() {
  const { url, title, id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const webViewRef = React.useRef<WebView>(null);
  const { activeMilestone, elapsed: milestoneSeconds } = useMilestone();

  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [rate, setRate] = React.useState(1.0);
  const [showControls, setShowControls] = React.useState(false);
  const [fullText, setFullText] = React.useState("");
  const [currentCharIndex, setCurrentCharIndex] = React.useState(0);
  const [highlights, setHighlights] = React.useState<any[]>([]);
  const highlightsRef = React.useRef<any[]>([]);
  const webViewReadyRef = React.useRef(false);
  const [initialProgress, setInitialProgress] = React.useState<number>(0);
  const [pdfRendered, setPdfRendered] = React.useState<boolean>(false);
  const progressRef = React.useRef<number>(0);
  const maxProgressRef = React.useRef<number>(0);
  const showingScrollDialogRef = React.useRef<boolean>(false);
  const lastSavedProgress = React.useRef<number>(0);
  const [zoomScale, setZoomScale] = React.useState<number>(1.0);


  const [sessionSeconds, setSessionSeconds] = React.useState(0);
  const [sessionPages, setSessionPages] = React.useState(0);
  const pagesViewedSet = React.useRef(new Set<number>());
  const lastSyncSeconds = React.useRef(0);
  const lastSyncPages = React.useRef(0);

  const setWebViewReady = (value: boolean) => { webViewReadyRef.current = value; };

  React.useEffect(() => { highlightsRef.current = highlights; }, [highlights]);

  const urlString = Array.isArray(url) ? url[0] : url;
  const bookId = Array.isArray(id) ? id[0] : id;
  const isPdf = urlString?.toLowerCase().endsWith(".pdf");
  const isLocalUrl =
    urlString?.includes("localhost") || urlString?.includes("192.168.") ||
    urlString?.includes("10.") || urlString?.includes("172.") ||
    urlString?.includes("ngrok") || urlString?.includes("trycloudflare") ||
    urlString?.includes(".loca.lt");

  React.useEffect(() => {
    if (urlString) {
      Speech.stop(); setIsSpeaking(false); setIsPaused(false);
      setFullText(""); setCurrentCharIndex(0); setWebViewReady(false);
      if (bookId) { fetchHighlights(); fetchInitialProgress(); }
    }
  }, [urlString, bookId]);

  const fetchInitialProgress = async () => {
    if (!bookId) return;
    const res = await getProgress(bookId as string);
    if (res.success && res.data) {
      setInitialProgress(res.data.progress || 0);
      progressRef.current = res.data.progress || 0;
      maxProgressRef.current = res.data.progress || 0;
      lastSavedProgress.current = res.data.progress || 0;
    } else { await saveCurrentProgress(0); }
  };

  const saveCurrentProgress = async (val: number, force: boolean = false) => {
    if (!bookId) return { success: false, message: "No book ID" };
    const isInitial = val === 0;
    const diff = Math.abs(val - lastSavedProgress.current);
    if (!force && !isInitial && diff < 1) return { success: true, message: "Already synced" };
    const res = await saveProgress(bookId as string, val);
    if (res.success) lastSavedProgress.current = val;
    return res;
  };

  const fetchHighlights = async () => {
    if (!bookId) return;
    const res = await getHighlightsByBook(bookId);
    if (res.success) {
      setHighlights(res.data);
      if (webViewReadyRef.current) restoreHighlights(res.data);
    }
  };

  // ─── Restore saved highlights ────────────────────────────────────────────
  const restoreHighlights = (list: any[]) => {
    if (!list || list.length === 0) return;

    if (isPdf) {
      // PDF: absolute overlay divs anchored to text-layer rects
      webViewRef.current?.injectJavaScript(`
        (function() {
          var hls = ${JSON.stringify(list)};
          if (!document.getElementById('_hl_style')) {
            var st = document.createElement('style'); st.id='_hl_style';
            st.textContent='.hl-ov{background:rgba(255,220,0,.45);position:absolute;z-index:9999;pointer-events:auto;border-radius:2px;cursor:pointer;}';
            document.head.appendChild(st);
          }
          function xp(path){try{return document.evaluate(path,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;}catch(e){return null;}}
          function c2n(par,off){var w=document.createTreeWalker(par,NodeFilter.SHOW_TEXT,null,false),cur=0,n;while((n=w.nextNode())){var l=n.textContent.length;if(cur+l>=off)return{node:n,offset:off-cur};cur+=l;}return null;}
          function applyOne(h){
            if(document.querySelector('.hl-ov[data-id="'+h._id+'"]'))return true;
            var par=xp(h.rangeData.parentPath);if(!par)return false;
            var s=c2n(par,h.rangeData.startCharOffset),e=c2n(par,h.rangeData.endCharOffset);
            if(!s||!e)return false;
            var r=document.createRange();r.setStart(s.node,s.offset);r.setEnd(e.node,e.offset);
            var rects=Array.from(r.getClientRects());if(!rects.length)return false;
            var anc=r.commonAncestorContainer;if(anc.nodeType===3)anc=anc.parentElement;
            var pg=anc;while(pg&&!pg.classList.contains('page-container'))pg=pg.parentElement;
            if(!pg)return false;
            var pgR=pg.getBoundingClientRect();
            rects.forEach(function(rc){
              if(rc.width<1)return;
              var d=document.createElement('div');d.className='hl-ov';d.dataset.id=h._id;
              d.style.left=(rc.left-pgR.left)+'px';d.style.top=(rc.top-pgR.top)+'px';
              d.style.width=rc.width+'px';d.style.height=rc.height+'px';
              d.onclick=function(e){e.stopPropagation();window.ReactNativeWebView.postMessage(JSON.stringify({type:'DELETE_HIGHLIGHT_REQUEST',id:h._id}));};
              pg.appendChild(d);
            });
            return true;
          }
          var retries=0;
          function attempt(){var f=0;hls.forEach(function(h){if(!applyOne(h))f++;});if(f>0&&retries<15){retries++;setTimeout(attempt,2000);}}
          attempt();
        })(); true;
      `);
    } else {
      // HTML: inline <mark> elements — use surroundContents (no TreeWalker that breaks on text root)
      webViewRef.current?.injectJavaScript(`
        (function() {
          var hls = ${JSON.stringify(list)};
          function xp(path){try{return document.evaluate(path,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;}catch(e){return null;}}
          function c2n(par,off){var w=document.createTreeWalker(par,NodeFilter.SHOW_TEXT,null,false),cur=0,n;while((n=w.nextNode())){var l=n.textContent.length;if(cur+l>=off)return{node:n,offset:off-cur};cur+=l;}return null;}
          function applyOne(h){
            if(document.querySelector('mark[data-hl-id="'+h._id+'"]'))return true;
            var par=xp(h.rangeData.parentPath);if(!par)return false;
            var s=c2n(par,h.rangeData.startCharOffset),e=c2n(par,h.rangeData.endCharOffset);
            if(!s||!e)return false;
            var r=document.createRange();r.setStart(s.node,s.offset);r.setEnd(e.node,e.offset);
            var mk=document.createElement('mark');mk.className='ss-hl';mk.dataset.hlId=h._id;
            mk.style.cssText='background:rgba(255,220,0,.55)!important;color:inherit!important;border-radius:2px;padding:0;display:inline;cursor:pointer;';
            mk.addEventListener('click',function(ev){ev.stopPropagation();window.ReactNativeWebView.postMessage(JSON.stringify({type:'DELETE_HIGHLIGHT_REQUEST',id:h._id}));});
            try{r.surroundContents(mk);}catch(e){var ex=r.extractContents();mk.appendChild(ex);r.insertNode(mk);}
            return true;
          }
          var retries=0;
          function attempt(){var f=0;hls.forEach(function(h){if(!applyOne(h))f++;});if(f>0&&retries<8){retries++;setTimeout(attempt,600);}}
          attempt();
        })(); true;
      `);
    }
  };

  // Reading timer
  React.useEffect(() => {
    const interval = setInterval(() => setSessionSeconds(p => p + 1), 1000);
    return () => { clearInterval(interval); Speech.stop(); };
  }, []);

  const handleManualBookmark = async () => {
    const current = Math.round(Number(progressRef.current) || 0);
    await syncReadingStatsOnUnmount();
    const res = await saveCurrentProgress(current, true);
    if (res && res.success) {
      Alert.alert("Bookmark Saved!", `Pinned at ${current}%.`);
      lastSavedProgress.current = current;
      maxProgressRef.current = Math.max(maxProgressRef.current, current);
    } else { Alert.alert("Error", "Failed to save bookmark."); }
  };

  React.useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      // Silently save progress and exit — no dialog
      const current = Math.round(Number(progressRef.current) || 0);
      if (current > 0) saveCurrentProgress(current);
      syncReadingStatsOnUnmount();
      navigation.goBack();
      return true;
    });
    return () => sub.remove();
  }, [navigation, bookId]);

  const syncReadingStatsOnUnmount = async () => {
    const sec = sessionSeconds - lastSyncSeconds.current;
    const pg  = sessionPages   - lastSyncPages.current;
    if (sec > 0 || pg > 0) {
      await updateReadingStats({ timeSpent: sec, pagesRead: pg, totalSessionTime: sessionSeconds });
    }
  };

  React.useEffect(() => {
    if (sessionSeconds > 0 && sessionSeconds % 60 === 0) {
      const sec = sessionSeconds - lastSyncSeconds.current;
      const pg  = sessionPages   - lastSyncPages.current;
      if (sec > 0 || pg > 0) {
        updateReadingStats({ timeSpent: sec, pagesRead: pg, totalSessionTime: sessionSeconds });
        lastSyncSeconds.current = sessionSeconds;
        lastSyncPages.current = sessionPages;
      }
    }
  }, [sessionSeconds]);

  // ─────────────────────────────────────────────────────────────────────────
  //  INJECTED JS — bugs fixed:
  //  1. toolbar uses top:-60px slide (not display:none) → offsetHeight is always 44px
  //  2. surroundContents+extractContents (not TreeWalker) → works on text-node roots
  //  3. touchend+350ms debounce (not selectionchange) → reliable on mobile
  //  4. addEventListener (not onclick="" strings) → works in all WebView sandboxes
  // ─────────────────────────────────────────────────────────────────────────
  const injectedJS = `
(function() {
  /* ── Console bridge ───────────────────────────────────────────────── */
  var _cl = console.log;
  console.log = function() {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CONSOLE_LOG',
        data: Array.from(arguments).map(function(a) {
          return typeof a === 'object' ? JSON.stringify(a) : String(a);
        }).join(' ')
      }));
    } catch(e) {}
    _cl.apply(console, arguments);
  };

  /* ── Styles ────────────────────────────────────────────────────────── */
  var _st = document.createElement('style');
  _st.textContent =
    'mark.ss-hl{background:rgba(255,220,0,0.5)!important;color:inherit!important;' +
    'border-radius:2px;padding:0;display:inline;cursor:pointer;' +
    '-webkit-box-decoration-break:clone;box-decoration-break:clone;}' +
    /* Bar stays in DOM, slides in/out via top — avoids offsetHeight=0 when display:none */
    '#ss-bar{position:fixed;left:50%;transform:translateX(-50%);top:-60px;' +
    'background:#1c1c1e;border-radius:10px;height:44px;display:flex;align-items:center;' +
    'z-index:2147483647;box-shadow:0 4px 20px rgba(0,0,0,.5);' +
    'transition:top 0.15s ease;pointer-events:auto;overflow:hidden;}' +
    '#ss-bar button{background:none;border:none;color:#fff;font-size:13px;font-weight:600;' +
    'padding:0 16px;height:44px;line-height:44px;cursor:pointer;' +
    '-webkit-tap-highlight-color:transparent;}' +
    '#ss-bar button:active{opacity:0.6;}' +
    '#ss-bar .hl{color:#FFD700;}' +
    '#ss-bar .rd{color:#34c759;}' +
    '#ss-bar .cp{color:#aaa;}' +
    '#ss-bar .sep{width:1px;height:22px;background:rgba(255,255,255,.2);}';
  document.head.appendChild(_st);

  /* ── Toolbar ─────────────────────────────────────────────────────────── */
  var _bar = document.createElement('div');
  _bar.id = 'ss-bar';
  _bar.innerHTML =
    '<button class="hl" id="ss-hl">&#9998; Highlight</button>' +
    '<div class="sep"></div>' +
    '<button class="rd" id="ss-rd">&#9654; Read</button>' +
    '<div class="sep"></div>' +
    '<button class="cp" id="ss-cp">Copy</button>';
  document.body.appendChild(_bar);

  /* ── State ────────────────────────────────────────────────────────────── */
  var _range = null;  // frozen Range — survives after visual selection is cleared
  var _touchY = 200;

  /* ── Show/hide via CSS top (never display:none) ─────────────────────── */
  function showBar() {
    var y = _touchY + window.scrollY - 44 - 12;
    if (y < window.scrollY + 4) y = _touchY + window.scrollY + 12;
    _bar.style.top = y + 'px';
  }
  function hideBar(clearRange) {
    _bar.style.top = '-60px';
    if (clearRange) _range = null;
  }

  /* ── Track Y position from touch (for toolbar placement only) ───────── */
  document.addEventListener('touchstart', function(e) {
    if (e.touches[0]) _touchY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    // Only track position — actual selection detection is via selectionchange
    if (e.changedTouches[0] && !_bar.contains(e.target)) {
      _touchY = e.changedTouches[0].clientY;
    }
  }, { passive: true });

  /* ── Detect selection via selectionchange + 500ms debounce ──────────── */
  // WHY selectionchange (not touchend):
  //   On iOS & Android, dragging the text selection handles fires selectionchange
  //   continuously but does NOT fire touchend at the document level (handles are
  //   native chrome). So touchend only fires for the initial long-press tap, not
  //   after the user has dragged to their desired selection extent.
  // WHY 500ms debounce:
  //   selectionchange fires on every frame while handles are dragged. We wait
  //   500ms of silence before treating the selection as "settled".
  var _selTimer = null;
  document.addEventListener('selectionchange', function() {
    clearTimeout(_selTimer);
    var sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && sel.toString().trim().length > 0) {
      // Selection exists — debounce 500ms then show bar
      _selTimer = setTimeout(function() {
        var s = window.getSelection();
        if (s && s.rangeCount > 0 && s.toString().trim().length > 0) {
          _range = s.getRangeAt(0).cloneRange();
          showBar();
        }
      }, 500);
    } else {
      // Selection cleared — hide bar quickly (but keep _range for 3-dot menu)
      _selTimer = setTimeout(function() {
        var s = window.getSelection();
        if (!s || !s.toString().trim()) hideBar(false);
      }, 200);
    }
  });

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  function getXPath(node) {
    if (node.id && node.id !== '') return 'id("' + node.id + '")';
    if (node === document.body) return '/html/body';
    if (!node || node === document.documentElement) return '/html';
    if (!node.parentNode) return '';
    var ix = 0, sibs = node.parentNode.childNodes;
    for (var i = 0; i < sibs.length; i++) {
      var s = sibs[i];
      if (s === node) return getXPath(node.parentNode) + '/' + node.tagName.toLowerCase() + '[' + (ix + 1) + ']';
      if (s.nodeType === 1 && s.tagName === node.tagName) ix++;
    }
    return '';
  }
  function getCharOffset(parent, targetNode, targetOff) {
    var r = document.createRange();
    r.setStart(parent, 0);
    r.setEnd(targetNode, targetOff);
    return r.toString().length;
  }

  /* ── Wrap a Range in a <mark> ────────────────────────────────────────── */
  // Fixed: no TreeWalker (crashes when commonAncestorContainer is a text node).
  // surroundContents handles the simple case; extractContents handles italic/link crossing.
  function applyMarkToRange(range, hlId) {
    var mk = document.createElement('mark');
    mk.className = 'ss-hl';
    if (hlId) mk.dataset.hlId = hlId;
    mk.addEventListener('click', function(ev) {
      ev.stopPropagation();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'DELETE_HIGHLIGHT_REQUEST',
        id: mk.dataset.hlId || ''
      }));
    });
    try {
      range.surroundContents(mk);
    } catch(e) {
      var frag = range.extractContents();
      mk.appendChild(frag);
      range.insertNode(mk);
    }
  }

  /* ── Core highlight action ───────────────────────────────────────────── */
  function doHighlight() {
    if (!_range) {
      console.log('[HL] No saved range — select text first');
      return;
    }
    var range = _range;
    var selectedText = range.toString();
    if (!selectedText.trim()) { console.log('[HL] Empty selection'); return; }

    // Capture XPath BEFORE any DOM mutation
    var cp = range.commonAncestorContainer;
    if (cp.nodeType === 3) cp = cp.parentElement;
    var parentPath      = getXPath(cp);
    var startCharOffset = getCharOffset(cp, range.startContainer, range.startOffset);
    var endCharOffset   = getCharOffset(cp, range.endContainer,   range.endOffset);

    applyMarkToRange(range, null);   // draw immediately (optimistic)
    try { window.getSelection().removeAllRanges(); } catch(e) {}
    hideBar(true);

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'HIGHLIGHT_CREATED',
      text: selectedText,
      rangeData: { parentPath: parentPath, startCharOffset: startCharOffset, endCharOffset: endCharOffset }
    }));
  }

  /* ── Toolbar button listeners (addEventListener, NOT onclick="") ─────── */
  document.getElementById('ss-hl').addEventListener('click', function(e) {
    e.stopPropagation(); doHighlight();
  });
  document.getElementById('ss-rd').addEventListener('click', function(e) {
    e.stopPropagation();
    var text = _range ? _range.toString() : '';
    hideBar(false);
    try { window.getSelection().removeAllRanges(); } catch(e2) {}
    if (text.trim()) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TEXT_EXTRACTED', text: text, isSelection: true }));
    }
  });
  document.getElementById('ss-cp').addEventListener('click', function(e) {
    e.stopPropagation();
    var text = _range ? _range.toString() : '';
    hideBar(false);
    try { window.getSelection().removeAllRanges(); } catch(e2) {}
    try { if (navigator.clipboard) navigator.clipboard.writeText(text); } catch(e3) {}
  });

  /* ── Native API ──────────────────────────────────────────────────────── */
  window._ssHighlight = function() { doHighlight(); };  // called by 3-dot menu

  window._ssPatchId = function(realId) {
    document.querySelectorAll('mark.ss-hl:not([data-hl-id])').forEach(function(m) {
      m.dataset.hlId = realId;
    });
  };

  window._ssRemove = function(hlId) {
    document.querySelectorAll('mark[data-hl-id="' + hlId + '"]').forEach(function(mk) {
      var p = mk.parentNode; if (!p) return;
      while (mk.firstChild) p.insertBefore(mk.firstChild, mk);
      p.removeChild(mk);
      try { p.normalize(); } catch(e) {}
    });
    document.querySelectorAll('.hl-ov[data-id="' + hlId + '"]').forEach(function(div) {
      if (div.parentNode) div.parentNode.removeChild(div);
    });
  };

  /* ── Ready signals ────────────────────────────────────────────────────── */
  function signalReady() {
    try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' })); } catch(e) {}
  }
  if (document.readyState === 'complete') signalReady();
  else window.addEventListener('load', signalReady);
  setTimeout(signalReady, 3000);
  setTimeout(signalReady, 8000);

  /* ── Scroll tracking ─────────────────────────────────────────────────── */
  window.addEventListener('scroll', function() {
    var sp  = window.pageYOffset || document.documentElement.scrollTop;
    var max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var pct = max > 0 ? Math.min(100, Math.max(0, (sp / max) * 100)) : 100;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SCROLL', position: sp, percentage: pct }));
  }, { passive: true });

  /* ── PDF page tracking ───────────────────────────────────────────────── */
  var _lastPage = 0;
  var _pgObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        var pg = parseInt(e.target.getAttribute('data-page-num') || '0');
        if (pg && pg !== _lastPage) {
          _lastPage = pg;
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAGE_VIEWED', page: pg }));
        }
      }
    });
  }, { threshold: 0.5 });

  function setupPageTracking() {
    document.querySelectorAll('.page-container').forEach(function(el, i) {
      el.setAttribute('data-page-num', (i + 1).toString());
      _pgObs.observe(el);
    });
  }
  setTimeout(setupPageTracking, 2000);

  var _origZoom = window.updateZoom;
  window.updateZoom = function(sc) { if (_origZoom) _origZoom(sc); setTimeout(setupPageTracking, 1000); };
})();
true;
`;

  // Speech
  const toggleSpeech = async () => {
    if (isSpeaking && !isPaused) { await Speech.pause(); setIsPaused(true); }
    else if (isSpeaking && isPaused) { await Speech.resume(); setIsPaused(false); }
    else {
      webViewRef.current?.injectJavaScript(`
        (function(){
          var sel=window.getSelection().toString();
          var text=sel||(function(){var tl=document.querySelectorAll('.textLayer');return tl.length>0?Array.from(tl).map(function(l){return l.innerText;}).join('\\n'):(document.body.innerText||document.body.textContent);})();
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'TEXT_EXTRACTED',text:text.substring(0,100000),isSelection:!!sel}));
        })();true;
      `);
    }
  };

  const stopSpeech = () => {
    Speech.stop(); setIsSpeaking(false); setIsPaused(false); setCurrentCharIndex(0); setFullText("");
  };

  const startSpeech = (textToRead: string, startFrom: number, speakRate: number) => {
    const rem = textToRead.substring(startFrom);
    if (!rem.trim()) { setIsSpeaking(false); return; }
    setIsSpeaking(true); setIsPaused(false);
    Speech.speak(rem, {
      rate: speakRate,
      onBoundary: (b: any) => setCurrentCharIndex(startFrom + b.charIndex),
      onDone: () => { setIsSpeaking(false); setIsPaused(false); setCurrentCharIndex(0); setFullText(""); },
      onError: () => { setIsSpeaking(false); setIsPaused(false); },
    });
  };

  // ─── Main message handler ────────────────────────────────────────────────
  const onMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "READY") {
        if (!webViewReadyRef.current) {
          setWebViewReady(true);
          setTimeout(() => restoreHighlights(highlightsRef.current), 500);
        }
      } else if (data.type === "PDF_READY") {
        setPdfRendered(true);
      } else if (data.type === "CONSOLE_LOG") {
        console.log("[WebView]:", data.data);
      } else if (data.type === "TEXT_EXTRACTED" && data.text) {
        const clean = data.text.replace(/\s+/g, " ").replace(/Loading PDF\.\.\./g, "").trim();
        if (clean) { setFullText(clean); setCurrentCharIndex(0); startSpeech(clean, 0, rate); }
      } else if (data.type === "HIGHLIGHT_CREATED") {
        if (!bookId) return;
        const res = await saveHighlight({ bookId, text: data.text, rangeData: data.rangeData, color: "yellow" });
        if (res.success && res.data?._id) {
          setHighlights(prev => [...prev, res.data]);
          webViewRef.current?.injectJavaScript(`window._ssPatchId('${res.data._id}'); true;`);
        }
      } else if (data.type === "DELETE_HIGHLIGHT_REQUEST") {
        if (!data.id || !highlightsRef.current.find(h => h._id === data.id)) return;
        Alert.alert("Remove Highlight", "Remove this highlight?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove", style: "destructive", onPress: async () => {
              setHighlights(prev => prev.filter(h => h._id !== data.id));
              const res = await deleteHighlight(data.id);
              if (res.success) {
                webViewRef.current?.injectJavaScript(`window._ssRemove('${data.id}'); true;`);
              } else { fetchHighlights(); }
            }
          },
        ]);
      } else if (data.type === "SCROLL") {
        let pct = data.percentage || 0;
        if (pct > 99) pct = 100; // Snap to 100 for completion
        progressRef.current = pct;
        const maxPct = maxProgressRef.current;

        // Accidental scroll: user scrolled back more than 2% from their furthest point
        if (maxPct > 2 && pct < maxPct - 2 && !showingScrollDialogRef.current) {
          showingScrollDialogRef.current = true;
          Alert.alert(
            "SmartShelf: Accidental Scroll?",
            `You reached ${Math.round(maxPct)}% earlier, but are at ${Math.round(pct)}% now. Which should we save?`,
            [
              {
                text: `Save Current (${Math.round(pct)}%)`,
                onPress: () => {
                  maxProgressRef.current = pct;
                  saveCurrentProgress(pct, true);
                  showingScrollDialogRef.current = false;
                }
              },
              {
                text: `Keep Max (${Math.round(maxPct)}%)`,
                onPress: () => {
                  saveCurrentProgress(maxPct, true);
                  showingScrollDialogRef.current = false;
                }
              },
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => { showingScrollDialogRef.current = false; }
              }
            ]
          );
        } else {
          maxProgressRef.current = Math.max(maxPct, pct);
          if (Math.abs(pct - lastSavedProgress.current) > 1) saveCurrentProgress(pct);
        }

        if (!isPdf) {
          const pg = Math.floor(data.position / 1200) + 1;
          if (!pagesViewedSet.current.has(pg)) { pagesViewedSet.current.add(pg); setSessionPages(p => p + 1); }
        }
      } else if (data.type === "PAGE_VIEWED") {
        if (!pagesViewedSet.current.has(data.page)) { pagesViewedSet.current.add(data.page); setSessionPages(p => p + 1); }
      }
    } catch (err) {
      console.error("Failed to parse WebView message:", err);
    }
  };

  const changeSpeed = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const nextRate = speeds[(speeds.indexOf(rate) + 1) % speeds.length];
    setRate(nextRate);
    if (isSpeaking) { Speech.stop(); setTimeout(() => startSpeech(fullText, currentCharIndex, nextRate), 50); }
  };

  if (!url) {
    return (
      <View style={styles.center}>
        <Text>No document URL provided.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── PDF.js HTML ─────────────────────────────────────────────────────────
  const getPdfJsHtml = (pdfUrl: string) => `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5,user-scalable=yes">
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf_viewer.min.css">
<style>
body{margin:0;padding:0;background:#EBEBEB;overflow-x:auto;}
#pdf-container{display:flex;flex-direction:column;align-items:center;padding:20px 10px;gap:15px;min-width:min-content;}
.page-container{position:relative;box-shadow:0 1px 4px rgba(0,0,0,.2);background:white;overflow:hidden;margin-bottom:20px;-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0);}
canvas{display:block;width:100%!important;height:auto!important;}
.textLayer{-webkit-user-select:auto!important;user-select:auto!important;}
.textLayer span{color:rgba(0,0,0,.01)!important;-webkit-text-fill-color:rgba(0,0,0,.01)!important;}
::selection{background:rgba(0,122,255,.3)!important;}
.hl-ov{background:rgba(255,220,0,.45);position:absolute;z-index:9999;pointer-events:auto;border-radius:2px;cursor:pointer;}
.loading-indicator{color:white;text-align:center;padding:40px;font-size:18px;}
</style>
</head><body>
<div id="loading" class="loading-indicator">Loading PDF...</div>
<div id="pdf-container"></div>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
var url="${pdfUrl}",container=document.getElementById('pdf-container'),loading=document.getElementById('loading'),pdfDoc=null,currentScale=${zoomScale};
window.updateZoom=async function(ns){currentScale=ns;container.innerHTML='';await renderPDF();};
async function renderPDF(){
  try{
    if(!pdfDoc){
      var t=pdfjsLib.getDocument({url:url,httpHeaders:{'ngrok-skip-browser-warning':'true'}});
      t.onProgress=function(p){if(p.total>0)loading.innerText='Loading PDF... '+Math.round(p.loaded/p.total*100)+'%';else loading.innerText='Downloading...';};
      pdfDoc=await t.promise;
    }
    loading.style.display='none';
    var mw=window.innerWidth;
    for(var pn=1;pn<=pdfDoc.numPages;pn++){
      var page=await pdfDoc.getPage(pn);
      var uv=page.getViewport({scale:1.0}),bf=(mw-40)/uv.width,vp=page.getViewport({scale:bf*currentScale});
      var pc=document.createElement('div');pc.className='page-container';pc.style.width=vp.width+'px';pc.style.height=vp.height+'px';container.appendChild(pc);
      var cv=document.createElement('canvas');var ctx=cv.getContext('2d');
      var dpr=window.devicePixelRatio||1;cv.height=vp.height*dpr;cv.width=vp.width*dpr;cv.style.width=vp.width+'px';cv.style.height=vp.height+'px';
      pc.appendChild(cv);
      await page.render({canvasContext:ctx,viewport:vp,transform:dpr!==1?[dpr,0,0,dpr,0,0]:null}).promise;
      var tl=document.createElement('div');tl.className='textLayer';tl.id='page-textLayer-'+pn;tl.style.setProperty('--scale-factor',vp.scale);pc.appendChild(tl);
      var tc=await page.getTextContent();
      pdfjsLib.renderTextLayer({textContent:tc,container:tl,viewport:vp,textDivs:[]});
    }
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'PDF_READY'}));
  }catch(err){loading.innerHTML='<span style="color:#fcc;">Error: '+err.message+'</span>';}
}
renderPDF();
</script>
</body></html>`;

  const getWebViewSource = () => {
    if (isPdf && isLocalUrl) return { html: getPdfJsHtml(urlString!), baseUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/' };
    if (isPdf) return { uri: `https://docs.google.com/viewer?url=${encodeURIComponent(urlString!)}&embedded=true` };
    return { uri: urlString };
  };

  React.useEffect(() => {
    if (pdfRendered && initialProgress > 0 && isPdf) {
      const sp = Math.min(initialProgress, 100);
      webViewRef.current?.injectJavaScript(
        `(function(){var ms=document.documentElement.scrollHeight-document.documentElement.clientHeight;if(ms>0)window.scrollTo(0,ms*(${sp}/100));})();true;`
      );
    }
  }, [pdfRendered, initialProgress, isPdf]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>{title || "Reading"}</Text>

        <View style={styles.headerCenter}>
          <View style={styles.timerBadge}>
            <MaterialCommunityIcons name="clock-outline" size={12} color="#4F7942" />
            <Text style={styles.timerText}>{Math.floor(sessionSeconds / 60)}m {sessionSeconds % 60}s</Text>
          </View>
          {activeMilestone && (
            <View style={[styles.milestoneBadge, { backgroundColor: '#E8F0EA' }]}>
              <MaterialCommunityIcons name="trophy" size={12} color="#4F7942" />
              <Text style={styles.milestoneText}>{Math.floor(milestoneSeconds / 60)}/{activeMilestone.targetMinutes}m</Text>
              <View style={styles.miniProgressBar}>
                <View style={[styles.miniProgressFill, { width: `${Math.min((milestoneSeconds / (activeMilestone.targetMinutes * 60)) * 100, 100)}%` }]} />
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={() => setShowControls(!showControls)} style={styles.iconButton}>
          <MaterialCommunityIcons name="dots-vertical" size={26} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Controls panel */}
      {showControls && (
        <View style={styles.controlsPanel}>
          <TouchableOpacity onPress={toggleSpeech} style={styles.controlBtn}>
            <MaterialCommunityIcons name={isSpeaking && !isPaused ? "pause-circle" : "play-circle"} size={32} color="#4F7942" />
            <Text style={styles.controlLabel}>{isSpeaking && !isPaused ? "Pause" : isPaused ? "Resume" : "Read Aloud"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleManualBookmark} style={styles.controlBtn}>
            <MaterialCommunityIcons name="bookmark" size={32} color="#4F7942" />
            <Text style={styles.controlLabel}>Bookmark</Text>
          </TouchableOpacity>

          {/* Highlight — injects into WebView so _range (last selection) is used */}
          <TouchableOpacity
            onPress={() => {
              setShowControls(false);
              setTimeout(() => {
                webViewRef.current?.injectJavaScript(
                  `if(window._range||true){window._ssHighlight();}true;`
                );
              }, 100);
            }}
            style={styles.controlBtn}
          >
            <MaterialCommunityIcons name="marker" size={32} color="#FFD700" />
            <Text style={styles.controlLabel}>Highlight</Text>
          </TouchableOpacity>

          {isSpeaking && (
            <TouchableOpacity onPress={stopSpeech} style={styles.controlBtn}>
              <MaterialCommunityIcons name="stop-circle" size={32} color="#CD5C5C" />
              <Text style={styles.controlLabel}>Stop</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={changeSpeed} style={styles.controlBtn}>
            <View style={styles.speedBadge}>
              <Text style={styles.speedText}>{rate}x</Text>
            </View>
            <Text style={styles.controlLabel}>Speed</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView — floating #ss-bar toolbar lives inside here */}
      <WebView
        key={urlString}
        ref={webViewRef}
        source={getWebViewSource() as any}
        style={styles.webview}
        onMessage={onMessage}
        injectedJavaScript={injectedJS}
        onLoadEnd={() => {
          if (!isPdf) {
            restoreHighlights(highlights);
            if (initialProgress > 0) {
              const sp = Math.min(initialProgress, 100);
              setTimeout(() => {
                webViewRef.current?.injectJavaScript(
                  `(function(){var ms=document.documentElement.scrollHeight-document.documentElement.clientHeight;if(ms>0)window.scrollTo(0,ms*(${sp}/100));})();true;`
                );
              }, 1000);
            }
          }
        }}
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator color="#4F7942" size="large" style={styles.loading} />}
        scalesPageToFit={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#FFF" },
  header:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#EEE" },
  headerTitle:      { fontSize: 18, fontWeight: "bold", color: "#333", flex: 1, textAlign: "center" },
  iconButton:       { padding: 8 },
  headerRightActions: { flexDirection: "row", alignItems: "center" },
  webview:          { flex: 1 },
  controlsPanel:    { flexDirection: "row", backgroundColor: "#F9F9F9", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#EEE", justifyContent: "space-around", alignItems: "center" },
  controlBtn:       { alignItems: "center" },
  controlLabel:     { fontSize: 12, color: "#666", marginTop: 4 },
  speedBadge:       { backgroundColor: "#4F7942", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, minWidth: 40, alignItems: "center" },
  speedText:        { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  center:           { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loading:          { position: "absolute", top: "50%", left: "50%", transform: [{ translateX: -25 }, { translateY: -25 }] },
  backButton:       { marginTop: 20, padding: 10, backgroundColor: "#4F7942", borderRadius: 5 },
  backText:         { color: "#FFF", fontWeight: "bold" },
  timerBadge:       { flexDirection: "row", alignItems: "center", backgroundColor: "#F0F5EE", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginHorizontal: 8 },
  timerText:        { fontSize: 10, fontWeight: "bold", color: "#4F7942", marginLeft: 4 },
  headerCenter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  milestoneBadge:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 4 },
  milestoneText:    { fontSize: 10, fontWeight: "bold", color: "#4F7942", marginLeft: 4, marginRight: 6 },
  miniProgressBar:  { width: 30, height: 4, backgroundColor: 'rgba(79,121,66,0.2)', borderRadius: 2, overflow: 'hidden' },
  miniProgressFill: { height: '100%', backgroundColor: '#4F7942' },
});
