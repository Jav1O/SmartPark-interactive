// Conductor: voz, gestos y comunicacion con el servidor

import {
  FilesetResolver,
  HandLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

// Conexion al servidor: mismo origen que la URL abierta en el movil o PC
const socket = io(window.location.origin, {
  transports: ['polling', 'websocket'],
});
const secureContext = window.isSecureContext;
const runtimeCapabilities = {
  camera: Boolean(navigator.mediaDevices?.getUserMedia),
  geolocation: Boolean(navigator.geolocation),
  voiceRecognition: Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
};

// Estado general de la app
const state = {
  parkings: [],
  currentParkingIndex: 0,
  currentParking: null,
  currentSpots: [],
  reservation: null,          // { parkingId, parkingName, spot }
  reservationTimerInterval: null,
  reservationEndTime: null,

  voiceActive: false,
  gesturesActive: false,
  urgentMode: false,

  // Geolocalización
  userPosition: null,         // { lat, lng }
  geoWatchId: null,
  geoActive: false,
  arrivalDetected: false,

  // Mapas Leaflet
  detailMap: null,
  navMap: null,
  userMarker: null,
  parkingMarker: null,
  routeLine: null,
  navUserMarker: null,
  navParkingMarker: null,
  navRouteLine: null,

  // Gestos — sistema de estabilidad robusto
  handLandmarker: null,
  webcamRunning: false,
  lastGestureTime: 0,
  gestureDelay: 1200,

  gestureBuffer: [],
  gestureBufferSize: 4,

  gestureCooldownActive: false,
  nullFrameCount: 0,
  requiredNullFrames: 6,

  processingAction: false,
  webcamListenerAttached: false,
};

// Elementos del DOM
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
  connectionStatus: $('#connectionStatus'),
  voiceIndicator: $('#voiceIndicator'),
  voiceStatus: $('#voiceStatus'),
  gestureIndicator: $('#gestureIndicator'),
  gestureStatus: $('#gestureStatus'),
  commandFeedback: $('#commandFeedback'),
  commandText: $('#commandText'),

  viewParkingList: $('#viewParkingList'),
  viewParkingDetail: $('#viewParkingDetail'),
  viewReservation: $('#viewReservation'),
  viewNavigation: $('#viewNavigation'),
  viewArrived: $('#viewArrived'),
  parkingCards: $('#parkingCards'),
  parkingDetailCard: $('#parkingDetailCard'),
  spotsGrid: $('#spotsGrid'),

  // Navegación
  navTitle: $('#navTitle'),
  navSpotInfo: $('#navSpotInfo'),
  navDistanceValue: $('#navDistanceValue'),
  navStatusText: $('#navStatusText'),
  navStatusBar: $('#navStatusBar'),
  btnArrived: $('#btnArrived'),
  btnCancelNav: $('#btnCancelNav'),

  // Llegada
  arrivedTitle: $('#arrivedTitle'),
  arrivedDetail: $('#arrivedDetail'),
  arrivedSpotMap: $('#arrivedSpotMap'),
  btnFinish: $('#btnFinish'),

  reservationCard: $('#reservationCard'),
  reservationTitle: $('#reservationTitle'),
  reservationDetail: $('#reservationDetail'),
  reservationTimer: $('#reservationTimer'),

  btnUrgent: $('#btnUrgent'),
  btnBack: $('#btnBack'),
  btnConfirm: $('#btnConfirm'),
  btnCancel: $('#btnCancel'),
  btnVoice: $('#btnVoice'),
  btnGestures: $('#btnGestures'),
  btnLocation: $('#btnLocation'),
  btnSearch: $('#btnSearch'),
  btnToggleCam: $('#btnToggleCam'),

  webcamContainer: $('#webcamContainer'),
  webcam: $('#webcam'),
  gestureCanvas: $('#gestureCanvas'),
  gestureLabel: $('#gestureLabel'),
  gestureConfidence: $('#gestureConfidence'),
  micIcon: $('#micIcon'),
};

function showRuntimeWarning(message) {
  console.warn(message);
  showCommandFeedback(`⚠️ ${message}`);
}

function requireSecureContext(featureLabel) {
  if (secureContext) return true;
  showRuntimeWarning(`Abre SmartPark con HTTPS para usar ${featureLabel}.`);
  return false;
}

function featureUnavailable(featureLabel, details) {
  const message = details
    ? `${featureLabel} no disponible: ${details}`
    : `${featureLabel} no está disponible en este navegador.`;
  showRuntimeWarning(message);
  speak(message);
}

function showStartupHints() {
  if (!secureContext) {
    els.voiceStatus.textContent = 'Se necesita HTTPS en móvil';
    els.gestureStatus.textContent = 'Gestos requieren HTTPS';
    showRuntimeWarning('Abre la app desde una URL HTTPS para usar voz, cámara y GPS en el móvil.');
  }

  if (!runtimeCapabilities.voiceRecognition) {
    els.voiceStatus.textContent = 'Voz no compatible';
  }

  if (!runtimeCapabilities.camera) {
    els.gestureStatus.textContent = 'Cámara no compatible';
  }
}

// Eventos de conexion Socket.IO

socket.on('connect', () => {
  els.connectionStatus.classList.add('connected');
  els.connectionStatus.querySelector('span:last-child').textContent = 'Conectado';
  console.log('✅ Conectado al servidor');
  // Pedir lista al conectar
  setTimeout(() => {
    socket.emit('requestParkingList');
  }, 500);
});

socket.on('disconnect', () => {
  els.connectionStatus.classList.remove('connected');
  els.connectionStatus.querySelector('span:last-child').textContent = 'Desconectado';
});

socket.on('connect_error', (error) => {
  console.error('❌ Error conectando con Socket.IO:', error);
  showRuntimeWarning('No se pudo conectar con el servidor. Revisa la URL publica del tunel o la red local.');
});

// Recibir lista de parkings
socket.on('parkingList', (list) => {
  state.parkings = list;
  state.currentParkingIndex = 0;
  renderParkingList();
  speak(`He encontrado ${list.length} parkings cercanos. ${list[0].name} tiene ${list[0].freeSpots} plazas libres.`);
});

// Recibir detalle de parking
socket.on('parkingDetail', (data) => {
  state.currentParking = data;
  state.currentSpots = data.spots;
  renderParkingDetail(data);
  showView('detail');
  unlockProcessing();
});

// Reserva confirmada por servidor
socket.on('reservationConfirmed', (data) => {
  state.reservation = {
    parkingId: data.parkingId,
    parkingName: data.parkingName,
    spot: data.spot,
    parkingLat: data.parkingLat,
    parkingLng: data.parkingLng
  };
  renderReservation(data);
  showView('reservation');
  startReservationTimer();
  speak(data.message);
  unlockProcessing();
});

// Confirmación exitosa: pasar a Navegación
socket.on('confirmationSuccess', (data) => {
  state.reservation.spot = data.spot;
  state.reservation.parkingLat = data.parkingLat;
  state.reservation.parkingLng = data.parkingLng;
  stopReservationTimer();
  speak(data.message);
  showNavigationView(data);
  unlockProcessing();
});

// Llegada detectada por GPS
socket.on('arrivalConfirmed', (data) => {
  if (state.arrivalDetected) return;
  state.arrivalDetected = true;
  stopGeolocation();
  speak(`Has llegado a ${data.parkingName}. Tu plaza asignada es la ${data.spot.label}.`);
  showArrivedView(data);
});

// Cancelación exitosa
socket.on('cancellationSuccess', (data) => {
  state.reservation = null;
  stopReservationTimer();
  showView('list');
  speak(data.message);
  socket.emit('requestParkingList');
  unlockProcessing();
});

// Actualización de parking en tiempo real
socket.on('parkingUpdate', (data) => {
  // Actualizar la lista local
  const idx = state.parkings.findIndex(p => p.id === data.parkingId);
  if (idx >= 0 && data.parking) {
    state.parkings[idx] = data.parking;
  }
  // Si estamos viendo la lista, re-renderizar
  if (els.viewParkingList.classList.contains('active')) {
    renderParkingList();
  }
  // Si estamos viendo el detalle de este parking
  if (els.viewParkingDetail.classList.contains('active') && state.currentParking && state.currentParking.id === data.parkingId) {
    state.currentSpots = data.spots;
    renderSpotsGrid(data.spots);
  }
});

// Modo urgente
socket.on('urgentResult', (data) => {
  state.urgentMode = true;
  els.btnUrgent.classList.add('active');
  speak(data.message);

  // Navegar al parking urgente
  const idx = state.parkings.findIndex(p => p.id === data.parking.id);
  if (idx >= 0) {
    state.currentParkingIndex = idx;
    renderParkingList();
    showCommandFeedback(`🚨 ${data.parking.name} — ${data.parking.freeSpots} libres`);
  }
  unlockProcessing();
});

// Errores
socket.on('error', (data) => {
  speak(data.message);
  showCommandFeedback(`⚠️ ${data.message}`);
  unlockProcessing();
});

// Reconocimiento de voz

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

function startVoiceRecognition() {
  if (!requireSecureContext('el reconocimiento de voz')) {
    return;
  }

  if (!SpeechRecognition || !runtimeCapabilities.voiceRecognition) {
    featureUnavailable('Reconocimiento de voz', 'tu navegador no lo soporta');
    return;
  }

  if (state.voiceActive) {
    stopVoiceRecognition();
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onstart = () => {
    state.voiceActive = true;
    els.voiceIndicator.classList.add('active');
    els.voiceStatus.textContent = 'Escuchando...';
    els.btnVoice.classList.add('active');
    console.log('🎙️ Reconocimiento de voz iniciado');
  };

  recognition.onresult = (event) => {
    const last = event.results.length - 1;
    const command = event.results[last][0].transcript.toLowerCase().trim();
    console.log(`🎙️ Comando: "${command}"`);
    showCommandFeedback(`🎙️ "${command}"`);
    handleVoiceCommand(command);
  };

  recognition.onerror = (event) => {
    console.log('❌ Error de voz:', event.error);
    if (event.error === 'no-speech') {
      // Reiniciar silenciosamente
    } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      els.voiceStatus.textContent = 'Permiso de microfono denegado';
      showRuntimeWarning('Debes permitir el microfono para usar la voz.');
    } else {
      els.voiceStatus.textContent = `Error: ${event.error}`;
    }
  };

  recognition.onend = () => {
    // Reiniciar automáticamente si sigue activo
    if (state.voiceActive) {
      try {
        recognition.start();
      } catch (e) {
        console.log('Reintentando reconocimiento...');
        setTimeout(() => {
          if (state.voiceActive) {
            try { recognition.start(); } catch (e2) { /* silenciar */ }
          }
        }, 300);
      }
    }
  };

  recognition.start();
}

function stopVoiceRecognition() {
  state.voiceActive = false;
  if (recognition) {
    recognition.abort();
  }
  els.voiceIndicator.classList.remove('active');
  els.voiceStatus.textContent = 'Voz desactivada';
  els.btnVoice.classList.remove('active');
}

function handleVoiceCommand(command) {
  // buscar aparcamiento
  if (command.includes('buscar') && (command.includes('aparcamiento') || command.includes('parking') || command.includes('aparcar'))) {
    socket.emit('requestParkingList');
    showCommandFeedback('🔍 Buscando parkings...');
    return;
  }

  // siguiente parking
  if (command.includes('siguiente')) {
    navigateParking(1);
    return;
  }

  // anterior
  if (command.includes('anterior')) {
    navigateParking(-1);
    return;
  }

  // reservar
  if (command.includes('reservar') || command.includes('reserva')) {
    actionReserve();
    return;
  }

  // confirmar
  if (command.includes('confirmar')) {
    actionConfirm();
    return;
  }

  // he llegado
  if (command.includes('llegado') || command.includes('estoy aqui')) {
    actionArrived();
    return;
  }

  // cancelar
  if (command.includes('cancelar') || command.includes('cancela') || command.includes('salir') || command.includes('no')) {
    actionCancel();
    return;
  }

  // modo urgente
  if (command.includes('urgente') || command.includes('urgencia') || command.includes('prisa')) {
    actionUrgent();
    return;
  }

  // ver detalle
  if (command.includes('ver') || command.includes('detalle') || command.includes('entrar')) {
    actionViewDetail();
    return;
  }

  // volver
  if (command.includes('volver') || command.includes('atrás')) {
    actionGoBack();
    return;
  }

  // ayuda
  if (command.includes('ayuda') || command.includes('comandos')) {
    speak('Puedes decir: buscar aparcamiento, siguiente, anterior, reservar, confirmar, cancelar, modo urgente, ver detalle, o volver.');
    return;
  }

  // No reconocido
  speak('No he entendido. Di ayuda para ver los comandos disponibles.');
}

// Sintesis de voz
function speak(text) {
  const synth = window.speechSynthesis;
  // Cancelar cualquier síntesis previa
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 1.1;
  utterance.pitch = 1.0;
  synth.speak(utterance);
  console.log(`🔊 TTS: "${text}"`);
}

// Deteccion de gestos con MediaPipe

async function initHandLandmarker() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    state.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
    });

    console.log('✋ HandLandmarker inicializado');
    return true;
  } catch (error) {
    console.error('Error inicializando HandLandmarker:', error);
    speak('No se pudo inicializar la detección de gestos.');
    return false;
  }
}

async function startGestureDetection() {
  if (state.gesturesActive) {
    stopGestureDetection();
    return;
  }

  if (!requireSecureContext('la camara y los gestos')) {
    return;
  }

  if (!runtimeCapabilities.camera) {
    featureUnavailable('Camara', 'navigator.mediaDevices.getUserMedia no esta disponible');
    return;
  }

  try {
    // 1. Pedir permisos de cámara INMEDIATAMENTE para evitar bloqueos de iOS/Safari
    showCommandFeedback('📷 Solicitando cámara...');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
      audio: false,
    });

    els.webcam.srcObject = stream;
    state.gesturesActive = true;
    state.webcamRunning = true;

    els.webcamContainer.classList.add('active');
    els.gestureIndicator.classList.add('active');
    els.gestureStatus.textContent = 'Gestos: cargando...';
    els.btnGestures.classList.add('active');

    // Registrar listener INMEDIATAMENTE para no perder el evento loadeddata
    if (!state.webcamListenerAttached) {
      state.webcamListenerAttached = true;
      els.webcam.addEventListener('loadeddata', () => {
        els.gestureCanvas.width = els.webcam.videoWidth;
        els.gestureCanvas.height = els.webcam.videoHeight;
        if (state.gesturesActive) {
          predictGestures();
        }
      });
    } else {
      if (els.webcam.readyState >= 2) {
        els.gestureCanvas.width = els.webcam.videoWidth;
        els.gestureCanvas.height = els.webcam.videoHeight;
        predictGestures();
      }
    }

    // 2. Cargar modelo IA
    if (!state.handLandmarker) {
      showCommandFeedback('⏳ Cargando detector IA...');
      const ok = await initHandLandmarker();
      if (!ok) {
        stopGestureDetection();
        return;
      }
    }

    els.gestureStatus.textContent = 'Gestos: activos';
    showCommandFeedback('✋ Gestos listos');

    // Resetear sistema de estabilidad
    state.gestureBuffer = [];
    state.gestureCooldownActive = false;
    state.nullFrameCount = 0;
    state.processingAction = false;

  } catch (error) {
    console.error('Error accediendo a la cámara:', error);
    speak('Debes dar permisos de cámara para usar los gestos.');
    showCommandFeedback('❌ Error de cámara');
    stopGestureDetection();
  }
}

function stopGestureDetection() {
  state.gesturesActive = false;
  state.webcamRunning = false;

  // Resetear sistema de estabilidad
  state.gestureBuffer = [];
  state.gestureCooldownActive = false;
  state.nullFrameCount = 0;

  if (els.webcam.srcObject) {
    els.webcam.srcObject.getTracks().forEach(t => t.stop());
    els.webcam.srcObject = null;
  }

  els.webcamContainer.classList.remove('active');
  els.gestureIndicator.classList.remove('active');
  els.gestureStatus.textContent = 'Gestos: desactivados';
  els.btnGestures.classList.remove('active');
  hideGestureLabel();
  updateConfidenceBar(0);
}

// Bucle de prediccion de gestos
async function predictGestures() {
  if (!state.gesturesActive) return;

  // Si el detector aún está descargando, esperamos al siguiente frame
  if (!state.handLandmarker) {
    if (state.webcamRunning) requestAnimationFrame(predictGestures);
    return;
  }

  const now = performance.now();

  try {
    const results = state.handLandmarker.detectForVideo(els.webcam, now);
    const ctx = els.gestureCanvas.getContext('2d');
    ctx.clearRect(0, 0, els.gestureCanvas.width, els.gestureCanvas.height);

    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];
      drawHandLandmarks(ctx, landmarks);

      // Clasificar gesto (sin efectos, solo clasificación)
      const gesture = classifyGestureRaw(landmarks);

      if (gesture) {
        // Añadir al buffer de estabilidad
        state.gestureBuffer.push(gesture);
        if (state.gestureBuffer.length > state.gestureBufferSize) {
          state.gestureBuffer.shift();
        }
        state.nullFrameCount = 0;

        // Mostrar label según confianza
        const confidence = getBufferConfidence();
        showGestureLabel(getGestureLabel(gesture), confidence);
        updateConfidenceBar(confidence);

      } else {
        // Gesto nulo: incrementar contador y limpiar buffer
        state.nullFrameCount++;
        state.gestureBuffer = [];
        hideGestureLabel();
        updateConfidenceBar(0);

        // Liberar cooldown después de suficientes frames sin gesto
        if (state.gestureCooldownActive && state.nullFrameCount >= state.requiredNullFrames) {
          state.gestureCooldownActive = false;
        }
      }

      // comprobar si se puede disparar
      if (
        !state.gestureCooldownActive &&
        !state.processingAction &&
        state.gestureBuffer.length >= state.gestureBufferSize &&
        isBufferUniform() &&
        (now - state.lastGestureTime > state.gestureDelay)
      ) {
        const confirmedGesture = state.gestureBuffer[0];

        // Disparar acción
        state.lastGestureTime = now;
        state.gestureCooldownActive = true;
        state.gestureBuffer = [];
        state.processingAction = true;

        handleGesture(confirmedGesture);
      }

    } else {
      // No se detectó mano → resetear
      state.gestureBuffer = [];
      state.nullFrameCount++;
      hideGestureLabel();
      updateConfidenceBar(0);

      if (state.gestureCooldownActive && state.nullFrameCount >= state.requiredNullFrames) {
        state.gestureCooldownActive = false;
      }
    }
  } catch (e) {
    // Silenciar errores de predicción
  }

  if (state.webcamRunning) {
    requestAnimationFrame(predictGestures);
  }
}

// Comprueba que todo el buffer tenga el mismo gesto
function isBufferUniform() {
  if (state.gestureBuffer.length === 0) return false;
  const first = state.gestureBuffer[0];
  return state.gestureBuffer.every(g => g === first);
}

// Nivel de confianza segun el buffer (0 a 1)
function getBufferConfidence() {
  if (state.gestureBuffer.length === 0) return 0;
  const first = state.gestureBuffer[state.gestureBuffer.length - 1];
  const matching = state.gestureBuffer.filter(g => g === first).length;
  return matching / state.gestureBufferSize;
}

// Libera el bloqueo para aceptar nuevos gestos
function unlockProcessing() {
  // Dar un pequeño delay para que la UI se actualice antes de aceptar nuevos gestos
  setTimeout(() => {
    state.processingAction = false;
  }, 500);
}

// Dibuja los puntos y lineas de la mano en el canvas
function drawHandLandmarks(ctx, landmarks) {
  const w = els.gestureCanvas.width;
  const h = els.gestureCanvas.height;

  // Conexiones de la mano
  const connections = [
    [0,1],[1,2],[2,3],[3,4],       // Pulgar
    [0,5],[5,6],[6,7],[7,8],       // Índice
    [0,9],[9,10],[10,11],[11,12],   // Medio
    [0,13],[13,14],[14,15],[15,16], // Anular
    [0,17],[17,18],[18,19],[19,20], // Meñique
    [5,9],[9,13],[13,17],           // Palma
  ];

  // Color según estado
  const color = state.gestureCooldownActive ? '#ff9800' : '#00e676';

  // Líneas
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  connections.forEach(([s, e]) => {
    ctx.beginPath();
    ctx.moveTo(landmarks[s].x * w, landmarks[s].y * h);
    ctx.lineTo(landmarks[e].x * w, landmarks[e].y * h);
    ctx.stroke();
  });

  // Puntos
  landmarks.forEach((lm) => {
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, 3, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

// Clasificacion de gestos con umbrales

/**
 * Clasificación pura del gesto (sin side-effects).
 * Usa umbrales más estrictos para evitar falsos positivos.
 */
function classifyGestureRaw(landmarks) {
  const fingers = getFingerStates(landmarks);
  const [thumb, index, middle, ring, pinky] = fingers;

  // 👌 OK: pulgar e índice juntos, otros extendidos
  // Comprobar PRIMERO para evitar confusión con otros gestos
  if (isOKGesture(landmarks)) {
    return 'ok';
  }

  // diferenciar puño, pulgar arriba y pulgar abajo
  // segun la posicion vertical del pulgar
  if (!index && !middle && !ring && !pinky) {
    const thumbTipAbovePalm = landmarks[4].y < landmarks[5].y - 0.04;
    const thumbTipBelowWrist = landmarks[4].y > landmarks[0].y + 0.04;
    if (thumbTipAbovePalm) {
      return 'thumbs_up';
    } else if (thumbTipBelowWrist) {
      return 'thumbs_down';
    } else {
      return 'fist';
    }
  }

  // ☝️ Un dedo: solo índice extendido
  if (!thumb && index && !middle && !ring && !pinky) {
    return 'pointing';
  }

  // ✌️ Victoria / Dos dedos: índice y medio extendidos
  if (!thumb && index && middle && !ring && !pinky) {
    return 'victory';
  }

  // ✋ Mano abierta: todos los dedos extendidos
  if (thumb && index && middle && ring && pinky) {
    return 'open_hand';
  }

  return null;
}

/**
 * Detección de dedos extendidos con UMBRAL de margen.
 * El margen evita detecciones falsas cuando los dedos están cerca del límite.
 */
function getFingerStates(landmarks) {
  const THRESHOLD = 0.012; // Margen de seguridad normalizado

  // Determinar orientación de la mano
  const isRightHand = landmarks[17].x < landmarks[5].x;

  // Pulgar: comparar en eje X (con margen)
  const thumbExtended = isRightHand
    ? landmarks[4].x < landmarks[3].x - THRESHOLD
    : landmarks[4].x > landmarks[3].x + THRESHOLD;

  // Otros dedos: comparar en eje Y (hacia arriba = menor Y, con margen)
  const indexExtended  = landmarks[8].y  < landmarks[6].y  - THRESHOLD;
  const middleExtended = landmarks[12].y < landmarks[10].y - THRESHOLD;
  const ringExtended   = landmarks[16].y < landmarks[14].y - THRESHOLD;
  const pinkyExtended  = landmarks[20].y < landmarks[18].y - THRESHOLD;

  return [thumbExtended, indexExtended, middleExtended, ringExtended, pinkyExtended];
}

/**
 * Detección del gesto OK con umbral estricto.
 */
function isOKGesture(landmarks) {
  // Distancia entre punta del pulgar (4) y punta del índice (8)
  const dist = Math.hypot(
    landmarks[4].x - landmarks[8].x,
    landmarks[4].y - landmarks[8].y,
    landmarks[4].z - landmarks[8].z
  );

  // Umbral para distancia pulgar-índice
  if (dist >= 0.06) return false;

  const THRESHOLD = 0.012;
  // Los dedos medio, anular y meñique deben estar claramente extendidos
  const middleUp = landmarks[12].y < landmarks[10].y - THRESHOLD;
  const ringUp   = landmarks[16].y < landmarks[14].y - THRESHOLD;
  const pinkyUp  = landmarks[20].y < landmarks[18].y - THRESHOLD;

  return middleUp && ringUp && pinkyUp;
}

// Texto que se muestra en pantalla para cada gesto
function getGestureLabel(gesture) {
  switch (gesture) {
    case 'thumbs_up': return '👍 Reservar';
    case 'thumbs_down': return '👎 Cancelar';
    case 'open_hand': return '✋ Cancelar';
    case 'victory':   return '✌️ Siguiente';
    case 'pointing':  return '☝️ Seleccionar';
    case 'ok':        return '👌 Confirmar';
    case 'fist':      return '✊ Volver';
    default: return '';
  }
}

// Ejecuta la accion correspondiente al gesto detectado
function handleGesture(gesture) {
  console.log(`✋ Gesto confirmado: ${gesture}`);

  switch (gesture) {
    case 'thumbs_up':
      showCommandFeedback('👍 Reservar plaza');
      actionReserve();
      break;
    case 'thumbs_down':
      showCommandFeedback('👎 Cancelar');
      actionCancel();
      break;
    case 'open_hand':
      showCommandFeedback('✋ Cancelar');
      actionCancel();
      break;
    case 'victory':
      showCommandFeedback('✌️ Siguiente parking');
      navigateParking(1);
      unlockProcessing();
      break;
    case 'ok':
      showCommandFeedback('👌 Confirmar');
      actionConfirm();
      break;
    case 'pointing':
      showCommandFeedback('☝️ Ver detalle');
      actionViewDetail();
      break;
    case 'fist':
      showCommandFeedback('✊ Volver');
      actionGoBack();
      unlockProcessing();
      break;
  }
}

// Funciones para mostrar/ocultar el label del gesto
function showGestureLabel(text, confidence) {
  if (state.gestureCooldownActive) {
    els.gestureLabel.textContent = '⏳ Espera...';
    els.gestureLabel.classList.add('visible', 'cooldown');
    return;
  }
  els.gestureLabel.textContent = confidence >= 1 ? `✅ ${text}` : text;
  els.gestureLabel.classList.remove('cooldown');
  els.gestureLabel.classList.add('visible');
}

function hideGestureLabel() {
  els.gestureLabel.classList.remove('visible', 'cooldown');
}

function updateConfidenceBar(value) {
  if (els.gestureConfidence) {
    const pct = Math.min(value * 100, 100);
    els.gestureConfidence.style.width = pct + '%';

    if (value >= 1) {
      els.gestureConfidence.className = 'confidence-fill ready';
    } else if (state.gestureCooldownActive) {
      els.gestureConfidence.className = 'confidence-fill cooldown';
    } else {
      els.gestureConfidence.className = 'confidence-fill';
    }
  }
}

// Acciones principales

function navigateParking(direction) {
  if (state.parkings.length === 0) {
    speak('Primero busca parkings. Di buscar aparcamiento.');
    return;
  }

  state.currentParkingIndex += direction;
  if (state.currentParkingIndex < 0) state.currentParkingIndex = state.parkings.length - 1;
  if (state.currentParkingIndex >= state.parkings.length) state.currentParkingIndex = 0;

  renderParkingList();
  const p = state.parkings[state.currentParkingIndex];
  speak(`${p.name}. ${p.freeSpots} plazas libres. ${p.pricePerHour} euros por hora.`);
}

function actionReserve() {
  if (state.reservation) {
    speak('Ya tienes una reserva activa.');
    unlockProcessing();
    return;
  }

  if (state.parkings.length === 0) {
    speak('Primero busca parkings.');
    unlockProcessing();
    return;
  }

  const parking = state.parkings[state.currentParkingIndex];
  if (parking.freeSpots === 0) {
    speak(`${parking.name} no tiene plazas libres.`);
    unlockProcessing();
    return;
  }

  socket.emit('reserveSpot', { parkingId: parking.id });
  showCommandFeedback(`🎫 Reservando en ${parking.name}...`);
}

function actionConfirm() {
  if (!state.reservation) {
    speak('No tienes ninguna reserva para confirmar.');
    unlockProcessing();
    return;
  }
  socket.emit('confirmReservation', { parkingId: state.reservation.parkingId });
  showCommandFeedback('✅ Confirmando...');
}

function actionCancel() {
  if (!state.reservation) {
    // Si estamos en detalle, volver atrás
    if (els.viewParkingDetail.classList.contains('active')) {
      actionGoBack();
      return;
    }
    speak('No tienes ninguna reserva para cancelar.');
    unlockProcessing();
    return;
  }
  socket.emit('cancelReservation', { parkingId: state.reservation.parkingId });
  showCommandFeedback('❌ Cancelando...');
}

function actionUrgent() {
  socket.emit('urgentMode');
  showCommandFeedback('🚨 Modo urgente activado');
}

function actionViewDetail() {
  if (state.parkings.length === 0) {
    speak('Primero busca parkings.');
    unlockProcessing();
    return;
  }
  const parking = state.parkings[state.currentParkingIndex];
  socket.emit('requestParkingDetail', parking.id);
  showCommandFeedback(`📋 Viendo ${parking.name}...`);
}

function actionGoBack() {
  if (els.viewArrived && els.viewArrived.classList.contains('active')) {
    state.reservation = null;
    showView('list');
    socket.emit('requestParkingList');
    speak('Volviendo a la lista de parkings.');
    unlockProcessing();
    return;
  }
  if (els.viewNavigation && els.viewNavigation.classList.contains('active')) {
    speak('Tienes una reserva activa. Di cancelar para cancelarla.');
    unlockProcessing();
    return;
  }
  if (els.viewReservation.classList.contains('active') && state.reservation) {
    speak('Tienes una reserva activa. Di cancelar para cancelarla.');
    unlockProcessing();
    return;
  }
  showView('list');
  speak('Volviendo a la lista de parkings.');
  unlockProcessing();
}

// Renderizado de vistas

function showView(view) {
  els.viewParkingList.classList.remove('active');
  els.viewParkingDetail.classList.remove('active');
  els.viewReservation.classList.remove('active');
  if (els.viewNavigation) els.viewNavigation.classList.remove('active');
  if (els.viewArrived) els.viewArrived.classList.remove('active');

  switch (view) {
    case 'list':
      els.viewParkingList.classList.add('active');
      break;
    case 'detail':
      els.viewParkingDetail.classList.add('active');
      break;
    case 'reservation':
      els.viewReservation.classList.add('active');
      break;
    case 'navigation':
      if (els.viewNavigation) els.viewNavigation.classList.add('active');
      break;
    case 'arrived':
      if (els.viewArrived) els.viewArrived.classList.add('active');
      break;
  }
}

function renderParkingList() {
  if (state.parkings.length === 0) {
    els.parkingCards.innerHTML = `
      <div class="loading-placeholder">
        <p>Di <em style="color: var(--accent-green)">"buscar aparcamiento"</em> o pulsa 🔍</p>
      </div>
    `;
    return;
  }

  els.parkingCards.innerHTML = state.parkings.map((p, i) => {
    const selected = i === state.currentParkingIndex ? 'selected' : '';
    const availability = p.freeSpots === 0 ? 'no-availability' : p.freeSpots <= 3 ? 'low-availability' : '';

    return `
      <div class="parking-card ${selected} ${availability}" data-index="${i}">
        <div class="parking-card-index">${i + 1} / ${state.parkings.length}</div>
        <div class="parking-card-header">
          <span class="parking-name">${p.name}</span>
          <span class="parking-price">${p.pricePerHour.toFixed(2)} €/h</span>
        </div>
        <div class="parking-address">📍 ${p.address}</div>
        <div class="parking-stats">
          <div class="stat">
            <span class="stat-dot free"></span>
            <span class="stat-value">${p.freeSpots}</span>
            <span class="stat-label">libres</span>
          </div>
          <div class="stat">
            <span class="stat-dot reserved"></span>
            <span class="stat-value">${p.reservedSpots}</span>
            <span class="stat-label">reservadas</span>
          </div>
          <div class="stat">
            <span class="stat-dot occupied"></span>
            <span class="stat-value">${p.occupiedSpots}</span>
            <span class="stat-label">ocupadas</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Eventos click en tarjetas
  $$('.parking-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.index);
      state.currentParkingIndex = idx;
      renderParkingList();
      actionViewDetail();
    });
  });
}

function renderParkingDetail(data) {
  const freePercent = Math.round((data.freeSpots / data.totalSpots) * 100);
  let badgeClass = 'available';
  let badgeText = 'Disponible';
  if (freePercent < 20) { badgeClass = 'limited'; badgeText = 'Limitado'; }
  if (freePercent === 0) { badgeClass = 'full'; badgeText = 'Completo'; }

  els.parkingDetailCard.innerHTML = `
    <div class="detail-header">
      <span class="detail-name">${data.name}</span>
      <span class="detail-badge ${badgeClass}">${badgeText}</span>
    </div>
    <div class="detail-info">
      <div class="detail-info-item">
        <div class="detail-info-label">Dirección</div>
        <div class="detail-info-value">📍 ${data.address}</div>
      </div>
      <div class="detail-info-item">
        <div class="detail-info-label">Precio</div>
        <div class="detail-info-value">${data.pricePerHour.toFixed(2)} €/h</div>
      </div>
      <div class="detail-info-item">
        <div class="detail-info-label">Plantas</div>
        <div class="detail-info-value">${data.floors}</div>
      </div>
      <div class="detail-info-item">
        <div class="detail-info-label">Plazas libres</div>
        <div class="detail-info-value" style="color: var(--accent-green)">${data.freeSpots} / ${data.totalSpots}</div>
      </div>
    </div>
  `;

  renderSpotsGrid(data.spots);
}

function renderSpotsGrid(spots) {
  els.spotsGrid.innerHTML = `
    <div class="spots-grid-title">
      <span>Mapa de plazas</span>
      <div class="spots-legend">
        <div class="legend-item"><span class="stat-dot free"></span> Libre</div>
        <div class="legend-item"><span class="stat-dot reserved"></span> Reservada</div>
        <div class="legend-item"><span class="stat-dot occupied"></span> Ocupada</div>
      </div>
    </div>
    <div class="spots-container">
      ${spots.map(s => `
        <div class="spot ${s.status}" data-spot-id="${s.id}" title="${s.label} — ${s.status}">
          ${s.label}
        </div>
      `).join('')}
    </div>
  `;

  // Click en plazas libres para reservar
  $$('.spot.free').forEach(spot => {
    spot.addEventListener('click', () => {
      const spotId = spot.dataset.spotId;
      const parking = state.parkings[state.currentParkingIndex];
      socket.emit('reserveSpot', { parkingId: parking.id, spotId });
    });
  });
}

function renderReservation(data) {
  els.reservationTitle.textContent = '🎫 Plaza reservada';
  els.reservationDetail.textContent = `${data.parkingName} — Plaza ${data.spot.label}`;
  els.reservationTimer.textContent = '03:00';
  els.reservationTimer.className = 'reservation-timer';
  els.btnConfirm.style.display = 'inline-block';
}

// Temporizador de la reserva (3 min)
function startReservationTimer() {
  stopReservationTimer();

  state.reservationEndTime = Date.now() + 3 * 60 * 1000; // 3 minutos

  state.reservationTimerInterval = setInterval(() => {
    const remaining = state.reservationEndTime - Date.now();

    if (remaining <= 0) {
      stopReservationTimer();
      els.reservationTimer.textContent = '00:00';
      speak('Tu reserva ha expirado.');
      state.reservation = null;
      showView('list');
      socket.emit('requestParkingList');
      return;
    }

    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    els.reservationTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Cambiar color según urgencia
    if (remaining < 30000) {
      els.reservationTimer.className = 'reservation-timer critical';
    } else if (remaining < 60000) {
      els.reservationTimer.className = 'reservation-timer warning';
    }
  }, 1000);
}

function stopReservationTimer() {
  if (state.reservationTimerInterval) {
    clearInterval(state.reservationTimerInterval);
    state.reservationTimerInterval = null;
  }
}

// Muestra feedback flotante en pantalla
let feedbackTimeout = null;
function showCommandFeedback(text) {
  els.commandText.textContent = text;
  els.commandFeedback.classList.add('visible');
  if (feedbackTimeout) clearTimeout(feedbackTimeout);
  feedbackTimeout = setTimeout(() => els.commandFeedback.classList.remove('visible'), 2500);
}

// Listeners de los botones

// Botones de la barra inferior
els.btnVoice.addEventListener('click', startVoiceRecognition);
els.btnGestures.addEventListener('click', startGestureDetection);
els.btnSearch.addEventListener('click', () => {
  socket.emit('requestParkingList');
  showCommandFeedback('🔍 Buscando parkings...');
});

// Botones de acción
els.btnUrgent.addEventListener('click', actionUrgent);
els.btnBack.addEventListener('click', actionGoBack);
els.btnConfirm.addEventListener('click', actionConfirm);
els.btnCancel.addEventListener('click', actionCancel);
els.btnToggleCam.addEventListener('click', () => {
  if (state.gesturesActive) {
    stopGestureDetection();
  } else {
    startGestureDetection();
  }
});
els.btnLocation.addEventListener('click', startGeolocation);

// Botones de navegación
if (els.btnCancelNav) {
  els.btnCancelNav.addEventListener('click', () => {
    if (state.reservation) {
      socket.emit('cancelReservation', { parkingId: state.reservation.parkingId });
      showCommandFeedback('❌ Cancelando reserva...');
    }
  });
}
if (els.btnArrived) {
  els.btnArrived.addEventListener('click', actionArrived);
}
if (els.btnFinish) {
  els.btnFinish.addEventListener('click', () => {
    state.reservation = null;
    showView('list');
    socket.emit('requestParkingList');
    speak('Sesión finalizada. ¡Hasta pronto!');
  });
}

// === GEOLOCALIZACION ===

function startGeolocation() {
  if (!requireSecureContext('el GPS')) {
    return;
  }

  if (!runtimeCapabilities.geolocation) {
    featureUnavailable('Geolocalizacion', 'tu dispositivo o navegador no la soporta');
    return;
  }
  if (state.geoActive) {
    stopGeolocation();
    return;
  }

  state.geoWatchId = navigator.geolocation.watchPosition(
    (position) => {
      state.userPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      updateUserPositionOnMaps();
      // Si hay reserva activa y estamos navegando, verificar llegada
      if (state.reservation && els.viewNavigation.classList.contains('active')) {
        socket.emit('checkArrival', {
          parkingId: state.reservation.parkingId,
          lat: state.userPosition.lat,
          lng: state.userPosition.lng,
        });
      }
    },
    (error) => {
      console.error('❌ Error GPS:', error.message);
      els.navStatusText && (els.navStatusText.textContent = 'Error obteniendo ubicación');
      if (error.code === error.PERMISSION_DENIED) {
        showRuntimeWarning('Debes permitir la ubicacion para usar la navegacion en el movil.');
      }
    },
    { enableHighAccuracy: false, maximumAge: 0, timeout: 27000 }
  );

  state.geoActive = true;
  els.btnLocation.classList.add('active');
  showCommandFeedback('📍 GPS activado');
  speak('GPS activado.');
}

function stopGeolocation() {
  if (state.geoWatchId !== null) {
    navigator.geolocation.clearWatch(state.geoWatchId);
    state.geoWatchId = null;
  }
  state.geoActive = false;
  els.btnLocation.classList.remove('active');
}

function updateUserPositionOnMaps() {
  if (!state.userPosition) return;
  const pos = [state.userPosition.lat, state.userPosition.lng];

  if (state.detailMap && state.userMarker) {
    state.userMarker.setLatLng(pos);
  }
  if (state.navMap && state.navUserMarker) {
    state.navUserMarker.setLatLng(pos);
    // Nota: No recalculamos la ruta en cada pequeño movimiento para no saturar la API de OSRM
  }
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// === MAPAS LEAFLET ===

const userIcon = L.divIcon({ className: 'leaflet-user-icon', html: '<div class="user-dot"></div>', iconSize: [20, 20], iconAnchor: [10, 10] });
const parkingIcon = L.divIcon({ className: 'leaflet-parking-icon', html: '🅿️', iconSize: [30, 30], iconAnchor: [15, 15] });

function initDetailMap(parking) {
  if (state.detailMap) { state.detailMap.remove(); state.detailMap = null; }

  const center = [parking.lat, parking.lng];
  state.detailMap = L.map('detailMap').setView(center, 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19,
  }).addTo(state.detailMap);

  state.parkingMarker = L.marker(center, { icon: parkingIcon })
    .addTo(state.detailMap).bindPopup(`🅿️ ${parking.name}`).openPopup();

  if (state.userPosition) {
    const userPos = [state.userPosition.lat, state.userPosition.lng];
    state.userMarker = L.marker(userPos, { icon: userIcon }).addTo(state.detailMap);
    state.routeLine = L.polyline([userPos, center], {
      color: '#6c63ff', weight: 3, dashArray: '8, 8', opacity: 0.7,
    }).addTo(state.detailMap);
    state.detailMap.fitBounds([userPos, center], { padding: [40, 40] });

    const dist = haversineDistance(state.userPosition.lat, state.userPosition.lng, parking.lat, parking.lng);
    showCommandFeedback(`📍 A ${Math.round(dist)}m`);
  }
  setTimeout(() => state.detailMap.invalidateSize(), 300);
}

function initNavMap(reservation) {
  if (state.navMap) { state.navMap.remove(); state.navMap = null; }

  const parkPos = [reservation.parkingLat, reservation.parkingLng];
  state.navMap = L.map('navMap').setView(parkPos, 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19,
  }).addTo(state.navMap);

  state.navParkingMarker = L.marker(parkPos, { icon: parkingIcon })
    .addTo(state.navMap).bindPopup(`🅿️ ${reservation.parkingName}<br>Plaza ${reservation.spot.label}`);

  if (state.userPosition) {
    const userPos = [state.userPosition.lat, state.userPosition.lng];
    state.navUserMarker = L.marker(userPos, { icon: userIcon }).addTo(state.navMap);
    
    // Trazar ruta inteligente por carretera usando Leaflet Routing Machine (OSRM)
    state.navRoutingControl = L.Routing.control({
      waypoints: [
        L.latLng(userPos[0], userPos[1]),
        L.latLng(parkPos[0], parkPos[1])
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      show: false, // Ocultar panel de texto flotante
      createMarker: function() { return null; }, // Evitar marcadores extra
      lineOptions: {
        styles: [{ color: '#00e676', opacity: 0.9, weight: 6, className: 'route-path' }]
      }
    }).addTo(state.navMap);

    // Cuando se encuentre la ruta, actualizar la UI con distancia y tiempo real
    state.navRoutingControl.on('routesfound', function(e) {
      const summary = e.routes[0].summary;
      els.navDistanceValue.textContent = summary.totalDistance.toFixed(0);
      els.navStatusText.textContent = `A ${(summary.totalTime / 60).toFixed(0)} min en coche`;
    });

    state.navMap.fitBounds([userPos, parkPos], { padding: [50, 50] });
  }
  setTimeout(() => state.navMap.invalidateSize(), 300);
}

// === VISTAS NUEVAS ===

function showNavigationView(data) {
  els.navTitle.textContent = `Navegando a ${data.parkingName}`;
  els.navSpotInfo.textContent = `Plaza: ${data.spot.label}`;
  els.navDistanceValue.textContent = '--';
  els.navStatusText.textContent = 'Obteniendo ubicación...';
  els.navStatusBar.classList.remove('arrived');
  els.btnArrived.disabled = true;
  showView('navigation');

  setTimeout(() => initNavMap(data), 200);

  if (!state.geoActive) {
    startGeolocation();
  }
}

function showArrivedView(data) {
  els.arrivedTitle.textContent = '🎉 ¡Has llegado!';
  els.arrivedDetail.textContent = `${data.parkingName} — Tu plaza es ${data.spot.label}`;

  const spotRow = data.spot.label.replace(/[0-9]/g, '');
  const spotNum = data.spot.label.replace(/[A-Z]/g, '');
  
  els.arrivedSpotMap.innerHTML = `
    <div class="indoor-map-container">
      <div class="indoor-gates-top">
        <div class="indoor-gate entrance">⬆️ ENTRADA</div>
      </div>
      <div class="indoor-grid">
        ${(data.spots || []).map(s => {
          let cssClass = 'indoor-spot';
          let label = s.label;
          if (s.id === data.spot.id) {
            cssClass += ' my-spot pulsing';
            label = `¡AQUÍ!<br><b>${s.label}</b>`;
          } else if (s.status === 'occupied' || s.status === 'reserved' || s.status === 'confirmed') {
            cssClass += ' occupied';
          } else {
            cssClass += ' free';
          }
          return `<div class="${cssClass}">${label}</div>`;
        }).join('')}
      </div>
      <div class="indoor-gates-bottom">
        <div class="indoor-gate exit">SALIDA ⬇️</div>
      </div>
    </div>
  `;

  showView('arrived');
}

function actionArrived() {
  if (!state.reservation) {
    speak('No tienes ninguna reserva activa.');
    unlockProcessing();
    return;
  }
  socket.emit('manualArrival', { parkingId: state.reservation.parkingId });
  showCommandFeedback('✅ Confirmando llegada manualmente...');
}

// Parchear renderParkingDetail para dibujar el mapa
const originalRenderParkingDetail = renderParkingDetail;
function renderParkingDetailWithMap(data) {
  originalRenderParkingDetail(data);
  if (data.lat && data.lng) {
    setTimeout(() => initDetailMap(data), 200);
  }
}

// Reparchear el evento parkingDetail para usar el nuevo renderizado
socket.off('parkingDetail');
socket.on('parkingDetail', (data) => {
  state.currentParking = data;
  state.currentSpots = data.spots;
  renderParkingDetailWithMap(data);
  showView('detail');
  unlockProcessing();
});

// Inicio

console.log('🚗 SmartPark Conductor inicializado');
showStartupHints();
