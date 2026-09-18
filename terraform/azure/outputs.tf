output "cluster_name" {
  value = azurerm_kubernetes_cluster.this.name
}

output "ecr_repository_url" {
  description = "Registry login server; push images as <this>/pulse:<tag>"
  value       = azurerm_container_registry.this.login_server
}

output "db_endpoint" {
  value = azurerm_postgresql_flexible_server.this.fqdn
}

output "kubeconfig_command" {
  value = "az aks get-credentials --resource-group ${azurerm_resource_group.this.name} --name ${azurerm_kubernetes_cluster.this.name}"
}
