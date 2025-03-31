/*
 * Copyright 2023-2024 Amazon.com, Inc. or its affiliates.
 */

import { RemovalPolicy } from "aws-cdk-lib";
import {
  Attribute,
  BillingMode,
  Table,
  TableEncryption
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

/**
 * Represents the properties required to define the OSMLTable Construct.
 *
 * @interface OSMLTableProps
 */
export interface OSMLTableProps {
  /**
   * The name of the table.
   *
   * @type {string}
   */
  tableName: string;

  /**
   * The partition key attribute of the table.
   *
   * @type {Attribute}
   */
  partitionKey: Attribute;

  /**
   * The removal policy for the table when it is deleted or removed from the stack.
   *
   * @type {RemovalPolicy}
   */
  removalPolicy: RemovalPolicy;

  /**
   * (Optional) The sort key attribute of the table.
   *
   * @type {Attribute | undefined}
   */
  sortKey?: Attribute;

  /**
   * (Optional) The time-to-live (TTL) attribute of the table.
   *
   * @type {string | undefined}
   */
  ttlAttribute?: string;
}

/**
 * Represents an OSML DynamoDB Table construct.
 */
export class OSMLTable extends Construct {
  /**
   * The DynamoDB Table instance associated with this OSMLTable.
   */
  public table: Table;

  /**
   * Creates an OSML DynamoDB Table.
   *
   * @param {Construct} scope - The scope/stack in which to define this construct.
   * @param {string} id - The ID of this construct within the current scope.
   * @param {OSMLTableProps} props - The properties of this construct.
   * @returns {OSMLTable} - The OSMLTable construct.
   */
  constructor(scope: Construct, id: string, props: OSMLTableProps) {
    super(scope, id);

    /**
     * Initializes a new instance of the Table class with the provided properties.
     */
    this.table = new Table(this, id, {
      tableName: props.tableName,
      partitionKey: props.partitionKey,
      sortKey: props.sortKey,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      removalPolicy: props.removalPolicy,
      timeToLiveAttribute: props.ttlAttribute
    });
  }
}
