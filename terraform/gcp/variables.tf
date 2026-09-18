variable "project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "europe-west1"
}

variable "project" {
  type    = string
  default = "pulse"
}

variable "db_tier" {
  type    = string
  default = "db-f1-micro"
}

variable "cors_origin" {
  type        = string
  description = "Comma-separated allowed origins for the API (the frontend URL)."
}
