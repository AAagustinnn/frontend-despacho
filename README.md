# Despacho - Evaluacion EP3 con EKS

Repositorio unico para la Evaluacion Parcial 3 de Introduccion a Herramientas DevOps.
Incluye frontend React, backend Node.js de demo, Dockerfiles, manifiestos Kubernetes,
configuracion de cluster EKS y pipeline GitHub Actions para build, push y deploy.

## Arquitectura

- Frontend: React + Vite servido por Nginx.
- Backend: Node.js HTTP API, desplegado como dos servicios internos:
  - `back-ventas`: expone `/api/v1/ventas`.
  - `back-despachos`: expone `/api/v1/despachos`.
- EKS:
  - Namespace `despacho`.
  - Service `LoadBalancer` publico para el frontend.
  - Services `ClusterIP` internos para backend.
  - HPA para `back-ventas` y `back-despachos`, con umbral CPU 50%.
  - Secret Kubernetes `despacho-secrets` para variables sensibles.
- CI/CD:
  - GitHub Actions construye imagen frontend y backend.
  - Publica ambas imagenes en Amazon ECR.
  - Actualiza los Deployments en EKS y valida rollouts.

## Estructura principal

```text
.
|-- backend/                 # Backend Node.js de demo
|-- eks/cluster-config.yaml  # Cluster EKS con eksctl
|-- k8s/                     # Manifiestos Kubernetes
|-- src/                     # Frontend React
|-- Dockerfile               # Imagen frontend
|-- Dockerfile.backend       # Imagen backend
|-- docker-compose.yml       # Prueba local
|-- nginx.conf               # SPA + proxy Front -> Back
`-- .github/workflows/eks-deploy.yml
```

## Requisitos locales

- Docker Desktop.
- AWS CLI v2.
- kubectl.
- eksctl.
- Cuenta AWS Academy Learner Lab activa.

Verificacion rapida:

```powershell
aws --version
kubectl version --client
eksctl version
docker --version
```

## Prueba local con Docker Compose

```powershell
docker compose up --build
```

Abrir:

```text
http://localhost
```

Endpoints utiles:

```powershell
curl http://localhost/api/v1/ventas
curl http://localhost/api/v1/despachos
```

## Crear el cluster EKS

1. Iniciar AWS Academy Learner Lab.
2. Copiar credenciales en `%UserProfile%\.aws\credentials`.
3. Validar identidad:

```powershell
aws sts get-caller-identity
```

4. Crear cluster:

```powershell
eksctl create cluster -f eks/cluster-config.yaml
```

5. Validar nodos:

```powershell
kubectl get nodes
```

## Instalar metrics-server para HPA

```powershell
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl top nodes
```

Si `kubectl top nodes` aun no muestra datos, esperar 1 o 2 minutos.

## Secrets requeridos en GitHub Actions

Configurar en GitHub: `Settings -> Secrets and variables -> Actions`.

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_SESSION_TOKEN
AWS_REGION
EKS_CLUSTER_NAME
```

Valores recomendados:

```text
AWS_REGION=us-east-1
EKS_CLUSTER_NAME=despacho-eks
```

Las credenciales de AWS Academy cambian cada vez que se reinicia el Learner Lab.
Actualizar los tres secrets de credenciales antes de ejecutar el pipeline.

## Pipeline CI/CD

El workflow `.github/workflows/eks-deploy.yml` se ejecuta en:

- Push a `main`.
- Push a `deploy`.
- Ejecucion manual con `workflow_dispatch`.

Flujo automatizado:

1. Checkout del repo.
2. Configura credenciales AWS usando GitHub Secrets.
3. Login a ECR.
4. Crea repositorios ECR si no existen.
5. Build y push:
   - `frontend-despacho:<sha>`
   - `backend-despacho:<sha>`
6. Actualiza kubeconfig para EKS.
7. Reemplaza imagenes en manifiestos.
8. Aplica `kubectl apply -k k8s`.
9. Espera rollouts y muestra pods, services, HPA y logs.

## Despliegue manual alternativo

Usar esta opcion si se quiere demostrar Kubernetes sin esperar el pipeline.
Primero reemplazar `FRONTEND_IMAGE` y `BACKEND_IMAGE` en los deployments por las imagenes ECR reales.

```powershell
kubectl apply -k k8s
kubectl get pods,svc,hpa -n despacho -o wide
```

Obtener URL publica:

```powershell
kubectl get svc frontend-despacho -n despacho
```

Abrir en navegador:

```text
http://<EXTERNAL-IP-O-DNS>
```

## Evidencias para la rubrica

- IE1 Cluster AWS:
  - `eks/cluster-config.yaml`
  - `kubectl get nodes`
  - Capturas de EKS, VPC, subredes, Security Groups y node group.
- IE2 Despliegue Frontend + Backend:
  - `k8s/*deployment.yaml`
  - `k8s/*service.yaml`
  - Imagenes en ECR.
  - URL publica del frontend.
- IE3 Autoscaling:
  - `k8s/back-ventas-hpa.yaml`
  - `k8s/back-despachos-hpa.yaml`
  - `kubectl get hpa -n despacho`
  - `kubectl top pods -n despacho`
- IE4 Pipeline:
  - `.github/workflows/eks-deploy.yml`
  - Captura de ejecucion exitosa en GitHub Actions.
- IE5 Secrets:
  - GitHub Actions Secrets para AWS.
  - `k8s/app-secret.yaml` para variables del backend.
- IE6 Logs, metricas y tiempos:
  - Tiempo total del workflow en Actions.
  - `kubectl logs deployment/back-ventas -n despacho --tail=30`
  - `kubectl logs deployment/back-despachos -n despacho --tail=30`
- IE7 Validacion funcional:
  - Frontend abierto desde LoadBalancer.
  - Generar despacho desde una venta.
  - Cerrar despacho.
  - Eliminar un pod y mostrar recuperacion:

```powershell
kubectl delete pod -l app=back-ventas -n despacho
kubectl get pods -n despacho -w
```

## Comandos de demo

Estado general:

```powershell
kubectl get pods,svc,hpa -n despacho -o wide
```

Logs:

```powershell
kubectl logs deployment/back-ventas -n despacho --tail=30
kubectl logs deployment/back-despachos -n despacho --tail=30
```

Autoscaling:

```powershell
kubectl get hpa -n despacho -w
```

Simulacion de carga desde un pod temporal:

```powershell
kubectl run load-test -n despacho --rm -it --image=busybox:1.36 --restart=Never -- /bin/sh
wget -q -O- http://back-ventas:8080/api/v1/ventas
```

Para una carga mas fuerte se puede usar `hey` desde el computador:

```powershell
hey -z 3m -c 250 http://<URL_PUBLICA>/api/v1/ventas
```

## Limpieza para no gastar creditos

```powershell
eksctl delete cluster -f eks/cluster-config.yaml
```
