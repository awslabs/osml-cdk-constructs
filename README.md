# OSML CDK Constructs

This project demonstrates a CDK Construct Library which includes the constructs that make up the OversightML (OSML) solution's AWS infrastructure.

## Table of Contents

* [Useful commands](#useful-commands)
* [Components](#components)
    + [IAM Permissions / Roles](#iam-permissions-roles)
* [Working with AWS Cloud Infrastructure](#working-with-aws-cloud-infrastructurec)
* [Feature Flags](#feature-flags)
* [Support & Feedback](#support-feedback)
* [Security](#security)
* [License](#license)

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests

## Components

This package contains an assortment of CDK components that may be re-used and re-purposed for your own projects. These components are split into four groups:

1. `osml_*`: these are OversightML (osml) components. These create the OSML infrastructure for storing imagery, queueing jobs, setting up SageMaker endpoints, creating a VPC, and more.
2. `dc_*`: these are Data Catalog (dc) components. These create the Data Catalog infrastructure, enabling users to search and create SpatioTemporal Asset Catalogs (STAC) via API calls.
3. `di_*`: these are Data Intake (di) components. These create the Data Intake infrastructure, which is responsible for processing incoming data for OSML modules.
4. `mr_*`: these are Model Runner (mr) components. These create the Model Runner infrastructure, which is responsible for leveraging the user-provided AI model against images.
5. `me_*`: these are Model Endpoint (me) components. These create the Model Endpoint infrastructure, which is responsible for leveraging the user-provided AI models.
6. `ts_*`: these are Tile Server (ts) components. These create the Tile Server infrastructure for queuing jobs, lambda sweeper, and more.

To learn more about the CDK constructs and access their API, please visit our documentation page at [OSML CDK Constructs Documentation](https://awslabs.github.io/osml-cdk-constructs/) There, you'll find full in-depth documentation to help you get started with using the constructs in your own projects. You can follow or use our infrastructure setup by visiting OSML project, [Guidance for Processing Overhead Imagery](https://github.com/aws-solutions-library-samples/guidance-for-processing-overhead-imagery-on-aws).

### IAM Permissions / Roles

This CDK construct offers flexibility in role management, allowing you to pass through your custom roles to utilize Model Runner, Models, and/or Tile Server. By default, we have provided policies that can be easily integrated into your roles, enabling seamless access to these containers. This allows you to maintain control over role management and easily switch between different roles as needed.

## Working with AWS Cloud Infrastructure

This package is designed with flexibility in mind, taking dependencies only on AWS services and features that are widely available across most regions. Additionally, we’ve open-sourced this package to empower customers to customize these constructs to meet their specific needs and requirements. By open-sourcing the code, we’ve enabled customers to tailor the constructs to their unique environments, ensuring a perfect fit for their cloud infrastructure. If you need further assistance, please don’t hesitate to reach out to us through our [Issues](https://github.com/aws-solutions-library-samples/osml-cdk-constructs/issues) page.

## Feature Flags

By default, ModelRunner does not send status messages to SNS. To get status messages about the image processing status, set the `IMAGE_PROCESSING_STATUS` environment variable to the ARN of the SNS topic to send messages to.

## Support & Feedback

To post feedback, submit feature ideas, or report bugs, please use the [Issues](https://github.com/aws-solutions-library-samples/osml-cdk-constructs/issues) section of this GitHub repo.

If you are interested in contributing to OversightML Model Runner, see the [CONTRIBUTING](https://github.com/aws-solutions-library-samples/osml-cdk-constructs/tree/main/CONTRIBUTING.md) guide.

## Security

See [CONTRIBUTING](https://github.com/aws-solutions-library-samples/osml-cdk-constructs/tree/main/CONTRIBUTING.md#security-issue-notifications) for more information.

## License

MIT No Attribution Licensed. See [LICENSE](https://github.com/aws-solutions-library-samples/osml-cdk-constructs/tree/main/LICENSE).
