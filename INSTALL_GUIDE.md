# 🛠️ Docker & Kubernetes Installation Guide (Linux)

Based on my environment check, it appears that Docker and Kubernetes tools are not yet installed in your standard system paths. Follow these steps to set up your enterprise environment.

## 1. Install Docker Engine

Docker is required to build and run your application containers.

```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine & Docker Compose
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Fix Permissions (Required to run Docker without sudo)
sudo usermod -aG docker $USER
sudo chmod 666 /var/run/docker.sock

# Verify installation
sudo docker run hello-world
```

## 2. Install kubectl

`kubectl` is the command-line tool for controlling Kubernetes clusters.

```bash
# Download the latest release
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Install kubectl
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify installation
kubectl version --client
```

## 3. Install MiniKube (Local Kubernetes Cluster)

Since you'll need a cluster to run your pods, MiniKube is the easiest for local development.

```bash
# Download and install
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start your local cluster
minikube start
```

## 4. Run ExpenseAudit AI on K8s

Once installed, you can deploy the app using the manifests I've prepared:

```bash
kubectl apply -f k8s/
```
