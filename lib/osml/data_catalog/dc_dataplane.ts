/*
 * Copyright 2024-2025 Amazon.com, Inc. or its affiliates.
 */

import { Duration, RemovalPolicy, Size } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { ISecurityGroup, Port, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import {
  AnyPrincipal,
  IRole,
  PolicyStatement,
  Role
} from "aws-cdk-lib/aws-iam";
import {
  DockerImageFunction,
  Function,
  LoggingFormat
} from "aws-cdk-lib/aws-lambda";
import { Domain, EngineVersion } from "aws-cdk-lib/aws-opensearchservice";
import { ITopic, Topic } from "aws-cdk-lib/aws-sns";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";

import { OSMLAccount } from "../osml_account";
import { OSMLAuth } from "../osml_auth";
import { OSMLContainer } from "../osml_container";
import { OSMLRestApi } from "../osml_restapi";
import { OSMLVpc } from "../osml_vpc";
import { BaseConfig, ConfigType } from "../utils/base_config";
import { DCLambdaRole } from "./roles/dc_lambda_role";

/**
 * Represents the configuration for the DCDataplane Construct.
 */
export class DCDataplaneConfig extends BaseConfig {
  /**
   * The name of the service in abbreviation to use for the API.
   * @default "DC"
   */
  public API_SERVICE_NAME_ABBREVIATION: string;

  /**
   * Whether to build container resources from source.
   * @default "false"
   */
  public BUILD_FROM_SOURCE: boolean;

  /**
   * The build path for the Data Intake container.
   * @default "lib/osml-data-intake"
   */
  public CONTAINER_BUILD_PATH: string;

  /**
   * The build target for the Data Intake ingest Lambda container Dockerfile.
   * @default "ingest"
   */
  public INGEST_CONTAINER_BUILD_TARGET: string;

  /**
   * The relative Dockerfile to use to build the Data Intake ingest Lambda container.
   * @default "docker/Dockerfile.ingest"
   */
  public INGEST_CONTAINER_DOCKERFILE: string;

  /**
   * The container image to use for the Data Intake ingest Lambda.
   * @default "awsosml/osml-data-intake-ingest:latest"
   */
  public INGEST_CONTAINER_URI: string;

  /**
   * The memory size of the Lambda function (MB).
   * @default 4096
   */
  public LAMBDA_MEMORY_SIZE: number;

  /**
   * The security group ID to use for the Lambda container.
   * @default undefined
   */
  public LAMBDA_SECURITY_GROUP_ID?: string | undefined;

  /**
   * The name of the Lambda role.
   * @default "DCLambdaRole"
   */
  public LAMBDA_ROLE_NAME: string;

  /**
   * The storage size of the Lambda function (GB).
   * @default 10
   */
  public LAMBDA_STORAGE_SIZE: number;

  /**
   * The timeout of the Lambda function (Seconds).
   * @default 300
   */
  public LAMBDA_TIMEOUT: number;

  /**
   * The number of data nodes in the OpenSearch cluster.
   * @default 4
   */
  public OS_DATA_NODES: number;

  /**
   * The name to give a generated ingest SNS topic.
   * @default "osml-stac-ingest"
   */
  public SNS_INGEST_TOPIC_NAME: string;

  /**
   * The relative Dockerfile.stac to use to build the STAC API Lambda container.
   * @default "docker/Dockerfile.stac"
   */
  public STAC_CONTAINER_DOCKERFILE: string;

  /**
   * The build target for the Data Intake STAC API container Dockerfile.
   * @default "stac"
   */
  public STAC_CONTAINER_BUILD_TARGET: string;

  /**
   * The container image to use for the Data Intake STAC API lambda.
   * @default "awsosml/osml-data-intake-stac:latest"
   */
  public STAC_CONTAINER_URI: string;

  /**
   * The description of the STAC FastAPI application.
   * @default "A STAC FastAPI with an OpenSearch backend"
   */
  public STAC_FASTAPI_DESCRIPTION: string;

  /**
   * The root path for FASTAPI that is set by APIGateway.
   * @default "data-catalog"
   */
  public STAC_FASTAPI_ROOT_PATH: string;

  /**
   * The title of the STAC FastAPI application.
   * @default "stac-fastapi-opensearch"
   */
  public STAC_FASTAPI_TITLE: string;

  /**
   * The version of the STAC FastAPI application.
   * @default "2.4.1"
   */
  public STAC_FASTAPI_VERSION: string;

  /**
   * The environment of the application.
   * @default "local"
   */
  public STAC_ENVIRONMENT: string;

  /**
   * The port of the OpenSearch cluster.
   * @default "443"
   */
  public STAC_ES_PORT: string;

  /**
   * A boolean to use SSL.
   * @default "true"
   */
  public STAC_ES_USE_SSL: string;

  /**
   * Whether to verify traffic with SSL certs.
   * @default "true"
   */
  public STAC_ES_VERIFY_CERTS: string;

  /**
   * A boolean indicating whether to reload the application.
   * @default "true"
   */
  public STAC_RELOAD: string;

  /**
   * The web concurrency of the application.
   * @default "10"
   */
  public STAC_WEB_CONCURRENCY: string;

  /**
   * Creates an instance of DCDataplaneConfig.
   * @param config - The configuration object for DCDataplane.
   */
  constructor(config: ConfigType = {}) {
    super({
      API_SERVICE_NAME_ABBREVIATION: "DC",
      CONTAINER_BUILD_PATH: "lib/osml-data-intake/",
      INGEST_CONTAINER_BUILD_TARGET: "ingest",
      INGEST_CONTAINER_DOCKERFILE: "docker/Dockerfile.ingest",
      INGEST_CONTAINER_URI: "awsosml/osml-data-intake-ingest:latest",
      LAMBDA_MEMORY_SIZE: 4096,
      LAMBDA_STORAGE_SIZE: 10,
      LAMBDA_TIMEOUT: 300,
      OS_DATA_NODES: 4,
      SNS_INGEST_TOPIC_NAME: "osml-dc-ingest",
      STAC_CONTAINER_DOCKERFILE: "docker/Dockerfile.stac",
      STAC_CONTAINER_BUILD_TARGET: "stac",
      STAC_CONTAINER_URI: "awsosml/osml-data-intake-stac:latest",
      STAC_FASTAPI_DESCRIPTION: "A STAC FastAPI with an OpenSearch backend",
      STAC_FASTAPI_ROOT_PATH: "data-catalog",
      STAC_FASTAPI_TITLE: "stac-fastapi-opensearch",
      STAC_FASTAPI_VERSION: "2.4.1",
      STAC_ENVIRONMENT: "local",
      STAC_ES_PORT: "443",
      STAC_ES_USE_SSL: "true",
      STAC_ES_VERIFY_CERTS: "true",
      STAC_RELOAD: "true",
      STAC_WEB_CONCURRENCY: "10",
      ...config
    });
  }
}

/**
 * Interface representing the properties for the DCDataplane construct.
 */
export interface DCDataplaneProps {
  /**
   * The OSML deployment account.
   * @type {OSMLAccount}
   */
  account: OSMLAccount;

  /**
   * The OSML VPC (Virtual Private Cloud) configuration for the data server.
   * @type {OSMLVpc}
   */
  osmlVpc: OSMLVpc;

  /**
   * The topic to subscribe to for ingesting STAC items.
   */
  ingestTopic?: ITopic;

  /**
   * The auth configuration to use for the deployment (optional).
   * @type {OSMLAuth | undefined}
   */
  auth?: OSMLAuth;

  /**
   * Custom configuration for the DCDataplane Construct (optional).
   * @type {DCDataplaneConfig | undefined}
   */
  config?: DCDataplaneConfig;
}

/**
 * Represents a construct responsible for deploying an ECR container image
 * for the data catalog Lambda.
 */
export class DCDataplane extends Construct {
  /**
   * The removal policy for resources created by this construct.
   * Determines whether resources are retained or destroyed upon stack deletion.
   */
  public removalPolicy: RemovalPolicy;

  /**
   * Configuration for the DCDataplane, containing settings for containers, VPCs, etc.
   */
  public config: DCDataplaneConfig;

  /**
   * IAM role used by the Lambda functions within this construct.
   * Provides necessary permissions for the Lambda to access required AWS services.
   */
  public lambdaRole: IRole;

  /**
   * SNS topic to which STAC item outputs will be published.
   */
  public ingestTopic: ITopic;

  /**
   * Security group associated with the resources created by this construct.
   * Controls the network traffic to and from the resources.
   */
  public securityGroup: ISecurityGroup;

  /**
   * Lambda function responsible for ingesting data into the system.
   * This function is created from a Docker image.
   */
  public ingestFunction: Function;

  /**
   * Lambda function responsible for the STAC API.
   * This function is created from a Docker image.
   */
  public stacFunction: Function;

  /**
   * Container that handles the building and deployment of the ingest Lambda function.
   */
  public ingestContainer: OSMLContainer;

  /**
   * Container that handles the building and deployment of the STAC API Lambda function.
   */
  public stacContainer: OSMLContainer;

  /**
   * OpenSearch domain used as the backend for the STAC API.
   * Manages and stores the STAC items and provides search capabilities.
   */
  public osDomain: Domain;

  /**
   * Creates an instance of DCDataplane.
   * @param {Construct} scope - The scope/stack in which to define this construct.
   * @param {string} id - The id of this construct within the current scope.
   * @param {DCDataplaneProps} props - The properties of this construct.
   * @returns DCDataplane - The DCDataplane instance.
   */
  constructor(scope: Construct, id: string, props: DCDataplaneProps) {
    super(scope, id);

    // Setup class from base properties
    this.setup(props);

    // Build the ingest Lambda container
    this.ingestContainer = new OSMLContainer(this, "DCIngestContainer", {
      account: props.account,
      buildDockerImageCode: true,
      buildFromSource: this.config.BUILD_FROM_SOURCE,
      config: {
        CONTAINER_URI: this.config.INGEST_CONTAINER_URI,
        CONTAINER_BUILD_PATH: this.config.CONTAINER_BUILD_PATH,
        CONTAINER_BUILD_TARGET: this.config.INGEST_CONTAINER_BUILD_TARGET,
        CONTAINER_DOCKERFILE: this.config.INGEST_CONTAINER_DOCKERFILE
      }
    });

    // Build the STAC API Lambda container
    this.stacContainer = new OSMLContainer(this, "DCSTACContainer", {
      account: props.account,
      buildDockerImageCode: true,
      buildFromSource: this.config.BUILD_FROM_SOURCE,
      config: {
        CONTAINER_URI: this.config.STAC_CONTAINER_URI,
        CONTAINER_BUILD_PATH: this.config.CONTAINER_BUILD_PATH,
        CONTAINER_BUILD_TARGET: this.config.STAC_CONTAINER_BUILD_TARGET,
        CONTAINER_DOCKERFILE: this.config.STAC_CONTAINER_DOCKERFILE
      }
    });

    // Create and opensearch domain for our STAC database
    this.osDomain = new Domain(this, "DCOSDomain", {
      version: EngineVersion.OPENSEARCH_2_11,
      nodeToNodeEncryption: true,
      enforceHttps: true,
      encryptionAtRest: {
        enabled: true
      },
      vpc: props.osmlVpc.vpc,
      capacity: {
        dataNodes: this.config.OS_DATA_NODES
      },
      vpcSubnets: [props.osmlVpc.selectedSubnets],
      removalPolicy: props.account.prodLike
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
      zoneAwareness: {
        enabled: true,
        availabilityZoneCount: props.osmlVpc.selectedSubnets.subnetIds.length
      },
      securityGroups: [this.securityGroup]
    });

    this.osDomain.addAccessPolicies(
      new PolicyStatement({
        principals: [new AnyPrincipal()],
        actions: ["es:ESHttp*"],
        resources: [this.osDomain.domainArn + "/*"]
      })
    );

    // Create an operating ENV for our lambda container
    const env = {
      STAC_FASTAPI_TITLE: this.config.STAC_FASTAPI_TITLE,
      STAC_FASTAPI_DESCRIPTION: this.config.STAC_FASTAPI_DESCRIPTION,
      STAC_FASTAPI_VERSION: this.config.STAC_FASTAPI_VERSION,
      RELOAD: this.config.STAC_RELOAD,
      ENVIRONMENT: this.config.STAC_ENVIRONMENT,
      WEB_CONCURRENCY: this.config.STAC_WEB_CONCURRENCY,
      ES_HOST: this.osDomain.domainEndpoint,
      ES_PORT: this.config.STAC_ES_PORT,
      ES_USE_SSL: this.config.STAC_ES_USE_SSL,
      ES_VERIFY_CERTS: this.config.STAC_ES_VERIFY_CERTS,
      STAC_FASTAPI_ROOT_PATH: `/${this.config.STAC_FASTAPI_ROOT_PATH}`
    };

    // Package op the container function
    this.stacFunction = new DockerImageFunction(this, "DCStacFunction", {
      functionName: "DCStacLambda",
      code: this.stacContainer.dockerImageCode,
      role: this.lambdaRole,
      vpc: props.osmlVpc.vpc,
      timeout: Duration.seconds(this.config.LAMBDA_TIMEOUT),
      ephemeralStorageSize: Size.gibibytes(this.config.LAMBDA_STORAGE_SIZE),
      memorySize: this.config.LAMBDA_MEMORY_SIZE,
      environment: env,
      loggingFormat: LoggingFormat.JSON
    });
    this.stacFunction.node.addDependency(this.stacContainer);

    // Allow the lambda to connect to opensearch
    this.osDomain.connections.allowFrom(this.stacFunction, Port.tcp(443));

    if (props.auth) {
      new OSMLRestApi(this, "DCRestApi", {
        account: props.account,
        name: this.config.API_SERVICE_NAME_ABBREVIATION,
        apiStageName: this.config.STAC_FASTAPI_ROOT_PATH,
        integration: new LambdaIntegration(this.stacFunction),
        auth: props.auth,
        osmlVpc: props.osmlVpc,
        lambdaRole: this.lambdaRole
      });
    }

    // Create the lambda function to ingest stac items
    this.ingestFunction = new DockerImageFunction(this, "DCIngestFunction", {
      functionName: "DCIngestLambda",
      code: this.ingestContainer.dockerImageCode,
      role: this.lambdaRole,
      vpc: props.osmlVpc.vpc,
      timeout: Duration.seconds(this.config.LAMBDA_TIMEOUT),
      ephemeralStorageSize: Size.gibibytes(this.config.LAMBDA_STORAGE_SIZE),
      memorySize: this.config.LAMBDA_MEMORY_SIZE,
      environment: env,
      loggingFormat: LoggingFormat.JSON
    });
    this.ingestFunction.node.addDependency(this.ingestContainer);

    // Subscribe Lambda function to the SNS topic
    this.ingestTopic.addSubscription(
      new LambdaSubscription(this.ingestFunction)
    );

    this.osDomain.connections.allowFrom(this.ingestFunction, Port.tcp(443));
  }

  /**
   * Sets up the DCDataplane construct with the provided properties.
   * This method initializes the construct's configuration based on the input properties,
   * configures security groups and IAM roles, and applies any custom configuration provided.
   * If no custom configuration is supplied, a default configuration will be created.
   *
   * @param {DCDataplaneProps} props - The properties used to configure the data server.
   *        Includes options for VPC configuration, IAM roles, security groups, and more.
   */
  private setup(props: DCDataplaneProps): void {
    // Check if a custom configuration was provided
    this.config = props.config ?? new DCDataplaneConfig();

    // Setup a removal policy
    this.removalPolicy = props.account.prodLike
      ? RemovalPolicy.RETAIN
      : RemovalPolicy.DESTROY;

    // If a custom security group was provided
    if (this.config.LAMBDA_SECURITY_GROUP_ID) {
      this.securityGroup = SecurityGroup.fromSecurityGroupId(
        this,
        "DCImportSecurityGroup",
        this.config.LAMBDA_SECURITY_GROUP_ID
      );
    } else {
      // Set up a default security group for OpenSearch
      this.securityGroup = new SecurityGroup(this, "DCOSSecurityGroup", {
        vpc: props.osmlVpc.vpc
      });
    }

    // Create an SNS topic for STAC item outputs if needed
    if (props.ingestTopic) {
      this.ingestTopic = props.ingestTopic;
    } else {
      this.ingestTopic = new Topic(this, "DIOutputTopic", {
        topicName: this.config.SNS_INGEST_TOPIC_NAME
      });
    }

    // Create a lambda role and service linked role if needed
    if (this.config.LAMBDA_ROLE_NAME != undefined) {
      this.lambdaRole = Role.fromRoleName(
        this,
        "ImportedDCLambdaRole",
        this.config.LAMBDA_ROLE_NAME,
        {
          mutable: false
        }
      );
    } else {
      this.lambdaRole = new DCLambdaRole(this, "DCLambdaRole", {
        account: props.account,
        roleName: "DCLambdaRole"
      }).role;
    }
  }
}
