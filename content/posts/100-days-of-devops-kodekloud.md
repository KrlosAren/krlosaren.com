+++
date = '2026-04-14'
draft = false
title = '100 Days of DevOps: Cómo KodeKloud me dio estructura para practicar de verdad'
description = 'La práctica hace al maestro, pero primero necesitas saber qué practicar. Así es cómo KodeKloud y el reto 100 Days of DevOps transformaron mi forma de aprender.'
tags = ['devops', 'learning', 'linux', 'git']
images = ['/hero_img_kodekloud_post_v2.webp']
+++

La práctica constante hace al maestro — algo que hemos escuchado mil veces. Pero hay una pregunta que nadie responde: **¿qué practicamos cuando estamos empezando?**

Si vienes del mundo del desarrollo, la respuesta es casi obvia: la famosa **TODO App**. La haces en todos los lenguajes posibles — JavaScript, Python, Golang, Java, Scala... y si eres aventurero, hasta en COBOL. (¿Alguien escribe en COBOL todavía?) El punto nunca fue la app en sí, sino aprender la sintaxis, entender el flujo y familiarizarte con el entorno. No siempre funciona la idea multimillonaria — ¡la práctica sí!

¿Pero qué pasa cuando quieres entrar al mundo DevOps?

## El problema de practicar DevOps

Cuando empezamos a explorar DevOps, la ruta no está tan clara. Quizás levantamos un contenedor con Docker, lo dejamos corriendo, y nos preguntamos "¿ahora qué?". Instalamos algo con `apt install`, vemos que funciona, y cerramos la terminal sintiéndonos productivos.

El problema es que DevOps es un conjunto enorme de herramientas, conceptos y filosofías: Linux, redes, CI/CD, contenedores, orquestación, seguridad, automatización... ¿por dónde empezar? ¿Qué nivel de profundidad necesitas? ¿Cómo sabes si lo que estás aprendiendo es relevante?

Ahí es donde entra **KodeKloud**.

## ¿Qué es KodeKloud?

[KodeKloud](https://kodekloud.com/) es una plataforma de aprendizaje enfocada en DevOps y Cloud. Lo que la diferencia de ver tutoriales en YouTube o leer documentación es simple: **laboratorios reales**.

No estás siguiendo un video y confiando en que "te saldrá igual". Estás ejecutando comandos en un ambiente real, con servidores reales, resolviendo problemas reales. Si rompes algo, lo rompes de verdad — y tienes que arreglarlo.

Además tiene algo que para mí fue clave: **retos estructurados**. En lugar de abrir un curso interminable y perderte en el módulo 7, tienes objetivos concretos con un entorno listo para practicar. Antes del reto grande, completé el de **Ansible** y el de **Kubernetes** — pocos días pero intensos, con prácticas que me hicieron buscar conceptos que creía conocer y darme cuenta de que solo los había visto de lejos.

## 100 Days of DevOps

El reto más ambicioso de la plataforma es el **100 Days of DevOps**. El nombre lo dice todo: 100 días de práctica continua cubriendo el stack completo de un ingeniero DevOps.

Voy actualmente en el día 31 y puedo decirte que es una locura — en el buen sentido.

Los primeros días arrancan con Linux: gestión de usuarios, permisos de archivos, hardening de SSH, SELinux, firewalls con `iptables`. Cosas que quizás conocías de nombre pero nunca habías configurado a fondo. Luego vienen los servidores web: Apache, Nginx, balanceadores de carga con upstream blocks, SSL con certificados autofirmados, stacks completos LAMP con NFS compartido entre varios servidores de aplicación. Y ahora estamos en Git — pero no el `git commit && git push` del día a día.

## Lo que me sorprendió del camino

Uno de los retos que más me impactó fue crear mi propio servidor Git con un **bare repo**. Un bare repo no es el directorio donde editas tus archivos — es el repositorio central donde vive el árbol de Git, donde se mantiene el historial de cambios. Se inicializa con:

```bash
git init --bare mi-repositorio.git
```

A este repositorio es donde tú o tus devs harán push con los cambios. Es exactamente lo que GitHub, GitLab y otros hacen internamente. Siempre lo había dado por sentado, y resulta que puedes replicarlo en cualquier servidor propio.

Otro concepto que no conocía: limitar a un usuario SSH para que solo tenga acceso a ciertos servicios de tu Linux. Puedes crear una cuenta que no pueda iniciar sesión interactiva pero sí ejecutar servicios específicos:

```bash
sudo useradd -s /sbin/nologin mi-servicio
```

Y si lo combinas con fecha de expiración:

```bash
sudo useradd -e 2025-12-31 -s /sbin/nologin mi-usuario
```

Tienes un usuario que existe por tiempo limitado y con acceso restringido. Los casos de uso son muchos: auditorías, acceso temporal a un externo, servicios desacoplados. Cualquier cosa que reduzca el radio de daño si algo sale mal siempre es bienvenida.

## El repositorio de documentación

Desde el día uno decidí documentar cada reto en un repositorio público: [100-days-devops-journey](https://github.com/KrlosAren/100-days-devops-journey). Cada día tiene su propia entrada con los conceptos clave, los comandos que usé, los errores que cometí y cómo los resolví.

Esto tiene un doble propósito: primero, me fuerza a entender realmente lo que hice — si no puedes explicarlo, no lo entendiste del todo. Segundo, se convierte en mi propia documentación de referencia, un `man` page personal que sé que funciona porque yo mismo lo probé.

Si estás haciendo el reto o algo similar, te recomiendo documentar desde el primer día. La diferencia entre hacer un ejercicio y documentarlo es enorme.

## ¿Vale la pena?

Si estás en DevOps o quieres entrar, mi respuesta corta es: sí. KodeKloud te da lo que ningún tutorial puede darte: estructura y práctica real. No te promete que en 100 días serás experto — eso no existe — pero sí te garantiza que habrás tocado, roto y arreglado más cosas que en meses de ver cursos.

La práctica hace al maestro. Pero primero necesitas saber qué practicar. KodeKloud resuelve exactamente eso.
