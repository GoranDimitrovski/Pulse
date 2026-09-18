locals {
  name = var.project
}

data "google_compute_network" "default" {
  name = "default"
}

# ---- Kubernetes cluster (Autopilot — no node management) ---------------
resource "google_container_cluster" "this" {
  name             = local.name
  location         = var.region
  enable_autopilot = true

  # Autopilot requires this block even if empty.
  ip_allocation_policy {}

  deletion_protection = false
}

# ---- Container registry ----------------------------------------------
resource "google_artifact_registry_repository" "this" {
  location      = var.region
  repository_id = local.name
  format        = "DOCKER"
}

# ---- Private networking for Cloud SQL --------------------------------
resource "google_compute_global_address" "psa" {
  name          = "${local.name}-psa"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = data.google_compute_network.default.id
}

resource "google_service_networking_connection" "psa" {
  network                 = data.google_compute_network.default.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.psa.name]
}

# ---- Database -------------------------------------------------------
resource "random_password" "db" {
  length  = 32
  special = false
}

resource "google_sql_database_instance" "this" {
  name             = local.name
  database_version = "POSTGRES_17"
  region           = var.region

  depends_on = [google_service_networking_connection.psa]

  settings {
    tier = var.db_tier

    ip_configuration {
      ipv4_enabled    = false
      private_network = data.google_compute_network.default.id
    }
  }

  deletion_protection = false # Flip on for prod
}

resource "google_sql_database" "pulse" {
  name     = "pulse"
  instance = google_sql_database_instance.this.name
}

resource "google_sql_user" "pulse" {
  name     = "pulse"
  instance = google_sql_database_instance.this.name
  password = random_password.db.result
}

# ---- App secret ---------------------------------------------------
resource "random_password" "jwt" {
  length  = 48
  special = false
}

resource "kubernetes_namespace" "app" {
  metadata { name = local.name }
}

resource "kubernetes_secret" "app" {
  metadata {
    name      = "pulse-env"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  data = {
    DATABASE_URL      = "postgres://pulse:${random_password.db.result}@${google_sql_database_instance.this.private_ip_address}:5432/pulse"
    JWT_ACCESS_SECRET = random_password.jwt.result
    CORS_ORIGIN       = var.cors_origin
  }
}
