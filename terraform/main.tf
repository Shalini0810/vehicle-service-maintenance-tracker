terraform {
  required_version = ">= 1.5.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.35"
    }
  }
}

provider "kubernetes" {
  config_path = pathexpand("~/.kube/config")
}

resource "kubernetes_namespace" "vehiclecare" {
  metadata {
    name = "vehiclecare-terraform-demo"
    labels = {
      app = "vehiclecare"
      managed_by = "terraform"
    }
  }
}
