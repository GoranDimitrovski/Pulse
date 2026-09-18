terraform {
  required_version = ">= 1.9"

  required_providers {
    azurerm    = { source = "hashicorp/azurerm", version = "~> 4.3" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.31" }
    random     = { source = "hashicorp/random", version = "~> 3.6" }
  }

  # Local state; add an azurerm backend for a team / second env.
}

provider "azurerm" {
  features {}
}

provider "kubernetes" {
  host                   = azurerm_kubernetes_cluster.this.kube_config.0.host
  client_certificate     = base64decode(azurerm_kubernetes_cluster.this.kube_config.0.client_certificate)
  client_key             = base64decode(azurerm_kubernetes_cluster.this.kube_config.0.client_key)
  cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.this.kube_config.0.cluster_ca_certificate)
}
