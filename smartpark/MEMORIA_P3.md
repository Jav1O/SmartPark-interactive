# SmartPark - Memoria P3: Validacion con usuarios

**Asignatura:** Sistemas Interactivos y Ubicuos  
**Grado:** Ingenieria Informatica  
**Proyecto:** SmartPark  
**Equipo:** Jose Palacios, Javier Olozaga, Alejandro Gomez  
**Entrega:** P3 - Validar  
**Fecha:** [Completar fecha de entrega]

---

## Indice

1. Introduccion y objetivo de la evaluacion  
2. Descripcion breve del prototipo  
3. Protocolo de evaluacion  
4. Tecnicas de validacion utilizadas  
5. Participantes y criterios de inclusion  
6. Consentimiento informado y privacidad  
7. Desarrollo de las sesiones  
8. Videos demostrativos  
9. Analisis de resultados  
10. Problemas detectados y aspectos positivos  
11. Hallazgos relevantes  
12. Reflexion final  
13. Anexos

---

## 1. Introduccion y objetivo de la evaluacion

La tercera fase del proyecto SmartPark se centra en la validacion del prototipo funcional desarrollado durante las fases anteriores. El sistema propone una solucion ubicua para ayudar a conductores a encontrar y reservar una plaza de aparcamiento de forma rapida, reduciendo la incertidumbre, el tiempo perdido y la carga de interaccion durante la conduccion o durante la llegada a un parking.

El objetivo principal de esta evaluacion es analizar como interactuan usuarios reales con el prototipo SmartPark en un contexto simulado pero representativo de busqueda de aparcamiento. La prueba se centra en observar la facilidad de uso, la comprension del flujo de reserva, la adecuacion de las interacciones por voz y gestos, y la utilidad de la informacion mostrada al llegar a la plaza asignada.

La evaluacion busca responder a las siguientes preguntas:

- ¿Comprenden los participantes el flujo principal de busqueda, reserva, confirmacion y llegada?
- ¿Resultan adecuadas las interacciones mediante voz y gestos para el contexto planteado?
- ¿Que dificultades aparecen durante el uso del prototipo?
- ¿Que aspectos del sistema funcionan correctamente y aportan valor al usuario?
- ¿Que mejoras deberian considerarse para una version futura del sistema?

---

## 2. Descripcion breve del prototipo

SmartPark es un prototipo funcional de sistema ubicuo para la gestion de aparcamiento. La aplicacion permite al conductor consultar parkings disponibles, seleccionar una opcion, reservar una plaza, confirmar la reserva, iniciar una navegacion hacia el parking y, al llegar, visualizar un croquis interior con la plaza asignada.

El prototipo incorpora varias modalidades de interaccion:

- **Voz:** comandos como "buscar aparcamiento", "reservar", "confirmar", "cancelar" o "he llegado".
- **Gestos:** reconocimiento mediante camara y MediaPipe.
- **GPS:** geolocalizacion para apoyar la navegacion y la deteccion de llegada.
- **Interfaz tactil:** botones de apoyo para asegurar que el flujo pueda completarse si una modalidad no esta disponible.

La tabla siguiente resume los gestos principales implementados:

| Gesto | Accion en el sistema |
|---|---|
| Pulgar arriba | Reservar plaza |
| Gesto OK | Confirmar reserva |
| Dos dedos / victoria | Pasar al siguiente parking |
| Dedo indice levantado | Ver detalle del parking |
| Pulgar abajo | Cancelar |
| Mano abierta | Cancelar |
| Puño cerrado | Volver |

Para las pruebas se accede al prototipo desde un movil mediante una URL publica HTTPS generada con un tunel, de forma que las APIs de camara, GPS y voz funcionen en un contexto seguro.

---

## 3. Protocolo de evaluacion

### 3.1 Objetivo del estudio

Evaluar la usabilidad y adecuacion contextual del prototipo SmartPark durante un flujo representativo de busqueda y reserva de aparcamiento, prestando especial atencion a la interaccion por voz, gestos y GPS.

### 3.2 Contexto de realizacion

Las sesiones se realizaran en un garaje domestico con varios coches aparcados. Este espacio se considera un entorno simulado pero representativo, ya que permite recrear una situacion de llegada a un parking, busqueda de plaza y consulta de una aplicacion de apoyo. Por seguridad, todas las interacciones se llevaran a cabo con el coche parado.

El escenario propuesto al participante sera:

> "Imagina que estas llegando a un garaje o parking y necesitas localizar rapidamente una plaza disponible. Debes utilizar SmartPark para buscar una plaza, reservarla, confirmar la accion y llegar hasta la plaza asignada."

### 3.3 Duracion prevista

Cada sesion tendra una duracion aproximada de 8 a 12 minutos:

1. Explicacion breve y consentimiento: 1-2 minutos.
2. Ejecucion de tareas: 4-6 minutos.
3. Cuestionario y reflexion final: 3-4 minutos.

### 3.4 Material necesario

- Movil con acceso a la URL publica del prototipo.
- Ordenador ejecutando el servidor SmartPark.
- Terminal con tunel HTTPS activo.
- Coche parado en el garaje.
- Camara o movil adicional para grabar fragmentos de la sesion.
- Hoja de observacion.
- Cuestionario breve de usabilidad.
- Formulario de consentimiento informado.

### 3.5 Tareas propuestas

| Tarea | Descripcion | Criterio de exito |
|---|---|---|
| T1 | Abrir SmartPark desde el movil y comprobar que el sistema conecta | La aplicacion carga y aparece estado conectado |
| T2 | Buscar aparcamiento usando voz o boton | Se muestra la lista de parkings |
| T3 | Navegar entre opciones y entrar al detalle de un parking | El participante accede a la vista de detalle |
| T4 | Reservar una plaza usando gesto, voz o boton | El sistema muestra la reserva activa |
| T5 | Confirmar la reserva | El sistema cambia a la vista de navegacion |
| T6 | Activar GPS o continuar con la navegacion simulada | El usuario comprende la pantalla de navegacion |
| T7 | Indicar llegada y localizar la plaza asignada | Se muestra el croquis final con la plaza |
| T8 | Expresar opinion final sobre la experiencia | Se recogen comentarios y sugerencias |

### 3.6 Aspectos a observar

Durante la prueba se observaran los siguientes aspectos:

- Si el participante entiende la finalidad de cada pantalla.
- Si identifica correctamente como buscar, reservar y confirmar.
- Si los comandos de voz resultan naturales.
- Si los gestos son faciles de recordar y ejecutar.
- Si el usuario depende de botones tactiles para completar el flujo.
- Si aparecen errores, dudas o bloqueos.
- Si la vista final del croquis ayuda a comprender donde esta la plaza.
- Si el entorno de garaje afecta al uso de voz, camara o GPS.

### 3.7 Metricas de evaluacion

Se recogeran datos cualitativos y, cuando sea posible, cuantitativos:

| Metrica | Tipo | Como se recoge |
|---|---|---|
| Finalizacion de tareas | Cuantitativa | Completada / No completada / Con ayuda |
| Numero de errores o dudas | Cuantitativa | Observacion durante la sesion |
| Modalidad utilizada | Cualitativa | Voz, gesto, boton o combinacion |
| Facilidad percibida | Cuantitativa | Escala 1-5 |
| Satisfaccion general | Cuantitativa | Escala 1-5 |
| Comentarios del usuario | Cualitativa | Preguntas finales |
| Propuestas de mejora | Cualitativa | Reflexion "I like, I wish, What if" |

---

## 4. Tecnicas de validacion utilizadas

La evaluacion combina tres tecnicas centradas en el usuario.

### 4.1 Elicitacion formativa inicial

Antes de que el participante explore por completo la aplicacion, se le pregunta que espera del sistema al ver la pantalla inicial y que cree que puede hacer. Esta tecnica permite recoger impresiones iniciales sobre la utilidad percibida y la claridad de la interfaz.

Preguntas utilizadas:

- ¿Que crees que permite hacer esta aplicacion?
- ¿Que accion intentarias realizar primero?
- ¿Te parece claro el objetivo del sistema?

### 4.2 Estudio de usabilidad con cuestionario

Despues de completar las tareas, se utiliza un cuestionario breve para valorar facilidad de uso, comprension del flujo, utilidad de las modalidades de interaccion y satisfaccion general.

Cuestionario propuesto, escala 1-5:

| Pregunta | Escala |
|---|---|
| Me ha resultado facil entender que tenia que hacer | 1-5 |
| El proceso de busqueda y reserva me ha parecido claro | 1-5 |
| Los gestos me han parecido adecuados para este contexto | 1-5 |
| La interaccion por voz me ha parecido util | 1-5 |
| La pantalla de llegada y croquis final me ha resultado util | 1-5 |
| Usaria un sistema similar en un parking real | 1-5 |
| Satisfaccion general con la experiencia | 1-5 |

### 4.3 Reflexion "I like, I wish, What if"

Al final de cada sesion se pide al participante una reflexion breve:

- **I like:** que le ha gustado del sistema.
- **I wish:** que echa en falta o cambiaria.
- **What if:** que posibilidad o mejora propondria para una version futura.

Esta tecnica permite recoger opiniones abiertas y detectar oportunidades de mejora que no siempre aparecen en un cuestionario cerrado.

---

## 5. Participantes y criterios de inclusion

La evaluacion se realizara con al menos seis participantes que no hayan formado parte del desarrollo del proyecto. Se priorizaran personas con experiencia basica en el uso de moviles y familiaridad general con situaciones de busqueda de aparcamiento, aunque no es necesario que todas conduzcan habitualmente.

### 5.1 Criterios de inclusion

- No haber participado en el desarrollo de SmartPark.
- Aceptar el consentimiento informado.
- Poder interactuar con un movil durante la sesion.
- Comprender el escenario simulado de busqueda de aparcamiento.
- En la medida de lo posible, contar con experiencia como conductor/a o usuario/a habitual de parkings.

### 5.2 Perfil de participantes

| Participante | Perfil | Experiencia con conduccion/parking | Observaciones |
|---|---|---|---|
| Participante 1 | [Completar] | [Completar] | [Completar] |
| Participante 2 | [Completar] | [Completar] | [Completar] |
| Participante 3 | [Completar] | [Completar] | [Completar] |
| Participante 4 | [Completar] | [Completar] | [Completar] |
| Participante 5 | [Completar] | [Completar] | [Completar] |
| Participante 6 | [Completar] | [Completar] | [Completar] |

---

## 6. Consentimiento informado y privacidad

Antes de comenzar cada sesion, se informara a los participantes de:

- La finalidad academica de la prueba.
- Que se evaluara el prototipo, no a la persona.
- Que algunas partes de la sesion podran grabarse en video.
- Que las grabaciones se usaran unicamente como evidencia para la asignatura.
- Que se evitara mostrar datos personales innecesarios.
- Que pueden interrumpir la prueba en cualquier momento.

Los participantes se identificaran en la memoria como Participante 1, Participante 2, etc., evitando incluir nombres completos u otros datos personales.

Texto breve de consentimiento:

> Acepto participar voluntariamente en la prueba de evaluacion del prototipo SmartPark. Entiendo que la sesion puede ser grabada con fines exclusivamente academicos y que mis datos personales no seran publicados. Tambien entiendo que puedo detener mi participacion en cualquier momento.

Tabla de consentimiento:

| Participante | Consentimiento obtenido | Autoriza grabacion | Fecha |
|---|---|---|---|
| Participante 1 | [Si/No] | [Si/No] | [Completar] |
| Participante 2 | [Si/No] | [Si/No] | [Completar] |
| Participante 3 | [Si/No] | [Si/No] | [Completar] |
| Participante 4 | [Si/No] | [Si/No] | [Completar] |
| Participante 5 | [Si/No] | [Si/No] | [Completar] |
| Participante 6 | [Si/No] | [Si/No] | [Completar] |

---

## 7. Desarrollo de las sesiones

### 7.1 Organizacion

Las sesiones se organizaran de forma individual. Cada participante recibira una breve explicacion del contexto y despues realizara las tareas propuestas usando el movil. Un miembro del equipo observara la sesion y tomara notas, mientras otro podra grabar fragmentos relevantes de la interaccion.

La prueba se realizara con el coche parado dentro de un garaje domestico con otros vehiculos alrededor, usando el entorno como simulacion representativa de llegada a un parking. No se pedira al participante que conduzca mientras interactua con el sistema.

### 7.2 Guion de la sesion

1. Presentacion breve del objetivo.
2. Lectura y aceptacion del consentimiento.
3. Elicitacion inicial: primeras impresiones.
4. Realizacion de tareas T1-T7.
5. Observacion de dudas, errores y comentarios.
6. Cuestionario breve de usabilidad.
7. Reflexion "I like, I wish, What if".

### 7.3 Hoja de observacion por participante

| Participante | Tarea | Resultado | Dificultades observadas | Modalidad usada | Comentarios |
|---|---|---|---|---|---|
| Participante 1 | T1-T7 | [Completar] | [Completar] | [Completar] | [Completar] |
| Participante 2 | T1-T7 | [Completar] | [Completar] | [Completar] | [Completar] |
| Participante 3 | T1-T7 | [Completar] | [Completar] | [Completar] | [Completar] |
| Participante 4 | T1-T7 | [Completar] | [Completar] | [Completar] | [Completar] |
| Participante 5 | T1-T7 | [Completar] | [Completar] | [Completar] | [Completar] |
| Participante 6 | T1-T7 | [Completar] | [Completar] | [Completar] | [Completar] |

---

## 8. Videos demostrativos

Se prepararan videos demostrativos breves en formato MP4 H.264 o enlaces privados, manteniendo el tamaño total por debajo de 100 MB. Los videos se grabaran en el garaje con el coche parado, mostrando principalmente la pantalla del movil, las manos del participante y el contexto de aparcamiento.

### Video 1 - Flujo principal completo

**Objetivo:** mostrar busqueda, seleccion, reserva, confirmacion, navegacion y llegada.

Guion resumido:

1. Coche parado en el garaje.
2. Frase: "Estoy llegando al garaje y voy a usar SmartPark para encontrar una plaza libre."
3. Comando: "Buscar aparcamiento."
4. Gesto dos dedos para pasar de opcion.
5. Gesto dedo indice para entrar al detalle.
6. Gesto pulgar arriba para reservar.
7. Gesto OK para confirmar.
8. Frase: "Ahora el sistema me guia hasta la plaza reservada."
9. Comando o boton: "He llegado."
10. Mostrar croquis final con la plaza asignada.

**Archivo o enlace:** [Completar enlace o nombre del archivo]

### Video 2 - Interaccion multimodal

**Objetivo:** evidenciar uso de voz, gestos y ubicacion.

Guion resumido:

1. Coche parado en el garaje.
2. Frase: "En este video mostramos la interaccion multimodal de SmartPark mediante voz, gestos y ubicacion."
3. Activar voz.
4. Comando: "Buscar aparcamiento."
5. Gesto dos dedos para pasar a la siguiente opcion.
6. Gesto dedo indice para ver detalle.
7. Gesto pulgar arriba para reservar.
8. Gesto OK para confirmar.
9. Activar GPS.
10. Frase: "SmartPark combina distintas modalidades de interaccion para reducir la dependencia del tacto."

**Archivo o enlace:** [Completar enlace o nombre del archivo]

### Video 3 - Punto de friccion

**Objetivo:** mostrar una dificultad real o representativa durante la evaluacion.

Guion recomendado:

1. Coche parado en el garaje.
2. Frase: "En este fragmento mostramos una dificultad detectada durante la prueba."
3. Activar voz.
4. Comando: "Buscar aparcamiento."
5. Repetir si el sistema no responde correctamente.
6. Frase del participante: "No me lo ha reconocido a la primera."
7. Continuar usando boton o gesto.
8. Frase: "Esta dificultad se tendra en cuenta en el analisis posterior para identificar mejoras."

**Archivo o enlace:** [Completar enlace o nombre del archivo]

---

## 9. Analisis de resultados

> Esta seccion debe completarse despues de realizar las seis sesiones.

### 9.1 Sintesis cuantitativa

| Metrica | Resultado |
|---|---|
| Participantes que completaron el flujo completo | [Completar] / 6 |
| Participantes que necesitaron ayuda | [Completar] / 6 |
| Participantes que usaron voz correctamente | [Completar] / 6 |
| Participantes que usaron gestos correctamente | [Completar] / 6 |
| Participantes que tuvieron problemas con permisos, GPS o camara | [Completar] / 6 |
| Puntuacion media de facilidad de uso | [Completar] / 5 |
| Puntuacion media de satisfaccion | [Completar] / 5 |

### 9.2 Sintesis cualitativa

| Tema observado | Evidencia o comentario | Participantes afectados |
|---|---|---|
| Comprension del flujo | [Completar] | [Completar] |
| Uso de voz | [Completar] | [Completar] |
| Uso de gestos | [Completar] | [Completar] |
| Navegacion y GPS | [Completar] | [Completar] |
| Croquis final | [Completar] | [Completar] |
| Dudas o fricciones | [Completar] | [Completar] |

### 9.3 Resultados del cuestionario

| Pregunta | Media | Comentario |
|---|---|---|
| Facilidad para entender que hacer | [Completar] | [Completar] |
| Claridad del proceso de busqueda y reserva | [Completar] | [Completar] |
| Adecuacion de los gestos | [Completar] | [Completar] |
| Utilidad de la voz | [Completar] | [Completar] |
| Utilidad del croquis final | [Completar] | [Completar] |
| Uso potencial en parking real | [Completar] | [Completar] |
| Satisfaccion general | [Completar] | [Completar] |

---

## 10. Problemas detectados y aspectos positivos

### 10.1 Problemas detectados

> Completar tras las pruebas. Posibles ejemplos si aparecen durante la evaluacion:

- Algunos participantes pueden no saber inicialmente si deben usar voz, gesto o boton.
- La voz puede fallar en determinados navegadores o entornos con ruido.
- Los gestos pueden requerir repetir la accion si la camara no detecta bien la mano.
- El GPS en interiores puede no ser preciso, especialmente dentro de un garaje.
- La necesidad de permisos de camara o ubicacion puede interrumpir el flujo.

Problemas reales observados:

| Problema | Evidencia | Posible mejora |
|---|---|---|
| [Completar] | [Completar] | [Completar] |
| [Completar] | [Completar] | [Completar] |
| [Completar] | [Completar] | [Completar] |

### 10.2 Aspectos que funcionaron correctamente

> Completar tras las pruebas. Posibles aspectos positivos:

- El flujo de busqueda-reserva-confirmacion puede completarse de forma rapida.
- Los gestos principales son visualmente claros y faciles de explicar.
- El croquis final ayuda a cerrar la experiencia mostrando la plaza asignada.
- La combinacion de modalidades permite continuar aunque una de ellas falle.

Aspectos reales observados:

| Aspecto positivo | Evidencia |
|---|---|
| [Completar] | [Completar] |
| [Completar] | [Completar] |
| [Completar] | [Completar] |

---

## 11. Hallazgos relevantes

> Completar tras analizar las sesiones.

Hallazgos previstos a confirmar o descartar:

1. La multimodalidad puede mejorar la flexibilidad del sistema, pero requiere que el usuario entienda claramente que opciones tiene disponibles.
2. En un entorno de garaje, el GPS puede ser menos fiable, por lo que la llegada manual funciona como mecanismo de respaldo.
3. La deteccion de gestos depende de la posicion de la mano, la iluminacion y la estabilidad de la camara.
4. La vista de croquis final puede ser uno de los elementos mas utiles para reducir incertidumbre al llegar.

Hallazgos finales:

- **Hallazgo 1:** [Completar]
- **Hallazgo 2:** [Completar]
- **Hallazgo 3:** [Completar]

---

## 12. Reflexion final

### 12.1 Conclusiones del estudio de usuario

> Completar tras las sesiones.

La evaluacion permitira comprobar si SmartPark responde adecuadamente al problema inicial de encontrar aparcamiento rapidamente y reducir la incertidumbre del conductor. A partir de las observaciones y comentarios de los participantes, se podra valorar si el flujo principal es comprensible, si las modalidades no tactiles resultan adecuadas y si el sistema aporta valor en un contexto de llegada a un parking.

Conclusiones finales:

- [Completar conclusion 1]
- [Completar conclusion 2]
- [Completar conclusion 3]

### 12.2 Reflexion acerca del diseno y prototipo final

El prototipo final integra busqueda de parkings, reserva de plaza, confirmacion, navegacion y visualizacion de un croquis interior. Esta combinacion permite representar un recorrido completo del usuario, desde la necesidad inicial de aparcar hasta la localizacion de la plaza asignada.

Una decision relevante del diseno es mantener varias modalidades de interaccion. La voz y los gestos permiten explorar una experiencia menos dependiente del tacto, pero los botones siguen siendo importantes como respaldo cuando las condiciones tecnicas no son ideales. Esta combinacion aumenta la robustez del prototipo durante la evaluacion.

Aspectos a completar tras las pruebas:

- Que elementos del prototipo fueron mas comprensibles.
- Que pantallas o acciones generaron mas dudas.
- Que modalidad resulto mas adecuada para los participantes.
- Que cambios deberian priorizarse en una version futura.

### 12.3 Reflexion acerca de la metodologia de diseno

El proyecto ha seguido un recorrido inspirado en Design Thinking y Design Sprint: entender el problema, definir oportunidades, idear soluciones, prototipar y validar con usuarios. La fase P3 completa este proceso al contrastar el prototipo con personas externas al equipo y recoger evidencia sobre su uso.

La evaluacion con usuarios permite pasar de una valoracion interna del equipo a una observacion mas realista de la experiencia. Este paso es especialmente importante en sistemas ubicuos, donde el contexto fisico, los sensores, la postura del usuario y las condiciones del entorno influyen directamente en la interaccion.

### 12.4 Reflexion sobre el uso de IA

Durante el desarrollo y documentacion del proyecto se ha utilizado asistencia de IA como apoyo para estructurar ideas, revisar requisitos, preparar guiones de evaluacion y organizar la memoria. Su uso se ha entendido como una herramienta de apoyo, no como sustitucion del trabajo de diseno, implementacion y validacion del equipo.

La responsabilidad final sobre el contenido, las decisiones de diseno, la ejecucion de las pruebas y el analisis de resultados corresponde al equipo. La IA ha sido util para ordenar la documentacion y detectar elementos pendientes del entregable, pero las conclusiones finales deberan basarse en las evidencias recogidas durante las sesiones con usuarios.

---

## 13. Anexos

### Anexo A - Formulario de consentimiento informado

**Titulo del estudio:** Evaluacion del prototipo SmartPark  
**Finalidad:** Evaluar la usabilidad y experiencia de uso de un prototipo academico para busqueda y reserva de aparcamiento.  
**Participacion:** La participacion es voluntaria. La persona puede detener la prueba en cualquier momento.  
**Grabacion:** Se podran grabar fragmentos de la interaccion con fines academicos.  
**Privacidad:** Los datos se trataran de forma anonima usando identificadores como Participante 1, Participante 2, etc.  

Declaracion:

> Acepto participar en la prueba de evaluacion de SmartPark y autorizo el uso de las observaciones y grabaciones con fines exclusivamente academicos.

| Participante | Firma o aceptacion | Fecha |
|---|---|---|
| Participante 1 | [Completar] | [Completar] |
| Participante 2 | [Completar] | [Completar] |
| Participante 3 | [Completar] | [Completar] |
| Participante 4 | [Completar] | [Completar] |
| Participante 5 | [Completar] | [Completar] |
| Participante 6 | [Completar] | [Completar] |

### Anexo B - Cuestionario post-prueba

Escala: 1 = totalmente en desacuerdo, 5 = totalmente de acuerdo.

| Pregunta | P1 | P2 | P3 | P4 | P5 | P6 |
|---|---|---|---|---|---|---|
| Me ha resultado facil entender que tenia que hacer |  |  |  |  |  |  |
| El proceso de busqueda y reserva me ha parecido claro |  |  |  |  |  |  |
| Los gestos me han parecido adecuados |  |  |  |  |  |  |
| La voz me ha parecido util |  |  |  |  |  |  |
| El croquis final me ha resultado util |  |  |  |  |  |  |
| Usaria un sistema similar en un parking real |  |  |  |  |  |  |
| Satisfaccion general |  |  |  |  |  |  |

### Anexo C - Reflexion "I like, I wish, What if"

| Participante | I like | I wish | What if |
|---|---|---|---|
| Participante 1 | [Completar] | [Completar] | [Completar] |
| Participante 2 | [Completar] | [Completar] | [Completar] |
| Participante 3 | [Completar] | [Completar] | [Completar] |
| Participante 4 | [Completar] | [Completar] | [Completar] |
| Participante 5 | [Completar] | [Completar] | [Completar] |
| Participante 6 | [Completar] | [Completar] | [Completar] |

### Anexo D - Registro de videos

| Video | Descripcion | Archivo o enlace | Participantes visibles | Observaciones |
|---|---|---|---|---|
| Video 1 | Flujo principal completo | [Completar] | [Completar] | [Completar] |
| Video 2 | Interaccion multimodal | [Completar] | [Completar] | [Completar] |
| Video 3 | Punto de friccion | [Completar] | [Completar] | [Completar] |

