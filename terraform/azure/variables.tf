variable "location" {
  type    = string
  default = "westeurope"
}

variable "project" {
  type    = string
  default = "pulse"
}

variable "kubernetes_version" {
  type    = string
  default = "1.30"
}

variable "node_vm_size" {
  type    = string
  default = "Standard_B2s"
}

variable "node_count" {
  type    = number
  default = 2
}

variable "db_sku_name" {
  type    = string
  default = "B_Standard_B1ms"
}

variable "db_storage_mb" {
  type    = number
  default = 32768
}

variable "cors_origin" {
  type        = string
  description = "Comma-separated allowed origins for the API (the frontend URL)."
}
