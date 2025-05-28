/*
 * Copyright 2023-2025 Amazon.com, Inc. or its affiliates.
 */

import { EcsIsoServiceAutoscaler } from "@cdklabs/cdk-enterprise-iac";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import {
  BackupPlan,
  BackupPlanRule,
  BackupResource,
  BackupVault
} from "aws-cdk-lib/aws-backup";
import { Alarm } from "aws-cdk-lib/aws-cloudwatch";
import { AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { ISecurityGroup, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import {
  AwsLogDriver,
  Cluster,
  Compatibility,
  ContainerDefinition,
  ContainerInsights,
  FargateService,
  Protocol,
  TaskDefinition
} from "aws-cdk-lib/aws-ecs";
import { IRole, Role } from "aws-cdk-lib/aws-iam";
import {
  CfnStream,
  Stream,
  StreamEncryption,
  StreamMode
} from "aws-cdk-lib/aws-kinesis";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { ITopic, Topic } from "aws-cdk-lib/aws-sns";
import { SqsSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";

import { OSMLAccount } from "../osml_account";
import { OSMLBucket } from "../osml_bucket";
import { OSMLContainer } from "../osml_container";
import { OSMLQueue } from "../osml_queue";
import { OSMLTable } from "../osml_table";
import { OSMLTopic } from "../osml_topic";
import { OSMLVpc } from "../osml_vpc";
import { BaseConfig, ConfigType } from "../utils/base_config";
import { RegionalConfig } from "../utils/regional_config";
import { MRMonitoring } from "./mr_monitoring";
import { MRExecutionRole } from "./roles/mr_execution_role";
import { MRTaskRole } from "./roles/mr_task_role";

/**
 * Configuration class for MRDataplane Construct.
 */
export class MRDataplaneConfig extends BaseConfig {
  /**
   * Whether to build container resources from source.
   * @default "false"
   */
  public BUILD_FROM_SOURCE: boolean;

  /**
   * The namespace for metrics.
   * @default "OSML"
   */
  public CW_METRICS_NAMESPACE: string;

  /**
   * The path for the Model Runner container to build from when building from source.
   * @default "lib/osml-model-runner"
   */
  public CONTAINER_BUILD_PATH: string;

  /**
   * The target for the Model Runner Dockerfile container build.
   * @default "model_runner"
   */
  public CONTAINER_BUILD_TARGET: string;

  /**
   * The relative Dockerfile to use to build the Model Runner container.
   * @default "Dockerfile"
   */
  public CONTAINER_DOCKERFILE: string;

  /**
   * The default container image to import when not building from source.
   * @default "awsosml/osml-model-runner:latest"
   */
  public CONTAINER_URI: string;

  /**
   * The name of the DynamoDB table for endpoint processing statistics.
   * @default "EndpointProcessingStatistics"
   */
  public DDB_ENDPOINT_PROCESSING_TABLE: string;

  /**
   * The name of the DynamoDB table for image processing features.
   * @default "ImageProcessingFeatures"
   */
  public DDB_FEATURES_TABLE: string;

  /**
   * The name of the DynamoDB table for job status.
   * @default "ImageProcessingJobStatus"
   */
  public DDB_JOB_STATUS_TABLE: string;

  /**
   * The name of the DynamoDB table for outstanding image jobs.
   * @default "OutstandingImageProcessingJobs"
   */
  public DDB_OUTSTANDING_IMAGE_JOBS_TABLE: string;

  /**
   * The name of the DynamoDB table for region request status.
   * @default "RegionProcessingJobStatus"
   */
  public DDB_REGION_REQUEST_TABLE: string;

  /**
   * The attribute name for expiration time in DynamoDB.
   * @default "expire_time"
   */
  public DDB_TTL_ATTRIBUTE: string;

  /**
   * The time to live in days for DDB records used in tables.
   * @default undefined
   */
  public DDB_TTL_IN_DAYS: string;

  /**
   * The maximum number of tasks allowed in the cluster.
   * @default 40
   */
  public ECS_AUTOSCALING_TASK_MAX_COUNT: number;

  /**
   * The minimum number of tasks required in the cluster.
   * @default 3
   */
  public ECS_AUTOSCALING_TASK_MIN_COUNT: number;

  /**
   * The cooldown period (in minutes) after scaling in tasks.
   * @default 1
   */
  public ECS_AUTOSCALING_TASK_IN_COOLDOWN: number;

  /**
   * The number of tasks to increment when scaling in.
   * @default 8
   */
  public ECS_AUTOSCALING_TASK_IN_INCREMENT: number;

  /**
   * The cooldown period (in minutes) after scaling out tasks.
   * @default 3
   */
  public ECS_AUTOSCALING_TASK_OUT_COOLDOWN: number;

  /**
   * The number of tasks to increment when scaling out.
   * @default 8
   */
  public ECS_AUTOSCALING_TASK_OUT_INCREMENT: number;

  /**
   * The CPU configuration for MR containers.
   * @default 8192
   */
  public ECS_CONTAINER_CPU: number;

  /**
   * The memory configuration for MR containers.
   * @default 16384
   */
  public ECS_CONTAINER_MEMORY: number;

  /**
   * The name to assign the Model Runner ECS container.
   * @default "OSMLModelRunnerContainer"
   */
  public ECS_CONTAINER_NAME: string;

  /**
   * The name to assign the Model Runner ECS cluster.
   * @default "OSMLCluster"
   */
  public ECS_CLUSTER_NAME: string;

  /**
   * The desired number of tasks to use for the service.
   * @default 1
   */
  public ECS_DEFAULT_DESIRE_COUNT: number;

  /**
   * The security group ID to use for the ECS Fargate service.
   * @default undefined
   */
  public ECS_SECURITY_GROUP_ID?: string | undefined;

  /**
   * The CPU configuration for MR tasks.
   * @default 8192
   */
  public ECS_TASK_CPU: number;

  /**
   * The memory configuration for MR tasks.
   * @default 16384
   */
  public ECS_TASK_MEMORY: number;

  /**
   * The name of the MR ECS execution role to import.
   * @default undefined
   */
  public ECS_EXECUTION_ROLE_NAME?: string | undefined;

  /**
   * The name of the MR ECS task role to import.
   * @default undefined
   */
  public ECS_TASK_ROLE_NAME?: string | undefined;

  /**
   * Whether to deploy image status messages.
   * @default true
   */
  public MR_ENABLE_IMAGE_STATUS: boolean;

  /**
   * Whether to deploy a kinesis output sink stream.
   * @default true
   */
  public MR_ENABLE_KINESIS_SINK: boolean;

  /**
   * Whether to deploy a monitoring dashboard for model runner.
   * @default true
   */
  public MR_ENABLE_MONITORING: boolean;

  /**
   * Whether to deploy region status messages.
   * @default false
   */
  public MR_ENABLE_REGION_STATUS: boolean;

  /**
   * Whether to deploy a s3 output sink bucket.
   * @default true
   */
  public MR_ENABLE_S3_SINK: boolean;

  /**
   * The prefix to assign the deployed Kinesis stream output sink.
   * @default "mr-stream-sink"
   */
  public MR_KINESIS_SINK_STREAM_PREFIX: string;

  /**
   * The size of MR regions in the format "(width, height)".
   * @default "(8192, 8192)"
   */
  public MR_REGION_SIZE: string;

  /**
   * The URI for the terrain to use for geolocation.
   * @default undefined
   */
  public MR_TERRAIN_URI?: string | undefined;

  /**
   * The number of workers per CPU.
   * @default 2
   */
  public MR_WORKERS_PER_CPU: number;

  /**
   * The prefix to assign the deployed S3 bucket output sink.
   * @default "mr-bucket-sink"
   */
  public S3_SINK_BUCKET_PREFIX: string;

  /**
   * The name of the SNS topic for image status.
   * @default "ImageStatusTopic"
   */
  public SNS_IMAGE_STATUS_TOPIC: string;

  /**
   * The ARN of the Image Status Topic to be imported
   * @default undefined
   */
  public SNS_IMAGE_STATUS_TOPIC_ARN?: string | undefined;

  /**
   * The name of the SNS topic for region status.
   * @default "RegionStatusTopic"
   */
  public SNS_REGION_STATUS_TOPIC: string;

  /**
   * The ARN of the Image Region Topic to be imported
   * @default undefined
   */
  public SNS_REGION_STATUS_TOPIC_ARN?: string | undefined;

  /**
   * The name of the SQS queue for image requests.
   * @default "ImageRequestQueue"
   */
  public SQS_IMAGE_REQUEST_QUEUE: string;

  /**
   * The name of the SQS queue for image status.
   * @default "ImageStatusQueue"
   */
  public SQS_IMAGE_STATUS_QUEUE: string;

  /**
   * The name of the SQS queue for region requests.
   * @default "RegionRequestQueue"
   */
  public SQS_REGION_REQUEST_QUEUE: string;

  /**
   * The name of the SQS queue for region status.
   * @default "RegionStatusQueue"
   */
  public SQS_REGION_STATUS_QUEUE: string;

  /**
   * Constructor for MRDataplaneConfig.
   * @param config - The configuration object for MRDataplane.
   */
  constructor(config: ConfigType = {}) {
    super({
      BUILD_FROM_SOURCE: false,
      CW_METRICS_NAMESPACE: "OSML",
      CONTAINER_BUILD_PATH: "lib/osml-model-runner",
      CONTAINER_BUILD_TARGET: "model_runner",
      CONTAINER_DOCKERFILE: "Dockerfile",
      CONTAINER_URI: "awsosml/osml-model-runner:latest",
      DDB_ENDPOINT_PROCESSING_TABLE: "EndpointProcessingStatistics",
      DDB_FEATURES_TABLE: "ImageProcessingFeatures",
      DDB_JOB_STATUS_TABLE: "ImageProcessingJobStatus",
      DDB_OUTSTANDING_IMAGE_JOBS_TABLE: "OutstandingImageProcessingJobs",
      DDB_REGION_REQUEST_TABLE: "RegionProcessingJobStatus",
      DDB_TTL_ATTRIBUTE: "expire_time",
      ECS_AUTOSCALING_TASK_MAX_COUNT: 40,
      ECS_AUTOSCALING_TASK_MIN_COUNT: 3,
      ECS_AUTOSCALING_TASK_IN_COOLDOWN: 1,
      ECS_AUTOSCALING_TASK_IN_INCREMENT: 8,
      ECS_AUTOSCALING_TASK_OUT_COOLDOWN: 3,
      ECS_AUTOSCALING_TASK_OUT_INCREMENT: 8,
      ECS_CONTAINER_CPU: 8192,
      ECS_CONTAINER_MEMORY: 16384,
      ECS_CONTAINER_NAME: "MRContainer",
      ECS_CLUSTER_NAME: "MRCluster",
      ECS_DEFAULT_DESIRE_COUNT: 1,
      ECS_TASK_CPU: 8192,
      ECS_TASK_MEMORY: 16384,
      MR_ENABLE_IMAGE_STATUS: true,
      MR_ENABLE_KINESIS_SINK: true,
      MR_ENABLE_MONITORING: true,
      MR_ENABLE_REGION_STATUS: false,
      MR_ENABLE_S3_SINK: true,
      MR_KINESIS_SINK_STREAM_PREFIX: "mr-stream-sink",
      MR_REGION_SIZE: "(8192, 8192)",
      MR_WORKERS_PER_CPU: 2,
      S3_SINK_BUCKET_PREFIX: "mr-bucket-sink",
      SNS_IMAGE_STATUS_TOPIC: "ImageStatusTopic",
      SNS_REGION_STATUS_TOPIC: "RegionStatusTopic",
      SQS_IMAGE_REQUEST_QUEUE: "ImageRequestQueue",
      SQS_IMAGE_STATUS_QUEUE: "ImageStatusQueue",
      SQS_REGION_REQUEST_QUEUE: "RegionRequestQueue",
      SQS_REGION_STATUS_QUEUE: "RegionStatusQueue",
      ...config
    });
  }
}

/**
 * Interface representing properties for configuring the MRDataplane Construct.
 */
export interface MRDataplaneProps {
  /**
   * The OSML deployment account.
   * @type {OSMLAccount}
   */
  account: OSMLAccount;

  /**
   * The OSML VPC (Virtual Private Cloud) configuration for the Dataplane.
   * @type {OSMLVpc}
   */
  osmlVpc: OSMLVpc;

  /**
   * Custom configuration for the MRDataplane Construct (optional).
   * @type {MRDataplaneConfig | undefined}
   */
  config?: MRDataplaneConfig;
}

/**
 * Represents the MRDataplane construct responsible for managing the data plane
 * of the model runner application. It handles various AWS resources and configurations
 * required for the application's operation.
 *
 * @param {Construct} scope - The scope/stack in which to define this construct.
 * @param {string} id - The id of this construct within the current scope.
 * @param {MRDataplaneProps} props - The properties of this construct.
 * @returns {MRDataplane} - The MRDataplane construct.
 */
export class MRDataplane extends Construct {
  /**
   * The IAM role for the ECS task.
   */
  public taskRole: IRole;

  /**
   * The IAM role for the ECS task execution.
   */
  public executionRole: IRole;

  /**
   * The configuration for the MRDataplane.
   */
  public config: MRDataplaneConfig;

  /**
   * The removal policy for resources created by this construct.
   */
  public removalPolicy: RemovalPolicy;

  /**
   * The regional S3 endpoint.
   */
  public regionalS3Endpoint: string;

  /**
   * The DynamoDB table for outstanding image processing jobs.
   */
  public outstandingImageJobsTable: OSMLTable;

  /**
   * The DynamoDB table for job status.
   */
  public jobStatusTable: OSMLTable;

  /**
   * The DynamoDB table for feature data.
   */
  public featureTable: OSMLTable;

  /**
   * The DynamoDB table for endpoint statistics.
   */
  public endpointStatisticsTable: OSMLTable;

  /**
   * The DynamoDB table for region request status.
   */
  public regionRequestTable: OSMLTable;

  /**
   * The SNS topic for image status notifications.
   */
  public imageStatusTopic: ITopic;

  /**
   * The SNS topic for region status notifications.
   */
  public regionStatusTopic: ITopic;

  /**
   * The SQS queue for image processing requests.
   */
  public imageRequestQueue: OSMLQueue;

  /**
   * The SQS queue for region processing requests.
   */
  public regionRequestQueue: OSMLQueue;

  /**
   * The log group for the MR service.
   */
  public logGroup: LogGroup;

  /**
   * The ECS cluster for running tasks.
   */
  public cluster: Cluster;

  /**
   * The ECS task definition.
   */
  public taskDefinition: TaskDefinition;

  /**
   * The container definition for the MR service.
   */
  public containerDefinition: ContainerDefinition;

  /**
   * The Fargate service for the MR container.
   */
  public fargateService: FargateService;

  /**
   * The container for the MR service.
   */
  public mrContainer: OSMLContainer;

  /**
   * The security groups for the Fargate service.
   */
  public securityGroups?: [ISecurityGroup];

  /**
   * The SQS queue for image status updates.
   */
  public imageStatusQueue?: OSMLQueue;

  /**
   * The SQS queue for region status updates.
   */
  public regionStatusQueue?: OSMLQueue;

  /**
   * The monitoring configuration for the MR service.
   */
  public monitoring?: MRMonitoring;

  /**
   * The autoscaler for the Fargate service.
   */
  public serviceAutoscaler?: EcsIsoServiceAutoscaler;

  /**
   * The S3 bucket output sink
   */
  public sinkBucket?: OSMLBucket;

  /**
   * The Kinesis stream output sink
   */
  public sinkStream?: Stream;

  /**
   * The number of workers to assign to each Model Runner task.
   */
  private workers: string;

  /**
   * Constructs an instance of MRDataplane.
   *
   * @constructor
   * @param {Construct} scope - The scope/stack in which to define this construct.
   * @param {string} id - The id of this construct within the current scope.
   * @param {MRDataplaneProps} props - The properties of this construct.
   */
  constructor(scope: Construct, id: string, props: MRDataplaneProps) {
    super(scope, id);

    // Configure the construct with passed params
    this.setup(props);

    // Outstanding jobs currently being tracked by the scheduler
    this.outstandingImageJobsTable = new OSMLTable(
      this,
      "MROutstandingImageJobsTable",
      {
        tableName: this.config.DDB_OUTSTANDING_IMAGE_JOBS_TABLE,
        partitionKey: {
          name: "endpoint_id",
          type: AttributeType.STRING
        },
        sortKey: {
          name: "job_id",
          type: AttributeType.STRING
        },
        removalPolicy: this.removalPolicy
      }
    );

    // Job status table to store worker status info
    this.jobStatusTable = new OSMLTable(this, "MRJobStatusTable", {
      tableName: this.config.DDB_JOB_STATUS_TABLE,
      partitionKey: {
        name: "image_id",
        type: AttributeType.STRING
      },
      removalPolicy: this.removalPolicy,
      ttlAttribute: this.config.DDB_TTL_ATTRIBUTE
    });

    // GeoJSON feature storage for mapping back to images
    this.featureTable = new OSMLTable(this, "MRFeaturesTable", {
      tableName: this.config.DDB_FEATURES_TABLE,
      partitionKey: {
        name: "hash_key",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "range_key",
        type: AttributeType.STRING
      },
      removalPolicy: this.removalPolicy,
      ttlAttribute: this.config.DDB_TTL_ATTRIBUTE
    });

    // Used to track in-progress regions by model endpoint
    this.endpointStatisticsTable = new OSMLTable(
      this,
      "MREndpointProcessingTable",
      {
        tableName: this.config.DDB_ENDPOINT_PROCESSING_TABLE,
        partitionKey: {
          name: "hash_key",
          type: AttributeType.STRING
        },
        removalPolicy: this.removalPolicy,
        ttlAttribute: this.config.DDB_TTL_ATTRIBUTE
      }
    );

    // Region request table to store region status info
    this.regionRequestTable = new OSMLTable(this, "MRRegionRequestTable", {
      tableName: this.config.DDB_REGION_REQUEST_TABLE,
      partitionKey: {
        name: "image_id",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "region_id",
        type: AttributeType.STRING
      },
      removalPolicy: this.removalPolicy,
      ttlAttribute: this.config.DDB_TTL_ATTRIBUTE
    });

    // AWS Backup solution is available in most regions
    if (props.account.prodLike && !props.account.isAdc) {
      const backupVault = new BackupVault(this, `MRBackupVault`, {
        backupVaultName: `MRBackupVault`
      });
      const plan = new BackupPlan(this, `MRBackupPlan`);
      plan.addRule(BackupPlanRule.weekly(backupVault));
      plan.addRule(BackupPlanRule.monthly5Year(backupVault));
      plan.addSelection(`MRBackupSelection`, {
        resources: [
          BackupResource.fromDynamoDbTable(this.featureTable.table),
          BackupResource.fromDynamoDbTable(this.regionRequestTable.table),
          BackupResource.fromDynamoDbTable(this.endpointStatisticsTable.table),
          BackupResource.fromDynamoDbTable(this.jobStatusTable.table)
        ]
      });
    }

    // Create a SQS queue for the image processing jobs
    this.imageRequestQueue = new OSMLQueue(this, "MRImageRequestQueue", {
      queueName: this.config.SQS_IMAGE_REQUEST_QUEUE
    });

    // Create a SQS queue for the image region processing tasks
    this.regionRequestQueue = new OSMLQueue(this, "MRRegionRequestQueue", {
      queueName: this.config.SQS_REGION_REQUEST_QUEUE
    });

    // Log group for MR container
    this.logGroup = new LogGroup(this, "MRServiceLogGroup", {
      logGroupName: "/aws/OSML/MRService",
      retention: RetentionDays.TEN_YEARS,
      removalPolicy: this.removalPolicy
    });

    // Build the container for model runner
    this.mrContainer = new OSMLContainer(this, "MRContainer", {
      account: props.account,
      buildFromSource: this.config.BUILD_FROM_SOURCE,
      config: {
        CONTAINER_URI: this.config.CONTAINER_URI,
        CONTAINER_BUILD_PATH: this.config.CONTAINER_BUILD_PATH,
        CONTAINER_BUILD_TARGET: this.config.CONTAINER_BUILD_TARGET,
        CONTAINER_DOCKERFILE: this.config.CONTAINER_DOCKERFILE
      }
    });

    // Build cluster to house our containers when they spin up
    this.cluster = new Cluster(this, "MRCluster", {
      clusterName: this.config.ECS_CLUSTER_NAME,
      vpc: props.osmlVpc.vpc,
      containerInsightsV2: props.account.prodLike
        ? ContainerInsights.ENABLED
        : ContainerInsights.DISABLED
    });

    // Define our ECS task
    this.taskDefinition = new TaskDefinition(this, "MRTaskDefinition", {
      memoryMiB: this.config.ECS_TASK_MEMORY.toString(),
      cpu: this.config.ECS_TASK_CPU.toString(),
      compatibility: Compatibility.FARGATE,
      taskRole: this.taskRole,
      executionRole: this.executionRole
    });

    // Add port mapping to container
    this.taskDefinition.defaultContainer?.addPortMappings({
      containerPort: 80,
      hostPort: 80,
      protocol: Protocol.TCP
    });

    // Set up Fargate service
    this.fargateService = new FargateService(this, "MRService", {
      taskDefinition: this.taskDefinition,
      cluster: this.cluster,
      minHealthyPercent: 100,
      securityGroups: this.securityGroups,
      vpcSubnets: props.osmlVpc.selectedSubnets,
      desiredCount: this.config.ECS_DEFAULT_DESIRE_COUNT
    });
    this.fargateService.node.addDependency(this.mrContainer);

    // Build a container definition to run our service
    this.containerDefinition = this.taskDefinition.addContainer(
      "MRContainerDefinition",
      {
        containerName: this.config.ECS_CONTAINER_NAME,
        image: this.mrContainer.containerImage,
        memoryLimitMiB: this.config.ECS_CONTAINER_MEMORY,
        cpu: this.config.ECS_CONTAINER_CPU,
        environment: this.buildContainerEnv(props),
        startTimeout: Duration.minutes(1),
        stopTimeout: Duration.minutes(1),
        disableNetworking: false,
        logging: new AwsLogDriver({
          logGroup: this.logGroup,
          streamPrefix: this.config.CW_METRICS_NAMESPACE
        })
      }
    );

    // Setup autoscaling management for model runner
    this.buildAutoscaling(props);

    // Build a monitoring dashboard if enabled
    if (this.config.MR_ENABLE_MONITORING) {
      this.buildMonitoring(props);
    }

    // Build desired output sinks
    this.buildSink(props);
  }

  /**
   * Builds the container environment variables for the MR service.
   *
   * @param {MRDataplaneProps} props - The properties for configuring the MRDataplane Construct.
   * @returns {object} - The environment variables for the container.
   */
  private buildContainerEnv(props: MRDataplaneProps): {
    [key: string]: string;
  } {
    let containerEnv = {
      AWS_DEFAULT_REGION: props.account.region,
      DDB_TTL_IN_DAYS: this.config.DDB_TTL_IN_DAYS,
      JOB_TABLE: this.jobStatusTable.table.tableName,
      OUTSTANDING_JOBS_TABLE: this.outstandingImageJobsTable.table.tableName,
      FEATURE_TABLE: this.featureTable.table.tableName,
      ENDPOINT_TABLE: this.endpointStatisticsTable.table.tableName,
      REGION_REQUEST_TABLE: this.regionRequestTable.table.tableName,
      IMAGE_QUEUE: this.imageRequestQueue.queue.queueUrl,
      IMAGE_DLQ: this.imageRequestQueue.dlQueue.queueUrl,
      REGION_QUEUE: this.regionRequestQueue.queue.queueUrl,
      AWS_S3_ENDPOINT: this.regionalS3Endpoint,
      WORKERS_PER_CPU: this.config.MR_WORKERS_PER_CPU.toString(),
      WORKERS: this.workers,
      REGION_SIZE: this.config.MR_REGION_SIZE
    };

    if (this.config.MR_TERRAIN_URI != undefined) {
      containerEnv = Object.assign(containerEnv, {
        ELEVATION_DATA_LOCATION: this.config.MR_TERRAIN_URI
      });
    }

    if (this.imageStatusTopic != undefined) {
      containerEnv = Object.assign(containerEnv, {
        IMAGE_STATUS_TOPIC: this.imageStatusTopic.topicArn
      });
    }

    if (this.regionStatusTopic != undefined) {
      containerEnv = Object.assign(containerEnv, {
        REGION_STATUS_TOPIC: this.regionStatusTopic.topicArn
      });
    }

    return containerEnv;
  }

  /**
   * Builds the configured output sinks for the MR service.
   *
   * @param {MRDataplaneProps} props - The properties for configuring the MRDataplane Construct.
   */
  private buildSink(props: MRDataplaneProps): void {
    // Create a bucket to store results if deploySinkBucket is not explicitly set to false
    if (this.config.MR_ENABLE_S3_SINK) {
      this.sinkBucket = new OSMLBucket(this, `MRSinkBucket`, {
        bucketName: `${this.config.S3_SINK_BUCKET_PREFIX}-${props.account.id}`,
        prodLike: props.account.prodLike,
        removalPolicy: this.removalPolicy
      });
    }

    // Create a Kinesis stream to store results if deploySinkStream is not explicitly set to false
    if (this.config.MR_ENABLE_KINESIS_SINK) {
      this.sinkStream = new Stream(this, "MRSinkStream", {
        streamName: `${this.config.MR_KINESIS_SINK_STREAM_PREFIX}-${props.account.id}`,
        streamMode: StreamMode.PROVISIONED,
        shardCount: 1,
        encryption: StreamEncryption.MANAGED,
        removalPolicy: this.removalPolicy
      });

      // https://github.com/aws/aws-cdk/issues/19652
      if (props.account.isAdc) {
        const cfnStream = this.sinkStream.node.defaultChild as CfnStream;
        cfnStream.addPropertyDeletionOverride("StreamModeDetails");
      }
    }
  }

  /**
   * Builds a monitoring dashboard for the MR service if monitoring is enabled.
   *
   * @param {MRDataplaneProps} props - The properties for configuring the MRDataplane Construct.
   */
  private buildMonitoring(props: MRDataplaneProps): void {
    this.monitoring = new MRMonitoring(this, "MRMonitoring", {
      account: props.account,
      imageRequestQueue: this.imageRequestQueue.queue,
      regionRequestQueue: this.regionRequestQueue.queue,
      imageRequestDlQueue: this.imageRequestQueue.dlQueue,
      regionRequestDlQueue: this.regionRequestQueue.dlQueue,
      service: this.fargateService,
      mrDataplaneConfig: this.config
    });
  }

  /**
   * Sets up autoscaling management for the MR service.
   *
   * @param {MRDataplaneProps} props - The properties for configuring the MRDataplane Construct.
   */
  private buildAutoscaling(props: MRDataplaneProps): void {
    if (props.account.isAdc) {
      const regionQueueScalingAlarm = new Alarm(
        this,
        "RegionQueueScalingAlarm",
        {
          metric:
            this.regionRequestQueue.queue.metricApproximateNumberOfMessagesVisible(),
          evaluationPeriods: 1,
          threshold: 3
        }
      );

      NagSuppressions.addResourceSuppressions(
        this,
        [
          {
            id: "NIST.800.53.R5-CloudWatchAlarmAction",
            reason:
              "Lambda function monitors these alarms on a cron basis " +
              "rather than an event trigger to help scaling smoothness."
          }
        ],
        true
      );

      this.serviceAutoscaler = new EcsIsoServiceAutoscaler(
        this,
        "MRServiceAutoscaling",
        {
          role: this.taskRole,
          ecsCluster: this.cluster,
          ecsService: this.fargateService,
          minimumTaskCount: this.config.ECS_AUTOSCALING_TASK_MIN_COUNT,
          maximumTaskCount: this.config.ECS_AUTOSCALING_TASK_MAX_COUNT,
          scaleAlarm: regionQueueScalingAlarm,
          scaleOutIncrement: this.config.ECS_AUTOSCALING_TASK_OUT_INCREMENT,
          scaleInIncrement: this.config.ECS_AUTOSCALING_TASK_IN_INCREMENT,
          scaleOutCooldown: Duration.minutes(
            this.config.ECS_AUTOSCALING_TASK_OUT_COOLDOWN
          ),
          scaleInCooldown: Duration.minutes(
            this.config.ECS_AUTOSCALING_TASK_IN_COOLDOWN
          )
        }
      );
    } else {
      const mrServiceScaling = this.fargateService.autoScaleTaskCount({
        maxCapacity: this.config.ECS_AUTOSCALING_TASK_MAX_COUNT,
        minCapacity: this.config.ECS_AUTOSCALING_TASK_MIN_COUNT
      });

      mrServiceScaling.scaleOnMetric("MRRegionQueueScaling", {
        metric:
          this.regionRequestQueue.queue.metricApproximateNumberOfMessagesVisible(),
        scalingSteps: [
          { change: +3, lower: 1 },
          { change: +5, lower: 5 },
          { change: +8, lower: 20 },
          { change: +15, lower: 100 }
        ]
      });

      mrServiceScaling.scaleOnMetric("MRImageQueueScaling", {
        metric: this.imageRequestQueue.queue.metricNumberOfMessagesReceived({
          period: Duration.minutes(5),
          statistic: "sum"
        }),
        scalingSteps: [
          { change: -1, upper: 0 },
          { change: +1, lower: 1 }
        ],
        cooldown: Duration.minutes(1),
        evaluationPeriods: 3
      });
    }
  }

  /**
   * Sets up the initial configuration for the MRDataplane Construct.
   *
   * @param {MRDataplaneProps} props - The properties for configuring the MRDataplane Construct.
   */
  private setup(props: MRDataplaneProps): void {
    if (props.config != undefined) {
      this.config = props.config;
    } else {
      this.config = new MRDataplaneConfig();
    }

    this.removalPolicy = props.account.prodLike
      ? RemovalPolicy.RETAIN
      : RemovalPolicy.DESTROY;

    this.regionalS3Endpoint = RegionalConfig.getConfig(
      props.account.region
    ).s3Endpoint;

    this.workers = Math.ceil(
      (this.config.ECS_CONTAINER_CPU / 1024) * this.config.MR_WORKERS_PER_CPU
    ).toString();

    if (this.config.ECS_SECURITY_GROUP_ID) {
      this.securityGroups = [
        SecurityGroup.fromSecurityGroupId(
          this,
          "MRImportSecurityGroup",
          this.config.ECS_SECURITY_GROUP_ID
        )
      ];
    }

    if (this.config.ECS_TASK_ROLE_NAME != undefined) {
      this.taskRole = Role.fromRoleName(
        this,
        "ImportedMRECSTaskRole",
        this.config.ECS_TASK_ROLE_NAME,
        {
          mutable: false
        }
      );
    } else {
      this.taskRole = new MRTaskRole(this, "MRECSTaskRole", {
        account: props.account,
        roleName: "OSMLTaskRole"
      }).role;
    }

    if (this.config.ECS_EXECUTION_ROLE_NAME != undefined) {
      this.executionRole = Role.fromRoleName(
        this,
        "ImportedMRECSExecutionRole",
        this.config.ECS_EXECUTION_ROLE_NAME,
        {
          mutable: false
        }
      );
    } else {
      this.executionRole = new MRExecutionRole(this, "MRECSExecutionRole", {
        account: props.account,
        roleName: "MRECSExecutionRole"
      }).role;
    }

    // If the region status tracking feature is enabled
    if (this.config.MR_ENABLE_REGION_STATUS) {
      if (this.config.SNS_REGION_STATUS_TOPIC_ARN != undefined) {
        this.regionStatusTopic = Topic.fromTopicArn(
          this,
          "ImportedMRRegionStatusTopic",
          this.config.SNS_REGION_STATUS_TOPIC_ARN
        );
      } else {
        // Create a topic for region request status notifications
        this.regionStatusTopic = new OSMLTopic(this, "MRRegionStatusTopic", {
          topicName: this.config.SNS_REGION_STATUS_TOPIC
        }).topic;
      }

      // Create an SQS queue for region status processing updates
      this.regionStatusQueue = new OSMLQueue(this, "MRRegionStatusQueue", {
        queueName: this.config.SQS_REGION_STATUS_QUEUE
      });

      // Subscribe the region status topic to the queue
      this.regionStatusTopic.addSubscription(
        new SqsSubscription(this.regionStatusQueue.queue)
      );
    }

    // If the image tracking feature is enabled
    if (this.config.MR_ENABLE_IMAGE_STATUS) {
      if (this.config.SNS_IMAGE_STATUS_TOPIC_ARN != undefined) {
        this.imageStatusTopic = Topic.fromTopicArn(
          this,
          "ImportedMRImageStatusTopic",
          this.config.SNS_IMAGE_STATUS_TOPIC_ARN
        );
      } else {
        // Create a topic for image request status notifications
        this.imageStatusTopic = new OSMLTopic(this, "MRImageStatusTopic", {
          topicName: this.config.SNS_IMAGE_STATUS_TOPIC
        }).topic;
      }

      // Create an SQS queue for image processing status updates
      this.imageStatusQueue = new OSMLQueue(this, "MRImageStatusQueue", {
        queueName: this.config.SQS_IMAGE_STATUS_QUEUE
      });

      // Subscribe the image status topic to the queue
      this.imageStatusTopic.addSubscription(
        new SqsSubscription(this.imageStatusQueue.queue)
      );
    }
  }
}
