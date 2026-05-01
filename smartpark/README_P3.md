# 🚗 SmartPark - Guía de Ejecución (P3)

Este repositorio contiene el prototipo funcional de la **Práctica 3** de Sistemas Interactivos y Ubicuos. Se han implementado mejoras de navegación real (Leaflet Routing), soporte HTTPS para sensores móviles y validación automática de llegada.

## 🚀 Instalación y Puesta en Marcha

Sigue estos pasos para ejecutar el servidor en tu ordenador local:

### 1. Preparación del Código
Asegúrate de estar en la rama de entrega y tener todas las dependencias instaladas:
```bash
# Cambiar a la rama de la P3
git checkout p3-practica-final
git pull origin p3-practica-final

# Instalar dependencias (Socket.io, Selfsigned, etc.)
cd smartpark
npm install
```

### 2. Ejecución del Servidor
Arranca el servidor de Node.js:
```bash
npm start
```
El servidor escuchará en dos puertos:
- **HTTP (3000):** Para pruebas rápidas en el navegador del PC.
- **HTTPS (3443):** Necesario para que funcionen la **Cámara** (Gestos) y el **GPS** en entornos locales.

---

## 📱 Cómo usarlo en el Móvil (Túnel HTTPS)

Para que los sensores (GPS/Cámara) funcionen en el móvil, es **obligatorio** usar una conexión HTTPS segura. La forma más fácil es crear un túnel:

1. Con el servidor (`npm start`) ya corriendo, abre una **segunda terminal**.
2. Ejecuta el siguiente comando para crear un túnel público:
   ```bash
   ssh -R 80:localhost:3000 serveo.net
   ```
3. Copia la URL que te devuelva (ej: `https://abcd.serveousercontent.com`).
4. En tu móvil, abre esa URL añadiendo `/conductor.html` al final.

> **Nota:** Si el móvil muestra un aviso de "Sitio no seguro", pulsa en **Configuración avanzada** y luego en **Continuar al sitio**.

---

## 🛠️ Funcionalidades para Validar (P3)

Durante las pruebas con usuarios, asegúrate de verificar:
1. **Navegación Real:** Al confirmar una reserva, el mapa debe trazar una ruta por carretera (no una línea recta).
2. **Control por Gestos/Voz:** Reserva una plaza usando el comando de voz o el gesto de "OK".
3. **Llegada Automática:** El sistema debe detectar cuando el usuario está a menos de 100m del parking y mostrar el **croquis interior** automáticamente.
4. **Croquis del Parking:** Al llegar, se debe ver el mapa del interior con la entrada, la salida y la plaza asignada resaltada.

---
**Equipo SmartPark** - Mayo 2026
