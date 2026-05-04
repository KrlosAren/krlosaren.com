+++
date = '2026-05-02'
draft = true
title = 'CI/CD con GitHub Actions, ECR y ECS: de push a producción sin tocar la consola'
description = 'Automatiza el despliegue de tu aplicación contenerizada en AWS ECS usando GitHub Actions, ECR y Task Definitions. Paso a paso desde el pipeline hasta el deploy.'
tags = ['devops', 'aws', 'ecs', 'ecr', 'github-actions', 'cicd', 'containers']
images = ['/hero_cicd_ecs_post.png']
+++

Tienes tu aplicación contenerizada, el `Dockerfile` listo, y ya probaste que corre bien en local. El siguiente paso es mandarlo a producción — pero no quieres hacer eso a mano cada vez. Quieres hacer `git push` y que el resto pase solo.

Ese proceso tiene nombre: **CI/CD** (Continuous Integration / Continuous Delivery). Lo que significa en la práctica: cada vez que haces push a `main`, un pipeline automatizado construye tu imagen, la publica, y despliega la nueva versión en tu infraestructura. Podría haber un post entero sobre los conceptos de CI/CD, pero hoy el objetivo es concreto — que funcione.

Para esto vamos a usar tres piezas:

- **ECR** (Elastic Container Registry): el repositorio privado donde vivirán tus imágenes Docker en AWS
- **ECS** (Elastic Container Service): el orquestador que corre tus contenedores
- **GitHub Actions**: el motor del pipeline

## La arquitectura del flujo

Antes de escribir una sola línea de YAML, es útil entender qué va a pasar exactamente cuando hagas push:

```
git push → GitHub Actions → build imagen Docker
                         → push imagen a ECR
                         → actualizar Task Definition (nueva revisión)
                         → actualizar ECS Service → rolling deploy
```

El paso que más sorprende es el tercero. Muchos asumen que basta con subir una imagen nueva a ECR y el Service se actualiza solo — no funciona así. ECS trabaja con **Task Definitions**: un documento que describe qué imagen usar, cuánta CPU/memoria asignar, variables de entorno, puertos, etc. Para desplegar una versión nueva hay que crear una nueva **revisión** del Task Definition con el nuevo URI de imagen, y luego decirle al Service que use esa revisión.

## Pre-requisitos

Para seguir el post necesitas:

- Una cuenta AWS con permisos para crear recursos en ECR, ECS e IAM
- Un repositorio ECR creado (`aws ecr create-repository --repository-name mi-app`)
- Tu aplicación con un `Dockerfile` que ya construya correctamente en local
- Tu repo en GitHub

Si todavía no tienes el cluster ECS, service y task definition, no te preocupes — la siguiente sección es justo eso.

## Bootstrap mínimo (si aún no tienes ECS)

Si todavía no tienes el cluster, service y task definition creados, este es el camino más corto. Vamos a levantar un service corriendo `nginx:latest` como placeholder — el pipeline después lo reemplaza con tu imagen real.

**1. Task Definition** — guárdalo como `task-definition.json`:

```json
{
  "family": "mi-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "containerDefinitions": [{
    "name": "mi-app",
    "image": "nginx:latest",
    "portMappings": [{"containerPort": 80, "protocol": "tcp"}],
    "essential": true
  }]
}
```

**2. Cluster + Service** — registra el TD y crea la infraestructura:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
aws ecs create-cluster --cluster-name mi-cluster
aws ecs create-service \
  --cluster mi-cluster \
  --service-name mi-app-service \
  --task-definition mi-app \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

Reemplaza `subnet-xxx` y `sg-xxx` con IDs de tu VPC default. Si nunca tocaste VPC, AWS te crea una al abrir la cuenta — la consola te da los IDs.

**3. IAM User para el pipeline** — la policy mínima que necesita:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",
      "ecs:DescribeTaskDefinition",
      "ecs:RegisterTaskDefinition",
      "ecs:DescribeServices",
      "ecs:UpdateService",
      "iam:PassRole"
    ],
    "Resource": "*"
  }]
}
```

Crea un IAM User dedicado, asígnale esta policy y genera access keys — las usamos en la sección de Secrets más abajo.

> En otro post de esta serie veremos cómo construir todo esto desde cero con Terraform (VPC, security groups, `ecsTaskExecutionRole`, etc.) sin depender de la consola.

## El CI: construir la imagen del contenedor

El workflow vive en `.github/workflows/deploy.yml`. Para mantenerlo simple dejamos CI y CD en un solo job — todo el flujo en una sola lista de `steps:`, sin pasar outputs entre jobs. El trigger es un PR que se mergea a `main`:

```yaml
name: Build, Push and Deploy <my-app>

on:
  pull_request:
    branches:
      - main
    types:
      - closed

jobs:
  build-and-deploy:
    name: Build, Push & Deploy
    runs-on: ubuntu-latest
    if: github.event.pull_request.merged == true

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Login to AWS ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Set image tags
        id: set-tags
        env:
          ECR_REGISTRY: ${{ secrets.ECR_REGISTRY }}
          ECR_REPOSITORY: ${{ secrets.ECR_REPOSITORY }}
        run: |
          # Usamos los primeros 7 caracteres del SHA del commit como tag
          IMAGE_TAG="${GITHUB_SHA::7}"
          TAG="${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
          echo "image=${TAG}" >> $GITHUB_OUTPUT

      - name: Build & Push Docker image
        id: build-image
        uses: docker/build-push-action@v6
        with:
          push: true
          tags: ${{ steps.set-tags.outputs.image }}
```

Dos detalles que vale la pena destacar:

- **El tag con los primeros 7 caracteres del SHA** te da trazabilidad 1-a-1 entre imagen y commit. Cuando algo se rompe en producción, el tag te lleva directo al `git show <sha>` que la generó — mucho más útil que un `latest` opaco.
- **El guard `if: github.event.pull_request.merged == true` no es opcional.** El evento `closed` también se dispara cuando alguien cierra un PR *sin* mergear, y obviamente no queremos deployar en ese caso. Sin ese `if`, cualquier PR cerrado dispararía un deploy a producción.

## El CD: actualizar ECS

Una vez que la imagen nueva está en ECR, el pipeline tiene que:

1. Descargar el JSON del Task Definition actual
2. Reemplazar el image URI por el nuevo
3. Registrar una nueva revisión del Task Definition
4. Actualizar el Service para que use esa revisión

Estos steps se agregan al mismo job, justo después del `Build & Push Docker image`. GitHub Actions tiene una acción oficial para cada paso:

```yaml
      - name: Descargar task definition actual
        run: |
          aws ecs describe-task-definition \
            --task-definition mi-app \
            --query taskDefinition > task-definition.json

      - name: Actualizar imagen en task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: mi-app
          image: ${{ steps.set-tags.outputs.image }}

      - name: Desplegar en ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: mi-app-service
          cluster: mi-cluster
          wait-for-service-stability: true
```

Un detalle que cuesta horas si lo confundes: **`container-name: mi-app` debe coincidir con el campo `name` del container *dentro* del Task Definition** — no con el nombre del service, ni con el family, ni con el repositorio de ECR. Si pones cualquier otro valor obtendrás `container 'X' not found in task definition` y el deploy falla.

El flag `wait-for-service-stability: true` hace que el pipeline espere hasta que el rolling deploy termine antes de marcar el job como exitoso. Si el nuevo contenedor falla al iniciar, el pipeline falla — lo que es exactamente lo que quieres.

## Secrets en GitHub

Configura estos secrets en `Settings → Secrets and variables → Actions`:

- `AWS_ACCESS_KEY_ID` — access key del IAM User dedicado al pipeline
- `AWS_SECRET_ACCESS_KEY` — su secret correspondiente
- `AWS_REGION` — región donde viven tu ECR y tu ECS (ej. `us-east-1`)
- `ECR_REGISTRY` — host del registry (ej. `123456789012.dkr.ecr.us-east-1.amazonaws.com`)
- `ECR_REPOSITORY` — nombre del repositorio dentro de ECR (ej. `mi-app`)

El IAM User es el que creaste en el bootstrap mínimo, con la policy de ECR + ECS. **Importante:** crea un user *dedicado al pipeline*, no reuses tu user personal — facilita auditoría y rotación si las credenciales se filtran.

## El resultado

Con esto en su lugar, el flujo completo queda:

1. Mergeas un PR a `main` desde la UI de GitHub
2. GitHub Actions detecta el `pull_request closed` con `merged == true` y arranca el job
3. Construye la imagen y la sube a ECR con el tag del commit
4. Registra una nueva revisión del Task Definition
5. ECS hace rolling deploy — reemplaza los contenedores viejos por los nuevos gradualmente
6. El pipeline marca verde cuando el Service estabiliza

Sin abrir la consola. Sin clicks. El pipeline falla ruidosamente si algo sale mal, y no toca producción hasta que la imagen está lista.

¿Y si algo sale mal una vez que ya está en producción? El rollback es una sola línea:

```bash
aws ecs update-service \
  --cluster mi-cluster \
  --service mi-app-service \
  --task-definition mi-app:<revisión-anterior>
```

ECS hace el rolling back con la misma estrategia con la que subió la versión nueva.

## Próximos pasos

Este pipeline funciona y te tiene en producción rápido, pero las access keys son credenciales de larga vida que rotan mal y son difíciles de auditar. El siguiente paso natural es **migrar a OIDC con un IAM Role**: el runner asume el role solo durante la corrida del pipeline, sin credenciales guardadas en GitHub. Lo cubrimos en otro post de la serie.

Otras direcciones naturales para los siguientes artículos: agregar tests automáticos entre el build y el deploy, configurar notificaciones a Slack cuando algo falla, o cachear las layers de Docker en ECR para acelerar builds.
