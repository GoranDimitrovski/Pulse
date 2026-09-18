output "cluster_name" {
  value = google_container_cluster.this.name
}

output "ecr_repository_url" {
  description = "Artifact Registry path; push images as <this>/pulse:<tag>"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.this.repository_id}"
}

output "db_endpoint" {
  value = google_sql_database_instance.this.private_ip_address
}

output "kubeconfig_command" {
  value = "gcloud container clusters get-credentials ${google_container_cluster.this.name} --region ${var.region} --project ${var.project_id}"
}
