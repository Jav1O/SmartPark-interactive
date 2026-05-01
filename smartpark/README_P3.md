# SmartPark - Guia de ejecucion (P3)

Este repositorio contiene el prototipo funcional de la Practica 3 de Sistemas Interactivos y Ubicuos. La forma recomendada de usarlo en el movil es abrir la app mediante una URL publica HTTPS de tunel, para que camara, GPS y Socket.IO funcionen en el mismo origen.

## Instalacion y puesta en marcha

### 1. Preparacion
Desde la carpeta `smartpark`, instala dependencias:

```bash
npm install
```

### 2. Arranque local
Inicia el servidor:

```bash
npm start
```

El servidor expone dos puertos:
- `PORT_HTTP` (por defecto `3000`): backend local recomendado para el tunel.
- `PORT_HTTPS` (por defecto `3443`): acceso local por IP con certificado autofirmado.

Tambien puedes personalizar el arranque con variables de entorno:

```bash
PORT_HTTP=3000 PORT_HTTPS=3443 npm start
```

## Uso desde el movil con tunel HTTPS

Para que GPS, camara y voz funcionen bien en el movil, debes abrir la app desde una URL HTTPS publica.

### Flujo recomendado
1. Arranca el servidor con `npm start`.
2. En una segunda terminal, levanta un tunel HTTPS hacia el puerto local `3000`.
3. Copia la URL publica HTTPS del tunel.
4. Reinicia el servidor definiendo `PUBLIC_URL` para que la consola anuncie esa URL de forma clara.
5. Abre la URL en el movil.

Ejemplo con un proveedor de tunel:

```bash
TUNNEL_COMMAND="ssh -R 80:localhost:3000 serveo.net" npm start
```

Cuando ya conozcas la URL publica final, puedes dejarla anunciada en consola asi:

```bash
PUBLIC_URL="https://tu-subdominio-del-tunel.example.com" \
TUNNEL_COMMAND="ssh -R 80:localhost:3000 serveo.net" \
npm start
```

Si el tunel ya te ha dado una URL real, sustituyela directamente en el comando. Por ejemplo:

```bash
PUBLIC_URL="https://tu-url-real-del-tunel" \
TUNNEL_COMMAND="ssh -R 80:localhost:3000 serveo.net" \
npm start
```

Notas importantes:
- El codigo no depende de un proveedor concreto de tunel; puedes usar otro siempre que entregue una URL HTTPS publica.
- La URL publica debe apuntar al puerto HTTP local (`3000`) salvo que tu proveedor requiera otra configuracion.
- Si el proveedor soporta WebSocket y HTTP polling, Socket.IO funcionara sin cambios adicionales.

## Fallback por red local o hotspot

Si no quieres usar tunel, puedes probar desde la misma red local:

1. Conecta movil y ordenador a la misma Wi-Fi, o comparte datos desde el movil al ordenador mediante hotspot.
2. Arranca `npm start`.
3. Abre en el movil la URL local que muestra el servidor:

```text
https://IP_LOCAL:3443/conductor.html
```

Ten en cuenta:
- Esta via usa un certificado autofirmado.
- Es normal que el navegador muestre un aviso de seguridad.
- Si el navegador no deja continuar o no concede permisos, usa la URL publica HTTPS del tunel.

## Compatibilidad movil

La app necesita estas capacidades del navegador:
- HTTPS o contexto seguro para GPS, camara y, en muchos navegadores, voz.
- Permiso de ubicacion para la navegacion al parking.
- Permiso de camara para los gestos.
- Compatibilidad con `SpeechRecognition` o `webkitSpeechRecognition` si quieres validar voz.

Si una capacidad no esta disponible, la app mostrara un aviso en pantalla para facilitar el diagnostico.

## Checklist manual de validacion

Antes de grabar las pruebas con usuarios, verifica:
1. La URL publica HTTPS carga la app correctamente en el movil.
2. El estado de conexion pasa a `Conectado`.
3. La lista de parkings se carga y permite entrar al detalle.
4. La reserva y la confirmacion de plaza funcionan.
5. El GPS pide permiso y actualiza la navegacion.
6. La camara pide permiso y activa la deteccion de gestos.
7. Si el navegador no soporta voz, la app lo indica claramente.
8. La llegada automatica o manual muestra el croquis interior de la plaza.

## Funcionalidades para validar en P3

Durante las pruebas con usuarios, aseguraos de verificar:
1. Navegacion real: al confirmar una reserva, el mapa debe trazar una ruta por carretera.
2. Control por gestos o voz: la plaza puede reservarse con comando de voz o gesto.
3. Llegada automatica: el sistema detecta cuando el usuario esta cerca del parking y cambia a la vista de llegada.
4. Croquis del parking: se muestra la plaza asignada con entrada y salida.

Equipo SmartPark - Mayo 2026
