/*
 * Copyright 2024-2025 Amazon.com, Inc. or its affiliates.
 */

import { App, Stack } from "aws-cdk-lib";

import { METestEndpoints, METestEndpointsConfig, OSMLVpc } from "../../../lib";
import { test_account } from "../../test_account";

describe("METestEndpoints constructor", () => {
  let app: App;
  let stack: Stack;
  let osmlVpc: OSMLVpc;
  let testEndpoints: METestEndpoints;

  describe("METestEndpoints", () => {
    beforeAll(() => {
      app = new App();
      stack = new Stack(app, "METestEndpointsStack");

      osmlVpc = new OSMLVpc(stack, "OSMLVpc", {
        account: test_account
      });

      testEndpoints = new METestEndpoints(stack, "METestEndpoints", {
        account: test_account,
        osmlVpc: osmlVpc,
        config: new METestEndpointsConfig({
          SECURITY_GROUP_ID: "test-security-group-id"
        })
      });
    });

    it("sets the removal policy correctly based on prodLike flag", () => {
      expect(testEndpoints.removalPolicy).toBeDefined();
    });

    it("check if the endpoints are being defined", () => {
      expect(testEndpoints.config).toBeDefined();
      expect(testEndpoints.centerPointModelEndpoint).toBeDefined();
      expect(testEndpoints.aircraftModelEndpoint).toBeDefined();
      expect(testEndpoints.floodModelEndpoint).toBeDefined();
      expect(testEndpoints.httpCenterpointModelEndpoint).toBeDefined();
      expect(testEndpoints.failureModelEndpoint).toBeDefined();
    });
  });
});
