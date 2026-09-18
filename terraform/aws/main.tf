data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs  = slice(data.aws_availability_zones.available.names, 0, 3)
  name = var.project
}

# ---- Network ---------------------------------------------------------------
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.13"

  name = local.name
  cidr = var.vpc_cidr
  azs  = local.azs

  private_subnets = [for i in range(3) : cidrsubnet(var.vpc_cidr, 4, i)]
  public_subnets  = [for i in range(3) : cidrsubnet(var.vpc_cidr, 4, i + 8)]

  enable_nat_gateway = true
  single_nat_gateway = true # One NAT for cost; go per-AZ if HA egress matters

  # Tags the EKS module's LB integration expects.
  public_subnet_tags  = { "kubernetes.io/role/elb" = "1" }
  private_subnet_tags = { "kubernetes.io/role/internal-elb" = "1" }
}

# ---- Kubernetes cluster ---------------------------------------------------
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.24"

  cluster_name    = local.name
  cluster_version = var.kubernetes_version

  cluster_endpoint_public_access = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  enable_cluster_creator_admin_permissions = true

  eks_managed_node_groups = {
    default = {
      instance_types = var.node_instance_types
      min_size       = var.node_min_size
      max_size       = var.node_max_size
      desired_size   = var.node_min_size
    }
  }
}

# ---- Container registry -------------------------------------------------
resource "aws_ecr_repository" "app" {
  name                 = local.name
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ---- Database -----------------------------------------------------------
resource "random_password" "db" {
  length  = 32
  special = false
}

resource "aws_security_group" "db" {
  name_prefix = "${local.name}-db-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  lifecycle {
    create_before_destroy = true
  }
}

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.9"

  identifier = local.name

  engine               = "postgres"
  engine_version       = "17"
  family               = "postgres17"
  major_engine_version = "17"
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage

  db_name  = "pulse"
  username = "pulse"
  password = random_password.db.result
  port     = 5432

  manage_master_user_password = false

  multi_az               = false # Single-AZ; flip for prod HA
  db_subnet_group_name   = module.vpc.database_subnet_group_name != "" ? module.vpc.database_subnet_group_name : null
  subnet_ids             = module.vpc.private_subnets
  create_db_subnet_group = true
  vpc_security_group_ids = [aws_security_group.db.id]

  skip_final_snapshot = true
  deletion_protection = false
}

# ---- App secret --------------------------------------------------------
# The one k8s object Terraform owns, because it depends on RDS/generated values.
# Deployment/Service/Ingress stay as plain YAML under k8s/.
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
    DATABASE_URL      = "postgres://pulse:${random_password.db.result}@${module.rds.db_instance_endpoint}/pulse"
    JWT_ACCESS_SECRET = random_password.jwt.result
    CORS_ORIGIN       = var.cors_origin
  }
}
