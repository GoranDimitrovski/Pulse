# Pulse infrastructure

One root module per cloud — pick one, they don't compose:

| Dir | Cluster | Database | Registry |
|---|---|---|---|
| [`aws/`](aws/) | EKS | RDS Postgres 17 | ECR |
| [`azure/`](azure/) | AKS | Postgres Flexible Server 17 | ACR |
| [`gcp/`](gcp/) | GKE Autopilot | Cloud SQL Postgres 17 | Artifact Registry |

Each provisions the **cluster and its cloud dependencies only** and emits the
same outputs (`cluster_name`, `ecr_repository_url`, `db_endpoint`,
`kubeconfig_command`) plus the same `pulse-env` Secret in a `pulse` namespace.
The app is the cloud-neutral Helm chart in [`../chart/pulse/`](../chart/pulse/)
— only its Service annotations differ, via `--set cloud=`.

## Deploy

```bash
cd aws            # or azure / gcp
cp terraform.tfvars.example terraform.tfvars   # edit cors_origin (+ project_id on gcp)
terraform init && terraform apply

eval "$(terraform output -raw kubeconfig_command)"

helm upgrade --install pulse ../../chart/pulse -n pulse \
  --set cloud=aws \
  --set image.repository="$(terraform output -raw ecr_repository_url)" \
  --set image.tag=<git-sha>
```

Prereqs: the cloud CLI (`aws` / `az` / `gcloud`) authenticated, plus `terraform`
and `helm`. GCP also needs the `container`, `sqladmin`, `servicenetworking`, and
`artifactregistry` APIs enabled on the project.

## Deliberate simplifications

- Local state everywhere — add the cloud's backend for a team / second env.
- Single-AZ / single-instance databases, deletion protection off — flip for prod.
- AWS: one NAT gateway. Azure: Postgres public access + firewall. GCP: private
  Cloud SQL over the default VPC's PSA range.
- No HPA / cluster-autoscaler (GKE Autopilot scales itself).
- LoadBalancer Service, no Ingress — add one when you need host/path routing or
  managed TLS on Azure/GCP.

Not validated here — `terraform` and `helm` aren't installed in this
environment. Run `terraform init && terraform validate` and `helm lint
../chart/pulse` before the first apply.
