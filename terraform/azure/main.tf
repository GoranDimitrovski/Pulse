locals {
  name = var.project
}

resource "azurerm_resource_group" "this" {
  name     = local.name
  location = var.location
}

# ---- Kubernetes cluster --------------------------------------------------
resource "azurerm_kubernetes_cluster" "this" {
  name                = local.name
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  dns_prefix          = local.name
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name       = "default"
    vm_size    = var.node_vm_size
    node_count = var.node_count
  }

  identity {
    type = "SystemAssigned"
  }
}

# ---- Container registry ------------------------------------------------
resource "azurerm_container_registry" "this" {
  name                = replace(local.name, "-", "")
  resource_group_name = azurerm_resource_group.this.name
  location            = azurerm_resource_group.this.location
  sku                 = "Basic"
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                            = azurerm_container_registry.this.id
  role_definition_name             = "AcrPull"
  principal_id                     = azurerm_kubernetes_cluster.this.kubelet_identity.0.object_id
  skip_service_principal_aad_check = true
}

# ---- Database ---------------------------------------------------------
resource "random_password" "db" {
  length  = 32
  special = false
}

resource "azurerm_postgresql_flexible_server" "this" {
  name                          = local.name
  resource_group_name           = azurerm_resource_group.this.name
  location                      = azurerm_resource_group.this.location
  version                       = "17"
  administrator_login           = "pulse"
  administrator_password        = random_password.db.result
  sku_name                      = var.db_sku_name
  storage_mb                    = var.db_storage_mb
  public_network_access_enabled = true # Public + firewall; use VNet integration for prod
  zone                          = "1"
}

resource "azurerm_postgresql_flexible_server_database" "pulse" {
  name      = "pulse"
  server_id = azurerm_postgresql_flexible_server.this.id
}

# Open to Azure services only. Lock to the AKS egress IP if you pin one.
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure" {
  name             = "azure-services"
  server_id        = azurerm_postgresql_flexible_server.this.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# ---- App secret -----------------------------------------------------
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
    DATABASE_URL      = "postgres://pulse:${random_password.db.result}@${azurerm_postgresql_flexible_server.this.fqdn}:5432/pulse?sslmode=require"
    JWT_ACCESS_SECRET = random_password.jwt.result
    CORS_ORIGIN       = var.cors_origin
  }
}
