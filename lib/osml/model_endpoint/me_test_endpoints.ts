/*
 * Copyright 2023-2025 Amazon.com, Inc. or its affiliates.
 */

import { RemovalPolicy } from "aws-cdk-lib";
import { IRole, Role } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

import { OSMLAccount } from "../osml_account";
import { OSMLContainer, OSMLContainerConfig } from "../osml_container";
import { OSMLVpc } from "../osml_vpc";
import { BaseConfig, ConfigType } from "../utils/base_config";
import { RegionalConfig } from "../utils/regional_config";
import { MEHTTPEndpoint } from "./me_http_endpoint";
import { MESMEndpoint, MESMEndpointConfig } from "./me_sm_endpoint";
import { MEHTTPRole } from "./roles/me_http_role";
import { MESMRole } from "./roles/me_sm_role";

/**
 * Configuration class for defining endpoints for OSML model endpoints.
 */
export class METestEndpointsConfig extends BaseConfig {
  /**
   * Whether to build container resources from source.
   * @default "false"
   */
  public BUILD_FROM_SOURCE: false;

  /**
   * The build path for the container.
   * @default "lib/osml-models"
   */
  public CONTAINER_BUILD_PATH: string;

  /**
   * The build target for the container.
   * @default "osml_model"
   */
  public CONTAINER_BUILD_TARGET: string;

  /**
   * The Dockerfile to build the container.
   */
  public CONTAINER_DOCKERFILE?: string;

  /**
   * The default container image.
   * @default "awsosml/osml-models:latest"
   */
  public CONTAINER_URI: string;

  /**
   * Whether to deploy the HTTP model endpoint.
   * @default true
   */
  public DEPLOY_HTTP_AIRCRAFT_ENDPOINT: boolean;

  /**
   * Whether to deploy the SageMaker aircraft model endpoint.
   * @default true
   */
  public DEPLOY_SM_AIRCRAFT_ENDPOINT: boolean;

  /**
   * Whether to deploy the SageMaker centerpoint model endpoint.
   * @default true
   */
  public DEPLOY_SM_CENTERPOINT_ENDPOINT: boolean;

  /**
   * Whether to deploy the SageMaker flood model endpoint.
   * @default true
   */
  public DEPLOY_SM_FLOOD_ENDPOINT: boolean;

  /**
   * Whether to deploy the SageMaker multi-container model endpoint.
   * @default true
   */
  public DEPLOY_MULTI_CONTAINER_ENDPOINT: boolean;

  /**
   * The CPU allocation for the HTTP endpoint.
   * @default 4096
   */
  public HTTP_ENDPOINT_CPU: number;

  /**
   * The container port for the HTTP endpoint.
   * @default 8080
   */
  public HTTP_ENDPOINT_CONTAINER_PORT: number;

  /**
   * The domain name for the HTTP endpoint.
   * @default "test-http-model-endpoint"
   */
  public HTTP_ENDPOINT_DOMAIN_NAME: string;

  /**
   * The name of the HTTP endpoint cluster.
   * @default "HTTPModelCluster"
   */
  public HTTP_ENDPOINT_NAME: string;

  /**
   * The host port for the HTTP endpoint.
   * @default 8080
   */
  public HTTP_ENDPOINT_HOST_PORT: number;

  /**
   * The health check path for the HTTP endpoint.
   * @default "/ping"
   */
  public HTTP_ENDPOINT_HEALTHCHECK_PATH: string;

  /**
   * The memory allocation for the HTTP endpoint.
   * @default 16384
   */
  public HTTP_ENDPOINT_MEMORY: number;

  /**
   * The name of the HTTP endpoint execution role.
   * @default undefined
   */
  public HTTP_ENDPOINT_ROLE_NAME?: string | undefined;

  /**
   * A security group to use for these resources.
   */
  public SECURITY_GROUP_ID?: string | undefined;

  /**
   * The name of the SageMaker endpoint for the aircraft model.
   * @default "aircraft"
   */
  public SM_AIRCRAFT_MODEL: string;

  /**
   * The name of the SageMaker endpoint for the centerpoint model.
   * @default "centerpoint"
   */
  public SM_CENTER_POINT_MODEL: string;

  /**
   * The name of the multi-container SageMaker endpoint.
   * @default "multi-container"
   */
  public SM_MULTI_CONTAINER_ENDPOINT: string;

  /**
   * The SageMaker CPU instance type.
   * @default "ml.m5.xlarge"
   */
  public SM_CPU_INSTANCE_TYPE: string;

  /**
   * The name of the SageMaker endpoint for the flood model.
   * @default "flood"
   */
  public SM_FLOOD_MODEL: string;

  /**
   * The SageMaker GPU instance type.
   */
  public SM_GPU_INSTANCE_TYPE?: string;

  /**
   * The name of the SageMaker execution role.
   * @default undefined
   */
  public SM_ROLE_NAME?: string | undefined;

  /**
   * Constructor for METestEndpointsConfig.
   * @param config - The configuration object for METestEndpoints.
   */
  constructor(config: ConfigType = {}) {
    super({
      BUILD_FROM_SOURCE: false,
      CONTAINER_BUILD_PATH: "lib/osml-models",
      CONTAINER_BUILD_TARGET: "osml_model",
      CONTAINER_DOCKERFILE: "docker/Dockerfile",
      CONTAINER_URI: "awsosml/osml-models:latest",
      DEPLOY_HTTP_AIRCRAFT_ENDPOINT: true,
      DEPLOY_SM_AIRCRAFT_ENDPOINT: true,
      DEPLOY_SM_CENTERPOINT_ENDPOINT: true,
      DEPLOY_SM_FLOOD_ENDPOINT: true,
      DEPLOY_MULTI_CONTAINER_ENDPOINT: true,
      HTTP_ENDPOINT_CPU: 4096,
      HTTP_ENDPOINT_CONTAINER_PORT: 8080,
      HTTP_ENDPOINT_DOMAIN_NAME: "test-http-model-endpoint",
      HTTP_ENDPOINT_NAME: "HTTPModelCluster",
      HTTP_ENDPOINT_HOST_PORT: 8080,
      HTTP_ENDPOINT_HEALTHCHECK_PATH: "/ping",
      HTTP_ENDPOINT_MEMORY: 16384,
      SM_AIRCRAFT_MODEL: "aircraft",
      SM_CENTER_POINT_MODEL: "centerpoint",
      SM_FLOOD_MODEL: "flood",
      SM_MULTI_CONTAINER_ENDPOINT: "multi-container",
      SM_CPU_INSTANCE_TYPE: "ml.m5.xlarge",
      ...config
    });
  }
}

/**
 * Represents the properties required to configure an MR (Model Router) model endpoints.
 *
 * @interface METestEndpointsProps
 */
export interface METestEndpointsProps {
  /**
   * The OSML (OversightML) account associated with the model endpoints.
   *
   * @type {OSMLAccount}
   */
  account: OSMLAccount;

  /**
   * The OSML (OversightML) VPC (Virtual Private Cloud) where the model will be deployed.
   *
   * @type {OSMLVpc}
   */
  osmlVpc: OSMLVpc;

  /**
   * (Optional) Configuration settings for test model endpoints.
   *
   * @type {METestEndpointsConfig}
   */
  config?: METestEndpointsConfig;

  /**
   * (Optional) A Role to use for the SMEndpoints.
   *
   * @type {IRole}
   */
  smRole?: IRole;
}

/**
 * Represents an AWS CDK Construct for managing Model Registry (MR) endpoints.
 */
export class METestEndpoints extends Construct {
  /**
   * The removal policy for the construct.
   */
  public removalPolicy: RemovalPolicy;

  /**
   * Configuration for MR Model Endpoints.
   */
  public config?: METestEndpointsConfig;

  /**
   * Optional SageMaker role for MR operations.
   */
  public smRole?: IRole;

  /**
   * Optional HTTP Endpoint role for MR operations.
   */
  public httpEndpointRole?: IRole;

  /**
   * HTTP model endpoint for the center point model.
   */
  public httpCenterpointModelEndpoint?: MEHTTPEndpoint;

  /**
   * SM model endpoint for the center point model.
   */
  public centerPointModelEndpoint?: MESMEndpoint;

  /**
   * SM model endpoint for the flood model.
   */
  public floodModelEndpoint?: MESMEndpoint;

  /**
   * SM model endpoint for the aircraft model.
   */
  public aircraftModelEndpoint?: MESMEndpoint;

  /**
   * SM endpoint for testing a multi-container configuration.
   */
  public multiContainerModelEndpoint?: MESMEndpoint;

  /**
   * Security Group ID associated with the endpoints.
   */
  public securityGroupId: string;

  /**
   * The container for the model endpoint.
   */
  public modelContainer: OSMLContainer;

  /**
   * Creates an METestModelEndpointsProps construct.
   * @param {Construct} scope - The scope/stack in which to define this construct.
   * @param {string} id - The id of this construct within the current scope.
   * @param {METestEndpointsProps} props - The properties of this construct.
   * @returns METestModelEndpoints - The METestModelEndpoints construct.
   */
  constructor(scope: Construct, id: string, props: METestEndpointsProps) {
    super(scope, id);

    const regionConfig = RegionalConfig.getConfig(props.account.region);

    // Check if a custom configuration was provided for the model container
    this.config = props.config ?? new METestEndpointsConfig();

    // Set up a removal policy
    this.removalPolicy = props.account.prodLike
      ? RemovalPolicy.RETAIN
      : RemovalPolicy.DESTROY;

    // Check if a SageMaker role was provided via config
    if (this.config.SM_ROLE_NAME != undefined) {
      this.smRole = Role.fromRoleName(
        this,
        "ImportedMESageMakerRole",
        this.config.SM_ROLE_NAME,
        {
          mutable: false
        }
      );
    } else if (props.smRole) {
      // Check if a SageMaker role was provided via properties
      this.smRole = props.smRole;
    } else {
      // Create a new role
      this.smRole = new MESMRole(this, "MESageMakerRole", {
        account: props.account,
        roleName: "MESageMakerRole"
      }).role;
    }

    if (
      this.config.DEPLOY_HTTP_AIRCRAFT_ENDPOINT ||
      this.config.DEPLOY_SM_CENTERPOINT_ENDPOINT ||
      this.config.DEPLOY_SM_AIRCRAFT_ENDPOINT ||
      this.config.DEPLOY_SM_FLOOD_ENDPOINT
    ) {
      this.modelContainer = new OSMLContainer(this, "MEContainer", {
        account: props.account,
        buildFromSource: this.config.BUILD_FROM_SOURCE,
        config: new OSMLContainerConfig({
          CONTAINER_URI: this.config.CONTAINER_URI,
          CONTAINER_BUILD_PATH: this.config.CONTAINER_BUILD_PATH,
          CONTAINER_BUILD_TARGET: this.config.CONTAINER_BUILD_TARGET,
          CONTAINER_DOCKERFILE: this.config.CONTAINER_DOCKERFILE
        })
      });

      // If a custom security group was provided
      if (this.config.SECURITY_GROUP_ID) {
        this.securityGroupId = this.config.SECURITY_GROUP_ID;
      } else {
        this.securityGroupId = props.osmlVpc.vpcDefaultSecurityGroup;
      }
    }
    // EphemeralStorage is supported in most regions
    if (this.config.DEPLOY_HTTP_AIRCRAFT_ENDPOINT && !props.account.isAdc) {
      if (this.config.HTTP_ENDPOINT_ROLE_NAME != undefined) {
        this.httpEndpointRole = Role.fromRoleName(
          this,
          "ImportedMEHTTPEndpointRole",
          this.config.HTTP_ENDPOINT_ROLE_NAME
        );
      } else {
        // Create a new role for the HTTP endpoint
        this.httpEndpointRole = new MEHTTPRole(this, "MEHTTPEndpointRole", {
          account: props.account,
          roleName: "MEHTTPEndpointRole"
        }).role;
      }

      // Build a Fargate HTTP endpoint from the centerpoint model container
      this.httpCenterpointModelEndpoint = new MEHTTPEndpoint(
        this,
        "OSMLHTTPCenterPointModelEndpoint",
        {
          account: props.account,
          osmlVpc: props.osmlVpc,
          image: this.modelContainer.containerImage,
          clusterName: this.config.HTTP_ENDPOINT_NAME,
          role: this.httpEndpointRole,
          memory: this.config.HTTP_ENDPOINT_MEMORY,
          cpu: this.config.HTTP_ENDPOINT_CPU,
          hostPort: this.config.HTTP_ENDPOINT_HOST_PORT,
          containerPort: this.config.HTTP_ENDPOINT_CONTAINER_PORT,
          healthcheckPath: this.config.HTTP_ENDPOINT_HEALTHCHECK_PATH,
          loadBalancerName: this.config.HTTP_ENDPOINT_DOMAIN_NAME,
          containerEnv: {
            MODEL_SELECTION: this.config.SM_CENTER_POINT_MODEL
          },
          securityGroupId: this.securityGroupId
        }
      );
      this.httpCenterpointModelEndpoint.node.addDependency(this.modelContainer);
    }

    // Build an SM endpoint for the centerpoint model
    if (this.config.DEPLOY_SM_CENTERPOINT_ENDPOINT) {
      this.centerPointModelEndpoint = new MESMEndpoint(
        this,
        "OSMLCenterPointModelEndpoint",
        {
          containerImageUri: this.modelContainer.containerUri,
          modelName: this.config.SM_CENTER_POINT_MODEL,
          roleArn: this.smRole.roleArn,
          instanceType: this.config.SM_CPU_INSTANCE_TYPE,
          subnetIds: props.osmlVpc.selectedSubnets.subnetIds,
          config: [
            new MESMEndpointConfig({
              CONTAINER_ENV: {
                MODEL_SELECTION: this.config.SM_CENTER_POINT_MODEL
              },
              SECURITY_GROUP_ID: this.securityGroupId,
              REPOSITORY_ACCESS_MODE: this.modelContainer.repositoryAccessMode
            })
          ]
        }
      );
      this.centerPointModelEndpoint.node.addDependency(this.modelContainer);
    }
    // Build an SM endpoint for the flood model
    if (this.config.DEPLOY_SM_FLOOD_ENDPOINT) {
      this.floodModelEndpoint = new MESMEndpoint(
        this,
        "OSMLFloodModelEndpoint",
        {
          containerImageUri: this.modelContainer.containerUri,
          modelName: this.config.SM_FLOOD_MODEL,
          roleArn: this.smRole.roleArn,
          instanceType: this.config.SM_CPU_INSTANCE_TYPE,
          subnetIds: props.osmlVpc.selectedSubnets.subnetIds,
          config: [
            new MESMEndpointConfig({
              VARIANT_NAME: "flood-50",
              CONTAINER_ENV: {
                FLOOD_VOLUME: 50,
                MODEL_SELECTION: this.config.SM_FLOOD_MODEL
              },
              SECURITY_GROUP_ID: this.securityGroupId,
              REPOSITORY_ACCESS_MODE: this.modelContainer.repositoryAccessMode
            }),
            new MESMEndpointConfig({
              VARIANT_NAME: "flood-100",
              CONTAINER_ENV: {
                FLOOD_VOLUME: 100,
                MODEL_SELECTION: this.config.SM_FLOOD_MODEL
              },
              SECURITY_GROUP_ID: this.securityGroupId,
              REPOSITORY_ACCESS_MODE: this.modelContainer.repositoryAccessMode
            })
          ]
        }
      );
      this.floodModelEndpoint.node.addDependency(this.modelContainer);
    }

    // Build an SM endpoint for the aircraft model
    if (this.config.DEPLOY_SM_AIRCRAFT_ENDPOINT) {
      this.aircraftModelEndpoint = new MESMEndpoint(
        this,
        "OSMLAircraftModelEndpoint",
        {
          containerImageUri: this.modelContainer.containerUri,
          modelName: this.config.SM_AIRCRAFT_MODEL,
          roleArn: this.smRole.roleArn,
          instanceType:
            this.config.SM_GPU_INSTANCE_TYPE ??
            regionConfig.sageMakerGpuEndpointInstanceType,
          subnetIds: props.osmlVpc.selectedSubnets.subnetIds,
          config: [
            new MESMEndpointConfig({
              CONTAINER_ENV: {
                ENABLE_SEGMENTATION: "true",
                MODEL_SELECTION: this.config.SM_AIRCRAFT_MODEL
              },
              SECURITY_GROUP_ID: this.securityGroupId,
              REPOSITORY_ACCESS_MODE: this.modelContainer.repositoryAccessMode
            })
          ]
        }
      );
      this.aircraftModelEndpoint.node.addDependency(this.modelContainer);
    }

    // Build a multi-container endpoint
    if (this.config.DEPLOY_MULTI_CONTAINER_ENDPOINT) {
      this.multiContainerModelEndpoint = new MESMEndpoint(
        this,
        "OSMLMultiContainerModelEndpoint",
        {
          containerImageUri: this.modelContainer.containerUri,
          modelName: this.config.SM_MULTI_CONTAINER_ENDPOINT,
          roleArn: this.smRole.roleArn,
          instanceType: this.config.SM_CPU_INSTANCE_TYPE,
          subnetIds: props.osmlVpc.selectedSubnets.subnetIds,
          config: [
            new MESMEndpointConfig({
              SECURITY_GROUP_ID: this.securityGroupId,
              CONTAINERS: [
                {
                  imageUri: this.modelContainer.containerUri,
                  environment: {
                    MODEL_SELECTION: this.config.SM_CENTER_POINT_MODEL
                  },
                  repositoryAccessMode:
                    this.modelContainer.repositoryAccessMode,
                  containerHostname: "centerpoint-container"
                },
                {
                  imageUri: this.modelContainer.containerUri,
                  environment: {
                    MODEL_SELECTION: this.config.SM_AIRCRAFT_MODEL
                  },
                  repositoryAccessMode:
                    this.modelContainer.repositoryAccessMode,
                  containerHostname: "aircraft-container"
                }
              ]
            })
          ]
        }
      );
    }
  }
}
