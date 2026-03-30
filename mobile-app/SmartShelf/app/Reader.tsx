import React from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  const webViewRef = React.useRef<WebView>(null);

  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [rate, setRate] = React.useState(1.0);
  const [showControls, setShowControls] = React.useState(false);
  const [fullText, setFullText] = React.useState("");
  const [currentCharIndex, setCurrentCharIndex] = React.useState(0);
  const [highlights, setHighlights] = React.useState<any[]>([]);
  const highlightsRef = React.useRef<any[]>([]);
  const [webViewReady, _setWebViewReady] = React.useState(false);
  const webViewReadyRef = React.useRef(false);
  const [initialProgress, setInitialProgress] = React.useState<number>(0);
  const progressRef = React.useRef<number>(0);
  const lastSavedProgress = React.useRef<number>(0);
  const [zoomScale, setZoomScale] = React.useState<number>(1.0);

  // --- Reading Stats State ---
  const [sessionSeconds, setSessionSeconds] = React.useState(0);
  const [sessionPages, setSessionPages] = React.useState(0);
  const pagesViewedSet = React.useRef(new Set<number>()); // For PDF unique pages
  const lastSyncSeconds = React.useRef(0);
  const lastSyncPages = React.useRef(0);

  const setWebViewReady = (value: boolean) => {
    webViewReadyRef.current = value;
    _setWebViewReady(value);
  };

  // Keep ref in sync to avoid stale closures in WebView callbacks
  React.useEffect(() => {
    highlightsRef.current = highlights;
  }, [highlights]);

  // Get a stable URL string
  const urlString = Array.isArray(url) ? url[0] : url;
  const bookId = Array.isArray(id) ? id[0] : id;
  const isPdf = urlString?.toLowerCase().endsWith(".pdf");
  const isLocalUrl =
    urlString?.includes("localhost") ||
    urlString?.includes("192.168.") ||
    urlString?.includes("10.") ||
    urlString?.includes("172.") ||
    urlString?.includes(".ngrok-free.dev") ||
    urlString?.includes(".loca.lt");

  // Reset state and stop speech when the URL changes
  React.useEffect(() => {
    if (urlString) {
      Speech.stop();
      setIsSpeaking(false);
      setIsPaused(false);
      setFullText("");
      setCurrentCharIndex(0);
      setWebViewReady(false);
      if (bookId) {
        fetchHighlights();
        fetchInitialProgress();
      }
    }
  }, [urlString, bookId]);



  const fetchInitialProgress = async () => {
    if (!bookId) return;
    console.log(`[Reader] Fetching progress for book: ${bookId}`);
    const res = await getProgress(bookId as string);
    if (res.success && res.data) {
      console.log(`[Reader] Found existing progress: ${res.data.progress}`);
      setInitialProgress(res.data.progress || 0);
      progressRef.current = res.data.progress || 0;
      lastSavedProgress.current = res.data.progress || 0;
    } else {
      console.log(`[Reader] No progress found, initializing...`);
      // First time reading this book, initialize progress record to 0
      // This ensures it shows up in "Current Reading" immediately
      await saveCurrentProgress(0);
    }
  };

  const saveCurrentProgress = async (val: number) => {
    if (!bookId) return;

    // Always allow initial save (val === 0)
    // For others, require significant change (> 100px)
    const isInitial = val === 0;
    const diff = Math.abs(val - lastSavedProgress.current);

    if (!isInitial && diff < 100) return;

    console.log(`[Reader] API SaveProgress: id=${bookId}, val=${val}`);
    const res = await saveProgress(bookId as string, val);
    if (res.success) {
      lastSavedProgress.current = val;
      console.log(`[Reader] API SaveProgress: Success`);
    } else {
      console.warn(`[Reader] API SaveProgress: Failed: ${res.message}`);
    }
  };

  const fetchHighlights = async () => {
    if (!bookId) return;
    const res = await getHighlightsByBook(bookId);
    if (res.success) {
      setHighlights(res.data);
      // Use the ref to check readiness immediately
      if (webViewReadyRef.current) {
        applyHighlightsToWebView(res.data);
      }
    }
  };

  const applyHighlightsToWebView = (highlightsList: any[]) => {
    if (!highlightsList || highlightsList.length === 0) return;

    const script = `
            (function() {
                const highlights = ${JSON.stringify(highlightsList)};
                console.log('--- RESTORING ' + highlights.length + ' HIGHLIGHTS ---');
                
                if (!document.getElementById('highlight-styles')) {
                    const style = document.createElement('style');
                    style.id = 'highlight-styles';
                    style.innerHTML = \`
                        .custom-highlight { 
                            background-color: #ffeb3b !important; 
                            color: #000 !important; 
                            cursor: pointer;
                            padding: 1px 0;
                            border-radius: 2px;
                            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                        }
                    \`;
                    document.head.appendChild(style);
                }

                function getElementByXpath(path) {
                    try { 
                        return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; 
                    } catch (e) { 
                        return null; 
                    }
                }

                function getTextNodeAtCharOffset(parent, targetOffset) {
                    let currentOffset = 0;
                    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, null, false);
                    
                    let node;
                    while (node = walker.nextNode()) {
                        const len = node.textContent.length;
                        if (currentOffset + len >= targetOffset) {
                            return { node: node, offset: targetOffset - currentOffset };
                        }
                        currentOffset += len;
                    }
                    return null;
                }

                function applyHighlight(h) {
                    if (document.querySelector('mark[data-id="' + h._id + '"]')) return true;
                    
                    try {
                        const parent = getElementByXpath(h.rangeData.parentPath) || document.body;
                        const start = getTextNodeAtCharOffset(parent, h.rangeData.startCharOffset);
                        const end = getTextNodeAtCharOffset(parent, h.rangeData.endCharOffset);
                        
                        if (start && end) {
                            const range = document.createRange();
                            range.setStart(start.node, start.offset);
                            range.setEnd(end.node, end.offset);
                            
                            const mark = document.createElement('mark');
                            mark.className = 'custom-highlight';
                            mark.dataset.id = h._id;
                            mark.onclick = function(e) {
                                e.stopPropagation();
                                if(confirm('Remove this highlight?')) {
                                    window.ReactNativeWebView.postMessage(JSON.stringify({type: 'DELETE_HIGHLIGHT', id: h._id}));
                                    this.replaceWith(...this.childNodes);
                                }
                            };
                            
                            try {
                                range.surroundContents(mark);
                            } catch (e) {
                                try {
                                    const content = range.extractContents();
                                    mark.appendChild(content);
                                    range.insertNode(mark);
                                } catch (e2) {
                                    console.log('Final fallback failed for:', h._id);
                                }
                            }
                            return true;
                        }
                    } catch (e) { console.log('Apply Error (' + h._id + '): ' + e.message); }
                    return false;
                }

                let retries = 0;
                function attempt() {
                    let failCount = 0;
                    highlights.forEach(h => { if (!applyHighlight(h)) failCount++; });
                    if (failCount > 0 && retries < 5) {
                        retries++;
                        setTimeout(attempt, 2000);
                    }
                }
                attempt();
            })();
        `;
    webViewRef.current?.injectJavaScript(script);
  };

  // Reading Timer Effect
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSessionSeconds(prev => {
        const next = prev + 1;
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      Speech.stop();
      if (progressRef.current > 0) {
        saveCurrentProgress(progressRef.current);
      }
      syncReadingStatsOnUnmount();
    };
  }, []);



  const syncReadingStatsOnUnmount = async () => {
    const secondsToSync = sessionSeconds - lastSyncSeconds.current;
    const pagesToSync = sessionPages - lastSyncPages.current;

    if (secondsToSync > 0 || pagesToSync > 0) {
      console.log(`[Reader] Syncing unmounted stats: ${secondsToSync}s, ${pagesToSync}p`);
      await updateReadingStats({ timeSpent: secondsToSync, pagesRead: pagesToSync });
    }
  };

  // Periodic Sync Effect
  React.useEffect(() => {
    if (sessionSeconds > 0 && sessionSeconds % 60 === 0) {
      const secondsToSync = sessionSeconds - lastSyncSeconds.current;
      const pagesToSync = sessionPages - lastSyncPages.current;

      if (secondsToSync > 0 || pagesToSync > 0) {
        console.log(`[Reader] Syncing periodic stats: ${secondsToSync}s, ${pagesToSync}p`);
        updateReadingStats({ timeSpent: secondsToSync, pagesRead: pagesToSync });
        lastSyncSeconds.current = sessionSeconds;
        lastSyncPages.current = sessionPages;
      }
    }
  }, [sessionSeconds]);

  const injectedJS = `
        (function() {
            // Console Bridge
            const originalLog = console.log;
            console.log = function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'CONSOLE_LOG',
                    data: Array.from(arguments).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
                }));
                originalLog.apply(console, arguments);
            };

            function getXPath(node) {
                if (node.id && node.id !== '') return 'id("' + node.id + '")';
                if (node.classList && node.classList.contains('textLayer')) {
                    const layers = Array.from(document.querySelectorAll('.textLayer'));
                    return "//div[@class='textLayer'][" + (layers.indexOf(node) + 1) + "]";
                }
                if (node === document.body) return '/html/body';
                if (!node || node === document.documentElement) return '/html';
                if (!node.parentNode) return '';
                
                var ix = 0;
                var siblings = node.parentNode.childNodes;
                for (var i = 0; i < siblings.length; i++) {
                    var sibling = siblings[i];
                    if (sibling === node) return getXPath(node.parentNode) + '/' + node.tagName.toLowerCase() + '[' + (ix + 1) + ']';
                    if (sibling.nodeType === 1 && sibling.tagName === node.tagName) ix++;
                }
            }

            function getCharOffset(parent, targetNode, targetOffset) {
                let offset = 0;
                const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, null, false);
                
                let node;
                while (node = walker.nextNode()) {
                    if (node === targetNode) return offset + targetOffset;
                    offset += node.textContent.length;
                }
                return offset;
            }

            window.createHighlight = function() {
                const sel = window.getSelection();
                if (sel.rangeCount > 0 && sel.toString().trim().length > 0) {
                    const range = sel.getRangeAt(0);
                    
                    // Find a stable parent (like .textLayer or a main contents div)
                    let commonParent = range.commonAncestorContainer.nodeType === 3 
                        ? range.commonAncestorContainer.parentElement 
                        : range.commonAncestorContainer;
                    
                    const stableParent = commonParent.closest('.textLayer') || 
                                       commonParent.closest('article') || 
                                       commonParent.closest('main') || 
                                       commonParent.closest('.content') || 
                                       commonParent;
                    commonParent = stableParent;

                    const parentPath = getXPath(commonParent);
                    const startCharOffset = getCharOffset(commonParent, range.startContainer, range.startOffset);
                    const endCharOffset = getCharOffset(commonParent, range.endContainer, range.endOffset);
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'HIGHLIGHT_CREATED',
                        text: sel.toString(),
                        rangeData: {
                            parentPath: parentPath,
                            startCharOffset: startCharOffset,
                            endCharOffset: endCharOffset
                        }
                    }));
                    
                    const mark = document.createElement('mark');
                    mark.className = 'custom-highlight';
                    try {
                        const content = range.extractContents();
                        mark.appendChild(content);
                        range.insertNode(mark);
                    } catch(e) {
                        console.log('Highlight Error:', e.message);
                    }
                    sel.removeAllRanges();
                }
            };

            const signalReady = () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
                console.log('WebView Loaded & Ready');
            };

            if (document.readyState === 'complete') signalReady();
            else window.addEventListener('load', signalReady);

            // PDF.js Page awareness (if applicable)
            // We'll track which page is in view via intersection observer or scroll
            let lastPageInView = 0;
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const pageNum = parseInt(entry.target.getAttribute('data-page-num'));
                        if (pageNum !== lastPageInView) {
                            lastPageInView = pageNum;
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'PAGE_VIEWED',
                                page: pageNum
                            }));
                        }
                    }
                });
            }, { threshold: 0.5 });

            function setupPageTracking() {
                document.querySelectorAll('.page-container').forEach((el, idx) => {
                    el.setAttribute('data-page-num', (idx + 1).toString());
                    observer.observe(el);
                });
            }
            
            // Re-setup when content changes
            const originalUpdateZoom = window.updateZoom;
            window.updateZoom = function(scale) {
                if (originalUpdateZoom) originalUpdateZoom(scale);
                setTimeout(setupPageTracking, 1000);
            };
            setTimeout(setupPageTracking, 2000);

            // Scroll position tracking
            window.addEventListener('scroll', function() {
                const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'SCROLL',
                    position: scrollPos
                }));
            });

            // Handle restoration request from native
            window.addEventListener('message', function(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'RESTORE_SCROLL') {
                        window.scrollTo(0, data.position);
                        console.log('Restored scroll to:', data.position);
                    }
                } catch(e) {}
            });

            setTimeout(signalReady, 3000);
            setTimeout(signalReady, 8000);
        })();
    `;

  const handleHighlight = () => {
    webViewRef.current?.injectJavaScript("window.createHighlight();");
  };

  const toggleSpeech = async () => {
    if (isSpeaking && !isPaused) {
      await Speech.pause();
      setIsPaused(true);
    } else if (isSpeaking && isPaused) {
      await Speech.resume();
      setIsPaused(false);
    } else {
      webViewRef.current?.injectJavaScript(`
                (function() {
                    let text = '';
                    const selection = window.getSelection().toString();
                    if (selection) {
                        text = selection;
                    } else {
                        // For PDF.js, document.body.innerText is messy.
                        // Better to extract only from textLayer nodes
                        const textLayers = document.querySelectorAll('.textLayer');
                        if (textLayers.length > 0) {
                            text = Array.from(textLayers).map(l => l.innerText).join('\\n');
                        } else {
                            text = document.body.innerText || document.body.textContent;
                        }
                    }
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({ 
                        type: 'TEXT_EXTRACTED', 
                        text: text.substring(0, 100000),
                        isSelection: !!selection 
                    }));
                })();
            `);
    }
  };

  const stopSpeech = () => {
    Speech.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentCharIndex(0);
    setFullText("");
  };

  const startSpeech = (
    textToRead: string,
    startFrom: number,
    speakRate: number,
  ) => {
    const remainingText = textToRead.substring(startFrom);
    if (!remainingText.trim()) {
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    setIsPaused(false);

    Speech.speak(remainingText, {
      rate: speakRate,
      onBoundary: (boundary: any) => {
        setCurrentCharIndex(startFrom + boundary.charIndex);
      },
      onDone: () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentCharIndex(0);
        setFullText("");
      },
      onError: (err) => {
        console.error("Speech error:", err);
        setIsSpeaking(false);
        setIsPaused(false);
      },
    });
  };

  const onMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "READY") {
        if (!webViewReadyRef.current) {
          console.log("WebView Ready Signal received");
          setWebViewReady(true);
          // Restore scroll position if we have it
          if (initialProgress > 0) {
            webViewRef.current?.injectJavaScript(`window.scrollTo(0, ${initialProgress});`);
          }
          // Short delay to ensure PDF.js has finished absolute positioning
          setTimeout(
            () => applyHighlightsToWebView(highlightsRef.current),
            500,
          );
        }
      } else if (data.type === "CONSOLE_LOG") {
        console.log("[WebView Log]:", data.data);
      } else if (data.type === "TEXT_EXTRACTED" && data.text) {
        // Clean up PDF.js text (it often has double spaces or weird line breaks)
        const cleanText = data.text
          .replace(/\s+/g, " ")
          .replace(/Loading PDF\.\.\./g, "")
          .trim();

        if (cleanText) {
          setFullText(cleanText);
          setCurrentCharIndex(0);
          startSpeech(cleanText, 0, rate);
        }
      } else if (data.type === "HIGHLIGHT_CREATED") {
        if (!bookId) return;
        const res = await saveHighlight({
          bookId,
          text: data.text,
          rangeData: data.rangeData,
          color: "yellow",
        });
        if (res.success) {
          setHighlights((prev) => [...prev, res.data]);
        }
      } else if (data.type === "DELETE_HIGHLIGHT") {
        const res = await deleteHighlight(data.id);
        if (res.success) {
          setHighlights((prev) => prev.filter((h) => h._id !== data.id));
        }
      } else if (data.type === "SCROLL") {
        progressRef.current = data.position;
        // Auto-save on significant scroll
        if (Math.abs(data.position - lastSavedProgress.current) > 500) {
          saveCurrentProgress(data.position);
        }

        if (!isPdf) {
          const estimatedPage = Math.floor(data.position / 1200) + 1;
          if (!pagesViewedSet.current.has(estimatedPage)) {
            pagesViewedSet.current.add(estimatedPage);
            setSessionPages(prev => {
              const next = prev + 1;
              return next;
            });
          }
        }
      } else if (data.type === "PAGE_VIEWED") {
        // Precise page tracking for PDF
        if (!pagesViewedSet.current.has(data.page)) {
          pagesViewedSet.current.add(data.page);
          setSessionPages(prev => {
            const next = prev + 1;
            return next;
          });
          console.log(
            `[Reader] Unique page viewed: ${data.page}. Session total: ${pagesViewedSet.current.size}`,
          );
        }
      }
    } catch (err) {
      console.error("Failed to parse message:", err);
    }
  };

  const changeSpeed = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const nextIndex = (speeds.indexOf(rate) + 1) % speeds.length;
    const nextRate = speeds[nextIndex];
    setRate(nextRate);

    if (isSpeaking) {
      Speech.stop();
      setTimeout(() => {
        startSpeech(fullText, currentCharIndex, nextRate);
      }, 50);
    }
  };

  const handleZoom = (direction: "in" | "out") => {
    const newScale = direction === "in" ? zoomScale + 0.2 : zoomScale - 0.2;
    const clampedScale = Math.max(0.5, Math.min(3.0, newScale));
    setZoomScale(clampedScale);

    // Inject scale update to WebView
    webViewRef.current?.injectJavaScript(`
      if (window.updateZoom) {
        window.updateZoom(${clampedScale});
      }
    `);
  };

  if (!url) {
    return (
      <View style={styles.center}>
        <Text>No document URL provided.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Generate PDF.js HTML template for local PDFs
  const getPdfJsHtml = (pdfUrl: string) => `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
            <style>
                body { margin: 0; padding: 0; background: #2f3337; font-family: 'Inter', sans-serif; overflow-x: auto; }
                #pdf-container { 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    padding: 20px 10px; 
                    gap: 15px; 
                    min-width: min-content;
                }
                .page-container { 
                    position: relative; 
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3); 
                    background: white; 
                    overflow: hidden;
                    border-radius: 4px;
                    margin-bottom: 20px;
                }
                canvas { display: block; width: 100% !important; height: auto !important; }
                .textLayer {
                    position: absolute; left: 0; top: 0; right: 0; bottom: 0;
                    overflow: hidden; opacity: 1.0; line-height: 1.0;
                    pointer-events: auto;
                }
                .textLayer > span {
                    color: transparent !important; 
                    position: absolute; 
                    white-space: pre; 
                    cursor: text;
                    transform-origin: 0% 0%;
                    pointer-events: auto;
                    -webkit-text-fill-color: transparent !important;
                }
                /* Custom Highlighting Styles - Essential for PDF.js */
                .custom-highlight { 
                    background-color: rgba(255, 235, 0, 0.45) !important; 
                    color: transparent !important;
                    display: inline !important;
                    position: static !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    border: none !important;
                    mix-blend-mode: multiply;
                }
                .custom-highlight span {
                    color: transparent !important;
                    -webkit-text-fill-color: transparent !important;
                }
                .loading-indicator { 
                    color: white; 
                    text-align: center; 
                    padding: 40px; 
                    font-size: 18px; 
                }
                ::selection {
                    background: rgba(0, 120, 215, 0.2);
                    color: transparent;
                }
            </style>
        </head>
        <body>
            <div id="loading" class="loading-indicator">Loading PDF...</div>
            <div id="pdf-container"></div>

            <script>
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                
                const url = "${pdfUrl}";
                const container = document.getElementById('pdf-container');
                const loading = document.getElementById('loading');
                let pdfDoc = null;
                let currentScale = ${zoomScale};

                window.updateZoom = async function(newScale) {
                    currentScale = newScale;
                    container.innerHTML = '';
                    await renderPDF();
                    // Re-scroll to previous position roughly
                    window.scrollTo(0, window.pageYOffset);
                };

                async function renderPDF() {
                    try {
                        if (!pdfDoc) {
                            const loadingTask = pdfjsLib.getDocument(url);
                            pdfDoc = await loadingTask.promise;
                        }
                        loading.style.display = 'none';

                        const maxWidth = window.innerWidth;

                        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                            const page = await pdfDoc.getPage(pageNum);
                            
                            // Base scale to fit mobile screen
                            const unscaledViewport = page.getViewport({ scale: 1.0 });
                            const baseFitScale = (maxWidth - 40) / unscaledViewport.width;
                            
                            // Apply user zoom on top of base fit
                            const viewport = page.getViewport({ scale: baseFitScale * currentScale });

                            const pageContainer = document.createElement('div');
                            pageContainer.className = 'page-container';
                            pageContainer.style.width = viewport.width + 'px';
                            pageContainer.style.height = viewport.height + 'px';
                            container.appendChild(pageContainer);

                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');
                            
                            // Use devicePixelRatio for sharper rendering on zoom
                            const dpr = window.devicePixelRatio || 1;
                            canvas.height = viewport.height * dpr;
                            canvas.width = viewport.width * dpr;
                            // Reset CSS display size
                            canvas.style.width = viewport.width + 'px';
                            canvas.style.height = viewport.height + 'px';
                            
                            pageContainer.appendChild(canvas);
                            
                            const renderContext = {
                                canvasContext: context,
                                viewport: viewport,
                                transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null
                            };
                            
                            await page.render(renderContext).promise;

                            const textLayerDiv = document.createElement('div');
                            textLayerDiv.className = 'textLayer';
                            pageContainer.appendChild(textLayerDiv);
                            
                            const textContent = await page.getTextContent();
                            pdfjsLib.renderTextLayer({
                                textContent: textContent,
                                container: textLayerDiv,
                                viewport: viewport,
                                textDivs: []
                            });
                        }
                        
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
                    } catch (err) {
                        loading.innerText = 'Error loading PDF: ' + err.message;
                        console.error(err);
                    }
                }

                renderPDF();
            </script>
        </body>
        </html>
    `;

  //pdf
  const getWebViewSource = () => {
    if (isPdf && isLocalUrl) {
      return { html: getPdfJsHtml(urlString!) };
    }
    if (isPdf) {
      return {
        uri: `https://docs.google.com/viewer?url=${encodeURIComponent(urlString!)}&embedded=true`,
      };
    }
    return { uri: urlString };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || "Reading"}
        </Text>
        <View style={styles.timerBadge}>
          <MaterialCommunityIcons name="clock-outline" size={12} color="#4F7942" />
          <Text style={styles.timerText}>{Math.floor(sessionSeconds / 60)}m {sessionSeconds % 60}s</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowControls(!showControls)}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {showControls && (
        <View style={styles.controlsPanel}>
          <TouchableOpacity onPress={toggleSpeech} style={styles.controlBtn}>
            <MaterialCommunityIcons
              name={isSpeaking && !isPaused ? "pause-circle" : "play-circle"}
              size={32}
              color="#4F7942"
            />
            <Text style={styles.controlLabel}>
              {isSpeaking && !isPaused
                ? "Pause"
                : isPaused
                  ? "Resume"
                  : "Read Aloud"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleHighlight} style={styles.controlBtn}>
            <MaterialCommunityIcons name="marker" size={32} color="#FFD700" />
            <Text style={styles.controlLabel}>Highlight</Text>
          </TouchableOpacity>

          {isSpeaking && (
            <TouchableOpacity onPress={stopSpeech} style={styles.controlBtn}>
              <MaterialCommunityIcons
                name="stop-circle"
                size={32}
                color="#CD5C5C"
              />
              <Text style={styles.controlLabel}>Stop</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={changeSpeed} style={styles.controlBtn}>
            <View style={styles.speedBadge}>
              <Text style={styles.speedText}>{rate}x</Text>
            </View>
            <Text style={styles.controlLabel}>Speed</Text>
          </TouchableOpacity>

          {isPdf && (
            <>
              <TouchableOpacity onPress={() => handleZoom("out")} style={styles.controlBtn}>
                <MaterialCommunityIcons name="magnify-minus-outline" size={32} color="#4F7942" />
                <Text style={styles.controlLabel}>Zoom Out</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleZoom("in")} style={styles.controlBtn}>
                <MaterialCommunityIcons name="magnify-plus-outline" size={32} color="#4F7942" />
                <Text style={styles.controlLabel}>Zoom In</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      <WebView
        key={urlString}
        ref={webViewRef}
        source={getWebViewSource() as any}
        style={styles.webview}
        onMessage={onMessage}
        injectedJavaScript={injectedJS}
        onLoadEnd={() => {
          applyHighlightsToWebView(highlights);
          if (initialProgress > 0) {
            setTimeout(() => {
              webViewRef.current?.injectJavaScript(`window.scrollTo(0, ${initialProgress});`);
            }, 1000); // Wait bit more for content to actually height-up
          }
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <ActivityIndicator
            color="#4F7942"
            size="large"
            style={styles.loading}
          />
        )}
        scalesPageToFit={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  iconButton: {
    padding: 5,
  },
  webview: {
    flex: 1,
  },
  controlsPanel: {
    flexDirection: "row",
    backgroundColor: "#F9F9F9",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    justifyContent: "space-around",
    alignItems: "center",
  },
  controlBtn: {
    alignItems: "center",
  },
  controlLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  speedBadge: {
    backgroundColor: "#4F7942",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: "center",
  },
  speedText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loading: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  backButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#4F7942",
    borderRadius: 5,
  },
  backText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F5EE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  timerText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4F7942",
    marginLeft: 4,
  },
});
