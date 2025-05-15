/*
 * Copyright 2023-2025 Amazon.com, Inc. or its affiliates.
 */

import {
  CfnEndpoint,
  CfnEndpointConfig,
  CfnModel
} from "aws-cdk-lib/aws-sagemaker";
import { Construct } from "constructs";

import { BaseConfig, ConfigType } from "../utils/base_config";

/**
 * Configuration class for MESMEndpoint Construct.
 */
export class MESMEndpointConfig extends BaseConfig {
  /**
   * The initial number of instances to run for the endpoint.
   * @default 1
   */
  public INITIAL_INSTANCE_COUNT: number;

  /**
   * The initial weight for the model variant when using traffic splitting.
   * @default 1
   */
  public INITIAL_VARIANT_WEIGHT: number;

  /**
   * The name of the model variant.
   * @default "AllTraffic"
   */
  public VARIANT_NAME: string;

  /**
   * The security group ID to associate with the endpoint.
   */
  public SECURITY_GROUP_ID: string;

  /**
   * A JSON object which includes ENV variables to be put into the model container.
   */
  public CONTAINER_ENV: Record<string, unknown>;

  /**
   * The repository access mode to use for the SageMaker endpoint container.
   */
  public REPOSITORY_ACCESS_MODE: string;
  /**
   * Creates an instance of MESMEndpointConfig.
   * @param config - The configuration object for MESMEndpoint.
   */
  constructor(config: ConfigType = {}) {
    super({
      INITIAL_INSTANCE_TYPE: 1,
      INITIAL_VARIANT_WEIGHT: 1,
      INITIAL_INSTANCE_COUNT: 1,
      VARIANT_NAME: "AllTraffic",
      REPOSITORY_ACCESS_MODE: "Platform",
      ...config
    });
  }
}

/**
 * Represents the properties required to configure an OSML model endpoint.
 *
 * @interface MESMEndpointProps
 */
export interface MESMEndpointProps {
  /**
   * The Amazon Resource Name (ARN) of the role that provides permissions for the endpoint.
   *
   * @type {string}
   */
  roleArn: string;

  /**
   * The URI of the Amazon Elastic Container Registry (ECR) container image.
   *
   * @type {string}
   */
  containerImageUri: string;

  /**
   * The name of the machine learning model.
   *
   * @type {string}
   */
  modelName: string;

  /**
   * The instance type for the endpoint.
   *
   * @type {string}
   */
  instanceType: string;

  /**
   * The instance type for the endpoint.
   *
   * @type {string}
   */
  subnetIds: string[];

  /**
   * (Optional) Configuration settings for MESMEndpoint resources.
   *
   * @type {MESMEndpointConfig}
   */
  config?: MESMEndpointConfig | MESMEndpointConfig[];
}

/**
 * Represents an AWS SageMaker endpoint for a specified model.
 */
export class MESMEndpoint extends Construct {
  /**
   * The SageMaker endpoint configuration.
   */
  public endpointConfig: CfnEndpointConfig;

  /**
   * The SageMaker endpoint.
   */
  public endpoint: CfnEndpoint;

  /**
   * The configuration for the MESMEndpoint.
   */
  public config: MESMEndpointConfig[];

  /**
   * Creates a SageMaker endpoint for the specified model.
   *
   * @param {Construct} scope - The scope/stack in which to define this construct.
   * @param {string} id - The id of this construct within the current scope.
   * @param {MESMEndpointProps} props - The properties of this construct.
   * @returns MESMEndpoint - The MESMEndpoint construct.
   */
  constructor(scope: Construct, id: string, props: MESMEndpointProps) {
    super(scope, id);

    // Check if a custom configuration was provided for the model container
    if (!props.config) {
      this.config = [new MESMEndpointConfig()];
    } else if (Array.isArray(props.config)) {
      this.config = props.config;
    } else {
      this.config = [props.config];
    }

    const models = this.config.map(
      (config) =>
        new CfnModel(this, `${id}-${config.VARIANT_NAME}`, {
          executionRoleArn: props.roleArn,
          containers: [
            {
              image: props.containerImageUri,
              environment: config.CONTAINER_ENV,
              imageConfig: {
                repositoryAccessMode:
                  config.REPOSITORY_ACCESS_MODE || "Platform"
              }
            }
          ],
          vpcConfig: {
            subnets: props.subnetIds,
            securityGroupIds: [config.SECURITY_GROUP_ID]
          }
        })
    );

    this.endpointConfig = new CfnEndpointConfig(this, `${id}-EndpointConfig`, {
      productionVariants: this.config.map((config, i) => ({
        initialInstanceCount: config.INITIAL_INSTANCE_COUNT,
        initialVariantWeight: config.INITIAL_VARIANT_WEIGHT,
        instanceType: props.instanceType,
        modelName: models[i].attrModelName,
        variantName: config.VARIANT_NAME
      })),
      tags: [
        { key: "Name", value: props.modelName },
        { key: "Timestamp", value: new Date().toISOString() }
      ]
    });

    this.endpoint = new CfnEndpoint(this, `${id}-Endpoint`, {
      endpointConfigName: this.endpointConfig.attrEndpointConfigName,
      endpointName: props.modelName
    });
  }
}
