# Terraform learning example

The Kubernetes provider requires access to a configured Kubernetes cluster. This is intentionally a small example.

1. Start Minikube and configure `kubectl`.
2. Run `terraform init`.
3. Run `terraform validate`.
4. Inspect `terraform plan` before applying.
5. Only run `terraform apply` if you understand which resource will be created.

Do not use this sample as production infrastructure.
