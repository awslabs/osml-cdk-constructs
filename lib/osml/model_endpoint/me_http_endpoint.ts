/*
 * Copyright 2023-2025 Amazon.com, Inc. or its affiliates.
 */

import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { ISecurityGroup, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import {
  Cluster,
  Compatibility,
  ContainerImage,
  ContainerInsights,
  LogDriver,
  Protocol,
  FargateTaskDefinition
} from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { IRole } from "aws-cdk-lib/aws-iam";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

import { OSMLAccount } from "../osml_account";
import { OSMLVpc } from "../osml_vpc";

/**
 * Represents the properties required to configure an OSML (OversightML)
 * HTTP endpoint within an AWS ECS (Elastic Container Service) cluster.
 *
 * @interface MEHTTPEndpointProps
 */
export interface MEHTTPEndpointProps {
  /**
   * The OSML (OversightML) account to associate with the endpoint.
   *
   * @type {OSMLAccount}
   * @readonly
   */
  readonly account: OSMLAccount;

  /**
   * The OSML VPC (Virtual Private Cloud) configuration for the endpoint.
   *
   * @type {OSMLVpc}
   * @readonly
   */
  readonly osmlVpc: OSMLVpc;

  /**
   * The Docker container image to be used for the endpoint.
   *
   * @type {ContainerImage}
   * @readonly
   */
  readonly image: ContainerImage;

  /**
   * The name of the ECS cluster where the endpoint will be deployed.
   *
   * @type {string}
   * @readonly
   */
  readonly clusterName: string;

  /**
   * The IAM (Identity and Access Management) role used by the endpoint's task definition.
   *
   * @type {IRole}
   * @readonly
   */
  readonly role: IRole;

  /**
   * The amount of memory to allocate to the container in megabytes (MB).
   *
   * @type {number}
   * @readonly
   */
  readonly memory: number;

  /**
   * The number of CPU units to allocate to the container.
   *
   * @type {number}
   * @readonly
   */
  readonly cpu: number;

  /**
   * The host port on which the container will listen for incoming traffic.
   *
   * @type {number}
   * @readonly
   */
  readonly hostPort: number;

  /**
   * The port within the container where the application will listen for incoming traffic.
   *
   * @type {number}
   * @readonly
   */
  readonly containerPort: number;

  /**
   * The path for the health check endpoint used by the load balancer.
   *
   * @type {string}
   * @readonly
   */
  readonly healthcheckPath: string;

  /**
   * The name of the load balancer associated with the endpoint.
   *
   * @type {string}
   * @readonly
   */
  readonly loadBalancerName: string;

  /**
   * Optional environment variables to be set within the container.
   *
   * @type {Record<string, string>}
   */
  readonly containerEnv?: { [key: string]: string };

  /**
   * The ID of the security group to associate with the ECS task.
   *
   * @type {string}
   */
  readonly securityGroupId?: string;
}

/**
 * Represents an AWS CDK construct for an OSML HTTP Model Endpoint.
 */
export class MEHTTPEndpoint extends Construct {
  /**
   * The network HTTP endpoint for the OSML service.
   */
  public networkHTTPEndpoint: ApplicationLoadBalancedFargateService;

  /**
   * The CloudWatch Logs log group for the OSML HTTP Model Endpoint.
   */
  public logGroup: LogGroup;

  /**
   * The removal policy for the construct.
   */
  public removalPolicy: RemovalPolicy;

  /**
   * An array of security groups used for the cluster
   */
  public securityGroups: ISecurityGroup[];

  /**
   * Creates an instance of OSMLHTTPModelEndpoint.
   * @param {Construct} scope - The scope in which to create the construct.
   * @param {string} id - The ID for the construct.
   * @param {MEHTTPEndpointProps} props - The properties for configuring the OSML HTTP Model Endpoint.
   * @returns MEHTTPEndpoint - The OSMLHTTPModelEndpoint CDK Construct
   */
  constructor(scope: Construct, id: string, props: MEHTTPEndpointProps) {
    super(scope, id);

    // Create an ECS Cluster for the HTTP Model Endpoint
    const httpEndpointCluster = new Cluster(this, props.clusterName, {
      clusterName: props.clusterName,
      vpc: props.osmlVpc.vpc,
      containerInsightsV2: props.account.prodLike
        ? ContainerInsights.ENABLED
        : ContainerInsights.DISABLED
    });

    // Determine the removal policy based on the environment
    this.removalPolicy = props.account.prodLike
      ? RemovalPolicy.RETAIN
      : RemovalPolicy.DESTROY;

    // Create a CloudWatch Logs log group for the service
    this.logGroup = new LogGroup(this, "HTTPEndpointServiceLogGroup", {
      logGroupName: "/aws/OSML/HTTPEndpoint",
      retention: RetentionDays.TEN_YEARS,
      removalPolicy: this.removalPolicy
    });

    // Create a Task Definition for the Fargate task
    const taskDefinition = new FargateTaskDefinition(
      this,
      "HTTPEndpointFargateTaskDefinition",
      {
        memoryLimitMiB: props.memory,
        cpu: props.cpu,
        taskRole: props.role,
        ephemeralStorageGiB: 100
      }
    );

    // Add a container to the Task Definition
    taskDefinition.addContainer("HTTPEndpointContainer", {
      image: props.image,
      portMappings: [
        {
          containerPort: props.containerPort,
          hostPort: props.hostPort,
          protocol: Protocol.TCP
        }
      ],
      logging: LogDriver.awsLogs({
        logGroup: this.logGroup,
        streamPrefix: "OSML"
      }),
      environment: props.containerEnv
    });

    // If a custom security group was provided, create a Security Group array
    if (props.securityGroupId) {
      this.securityGroups = [
        SecurityGroup.fromSecurityGroupId(
          this,
          "HTTPEndpointImportSecurityGroup",
          props.securityGroupId
        )
      ];
    }

    // Create the Application Load Balancer Fargate service
    this.networkHTTPEndpoint = new ApplicationLoadBalancedFargateService(
      this,
      `HTTPEndpointService`,
      {
        cluster: httpEndpointCluster,
        loadBalancerName: props.loadBalancerName,
        healthCheckGracePeriod: Duration.seconds(120),
        taskDefinition: taskDefinition,
        taskSubnets: props.osmlVpc.selectedSubnets,
        publicLoadBalancer: false,
        securityGroups: this.securityGroups
      }
    );

    // Configure health check for the target group
    this.networkHTTPEndpoint.targetGroup.configureHealthCheck({
      path: props.healthcheckPath,
      port: props.hostPort.toString()
    });
  }
}
