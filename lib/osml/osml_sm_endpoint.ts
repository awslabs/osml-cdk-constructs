/*
 * Copyright 2023 Amazon.com, Inc. or its affiliates.
 */

import { IVpc, SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import {
  CfnEndpoint,
  CfnEndpointConfig,
  CfnModel
} from "aws-cdk-lib/aws-sagemaker";
import { Construct } from "constructs";

export interface OSMLSMEndpointProps {
  // sagemaker execution role arn to use for the model endpoint
  roleArn: string;
  // URI to the container image that contains the model
  modelContainer: string;
  //  name of the model to host on the endpoint on
  modelName: string;
  //  number of instances to start the endpoint with
  initialInstanceCount: number;
  //  weight of the variant to start the endpoint with (0-1)
  initialVariantWeight: number;
  //  instance type to start the endpoint with (e.g. ml.t2.medium)
  //  see https://aws.amazon.com/sagemaker/pricing/ for pricing information
  instanceType: string;
  //  name of the variant to host the model on (e.g. 'AllTraffic')
  variantName: string;
  // vpc model runner is running in
  vpc: IVpc;
  // security group to use for vpc models
  vpcSecurityGroup: SecurityGroup;
}

export class OSMLSMEndpoint extends Construct {
  public model: CfnModel;
  public endpointConfig: CfnEndpointConfig;
  public endpoint: CfnEndpoint;

  /**
   * Creates a SageMaker endpoint for the specified model.
   * @param scope the scope/stack in which to define this construct.
   * @param id the id of this construct within the current scope.
   * @param props the properties of this construct.
   * @returns the OSMLSMEndpoint construct.
   */
  constructor(scope: Construct, id: string, props: OSMLSMEndpointProps) {
    super(scope, id);
    const vpcSubnetSelection = props.vpc.selectSubnets({
      subnetType: SubnetType.PRIVATE_WITH_EGRESS
    });

    this.model = new CfnModel(this, id, {
      executionRoleArn: props.roleArn,
      containers: [
        {
          image: props.modelContainer,
          environment: {
            MODEL_SELECTION: props.modelName
          }
        }
      ],
      vpcConfig: {
        subnets: vpcSubnetSelection.subnetIds,
        securityGroupIds: [props.vpcSecurityGroup.securityGroupId]
      },
      primaryContainer: {
        imageConfig: {
          repositoryAccessMode: "Vpc"
        }
      }
    });

    // configure our SageMaker endpoint
    this.endpointConfig = new CfnEndpointConfig(this, `${id}-EndpointConfig`, {
      productionVariants: [
        {
          initialInstanceCount: props.initialInstanceCount,
          initialVariantWeight: props.initialVariantWeight,
          instanceType: props.instanceType,
          modelName: this.model.attrModelName,
          variantName: props.variantName
        }
      ]
    });

    // host a SageMaker endpoint on top of the imported centerPointModel
    this.endpoint = new CfnEndpoint(this, `${id}-Endpoint`, {
      endpointConfigName: this.endpointConfig.attrEndpointConfigName,
      endpointName: props.modelName
    });
  }
}
