terraform {
  required_version = ">= 1.9"

  required_providers {
    google     = { source = "hashicorp/google", version = "~> 6.8" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.31" }
    random     = { source = "hashicorp/random", version = "~> 3.6" }
  }

  # Local state; add a gcs backend for a team / second env.
}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_client_config" "this" {}

provider "kubernetes" {
  host                   = "https://${google_container_cluster.this.endpoint}"
  token                  = data.google_client_config.this.access_token
  cluster_ca_certificate = base64decode(google_container_cluster.this.master_auth.0.cluster_ca_certificate)
}
