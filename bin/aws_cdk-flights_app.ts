#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { ComputeStack } from '../lib/compute-stack';
import { AuthStack } from '../lib/auth-stack';
import { ApiStack } from '../lib/api-stack';
import { EventBridgeStack } from '../lib/eventbus-stack';
import { SesStack } from '../lib/ses-stack';

const app = new cdk.App();

const databaseStack = new DatabaseStack(app, "DatabaseStack");

const computeStack = new ComputeStack(app, "ComputeStack", {
  usersTable: databaseStack.usersTable,
  flightTable: databaseStack.flightsTable,
  seatsTable: databaseStack.seatsTable
});

const authStack = new AuthStack(app, "AuthStack", {
  addUserPostConfirmation: computeStack.addUserToUsersTableFunc,
})

const apiStack = new ApiStack(app, "ApiStack", {
  bookingLambdaIntegration: computeStack.bookingLambdaIntegration,
  userPool: authStack.userPool
});

const eventStack = new EventBridgeStack(app, "EventBridgeStack", {
  syncFlights: computeStack.syncFlightRuleFunc,
  registerBooking: computeStack.registerBookingFun,
  emailReceipt: computeStack.sendEmailFunc
});

const sesStack = new SesStack(app, "SESStack");
