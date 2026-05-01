import express from 'express';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { Server } from 'socket.io';
import selfsigned from 'selfsigned';
import os from 'node:os';

const app = express();
const httpServer = createHttpServer(app);

// Generar certificado SSL
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });
const httpsServer = createHttpsServer({
  key: pems.private,
  cert: pems.cert
}, app);

// Adjuntar Socket.io a ambos servidores
const io = new Server();
io.attach(httpServer);
io.attach(httpsServer);

const PORT_HTTP = 3000;
const PORT_HTTPS = 3443;

// Redirigir la raíz a la página del conductor
app.get('/', (req, res) => {
  res.redirect('/conductor.html');
});

app.use(express.static('public'));

// Datos de los parkings en memoria (con coordenadas en el campus / ciudad)
const parkingData = [
  {
    id: 0,
    name: 'Parking Centro',
    address: 'Calle Mayor, 12',
    lat: 40.4168,
    lng: -3.7038,
    floors: 2,
    pricePerHour: 2.50,
    spots: generateSpots(30, 0),
  },
  {
    id: 1,
    name: 'Parking Estación',
    address: 'Av. de la Estación, 5',
    lat: 40.4065,
    lng: -3.6896,
    floors: 3,
    pricePerHour: 1.80,
    spots: generateSpots(40, 1),
  },
  {
    id: 2,
    name: 'Parking Plaza Mayor',
    address: 'Plaza Mayor, s/n',
    lat: 40.4155,
    lng: -3.7074,
    floors: 1,
    pricePerHour: 3.00,
    spots: generateSpots(20, 2),
  },
];

// Genera las plazas de un parking con estado aleatorio
function generateSpots(count, parkingId) {
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const spots = [];
  for (let i = 0; i < count; i++) {
    const row = rows[Math.floor(i / Math.ceil(count / rows.length))];
    const num = (i % Math.ceil(count / rows.length)) + 1;
    // aprox 60% ocupadas para simular uso real
    const isOccupied = Math.random() < 0.6;
    spots.push({
      id: `${parkingId}-${i}`,
      label: `${row}${num}`,
      status: isOccupied ? 'occupied' : 'free', // free | occupied | reserved | confirmed
      reservedBy: null,
      reservedAt: null,
    });
  }
  return spots;
}

// Devuelve resumen de un parking sin las plazas individuales
function getParkingSummary(parking) {
  const free = parking.spots.filter(s => s.status === 'free').length;
  const reserved = parking.spots.filter(s => s.status === 'reserved' || s.status === 'confirmed').length;
  const occupied = parking.spots.filter(s => s.status === 'occupied').length;
  return {
    id: parking.id,
    name: parking.name,
    address: parking.address,
    lat: parking.lat,
    lng: parking.lng,
    floors: parking.floors,
    pricePerHour: parking.pricePerHour,
    totalSpots: parking.spots.length,
    freeSpots: free,
    reservedSpots: reserved,
    occupiedSpots: occupied,
  };
}

// Cada 10s, liberar reservas que lleven mas de 3 min sin confirmar
setInterval(() => {
  const now = Date.now();
  parkingData.forEach(parking => {
    parking.spots.forEach(spot => {
      if (spot.status === 'reserved' && spot.reservedAt && (now - spot.reservedAt > 3 * 60 * 1000)) {
        console.log(`⏰ Reserva expirada: ${spot.label} en ${parking.name}`);
        spot.status = 'free';
        spot.reservedBy = null;
        spot.reservedAt = null;
        io.emit('parkingUpdate', {
          parkingId: parking.id,
          parking: getParkingSummary(parking),
          spots: parking.spots,
          message: `La reserva de la plaza ${spot.label} ha expirado`,
        });
      }
    });
  });
}, 10000);

// Archivos estaticos
// Calcula la distancia usando la formula de Haversine (en metros)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

app.use(express.static('public'));

// Conexiones Socket.IO
io.on('connection', (socket) => {
  console.log(`✅ Usuario conectado: ${socket.id}`);

  // Lista de parkings
  socket.on('requestParkingList', () => {
    const list = parkingData.map(p => getParkingSummary(p));
    socket.emit('parkingList', list);
    console.log(`📋 Lista de parkings enviada a ${socket.id}`);
  });

  // Detalle de un parking concreto
  socket.on('requestParkingDetail', (parkingId) => {
    const parking = parkingData.find(p => p.id === parkingId);
    if (parking) {
      socket.emit('parkingDetail', {
        ...getParkingSummary(parking),
        spots: parking.spots,
      });
      console.log(`🅿️ Detalle de ${parking.name} enviado a ${socket.id}`);
    }
  });

  // Reservar plaza
  socket.on('reserveSpot', ({ parkingId, spotId }) => {
    const parking = parkingData.find(p => p.id === parkingId);
    if (!parking) {
      socket.emit('error', { message: 'Parking no encontrado' });
      return;
    }

    // Si no viene spotId, coger la primera libre
    let spot;
    if (spotId) {
      spot = parking.spots.find(s => s.id === spotId);
    } else {
      spot = parking.spots.find(s => s.status === 'free');
    }

    if (!spot || spot.status !== 'free') {
      socket.emit('error', { message: 'Plaza no disponible' });
      return;
    }

    spot.status = 'reserved';
    spot.reservedBy = socket.id;
    spot.reservedAt = Date.now();

    console.log(`🎫 Plaza ${spot.label} reservada en ${parking.name} por ${socket.id}`);

    // Responder al conductor
    socket.emit('reservationConfirmed', {
      parkingId: parking.id,
      parkingName: parking.name,
      parkingLat: parking.lat,
      parkingLng: parking.lng,
      spot: spot,
      message: `Plaza ${spot.label} reservada por 3 minutos`,
    });

    // Avisar a todos los clientes
    io.emit('parkingUpdate', {
      parkingId: parking.id,
      parking: getParkingSummary(parking),
      spots: parking.spots,
      message: `Plaza ${spot.label} reservada en ${parking.name}`,
    });
  });

  // Confirmar una reserva
  socket.on('confirmReservation', ({ parkingId }) => {
    const parking = parkingData.find(p => p.id === parkingId);
    if (!parking) return;

    const spot = parking.spots.find(s => s.reservedBy === socket.id && s.status === 'reserved');
    if (!spot) {
      socket.emit('error', { message: 'No tienes reserva activa en este parking' });
      return;
    }

    spot.status = 'confirmed';
    console.log(`✅ Reserva confirmada: ${spot.label} en ${parking.name}`);

    socket.emit('confirmationSuccess', {
      parkingId: parking.id,
      parkingName: parking.name,
      parkingLat: parking.lat,
      parkingLng: parking.lng,
      spot: spot,
      message: `Plaza ${spot.label} confirmada. ¡Dirígete al parking!`,
    });

    io.emit('parkingUpdate', {
      parkingId: parking.id,
      parking: getParkingSummary(parking),
      spots: parking.spots,
      message: `Plaza ${spot.label} confirmada en ${parking.name}`,
    });
  });

  // Cancelar reserva activa
  socket.on('cancelReservation', ({ parkingId }) => {
    const parking = parkingData.find(p => p.id === parkingId);
    if (!parking) return;

    const spot = parking.spots.find(
      s => s.reservedBy === socket.id && (s.status === 'reserved' || s.status === 'confirmed')
    );
    if (!spot) {
      socket.emit('error', { message: 'No tienes reserva activa' });
      return;
    }

    console.log(`❌ Reserva cancelada: ${spot.label} en ${parking.name}`);
    spot.status = 'free';
    spot.reservedBy = null;
    spot.reservedAt = null;

    socket.emit('cancellationSuccess', {
      parkingId: parking.id,
      message: `Reserva de plaza ${spot.label} cancelada`,
    });

    io.emit('parkingUpdate', {
      parkingId: parking.id,
      parking: getParkingSummary(parking),
      spots: parking.spots,
      message: `Plaza ${spot.label} liberada en ${parking.name}`,
    });
  });

  // Modo urgente: buscar el parking con mas plazas
  socket.on('urgentMode', () => {
    const summaries = parkingData.map(p => getParkingSummary(p));
    const best = summaries.reduce((a, b) => (a.freeSpots > b.freeSpots ? a : b));
    socket.emit('urgentResult', {
      parking: best,
      message: `Modo urgente: ${best.name} tiene ${best.freeSpots} plazas libres`,
    });
    console.log(`🚨 Modo urgente para ${socket.id}: ${best.name}`);
  });

  socket.on('disconnect', () => {
    // Si se desconecta, liberar sus reservas
    parkingData.forEach(parking => {
      parking.spots.forEach(spot => {
        if (spot.reservedBy === socket.id && spot.status === 'reserved') {
          spot.status = 'free';
          spot.reservedBy = null;
          spot.reservedAt = null;
          io.emit('parkingUpdate', {
            parkingId: parking.id,
            parking: getParkingSummary(parking),
            spots: parking.spots,
          });
        }
      });
    });
    console.log(`❌ Usuario desconectado: ${socket.id}`);
  });

  // Validacion automatica de llegada por GPS
  socket.on('checkArrival', ({ parkingId, lat, lng }) => {
    const parking = parkingData.find(p => p.id === parkingId);
    if (!parking) return;

    // Buscamos si tiene reserva (puede estar reserved o confirmed si pasaron por la pantalla intermedia)
    const spot = parking.spots.find(s => s.reservedBy === socket.id && (s.status === 'reserved' || s.status === 'confirmed'));
    if (!spot) return;

    // Distancia al parking
    const distance = calculateDistance(lat, lng, parking.lat, parking.lng);
    
    // Si está a menos de 100 metros, damos por válida la llegada
    if (distance < 100) {
      spot.status = 'occupied'; // Al llegar, la plaza pasa a ocupada
      socket.emit('arrivalConfirmed', {
        parkingId: parking.id,
        parkingName: parking.name,
        spot: spot,
        spots: parking.spots,
      });
      io.emit('parkingUpdate', {
        parkingId: parking.id,
        parking: getParkingSummary(parking),
        spots: parking.spots,
      });
      console.log(`🏁 Llegada confirmada por GPS para ${socket.id} a ${distance.toFixed(0)}m`);
    }
  });

  // Validacion manual de llegada (cuando el conductor pulsa o dice "he llegado")
  socket.on('manualArrival', ({ parkingId }) => {
    const parking = parkingData.find(p => p.id === parkingId);
    if (!parking) return;

    const spot = parking.spots.find(s => s.reservedBy === socket.id && (s.status === 'reserved' || s.status === 'confirmed'));
    if (!spot) {
      socket.emit('error', { message: 'No tienes reserva activa en este parking' });
      return;
    }

    spot.status = 'occupied';
    socket.emit('arrivalConfirmed', {
      parkingId: parking.id,
      parkingName: parking.name,
      spot: spot,
      spots: parking.spots,
    });
    io.emit('parkingUpdate', {
      parkingId: parking.id,
      parking: getParkingSummary(parking),
      spots: parking.spots,
    });
    console.log(`🏁 Llegada manual confirmada para ${socket.id}`);
  });
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    // Ignorar interfaces virtuales (WSL, Hyper-V, VMware, VirtualBox)
    if (name.toLowerCase().includes('wsl') || name.toLowerCase().includes('veth') || name.toLowerCase().includes('hyper') || name.toLowerCase().includes('vmware') || name.toLowerCase().includes('virtual')) {
      continue;
    }
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

httpServer.listen(PORT_HTTP, () => {
  console.log(`\n🚗 SmartPark - Acceso desde este ordenador:`);
  console.log(`   → http://localhost:${PORT_HTTP}/conductor.html`);
});

httpsServer.listen(PORT_HTTPS, () => {
  console.log(`\n📱 ACCESO DESDE EL MÓVIL (Recomendado):`);
  console.log(`   1. Abre otra terminal y ejecuta:`);
  console.log(`      ssh -R 80:localhost:3000 serveo.net`);
  console.log(`   2. El túnel te dará una URL (ej: https://xxxx.serveo.net)`);
  console.log(`   3. ¡Ábrela en tu móvil! (Ahora te redirigirá automáticamente)`);
  console.log(`\n🔗 Acceso por IP local (Si falla el túnel):`);
  console.log(`   → https://${localIP}:${PORT_HTTPS}/conductor.html`);
  console.log(`\n⚠️  En el móvil, ignora el aviso de "Sitio no seguro".\n`);
});
