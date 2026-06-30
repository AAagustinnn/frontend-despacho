# Guia de cambios y configuracion de GitHub Actions

Este archivo resume todo lo que se preparo en el repositorio para cumplir la evaluacion EP3 usando AWS EKS, Amazon ECR, Kubernetes y GitHub Actions desde un solo repositorio.

## 1. Objetivo del trabajo

La pauta pide demostrar:

- Cluster AWS EKS funcional.
- Frontend y backend desplegados en el cluster.
- Imagenes almacenadas en Amazon ECR.
- Autoscaling con HPA.
- Secrets y credenciales bien manejados.
- Pipeline CI/CD automatizado con GitHub Actions.
- Logs, metricas, tiempos y validacion Front -> Back.

Para eso el repo quedo armado como monorepo:

```text
frontend React + backend Node + Docker + Kubernetes + EKS + GitHub Actions
```

## 2. Cambios realizados

### Frontend

Se corrigieron las llamadas API del frontend.

Antes habia IPs fijas como:

```text
http://192.168...
```

Eso no sirve bien en EKS porque los pods cambian y la comunicacion debe hacerse por Services de Kubernetes.

Ahora el frontend llama rutas relativas:

```text
/api/v1/ventas
/api/v1/despachos
```

Archivos modificados:

```text
src/componentes/CrudAdmin/TableCompras.jsx
src/componentes/CrudAdmin/TableDespachos.jsx
src/componentes/CrudAdmin/FormDespacho.jsx
src/componentes/CrudAdmin/FormCierreDespacho.jsx
vite.config.js
nginx.conf
```

Tambien se actualizo la copia anidada en:

```text
frontend-despacho/
```

para no dejar evidencia contradictoria con IPs antiguas.

### Proxy Nginx

Se modifico `nginx.conf` para que el frontend pueda comunicarse con el backend dentro del cluster.

Rutas configuradas:

```text
/api/v1/ventas     -> http://back-ventas:8080/api/v1/ventas
/api/v1/despachos  -> http://back-despachos:8080/api/v1/despachos
```

Esto permite demostrar comunicacion Front -> Back usando DNS interno de Kubernetes.

### Backend

Se agrego un backend simple en Node.js para tener servicios reales dentro del mismo repo.

Archivos agregados:

```text
backend/server.js
backend/package.json
Dockerfile.backend
```

El backend expone:

```text
GET  /health
GET  /api/v1/ventas
PUT  /api/v1/ventas/:id
GET  /api/v1/despachos
POST /api/v1/despachos
PUT  /api/v1/despachos/:id
```

En Kubernetes se despliega dos veces con la misma imagen:

```text
back-ventas
back-despachos
```

Cada deployment usa una variable `SERVICE_NAME` distinta para identificar logs.

### Docker Compose local

Se actualizo `docker-compose.yml` para poder levantar todo localmente:

```powershell
docker compose up --build
```

Servicios locales:

```text
frontend-despacho -> puerto 80
back-ventas       -> puerto 8081
back-despachos    -> puerto 8082
```

### EKS

Se agrego configuracion para crear el cluster con `eksctl`:

```text
eks/cluster-config.yaml
```

El cluster se llama:

```text
despacho-eks
```

Region:

```text
us-east-1
```

Node group:

```text
despacho-workers
```

con minimo 2 nodos y maximo 4.

### Kubernetes

Se agrego la carpeta:

```text
k8s/
```

Contiene:

```text
k8s/namespace.yaml
k8s/app-secret.yaml
k8s/frontend-deployment.yaml
k8s/frontend-service.yaml
k8s/back-ventas-deployment.yaml
k8s/back-ventas-service.yaml
k8s/back-despachos-deployment.yaml
k8s/back-despachos-service.yaml
k8s/back-ventas-hpa.yaml
k8s/back-despachos-hpa.yaml
k8s/kustomization.yaml
```

El namespace usado es:

```text
despacho
```

El frontend queda publico con:

```text
Service type LoadBalancer
```

Los backend quedan internos con:

```text
Service type ClusterIP
```

### Autoscaling

Se agregaron dos HPA:

```text
back-ventas-hpa
back-despachos-hpa
```

Configuracion:

```text
minReplicas: 1
maxReplicas: 4
averageUtilization: 50
```

Esto significa que Kubernetes intentara escalar los pods cuando el uso promedio de CPU llegue al 50%.

### GitHub Actions

Se elimino el workflow anterior que desplegaba en EC2 y Docker Hub.

Se agrego:

```text
.github/workflows/eks-deploy.yml
```

Este workflow hace:

1. Checkout del codigo.
2. Configura credenciales AWS desde GitHub Secrets.
3. Inicia sesion en Amazon ECR.
4. Crea repositorios ECR si no existen.
5. Construye imagen frontend.
6. Sube imagen frontend a ECR.
7. Construye imagen backend.
8. Sube imagen backend a ECR.
9. Configura `kubectl` contra el cluster EKS.
10. Reemplaza las imagenes en los manifests Kubernetes.
11. Ejecuta `kubectl apply -k k8s`.
12. Espera los rollouts.
13. Muestra pods, services, HPA y logs como evidencia.

## 3. Que debes hacer para que GitHub Actions corra

### Paso 1: Subir estos archivos al repositorio GitHub

Tu repo objetivo es:

```text
https://github.com/AAagustinnn/frontend-despacho
```

Esta carpeta local no estaba inicializada como repo Git al momento de revisar, por eso debes asegurarte de subir estos cambios al repo real.

Puedes hacerlo copiando los archivos a un clon limpio del repo o inicializando Git en esta carpeta.

Opcion recomendada:

```powershell
git clone https://github.com/AAagustinnn/frontend-despacho.git
```

Luego copias encima los archivos preparados y haces:

```powershell
git add .
git commit -m "Configura despliegue EP3 en EKS con GitHub Actions"
git push origin main
```

Si usas rama `deploy`, tambien sirve porque el workflow escucha `main` y `deploy`.

### Paso 2: Iniciar AWS Academy Learner Lab

En AWS Academy:

1. Iniciar Learner Lab.
2. Ir a `AWS Details`.
3. Copiar las credenciales de `AWS CLI`.
4. Pegarlas en tu archivo local:

```powershell
notepad $env:USERPROFILE\.aws\credentials
```

Validar:

```powershell
aws sts get-caller-identity
```

### Paso 3: Crear el cluster EKS

Antes de correr GitHub Actions debe existir el cluster.

Ejecutar:

```powershell
eksctl create cluster -f eks/cluster-config.yaml
```

Validar:

```powershell
kubectl get nodes
```

Debes ver nodos en estado:

```text
Ready
```

### Paso 4: Instalar metrics-server

Esto es necesario para que HPA tenga metricas de CPU.

```powershell
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

Esperar 1 o 2 minutos y validar:

```powershell
kubectl top nodes
```

### Paso 5: Configurar Secrets en GitHub

En GitHub:

```text
Repo -> Settings -> Secrets and variables -> Actions -> New repository secret
```

Crear estos secrets:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_SESSION_TOKEN
AWS_REGION
EKS_CLUSTER_NAME
```

Valores:

```text
AWS_REGION=us-east-1
EKS_CLUSTER_NAME=despacho-eks
```

Los otros tres salen de AWS Academy Learner Lab:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_SESSION_TOKEN
```

Importante:

Cada vez que reinicies el Learner Lab, las credenciales cambian. Debes actualizar los secrets antes de volver a correr el pipeline.

### Paso 6: Ejecutar GitHub Actions

El workflow corre automaticamente cuando haces push a:

```text
main
deploy
```

Tambien puedes correrlo manualmente:

```text
GitHub -> Actions -> CI/CD Despacho EKS -> Run workflow
```

### Paso 7: Revisar que el deploy termino bien

En GitHub Actions debe verse exitoso el job:

```text
build-push-deploy
```

Luego en tu terminal:

```powershell
kubectl get pods,svc,hpa -n despacho -o wide
```

Debes ver:

```text
frontend-despacho
back-ventas
back-despachos
back-ventas-hpa
back-despachos-hpa
```

### Paso 8: Obtener URL publica

Ejecutar:

```powershell
kubectl get svc frontend-despacho -n despacho
```

Copiar el valor de:

```text
EXTERNAL-IP
```

Abrir en navegador:

```text
http://<EXTERNAL-IP>
```

En AWS normalmente aparece como DNS de ELB, por ejemplo:

```text
http://xxxx.us-east-1.elb.amazonaws.com
```

## 4. Evidencias para la presentacion

### Cluster EKS

```powershell
kubectl get nodes
```

Capturas recomendadas:

- Pantalla del cluster EKS en AWS.
- Node group.
- VPC, subredes y Security Groups.

### Deployments y Services

```powershell
kubectl get deployments -n despacho
kubectl get svc -n despacho
kubectl get pods -n despacho -o wide
```

### Imagenes ECR

En AWS ECR mostrar repositorios:

```text
frontend-despacho
backend-despacho
```

### HPA

```powershell
kubectl get hpa -n despacho
kubectl top pods -n despacho
```

### Logs

```powershell
kubectl logs deployment/back-ventas -n despacho --tail=30
kubectl logs deployment/back-despachos -n despacho --tail=30
```

### Recuperacion ante fallos

Eliminar un pod:

```powershell
kubectl delete pod -l app=back-ventas -n despacho
```

Ver que Kubernetes lo recrea:

```powershell
kubectl get pods -n despacho -w
```

### Validacion Front -> Back

Abrir el frontend publico y probar:

1. Consultar ordenes de compra.
2. Generar despacho.
3. Revisar ordenes de despacho.
4. Cerrar despacho.

Eso demuestra que el frontend se comunica con los servicios backend dentro del cluster.

## 5. Comandos rapidos para la demo

Estado general:

```powershell
kubectl get pods,svc,hpa -n despacho -o wide
```

Logs:

```powershell
kubectl logs deployment/back-ventas -n despacho --tail=30
kubectl logs deployment/back-despachos -n despacho --tail=30
```

URL publica:

```powershell
kubectl get svc frontend-despacho -n despacho
```

Autoscaling:

```powershell
kubectl get hpa -n despacho -w
```

Self-healing:

```powershell
kubectl delete pod -l app=back-ventas -n despacho
kubectl get pods -n despacho -w
```

## 6. Limpieza final

Para no gastar creditos de AWS Academy:

```powershell
eksctl delete cluster -f eks/cluster-config.yaml
```

Despues cerrar el Learner Lab.

## 7. Checklist final antes de presentar

- Cluster `despacho-eks` creado.
- `kubectl get nodes` muestra nodos `Ready`.
- `metrics-server` instalado.
- GitHub Secrets actualizados con credenciales vigentes del Learner Lab.
- Workflow `CI/CD Despacho EKS` ejecutado correctamente.
- Imagenes visibles en ECR.
- Pods en estado `Running`.
- Frontend con URL publica.
- HPA visible con `kubectl get hpa -n despacho`.
- Logs disponibles con `kubectl logs`.
- Prueba funcional Front -> Back realizada.
- Capturas guardadas para respaldo.
