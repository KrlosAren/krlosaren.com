+++
date = '2026-04-05'
draft = false
title = 'Systemd para manejar contenedores'
description = 'Cómo usar systemd para gestionar el ciclo de vida de tus contenedores Docker en producción'
tags = ['linux', 'systemd', 'docker', 'contenedores', 'devops']
+++

Cuando trabajas con contenedores en local todo funciona bien. Levantas tu stack con Docker, los servicios responden y puedes cerrar la terminal cuando quieras. El problema aparece cuando quieres desplegar en un servidor real.

Puedes ejecutar tu contenedor con el flag `-d` para hacer *detach* de la terminal y seguir con tu vida. Pero ¿qué pasa si el contenedor se muere? ¿Quién es responsable de reiniciarlo? ¿Qué pasa si el servidor se reinicia en la madrugada?

Aquí entra **systemd** — el administrador de servicios predeterminado en la mayoría de distribuciones Linux, que puedes usar para gestionar tus contenedores exactamente igual que cualquier otro proceso del sistema.

## Creando el service

Para ejecutar un contenedor con systemd necesitas crear un archivo `.service` en `/etc/systemd/system/`:

```bash
sudo nano /etc/systemd/system/nginx.service
```

```ini
[Unit]
Description=Nginx en Docker
After=docker.service
Requires=docker.service

[Service]
Restart=always
ExecStartPre=-/usr/bin/docker stop nginx
ExecStartPre=-/usr/bin/docker rm nginx
ExecStart=/usr/bin/docker run \
    --name nginx \
    -p 80:80 \
    -v /srv/nginx/html:/usr/share/nginx/html:ro \
    -v /srv/nginx/conf:/etc/nginx/conf.d:ro \
    nginx:latest
ExecStop=/usr/bin/docker stop nginx

[Install]
WantedBy=multi-user.target
```

Antes de activar el servicio, crea los directorios que nginx necesita:

```bash
sudo mkdir -p /srv/nginx/html /srv/nginx/conf
echo "<h1>Hola mundo</h1>" | sudo tee /srv/nginx/html/index.html
```

## Entendiendo cada sección

**[Unit]** — define el contexto del servicio. `After=docker.service` asegura que este unit arranque después de que Docker esté listo, y `Requires=docker.service` establece una dependencia dura: si Docker falla, este servicio también se detiene.

**[Service]** — define cómo se ejecuta:

| Opción | Descripción |
|--------|-------------|
| `Restart=always` | Reinicia el servicio si se cae. Otras opciones: `on-failure`, `on-abnormal`, `no` |
| `RestartSec=5` | (opcional) Segundos de espera antes de reiniciar |
| `TimeoutStartSec=30` | Tiempo máximo para considerar que el arranque falló |

Los comandos de ejecución son donde ocurre la magia:

| Opción | Descripción |
|--------|-------------|
| `ExecStartPre=-/usr/bin/docker stop...` | El prefijo `-` hace que ignore errores — útil si el contenedor no existe aún |
| `ExecStartPre=-/usr/bin/docker rm...` | Elimina el contenedor anterior para evitar conflictos de nombre |
| `ExecStart` | Comando principal. Debe correr en **foreground** (sin `-d`) para que systemd lo controle |
| `ExecStop` | Comando para detener limpiamente el contenedor |

**[Install]** — `WantedBy=multi-user.target` activa el servicio en el arranque normal del sistema (equivalente al runlevel 3/5 en sistemas SysV).

## Activando el servicio

Con el archivo creado, tres comandos para dejarlo funcionando:

```bash
# Recargar systemd tras crear o editar el archivo
sudo systemctl daemon-reload

# Habilitar al inicio del sistema
sudo systemctl enable nginx.service

# Iniciar ahora
sudo systemctl start nginx.service
```

## Controlando el ciclo de vida

Una vez configurado, manejas tu contenedor como cualquier servicio de Linux:

```bash
sudo systemctl restart nginx.service
sudo systemctl stop nginx.service
sudo systemctl start nginx.service
```

Y para ver qué está pasando:

```bash
# Estado actual del servicio
sudo systemctl status nginx.service

# Logs en tiempo real
sudo journalctl -u nginx.service -f
```

## Lo mejor de todo

Si tu contenedor se cae, systemd lo reinicia automáticamente. Si tu servidor se reinicia a las 3am, al arrancar el sistema el contenedor vuelve a levantarse solo. Sin que tengas que conectarte a hacer nada manualmente.

Es una solución simple y efectiva para producción cuando no necesitas la complejidad de un orquestador. Si manejas más de un contenedor, también puedes usar systemd para ejecutar un `docker-compose.yml` — solo cambia el `ExecStart` por `docker compose up` y el `ExecStop` por `docker compose down`. Para escenarios más robustos con múltiples servicios, réplicas y alta disponibilidad, la siguiente parada es Kubernetes — pero eso lo veremos en otro post.
