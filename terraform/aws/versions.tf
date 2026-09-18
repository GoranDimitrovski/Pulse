terraform {
  required_version = ">= 1.9"

  required_providers {
    aws        = { source = "hashicorp/aws", version = "~> 5.60" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.31" }
    random     = { source = "hashicorp/random", version = "~> 3.6" }
  }

  # Local state is fine for one env; switch to an S3 backend when a
  # second person or a second environment shows up.
  # backend "s3" {
  #   bucket = "pulse-tfstate"
  #   key    = "pulse/terraform.tfstate"
  #   region = "eu-central-1"
  # }
}

provider "aws" {
  region = var.region
}

# Talk to the cluster this same config creates.
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name, "--region", var.region]
  }
}
