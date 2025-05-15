/*
 * Copyright 2024-2025 Amazon.com, Inc. or its affiliates.
 */

import { App, Stack } from "aws-cdk-lib";

import { MRDataplane, MRDataplaneConfig, OSMLVpc } from "../../../lib";
import { test_account } from "../../test_account";

describe("MRDataplane constructor", () => {
  let app: App;
  let stack: Stack;
  let osmlVpc: OSMLVpc;
  let mrDataplane: MRDataplane;

  describe("MRDataplane", () => {
    beforeEach(() => {
      app = new App();
      stack = new Stack(app, "MRDataplaneStack");

      osmlVpc = new OSMLVpc(stack, "OSMLVpc", {
        account: test_account
      });

      mrDataplane = new MRDataplane(stack, "MRDataplane", {
        account: test_account,
        osmlVpc: osmlVpc,
        config: new MRDataplaneConfig({
          ECS_SECURITY_GROUP_ID: "test-security-group-id",
          MR_ENABLE_REGION_STATUS: true,
          MR_TERRAIN_URI: "test-terrain-uri"
        })
      });
    });

    it("check if correct resources are created", () => {
      expect(mrDataplane.removalPolicy).toBeDefined();
      expect(mrDataplane.featureTable).toBeDefined();
      expect(mrDataplane.jobStatusTable).toBeDefined();
      expect(mrDataplane.outstandingImageJobsTable).toBeDefined();
      expect(mrDataplane.regionRequestTable).toBeDefined();
      expect(mrDataplane.endpointStatisticsTable).toBeDefined();
      expect(mrDataplane.imageRequestQueue).toBeDefined();
      expect(mrDataplane.regionRequestQueue).toBeDefined();
      expect(mrDataplane.cluster).toBeDefined();
      expect(mrDataplane.fargateService).toBeDefined();
      expect(mrDataplane.config).toBeDefined();
    });
  });
});
